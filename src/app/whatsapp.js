import { STORE_WHATSAPP_NUMBER } from './config.js'
import { formatMoney } from './format.js'

export function buildOrderMessage({ customer, cartLines, subtotal, discount, couponCode, total }) {
  const lines = []
  lines.push('🛒 G&L - Nuevo pedido')
  lines.push('')
  lines.push(`👤 Cliente: ${customer.name}`)
  lines.push(`📱 WhatsApp: ${customer.whatsapp}`)
  lines.push(`💳 Pago: ${customer.paymentMethod}`)
  lines.push(`🚚 Entrega: ${customer.deliveryMethod}`)
  if (customer.address) lines.push(`📍 Dirección: ${customer.address}`)
  lines.push('')
  lines.push('📦 Productos:')

  for (const line of cartLines) {
    const variant = [
      line.size ? `Talla ${line.size}` : null,
      line.color ? `Color ${line.color}` : null,
    ]
      .filter(Boolean)
      .join(' | ')

    const left = `${line.qty} x ${line.name}`
    const mid = variant ? ` (${variant})` : ''
    const right = `${formatMoney(line.price)} = ${formatMoney(line.subtotal)}`

    lines.push(`  • ${left}${mid} — ${right}`)
  }

  lines.push('')
  if (subtotal && subtotal !== total) {
    lines.push(`Subtotal: ${formatMoney(subtotal)}`)
  }
  if (couponCode && discount > 0) {
    lines.push(`🏷️ Cupón: ${couponCode} (-${formatMoney(discount)})`)
  }
  lines.push(`💰 Total: ${formatMoney(total)}`)
  return lines.join('\n')
}

export function openWhatsAppWithMessage(message) {
  const encoded = encodeURIComponent(message)
  const url = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encoded}`
  window.location.assign(url)
}
