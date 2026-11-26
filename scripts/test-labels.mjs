import assert from 'node:assert/strict'
import { labelConfig, labelEligibility, validateAddress, receiverPhone, senderError, packageFor, defaultOption, checkRequote, costNote, orderRef, runGenerate } from '../supabase/functions/_shared/label.js'

const NC = { error: 'Las guías no están configuradas.' }
assert.deepEqual(labelConfig({ ENVIA_LABEL_BASE_URL: 'https://api-test.envia.com/', ENVIA_LABEL_API_KEY: 'k' }), { baseUrl: 'https://api-test.envia.com', apiKey: 'k', sandbox: true })
assert.equal(labelConfig({ ENVIA_LABEL_BASE_URL: 'https://api.envia.com', ENVIA_LABEL_API_KEY: 'k' }).sandbox, false)
assert.deepEqual(labelConfig({ ENVIA_LABEL_BASE_URL: 'https://api.envia.com', ENVIA_LABEL_API_KEY: ' ' }), NC)
assert.deepEqual(labelConfig({ ENVIA_LABEL_API_KEY: 'k' }), NC)
assert.deepEqual(labelConfig({ ENVIA_LABEL_BASE_URL: 'https://evil.com', ENVIA_LABEL_API_KEY: 'k' }), NC)
assert.deepEqual(labelConfig({ ENVIA_LABEL_BASE_URL: 'http://api.envia.com', ENVIA_LABEL_API_KEY: 'k' }), NC)
for (const h of ['constructor', '__proto__', 'tostring', 'hasownproperty']) assert.deepEqual(labelConfig({ ENVIA_LABEL_BASE_URL: `https://${h}`, ENVIA_LABEL_API_KEY: 'k' }), NC)
assert.deepEqual(labelConfig({ ENVIA_BASE_URL: 'https://api.envia.com', ENVIA_API_KEY: 'k' }), NC)   // nunca cae a los de cotizar

const ID = '0a1b2c3d-1111-2222-3333-444455556666'
const base = { id: ID, delivery_method: 'Envío a domicilio', shipping_carrier: 'estafeta', status: 'pendientedepago', label_status: null, label_tracking: null }
assert.equal(labelEligibility(base), null)                                            // sin pagar: se permite
assert.equal(labelEligibility({ ...base, delivery_method: 'Recoger en tienda' }), 'Este pedido no es envío a domicilio.')
assert.equal(labelEligibility({ ...base, shipping_carrier: 'local' }), 'Entrega local — la llevan ustedes.')
assert.equal(labelEligibility({ ...base, status: 'cancelado' }), 'El pedido está cancelado.')
assert.equal(labelEligibility({ ...base, label_tracking: '123' }), 'Este pedido ya tiene guía.')
assert.match(labelEligibility({ ...base, label_status: 'review' }), /GL-0a1b2c3d/)
assert.equal(labelEligibility({ ...base, shipping_carrier: null }), null)            // pedido viejo sin cotización

const A = { street: ' Av. México <b>', numExt: '12', numInt: '', neighborhood: 'Centro', city: 'Guadalajara', state: 'JAL', zip: '44100', references: '' }
const ok = validateAddress(A)
assert.equal(validateAddress({ ...A, street: { toString: () => 'x' } }).error, 'Revisa la calle.')   // solo texto o número
assert.equal(validateAddress({ ...A, zip: 44100 }).ok, true)
assert.equal(ok.ok, true); assert.equal(ok.address.street, 'Av. México b'); assert.equal(ok.address.stateName, 'Jalisco')
assert.equal(validateAddress({ ...A, zip: '4410' }).error, 'El código postal debe tener 5 dígitos.')
assert.equal(validateAddress({ ...A, state: null }).error, 'Este pedido es fuera de México. Genera la guía en el panel de Envia.')
assert.equal(validateAddress({ ...A, state: 'XX' }).error, 'Elige el estado.')
assert.equal(validateAddress({ ...A, street: '' }).error, 'Revisa la calle.')
assert.equal(validateAddress(null).error, 'Captura la dirección del cliente.')

assert.equal(receiverPhone('+52 1 312 123 4567'), '3121234567'); assert.equal(receiverPhone('312 123 4567'), '3121234567')
assert.equal(receiverPhone('+1 619 555 1234'), null); assert.equal(receiverPhone(''), null)

