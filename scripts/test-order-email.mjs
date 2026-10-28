// node scripts/test-order-email.mjs
import assert from 'node:assert/strict'
import { orderConfirmationEmail } from '../src/pages/admin/orderEmail.js'

const order = {
  id: 'a1b2c3d4-0000-0000-0000-000000000000',
  customer_name: 'Juan <b>Pérez</b>',
  address: 'Hidalgo #10, Col. Centro <script>',
  delivery_method: 'Envío a domicilio',
  payment_method: 'Transferencia',
  cart_items: JSON.stringify([{ name: 'Jeans <i>', size: '32', color: 'Azul', qty: 2, price: 799 }]),
  subtotal: 1598, discount: 159.8, coupon_code: 'WELCOME10', total: 1438.2, shipping_cost: 150,
}
const { subject, html } = orderConfirmationEmail(order, '523121018263')

assert.equal(subject, 'Tu pedido #a1b2c3d4 está confirmado')
// Lo que escribió el cliente se escapa.
assert.ok(!html.includes('<script>') && !html.includes('<b>Pérez') && !html.includes('Jeans <i>'))
assert.ok(html.includes('¡Gracias, Juan!')) // solo el primer nombre
assert.ok(html.includes('Jeans &lt;i&gt;') && html.includes('Talla 32 · Azul'))
// Totales: descuento, envío y total = total + envío.
assert.ok(html.includes('WELCOME10'))
assert.ok(html.includes('Envío'))
assert.ok(html.includes('$1,588')) // 1438.2 + 150
assert.ok(html.includes('https://wa.me/523121018263'))

// Sin envío capturado ni descuento: no salen esas líneas.
const plain = orderConfirmationEmail({ ...order, shipping_cost: null, discount: 0, address: null, delivery_method: 'Recoger en tienda' }).html
assert.ok(!plain.includes('>Envío<') && !plain.includes('Descuento'))
assert.ok(plain.includes('Te esperamos en tienda'))
// Envío en 0 = Gratis.
assert.ok(orderConfirmationEmail({ ...order, shipping_cost: 0 }).html.includes('Gratis'))

console.log('ok — orderEmail')
