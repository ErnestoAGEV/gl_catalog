// Promociones de temporada (Buen Fin, etc.). Regla pura, sin DOM ni Supabase.
// Espejo exacto de public.promo_info() en supabase/promotions.sql: si cambia
// una, cambia la otra. Lo que se cobra lo decide la base; esto es lo que se ve.

const ms = (iso) => Date.parse(iso)
const DAY = 86400e3

/** Enteros: con precios enteros el medio peso redondea igual que round() de Postgres. */
export function discounted(price, pct) {
  return Math.round(price * (100 - pct) / 100)
}

export function isRunning(promo, now) {
  return Boolean(promo?.active) && now >= ms(promo.starts_at) && now < ms(promo.ends_at)
}

// discount_pct desc, starts_at asc, id asc — mismo orden que en SQL
function byPriority(a, b) {
  return (b.discount_pct - a.discount_pct)
    || (ms(a.starts_at) - ms(b.starts_at))
    || String(a.id).localeCompare(String(b.id))
}

const baseOf = (p) => ({
  price: Number(p.basePrice ?? p.price),
  originalPrice: p.basePrice !== undefined ? p.baseOriginalPrice : p.originalPrice,
})

export function promoFor(product, promos, now) {
  const { price, originalPrice } = baseOf(product)
  const onSale = originalPrice != null && Number(originalPrice) > price
  const winner = (promos || [])
    .filter(pr => isRunning(pr, now))
    .filter(pr => !pr.categories?.length || pr.categories.includes(product.type))
    .filter(pr => pr.include_on_sale || !onSale)
    .sort(byPriority)[0]
  if (!winner || discounted(price, winner.discount_pct) >= price) return null
  return winner
}

export function applyPromotions(products, promos, now) {
  return (products || []).map(p => {
    const base = baseOf(p)
    const promo = promoFor(p, promos, now)
    return {
      ...p,
      basePrice: base.price,
      baseOriginalPrice: base.originalPrice ?? null,
      price: promo ? discounted(base.price, promo.discount_pct) : base.price,
      originalPrice: promo ? base.price : (base.originalPrice ?? null),
      promo: promo ? { id: promo.id, name: promo.name, pct: promo.discount_pct, color: promo.accent_color || null } : null,
    }
  })
}

/** Lo que anuncia la franja: la en curso que termina primero, o la próxima dentro de su aviso. */
export function featuredPromotion(promos, now) {
  const list = (promos || []).filter(p => p.active && p.show_countdown)
  const running = list.filter(p => isRunning(p, now))
    .sort((a, b) => (ms(a.ends_at) - ms(b.ends_at)) || byPriority(a, b))[0]
  if (running) return { promo: running, phase: 'running' }
  const upcoming = list
    .filter(p => ms(p.starts_at) > now && ms(p.starts_at) - now <= p.countdown_lead_days * DAY)
    .sort((a, b) => (ms(a.starts_at) - ms(b.starts_at)) || byPriority(a, b))[0]
  return upcoming ? { promo: upcoming, phase: 'upcoming' } : null
}

/** Promo en curso cuyo color pinta la tienda (misma elección que la franja, sin exigir show_countdown). */
export function colorPromotion(promos, now) {
  return (promos || []).filter(p => isRunning(p, now) && p.accent_color)
    .sort((a, b) => (ms(a.ends_at) - ms(b.ends_at)) || byPriority(a, b))[0] || null
}

/** Espera del temporizador: setTimeout no aguanta semanas, así que a lo más un día y se reprograma. */
export function boundaryDelay(next, now) {
  return next == null ? null : Math.min(next - now + 500, DAY)
}

/** Próximo instante en que algo cambia (inicio, fin o arranque del aviso). */
export function nextBoundary(promos, now) {
  const times = (promos || []).filter(p => p.active).flatMap(p => [
    ms(p.starts_at), ms(p.ends_at), ms(p.starts_at) - p.countdown_lead_days * DAY,
  ]).filter(t => t > now)
  return times.length ? Math.min(...times) : null
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contraste WCAG del texto blanco sobre ese color. */
export function contrastOnWhite(hex) {
  return 1.05 / (luminance(hex) + 0.05)
}

// Las promos se programan en hora de Colima, no en la del equipo (el de la
// oficina puede estar en hora del Pacifico). Mexico quito el horario de verano en 2022.
// shortcut: offset fijo UTC-6; si Mexico vuelve al horario de verano, usar Intl con America/Mexico_City.
const MX_OFFSET = '-06:00'
const MX_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

/** Valor de <input type="datetime-local"> (hora de Colima) a instante ISO. */
export function localInputToIso(value) {
  return new Date(`${value}:00${MX_OFFSET}`).toISOString()
}

/** Instante ISO a valor de <input type="datetime-local"> en hora de Colima. */
export function isoToLocalInput(iso) {
  const p = Object.fromEntries(MX_PARTS.formatToParts(new Date(iso)).map(x => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/** style="" para que la etiqueta y el precio usen el color de SU promo (validado #rrggbb en la base). */
export function promoStyle(promo) {
  return promo?.color && /^#[0-9a-f]{6}$/i.test(promo.color) ? ` style="--color-promo:${promo.color}"` : ''
}

/** Base del porcentaje de un cupón: sin líneas en promoción (no se acumulan). */
export function couponBase(lines, categories) {
  return lines.reduce((acc, { product, qty }) => {
    if (!product || product.promo) return acc
    if (categories?.length && !categories.includes(product.type)) return acc
    return acc + product.price * qty
  }, 0)
}

/** Pedidos no cancelados durante la promo (hasta hoy si sigue en curso) contra los mismos días justo antes. */
export function promoReport(orders, promo, now = Date.now()) {
  const start = ms(promo.starts_at)
  const end = Math.min(ms(promo.ends_at), Math.max(now, start))
  const sum = (from, to) => {
    const rows = (orders || []).filter(o => o.status !== 'cancelado')
      .filter(o => { const t = ms(o.created_at); return t >= from && t < to })
    const sales = rows.reduce((acc, o) => acc + Number(o.total || 0), 0)
    return { orders: rows.length, sales, avg: rows.length ? Math.round(sales / rows.length) : 0 }
  }
  return { ...sum(start, end), prev: sum(start - (end - start), start) }
}
