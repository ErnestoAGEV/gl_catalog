import { searchProducts, setSearchQuery, getSearchQuery, subscribe, getState } from '../app/store.js'
import { formatMoney } from '../app/format.js'
import { on, qs } from '../app/dom.js'
import { navigate } from '../app/router.js'
import { uniqueSorted, getFilterState, applyFilters, getCategoryOrder } from './catalogFilters.js'
import { skeletonGrid, productCard } from './catalogCard.js'
import { handleQuickAdd } from './catalogQuickAdd.js'
import { escapeHtml } from '../app/sanitize.js'
import { BRAND } from '../app/config.js'

const TYPE_DESCRIPTIONS = {
  'Camisas': 'Oxford, lino y franela. Cortes slim y regular fit, en hueso, marino y negro.',
  'Pantalones': 'Denim crudo, slim y straight. Marcas premium con costura japonesa.',
  'Jeans': 'Denim crudo, slim y straight. Marcas premium con costura japonesa.',
  'Polos': 'Polos en algod\u00F3n pima \u2014 manga corta, semestre largo. Esenciales del cl\u00F3set.',
  'Chinos': 'Algod\u00F3n peinado, corte slim. Beige, oliva y carb\u00F3n.',
  'Knits': 'Su\u00E9teres en punto de algod\u00F3n. Cuello redondo y half-zip para entretiempos.',
  'Su\u00E9teres': 'Su\u00E9teres en punto de algod\u00F3n. Cuello redondo y half-zip para entretiempos.',
  'Perfumes': 'Eau de parfum amaderado y c\u00EDtrico. Pour Homme, 50 y 100ml.',
  'Playeras': 'Algod\u00F3n premium, corte regular y slim. B\u00E1sicos de temporada.',
  'Shorts': 'Shorts en algod\u00F3n y lino. Perfectos para el verano.',
  'Sudaderas': 'French terry y fleece. Para los d\u00EDas frescos en Colima.',
  'Chamarras': 'Chamarras ligeras y versátiles para entretiempos.',
  'Abrigos': 'Abrigos de corte cl\u00E1sico para el invierno.',
}

