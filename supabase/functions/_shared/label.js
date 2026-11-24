// Lógica pura de guías de Envia (pedido -> guía). Sin APIs de Deno/Node/DOM a nivel de módulo:
// la importan la Edge Function shipping-label y las pruebas en Node.
import { buildPackage, pickTiers, MX_STATES } from './shipping.js'

const NOT_CONFIGURED = { error: 'Las guías no están configuradas.' }
const LABEL_HOSTS = { 'api-test.envia.com': true, 'api.envia.com': false } // host -> sandbox

// Solo los secretos LABEL; nunca cae a ENVIA_BASE_URL/ENVIA_API_KEY (los de cotizar, de producción).
export function labelConfig(env) {
  const raw = String(env?.ENVIA_LABEL_BASE_URL ?? '').trim()
  const apiKey = String(env?.ENVIA_LABEL_API_KEY ?? '').trim()
  if (!raw || !apiKey) return NOT_CONFIGURED
  let url
  try { url = new URL(raw) } catch { return NOT_CONFIGURED }
  if (url.protocol !== 'https:' || !(url.host in LABEL_HOSTS)) return NOT_CONFIGURED
  return { baseUrl: url.origin, apiKey, sandbox: LABEL_HOSTS[url.host] }
}

export const orderRef = (orderId) => 'GL-' + String(orderId).slice(0, 8)
export const REVIEW_MSG = (ref) => `No supimos si Envia creó la guía. Revisa en tu panel de Envia con la referencia ${ref} antes de volver a intentar.`

export function labelEligibility(order) {
  if (order.delivery_method !== 'Envío a domicilio') return 'Este pedido no es envío a domicilio.'
  if (order.shipping_carrier === 'local') return 'Entrega local — la llevan ustedes.'
  if (order.status === 'cancelado') return 'El pedido está cancelado.'
  if (order.label_status === 'generating' || order.label_status === 'review') return REVIEW_MSG(orderRef(order.id))
  if (order.label_tracking || order.label_status === 'generated') return 'Este pedido ya tiene guía.'
  return null
}

const clean = (v) => String(v ?? '').replace(/[<>]/g, '').trim()
// [campo, mínimo, máximo, mensaje]
const ADDRESS_RULES = [
  ['street', 1, 100, 'Revisa la calle.'],
  ['numExt', 1, 20, 'Revisa el número exterior.'],
  ['numInt', 0, 20, 'Revisa el número interior.'],
  ['neighborhood', 1, 100, 'Revisa la colonia.'],
  ['city', 1, 60, 'Revisa la ciudad.'],
  ['references', 0, 200, 'Revisa las referencias.'],
]

export function validateAddress(parts) {
  if (!parts || typeof parts !== 'object') return { ok: false, error: 'Captura la dirección del cliente.' }
  const address = {}
  for (const [key, min, max, error] of ADDRESS_RULES) {
    address[key] = clean(parts[key])
    if (address[key].length < min || address[key].length > max) return { ok: false, error }
  }
  const state = clean(parts.state)
  if (!state) return { ok: false, error: 'Este pedido es fuera de México. Genera la guía en el panel de Envia.' }
  const st = MX_STATES.find((s) => s.code === state)
  if (!st) return { ok: false, error: 'Elige el estado.' }
  const zip = clean(parts.zip)
  if (!/^\d{5}$/.test(zip)) return { ok: false, error: 'El código postal debe tener 5 dígitos.' }
  return { ok: true, address: { ...address, state, stateName: st.name, zip } }
}

// Misma regla que phoneKey() de src/utils/phone.js (no se importa: la Edge Function no ve src/).
export function receiverPhone(whatsapp) {
  const digits = String(whatsapp || '').replace(/\D/g, '').replace(/^00/, '')
  const key = /^04[45]\d{10}$/.test(digits) || /^521\d{10}$/.test(digits) ? digits.slice(3)
    : /^52\d{10}$/.test(digits) ? digits.slice(2) : digits
  return /^\d{10}$/.test(key) ? key : null
}

