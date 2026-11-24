import assert from 'node:assert/strict'
import { parseRates, enviaState } from '../supabase/functions/_shared/envia.js'
import { buildLabelRequest, parseLabel, classifyGenerate, enviaErrorMessage, rejectLog, generateLabel } from '../supabase/functions/_shared/envia.js'

// Forma documentada: data[] con totalPrice (string), deliveryEstimate (texto), serviceDescription
const fixture = { meta: 'rate', data: [
  { carrier: 'estafeta', service: 'terrestre', serviceDescription: 'Terrestre', deliveryEstimate: '2-4 días', totalPrice: '187.30', currency: 'MXN' },
  { carrier: 'estafeta', service: 'dia_sig', serviceDescription: 'Día siguiente', deliveryEstimate: '1 día', totalPrice: 240, currency: 'MXN' },
  { carrier: 'estafeta', service: 'raro', deliveryEstimate: 'n/d', totalPrice: '99', deliveryDate: { timeUnit: 'days', dateDifference: 3 } },
  { carrier: 'estafeta', service: 'sin_precio', totalPrice: 'x' },
  { carrier: 'estafeta', service: 'terrestre_ocurre', serviceDescription: 'Estafeta Terrestre Ocurre - Domicilio', deliveryEstimate: '2-4 días', totalPrice: '150', currency: 'MXN' },
  { carrier: 'estafeta', service: 'x', serviceDescription: 'Estafeta Terrestre OCURRE', deliveryEstimate: '2 días', totalPrice: '120' },
] }
assert.deepEqual(parseRates(fixture, 'estafeta'), [
  { carrier: 'estafeta', service: 'Terrestre', serviceCode: 'terrestre', price: 187.3, days: 4 },
  { carrier: 'estafeta', service: 'Día siguiente', serviceCode: 'dia_sig', price: 240, days: 1 },
  { carrier: 'estafeta', service: 'raro', serviceCode: 'raro', price: 99, days: 3 },
])
assert.deepEqual(parseRates({ error: 'x' }, 'dhl'), [])
assert.equal(parseRates({ data: [{ service: 's', totalPrice: '10' }] }, 'dhl')[0].days, null)
assert.equal(parseRates({ data: [{ service: 's', totalPrice: '10', deliveryEstimate: '27/11' }] }, 'dhl')[0].days, null)
assert.equal(enviaState('COL'), 'CL'); assert.equal(enviaState('COA'), 'CO'); assert.equal(enviaState('NLE'), 'NL'); assert.equal(enviaState('CMX'), 'CX')


const req = buildLabelRequest({ origin: { name: 'G&L', phone: '3121234567', street: 'Zaragoza', number: '140', city: 'Colima', state: 'COL', postalCode: '28000' },
  destination: { name: 'Ana', phone: '3331234567', street: 'Av. México', number: '12', district: 'Centro', city: 'Guadalajara', state: 'JAL', postalCode: '44100' },
  pkg: { kind: 'envelope', grams: 500, length: 35, width: 25, height: 5 }, carrier: 'dhl', serviceCode: 'express', printSize: 'PAPER_LETTER', orderRef: 'GL-0a1b2c3d' })
assert.equal(req.origin.state, 'CL'); assert.equal(req.destination.state, 'JA'); assert.equal(req.destination.country, 'MX')
assert.deepEqual(req.shipment, { type: 1, carrier: 'dhl', service: 'express', orderReference: 'GL-0a1b2c3d' })
assert.deepEqual(req.settings, { printFormat: 'PDF', printSize: 'PAPER_LETTER', currency: 'MXN' })
assert.equal(req.packages[0].type, 'envelope'); assert.equal(req.packages[0].weight, 0.5)

// Forma documentada de /ship/generate/ (docs.envia.com/reference/create-shipping-label)
const gen = { meta: 'generate', data: [{ carrier: 'dhl', service: 'express', shipmentId: 1, trackingNumber: '7700', trackUrl: 'https://t/7700', label: 'https://l/7700.pdf', additionalFiles: [], totalPrice: '210.50', currentBalance: 0, currency: 'MXN' }] }
assert.deepEqual(parseLabel(gen), { trackingNumber: '7700', trackUrl: 'https://t/7700', labelUrl: 'https://l/7700.pdf', cost: 210.5, carrier: 'dhl', service: 'express' })
assert.equal(classifyGenerate(200, gen).kind, 'ok')
assert.deepEqual(classifyGenerate(200, { data: [{ trackingNumber: '7701' }] }), { kind: 'unknown', trackingNumber: '7701' })
assert.equal(classifyGenerate(200, { meta: 'generate', data: [] }).kind, 'unknown')
for (const s of [502, 408, 429]) assert.equal(classifyGenerate(s, null).kind, 'unknown')
assert.equal(classifyGenerate(200, null).kind, 'unknown')
const err = { meta: 'error', error: { code: 1129, description: 'Error', message: 'Insufficient balance' } }   // forma supuesta
assert.deepEqual(classifyGenerate(400, err), { kind: 'rejected', message: 'No hay saldo suficiente en Envia. Recarga tu saldo y vuelve a intentar.' })
assert.equal(classifyGenerate(200, err).kind, 'rejected')
assert.equal(classifyGenerate(429, err).kind, 'unknown')
assert.equal(enviaErrorMessage({ meta: 'error', error: { message: 'Invalid service' } }), 'Envia no pudo generar la guía: Invalid service')
assert.equal(enviaErrorMessage({}), 'Envia no pudo generar la guía. Intenta de nuevo en unos minutos.')
assert.equal(rejectLog(400, err), 'status=400 meta=error code=1129 msg=Insufficient balance')

const args = { baseUrl: 'https://api-test.envia.com', apiKey: 'k', body: {} }
assert.deepEqual(await generateLabel({ ...args, fetchFn: async () => { throw new TypeError('network') } }), { kind: 'unknown' })
assert.deepEqual(await generateLabel({ ...args, timeoutMs: 10, fetchFn: (_u, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('abort')))) }), { kind: 'unknown' })
assert.equal((await generateLabel({ ...args, fetchFn: async () => new Response(JSON.stringify(gen), { status: 200 }) })).kind, 'ok')
assert.equal((await generateLabel({ ...args, fetchFn: async () => new Response('<html>', { status: 200 }) })).kind, 'unknown')
