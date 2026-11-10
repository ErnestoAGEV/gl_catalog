// node scripts/test-promotions.mjs
import assert from 'node:assert/strict'
import {
  discounted, isRunning, promoFor, applyPromotions, featuredPromotion, nextBoundary,
  contrastOnWhite, localInputToIso, isoToLocalInput, couponBase, promoReport, boundaryDelay,
} from '../src/utils/promotions.js'

const H = 3600e3
const now = Date.parse('2026-11-14T12:00:00Z')
const promo = (o = {}) => ({
  id: 'a', name: 'Buen Fin', discount_pct: 20, categories: [], include_on_sale: false,
  starts_at: new Date(now - H).toISOString(), ends_at: new Date(now + H).toISOString(),
  accent_color: null, show_countdown: true, countdown_lead_days: 3, active: true, ...o,
})
const prod = (o = {}) => ({ id: 1, type: 'Camisas', price: 1000, originalPrice: null, ...o })

// Medio peso: mismo resultado que round() numeric de Postgres (233, no 232)
assert.equal(discounted(250, 7), 233)
assert.equal(discounted(1075, 6), 1011)
assert.equal(discounted(1000, 20), 800)

// Vigencia: [starts_at, ends_at) y solo activas
assert.equal(isRunning(promo(), now), true)
assert.equal(isRunning(promo({ starts_at: new Date(now + 1).toISOString() }), now), false)
assert.equal(isRunning(promo({ ends_at: new Date(now).toISOString() }), now), false)
assert.equal(isRunning(promo({ active: false }), now), false)

// Alcance
assert.equal(promoFor(prod(), [promo()], now)?.id, 'a')
assert.equal(promoFor(prod({ type: 'Polos' }), [promo({ categories: ['Camisas'] })], now), null)
assert.equal(promoFor(prod(), [promo({ categories: ['Camisas'] })], now)?.id, 'a')

// Ya rebajado: fuera por defecto; dentro con include_on_sale, sobre price (no original)
const rebajado = prod({ price: 800, originalPrice: 1000 })
assert.equal(promoFor(rebajado, [promo()], now), null)
const [r2] = applyPromotions([rebajado], [promo({ include_on_sale: true })], now)
assert.equal(r2.price, 640)
assert.equal(r2.originalPrice, 800)

// Desempate: mayor % y luego starts_at menor
const p10 = promo({ id: 'b', discount_pct: 10 })
assert.equal(promoFor(prod(), [p10, promo()], now).id, 'a')
const temprana = promo({ id: 'c', starts_at: new Date(now - 2 * H).toISOString() })
assert.equal(promoFor(prod(), [promo(), temprana], now).id, 'c')

// Si el redondeo no baja el precio no hay promo
assert.equal(promoFor(prod({ price: 1 }), [promo({ discount_pct: 1 })], now), null)

// applyPromotions: base intacta, idempotente, caché viejo sin basePrice
const [a] = applyPromotions([prod()], [promo()], now)
assert.equal(a.price, 800)
assert.equal(a.originalPrice, 1000)
assert.equal(a.basePrice, 1000)
assert.deepEqual(a.promo, { id: 'a', name: 'Buen Fin', pct: 20 })
const [b] = applyPromotions([a], [promo()], now)
assert.equal(b.price, 800)
const [c] = applyPromotions([a], [], now)
assert.equal(c.price, 1000)
assert.equal(c.originalPrice, null)
assert.equal(c.promo, null)

// Franja: en curso que termina primero; si no, próxima dentro del aviso
const pronto = promo({ id: 'd', ends_at: new Date(now + H / 2).toISOString() })
assert.equal(featuredPromotion([promo(), pronto], now).promo.id, 'd')
assert.equal(featuredPromotion([promo()], now).phase, 'running')
const futura = promo({ starts_at: new Date(now + 48 * H).toISOString(), ends_at: new Date(now + 96 * H).toISOString() })
assert.equal(featuredPromotion([futura], now).phase, 'upcoming')
assert.equal(featuredPromotion([{ ...futura, countdown_lead_days: 1 }], now), null)
assert.equal(featuredPromotion([{ ...promo(), show_countdown: false }], now), null)
assert.equal(nextBoundary([futura], now), now + 48 * H)

// Contraste contra blanco
assert.ok(contrastOnWhite('#D7262B') >= 4.5)
assert.ok(contrastOnWhite('#FFD400') < 4.5)

// datetime-local ida y vuelta (hora local del navegador)
assert.equal(isoToLocalInput(localInputToIso('2026-11-13T00:00')), '2026-11-13T00:00')

// Cupón: el porcentaje no cuenta líneas en promoción
const lines = [{ product: a, qty: 1 }, { product: prod({ id: 2, type: 'Polos' }), qty: 2 }]
assert.equal(couponBase(lines, []), 2000)
assert.equal(couponBase(lines, ['Camisas']), 0)
assert.equal(couponBase(lines, ['Polos']), 2000)

// Reporte: ventana [inicio, fin) contra los mismos días previos, sin cancelados
const rp = promo({ starts_at: '2026-11-13T06:00:00Z', ends_at: '2026-11-15T06:00:00Z' })
const orders = [
  { created_at: '2026-11-13T07:00:00Z', total: 500, status: 'pagado' },
  { created_at: '2026-11-14T07:00:00Z', total: 300, status: 'pendientedepago' },
  { created_at: '2026-11-14T08:00:00Z', total: 900, status: 'cancelado' },
  { created_at: '2026-11-12T07:00:00Z', total: 200, status: 'pagado' },
  { created_at: '2026-11-10T07:00:00Z', total: 999, status: 'pagado' },
]
assert.deepEqual(promoReport(orders, rp, Date.parse('2026-12-01T00:00:00Z')), {
  orders: 2, sales: 800, avg: 400,
  prev: { orders: 1, sales: 200, avg: 200 },
})

// Temporizador: un cambio a 2 días se reprograma cada 24 h en vez de perderse
assert.equal(boundaryDelay(now + 48 * H, now), 24 * H)
assert.equal(boundaryDelay(now + H, now), H + 500)
assert.equal(boundaryDelay(null, now), null)

// Reporte de una promo en curso: solo los días transcurridos contra los mismos días previos
const enCurso = promo({ starts_at: '2026-11-13T06:00:00Z', ends_at: '2026-11-17T06:00:00Z' })
const rc = promoReport(orders, enCurso, Date.parse('2026-11-15T06:00:00Z'))
assert.equal(rc.orders, 2)
assert.deepEqual(rc.prev, { orders: 1, sales: 200, avg: 200 })

console.log('test-promotions OK')
