import { addToCart, isInWishlist, toggleWishlist, searchProducts, setSearchQuery, getSearchQuery } from '../app/store.js'
import { formatMoney } from '../app/format.js'
import { on, qs } from '../app/dom.js'

function uniqueSorted(values) {
  return Array.from(new Set(values)).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)))
}

function getFilterState(root) {
  const type = qs(root, '[name="type"]')?.value || ''
  const size = qs(root, '[name="size"]')?.value || ''
  const color = qs(root, '[name="color"]')?.value || ''
  const minPrice = qs(root, '[name="minPrice"]')?.value || ''
  const maxPrice = qs(root, '[name="maxPrice"]')?.value || ''
  const sort = qs(root, '[name="sort"]')?.value || ''

  return { type, size, color, minPrice: minPrice ? Number(minPrice) : null, maxPrice: maxPrice ? Number(maxPrice) : null, sort }
}

function applyFilters(products, filters) {
  let result = products.filter((p) => {
    if (filters.type && p.type !== filters.type) return false
    if (filters.size && !(p.sizes || []).includes(filters.size)) return false
    if (filters.color && !(p.colors || []).includes(filters.color)) return false
    if (filters.minPrice != null && p.price < filters.minPrice) return false
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false
    return true
  })
  if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price)
  if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price)
  if (filters.sort === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  return result
}

function getBadgeColor(badge) {
  return { 'Nuevo': 'bg-blue-500', 'Oferta': 'bg-red-500', 'Popular': 'bg-amber-500', 'Premium': 'bg-purple-500' }[badge] || 'bg-gray-700'
}

function renderStars(rating) {
  const full = Math.floor(rating || 0)
  let html = ''
  for (let i = 0; i < 5; i++) {
    html += `<svg class="w-3 h-3 ${i < full ? 'text-amber-400' : 'text-gray-600'}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`
  }
  return html
}

