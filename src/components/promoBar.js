// Franja de cuenta regresiva y color de las promociones de temporada. El color
// solo pinta lo que es de la promo (.promo-bg/.promo-text), no toda la tienda.
// Vive fuera de #app (las vistas se cachean y repintan solas); se actualiza con
// un solo intervalo de 1 s y con cada emit del store. Los precios los cambia
// el temporizador de src/store/promotions.js en el mismo instante.
import { featuredPromotion, colorPromotion } from '../utils/promotions.js'
import { escapeHtml } from '../utils/sanitize.js'

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
  const promo = isAdminPath() ? null : colorPromotion(getState().promotions, Date.now())
  const color = promo?.accent_color || ''
  if (root.dataset.promoColor === color) return
  root.dataset.promoColor = color
  if (color) root.style.setProperty('--color-promo', color)
  else root.style.removeProperty('--color-promo')
}

export function mountPromoBar({ getState, subscribe, navigate }) {
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
    const key = `${promo.id}:${phase}`
    if (key !== shownKey) {
      shownKey = key
      endsAt = target
      const verb = phase === 'running' ? 'termina' : 'empieza'
      const when = DATE_FMT.format(new Date(target))
      bar.className = 'promo-bg text-paper'
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