const origin = { name: 'G&L', phone: '3121234567', street: 'Zaragoza', number: '140', city: 'Colima', state: 'COL', postalCode: '28000' }
const NOPHONE = 'Falta el teléfono del remitente. Llénalo en Admin → Envíos.'
assert.equal(senderError(origin), null)
assert.equal(senderError({ ...origin, phone: ' ' }), NOPHONE)
assert.equal(senderError({ ...origin, phone: '312 123 4567' }), NOPHONE)                // solo dígitos
for (const k of ['name', 'street', 'city', 'state', 'postalCode']) assert.equal(senderError({ ...origin, [k]: '' }), 'Completa la dirección del remitente en Admin → Envíos.')

const S = { envelope: { length: 35, width: 25, height: 5, max_grams: 2000 }, box: { length: 40, width: 30, height: 20, max_grams: 10000 }, default_grams: 500, default_needs_box: true }
const W = { Playeras: { grams: 250, needs_box: false } }
assert.equal(packageFor([{ type: 'Playeras', qty: 2 }], W, S).pkg.kind, 'envelope')
assert.deepEqual(packageFor([{ type: 'Playeras', qty: 2 }], W, S, 'box').pkg, { kind: 'box', grams: 500, length: 40, width: 30, height: 20 })
assert.equal(packageFor([{ type: 'Playeras', qty: 9 }], W, S, 'envelope').error, 'Pesa 2250 g: no cabe en sobre. Usa caja.')
assert.equal(packageFor([{ qty: 1 }], W, S).pkg.grams, 500)                          // línea vieja sin type
assert.match(packageFor([{ type: 'Playeras', qty: 41 }], W, S, 'box').error, /panel de Envia/)
for (const k of [undefined, 'box']) assert.match(packageFor([{ type: 'Playeras', qty: 'x' }], W, S, k).error, /peso/)
assert.equal(packageFor([{ type: 'Playeras', qty: 1 }], W, S, 'bolsa').error, 'Elige sobre o caja.')

const o = (carrier, cost, days, serviceCode = carrier) => ({ carrier, service: 'S', serviceCode, cost, days })
const opts = [o('estafeta', 150, 4), o('dhl', 180, 2), o('fedex', 200, 1), o('dhl', 260, 1, 'exp')]
assert.equal(defaultOption(opts, { carrier: 'dhl', tier: 'standard' }), 1)
assert.equal(defaultOption(opts, { carrier: 'dhl', tier: 'express' }), 3)
assert.equal(defaultOption(opts, { carrier: 'DHL', tier: 'express' }), 3)                 // carrier del pedido sin importar mayúsculas
assert.equal(defaultOption(opts, { carrier: 'ups', tier: 'standard' }), 0)
assert.equal(defaultOption(opts, { carrier: null, tier: null }), 0)
assert.equal(defaultOption(opts, { carrier: 'estafeta', tier: 'express' }), 2)      // su paquetería no tiene Express: Express de todas
// Distinguibles: Standard (empate redondeado -> menos días) no es la más barata
const tie = [o('estafeta', 148, 5), o('dhl', 150, 2)]
assert.equal(defaultOption(tie, { carrier: 'ups', tier: 'standard' }), 1)
assert.equal(defaultOption(tie, { carrier: 'ups', tier: null }), 0)                   // sin tier: la más barata
assert.equal(defaultOption(tie, { carrier: 'estafeta', tier: 'standard' }), 0)        // su paquetería gana
assert.equal(defaultOption([], { carrier: 'dhl', tier: 'standard' }), -1)