function productCard(p, idx) {
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop'
  const inWishlist = isInWishlist(p.id)
  const sizeOpts = (p.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('')
  const colorOpts = (p.colors || []).map(c => `<option value="${c}">${c}</option>`).join('')

  return `
    <article class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all animate-fade-in" data-product-id="${p.id}" style="animation-delay: ${(idx % 4) * 50}ms">
      <div class="aspect-[3/4] overflow-hidden relative bg-gray-100">
        <img src="${img}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
        <div class="absolute top-2 left-2 flex flex-col gap-1 z-20">
          ${p.badge ? `<span class="px-2 py-1 text-[10px] font-bold ${getBadgeColor(p.badge)} text-white rounded shadow-sm">${p.badge.toUpperCase()}</span>` : ''}
          ${p.originalPrice ? `<span class="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded shadow-sm">-${Math.round((1 - p.price / p.originalPrice) * 100)}%</span>` : ''}
          ${p.stock && p.stock <= 5 ? `<span class="px-2 py-1 text-[10px] font-bold bg-orange-500 text-white rounded shadow-sm badge-pulse">¡Últimas ${p.stock}!</span>` : ''}
        </div>
        <button data-wishlist="${p.id}" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform btn-scale z-10">
          <svg class="w-4 h-4 ${inWishlist ? 'text-red-500' : 'text-gray-400'}" fill="${inWishlist ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
        <button data-quickview="${p.id}" class="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-black/80 backdrop-blur text-white text-xs font-medium rounded-full">Vista rápida</button>
      </div>
      <div class="p-3">
        <div class="flex items-center gap-1 mb-1">${renderStars(p.rating)}<span class="text-[10px] text-gray-500">(${p.reviews || 0})</span></div>
        <h3 class="text-sm font-medium text-gray-900 truncate mb-1">${p.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <p class="text-base font-bold text-gray-900">${formatMoney(p.price)}</p>
          ${p.originalPrice ? `<p class="text-xs text-gray-400 line-through">${formatMoney(p.originalPrice)}</p>` : ''}
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
          <select class="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700 focus:border-gray-400 focus:outline-none" name="size">${sizeOpts}</select>
          <select class="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700 focus:border-gray-400 focus:outline-none" name="color">${colorOpts}</select>
        </div>
        <button data-add-to-cart data-product-id="${p.id}" class="w-full flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 active:scale-[0.98] transition-all btn-scale" type="button">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Agregar
        </button>
      </div>
    </article>
  `
}

function quickViewModal(p) {
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop'
  const sizeOpts = (p.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('')
  const colorOpts = (p.colors || []).map(c => `<option value="${c}">${c}</option>`).join('')

  return `
    <div id="quick-view-modal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto animate-slide-up">
        <div class="relative">
          <img src="${img}" alt="${p.name}" class="w-full aspect-square object-cover"/>
          <button id="close-quickview" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          ${p.badge ? `<span class="absolute top-4 left-4 px-3 py-1 text-xs font-bold ${getBadgeColor(p.badge)} text-white rounded">${p.badge.toUpperCase()}</span>` : ''}
        </div>
        <div class="p-5">
          <div class="flex items-center gap-1 mb-2">${renderStars(p.rating)}<span class="text-xs text-gray-500">(${p.reviews || 0} reseñas)</span></div>
          <h2 class="text-xl font-bold text-gray-900 mb-1">${p.name}</h2>
          <p class="text-sm text-gray-500 mb-3">${p.type}</p>
          <div class="flex items-center gap-3 mb-4">
            <span class="text-2xl font-bold text-gray-900">${formatMoney(p.price)}</span>
            ${p.originalPrice ? `<span class="text-lg text-gray-400 line-through">${formatMoney(p.originalPrice)}</span>` : ''}
          </div>
          ${p.stock && p.stock <= 5 ? `<div class="flex items-center gap-2 mb-4 text-orange-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><span class="text-sm font-medium">¡Solo quedan ${p.stock} unidades!</span></div>` : ''}
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div><label class="block text-xs text-gray-500 mb-1">Talla</label><select id="qv-size" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">${sizeOpts}</select></div>
            <div><label class="block text-xs text-gray-500 mb-1">Color</label><select id="qv-color" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">${colorOpts}</select></div>
          </div>
          <button id="qv-add-to-cart" data-product-id="${p.id}" class="w-full flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors btn-scale">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  `
}

export function pageCatalog(state) {
  const types = uniqueSorted(state.products.map((p) => p.type))
  const sizes = uniqueSorted(state.products.flatMap((p) => p.sizes || []))
  const colors = uniqueSorted(state.products.flatMap((p) => p.colors || []))

  const options = (items, label) => [`<option value="">${label}</option>`, ...items.map((x) => `<option value="${x}">${x}</option>`)].join('')

  return {
    title: 'Catálogo | G&L',
    html: `
      <section class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <a href="#/" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              Inicio
            </a>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Catálogo</h1>
          </div>
          <span id="product-count" class="text-sm text-gray-500 dark:text-gray-400">${state.products.length} productos</span>
        </div>
      </section>

      <section class="mb-5 space-y-3">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">Ordenar:</span>
          <select name="sort" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">
            <option value="">Relevancia</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="rating">Mejor calificados</option>
          </select>
        </div>
        <div class="overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
          <div class="flex gap-2 min-w-max">
            <select name="type" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">${options(types, 'Tipo')}</select>
            <select name="size" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">${options(sizes, 'Talla')}</select>
            <select name="color" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">${options(colors, 'Color')}</select>
            <input name="minPrice" inputmode="numeric" type="number" min="0" class="w-24 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none" placeholder="Min $" />
            <input name="maxPrice" inputmode="numeric" type="number" min="0" class="w-24 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none" placeholder="Max $" />
          </div>
        </div>
      </section>

      <section>
        <div id="catalog-grid" class="grid grid-cols-2 gap-3 stagger-children"></div>
      </section>

      <div id="modal-container"></div>
      <div id="toast-container" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"></div>

      <a href="#/cart" class="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-brand text-white pl-4 pr-5 py-3 shadow-lg hover:bg-brand-dark hover:scale-105 active:scale-95 transition-all z-20 font-medium text-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        Ver carrito
      </a>
    `,
    onMount(root) {
      const grid = qs(root, '#catalog-grid')
      const productCountEl = qs(root, '#product-count')
      const modalContainer = qs(root, '#modal-container')
      const toastContainer = qs(root, '#toast-container')

      const showToast = (message) => {
        const toast = document.createElement('div')
        toast.className = 'toast-enter bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2'
        toast.innerHTML = `<svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>${message}`
        toastContainer.appendChild(toast)
        setTimeout(() => { toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 300) }, 2000)
      }

      const renderGrid = () => {
        const filters = getFilterState(root)
        const searchQuery = getSearchQuery()
        
        // Start with search results if there's a query, otherwise all products
        let baseProducts = searchQuery ? searchProducts(searchQuery) : state.products
        const visible = applyFilters(baseProducts, filters)
        
        const searchLabel = searchQuery ? ` para "${searchQuery}"` : ''
        productCountEl.textContent = `${visible.length} productos${searchLabel}`

        if (visible.length === 0) {
          grid.innerHTML = `<div class="col-span-2 text-center py-16"><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No encontramos productos</h3><p class="text-gray-500 dark:text-gray-400 text-sm">${searchQuery ? `No hay resultados para "${searchQuery}". ` : ''}Intenta con otros filtros</p>${searchQuery ? `<button id="clear-search" class="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700">Limpiar búsqueda</button>` : ''}</div>`
          
          const clearBtn = grid.querySelector('#clear-search')
          if (clearBtn) {
            clearBtn.addEventListener('click', () => {
              setSearchQuery('')
              renderGrid()
            })
          }
          return
        }
        grid.innerHTML = visible.map((p, idx) => productCard(p, idx)).join('')
      }

      setTimeout(renderGrid, 100)
      on(root, 'change', 'select,input[name="minPrice"],input[name="maxPrice"]', () => renderGrid())

      on(root, 'click', '[data-wishlist]', (ev, btn) => {
        ev.preventDefault()
        ev.stopPropagation()
        const productId = btn.dataset.wishlist
        const wasIn = isInWishlist(productId)
        toggleWishlist(productId)
        const svg = btn.querySelector('svg')
        svg.classList.add('heart-pop')
        setTimeout(() => svg.classList.remove('heart-pop'), 300)
        svg.classList.toggle('text-red-500', !wasIn)
        svg.classList.toggle('text-gray-400', wasIn)
        svg.setAttribute('fill', !wasIn ? 'currentColor' : 'none')
        showToast(!wasIn ? 'Agregado a favoritos' : 'Eliminado de favoritos')
      })

      on(root, 'click', '[data-quickview]', (ev, btn) => {
        const product = state.products.find(p => p.id === btn.dataset.quickview)
        if (!product) return
        modalContainer.innerHTML = quickViewModal(product)
        document.body.style.overflow = 'hidden'
        const closeModal = () => { modalContainer.innerHTML = ''; document.body.style.overflow = '' }
        modalContainer.querySelector('#close-quickview').addEventListener('click', closeModal)
        modalContainer.querySelector('#quick-view-modal').addEventListener('click', (e) => { if (e.target.id === 'quick-view-modal') closeModal() })
        modalContainer.querySelector('#qv-add-to-cart').addEventListener('click', () => {
          const size = modalContainer.querySelector('#qv-size').value
          const color = modalContainer.querySelector('#qv-color').value
          addToCart({ productId: product.id, size, color, qty: 1 })
          showToast('Producto agregado al carrito')
          closeModal()
        })
      })

      on(root, 'click', '[data-add-to-cart]', (ev, btn) => {
        const id = btn.getAttribute('data-product-id')
        const card = btn.closest('article')
        const size = card?.querySelector('select[name="size"]')?.value || ''
        const color = card?.querySelector('select[name="color"]')?.value || ''
        addToCart({ productId: id, size, color, qty: 1 })
        const originalHtml = btn.innerHTML
        btn.innerHTML = '✓ Agregado'
        btn.classList.add('bg-brand')
        btn.classList.remove('bg-black')
        showToast('Producto agregado al carrito')
        setTimeout(() => { btn.innerHTML = originalHtml; btn.classList.remove('bg-brand'); btn.classList.add('bg-black') }, 1500)
      })
    },
  }
}
