import { createClient } from 'npm:@supabase/supabase-js@2'
import { isFreeShipping } from '../_shared/shipping.js'
import { rateCarrier, buildLabelRequest, generateLabel, rejectLog } from '../_shared/envia.js'
import {
  labelConfig, orderRef, labelEligibility, validateAddress, receiverPhone, senderError,
  packageFor, defaultOption, checkRequote, runGenerate,
} from '../_shared/label.js'

const ORIGINS = ['https://www.glboutique.com.mx', 'https://glboutique.com.mx', 'http://localhost:5173']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MODES = ['rates', 'generate', 'release']
const ORDER_COLS = 'id, status, delivery_method, shipping_carrier, shipping_tier, shipping_cost, subtotal, coupon_code, customer_name, customer_whatsapp, customer_email, address_parts, cart_items, label_status, label_tracking'
const LABEL_CLEARED = {
  label_status: null, label_locked_at: null, label_tracking: null, label_track_url: null, label_url: null,
  label_carrier: null, label_service: null, label_cost: null, label_created_at: null, label_sandbox: false,
}

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

const fmtMXN = (n) => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 })
// supabase-js no lanza: convertir { error } en excepción para runGenerate.
const must = ({ data, error }) => { if (error) throw new Error(error.message); return data }
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function validBody(b) {
  if (!isObj(b) || !MODES.includes(b.mode) || typeof b.orderId !== 'string' || !UUID.test(b.orderId)) return false
  if (b.kind !== undefined && b.kind !== 'envelope' && b.kind !== 'box') return false
  if (b.address != null && !isObj(b.address)) return false
  if (b.confirmGenerated !== undefined && typeof b.confirmGenerated !== 'boolean') return false
  if (b.mode === 'generate') {
    // La paquetería se valida contra settings.carriers al cargar los ajustes.
    if (typeof b.carrier !== 'string' || typeof b.serviceCode !== 'string' || !/^[\w.-]{1,60}$/.test(b.serviceCode)) return false
    if (typeof b.expectedCost !== 'number' || !Number.isFinite(b.expectedCost) || b.expectedCost < 0) return false
  }
  return true
}

const toOption = (r) => ({ carrier: r.carrier, service: r.service, serviceCode: r.serviceCode, cost: r.price, days: r.days })

// Liberar una guía ya generada (pagada) solo con confirmación explícita.
async function release(orderId, confirmGenerated) {
  const stale = new Date(Date.now() - 120_000).toISOString()
  const generated = confirmGenerated === true ? 'label_status.eq.generated,' : ''
  const rows = must(await db.from('orders').update(LABEL_CLEARED)
    .eq('id', orderId)
    .or(`label_status.eq.review,${generated}and(label_status.eq.generating,label_locked_at.lt.${stale})`)
    .select('id'))
  return rows.length ? { ok: true } : { error: 'No hay nada que liberar en este pedido.' }
}

// Flujo común de rates/generate. Regresa { error, ... } o el contexto para seguir.
async function prepare(body) {
  const cfg = labelConfig(Deno.env.toObject())
  if (cfg.error) return { out: cfg }

  const order = must(await db.from('orders').select(ORDER_COLS).eq('id', body.orderId).maybeSingle())
  if (!order) return { out: { error: 'No encontramos el pedido.' } }
  const ineligible = labelEligibility(order)
  if (ineligible) return { out: { error: ineligible } }

  const [settings, ws] = await Promise.all([
    db.from('shipping_settings').select('*').eq('id', 1).single().then(must),
    db.from('shipping_category_weights').select('category, grams, needs_box').then(must),
  ])
  if (body.mode === 'generate' && !settings.carriers?.includes(body.carrier)) return { bad: true }
  const weights = Object.fromEntries(ws.map((w) => [w.category, w]))

  const sender = senderError(settings.origin)
  if (sender) return { out: { error: sender } }
  const v = validateAddress(body.address ?? order.address_parts)
  if (!v.ok) return { out: { error: v.error, addressError: true } }
  const phone = cfg.sandbox ? settings.origin.phone : receiverPhone(order.customer_whatsapp)
  if (!phone) return { out: { error: 'El WhatsApp del cliente no es un número de México de 10 dígitos. Genera esta guía en el panel de Envia.' } }
  const p = packageFor(Array.isArray(order.cart_items) ? order.cart_items : [], weights, settings, body.kind)
  if (p.error) return { out: { error: p.error } }

  const a = v.address
  const destination = {
    name: String(order.customer_name ?? '').slice(0, 60), phone,
    ...(!cfg.sandbox && order.customer_email ? { email: order.customer_email } : {}),
    street: a.street, number: a.numExt + (a.numInt ? ' Int. ' + a.numInt : ''), district: a.neighborhood,
    city: a.city, state: a.state, postalCode: a.zip, reference: a.references,
  }
  return { cfg, order, settings, address: a, destination, pkg: p.pkg, ref: orderRef(order.id) }
}

