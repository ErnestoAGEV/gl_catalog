// Franja de cuenta regresiva y color de evento de las promociones de temporada.
// Vive fuera de #app (las vistas se cachean y repintan solas); se actualiza con
// un solo intervalo de 1 s y con cada emit del store.
import { featuredPromotion, colorPromotion } from '../utils/promotions.js'
import { escapeHtml } from '../utils/sanitize.js'

const BRAND_VARS = {
  '--color-brand': (c) => c,
  '--color-brand-light': (c) => `color-mix(in srgb, ${c} 80%, white)`,
  '--color-brand-dark': (c) => `color-mix(in srgb, ${c} 82%, black)`,
  '--color-brand-ink': (c) => `color-mix(in srgb, ${c} 72%, black)`,
  '--color-brand-tint': (c) => `color-mix(in srgb, ${c} 10%, white)`,
  '--color-brand-tint-2': (c) => `color-mix(in srgb, ${c} 5%, white)`,
}

const DATE_FMT = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })

export function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const pad = (n) => String(n).padStart(2, '0')
  const hms = `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
  return d > 0 ? `${d}d ${hms}` : hms
}

const isAdminPath = () => window.location.pathname.startsWith('/admin')

function applyColor(getState) {
  const root = document.documentElement
  const { promotions, theme } = getState()
  const promo = !isAdminPath() && theme !== 'dark' ? colorPromotion(promotions, Date.now()) : null
  const color = promo?.accent_color || null
  if (root.dataset.promoColor === (color || '')) return
  root.dataset.promoColor = color || ''
  for (const [name, fn] of Object.entries(BRAND_VARS)) {
    if (color) root.style.setProperty(name, fn(color))
    else root.style.removeProperty(name)
  }
}

export function mountPromoBar({ getState, subscribe, onBoundary, navigate }) {
  const bar = document.createElement('div')
  bar.id = 'promo-bar'
  bar.hidden = true
  document.body.insertBefore(bar, document.body.firstChild)
  let shownKey = ''
  let endsAt = 0

  bar.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-promo-link]')
    if (!link) return
    e.preventDefault()
    e.stopPropagation()
    navigate('/catalog?promo=1')
  })

  const update = () => {
    applyColor(getState)
    const now = Date.now()
    const featured = isAdminPath() ? null : featuredPromotion(getState().promotions, now)
    if (!featured) {
      if (!bar.hidden) { bar.hidden = true; bar.innerHTML = ''; shownKey = '' }
      return
    }
    const { promo, phase } = featured
    const target = Date.parse(phase === 'running' ? promo.ends_at : promo.starts_at)
    if (target <= now) { onBoundary(); return }
    const key = `${promo.id}:${phase}`
    if (key !== shownKey) {
      shownKey = key
      endsAt = target
      const verb = phase === 'running' ? 'termina' : 'empieza'
      const when = DATE_FMT.format(new Date(target))
      bar.className = 'bg-brand text-paper'
      bar.hidden = false
      bar.innerHTML = `
        <div class="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase"
             role="status" aria-live="off" aria-label="${escapeHtml(promo.name)}: ${verb} el ${escapeHtml(when)}">
          <span aria-hidden="true"><strong class="font-semibold">${escapeHtml(promo.name)}</strong>${phase === 'running' ? ` −${promo.discount_pct}%` : ''} &middot; ${verb} en <span data-promo-clock class="tabular-nums">${formatCountdown(target - now)}</span></span>
          ${phase === 'running' ? '<a href="/catalog?promo=1" data-promo-link class="underline underline-offset-4 decoration-paper/50 hover:decoration-paper">Ver promociones</a>' : ''}
        </div>`
      return
    }
    const clock = bar.querySelector('[data-promo-clock]')
    if (clock) clock.textContent = formatCountdown(endsAt - now)
  }

  subscribe(update)
  window.addEventListener('popstate', update)
  setInterval(update, 1000)
  update()
}
