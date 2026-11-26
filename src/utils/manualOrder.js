// Pedidos manuales (WhatsApp) desde el admin: logica pura, sin red ni DOM.
import { isValidWhatsapp } from './phone.js'
import { chargeFor } from '../../supabase/functions/_shared/shipping.js'

const ENVIO = 'Envío a domicilio'
const MAX_SHIPPING = 10000

const isHome = (form) => form.deliveryMethod === ENVIO
const text = (v) => String(v ?? '').trim()
// Campo vacio = sin costo capturado (null), no 0
const costOf = (form) => (text(form.shippingCost) === '' ? null : Number(form.shippingCost))

export function validateManualOrder(form) {
  const errors = []
  if (text(form.name).length < 3) errors.push('Escribe el nombre del cliente.')
  if (!isValidWhatsapp(form.whatsapp)) errors.push('El WhatsApp no parece válido.')
  if (!form.items?.length) errors.push('Agrega al menos un producto.')
  if (isHome(form)) {
    const a = form.address || {}
    if (!['street', 'numExt', 'neighborhood', 'city', 'stateName', 'zip'].every((k) => text(a[k]))) {
      errors.push('Completa la dirección de envío.')
    }
    const c = costOf(form)
    if (c != null && !(c >= 0 && c <= MAX_SHIPPING)) errors.push('El costo de envío debe estar entre 0 y 10,000.')
  }
  return errors
}

function fullAddress(a) {
  const ref = text(a.references)
  return `${text(a.street)} #${text(a.numExt)}${text(a.numInt) ? ' Int. ' + text(a.numInt) : ''}, Col. ${text(a.neighborhood)}, ${text(a.city)}, ${text(a.stateName)}, C.P. ${text(a.zip)}${ref ? ' | Ref: ' + ref : ''}`
}

export function toRpcArgs(form) {
  const home = isHome(form)
  const quoteId = home ? form.quote?.quoteId || null : null
  // Con cotizacion y sin editar, el costo lo cobra la base (respeta envio gratis).
  const sendCost = home && (form.costEdited || !quoteId) && costOf(form) != null
  return {
    p_customer_name: text(form.name),
    p_customer_whatsapp: text(form.whatsapp),
    p_payment_method: form.paymentMethod,
    p_delivery_method: form.deliveryMethod,
    p_address: home ? fullAddress(form.address) : null,
    p_items: form.items.map(({ productId, size, color, qty }) => ({ productId, size, color, qty })),
    p_coupon_code: text(form.couponCode) || null,
    p_customer_email: text(form.email) || null,
    p_shipping_quote_id: quoteId,
    p_shipping_tier: quoteId ? form.tier : null,
    p_address_parts: home ? Object.fromEntries(Object.entries(form.address).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) : null,
    p_shipping_cost: sendCost ? costOf(form) : null,
    p_local: home && !!form.local,
    p_status: form.status || null,
  }
}

// El precio de product ya trae la promocion; el cupon se previsualiza aparte.
export function previewTotals(form, products) {
  const byId = new Map(products.map((p) => [String(p.id), p]))
  const subtotal = form.items.reduce((acc, i) => acc + (Number(byId.get(String(i.productId))?.price) || 0) * (Number(i.qty) || 0), 0)
  const shipping = isHome(form) ? costOf(form) || 0 : 0
  return { subtotal, shipping, total: subtotal + shipping }
}

export function pickQuoteTier(quote, tier, free = false) {
  const t = quote?.[tier]
  if (!t) return null
  return { cost: chargeFor(quote, tier, free), local: t.carrier === 'local' }
}

export function isSuccessful(status) {
  const s = (status || '').toLowerCase()
  return s === 'completado' || s === 'pagado' || s === 'enviado'
}

export function shouldSendConfirmation(order, newStatus) {
  return newStatus === 'completado' && order.channel !== 'whatsapp' && !!order.customer_email && !order.confirmation_sent_at
}

export function channelBreakdown(orders) {
  const out = { web: { count: 0, revenue: 0 }, whatsapp: { count: 0, revenue: 0 } }
  for (const o of orders) {
    if ((o.status || '').toLowerCase() === 'cancelado') continue
    const c = out[o.channel === 'whatsapp' ? 'whatsapp' : 'web']
    c.count++
    if (isSuccessful(o.status)) c.revenue += Number(o.total) || 0
  }
  return out
}
