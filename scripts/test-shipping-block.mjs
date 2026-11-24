import assert from 'node:assert/strict'
import { shippingBlockHTML } from '../src/pages/checkout/shippingBlock.js'

// Sin cotizacion vigente (carrito cambio) no truena ni pinta opciones
assert.equal(shippingBlockHTML({ status: 'ready', quote: null, tier: 'standard', prices: null }), '')
assert.match(shippingBlockHTML({ status: 'quoting' }), /Calculando/)
assert.match(shippingBlockHTML({ status: 'fallback' }), /por WhatsApp/)

const quote = { standard: { carrier: 'fedex', price: 135, days: 6 }, express: { carrier: 'estafeta', price: 160, days: 2 } }
const html = shippingBlockHTML({ status: 'ready', quote, tier: 'express', prices: { standard: 0, express: 25 } })
assert.match(html, /Estándar · FedEx/)
assert.match(html, /Gratis/)
assert.match(html, /\$25/)
assert.match(html, /value="express" checked/)
assert.doesNotMatch(shippingBlockHTML({ status: 'ready', quote: { standard: quote.standard, express: null }, tier: 'standard', prices: { standard: 135 } }), /type="radio"/)
console.log('test-shipping-block ok')
