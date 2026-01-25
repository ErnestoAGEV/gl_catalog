import { addToCart, searchProducts, setSearchQuery, getSearchQuery, cartCount, subscribe } from '../app/store.js'
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
  return result
}

function getBadgeColor(badge) {
  return { 'Nuevo': 'bg-blue-500', 'Oferta': 'bg-red-500', 'Popular': 'bg-amber-500', 'Premium': 'bg-purple-500' }[badge] || 'bg-gray-700'
}

function productCard(p, idx) {
  const images = p.images && p.images.length > 0 
    ? p.images 
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop']
  
  const sizeOpts = (p.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('')
  const colorOpts = (p.colors || []).map(c => `<option value="${c}">${c}</option>`).join('')

  // Carousel HTML (only show controls if more than 1 image)
  const carouselHTML = images.length > 1 ? `
    <div class="carousel-container relative group" data-carousel>
      <div class="carousel-track flex transition-transform duration-300" data-track>
        ${images.map((img, i) => `
          <img src="${img}" alt="${p.name}" class="w-full h-full object-cover flex-shrink-0" loading="lazy" data-slide="${i}"/>
        `).join('')}
      </div>
      
      <!-- Navigation Buttons (show on hover) -->
      <button class="carousel-btn prev absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10" data-prev>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button class="carousel-btn next absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10" data-next>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
      
      <!-- Dots Indicator -->
      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10" data-dots>
        ${images.map((_, i) => `<span class="w-1.5 h-1.5 rounded-full bg-white/60 ${i === 0 ? 'bg-white' : ''}" data-dot="${i}"></span>`).join('')}
      </div>
    </div>
  ` : `
    <img src="${images[0]}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
  `

  return `
    <article class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all" data-product-id="${p.id}">
      <div class="aspect-[3/4] overflow-hidden relative bg-gray-100">
        ${carouselHTML}
        <div class="absolute top-2 left-2 flex flex-col gap-1 z-20">
          ${p.badge ? `<span class="px-2 py-1 text-[10px] font-bold ${getBadgeColor(p.badge)} text-white rounded shadow-sm">${p.badge.toUpperCase()}</span>` : ''}
          ${p.originalPrice ? `<span class="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded shadow-sm">-${Math.round((1 - p.price / p.originalPrice) * 100)}%</span>` : ''}
          ${p.stock && p.stock <= 5 ? `<span class="px-2 py-1 text-[10px] font-bold bg-orange-500 text-white rounded shadow-sm badge-pulse">¡Últimas ${p.stock}!</span>` : ''}
        </div>
        <button data-quickview="${p.id}" class="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-black/80 backdrop-blur text-white text-xs font-medium rounded-full">Vista rápida</button>
      </div>
      <div class="p-3">
        <h3 class="text-sm font-medium text-gray-900 truncate mb-1">${p.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <p class="text-base font-bold text-gray-900">${formatMoney(p.price)}</p>
          ${p.originalPrice ? `<p class="text-xs text-gray-400 line-through">${formatMoney(p.originalPrice)}</p>` : ''}
        </div>
        <div class="flex flex-col gap-2 mb-3">
          <div class="relative">
            <select class="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-8 text-sm text-gray-700 focus:border-gray-400 focus:outline-none appearance-none" data-card-size>
              <option value="" disabled>Talla</option>
              ${sizeOpts}
            </select>
            <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
          <div class="relative">
            <select class="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-8 text-sm text-gray-700 focus:border-gray-400 focus:outline-none appearance-none" data-card-color>
              <option value="" disabled>Color</option>
              ${colorOpts}
            </select>
            <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
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
  const images = p.images && p.images.length > 0 
    ? p.images 
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop']
  
  const sizeOpts = (p.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('')
  const colorOpts = (p.colors || []).map(c => `<option value="${c}">${c}</option>`).join('')
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0

  // Modal carousel HTML (larger version)
  const modalCarouselHTML = images.length > 1 ? `
    <div class="modal-carousel relative overflow-hidden bg-gray-100" data-modal-carousel>
      <div class="modal-carousel-track flex transition-transform duration-300" data-modal-track>
        ${images.map((img, i) => `
          <img src="${img}" alt="${p.name}" class="w-full aspect-[4/5] md:h-full md:aspect-auto object-cover flex-shrink-0" data-modal-slide="${i}"/>
        `).join('')}
      </div>
      
      <!-- Navigation Buttons (Desktop only, minimal on mobile) -->
      <button class="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur text-gray-800 dark:text-white shadow-lg items-center justify-center z-10 hover:bg-white dark:hover:bg-gray-700" data-modal-prev>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button class="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur text-gray-800 dark:text-white shadow-lg items-center justify-center z-10 hover:bg-white dark:hover:bg-gray-700" data-modal-next>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>

      <!-- Mobile Navigation Buttons (Smaller, always visible) -->
      <button class="md:hidden absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur text-gray-800 shadow-md flex items-center justify-center z-10" data-modal-prev>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button class="md:hidden absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur text-gray-800 shadow-md flex items-center justify-center z-10" data-modal-next>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
      
      <!-- Dots (Mobile only) -->
      <div class="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" data-modal-dots>
        ${images.map((_, i) => `<span class="w-1.5 h-1.5 rounded-full bg-white/60 ${i === 0 ? 'bg-white' : ''} shadow-sm" data-modal-dot="${i}"></span>`).join('')}
      </div>
      
      <!-- Thumbnails (Desktop only) -->
      <div class="hidden md:flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-2 z-10" data-modal-thumbs>
        ${images.map((img, i) => `
          <button class="w-12 h-12 rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-white' : 'border-white/40'} hover:border-white transition-colors input-focus" data-modal-thumb="${i}">
            <img src="${img}" alt="Thumb ${i+1}" class="w-full h-full object-cover"/>
          </button>
        `).join('')}
      </div>
      
      <!-- Close button (Responsive) -->
      <button id="close-quickview" class="absolute top-3 right-3 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg flex items-center justify-center text-gray-700 dark:text-white hover:bg-white dark:hover:bg-gray-700 transition-colors z-20">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      
      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
        ${p.badge ? `<span class="px-2.5 py-1 text-[10px] font-bold ${getBadgeColor(p.badge)} text-white rounded-md shadow-sm">${p.badge.toUpperCase()}</span>` : ''}
        ${discount > 0 ? `<span class="px-2.5 py-1 text-[10px] font-bold bg-red-500 text-white rounded-md shadow-sm">-${discount}%</span>` : ''}
      </div>
    </div>
  ` : `
    <div class="relative bg-gray-100">
      <img src="${images[0]}" alt="${p.name}" class="w-full aspect-[4/5] md:h-full md:aspect-auto object-cover"/>
      
      <!-- Close button -->
      <button id="close-quickview" class="absolute top-3 right-3 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg flex items-center justify-center text-gray-700 dark:text-white hover:bg-white dark:hover:bg-gray-700 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      
      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-1.5">
        ${p.badge ? `<span class="px-2.5 py-1 text-[10px] font-bold ${getBadgeColor(p.badge)} text-white rounded-md shadow-sm">${p.badge.toUpperCase()}</span>` : ''}
        ${discount > 0 ? `<span class="px-2.5 py-1 text-[10px] font-bold bg-red-500 text-white rounded-md shadow-sm">-${discount}%</span>` : ''}
      </div>
    </div>
  `

  return `
    <div id="quick-view-modal" class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
      <!-- Mobile: slide from bottom, Desktop: centered modal -->
      <div class="bg-white dark:bg-gray-900 w-full md:w-auto md:max-w-2xl md:mx-4 md:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto md:overflow-hidden animate-slide-up shadow-2xl">
        
        <!-- Desktop: horizontal layout, Mobile: vertical -->
        <div class="md:flex">
          <!-- Image Section -->
          <div class="relative md:w-72 lg:w-80 flex-shrink-0">
            ${modalCarouselHTML}
          </div>
          
          <!-- Content Section -->
          <div class="p-5 md:p-6 flex flex-col md:w-72 lg:w-80">
            <!-- Category -->
            <span class="text-xs font-medium text-brand uppercase tracking-wider mb-1">${p.type}</span>
            
            <!-- Name -->
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">${p.name}</h2>
            
            <!-- Price -->
            <div class="flex items-baseline gap-2 mb-4">
              <span class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">${formatMoney(p.price)}</span>
              ${p.originalPrice ? `<span class="text-base text-gray-400 line-through">${formatMoney(p.originalPrice)}</span>` : ''}
            </div>
            
            <!-- Stock warning -->
            ${p.stock && p.stock <= 5 ? `
              <div class="flex items-center gap-2 mb-4 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <svg class="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span class="text-sm font-medium text-orange-700 dark:text-orange-400">¡Solo quedan ${p.stock} unidades!</span>
              </div>
            ` : ''}
            
            <!-- Selectors -->
            <div class="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Talla</label>
                <div class="relative">
                  <select id="qv-size" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand focus:ring-1 focus:ring-brand appearance-none">
                    ${sizeOpts}
                  </select>
                  <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Color</label>
                <div class="relative">
                  <select id="qv-color" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand focus:ring-1 focus:ring-brand appearance-none">
                    ${colorOpts}
                  </select>
                  <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>
            
            <!-- Add to cart button -->
            <button id="qv-add-to-cart" data-product-id="${p.id}" class="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-dark active:scale-[0.98] transition-all shadow-lg shadow-brand/25">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              Agregar al carrito
            </button>
            
            <!-- Trust badges -->
            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div class="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  Calidad garantizada
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Envío rápido
                </span>
              </div>
            </div>
          </div>
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
    showSearch: true,
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
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-gray-500">Ordenar:</span>
          <select name="sort" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">
            <option value="">Relevancia</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
          </select>
          <button id="reset-filters" class="ml-auto rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Limpiar filtros
          </button>
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
        <div id="catalog-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"></div>
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

      const renderGrid = () => {
        const filters = getFilterState(root)
        const searchQuery = getSearchQuery()
        
        // Show loading state
        if (state.isLoading) {
          productCountEl.textContent = 'Cargando productos...'
          grid.innerHTML = '<div class="col-span-full flex justify-center py-20"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div></div>'
          return
        }

        // Update filter options dynamically based on current products
        const types = uniqueSorted(state.products.map((p) => p.type))
        const sizes = uniqueSorted(state.products.flatMap((p) => p.sizes || []))
        const colors = uniqueSorted(state.products.flatMap((p) => p.colors || []))
        
        const typeSelect = qs(root, 'select[name="type"]')
        const sizeSelect = qs(root, 'select[name="size"]')
        const colorSelect = qs(root, 'select[name="color"]')
        
        if (typeSelect) {
          const currentType = typeSelect.value
          typeSelect.innerHTML = `<option value="">Tipo</option>${types.map(x => `<option value="${x}">${x}</option>`).join('')}`
          if (currentType && types.includes(currentType)) typeSelect.value = currentType
        }
        
        if (sizeSelect) {
          const currentSize = sizeSelect.value
          sizeSelect.innerHTML = `<option value="">Talla</option>${sizes.map(x => `<option value="${x}">${x}</option>`).join('')}`
          if (currentSize && sizes.includes(currentSize)) sizeSelect.value = currentSize
        }
        
        if (colorSelect) {
          const currentColor = colorSelect.value
          colorSelect.innerHTML = `<option value="">Color</option>${colors.map(x => `<option value="${x}">${x}</option>`).join('')}`
          if (currentColor && colors.includes(currentColor)) colorSelect.value = currentColor
        }

        // Start with search results if there's a query, otherwise all products
        let baseProducts = searchQuery ? searchProducts(searchQuery) : state.products
        const visible = applyFilters(baseProducts, filters)
        
        const searchLabel = searchQuery ? ` para "${searchQuery}"` : ''
        productCountEl.textContent = `${visible.length} productos${searchLabel}`

        if (visible.length === 0) {
          grid.innerHTML = `<div class="col-span-full text-center py-16"><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No encontramos productos</h3><p class="text-gray-500 dark:text-gray-400 text-sm">${searchQuery ? `No hay resultados para "${searchQuery}". ` : ''}Intenta con otros filtros</p>${searchQuery ? `<button id="clear-search" class="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700">Limpiar búsqueda</button>` : ''}</div>`
          
          const clearBtn = grid.querySelector('#clear-search')
          if (clearBtn) {
            clearBtn.addEventListener('click', () => {
              setSearchQuery('')
              const searchInput = document.getElementById('global-search')
              if (searchInput) searchInput.value = ''
              renderGrid()
            })
          }
          return
        }
        grid.innerHTML = visible.map((p, idx) => productCard(p, idx)).join('')
        
        // Initialize carousels for products with multiple images
        const carousels = grid.querySelectorAll('[data-carousel]')
        carousels.forEach(carousel => {
          const track = carousel.querySelector('[data-track]')
          const slides = carousel.querySelectorAll('[data-slide]')
          const prevBtn = carousel.querySelector('[data-prev]')
          const nextBtn = carousel.querySelector('[data-next]')
          const dots = carousel.querySelectorAll('[data-dot]')
          
          let currentIndex = 0
          
          const updateCarousel = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`
            dots.forEach((dot, i) => {
              if (i === currentIndex) {
                dot.classList.add('bg-white')
                dot.classList.remove('bg-white/60')
              } else {
                dot.classList.remove('bg-white')
                dot.classList.add('bg-white/60')
              }
            })
          }
          
          prevBtn?.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            currentIndex = (currentIndex - 1 + slides.length) % slides.length
            updateCarousel()
          })
          
          nextBtn?.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            currentIndex = (currentIndex + 1) % slides.length
            updateCarousel()
          })
          
          dots.forEach((dot, i) => {
            dot.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()
              currentIndex = i
              updateCarousel()
            })
          })
        })
      }

      // UPDATE GRID ON STORE CHANGE
      // This is crucial because products load asynchronously.
      // We also update the product count here.
      // Returns cleanup function to startApp.js
      const showToast = (message) => {
        const toast = document.createElement('div')
        toast.className = 'toast-enter bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2'
        toast.innerHTML = `<svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>${message}`
        toastContainer.appendChild(toast)
        setTimeout(() => { toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 300) }, 2000)
      }

      // Reset all filters button
      const resetFiltersBtn = qs(root, '#reset-filters')
      if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
          // Reset all filter selects
          const selects = root.querySelectorAll('select[name="type"], select[name="size"], select[name="color"], select[name="sort"]')
          selects.forEach(sel => sel.selectedIndex = 0)
          
          // Reset price inputs
          const minPrice = qs(root, 'input[name="minPrice"]')
          const maxPrice = qs(root, 'input[name="maxPrice"]')
          if (minPrice) minPrice.value = ''
          if (maxPrice) maxPrice.value = ''
          
          // Clear search query
          setSearchQuery('')
          const searchInput = document.getElementById('global-search')
          if (searchInput) searchInput.value = ''
          
          renderGrid()
        })
      }

      // Listen for search input changes
      const searchInput = document.getElementById('global-search')
      if (searchInput) {
        // Handle Enter key
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            setSearchQuery(e.target.value.trim())
            renderGrid()
          }
        })
        
        // Handle search on input (debounced)
        let searchTimeout
        searchInput.addEventListener('input', (e) => {
          clearTimeout(searchTimeout)
          searchTimeout = setTimeout(() => {
            setSearchQuery(e.target.value.trim())
            renderGrid()
          }, 300)
        })
      }

      // Subscribe to store changes (crucial for reload scenario)
      const unsubscribe = subscribe((newState) => {
        state = newState
        renderGrid()
      })

      setTimeout(renderGrid, 100)
      on(root, 'change', 'select[name="type"],select[name="size"],select[name="color"],select[name="sort"],input[name="minPrice"],input[name="maxPrice"]', () => renderGrid())

      on(root, 'click', '[data-quickview]', (ev, btn) => {
        const product = state.products.find(p => p.id === btn.dataset.quickview)
        if (!product) return
        modalContainer.innerHTML = quickViewModal(product)
        document.body.style.overflow = 'hidden'
        const closeModal = () => { modalContainer.innerHTML = ''; document.body.style.overflow = '' }
        modalContainer.querySelector('#close-quickview').addEventListener('click', closeModal)
        modalContainer.querySelector('#quick-view-modal').addEventListener('click', (e) => { if (e.target.id === 'quick-view-modal') closeModal() })
        
        // Initialize modal carousel if multiple images
        const modalCarousel = modalContainer.querySelector('[data-modal-carousel]')
        if (modalCarousel) {
          const track = modalCarousel.querySelector('[data-modal-track]')
          const slides = modalCarousel.querySelectorAll('[data-modal-slide]')
          const prevBtn = modalCarousel.querySelector('[data-modal-prev]')
          const nextBtn = modalCarousel.querySelector('[data-modal-next]')
          const thumbs = modalCarousel.querySelectorAll('[data-modal-thumb]')
          
          let currentIndex = 0
          
          const updateModalCarousel = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`
            thumbs.forEach((thumb, i) => {
              if (i === currentIndex) {
                thumb.classList.remove('border-white/40')
                thumb.classList.add('border-white')
              } else {
                thumb.classList.remove('border-white')
                thumb.classList.add('border-white/40')
              }
            })
          }
          
          prevBtn?.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            currentIndex = (currentIndex - 1 + slides.length) % slides.length
            updateModalCarousel()
          })
          
          nextBtn?.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            currentIndex = (currentIndex + 1) % slides.length
            updateModalCarousel()
          })
          
          thumbs.forEach((thumb, i) => {
            thumb.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()
              currentIndex = i
              updateModalCarousel()
            })
          })
        }
        
        const qvAddBtn = modalContainer.querySelector('#qv-add-to-cart')
        qvAddBtn.addEventListener('click', () => {
          if (qvAddBtn.disabled) return
          qvAddBtn.disabled = true
          
          const size = modalContainer.querySelector('#qv-size').value
          const color = modalContainer.querySelector('#qv-color').value
          addToCart({ productId: product.id, size, color, qty: 1 })
          
          // Update cart counter in header immediately
          const count = cartCount()
          const cartBadge = document.querySelector('a[href="#/cart"] span')
          if (cartBadge) {
            cartBadge.textContent = count
          } else {
            // Create badge if it doesn't exist
            const cartLink = document.querySelector('a[href="#/cart"]')
            if (cartLink) {
              const newBadge = document.createElement('span')
              newBadge.className = 'absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white'
              newBadge.textContent = count
            cartLink.appendChild(newBadge)
            }
          }
          
          showToast('Producto agregado al carrito')
          closeModal()
        })
      })

      on(root, 'click', '[data-add-to-cart]', (ev, btn) => {
        ev.preventDefault()
        ev.stopPropagation()
        
        // Prevent double clicks
        if (btn.disabled) return
        btn.disabled = true
        
        const id = btn.getAttribute('data-product-id')
        const card = btn.closest('article')
        const size = card?.querySelector('select[data-card-size]')?.value || ''
        const color = card?.querySelector('select[data-card-color]')?.value || ''
        addToCart({ productId: id, size, color, qty: 1 })
        
        // Update cart counter in header immediately
        const count = cartCount()
        const cartBadge = document.querySelector('a[href="#/cart"] span')
        if (cartBadge) {
          cartBadge.textContent = count
        } else {
          // Create badge if it doesn't exist
          const cartLink = document.querySelector('a[href="#/cart"]')
          if (cartLink) {
            const newBadge = document.createElement('span')
            newBadge.className = 'absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white'
            newBadge.textContent = count
            cartLink.appendChild(newBadge)
          }
        }
        
        const originalHtml = btn.innerHTML
        btn.innerHTML = '✓ Agregado'
        btn.classList.add('bg-brand')
        btn.classList.remove('bg-black')
        showToast('Producto agregado al carrito')
        setTimeout(() => { 
          btn.innerHTML = originalHtml
          btn.classList.remove('bg-brand')
          btn.classList.add('bg-black')
          btn.disabled = false
        }, 1500)
      })

      // Return cleanup function
      return unsubscribe
    },
  }
}
