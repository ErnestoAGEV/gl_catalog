import { STORE_WHATSAPP_NUMBER } from './config.js'
import { formatMoney } from './format.js'

export function buildOrderMessage({ customer, cartLines, subtotal, discount, couponCode, total }) {
  const lines = []
  
  // Header
  lines.push('*NUEVO PEDIDO G&L*')
  lines.push('')
  
  // Customer info
  lines.push('*DATOS DEL CLIENTE*')
  lines.push(`Nombre: ${customer.name}`)
  lines.push(`WhatsApp: ${customer.whatsapp}`)
  lines.push(`Pago: ${customer.paymentMethod}`)
  lines.push(`Entrega: ${customer.deliveryMethod}`)
  
  if (customer.address) {
    lines.push('')
    lines.push('*DIRECCION DE ENVIO*')
    lines.push(customer.address)
  }
  
  lines.push('')
  
  // Products
  lines.push('*PRODUCTOS*')
  
  let itemNum = 1
  for (const line of cartLines) {
    const variant = [
      line.size ? `Talla: ${line.size}` : null,
      line.color ? `Color: ${line.color}` : null,
    ]
      .filter(Boolean)
      .join(' - ')

    lines.push(`${itemNum}. ${line.name}`)
    if (variant) lines.push(`   ${variant}`)
    lines.push(`   Cant: ${line.qty} x ${formatMoney(line.price)} = ${formatMoney(line.subtotal)}`)
    lines.push('')
    itemNum++
  }
  
  // Totals
  lines.push('*RESUMEN*')
  
  if (subtotal && subtotal !== total) {
    lines.push(`Subtotal: ${formatMoney(subtotal)}`)
  }
  
  if (couponCode && discount > 0) {
    lines.push(`Cupon ${couponCode}: -${formatMoney(discount)}`)
  }
  
  lines.push(`*TOTAL: ${formatMoney(total)}*`)
  
  return lines.join('\n')
}

export function openWhatsAppWithMessage(message) {
  const encoded = encodeURIComponent(message)
  const url = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encoded}`
  window.location.assign(url)
}
