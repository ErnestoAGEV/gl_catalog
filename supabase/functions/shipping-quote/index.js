import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildPackage, pickTiers, localTiers, cartKey, isMxZip, MX_STATES } from '../_shared/shipping.js'
import { rateCarrier } from '../_shared/envia.js'

const ORIGINS = ['https://www.glboutique.com.mx', 'https://glboutique.com.mx', 'http://localhost:5173']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const db = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

const corsFor = (req) => {
  const o = req.headers.get('origin')
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

// Nunca devolver `cost` al navegador.
const pub = (t) => t && { carrier: t.carrier, service: t.service, price: t.price, days: t.days }

Deno.serve(async (req) => {
  const cors = corsFor(req)
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  let body
  try { body = await req.json() } catch { return json({ error: 'json' }, 400) }
  const { zipCode, state, city, items } = body ?? {}
  const validItems = Array.isArray(items) && items.length >= 1 && items.length <= 50 &&
    items.every((i) => i && typeof i.productId === 'string' && UUID.test(i.productId) && Number.isInteger(i.qty) && i.qty >= 1 && i.qty <= 50)
  if (!validItems) return json({ error: 'body' }, 400)
  const zip = typeof zipCode === 'string' ? zipCode.trim().slice(0, 10) : ''

  // Topes atómicos (rate_events) antes de tocar Envia; cuentan también los fallbacks.
  // IP verificada en el runtime de Edge (V-3): cf-connecting-ip, luego x-real-ip, luego último XFF (el primero lo controla el cliente).
  // Sin IP → '' y SQL la trata como 'unknown' (pasa; el tope global sigue aplicando).
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? (req.headers.get('x-forwarded-for') ?? '').split(',').pop().trim()
  const perIp = await db.rpc('rate_check_ip', { p_name: 'quote_ip', p_ip: ip })
  if (perIp.error || perIp.data !== true) return json({ error: 'rate_limited' }, 429)
  const global = await db.rpc('rate_check', { p_name: 'quote_global', p_key: '*' })
  if (global.error || global.data !== true) return json({ error: 'rate_limited' }, 429)

  try {
    if (!isMxZip(zip) || typeof city !== 'string' || !MX_STATES.some((s) => s.code === state)) return json({ fallback: true })

    const key = cartKey(items)
    const now = Date.now()
    const ids = [...new Set(items.map((i) => i.productId))]
    const [prods, sets, ws, cached] = await Promise.all([
      db.from('products').select('id, type').in('id', ids),
      db.from('shipping_settings').select('*').eq('id', 1).single(),
      db.from('shipping_category_weights').select('category, grams, needs_box'),
      // Caché: misma cotización reciente (≥20 min de vida para que place_order la acepte) → sin Envia ni insert.
      db.from('shipping_quotes').select('id, standard, express')
        .eq('zip', zip).eq('cart_key', key).not('standard', 'is', null)
        .gt('created_at', new Date(now - 10 * 60_000).toISOString())
        .gt('expires_at', new Date(now + 20 * 60_000).toISOString())
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    const settings = sets.data
    if (prods.error || sets.error || ws.error || !settings) return json({ fallback: true })
    if (cached.data) return json({ quoteId: cached.data.id, standard: pub(cached.data.standard), express: pub(cached.data.express), freeShippingMin: settings.free_shipping_min })
    const typeOf = Object.fromEntries(prods.data.map((p) => [p.id, p.type]))
    if (ids.some((id) => !(id in typeOf))) return json({ fallback: true })
    const weights = Object.fromEntries(ws.data.map((w) => [w.category, w]))

    const pkg = buildPackage(items.map((i) => ({ type: typeOf[i.productId], qty: i.qty })), weights, settings)
    // Entrega local: la hace la tienda, no importa si el paquete cabe en Envia.
    const local = localTiers(settings, zip)
    if (!pkg && !local) return json({ fallback: true })

    let tiers = local
    if (!tiers) {
    const baseUrl = Deno.env.get('ENVIA_BASE_URL'), apiKey = Deno.env.get('ENVIA_API_KEY')
    if (!baseUrl || !apiKey) return json({ fallback: true })
    // Envia exige estos campos en destino; solo conocemos CP/estado/ciudad (la etiqueta real se genera después con la dirección completa).
    const destination = { name: 'Cliente', phone: '0000000000', street: 'Conocida', city: city.slice(0, 60), state, postalCode: zip }
    const results = await Promise.allSettled(settings.carriers.map((carrier) =>
      rateCarrier({ baseUrl, apiKey, carrier, origin: settings.origin, destination, pkg })))
    results.forEach((r) => r.status === 'rejected' && console.error('envia', r.reason?.message))
    const rates = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))

    tiers = pickTiers(rates)
    if (!tiers) return json({ fallback: true })
    }

    const { data: row, error } = await db.from('shipping_quotes')
      .insert({ zip, cart_key: key, package: pkg, standard: tiers.standard, express: tiers.express }).select('id').single()
    if (error || !row) return json({ fallback: true })
    return json({ quoteId: row.id, standard: pub(tiers.standard), express: pub(tiers.express), freeShippingMin: settings.free_shipping_min })
  } catch (e) {
    console.error('shipping-quote', e?.message)
    return json({ fallback: true })
  }
})