export function pageCatalog(initialState) {
  let state = initialState
  let publicProducts = state.products.filter(p => p.badge !== 'Borrador')
  const types = uniqueSorted(publicProducts.map(p => p.type))
  const sizes = uniqueSorted(publicProducts.flatMap(p => p.sizes || []))
  const colors = uniqueSorted(publicProducts.flatMap(p => p.colors || []))

  const options = (items, label) => [`<option value="">${label}</option>`, ...items.map(x => `<option value="${x}">${x}</option>`)].join('')

  // Determine initial category from URL
  const basePath = window.location.pathname
  let initialType = ''
  if (basePath.startsWith('/categoria/')) {
    initialType = decodeURIComponent(basePath.split('/categoria/')[1]) || ''
  }

  // Hero content
  const heroH1 = initialType
    ? `Solo<br/><span class="text-brand">${initialType}</span>.`
    : `Todo el<br/><span class="text-brand">cat\u00E1logo</span>.`
  const heroDesc = initialType
    ? (TYPE_DESCRIPTIONS[initialType] || `Explora nuestra selecci\u00F3n de ${initialType.toLowerCase()}.`)
    : 'Camisas, denim, polos, knits y fragancias. Curadas en Colima \u2014 al mejor precio.'

  // Build category chips from actual data, ordered by the DB category order
  const categoryOrder = getCategoryOrder()
  const sortedTypes = [...types].sort((a, b) => {
    const ai = categoryOrder.indexOf(a)
    const bi = categoryOrder.indexOf(b)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  const chipHtml = sortedTypes.map(t =>
    `<button class="chip flex-shrink-0${initialType === t ? ' active' : ''}" data-cat="${t}">${t}</button>`
  ).join('')

  return {
    title: 'Cat\u00E1logo | G&L',
    noPaddingTop: true,
    fullWidth: true,
    forceLight: true,
    html: `
      <!-- HERO HEADER -->
      <section class="py-8 md:py-16 lg:py-20 border-b border-ink/10">
        <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10">
          <div class="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
            <a href="/" class="font-mono text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-ink/55 hover:text-ink">Inicio</a>
            <span class="text-ink/30">/</span>
            <span class="font-mono text-[10px] md:text-[11px] tracking-[0.28em] uppercase">Cat\u00E1logo</span>
            <span class="h-px flex-1 bg-ink/15 mx-2 md:mx-3 hidden md:block"></span>
            <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/55 hidden md:inline" id="hero-meta">O/I '26 \u00B7 ${publicProducts.length} piezas</span>
          </div>
          <div class="grid grid-cols-12 gap-4 md:gap-6 lg:gap-10 items-end">
            <div class="col-span-12 lg:col-span-9">
              <h1 id="hero-h1" class="font-display font-extrabold text-[clamp(40px,10vw,184px)] leading-[0.88] tracking-[-0.04em]">${heroH1}</h1>
            </div>
            <div class="col-span-12 lg:col-span-3 lg:text-right mt-3 lg:mt-0">
              <p id="hero-desc" class="text-[14px] md:text-[15px] text-ink/70 max-w-[360px] lg:ml-auto leading-relaxed">${heroDesc}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- STICKY TOOLBAR -->
      <section id="catalog-toolbar" class="sticky top-[68px] md:top-[68px] z-30 bg-paper/95 backdrop-blur-md border-b border-ink/10 toolbar-shadow">
        <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 py-2.5 md:py-4">
          <!-- Top row: chips + sort -->
          <div class="flex items-center gap-2 md:gap-3">
            <!-- Category chips (horizontal scroll on mobile, wrap on desktop) -->
            <div class="flex items-center gap-1.5 md:gap-2 overflow-x-auto md:overflow-visible md:flex-wrap hide-scrollbar flex-1 -mx-1 px-1" id="cat-chips">
              <button class="chip flex-shrink-0${!initialType ? ' active' : ''}" data-cat="">Todo \u00B7 <span class="opacity-60 ml-1" id="totalCount">${publicProducts.length}</span></button>
              ${chipHtml}
            </div>
            <!-- Sort + filters button -->
            <div class="relative flex items-center gap-1.5 flex-shrink-0">
              <select id="sortSelect" class="bare chip pr-8 text-[10px] md:text-[11px]" style="background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%22%230A0A0F%22 stroke-width=%221.6%22 viewBox=%220 0 24 24%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M6 9l6 6 6-6%22/></svg>'); background-repeat:no-repeat; background-position:right 10px center; background-size:10px;">
                <option value="">Destacados</option>
                <option value="price-asc">Precio \u2191</option>
                <option value="price-desc">Precio \u2193</option>
              </select>
              <button id="open-filters-btn" class="chip flex-shrink-0 md:hidden relative" title="Filtros">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h18M7 12h10m-6 8h2"/></svg>
                <span id="filters-badge-mobile" class="hidden absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-brand text-paper text-[9px] font-bold flex items-center justify-center px-1"></span>
              </button>
            </div>
          </div>
          <!-- Secondary meta row (hidden on mobile) -->
          <div class="hidden md:flex mt-3 items-center gap-3 flex-wrap font-mono text-[11px] tracking-[0.22em] uppercase text-ink/55">
            <span id="resultCount">${publicProducts.length} resultados</span>
            <span class="opacity-40">\u00B7</span>
            <span id="sizeRange">Tallas S \u2192 XXL</span>
            <span class="opacity-40">\u00B7</span>
            <span id="priceRange">$0 \u2014 $0</span>
            <a href="#" id="open-filters-link" class="ml-auto ul-link text-ink hover:text-brand">Filtros avanzados<span id="filters-badge-desktop" class="hidden ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-brand text-paper text-[9px] font-bold px-1 relative top-[-1px]"></span> \u2192</a>
          </div>
          <!-- Mobile result count (compact) -->
          <div class="flex md:hidden mt-1.5 items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">
            <span id="resultCountMobile">${publicProducts.length} resultados</span>
            <a href="#" id="open-filters-link-mobile" class="text-ink/60 hover:text-brand flex items-center gap-1">Filtros<span id="filters-badge-mobile-text" class="hidden min-w-[14px] h-[14px] rounded-full bg-brand text-paper text-[8px] font-bold flex items-center justify-center px-0.5"></span> \u2192</a>
          </div>
          <!-- Search bar (below toolbar on mobile, inline on desktop) -->
          <div class="mt-2 md:mt-3 relative" id="search-container">
            <div class="flex items-center w-full h-9 md:h-10 rounded-full border border-ink/10 bg-fog/50 px-3 md:px-4 gap-2">
              <svg class="w-3.5 h-3.5 md:w-4 md:h-4 text-ink/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="search" id="catalog-search" class="flex-1 bg-transparent focus:outline-none text-[12px] md:text-[13px] font-mono min-w-0" autocomplete="off" placeholder="Buscar..." value="${getSearchQuery() || ''}" aria-label="Buscar productos" />
            </div>
            <div id="search-suggestions" class="absolute top-full mt-2 left-0 right-0 max-h-[60vh] overflow-y-auto bg-paper border border-ink/10 rounded-md shadow-2xl z-[60] hidden flex-col"></div>
          </div>
        </div>
      </section>

      <!-- Hidden filter controls (desktop + mobile) -->
      <div class="hidden" id="toolbar-controls">
        <select name="type">${options(types, 'Tipo')}</select>
        <select name="size">${options(sizes, 'Talla')}</select>
        <select name="color">${options(colors, 'Color')}</select>
        <input name="minPrice" inputmode="numeric" type="number" min="0" placeholder="Min $" />
        <input name="maxPrice" inputmode="numeric" type="number" min="0" placeholder="Max $" />
        <select name="sort" id="sort-select">
          <option value="">Ordenar</option>
          <option value="price-asc">Precio \u2191</option>
          <option value="price-desc">Precio \u2193</option>
        </select>
      </div>

      <!-- Mobile bottom sheet filter panel -->
      <div id="filter-controls-mobile" class="bottom-sheet">
        <div class="bg-paper rounded-t-2xl pt-6 px-6 pb-8">
          <h3 class="font-display font-extrabold text-[28px] tracking-[-0.03em] mb-6">Filtros</h3>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <select name="type" class="h-11 rounded-full border border-ink/10 px-4 font-mono text-[12px]">${options(types, 'Tipo')}</select>
            <select name="size" class="h-11 rounded-full border border-ink/10 px-4 font-mono text-[12px]">${options(sizes, 'Talla')}</select>
            <select name="color" class="h-11 rounded-full border border-ink/10 px-4 font-mono text-[12px]">${options(colors, 'Color')}</select>
          </div>
          <div class="flex gap-3 mb-6">
            <input name="minPrice" inputmode="numeric" type="number" min="0" placeholder="Precio m\u00EDn." class="flex-1 h-11 rounded-full border border-ink/10 px-4 font-mono text-[12px]" />
            <input name="maxPrice" inputmode="numeric" type="number" min="0" placeholder="Precio m\u00E1x." class="flex-1 h-11 rounded-full border border-ink/10 px-4 font-mono text-[12px]" />
          </div>
          <div class="sheet-actions flex gap-3">
            <button id="close-filters" type="button" class="flex-1 h-12 rounded-full bg-fog hover:bg-ink hover:text-paper text-[13px] font-semibold transition-colors">Cerrar</button>
            <button id="reset-filters-mobile" type="button" class="flex-1 h-12 rounded-full bg-ink text-paper hover:bg-brand text-[13px] font-semibold transition-colors">Limpiar</button>
          </div>
        </div>
      </div>
      <div id="sheet-backdrop" class="sheet-backdrop"></div>

      <!-- PRODUCT GRID -->
      <section class="py-8 md:py-12 lg:py-16">
        <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10">
          <div id="catalog-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-4 gap-y-8 md:gap-y-12 lg:gap-y-16"></div>

          <!-- Empty state -->
          <div id="empty-state" class="hidden py-24 text-center">
            <div class="font-display font-extrabold text-[48px] md:text-[64px] outline-text leading-none">Sin resultados</div>
            <p id="empty-msg" class="mt-4 text-ink/60">Intenta con otra categor\u00EDa.</p>
            <button id="clear-search-btn" class="hidden mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-paper text-[14px] font-semibold hover:bg-brand transition-colors">Limpiar b\u00FAsqueda</button>
          </div>

          <!-- Load more -->
          <div id="load-more-container" class="hidden mt-10 md:mt-16">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div class="font-mono text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-ink/55 order-2 md:order-1" id="page-caption"></div>
              <button id="load-more-btn" class="group inline-flex items-center gap-3 bg-ink text-paper px-6 md:px-8 h-12 md:h-14 rounded-full text-[13px] md:text-[14px] font-semibold hover:bg-brand transition-colors order-1 md:order-2">
                Cargar m\u00E1s
                <span class="arrow-walk inline-block">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M11 19l-7-7 7-7" transform="rotate(-90 12 12)"/></svg>
                </span>
              </button>
              <div class="font-mono text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-ink/55 order-3" id="remaining-caption"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- EDITORIAL ASESORIA BLOCK -->
      <section class="bg-brand text-paper py-12 md:py-20 lg:py-28">
        <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10">
          <div class="grid grid-cols-12 gap-3 md:gap-6">
            <div class="col-span-12 md:col-span-3 mb-2 md:mb-0">
              <div class="font-mono text-[10px] md:text-[11px] tracking-[0.32em] uppercase opacity-70">\u00A7 \u2014 Asesor\u00EDa</div>
            </div>
            <div class="col-span-12 md:col-span-9">
              <p class="font-display font-medium text-[22px] md:text-[clamp(28px,3.4vw,48px)] leading-[1.2] md:leading-[1.1] tracking-[-0.02em] md:tracking-[-0.03em]">
                \u00BFNo est\u00E1s seguro de la talla? <span class="opacity-70">M\u00E1ndanos un WhatsApp con tu medida de pecho y cintura \u2014 te decimos en minutos qu\u00E9 te queda.</span>
              </p>
              <a href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener noreferrer" class="mt-5 md:mt-8 inline-flex items-center gap-3 text-[13px] md:text-[14px] font-semibold ul-link">
                Hablar por WhatsApp
                <span class="arrow-walk inline-block">\u2192</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div id="quick-add-container"></div>
    `,
    onMount(root) {
      const grid = qs(root, '#catalog-grid')
      const loadMoreContainer = qs(root, '#load-more-container')
      const loadMoreBtn = qs(root, '#load-more-btn')
      const emptyState = qs(root, '#empty-state')
      const emptyMsg = qs(root, '#empty-msg')
      const clearSearchBtn = qs(root, '#clear-search-btn')

      // ── Cursor init ──
      if (!window.matchMedia('(pointer: coarse)').matches) {
        if (!document.querySelector('.cursor-dot')) {
          const dot = document.createElement('div')
          dot.className = 'cursor-dot'
          const ring = document.createElement('div')
          ring.className = 'cursor-ring'
          document.body.appendChild(dot)
          document.body.appendChild(ring)
        }
        document.body.classList.add('catalog')

        const dot = document.querySelector('.cursor-dot')
        const ring = document.querySelector('.cursor-ring')
        let rx = 0, ry = 0, tx = 0, ty = 0
        const onMouse = (e) => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; tx = e.clientX; ty = e.clientY }
        window.addEventListener('mousemove', onMouse)
        function tick() { rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; root.__cursorRaf = requestAnimationFrame(tick) }
        tick()

        root.__cursorCleanup = () => {
          window.removeEventListener('mousemove', onMouse)
          if (root.__cursorRaf) cancelAnimationFrame(root.__cursorRaf)
          document.body.classList.remove('catalog', 'cursor-hover', 'cursor-text')
        }
      }

      function bindCursor() {
        if (window.matchMedia('(pointer: coarse)').matches) return
        const addHover = () => document.body.classList.add('cursor-hover')
        const removeHover = () => document.body.classList.remove('cursor-hover')
        const addText = () => document.body.classList.add('cursor-text')
        const removeText = () => document.body.classList.remove('cursor-text')
        root.querySelectorAll('a, button, .chip, .qa-btn, [data-cursor-hover]').forEach(el => {
          el.removeEventListener('mouseenter', addHover)
          el.removeEventListener('mouseleave', removeHover)
          el.addEventListener('mouseenter', addHover)
          el.addEventListener('mouseleave', removeHover)
        })
        root.querySelectorAll('input, textarea, select').forEach(el => {
          el.removeEventListener('mouseenter', addText)
          el.removeEventListener('mouseleave', removeText)
          el.addEventListener('mouseenter', addText)
          el.addEventListener('mouseleave', removeText)
        })
      }

      // ── Reveal on scroll ──
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
      }, { threshold: 0.1 })
      root.querySelectorAll('.reveal').forEach(el => io.observe(el))

      // ── Catalog state persistence ──
      const CATALOG_STATE_KEY = 'gl_catalog_state'
      let savedCatalogState = null
      try {
        const raw = sessionStorage.getItem(CATALOG_STATE_KEY)
        if (raw) {
          sessionStorage.removeItem(CATALOG_STATE_KEY)
          savedCatalogState = JSON.parse(raw)
        }
      } catch { /* ignore */ }

      const saveCatalogStateWithScroll = () => {
        try {
          const scroll = window.scrollY || document.documentElement.scrollTop || 0
          const filters = {
            type: root.querySelector('#toolbar-controls select[name="type"]')?.value || '',
            size: root.querySelector('#toolbar-controls select[name="size"]')?.value || '',
            color: root.querySelector('#toolbar-controls select[name="color"]')?.value || '',
            minPrice: root.querySelector('#toolbar-controls input[name="minPrice"]')?.value || '',
            maxPrice: root.querySelector('#toolbar-controls input[name="maxPrice"]')?.value || '',
            sort: root.querySelector('#sort-select')?.value || '',
          }
          sessionStorage.setItem(CATALOG_STATE_KEY, JSON.stringify({ scroll, filters, currentPage }))
        } catch { /* ignore */ }
      }

      // Restore filters to hidden controls
      const restoreFilters = (filters) => {
        if (!filters) return
        if (filters.type) root.querySelectorAll('select[name="type"]').forEach(s => { s.value = filters.type })
        if (filters.size) root.querySelectorAll('select[name="size"]').forEach(s => { s.value = filters.size })
        if (filters.color) root.querySelectorAll('select[name="color"]').forEach(s => { s.value = filters.color })
        if (filters.minPrice) root.querySelectorAll('input[name="minPrice"]').forEach(i => { i.value = filters.minPrice })
        if (filters.maxPrice) root.querySelectorAll('input[name="maxPrice"]').forEach(i => { i.value = filters.maxPrice })
        if (filters.sort) { const s = root.querySelector('#sort-select'); if (s) s.value = filters.sort }
      }

      // ── Pagination ──
      const PRODUCTS_PER_PAGE = 20
      let currentPage = 1
      let allFilteredProducts = []

      // ── Render ──
      const renderGrid = (options = {}) => {
        const filters = getFilterState(root)
        const searchQuery = getSearchQuery()

        if (state.isLoading) {
          grid.innerHTML = skeletonGrid(8)
          loadMoreContainer.classList.add('hidden')
          emptyState.classList.add('hidden')
          return
        }

        // Update filter options dynamically
        const currentTypes = uniqueSorted(publicProducts.map(p => p.type))
        const currentSizes = uniqueSorted(publicProducts.flatMap(p => p.sizes || []))
        const currentColors = uniqueSorted(publicProducts.flatMap(p => p.colors || []))
        root.querySelectorAll('select[name="type"]').forEach(sel => {
          const curr = sel.value
          sel.innerHTML = `<option value="">Tipo</option>${currentTypes.map(x => `<option value="${x}">${x}</option>`).join('')}`
          if (curr && currentTypes.includes(curr)) sel.value = curr
        })
        root.querySelectorAll('select[name="size"]').forEach(sel => {
          const curr = sel.value
          sel.innerHTML = `<option value="">Talla</option>${currentSizes.map(x => `<option value="${x}">${x}</option>`).join('')}`
          if (curr && currentSizes.includes(curr)) sel.value = curr
        })
        root.querySelectorAll('select[name="color"]').forEach(sel => {
          const curr = sel.value
          sel.innerHTML = `<option value="">Color</option>${currentColors.map(x => `<option value="${x}">${x}</option>`).join('')}`
          if (curr && currentColors.includes(curr)) sel.value = curr
        })

        if (options.resetPage) currentPage = 1

        // Filter products
        let baseProducts = searchQuery ? searchProducts(searchQuery) : publicProducts
        const multiTypeFilter = grid.dataset.multiTypeFilter
        if (multiTypeFilter) {
          const allowedTypes = multiTypeFilter.split(',')
          baseProducts = baseProducts.filter(p => allowedTypes.includes(p.type))
          allFilteredProducts = applyFilters(baseProducts, { ...filters, type: '' })
        } else {
          allFilteredProducts = applyFilters(baseProducts, filters)
        }

        // Update UI meta
        updateMeta()

        if (allFilteredProducts.length === 0) {
          grid.innerHTML = ''
          grid.classList.add('hidden')
          emptyState.classList.remove('hidden')
          loadMoreContainer.classList.add('hidden')
          const safeQuery = escapeHtml(searchQuery)
          const f = getFilterState(root)
          const hasActiveFilters = !!(f.type || f.size || f.color || f.minPrice || f.maxPrice)
          if (safeQuery) {
            emptyMsg.innerHTML = `No hay resultados para \u201C${safeQuery}\u201D. Intenta con otros filtros.`
            clearSearchBtn.classList.remove('hidden')
          } else if (hasActiveFilters) {
            emptyMsg.textContent = 'No hay productos con estos filtros.'
            clearSearchBtn.classList.remove('hidden')
          } else {
            emptyMsg.textContent = 'Intenta con otra categor\u00EDa.'
            clearSearchBtn.classList.add('hidden')
          }
          return
        }

        grid.classList.remove('hidden')
        emptyState.classList.add('hidden')

        const productsToShow = currentPage * PRODUCTS_PER_PAGE
        const visible = allFilteredProducts.slice(0, productsToShow)
        const hasMore = productsToShow < allFilteredProducts.length

        grid.innerHTML = visible.map((p, idx) => productCard(p, idx)).join('')

        if (hasMore) {
          loadMoreContainer.classList.remove('hidden')
          const remaining = allFilteredProducts.length - visible.length
          const pageCaption = root.querySelector('#page-caption')
          const remainingCaption = root.querySelector('#remaining-caption')
          if (pageCaption) pageCaption.textContent = `P\u00E1gina ${currentPage} \u00B7 ${visible.length} de ${allFilteredProducts.length}`
          if (remainingCaption) remainingCaption.textContent = `${remaining} piezas m\u00E1s`
        } else {
          loadMoreContainer.classList.add('hidden')
        }

        bindCursor()
      }

      // Update toolbar meta info
      function updateMeta() {
        const activeType = root.querySelector('#toolbar-controls select[name="type"]')?.value || ''
        const count = allFilteredProducts.length
        const searchQuery = getSearchQuery()

        // Result count
        const resultEl = root.querySelector('#resultCount')
        const resultElMobile = root.querySelector('#resultCountMobile')
        if (resultEl) {
          let text = `${count} ${count === 1 ? 'resultado' : 'resultados'}`
          if (activeType) text += ` \u00B7 ${activeType}`
          if (searchQuery) text += ` \u00B7 "${searchQuery}"`
          resultEl.textContent = text
        }
        if (resultElMobile) {
          let mtext = `${count} resultado${count !== 1 ? 's' : ''}`
          if (activeType) mtext += ` \u00B7 ${activeType}`
          resultElMobile.textContent = mtext
        }

        // Total count chip
        const totalEl = root.querySelector('#totalCount')
        if (totalEl) totalEl.textContent = publicProducts.length

        // Hero meta
        const heroMeta = root.querySelector('#hero-meta')
        if (heroMeta) heroMeta.textContent = `O/I '26 \u00B7 ${publicProducts.length} piezas`

        // Price range
        if (allFilteredProducts.length > 0) {
          const prices = allFilteredProducts.map(p => p.price)
          const min = Math.min(...prices)
          const max = Math.max(...prices)
          const priceEl = root.querySelector('#priceRange')
          if (priceEl) priceEl.textContent = `${formatMoney(min)} \u2014 ${formatMoney(max)}`
        }

        // Size range
        if (allFilteredProducts.length > 0) {
          const allSizes = uniqueSorted(allFilteredProducts.flatMap(p => p.sizes || []))
          const sizeEl = root.querySelector('#sizeRange')
          if (sizeEl && allSizes.length > 0) {
            sizeEl.textContent = `Tallas ${allSizes[0]} \u2192 ${allSizes[allSizes.length - 1]}`
          }
        }

        // Advanced filter badges (size, color, minPrice, maxPrice)
        const f = getFilterState(root)
        const advancedCount = [f.size, f.color, f.minPrice, f.maxPrice].filter(Boolean).length

        const badgeMobile = root.querySelector('#filters-badge-mobile')
        const badgeDesktop = root.querySelector('#filters-badge-desktop')
        const badgeMobileText = root.querySelector('#filters-badge-mobile-text')

        if (badgeMobile) {
          if (advancedCount > 0) { badgeMobile.textContent = advancedCount; badgeMobile.classList.remove('hidden') }
          else { badgeMobile.classList.add('hidden') }
        }
        if (badgeDesktop) {
          if (advancedCount > 0) { badgeDesktop.textContent = advancedCount; badgeDesktop.classList.remove('hidden') }
          else { badgeDesktop.classList.add('hidden') }
        }
        if (badgeMobileText) {
          if (advancedCount > 0) { badgeMobileText.textContent = advancedCount; badgeMobileText.classList.remove('hidden') }
          else { badgeMobileText.classList.add('hidden') }
        }
      }

      // ── Chip filters ──
      on(root, 'click', '[data-cat]', (ev, btn) => {
        ev.preventDefault()
        ev.stopPropagation()
        root.querySelectorAll('#cat-chips .chip').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        const val = btn.dataset.cat || ''

        // Sync to hidden select
        root.querySelectorAll('select[name="type"]').forEach(s => { s.value = val })
        // Clear multi-type
        delete grid.dataset.multiTypeFilter

        // URL sync
        const path = val ? `/categoria/${encodeURIComponent(val)}` : '/catalog'
        window.history.replaceState(null, '', path)

        // Update hero
        const h1 = root.querySelector('#hero-h1')
        const desc = root.querySelector('#hero-desc')
        if (h1) h1.innerHTML = val ? `Solo<br/><span class="text-brand">${val}</span>.` : `Todo el<br/><span class="text-brand">cat\u00E1logo</span>.`
        if (desc) desc.textContent = val ? (TYPE_DESCRIPTIONS[val] || `Explora nuestra selecci\u00F3n de ${val.toLowerCase()}.`) : 'Camisas, denim, polos, knits y fragancias. Curadas en Colima \u2014 al mejor precio.'

        renderGrid({ resetPage: true })
      })

      // ── Sort ──
      const sortSelect = root.querySelector('#sortSelect')
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          // Sync to hidden sort select
          const sortHidden = root.querySelector('#sort-select')
          if (sortHidden) sortHidden.value = sortSelect.value
          renderGrid({ resetPage: true })
        })
      }

      // ── Filter sheet (works on all breakpoints) ──
      const mobilePanel = root.querySelector('#filter-controls-mobile')
      const sheetBackdrop = root.querySelector('#sheet-backdrop')
      const openSheet = () => {
        if (mobilePanel) { mobilePanel.classList.add('open', 'force-show') }
        if (sheetBackdrop) { sheetBackdrop.classList.add('open', 'force-show') }
        document.body.style.overflow = 'hidden'
      }
      const closeSheet = () => {
        if (mobilePanel) { mobilePanel.classList.remove('open', 'force-show') }
        if (sheetBackdrop) { sheetBackdrop.classList.remove('open', 'force-show') }
        document.body.style.overflow = ''
      }

      root.querySelector('#open-filters-link')?.addEventListener('click', (e) => { e.preventDefault(); openSheet() })
      root.querySelector('#open-filters-link-mobile')?.addEventListener('click', (e) => { e.preventDefault(); openSheet() })
      root.querySelector('#open-filters-btn')?.addEventListener('click', () => openSheet())
      root.querySelector('#close-filters')?.addEventListener('click', closeSheet)
      sheetBackdrop?.addEventListener('click', closeSheet)

      // Reset filters (mobile)
      root.querySelector('#reset-filters-mobile')?.addEventListener('click', () => {
        root.querySelectorAll('select[name="type"], select[name="size"], select[name="color"], #sort-select, #sortSelect').forEach(sel => sel.selectedIndex = 0)
        root.querySelectorAll('input[name="minPrice"], input[name="maxPrice"]').forEach(inp => { inp.value = '' })
        setSearchQuery('')
        const si = root.querySelector('#catalog-search')
        if (si) si.value = ''
        delete grid.dataset.multiTypeFilter
        // Reset chips
        root.querySelectorAll('#cat-chips .chip').forEach(b => b.classList.remove('active'))
        root.querySelector('#cat-chips .chip[data-cat=""]')?.classList.add('active')
        // Reset hero
        const h1 = root.querySelector('#hero-h1')
        const desc = root.querySelector('#hero-desc')
        if (h1) h1.innerHTML = `Todo el<br/><span class="text-brand">cat\u00E1logo</span>.`
        if (desc) desc.textContent = 'Camisas, denim, polos, knits y fragancias. Curadas en Colima \u2014 al mejor precio.'
        window.history.replaceState(null, '', '/catalog')
        closeSheet()
        renderGrid({ resetPage: true })
      })

      // Clear search button (empty state) — reset everything
      clearSearchBtn.addEventListener('click', () => {
        root.querySelectorAll('select[name="type"], select[name="size"], select[name="color"], #sort-select, #sortSelect').forEach(sel => sel.selectedIndex = 0)
        root.querySelectorAll('input[name="minPrice"], input[name="maxPrice"]').forEach(inp => { inp.value = '' })
        setSearchQuery('')
        const si = root.querySelector('#catalog-search')
        if (si) si.value = ''
        delete grid.dataset.multiTypeFilter
        root.querySelectorAll('#cat-chips .chip').forEach(b => b.classList.remove('active'))
        root.querySelector('#cat-chips .chip[data-cat=""]')?.classList.add('active')
        const h1 = root.querySelector('#hero-h1')
        const desc = root.querySelector('#hero-desc')
        if (h1) h1.innerHTML = `Todo el<br/><span class="text-brand">cat\u00E1logo</span>.`
        if (desc) desc.textContent = 'Camisas, denim, polos, knits y fragancias. Curadas en Colima \u2014 al mejor precio.'
        window.history.replaceState(null, '', '/catalog')
        renderGrid({ resetPage: true })
      })

      // ── Filter change (from mobile sheet selects) ──
      on(root, 'change', '#filter-controls-mobile select, #filter-controls-mobile input', (ev, el) => {
        const name = el.getAttribute('name')
        const val = el.value
        // Sync across all panels
        root.querySelectorAll(`[name="${name}"]`).forEach(s => { if (s !== el) s.value = val })
        delete grid.dataset.multiTypeFilter

        if (name === 'type') {
          const path = val ? `/categoria/${encodeURIComponent(val)}` : '/catalog'
          window.history.replaceState(null, '', path)
          // Sync chip
          root.querySelectorAll('#cat-chips .chip').forEach(b => b.classList.remove('active'))
          const matchChip = root.querySelector(`#cat-chips .chip[data-cat="${val}"]`)
          if (matchChip) matchChip.classList.add('active')
          else root.querySelector('#cat-chips .chip[data-cat=""]')?.classList.add('active')
        }

        renderGrid({ resetPage: true })
      })

      // ── Search ──
      const searchInput = root.querySelector('#catalog-search')
      const searchSuggestions = root.querySelector('#search-suggestions')
      const searchContainer = root.querySelector('#search-container')

      if (searchInput && searchSuggestions) {
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            searchSuggestions.classList.add('hidden')
            setSearchQuery(e.target.value.trim())
            renderGrid({ resetPage: true })
            searchInput.blur()
          }
        })

        let searchTimeout
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.trim()
          if (query.length < 2) { searchSuggestions.classList.add('hidden'); return }
          clearTimeout(searchTimeout)
          searchTimeout = setTimeout(() => {
            const results = searchProducts(query).filter(p => p.badge !== 'Borrador')
            if (results.length > 0) {
              const top = results.slice(0, 5)
              searchSuggestions.innerHTML = top.map(p => `
                <a href="/producto/${p.id}" class="flex items-center gap-3 p-3 hover:bg-fog transition-colors suggestion-link">
                  <img src="${p.images?.[0] || ''}" loading="lazy" class="w-12 h-[60px] object-cover rounded flex-shrink-0 bg-fog" alt="${p.name}">
                  <div class="flex-1 min-w-0">
                    <p class="font-display font-semibold text-[14px] text-ink truncate">${p.name}</p>
                    <p class="font-mono text-[12px] text-brand mt-0.5">${formatMoney(p.price)}</p>
                  </div>
                </a>
              `).join('')
              searchSuggestions.querySelectorAll('.suggestion-link').forEach(link => {
                link.addEventListener('click', (ev) => {
                  ev.preventDefault()
                  saveCatalogStateWithScroll()
                  navigate(link.getAttribute('href'))
                })
              })
              searchSuggestions.classList.remove('hidden')
              searchSuggestions.classList.add('flex')
            } else {
              searchSuggestions.innerHTML = '<div class="p-4 text-center font-mono text-[12px] text-ink/55">No se encontraron sugerencias</div>'
              searchSuggestions.classList.remove('hidden')
            }
          }, 150)
        })

        document.addEventListener('click', (e) => {
          if (!searchContainer.contains(e.target)) searchSuggestions.classList.add('hidden')
        })
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') { searchSuggestions.classList.add('hidden'); searchInput.blur() }
        })
        searchInput.addEventListener('focus', () => {
          if (searchInput.value.trim().length >= 2 && searchSuggestions.innerHTML.trim()) {
            searchSuggestions.classList.remove('hidden')
          }
        })
      }

      // ── Load more ──
      loadMoreBtn.addEventListener('click', () => {
        currentPage++
        const productsToShow = currentPage * PRODUCTS_PER_PAGE
        const visible = allFilteredProducts.slice(0, productsToShow)
        const hasMore = productsToShow < allFilteredProducts.length
        const newProducts = allFilteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, productsToShow)
        grid.insertAdjacentHTML('beforeend', newProducts.map((p, idx) => productCard(p, (currentPage - 1) * PRODUCTS_PER_PAGE + idx)).join(''))
        if (hasMore) {
          const remaining = allFilteredProducts.length - visible.length
          const pageCaption = root.querySelector('#page-caption')
          const remainingCaption = root.querySelector('#remaining-caption')
          if (pageCaption) pageCaption.textContent = `P\u00E1gina ${currentPage} \u00B7 ${visible.length} de ${allFilteredProducts.length}`
          if (remainingCaption) remainingCaption.textContent = `${remaining} piezas m\u00E1s`
        } else {
          loadMoreContainer.classList.add('hidden')
        }
        bindCursor()
      })

      // ── Store subscribe ──
      let restoringState = Boolean(savedCatalogState)
      const unsubscribe = subscribe((newState) => {
        state = newState
        publicProducts = state.products.filter(p => p.badge !== 'Borrador')
        if (!restoringState) renderGrid()
      })

      // ── Initial render + state restore ──
      setTimeout(() => {
        if (savedCatalogState?.filters) restoreFilters(savedCatalogState.filters)
        if (savedCatalogState?.currentPage) currentPage = savedCatalogState.currentPage

        renderGrid()

        // Sync chip to restored/initial type filter
        const activeType = root.querySelector('#toolbar-controls select[name="type"]')?.value || ''
        if (activeType) {
          root.querySelectorAll('#cat-chips .chip').forEach(b => b.classList.remove('active'))
          const matchChip = root.querySelector(`#cat-chips .chip[data-cat="${activeType}"]`)
          if (matchChip) matchChip.classList.add('active')
        }

        if (savedCatalogState?.scroll != null && savedCatalogState.scroll > 10) {
          const targetY = savedCatalogState.scroll
          requestAnimationFrame(() => {
            window.scrollTo({ top: targetY, behavior: 'instant' })
            document.documentElement.scrollTop = targetY
            document.body.scrollTop = targetY
            setTimeout(() => {
              window.scrollTo({ top: targetY, behavior: 'instant' })
              document.documentElement.scrollTop = targetY
              document.body.scrollTop = targetY
              restoringState = false
            }, 350)
          })
        } else {
          restoringState = false
        }
      }, 100)

      // ── Pending quickview from home ──
      const pendingQv = sessionStorage.getItem('gl_pending_quickview')
      if (pendingQv) {
        sessionStorage.removeItem('gl_pending_quickview')
        setTimeout(() => {
          const btn = root.querySelector(`[data-quickview="${pendingQv}"]`)
          if (btn) btn.click()
        }, 200)
      }

      // ── Deep link backward compat ──
      const params = new URLSearchParams(window.location.search)
      const pId = params.get('p')
      if (pId) { navigate(`/producto/${pId}`); return }

      // ── Type filter from sessionStorage or URL ──
      const pendingTypeFilter = sessionStorage.getItem('gl_pending_type_filter')
      let urlTypeFilter = null
      if (basePath.startsWith('/categoria/')) {
        urlTypeFilter = decodeURIComponent(basePath.split('/categoria/')[1]) || null
      }
      const filterToApply = pendingTypeFilter || urlTypeFilter
      if (filterToApply) {
        if (pendingTypeFilter) sessionStorage.removeItem('gl_pending_type_filter')
        const filterTypes = filterToApply.split(',').map(t => t.trim())
        if (filterTypes.length === 1) {
          root.querySelectorAll('select[name="type"]').forEach(sel => { sel.value = filterTypes[0] })
          // Sync chip
          root.querySelectorAll('#cat-chips .chip').forEach(b => b.classList.remove('active'))
          const matchChip = root.querySelector(`#cat-chips .chip[data-cat="${filterTypes[0]}"]`)
          if (matchChip) matchChip.classList.add('active')
          else root.querySelector('#cat-chips .chip[data-cat=""]')?.classList.add('active')
          renderGrid({ resetPage: true })
        } else {
          grid.dataset.multiTypeFilter = filterTypes.join(',')
          renderGrid({ resetPage: true })
        }
      }

      // ── Card/quickview clicks ──
      on(root, 'click', 'a[href^="/producto/"]', () => saveCatalogStateWithScroll())

      on(root, 'click', '[data-quickview]', (ev, btn) => {
        ev.preventDefault()
        ev.stopPropagation()
        const product = publicProducts.find(p => p.id === btn.dataset.quickview)
        if (!product) return
        saveCatalogStateWithScroll()
        navigate(`/producto/${product.id}`)
      })

      on(root, 'click', '[data-quick-add]', (ev, btn) => {
        const quickAddContainer = root.querySelector('#quick-add-container')
        handleQuickAdd(ev, btn, quickAddContainer)
      })

      // ── Cleanup ──
      return () => {
        unsubscribe()
        if (root.__cursorCleanup) root.__cursorCleanup()
      }
    },
  }
}
