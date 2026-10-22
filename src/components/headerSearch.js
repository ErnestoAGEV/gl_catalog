import { searchProducts, setSearchQuery, getState } from '../store/index.js'
import { navigate } from '../core/router.js'
import { formatMoney } from '../utils/format.js'
import { productPath } from '../utils/productCopy.js'
import { escapeHtml } from '../utils/sanitize.js'
import { isPerfumeCategory } from '../pages/admin/adminProductsData.js'

// Buscador del header: se abre en el mismo header con resultados en vivo.
// Cada vista en cache trae su propio header, asi que todo va por data-attrs
// y delegacion, nunca por id.

const MAX_RESULTS = 6
const SUGGESTIONS = [['Camisas', 'Camisas'], ['Polos', 'Polos'], ['Jeans', 'Pantalones'], ['Perfumes', 'Perfumes']]
const ICON = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>'

export function headerSearchButtons() {
  return `
    <button type="button" data-hsearch-open aria-label="Buscar productos" class="hs-hide md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-fog text-ink hover:bg-ink hover:text-paper transition-colors">
      <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">${ICON}</svg>
    </button>
    <button type="button" data-hsearch-open class="hs-hide hidden md:flex group items-center gap-2 h-10 px-4 rounded-full bg-fog text-ink text-[13px] font-medium hover:bg-ink hover:text-paper transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${ICON}</svg>
      Buscar
    </button>`
}

export function headerSearchForm() {
  return `
    <form data-hsearch-form role="search" class="hs-form flex-1 items-center gap-3 md:mx-10 max-w-[720px] h-11 pl-4 pr-1.5 rounded-full bg-fog border border-ink/10 focus-within:border-ink/40 transition-colors">
      <svg class="w-4 h-4 shrink-0 text-ink/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">${ICON}</svg>
      <input data-hsearch-input type="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="Camisas, jeans, perfumes, una marca…" aria-label="Buscar productos" class="flex-1 min-w-0 bg-transparent text-[16px] md:text-[14px] text-ink placeholder:text-ink/45 focus:outline-none" />
      <button type="button" data-hsearch-close aria-label="Cerrar buscador" class="shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-ink/60 hover:bg-ink hover:text-paper transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="2" d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </form>`
}

export function headerSearchPanel() {
  return `
    <div data-hsearch-panel class="hs-panel absolute left-0 right-0 top-full bg-paper border-b border-ink/10 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.25)]">
      <div class="mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-5 md:py-6 max-h-[calc(100dvh-12rem)] md:max-h-[70vh] overflow-y-auto overscroll-contain" data-hsearch-body></div>
      <p class="sr-only" aria-live="polite" data-hsearch-status></p>
    </div>`
}

function resultRow(p) {
  const img = p.images?.[0]
  const fit = isPerfumeCategory(p.type) ? 'object-contain p-1 bg-white' : 'object-cover'
  const hasDiscount = p.originalPrice && p.originalPrice > p.price
  return `
    <a href="${productPath(p)}" data-hsearch-result class="group flex items-center gap-4 p-2 -m-2 rounded-xl hover:bg-fog focus:bg-fog focus:outline-none transition-colors">
      <span class="shrink-0 w-14 h-[70px] rounded-lg overflow-hidden bg-fog">
        ${img ? `<img src="${img}" alt="" loading="lazy" decoding="async" class="w-full h-full ${fit}" />` : ''}
      </span>
      <span class="min-w-0">
        <span class="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink/50">${escapeHtml(p.type || '')}</span>
        <span class="block mt-1 text-[14px] font-medium text-ink truncate">${escapeHtml(p.name || '')}</span>
        <span class="block mt-0.5 text-[13px] tabular-nums ${hasDiscount ? 'text-brand font-semibold' : 'text-ink/70'}">${formatMoney(p.price)}</span>
      </span>
    </a>`
}

