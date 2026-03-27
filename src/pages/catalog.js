import { addToCart, searchProducts, setSearchQuery, getSearchQuery, cartCount, subscribe, trackProductView, getState } from '../app/store.js'
import { on, qs } from '../app/dom.js'
import { showToast } from '../app/toast.js'
import { uniqueSorted, getFilterState, applyFilters } from './catalogFilters.js'
import { skeletonGrid, productCard } from './catalogCard.js'
import { quickViewModal } from './catalogModals.js'
import { initCarousels, initModalCarousel, initModalZoom } from './catalogCarousels.js'
import { handleQuickAdd } from './catalogQuickAdd.js'
import { escapeHtml } from '../app/sanitize.js'

export function pageCatalog(initialState) {
  let state = initialState
  let publicProducts = state.products.filter(p => p.badge !== 'Borrador')
  const types = uniqueSorted(publicProducts.map((p) => p.type))
  const sizes = uniqueSorted(publicProducts.flatMap((p) => p.sizes || []))
  const colors = uniqueSorted(publicProducts.flatMap((p) => p.colors || []))

  const options = (items, label) => [`<option value="">${label}</option>`, ...items.map((x) => `<option value="${x}">${x}</option>`)].join('')

  const isDark = state.theme === 'dark'

  return {
    title: 'Catálogo | G&L',
    noPaddingTop: true,
    html: `
      <!-- Catalog Control Bar -->
      <div id="catalog-control-bar" class="bg-white dark:bg-black border-b border-black/5 dark:border-white/5 -mx-3 md:-mx-4 px-3 md:px-4 py-2.5 md:py-3">
        <div class="flex flex-col gap-2.5">
          <!-- Search row -->
          <div class="flex items-center gap-2">
            <div class="search-pill flex-1">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="search" id="catalog-search" placeholder="Buscar productos..." value="${getSearchQuery() || ''}" aria-label="Buscar productos" />
            </div>
            <div class="toolbar-actions">
              <button id="open-filters" class="toolbar-btn md:hidden">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h18M7 12h10m-6 8h2"/></svg>
                <span id="filters-count" class="count-badge hidden"></span>
              </button>
              <select name="sort" id="sort-select" class="toolbar-btn appearance-none cursor-pointer pr-6 bg-no-repeat bg-right" style="background-image: url('data:image/svg+xml;utf8,<svg fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 9l-7 7-7-7\"/></svg>'); background-size: 12px; background-position: right 8px center;">
                <option value="">Ordenar</option>
                <option value="price-asc">Precio ↑</option>
                <option value="price-desc">Precio ↓</option>
              </select>
            </div>
          </div>

          <!-- Filters row (desktop) -->
          <div class="toolbar-controls hidden md:flex" id="toolbar-controls">
            <div class="filters-inline hide-scrollbar">
              <select name="type">${options(types, 'Tipo')}</select>
              <select name="size">${options(sizes, 'Talla')}</select>
              <select name="color">${options(colors, 'Color')}</select>
              <input name="minPrice" inputmode="numeric" type="number" min="0" placeholder="Min $" />
              <input name="maxPrice" inputmode="numeric" type="number" min="0" placeholder="Max $" />
            </div>
            <span id="product-count" class="ml-auto text-xs font-semibold text-gray-400">${publicProducts.length} productos</span>
            <button id="reset-filters" class="hidden toolbar-btn" style="height:36px;padding:0 12px;font-size:12px;font-weight:600;">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div id="filter-controls-mobile" class="md:hidden bottom-sheet">
        <h3>Filtros</h3>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <select name="type">${options(types, 'Tipo')}</select>
          <select name="size">${options(sizes, 'Talla')}</select>
          <select name="color">${options(colors, 'Color')}</select>
        </div>
        <div class="flex gap-2 mb-2">
          <input name="minPrice" inputmode="numeric" type="number" min="0" placeholder="Precio mín." />
          <input name="maxPrice" inputmode="numeric" type="number" min="0" placeholder="Precio máx." />
        </div>
        <div class="sheet-actions">
          <button id="close-filters" type="button">Cerrar</button>
          <button id="reset-filters-mobile" type="button">Limpiar</button>
        </div>
      </div>

      <div id="sheet-backdrop" class="sheet-backdrop md:hidden"></div>

      <!-- Active filter chips -->
      <div id="active-chips" class="hidden flex-wrap gap-1.5 pb-2 px-3 md:px-0"></div>

      <!-- Spacer for product count (mobile) + grid -->
      <div class="md:hidden flex items-center justify-between mb-1 mt-1">
        <span id="product-count-mobile" class="text-[11px] font-medium text-gray-400 dark:text-gray-500">${publicProducts.length} productos</span>
      </div>

      <section class="catalog-grid-wrapper">
        <div id="catalog-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4"></div>
        
        <!-- Load More Button -->
        <div id="load-more-container" class="hidden mt-8 text-center">
          <button id="load-more-btn" class="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            Cargar más productos
          </button>
          <p id="showing-count" class="mt-3 text-sm text-gray-500 dark:text-gray-400"></p>
        </div>
      </section>



      <div id="modal-container"></div>

      <a href="#/cart" class="fixed bottom-24 right-4 md:bottom-6 md:right-6 flex items-center gap-2 rounded-full bg-gray-900/80 dark:bg-white/80 backdrop-blur-md text-white dark:text-gray-900 pl-4 pr-5 py-2.5 shadow-lg hover:bg-gray-900 dark:hover:bg-white hover:scale-105 active:scale-95 transition-all z-20 text-xs font-medium">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        Ver carrito
      </a>
    `,
    onMount(root) {
      const grid = qs(root, '#catalog-grid')
      const productCountEl = qs(root, '#product-count')
      const productCountMobile = qs(root, '#product-count-mobile')
      const modalContainer = qs(root, '#modal-container')
      const loadMoreContainer = qs(root, '#load-more-container')
      const loadMoreBtn = qs(root, '#load-more-btn')
      const showingCount = qs(root, '#showing-count')

      // Pagination state
      const PRODUCTS_PER_PAGE = 20
      let currentPage = 1
      let allFilteredProducts = []
      let lastFilters = null

      const renderGrid = () => {
        const filters = getFilterState(root)
        const searchQuery = getSearchQuery()
        
        // Show loading state
        if (state.isLoading) {
          if (productCountEl) productCountEl.textContent = ''
          if (productCountMobile) productCountMobile.textContent = 'Cargando...'
          grid.innerHTML = skeletonGrid(8)
          loadMoreContainer.classList.add('hidden')
          return
        }

        // Update filter options dynamically based on current products
          const types = uniqueSorted(publicProducts.map((p) => p.type))
          const sizes = uniqueSorted(publicProducts.flatMap((p) => p.sizes || []))
          const colors = uniqueSorted(publicProducts.flatMap((p) => p.colors || []))
        // Sync all select elements (both desktop and mobile panels)
        root.querySelectorAll('select[name="type"]').forEach(sel => {
          const curr = sel.value
          sel.innerHTML = `<option value="">Tipo</option>${types.map(x => `<option value="${x}">${x}</option>`).join('')}`
          if (curr && types.includes(curr)) sel.value = curr
        })
        root.querySelectorAll('select[name="size"]').forEach(sel => {
          const curr = sel.value
          sel.innerHTML = `<option value="">Talla</option>${sizes.map(x => `<option value="${x}">${x}</option>`).join('')}`
          if (curr && sizes.includes(curr)) sel.value = curr
        })
        root.querySelectorAll('select[name="color"]').forEach(sel => {
          const curr = sel.value
          sel.innerHTML = `<option value="">Color</option>${colors.map(x => `<option value="${x}">${x}</option>`).join('')}`
          if (curr && colors.includes(curr)) sel.value = curr
        })

        // Check if filters actually changed
        const currentFilters = JSON.stringify({ ...filters, searchQuery })
        const filtersChanged = lastFilters !== currentFilters
        lastFilters = currentFilters
        
        // Start with search results if there's a query, otherwise all products
          let baseProducts = searchQuery ? searchProducts(searchQuery) : publicProducts
        // Check for multi-type filter (set when navigating from home category cards)
        const multiTypeFilter = grid.dataset.multiTypeFilter
        if (multiTypeFilter) {
          const allowedTypes = multiTypeFilter.split(',')
          baseProducts = baseProducts.filter(p => allowedTypes.includes(p.type))
          allFilteredProducts = applyFilters(baseProducts, { ...filters, type: '' })
        } else {
          allFilteredProducts = applyFilters(baseProducts, filters)
        }
        
        // Only reset to page 1 when filters/search actually change
        if (filtersChanged) {
          currentPage = 1
        }
        
        const searchLabel = searchQuery ? ` para "${searchQuery}"` : ''
        const countText = `${allFilteredProducts.length} productos${searchLabel}`
        if (productCountEl) productCountEl.textContent = countText
        if (productCountMobile) productCountMobile.textContent = countText

        // Update filter chips and badges
        updateFilterUI()

        if (allFilteredProducts.length === 0) {
          const safeQuery = escapeHtml(searchQuery)
          grid.innerHTML = `<div class="col-span-full text-center py-16"><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No encontramos productos</h3><p class="text-gray-500 dark:text-gray-400 text-sm">${safeQuery ? `No hay resultados para "${safeQuery}". ` : ''}Intenta con otros filtros</p>${safeQuery ? `<button id="clear-search" class="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700">Limpiar búsqueda</button>` : ''}</div>`
          loadMoreContainer.classList.add('hidden')
          
          const clearBtn = grid.querySelector('#clear-search')
          if (clearBtn) {
            clearBtn.addEventListener('click', () => {
              setSearchQuery('')
              const si = qs(root, '#catalog-search')
              if (si) si.value = ''
              renderGrid()
            })
          }
          return
        }
        
        // Calculate how many products to show
        const productsToShow = currentPage * PRODUCTS_PER_PAGE
        const visible = allFilteredProducts.slice(0, productsToShow)
        const hasMore = productsToShow < allFilteredProducts.length
        
        grid.innerHTML = visible.map((p, idx) => productCard(p, idx)).join('')
        
        // Show/hide load more button
        if (hasMore) {
          loadMoreContainer.classList.remove('hidden')
          const remaining = allFilteredProducts.length - visible.length
          showingCount.textContent = `Mostrando ${visible.length} de ${allFilteredProducts.length} productos`
        } else {
          loadMoreContainer.classList.add('hidden')
        }
        
        // Initialize carousels for products with multiple images
        initCarousels(grid.querySelectorAll('[data-carousel]'))
      }



      // ── Filter panel & chip logic ──
      const openFiltersBtn = qs(root, '#open-filters')
      const filtersCount = qs(root, '#filters-count')
      const mobilePanel = qs(root, '#filter-controls-mobile')
      const resetBtn = qs(root, '#reset-filters')
      const resetBtnMobile = qs(root, '#reset-filters-mobile')
      const closeFilters = qs(root, '#close-filters')
      const sheetBackdrop = qs(root, '#sheet-backdrop')
      const chipsContainer = qs(root, '#active-chips')
      const toolbar = qs(root, '#catalog-control-bar')
      const toolbarControls = qs(root, '#toolbar-controls')
      const sortLabelEl = root.querySelector('#sort-label')

      const openSheet = (sheet) => {
        if (!sheet) return
        sheet.classList.add('open')
        sheetBackdrop?.classList.add('open')
        document.body.style.overflow = 'hidden'
      }
      const closeSheet = (sheet) => {
        if (!sheet) return
        sheet.classList.remove('open')
        const anyOpen = [...root.querySelectorAll('.bottom-sheet')].some((s) => s.classList.contains('open'))
        if (!anyOpen) {
          sheetBackdrop?.classList.remove('open')
          document.body.style.overflow = ''
        }
      }

      openFiltersBtn?.addEventListener('click', () => openSheet(mobilePanel))
      closeFilters?.addEventListener('click', () => closeSheet(mobilePanel))
      sheetBackdrop?.addEventListener('click', () => {
        closeSheet(mobilePanel)
      })

      // Active filter chip labels
      const chipLabels = { type: 'Tipo', size: 'Talla', color: 'Color', minPrice: 'Mín', maxPrice: 'Máx', sort: 'Orden' }
      const sortLabels = { 'price-asc': 'Menor precio', 'price-desc': 'Mayor precio' }

      function updateFilterUI() {
        const f = getFilterState(root)
        const activeCount = [f.type, f.size, f.color, f.minPrice, f.maxPrice, f.sort].filter(Boolean).length

        if (filtersCount) {
          if (activeCount > 0) {
            filtersCount.classList.remove('hidden')
            filtersCount.textContent = activeCount
          } else {
            filtersCount.classList.add('hidden')
            filtersCount.textContent = ''
          }
        }

        if (sortLabelEl) {
          sortLabelEl.textContent = sortLabels[f.sort] || 'Relevancia'
        }

        // Contextual reset buttons (show only when filters active)
        if (resetBtn) resetBtn.classList.toggle('hidden', activeCount === 0)
        if (resetBtn) resetBtn.classList.toggle('flex', activeCount > 0)
        if (resetBtnMobile) resetBtnMobile.classList.toggle('hidden', activeCount === 0)

        // Active filter chips
        if (chipsContainer) {
          const chips = []
          if (f.type) chips.push({ key: 'type', label: f.type })
          if (f.size) chips.push({ key: 'size', label: `Talla ${f.size}` })
          if (f.color) chips.push({ key: 'color', label: f.color })
          if (f.minPrice) chips.push({ key: 'minPrice', label: `Desde $${f.minPrice}` })
          if (f.maxPrice) chips.push({ key: 'maxPrice', label: `Hasta $${f.maxPrice}` })
          if (f.sort) chips.push({ key: 'sort', label: sortLabels[f.sort] || f.sort })

          if (chips.length > 0) {
            chipsContainer.classList.remove('hidden')
            chipsContainer.classList.add('flex')
            chipsContainer.innerHTML = chips.map(c => `
              <button data-remove-filter="${c.key}" class="inline-flex items-center gap-1 rounded-full bg-brand/10 dark:bg-brand/20 text-brand text-[11px] font-medium px-2.5 py-1 hover:bg-brand/20 dark:hover:bg-brand/30 transition-colors">
                ${c.label}
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            `).join('')
          } else {
            chipsContainer.classList.add('hidden')
            chipsContainer.classList.remove('flex')
            chipsContainer.innerHTML = ''
          }
        }
      }

      // Dismiss individual filter chip
      on(root, 'click', '[data-remove-filter]', (ev, btn) => {
        const key = btn.dataset.removeFilter
        // Clear matching controls in both desktop and mobile panels
        root.querySelectorAll(`select[name="${key}"]`).forEach(s => s.selectedIndex = 0)
        root.querySelectorAll(`input[name="${key}"]`).forEach(i => { i.value = '' })
        renderGrid()
      })

      // Reset all filters
      function resetAllFilters() {
        root.querySelectorAll('select[name="type"], select[name="size"], select[name="color"], select[name="sort"]').forEach(sel => sel.selectedIndex = 0)
        root.querySelectorAll('input[name="minPrice"], input[name="maxPrice"]').forEach(inp => { inp.value = '' })
        setSearchQuery('')
        const si = qs(root, '#catalog-search')
        if (si) si.value = ''
        // Close mobile panel
        if (mobilePanel) closeSheet(mobilePanel)
        renderGrid()
      }
      if (resetBtn) resetBtn.addEventListener('click', resetAllFilters)
      if (resetBtnMobile) resetBtnMobile.addEventListener('click', resetAllFilters)

      // Listen for search input changes (catalog-local search bar)
      const searchInput = qs(root, '#catalog-search')
      if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            setSearchQuery(e.target.value.trim())
            renderGrid()
          }
        })
        let searchTimeout
        searchInput.addEventListener('input', (e) => {
          clearTimeout(searchTimeout)
          searchTimeout = setTimeout(() => {
            setSearchQuery(e.target.value.trim())
            renderGrid()
          }, 300)
        })
      }

      // Load More button click handler
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
          currentPage++
          
          // Calculate products to show
          const productsToShow = currentPage * PRODUCTS_PER_PAGE
          const visible = allFilteredProducts.slice(0, productsToShow)
          const hasMore = productsToShow < allFilteredProducts.length
          
          // Append new products to grid
          const newProducts = allFilteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, productsToShow)
          grid.insertAdjacentHTML('beforeend', newProducts.map((p, idx) => productCard(p, (currentPage - 1) * PRODUCTS_PER_PAGE + idx)).join(''))
          
          // Update counter and button visibility
          if (hasMore) {
            showingCount.textContent = `Mostrando ${visible.length} de ${allFilteredProducts.length} productos`
          } else {
            loadMoreContainer.classList.add('hidden')
          }
          
          // Re-initialize carousels for newly added products
          initCarousels(grid.querySelectorAll('[data-carousel]'))
        })
      }

      // Subscribe to store changes (crucial for reload scenario)
      const unsubscribe = subscribe((newState) => {
        state = newState
        publicProducts = state.products.filter(p => p.badge !== 'Borrador')
        renderGrid()
      })

      setTimeout(renderGrid, 100)

      // Auto-open quick view if navigated from home
      const pendingQv = sessionStorage.getItem('gl_pending_quickview')
      if (pendingQv) {
        sessionStorage.removeItem('gl_pending_quickview')
        setTimeout(() => {
          const btn = root.querySelector(`[data-quickview="${pendingQv}"]`)
          if (btn) btn.click()
        }, 200)
      }

      // Auto-open via URL parameter (Deeps Linking Share)
      const hashParts = window.location.hash.split('?')
      if (hashParts.length > 1) {
        const params = new URLSearchParams(hashParts[1])
        const pId = params.get('p')
        if (pId) {
          setTimeout(() => {
            const btn = root.querySelector(`[data-quickview="${pId}"]`)
            if (btn) btn.click()
            // Clean up the URL quietly without triggering a router reload
            history.replaceState(null, '', window.location.pathname + '#/catalog')
          }, 300)
        }
      }

      // Apply category filter if navigated from home category cards
      const pendingTypeFilter = sessionStorage.getItem('gl_pending_type_filter')
      if (pendingTypeFilter) {
        sessionStorage.removeItem('gl_pending_type_filter')
        const types = pendingTypeFilter.split(',').map(t => t.trim())
        if (types.length === 1) {
          // Single type: set the select directly
          root.querySelectorAll('select[name="type"]').forEach(sel => {
            sel.value = types[0]
          })
          renderGrid()
        } else {
          // Multiple types (e.g. Playeras + Polos): override applyFilters for this render
          // Store the multi-type filter in a custom attribute on the grid
          grid.dataset.multiTypeFilter = types.join(',')
          renderGrid()
        }
      }

      on(root, 'change', 'select[name="type"],select[name="size"],select[name="color"],select[name="sort"],input[name="minPrice"],input[name="maxPrice"]', (ev, el) => {
        // Sync the same filter across desktop and mobile panels
        const name = el.getAttribute('name')
        const val = el.value
        root.querySelectorAll(`[name="${name}"]`).forEach(s => { if (s !== el) s.value = val })
        // Clear multi-type filter when user manually changes filters
        delete grid.dataset.multiTypeFilter
        renderGrid()
      })

      on(root, 'click', '[data-quickview]', (ev, btn) => {
        const product = publicProducts.find(p => p.id === btn.dataset.quickview)
        if (!product) return
        trackProductView(product.id)
        modalContainer.innerHTML = quickViewModal(product)
        document.body.style.overflow = 'hidden'
        
        const closeModal = () => { 
          // Reset size button selections
          modalContainer.querySelectorAll('.qv-size-btn').forEach(btn => {
            btn.classList.remove('qv-size-selected', 'border-brand', 'bg-brand', 'text-white', '!border-brand', '!bg-brand', '!text-white')
          })
          
          // Reset zoom state
          modalContainer.querySelectorAll('.modal-img-zoomable').forEach(img => {
            img.style.transform = ''
            img.style.transformOrigin = ''
          })
          
          // Reset container cursor styles
          const containers = modalContainer.querySelectorAll('[data-modal-carousel], [data-modal-single]')
          containers.forEach(c => { c.style.cursor = '' })
          
          // Clear modal and restore scroll
          modalContainer.innerHTML = ''
          document.body.style.overflow = ''
        }
        modalContainer.querySelector('#close-quickview')?.addEventListener('click', closeModal)
        modalContainer.querySelector('#quick-view-modal')?.addEventListener('click', (e) => { if (e.target.id === 'quick-view-modal') closeModal() })
        
        const shareBtn = modalContainer.querySelector('#share-quickview')
        if (shareBtn) {
          shareBtn.addEventListener('click', () => {
            const shareUrl = window.location.origin + window.location.pathname + '#/catalog?p=' + product.id
            if (navigator.share) {
              navigator.share({
                title: product.name,
                text: '¡Mira este producto en G&L!',
                url: shareUrl
              }).catch(console.error)
            } else {
              navigator.clipboard.writeText(shareUrl)
              showToast('Enlace copiado al portapapeles')
            }
          })
        }
        
        // Initialize modal carousel and zoom (extracted modules)
        initModalCarousel(modalContainer.querySelector('[data-modal-carousel]'))
        initModalZoom(modalContainer)
        
        // Size button selection logic
        const sizeButtons = modalContainer.querySelectorAll('.qv-size-btn')
        sizeButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            // Remove selection from all buttons
            sizeButtons.forEach(b => {
              b.classList.remove('qv-size-selected', 'border-brand', 'bg-brand', 'text-white', '!border-brand', '!bg-brand', '!text-white')
              b.classList.add('border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300')
            })
            // Add selection to clicked button
            btn.classList.add('qv-size-selected', '!border-brand', '!bg-brand', '!text-white')
            btn.classList.remove('border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300', 'hover:text-brand')
            
            // Enable add-to-cart button
            const qvAddBtn = modalContainer.querySelector('#qv-add-to-cart')
            if (qvAddBtn) {
              qvAddBtn.disabled = false
              qvAddBtn.classList.remove('opacity-50', 'cursor-not-allowed')
            }
          })
        })
        
        const qvAddBtn = modalContainer.querySelector('#qv-add-to-cart')
        
        // Disable button initially if product has sizes but none selected
        if (product.sizes && product.sizes.length > 0) {
          qvAddBtn.disabled = true
          qvAddBtn.classList.add('opacity-50', 'cursor-not-allowed')
        }
        
        qvAddBtn.addEventListener('click', () => {
          if (qvAddBtn.disabled) return
          qvAddBtn.disabled = true
          
          // Get selected size from button
          const selectedSizeBtn = modalContainer.querySelector('.qv-size-selected')
          const size = selectedSizeBtn ? selectedSizeBtn.dataset.size : ''
          
          // Get color from dropdown if it exists
          const colorSelect = modalContainer.querySelector('#qv-color')
          const color = colorSelect ? colorSelect.value : ''
          
          addToCart({ productId: product.id, size, color, qty: 1 })
          
          // El contador del carrito se actualiza globalmente desde store.js -> startApp.js
          closeModal()
        })
      })

      on(root, 'click', '[data-quick-add]', (ev, btn) => handleQuickAdd(ev, btn, modalContainer))

      // Return cleanup function
      return unsubscribe
    },
  }
}