export function senderError(origin) {
  if (!/^\d{10}$/.test(String(origin?.phone ?? ''))) return 'Falta el teléfono del remitente. Llénalo en Admin → Envíos.'
  if (!origin.street || !origin.city || !origin.postalCode) return 'Completa la dirección del remitente en Admin → Envíos.'
  return null
}

const TOO_HEAVY = 'Pesa más de lo que aguanta la caja. Genera esta guía en el panel de Envia.'

export function packageFor(items, weights, settings, kind) {
  if (!kind) {
    const pkg = buildPackage(items, weights, settings)
    return pkg ? { pkg } : { error: TOO_HEAVY }
  }
  if (kind !== 'envelope' && kind !== 'box') return { error: 'Elige sobre o caja.' }
  // Mismos gramos que buildPackage: sin tope de caja nunca regresa null.
  const { grams } = buildPackage(items, weights, { ...settings, box: { ...settings.box, max_grams: Infinity } })
  const dims = settings[kind]
  if (kind === 'envelope' && grams > dims.max_grams) return { error: `Pesa ${grams} g: no cabe en sobre. Usa caja.` }
  if (grams > settings.box.max_grams) return { error: TOO_HEAVY }
  return { pkg: { kind, grams, length: dims.length, width: dims.width, height: dims.height } }
}

// Opción preseleccionada: la del tier que eligió el cliente con su paquetería; índice en `options`.
export function defaultOption(options, { carrier, tier }) {
  if (!options.length) return -1
  const all = options.map((o, i) => ({ ...o, price: o.cost, i }))
  const pick = (list) => (list.length && tier ? pickTiers(list)[tier]?.i : undefined)
  const i = pick(all.filter((o) => o.carrier === carrier)) ?? pick(all)
  if (i !== undefined) return i
  return all.reduce((a, b) => (b.cost < a.cost ? b : a)).i
}

export function checkRequote(options, { serviceCode, expectedCost }, fmt) {
  const option = options.find((o) => o.serviceCode === serviceCode)
  if (!option) return { error: 'Esa opción ya no está disponible. Vuelve a ver las opciones.' }
  if (option.cost > expectedCost + 1) return { error: `El precio cambió a ${fmt(option.cost)}. Vuelve a ver las opciones.` }
  return { option }
}

export function costNote(cost, paid, free, fmt) {
  if (paid == null) return 'Este pedido no tiene costo de envío registrado.'
  if (free && paid > 0) return `Envío gratis con Express: el cliente pagó ${fmt(paid)} de diferencia y la tienda pone ${fmt(cost - paid)}.`
  if (free) return `El cliente tuvo envío gratis: la guía la paga la tienda (${fmt(cost)}).`
  if (cost > paid) return `Esta guía cuesta ${fmt(cost - paid)} más de lo que pagó el cliente.`
  return null
}

// Secuencia contra doble cargo (Decisión 4 del plan). Solo se llama a Envia con el pedido apartado;
// si no se sabe si Envia cobró, el pedido queda en revisión y nunca se libera solo.
export async function runGenerate({ ref, lock, build, send, save, unlock, markReview }) {
  const attempt = async (fn, what) => {
    try { await fn() } catch (e) { console.error(`${ref} ${what} falló: ${e?.message}`) }
  }
  let locked
  try { locked = await lock() } catch { return { error: 'No se pudo apartar el pedido. Intenta de nuevo.' } }
  if (!locked) return { error: 'Este pedido ya tiene guía o se está generando.' }

  let body
  try { body = build() } catch {
    await attempt(unlock, 'unlock')
    return { error: 'No se pudo preparar la guía. Intenta de nuevo.' }
  }

  let res
  try { res = await send(body) } catch { res = { kind: 'unknown' } }
  if (res?.kind === 'rejected') {
    await attempt(unlock, 'unlock')
    return { error: res.message }
  }
  if (res?.kind !== 'ok') {
    await attempt(() => markReview(res?.trackingNumber ?? null), 'markReview')
    return { error: REVIEW_MSG(ref), review: true }
  }

  for (let i = 0; i < 2; i++) {
    try { await save(res.label); return { label: res.label, saved: true } } catch (e) {
      console.error(`${ref} save falló (intento ${i + 1}): ${e?.message}`)
    }
  }
  return { label: res.label, saved: false }
}
