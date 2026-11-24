import assert from 'node:assert/strict'
import { roundUp5, buildPackage, pickTiers, isFreeShipping, chargeFor, cartKey, isMxZip, MX_STATES } from '../supabase/functions/_shared/shipping.js'

assert.equal(roundUp5(187.30), 190); assert.equal(roundUp5(185), 185); assert.equal(roundUp5(180.01), 185); assert.equal(roundUp5(0.1 + 0.2 + 184.7), 185)

const S = { envelope: { length: 35, width: 25, height: 5, max_grams: 2000 }, box: { length: 40, width: 30, height: 20, max_grams: 10000 }, default_grams: 500, default_needs_box: true, carriers: ['estafeta'], free_shipping_min: 1499 }
const W = { Playeras: { grams: 250, needs_box: false }, Pantalones: { grams: 650, needs_box: false }, Zapatos: { grams: 1500, needs_box: true } }
assert.deepEqual(buildPackage([{ type: 'Playeras', qty: 2 }], W, S), { kind: 'envelope', grams: 500, length: 35, width: 25, height: 5 })
assert.equal(buildPackage([{ type: 'Playeras', qty: 1 }, { type: 'Zapatos', qty: 1 }], W, S).kind, 'box')
assert.equal(buildPackage([{ type: 'Pantalones', qty: 4 }], W, S).kind, 'box')          // 2600 g > sobre
assert.equal(buildPackage([{ type: 'Desconocida', qty: 1 }], W, S).kind, 'box')         // default caja 500 g
assert.equal(buildPackage([{ type: 'Zapatos', qty: 7 }], W, S), null)                  // 10.5 kg > caja

const r = (carrier, price, days) => ({ carrier, service: 'x', price, days })
let t = pickTiers([r('estafeta', 187.3, 4), r('fedex', 240, 2), r('dhl', 230, 2)])
assert.equal(t.standard.carrier, 'estafeta'); assert.equal(t.standard.price, 190); assert.equal(t.standard.cost, 187.3)
assert.equal(t.express.carrier, 'dhl'); assert.equal(t.express.price, 230)
assert.equal(pickTiers([r('estafeta', 150, 3), r('fedex', 200, 3)]).express, null)      // no llega antes
assert.equal(pickTiers([r('estafeta', 150, 2), r('fedex', 200, null)]).express, null)   // días desconocidos no son Express
assert.equal(pickTiers([r('std', 100, 5), r('a', 150, 4), r('b', 200, 1)]).express.carrier, 'b')   // Express = la de menos días, no la más barata
let t2 = pickTiers([r('a', 186, 4), r('b', 189, 2)])
assert.equal(t2.standard.carrier, 'b'); assert.equal(t2.express, null)   // empate de precio redondeado -> menos días
assert.equal(pickTiers([]), null)

assert.equal(isFreeShipping(1499, null, 1499), true); assert.equal(isFreeShipping(1498.99, null, 1499), false); assert.equal(isFreeShipping(10, { freeShipping: true }, 1499), true)
assert.equal(chargeFor(t, 'standard', false), 190); assert.equal(chargeFor(t, 'express', false), 230)
assert.equal(chargeFor(t, 'standard', true), 0); assert.equal(chargeFor(t, 'express', true), 40)

assert.equal(cartKey([{ productId: 2, qty: 1 }, { productId: 1, qty: 1 }, { productId: 2, qty: 2 }]), '1:1|2:3')
assert.equal(cartKey([{ productId: 10, qty: 1 }, { productId: 9, qty: 1 }]), '10:1|9:1')   // orden de texto, igual que SQL collate "C"
assert.equal(isMxZip('28000'), true); assert.equal(isMxZip('2800'), false); assert.equal(isMxZip('280000'), false)
assert.equal(MX_STATES.length, 32)
console.log('test-shipping ok')

// Lectura del minimo de envio gratis (RPC): null, texto, negativos o error -> respaldo 1499
import { parseFreeShippingMin } from '../src/utils/freeShipping.js'
assert.equal(parseFreeShippingMin(true, 999), 999)
for (const bad of [null, 'x', '', [], true, -1]) assert.equal(parseFreeShippingMin(true, bad), 1499)
assert.equal(parseFreeShippingMin(false, 999), 1499)
