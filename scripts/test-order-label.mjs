import assert from 'node:assert/strict'
import { labelState, labelBlockHtml, ratesHtml, optionExtras, confirmLabel, addressFormHtml, SANDBOX_NOTE, money, pollDelay, mountMode } from '../src/pages/admin/orderLabelView.js'

const NOW = Date.parse('2026-11-24T12:00:00Z')
const base = { id: 'abcdef12-0000-4000-8000-000000000000', delivery_method: 'Envío a domicilio', shipping_carrier: 'fedex', status: 'completado', label_status: null }
const count = (s, sub) => s.split(sub).length - 1

// Estados solo desde columnas
assert.equal(labelState({ ...base, delivery_method: 'Recoger en tienda' }, NOW), 'none')
assert.equal(labelBlockHtml({ ...base, delivery_method: 'Recoger en tienda' }, NOW), '')
assert.equal(labelState({ ...base, shipping_carrier: 'local' }, NOW), 'local')
assert.match(labelBlockHtml({ ...base, shipping_carrier: 'local' }, NOW), /Entrega local — la llevan ustedes\./)
assert.doesNotMatch(labelBlockHtml({ ...base, shipping_carrier: 'local' }, NOW), /<button/)
assert.equal(labelState(base, NOW), 'empty')
assert.match(labelBlockHtml(base, NOW), /data-label="start"[^>]*>Generar guía</)
assert.equal(labelState({ ...base, status: 'cancelado' }, NOW), 'cancelled')
assert.equal(labelState({ ...base, label_status: 'generating', label_locked_at: '2026-11-24T11:59:00Z' }, NOW), 'generating')
assert.doesNotMatch(labelBlockHtml({ ...base, label_status: 'generating', label_locked_at: '2026-11-24T11:59:00Z' }, NOW), /<button/)
assert.equal(labelState({ ...base, label_status: 'generating', label_locked_at: '2026-11-24T11:57:00Z' }, NOW), 'review')
assert.equal(labelState({ ...base, label_status: 'generating', label_locked_at: null }, NOW), 'review')
const review = labelBlockHtml({ ...base, label_status: 'review', label_tracking: '7700' }, NOW)
assert.match(review, /referencia GL-abcdef12/)
assert.match(review, /7700/)
assert.match(review, /Ya revisé en Envia, liberar/)

// Guía generada: escapado, imprimir solo https, aviso de prueba arriba y junto a Imprimir
const gen = { ...base, label_status: 'generated', label_carrier: 'estafeta', label_service: '<b>x</b>', label_tracking: '"><img src=x>', label_url: 'https://e.test/l.pdf', label_cost: 150, label_sandbox: true }
const g = labelBlockHtml(gen, NOW)
assert.doesNotMatch(g, /<img src=x>|<b>x<\/b>/)
assert.match(g, /&lt;b&gt;x&lt;\/b&gt;/)
assert.match(g, /href="https:\/\/e\.test\/l\.pdf" target="_blank" rel="noopener"/)
assert.equal(count(g, SANDBOX_NOTE), 2)
assert.match(g, /Quitar guía de prueba/)
const prod = labelBlockHtml({ ...gen, label_sandbox: false, label_url: 'javascript:alert(1)' }, NOW)
assert.doesNotMatch(prod, /Imprimir guía|javascript:/)
assert.equal(count(prod, SANDBOX_NOTE), 0)
assert.match(prod, />Quitar guía</)

// Opciones
const r = { options: [{ carrier: 'fedex', service: 'Ground', serviceCode: 'g', cost: 120, days: 5 }, { carrier: 'dhl', service: '<i>', serviceCode: 'e', cost: 200, days: 1 }], defaultIndex: 1, package: { kind: 'box' }, paid: 150, free: false, sandbox: false }
const h = ratesHtml(r, 1, { ...base, status: 'pendientedepago' })
assert.match(h, /value="1" checked/)
assert.match(h, /value="box" checked/)
assert.match(h, /role="radiogroup"/)
assert.match(h, /1 día</)
assert.doesNotMatch(h, /<i>/)
assert.match(h, /Esta guía cuesta \$50 más de lo que pagó el cliente\./)
assert.match(h, /Este pedido aún no está marcado como pagado\./)
assert.match(h, /Generar guía por \$200 — se cobra a tu saldo de Envia/)
assert.equal(optionExtras(r, 0).note, null)
assert.equal(confirmLabel(99, true), 'Generar guía de prueba')
assert.match(ratesHtml({ ...r, sandbox: true }, 0, base), new RegExp(SANDBOX_NOTE))

// Formulario: prellenado y escapado
const f = addressFormHtml({ street: '"><script>', state: 'COL', zip: '2800' }, 'Calle <x>')
assert.doesNotMatch(f, /<script>|<x>/)
assert.match(f, /value="COL" selected/)
assert.match(f, /name="zip" value="2800"/)
assert.match(f, /<label for="label-addr-city"/)

// Dinero: centavos solo si los hay
assert.equal(money(135.5), '$135.50')
assert.equal(money(150), '$150')
assert.equal(confirmLabel(135.5, false), 'Generar guía por $135.50 — se cobra a tu saldo de Envia')
assert.match(labelBlockHtml({ ...gen, label_cost: 99.9 }, NOW), /\$99\.90/)
assert.match(ratesHtml({ ...r, options: [{ ...r.options[0], cost: 160.25 }], paid: 150 }, 0, base), /\$160\.25[\s\S]*cuesta \$10\.25 más/)

// Números (rastreo, CP, número exterior) no se pierden al escapar
assert.match(labelBlockHtml({ ...gen, label_tracking: 7700123 }, NOW), /7700123/)
assert.match(addressFormHtml({ zip: 28000, numExt: 12 }), /name="zip" value="28000"/)
assert.match(addressFormHtml({ zip: 28000, numExt: 12 }), /name="numExt" value="12"/)

// Releer 'generating' cada 10 s hasta el vencimiento; nada en otros estados
const genAt = (iso) => ({ ...base, label_status: 'generating', label_locked_at: iso })
assert.equal(pollDelay(genAt('2026-11-24T11:59:30Z'), NOW), 10_000)
assert.equal(pollDelay(genAt('2026-11-24T11:58:05Z'), NOW), 6_000)
assert.equal(pollDelay(genAt('2026-11-24T11:57:00Z'), NOW), null)
assert.equal(pollDelay(base, NOW), null)

// Montaje: llamada en curso gana a relectura pendiente
assert.equal(mountMode('a', new Set(['a']), new Set(['a'])), 'busy')
assert.equal(mountMode('a', new Set(), new Set(['a'])), 'dirty')
assert.equal(mountMode('a', new Set(), new Set()), 'ready')

console.log('test-order-label ok')