async function rates(ctx) {
  const { cfg, order, settings, destination, pkg, ref } = ctx
  // Cada llamada es de una paquetería: se marca con el slug de settings, no con lo que regrese Envia.
  const results = await Promise.allSettled(settings.carriers.map(async (carrier) =>
    (await rateCarrier({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, carrier, origin: settings.origin, destination, pkg })).map((r) => ({ ...toOption(r), carrier }))))
  results.forEach((r, i) => r.status === 'rejected' && console.error('shipping-label', ref, settings.carriers[i], r.reason?.message))
  const options = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])).sort((x, y) => x.cost - y.cost)
  if (!options.length) return { error: 'Envia no regresó opciones para este paquete. Intenta de nuevo o usa el panel de Envia.' }

  let coupon = null
  if (order.coupon_code) coupon = must(await db.from('coupons').select('free_shipping').eq('code', order.coupon_code).maybeSingle())
  return {
    options,
    defaultIndex: defaultOption(options, { carrier: order.shipping_carrier, tier: order.shipping_tier }),
    package: { kind: pkg.kind, grams: pkg.grams },
    paid: order.shipping_cost == null ? null : Number(order.shipping_cost),
    free: isFreeShipping(Number(order.subtotal), { freeShipping: coupon?.free_shipping }, Number(settings.free_shipping_min)),
    sandbox: cfg.sandbox,
    address: ctx.address,
  }
}

async function generate(ctx, body) {
  const { cfg, order, settings, address, destination, pkg, ref } = ctx
  const { carrier } = body
  let options
  try {
    options = (await rateCarrier({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, carrier, origin: settings.origin, destination, pkg })).map((r) => ({ ...toOption(r), carrier }))
  } catch (e) {
    console.error('shipping-label', ref, carrier, e?.message)
    return { error: 'No se pudo recotizar con Envia. Intenta de nuevo.' }
  }
  const rq = checkRequote(options, body, fmtMXN)
  if (rq.error) return rq
  const { option } = rq
  const id = order.id
  const orders = () => db.from('orders')
  const lockedAt = new Date().toISOString()
  const markReview = async (t) => { must(await orders().update({ label_status: 'review', label_tracking: t }).eq('id', id)) }

  const r = await runGenerate({
    ref,
    lock: async () => must(await orders().update({ label_status: 'generating', label_locked_at: lockedAt })
      .eq('id', id).is('label_status', null).is('label_tracking', null).or('status.is.null,status.neq.cancelado').select('id')).length === 1,
    build: () => buildLabelRequest({ origin: settings.origin, destination, pkg, carrier, serviceCode: option.serviceCode, printSize: settings.label_print_size, orderRef: ref }),
    send: async (req) => {
      const res = await generateLabel({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, body: req })
      if (res.kind !== 'ok' && res.status !== undefined) console.error('shipping-label', ref, carrier, res.kind, rejectLog(res.status, res.json))
      return res
    },
    save: async (label) => {
      const rows = must(await orders().update({
        label_status: 'generated', label_tracking: label.trackingNumber, label_track_url: label.trackUrl, label_url: label.labelUrl,
        label_carrier: carrier, label_service: option.service, label_cost: label.cost ?? option.cost,
        label_created_at: new Date().toISOString(), label_sandbox: cfg.sandbox, address_parts: address,
      }).eq('id', id).eq('label_status', 'generating').eq('label_locked_at', lockedAt).select('id'))
      if (rows.length !== 1) throw new Error('save: 0 filas')
    },
    unlock: async () => { must(await orders().update({ label_status: null, label_locked_at: null }).eq('id', id).eq('label_status', 'generating').eq('label_locked_at', lockedAt)) },
    markReview,
  })
  if (!r.label) return r
  const l = r.label
  // Guía comprada pero no guardada: dejar el rastreo en revisión para que liberar sea deliberado.
  if (!r.saved) await markReview(l.trackingNumber).catch((e) => console.error('shipping-label', ref, 'markReview falló:', e?.message))
  return {
    label: { tracking: l.trackingNumber, trackUrl: l.trackUrl, url: l.labelUrl, carrier, service: option.service, cost: l.cost ?? option.cost, sandbox: cfg.sandbox },
    saved: r.saved,
  }
}

Deno.serve(async (req) => {
  const cors = corsFor(req)
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /i, '')
  const { data: auth, error: authErr } = token ? await db.auth.getUser(token) : { data: null, error: true }
  if (authErr || !auth?.user) return json({ error: 'auth' }, 401)
  // Plan de seguridad: aquí cambiará a is_admin() + aal2.
  const { data: admin, error: adminErr } = await db.from('admin_users').select('user_id').eq('user_id', auth.user.id).maybeSingle()
  if (adminErr || !admin) return json({ error: 'forbidden' }, 403)

  let body
  try { body = await req.json() } catch { return json({ error: 'body' }, 400) }
  if (!validBody(body)) return json({ error: 'body' }, 400)

  try {
    if (body.mode === 'release') return json(await release(body.orderId, body.confirmGenerated))
    const ctx = await prepare(body)
    if (ctx.bad) return json({ error: 'body' }, 400)
    if (ctx.out) return json(ctx.out)
    return json(body.mode === 'rates' ? await rates(ctx) : await generate(ctx, body))
  } catch (e) {
    console.error('shipping-label', orderRef(body.orderId), body.mode, e?.message)
    return json({ error: 'Algo falló. Intenta de nuevo.' })
  }
})
