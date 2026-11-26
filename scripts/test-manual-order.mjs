// node scripts/test-manual-order.mjs
import assert from 'node:assert/strict'
import {
  validateManualOrder, toRpcArgs, previewTotals, pickQuoteTier,
  shouldSendConfirmation, isSuccessful, channelBreakdown,
} from '../src/utils/manualOrder.js'

const ENVIO = 'Envío a domicilio'
const addr = { street: 'Reforma', numExt: '10', numInt: '', neighborhood: 'Centro', city: 'Colima', state: 'COL', stateName: 'Colima', zip: '28000', references: '' }
const base = {
  name: 'Ana Perez', whatsapp: '312 123 4567', email: '', items: [{ productId: 'p1', size: 'M', color: 'Negro', qty: 2 }],
  couponCode: '', paymentMethod: 'Transferencia', deliveryMethod: 'Recoger en tienda', address: addr,
  quote: null, tier: null, shippingCost: null, costEdited: false, local: false, status: 'pendientedepago',
}
const home = { ...base, deliveryMethod: ENVIO }

// validateManualOrder
assert.deepEqual(validateManualOrder(base), [])
assert.deepEqual(validateManualOrder(home), [])
assert.ok(validateManualOrder({ ...base, name: 'Al' }).includes('Escribe el nombre del cliente.'))
assert.ok(validateManualOrder({ ...base, whatsapp: '123' }).includes('El WhatsApp no parece válido.'))
assert.ok(validateManualOrder({ ...base, items: [] }).includes('Agrega al menos un producto.'))
assert.ok(validateManualOrder({ ...home, address: { ...addr, street: '' } }).includes('Completa la dirección de envío.'))
for (const k of ['numExt', 'neighborhood', 'city', 'stateName', 'zip']) {
  assert.ok(validateManualOrder({ ...home, address: { ...addr, [k]: ' ' } }).includes('Completa la dirección de envío.'), k)
}
assert.deepEqual(validateManualOrder({ ...base, address: {} }), [], 'recoger no pide dirección')
for (const c of [-1, 10001, NaN]) {
  assert.ok(validateManualOrder({ ...home, shippingCost: c }).includes('El costo de envío debe estar entre 0 y 10,000.'), String(c))
}
assert.deepEqual(validateManualOrder({ ...home, shippingCost: 10000 }), [])

// toRpcArgs
const pick = toRpcArgs(base)
assert.equal(pick.p_address_parts, null)
assert.equal(pick.p_address, null)
assert.equal(pick.p_shipping_cost, null)
assert.equal(pick.p_shipping_quote_id, null)
assert.equal(pick.p_customer_email, null)
assert.deepEqual(pick.p_items, [{ productId: 'p1', size: 'M', color: 'Negro', qty: 2 }])
assert.equal(toRpcArgs({ ...base, couponCode: ' welcome10 ' }).p_coupon_code, 'welcome10')
assert.equal(toRpcArgs({ ...base, email: ' a@b.mx ' }).p_customer_email, 'a@b.mx')
const quote = { quoteId: 'q1', standard: { carrier: 'fedex', price: 165 }, express: { carrier: 'fedex', price: 230 } }
const q = toRpcArgs({ ...home, quote, tier: 'express', shippingCost: 230, costEdited: false })
assert.equal(q.p_shipping_quote_id, 'q1'); assert.equal(q.p_shipping_tier, 'express')
assert.equal(q.p_shipping_cost, null, 'sin editar, cobra la base')
assert.equal(q.p_address_parts.zip, '28000')
assert.match(q.p_address, /Reforma #10, Col\. Centro, Colima, Colima, C\.P\. 28000/)
assert.equal(toRpcArgs({ ...home, quote, tier: 'express', shippingCost: 180, costEdited: true }).p_shipping_cost, 180)
const noq = toRpcArgs({ ...home, shippingCost: 60, local: true })
assert.equal(noq.p_shipping_cost, 60); assert.equal(noq.p_local, true); assert.equal(noq.p_shipping_quote_id, null); assert.equal(noq.p_shipping_tier, null)
assert.equal(toRpcArgs({ ...base, shippingCost: 60, local: true }).p_local, false, 'recoger nunca es local')

// pickQuoteTier
assert.deepEqual(pickQuoteTier({ standard: { carrier: 'local', price: 60 } }, 'standard'), { cost: 60, local: true })
assert.equal(pickQuoteTier({ standard: { carrier: 'fedex', price: 165 }, express: null }, 'express'), null)
assert.deepEqual(pickQuoteTier(quote, 'express', true), { cost: 65, local: false }, 'envio gratis: express cobra la diferencia')
assert.deepEqual(pickQuoteTier(quote, 'standard', true), { cost: 0, local: false })
assert.equal(pickQuoteTier(null, 'standard'), null)

// previewTotals
const products = [{ id: 'p1', price: 400, basePrice: 500 }]
assert.deepEqual(previewTotals({ ...home, shippingCost: 60 }, products), { subtotal: 800, shipping: 60, total: 860 })
assert.deepEqual(previewTotals({ ...base, shippingCost: 60 }, products), { subtotal: 800, shipping: 0, total: 800 })
assert.deepEqual(previewTotals({ ...home, items: [{ productId: 'zz', qty: 1 }] }, products), { subtotal: 0, shipping: 0, total: 0 })

// shouldSendConfirmation
assert.equal(shouldSendConfirmation({ channel: 'whatsapp', customer_email: 'a@b.mx' }, 'completado'), false)
assert.equal(shouldSendConfirmation({ channel: 'web', customer_email: 'a@b.mx', confirmation_sent_at: null }, 'completado'), true)
assert.equal(shouldSendConfirmation({ customer_email: 'a@b.mx' }, 'completado'), true, 'sin canal = web')
assert.equal(shouldSendConfirmation({ channel: 'web', customer_email: '' }, 'completado'), false)
assert.equal(shouldSendConfirmation({ channel: 'web', customer_email: 'a@b.mx', confirmation_sent_at: '2026-01-01' }, 'completado'), false)
assert.equal(shouldSendConfirmation({ channel: 'web', customer_email: 'a@b.mx' }, 'cancelado'), false)

// isSuccessful + channelBreakdown
assert.ok(isSuccessful('Completado') && isSuccessful('pagado') && isSuccessful('enviado'))
assert.ok(!isSuccessful('pendientedepago') && !isSuccessful(null))
assert.deepEqual(channelBreakdown([
  { channel: 'web', status: 'completado', total: 100 },
  { channel: 'whatsapp', status: 'pendientedepago', total: 200 },
  { channel: 'whatsapp', status: 'cancelado', total: 50 },
]), { web: { count: 1, revenue: 100 }, whatsapp: { count: 1, revenue: 0 } })
assert.deepEqual(channelBreakdown([{ status: 'completado', total: '70' }]), { web: { count: 1, revenue: 70 }, whatsapp: { count: 0, revenue: 0 } })

console.log('test-manual-order ok')
