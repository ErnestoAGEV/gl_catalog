import assert from 'node:assert/strict'
import { parseRates, enviaState } from '../supabase/functions/_shared/envia.js'

// Forma documentada: data[] con totalPrice (string), deliveryEstimate (texto), serviceDescription
const fixture = { meta: 'rate', data: [
  { carrier: 'estafeta', service: 'terrestre', serviceDescription: 'Terrestre', deliveryEstimate: '2-4 días', totalPrice: '187.30', currency: 'MXN' },
  { carrier: 'estafeta', service: 'dia_sig', serviceDescription: 'Día siguiente', deliveryEstimate: '1 día', totalPrice: 240, currency: 'MXN' },
  { carrier: 'estafeta', service: 'raro', deliveryEstimate: 'n/d', totalPrice: '99', deliveryDate: { timeUnit: 'days', dateDifference: 3 } },
  { carrier: 'estafeta', service: 'sin_precio', totalPrice: 'x' },
] }
assert.deepEqual(parseRates(fixture, 'estafeta'), [
  { carrier: 'estafeta', service: 'Terrestre', price: 187.3, days: 4 },
  { carrier: 'estafeta', service: 'Día siguiente', price: 240, days: 1 },
  { carrier: 'estafeta', service: 'raro', price: 99, days: 3 },
])
assert.deepEqual(parseRates({ error: 'x' }, 'dhl'), [])
assert.equal(parseRates({ data: [{ service: 's', totalPrice: '10' }] }, 'dhl')[0].days, null)
assert.equal(enviaState('COL'), 'CL'); assert.equal(enviaState('NLE'), 'NL'); assert.equal(enviaState('CMX'), 'CX')