const fmt = (n) => `$${n.toFixed(2)}`
assert.equal(checkRequote(opts, { carrier: 'dhl', serviceCode: 'exp', expectedCost: 260 }, fmt).option.cost, 260)
assert.equal(checkRequote(opts, { carrier: 'dhl', serviceCode: 'exp', expectedCost: 259.5 }, fmt).option.cost, 260)   // tolerancia de $1
assert.equal(checkRequote(opts, { carrier: 'dhl', serviceCode: 'exp', expectedCost: 250 }, fmt).error, 'El precio cambió a $260.00. Vuelve a ver las opciones.')
assert.equal(checkRequote(opts, { carrier: 'dhl', serviceCode: 'nope', expectedCost: 999 }, fmt).error, 'Esa opción ya no está disponible. Vuelve a ver las opciones.')
// Los códigos se repiten entre paqueterías: cuenta paquetería + código
const mixed = [o('estafeta', 100, 3, 'ground'), o('dhl', 300, 3, 'ground')]
assert.equal(checkRequote(mixed, { carrier: 'dhl', serviceCode: 'ground', expectedCost: 300 }, fmt).option.carrier, 'dhl')
assert.equal(checkRequote(mixed, { carrier: 'estafeta', serviceCode: 'ground', expectedCost: 100 }, fmt).option.cost, 100)
assert.match(checkRequote(mixed, { carrier: 'fedex', serviceCode: 'ground', expectedCost: 999 }, fmt).error, /ya no está disponible/)
// Falla cerrado con valores que no son número
for (const expectedCost of [undefined, null, '250', NaN, Infinity]) assert.ok(checkRequote(opts, { carrier: 'dhl', serviceCode: 'exp', expectedCost }, fmt).error)
assert.match(checkRequote([o('dhl', NaN, 1, 'exp')], { carrier: 'dhl', serviceCode: 'exp', expectedCost: 999 }, fmt).error, /ya no está disponible/)

assert.equal(costNote(210, 190, false, fmt), 'Esta guía cuesta $20.00 más de lo que pagó el cliente.')
assert.equal(costNote(150, 190, false, fmt), null)
assert.equal(costNote(150, 0, true, fmt), 'El cliente tuvo envío gratis: la guía la paga la tienda ($150.00).')
assert.equal(costNote(230, 40, true, fmt), 'Envío gratis con Express: el cliente pagó $40.00 de diferencia y la tienda pone $190.00.')
assert.equal(costNote(150, null, false, fmt), 'Este pedido no tiene costo de envío registrado.')
assert.equal(orderRef(ID), 'GL-0a1b2c3d')

// runGenerate con dobles: registra qué se llamó
const LABEL = { trackingNumber: '7700', labelUrl: 'https://l/7700.pdf', cost: 210.5 }
const fake = (over = {}) => {
  const calls = []
  const f = { calls, ref: 'GL-0a1b2c3d',
    lock: async () => (calls.push('lock'), true), build: () => (calls.push('build'), {}),
    send: async () => (calls.push('send'), { kind: 'ok', label: LABEL }),
    save: async () => { calls.push('save') }, unlock: async () => { calls.push('unlock') },
    markReview: async (t) => { calls.push(`review:${t}`) }, ...over }
  return f
}
let f = fake({ lock: async () => false })
assert.equal((await runGenerate(f)).error, 'Este pedido ya tiene guía o se está generando.'); assert.ok(!f.calls.includes('send'))
f = fake({ lock: async () => { throw new Error('db') } })
assert.equal((await runGenerate(f)).error, 'No se pudo apartar el pedido. Intenta de nuevo.'); assert.ok(!f.calls.includes('send'))
f = fake({ build: () => { throw new Error('x') } })
assert.equal((await runGenerate(f)).error, 'No se pudo preparar la guía. Intenta de nuevo.'); assert.deepEqual(f.calls, ['lock', 'unlock'])
f = fake({ send: async () => ({ kind: 'rejected', message: 'No hay saldo suficiente en Envia. Recarga tu saldo y vuelve a intentar.' }) })
assert.match((await runGenerate(f)).error, /saldo/); assert.ok(f.calls.includes('unlock')); assert.ok(!f.calls.some(c => c.startsWith('review')))
f = fake({ send: async () => ({ kind: 'unknown', trackingNumber: '7700' }) })
let r = await runGenerate(f); assert.equal(r.review, true); assert.match(r.error, /GL-0a1b2c3d/); assert.ok(f.calls.includes('review:7700')); assert.ok(!f.calls.includes('unlock'))
f = fake({ send: async () => { throw new Error('boom') } })
assert.equal((await runGenerate(f)).review, true); assert.ok(f.calls.includes('review:null')); assert.ok(!f.calls.includes('unlock'))
f = fake()
assert.deepEqual(await runGenerate(f), { label: LABEL, saved: true })
let n = 0; f = fake({ save: async () => { if (n++ === 0) throw new Error('x') } })
assert.equal((await runGenerate(f)).saved, true); assert.equal(n, 2)                  // reintento único funciona
n = 0; f = fake({ save: async () => { n++; throw new Error('x') } })
r = await runGenerate(f); assert.equal(n, 2); assert.equal(r.saved, false); assert.equal(r.label.trackingNumber, '7700')
console.log('test-labels ok')