function renderBody(header, rawQuery) {
  const body = header.querySelector('[data-hsearch-body]')
  const status = header.querySelector('[data-hsearch-status]')
  const query = rawQuery.trim()

  if (!query) {
    body.innerHTML = `
      <p class="text-[13px] text-ink/55">Lo más buscado</p>
      <div class="mt-3 flex flex-wrap gap-2">
        ${SUGGESTIONS.map(([label, cat]) => `<a href="/categoria/${cat}" data-hsearch-cat class="inline-flex items-center h-9 px-4 rounded-full border border-ink/15 text-[13px] font-medium text-ink hover:bg-ink hover:text-paper hover:border-ink transition-colors">${label}</a>`).join('')}
      </div>`
    status.textContent = ''
    return
  }

  if (getState().isLoading && !getState().products.length) {
    body.innerHTML = '<p class="text-[14px] text-ink/60">Cargando productos…</p>'
    return
  }

  const results = searchProducts(query)
  const safe = escapeHtml(query)
  status.textContent = results.length ? `${results.length} resultados` : 'Sin resultados'

  if (!results.length) {
    body.innerHTML = `
      <p class="text-[15px] text-ink">Nada para “${safe}”.</p>
      <p class="mt-1 text-[14px] text-ink/60">Prueba con otra palabra o revisa <a href="/catalog" data-hsearch-cat class="ul-link text-ink">todo el catálogo</a>.</p>`
    return
  }

  body.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
      ${results.slice(0, MAX_RESULTS).map(resultRow).join('')}
    </div>
    <div class="mt-6 pt-5 border-t border-ink/10 flex items-center justify-between gap-4">
      <span class="hidden sm:inline text-[13px] text-ink/55 tabular-nums">${results.length} ${results.length === 1 ? 'producto' : 'productos'}</span>
      <button type="button" data-hsearch-all class="w-full sm:w-auto justify-center whitespace-nowrap inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-paper text-[14px] font-semibold hover:bg-brand transition-colors">
        ${results.length > MAX_RESULTS ? `Ver los ${results.length} resultados` : 'Ver en el catálogo'}
        <span aria-hidden="true">→</span>
      </button>
    </div>`
}

function openSearch(header) {
  if (header.classList.contains('hs-open')) return
  header.classList.add('hs-open')
  const input = header.querySelector('[data-hsearch-input]')
  header.querySelectorAll('[data-hsearch-open]').forEach(b => b.setAttribute('aria-expanded', 'true'))
  renderBody(header, input.value)
  input.focus()
}

function closeSearch(header, { restoreFocus = false } = {}) {
  if (!header?.classList.contains('hs-open')) return
  header.classList.remove('hs-open')
  header.querySelectorAll('[data-hsearch-open]').forEach(b => b.setAttribute('aria-expanded', 'false'))
  if (restoreFocus) [...header.querySelectorAll('[data-hsearch-open]')].find(b => b.offsetParent)?.focus()
}

function goToCatalog(header) {
  const query = header.querySelector('[data-hsearch-input]').value.trim()
  setSearchQuery(query)
  // El catalogo en cache puede traer filtros viejos que esconderian los resultados
  window.__glForceCatalogRebuild = true
  closeSearch(header)
  navigate('/catalog')
}

let bound = false
export function bindHeaderSearch() {
  if (bound) return
  bound = true
  let timer

  document.addEventListener('click', (e) => {
    const header = e.target.closest?.('header')
    const opener = e.target.closest?.('[data-hsearch-open]')
    if (opener) return openSearch(header)
    if (e.target.closest?.('[data-hsearch-close]')) return closeSearch(header, { restoreFocus: true })
    if (e.target.closest?.('[data-hsearch-all]')) { e.preventDefault(); return goToCatalog(header) }
    if (e.target.closest?.('[data-hsearch-cat]')) { window.__glForceCatalogRebuild = true; return closeSearch(header) }
    if (e.target.closest?.('[data-hsearch-result]')) return closeSearch(header)
    // Clic fuera del header abierto lo cierra
    document.querySelectorAll('header.hs-open').forEach(h => { if (h !== header) closeSearch(h) })
  })

  document.addEventListener('submit', (e) => {
    const form = e.target.closest?.('[data-hsearch-form]')
    if (!form) return
    e.preventDefault()
    goToCatalog(form.closest('header'))
  })

  document.addEventListener('input', (e) => {
    if (!e.target.matches?.('[data-hsearch-input]')) return
    const header = e.target.closest('header')
    clearTimeout(timer)
    timer = setTimeout(() => renderBody(header, e.target.value), 120)
  })

  document.addEventListener('keydown', (e) => {
    const header = e.target.closest?.('header.hs-open')
    if (!header) return
    if (e.key === 'Escape') { e.preventDefault(); return closeSearch(header, { restoreFocus: true }) }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = [...header.querySelectorAll('[data-hsearch-result]')]
    if (!items.length) return
    e.preventDefault()
    const i = items.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') items[Math.min(i + 1, items.length - 1)].focus()
    else if (i <= 0) header.querySelector('[data-hsearch-input]').focus()
    else items[i - 1].focus()
  })
}
