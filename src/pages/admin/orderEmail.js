// Correo de confirmación que recibe el cliente cuando el admin marca su pedido
// como Completado. Aquí se arma el HTML; Supabase solo lo envía por Resend
// (supabase/order-confirmation.sql), una vez por pedido.
import { escapeHtml as esc } from '../../utils/sanitize.js'
import { formatMoney } from '../../utils/format.js'
import { LOGO_URL } from './newsletterEmail.js'

const FONT = "Manrope, 'Helvetica Neue', Helvetica, Arial, sans-serif"
const TEXT = `font-family:${FONT};font-size:15px;line-height:22px;color:#3F444E;`

function orderItems(order) {
  try { return typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : (order.cart_items || []) } catch { return [] }
}

export function orderConfirmationEmail(order = {}, whatsapp = '') {
  const items = orderItems(order)
  const shortId = String(order.id || '').slice(0, 8)
  const firstName = String(order.customer_name || '').trim().split(/\s+/)[0] || ''
  const itemsTotal = items.reduce((a, i) => a + (Number(i?.price) || 0) * (Number(i?.qty) || 0), 0)
  const subtotal = order.subtotal != null ? Number(order.subtotal) : itemsTotal
  const discount = Number(order.discount) || 0
  const shipping = order.shipping_cost == null ? null : Number(order.shipping_cost) || 0
  const toPay = (Number(order.total) || 0) + (shipping || 0)
  const wa = `https://wa.me/${encodeURIComponent(whatsapp)}`

  const rows = items.map(i => {
    const qty = Number(i?.qty) || 0
    const variant = [i?.size ? `Talla ${esc(i.size)}` : '', i?.color ? esc(i.color) : ''].filter(Boolean).join(' · ')
    return `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #E6E8EC;${TEXT}"><strong style="color:#15171C;">${qty} × ${esc(i?.name) || 'Producto'}</strong>${variant ? `<br><span style="font-size:13px;color:#767B86;">${variant}</span>` : ''}</td>
      <td align="right" valign="top" style="padding:12px 0 12px 12px;border-bottom:1px solid #E6E8EC;white-space:nowrap;${TEXT}">${formatMoney((Number(i?.price) || 0) * qty)}</td>
    </tr>`
  }).join('')
  const line = (label, value, color = '#5B606B') => `<tr><td style="padding:4px 0;${TEXT}color:${color};">${label}</td><td align="right" style="padding:4px 0;white-space:nowrap;${TEXT}color:${color};">${value}</td></tr>`

  const subject = `Tu pedido #${shortId} está confirmado`
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap" rel="stylesheet">
<style>@media (min-width:621px){.gl-pad{padding-left:44px!important;padding-right:44px!important}}@media (max-width:620px){.gl-wrap{padding:16px 8px!important}.gl-title{font-size:30px!important;line-height:32px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#F5F6F8;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Recibimos tu pago. Aquí tienes el resumen de tu pedido #${esc(shortId)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F8;"><tr><td align="center" class="gl-wrap" style="padding:24px 8px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:4px;">
  <tr><td class="gl-pad" style="padding:32px 20px 0;"><a href="https://www.glboutique.com.mx" style="text-decoration:none;"><img src="${LOGO_URL}" width="116" height="65" alt="G&amp;L" style="display:block;border:0;border-radius:6px;margin-left:-8px;font-family:${FONT};font-size:26px;font-weight:800;color:#214FC7;"></a></td></tr>
  <tr><td class="gl-pad" style="padding:36px 20px 8px;">
    <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#214FC7;">Pedido #${esc(shortId)}</p>
    <h1 class="gl-title" style="margin:0 0 16px;font-family:${FONT};font-size:38px;line-height:40px;font-weight:800;letter-spacing:-1.5px;color:#15171C;">¡Gracias${firstName ? `, ${esc(firstName)}` : ''}! Tu pedido está confirmado.</h1>
    <p style="margin:0;${TEXT}font-size:16px;line-height:26px;">${order.address ? 'Ya estamos preparando tu envío. Te avisamos por WhatsApp cuando salga.' : 'Ya está apartado para ti. Te esperamos en tienda.'}</p>
  </td></tr>
  <tr><td class="gl-pad" style="padding:24px 20px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows || `<tr><td style="${TEXT}">Sin productos</td></tr>`}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
      ${line('Subtotal', formatMoney(subtotal))}
      ${discount > 0 ? line(`Descuento${order.coupon_code ? ` (${esc(order.coupon_code)})` : ''}`, `−${formatMoney(discount)}`, '#1E9E6A') : ''}
      ${shipping != null ? line('Envío', shipping > 0 ? formatMoney(shipping) : 'Gratis') : ''}
      <tr><td style="padding:12px 0 0;font-family:${FONT};font-size:18px;font-weight:800;color:#15171C;">Total</td><td align="right" style="padding:12px 0 0;font-family:${FONT};font-size:18px;font-weight:800;color:#15171C;white-space:nowrap;">${formatMoney(toPay)}</td></tr>
    </table>
  </td></tr>
  <tr><td class="gl-pad" style="padding:28px 20px 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F8;border-radius:8px;"><tr><td style="padding:16px 18px;">
      <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#767B86;">${order.address ? 'Se envía a' : 'Entrega'}</p>
      <p style="margin:0;${TEXT}">${order.address ? esc(order.address) : esc(order.delivery_method) || 'Recoger en tienda'}</p>
      ${order.payment_method ? `<p style="margin:8px 0 0;${TEXT}font-size:13px;color:#767B86;">Pago: ${esc(order.payment_method)}</p>` : ''}
    </td></tr></table>
  </td></tr>
  <tr><td class="gl-pad" style="padding:24px 20px 32px;border-top:1px solid #E6E8EC;font-family:${FONT};font-size:12px;line-height:19px;color:#5B606B;">
    ¿Dudas o cambios? Escríbenos por <a href="${wa}" style="color:#214FC7;">WhatsApp</a> o responde a este correo.<br>
    Recibes este correo porque hiciste un pedido en glboutique.com.mx.
  </td></tr>
</table>
</td></tr></table>
</body></html>`
  return { subject, html }
}
