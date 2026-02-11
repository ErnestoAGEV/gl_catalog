import { addToCart, searchProducts, setSearchQuery, getSearchQuery, cartCount, subscribe, trackProductView, getState } from '../app/store.js'
import { formatMoney } from '../app/format.js'
import { on, qs } from '../app/dom.js'
import { showToast } from '../app/toast.js'
import { showMiniCart } from '../app/miniCart.js'



function uniqueSorted(values) {
  return Array.from(new Set(values)).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)))
}

function getFilterState(root) {
  // With dual panels (desktop + mobile), gather the first non-empty value for each filter
  const getVal = (name) => {
    const els = root.querySelectorAll(`[name="${name}"]`)
    for (const el of els) { if (el.value) return el.value }
    return ''
  }
  const type = getVal('type')
  const size = getVal('size')
  const color = getVal('color')
  const minPrice = getVal('minPrice')
  const maxPrice = getVal('maxPrice')
  const sort = getVal('sort')

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

function skeletonCard() {
  return `
    <article class="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
      <div class="aspect-[3/4] skeleton-shimmer relative">
        <div class="absolute bottom-2 right-2 w-9 h-9 md:w-8 md:h-8 rounded-full skeleton-shimmer border border-gray-200/30 dark:border-gray-700/30"></div>
      </div>
      <div class="p-2.5 md:p-4">
        <div class="h-3.5 md:h-4 w-3/4 rounded-md skeleton-shimmer"></div>
        <div class="h-4 md:h-5 w-1/3 rounded-md skeleton-shimmer mt-2 md:mt-2.5"></div>
      </div>
    </article>
  `
}

function skeletonGrid(count = 8) {
  return Array.from({ length: count }, () => skeletonCard()).join('')
}

function productCard(p, idx) {
  const images = p.images && p.images.length > 0 
    ? p.images 
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop']
  const isPerfume = p.type === 'Perfumes'
  const imageFitClass = isPerfume ? 'object-contain bg-white' : 'object-cover object-center'
  const imageWrapClass = isPerfume ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800'
  
  const sizeOpts = (p.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('')
  const colorOpts = (p.colors || []).map(c => `<option value="${c}">${c}</option>`).join('')

  // Carousel HTML (only show controls if more than 1 image)
  const carouselHTML = images.length > 1 ? `
    <div class="carousel-container relative group h-full" data-carousel>
      <div class="carousel-track flex h-full transition-transform duration-300" data-track>
        ${images.map((img, i) => `
          <img src="${img}" alt="${p.name}" class="w-full h-full min-w-full ${imageFitClass} flex-shrink-0" loading="lazy" data-slide="${i}"/>
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
    <img src="${images[0]}" alt="${p.name}" class="w-full h-full ${imageFitClass} group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
  `

  return `
    <article class="product-card group bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden transition-all duration-200 border border-gray-100 dark:border-gray-800 md:hover:shadow-lg md:hover:shadow-gray-900/[0.06] dark:md:hover:shadow-none md:hover:-translate-y-0.5 md:hover:border-gray-200 dark:md:hover:border-gray-700 active:scale-[0.98] md:active:scale-100" data-product-id="${p.id}">
      <div class="aspect-[3/4] overflow-hidden relative ${imageWrapClass}">
        ${carouselHTML}
        <div class="absolute top-2 left-2 flex flex-col gap-1 z-20">
          ${p.badge ? `<span class="px-2 py-0.5 text-[9px] md:text-[10px] font-bold tracking-wider ${getBadgeColor(p.badge)} text-white rounded-md uppercase">${p.badge}</span>` : ''}
          ${p.originalPrice ? `<span class="px-2 py-0.5 text-[9px] md:text-[10px] font-bold tracking-wider bg-red-500 text-white rounded-md uppercase">-${Math.round((1 - p.price / p.originalPrice) * 100)}%</span>` : ''}
          ${p.stock && p.stock <= 5 ? `<span class="px-2 py-0.5 text-[9px] md:text-[10px] font-bold tracking-wider bg-orange-500 text-white rounded-md badge-pulse uppercase">¡Últimas!</span>` : ''}
        </div>
        
        <!-- Tap overlay for mobile (quickview on image tap) -->
        <button data-quickview="${p.id}" class="absolute inset-0 z-10 md:hidden" aria-label="Vista rápida"></button>
        <!-- Quick View (desktop hover) -->
        <button data-quickview="${p.id}" class="hidden md:flex absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 text-gray-900 dark:text-white text-[11px] font-semibold rounded-full px-5 py-2 shadow-lg items-center gap-1.5 z-20">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          Vista rápida
        </button>
        <!-- Quick Add (mobile: always visible, desktop: hover reveal) -->
        <button data-quick-add="${p.id}" class="quick-add-btn absolute bottom-2 right-2 z-20 w-9 h-9 md:w-8 md:h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-800 dark:text-white md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 active:scale-90" type="button" aria-label="Agregar al carrito">
          <svg class="quick-add-icon w-4.5 h-4.5 md:w-4 md:h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          <svg class="quick-add-spinner hidden w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
          <svg class="quick-add-check hidden w-4.5 h-4.5 md:w-4 md:h-4 text-green-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </button>
      </div>
      <div class="p-2.5 md:p-4">
        <h3 class="catalog-card-title text-[13px] md:text-sm font-semibold text-gray-900 dark:text-white truncate leading-snug">${p.name}</h3>
        <div class="flex items-baseline gap-1.5 md:gap-2 mt-1 md:mt-1.5">
          <p class="catalog-card-price text-[15px] md:text-lg font-bold text-gray-900 dark:text-white tracking-tight">${formatMoney(p.price)}</p>
          ${p.originalPrice ? `<p class="text-[10px] md:text-xs text-gray-400 line-through">${formatMoney(p.originalPrice)}</p>` : ''}
        </div>
      </div>
    </article>
  `
}

function quickViewModal(p) {
  const images = p.images && p.images.length > 0 
    ? p.images 
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop']
  const isPerfume = p.type === 'Perfumes'
  const modalImageFitClass = isPerfume ? 'object-contain bg-white' : 'object-cover'
  
  const sizeOpts = (p.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('')
  const colorOpts = (p.colors || []).map(c => `<option value="${c}">${c}</option>`).join('')
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0

  // Modal carousel HTML (larger version)
  const modalCarouselHTML = images.length > 1 ? `
    <div class="modal-carousel relative overflow-hidden ${isPerfume ? 'bg-white' : 'bg-gray-100'} cursor-zoom-in" data-modal-carousel>
      <div class="modal-carousel-track flex transition-transform duration-300" data-modal-track>
        ${images.map((img, i) => `
          <img src="${img}" alt="${p.name}" class="modal-img-zoomable w-full aspect-square md:aspect-[4/5] ${modalImageFitClass} flex-shrink-0 min-w-full transition-transform duration-200" data-modal-slide="${i}"/>
        `).join('')}
      </div>
      
      <!-- Navigation Buttons -->
      <button class="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur text-gray-800 dark:text-white shadow-lg flex items-center justify-center z-10" data-modal-prev>
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button class="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur text-gray-800 dark:text-white shadow-lg flex items-center justify-center z-10" data-modal-next>
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
      
      <!-- Dots -->
      <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 md:hidden" data-modal-dots>
        ${images.map((_, i) => `<span class="w-2 h-2 rounded-full ${i === 0 ? 'bg-white shadow-md' : 'bg-white/50'} transition-all" data-modal-dot="${i}"></span>`).join('')}
      </div>
      
      <!-- Thumbnails (Desktop only) -->
      <div class="hidden md:flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-2 z-10" data-modal-thumbs>
        ${images.map((img, i) => `
          <button class="w-12 h-12 rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-white' : 'border-white/40'} hover:border-white transition-colors input-focus" data-modal-thumb="${i}">
            <img src="${img}" alt="Thumb ${i+1}" class="w-full h-full object-cover"/>
          </button>
        `).join('')}
      </div>
      
      <!-- Image counter (Mobile) -->
      <div class="md:hidden absolute top-3 right-14 bg-black/50 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full z-20" data-modal-counter>1 / ${images.length}</div>
      
      <!-- Close button -->
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
    <div class="relative overflow-hidden ${isPerfume ? 'bg-white' : 'bg-gray-100'} cursor-zoom-in" data-modal-single>
      <img src="${images[0]}" alt="${p.name}" class="modal-img-zoomable w-full aspect-square md:aspect-[4/5] ${modalImageFitClass} transition-transform duration-200"/>
      
      <!-- Close button -->
      <button id="close-quickview" class="absolute top-3 right-3 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg flex items-center justify-center text-gray-700 dark:text-white hover:bg-white dark:hover:bg-gray-700 transition-colors z-20">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      
      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
        ${p.badge ? `<span class="px-2.5 py-1 text-[10px] font-bold ${getBadgeColor(p.badge)} text-white rounded-md shadow-sm">${p.badge.toUpperCase()}</span>` : ''}
        ${discount > 0 ? `<span class="px-2.5 py-1 text-[10px] font-bold bg-red-500 text-white rounded-md shadow-sm">-${discount}%</span>` : ''}
      </div>
    </div>
  `

  return `
    <div id="quick-view-modal" class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
      <!-- Mobile: slide from bottom, Desktop: centered modal -->
      <div class="bg-white dark:bg-gray-900 w-full md:w-auto md:max-w-2xl md:mx-4 md:rounded-2xl rounded-t-3xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl overscroll-contain">
        
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
            <div class="mb-5">
              <!-- Size Buttons -->
              ${(p.sizes && p.sizes.length > 0) ? `
                <div class="mb-4">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Talla</label>
                  <div class="grid grid-cols-4 gap-2" id="qv-size-buttons">
                    ${p.sizes.map(size => `
                      <button 
                        class="qv-size-btn py-2.5 px-2 rounded-lg border-2 transition-all text-sm font-medium
                               border-gray-200 hover:border-brand hover:text-brand
                               dark:border-gray-700 dark:hover:border-brand dark:hover:text-brand
                               active:scale-95 text-gray-700 dark:text-gray-300" 
                        data-size="${size}"
                        type="button">
                        ${size}
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              <!-- Color Dropdown -->
              ${(p.colors && p.colors.length > 0) ? `
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Color</label>
                  <div class="relative">
                    <select id="qv-color" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand focus:ring-1 focus:ring-brand appearance-none">
                      ${colorOpts}
                    </select>
                    <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              ` : ''}
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

function sizeSelectionModal(p) {
  const sizes = p.sizes || []
  
  return `
    <div id="quick-add-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-gray-100 dark:border-gray-800">
        <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
            <img src="${p.images?.[0] || ''}" alt="${p.name}" class="w-full h-full object-cover">
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">${sizes.length > 0 ? 'Selecciona tu talla' : 'Agregar al carrito'}</p>
            <h3 class="font-bold text-gray-900 dark:text-white truncate text-sm">${p.name}</h3>
          </div>
          <button id="close-quick-add" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div class="p-5">
          ${sizes.length > 0 ? `
            <div class="grid grid-cols-3 gap-2">
              ${sizes.map(size => `
                <button class="size-select-btn py-2.5 px-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand hover:text-brand dark:hover:border-brand dark:hover:text-brand active:bg-brand/5 transition-all text-sm font-medium text-gray-700 dark:text-gray-300" data-size="${size}">
                  ${size}
                </button>
              `).join('')}
            </div>
          ` : `
            <button class="size-select-btn w-full py-3 rounded-lg bg-brand hover:bg-brand-dark text-white font-semibold transition-colors" data-size="">
              Agregar al carrito
            </button>
          `}
        </div>
      </div>
    </div>
  `
}

export function pageCatalog(initialState) {
  let state = initialState
  const types = uniqueSorted(state.products.map((p) => p.type))
  const sizes = uniqueSorted(state.products.flatMap((p) => p.sizes || []))
  const colors = uniqueSorted(state.products.flatMap((p) => p.colors || []))

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
            <span id="product-count" class="ml-auto text-xs font-semibold text-gray-400">${state.products.length} productos</span>
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
        <span id="product-count-mobile" class="text-[11px] font-medium text-gray-400 dark:text-gray-500">${state.products.length} productos</span>
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
        
        console.log('renderGrid called', { isLoading: state.isLoading, productsCount: state.products.length })
        
        // Show loading state
        if (state.isLoading) {
          if (productCountEl) productCountEl.textContent = ''
          if (productCountMobile) productCountMobile.textContent = 'Cargando...'
          grid.innerHTML = skeletonGrid(8)
          loadMoreContainer.classList.add('hidden')
          return
        }

        // Update filter options dynamically based on current products
        const types = uniqueSorted(state.products.map((p) => p.type))
        const sizes = uniqueSorted(state.products.flatMap((p) => p.sizes || []))
        const colors = uniqueSorted(state.products.flatMap((p) => p.colors || []))
        
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
        let baseProducts = searchQuery ? searchProducts(searchQuery) : state.products
        allFilteredProducts = applyFilters(baseProducts, filters)
        
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
          grid.innerHTML = `<div class="col-span-full text-center py-16"><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No encontramos productos</h3><p class="text-gray-500 dark:text-gray-400 text-sm">${searchQuery ? `No hay resultados para "${searchQuery}". ` : ''}Intenta con otros filtros</p>${searchQuery ? `<button id="clear-search" class="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700">Limpiar búsqueda</button>` : ''}</div>`
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
        
        console.log('Rendering products:', visible.length, visible.slice(0, 2))
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
          const newCarousels = grid.querySelectorAll('[data-carousel]')
          newCarousels.forEach(carousel => {
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
        })
      }

      // Subscribe to store changes (crucial for reload scenario)
      const unsubscribe = subscribe((newState) => {
        state = newState
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

      on(root, 'change', 'select[name="type"],select[name="size"],select[name="color"],select[name="sort"],input[name="minPrice"],input[name="maxPrice"]', (ev, el) => {
        // Sync the same filter across desktop and mobile panels
        const name = el.getAttribute('name')
        const val = el.value
        root.querySelectorAll(`[name="${name}"]`).forEach(s => { if (s !== el) s.value = val })
        renderGrid()
      })

      on(root, 'click', '[data-quickview]', (ev, btn) => {
        const product = state.products.find(p => p.id === btn.dataset.quickview)
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
          const dots = modalCarousel.querySelectorAll('[data-modal-dot]')
          const counter = modalCarousel.querySelector('[data-modal-counter]')
          
          let currentIndex = 0
          
          const updateModalCarousel = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`
            // Update thumbnails
            thumbs.forEach((thumb, i) => {
              if (i === currentIndex) {
                thumb.classList.remove('border-white/40')
                thumb.classList.add('border-white')
              } else {
                thumb.classList.remove('border-white')
                thumb.classList.add('border-white/40')
              }
            })
            // Update dots
            dots.forEach((dot, i) => {
              if (i === currentIndex) {
                dot.classList.remove('bg-white/50')
                dot.classList.add('bg-white', 'shadow-md')
              } else {
                dot.classList.remove('bg-white', 'shadow-md')
                dot.classList.add('bg-white/50')
              }
            })
            // Update counter
            if (counter) counter.textContent = `${currentIndex + 1} / ${slides.length}`
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

          // Touch swipe support for mobile
          let touchStartX = 0
          let touchStartY = 0
          let isSwiping = false

          modalCarousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX
            touchStartY = e.touches[0].clientY
            isSwiping = false
          }, { passive: true })

          modalCarousel.addEventListener('touchmove', (e) => {
            const diffX = Math.abs(e.touches[0].clientX - touchStartX)
            const diffY = Math.abs(e.touches[0].clientY - touchStartY)
            if (diffX > diffY && diffX > 10) {
              isSwiping = true
              e.preventDefault()
            }
          }, { passive: false })

          modalCarousel.addEventListener('touchend', (e) => {
            if (!isSwiping) return
            const touchEndX = e.changedTouches[0].clientX
            const diff = touchStartX - touchEndX
            if (Math.abs(diff) > 40) {
              if (diff > 0 && currentIndex < slides.length - 1) {
                currentIndex++
              } else if (diff < 0 && currentIndex > 0) {
                currentIndex--
              }
              updateModalCarousel()
            }
          }, { passive: true })
        }
        
        // Image zoom functionality
        const zoomableImages = modalContainer.querySelectorAll('.modal-img-zoomable')
        const imageContainers = [
          modalContainer.querySelector('[data-modal-carousel]'),
          modalContainer.querySelector('[data-modal-single]')
        ].filter(Boolean)
        
        imageContainers.forEach(container => {
          if (!container) return
          
          let isZoomLocked = false
          
          // Desktop: hover + mousemove zoom
          const handleMouseMove = (e) => {
            const img = container.querySelector('.modal-img-zoomable')
            if (!img) return
            
            const rect = container.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            
            img.style.transformOrigin = `${x}% ${y}%`
            
            if (!isZoomLocked) {
              img.style.transform = 'scale(1.5)'
              container.style.cursor = 'zoom-out'
            }
          }
          
          const handleMouseLeave = () => {
            const img = container.querySelector('.modal-img-zoomable')
            if (!img || isZoomLocked) return
            
            img.style.transform = 'scale(1)'
            img.style.transformOrigin = 'center'
            container.style.cursor = 'zoom-in'
          }
          
          const handleClick = (e) => {
            // Don't zoom if clicking navigation buttons or thumbnails
            if (e.target.closest('[data-modal-prev], [data-modal-next], [data-modal-thumb]')) return
            
            const img = container.querySelector('.modal-img-zoomable')
            if (!img) return
            
            isZoomLocked = !isZoomLocked
            
            if (isZoomLocked) {
              container.style.cursor = 'grab'
            } else {
              img.style.transform = 'scale(1)'
              img.style.transformOrigin = 'center'
              container.style.cursor = 'zoom-in'
            }
          }
          
          // Only add desktop zoom on larger screens
          if (window.innerWidth >= 768) {
            container.addEventListener('mousemove', handleMouseMove)
            container.addEventListener('mouseleave', handleMouseLeave)
            container.addEventListener('click', handleClick)
          }
          
          // Mobile: pinch-to-zoom
          let initialDistance = 0
          let initialScale = 1
          
          container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
              e.preventDefault()
              const touch1 = e.touches[0]
              const touch2 = e.touches[1]
              initialDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
              )
              
              const img = container.querySelector('.modal-img-zoomable')
              if (img) {
                const currentTransform = img.style.transform
                const match = currentTransform.match(/scale\(([^)]+)\)/)
                initialScale = match ? parseFloat(match[1]) : 1
              }
            }
          }, { passive: false })
          
          container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
              e.preventDefault()
              e.stopPropagation()
              
              const touch1 = e.touches[0]
              const touch2 = e.touches[1]
              const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
              )
              
              const scale = Math.max(1, Math.min(3, initialScale * (currentDistance / initialDistance)))
              
              const img = container.querySelector('.modal-img-zoomable')
              if (img) {
                img.style.transform = `scale(${scale})`
                
                // Update cursor based on zoom level
                if (scale > 1) {
                  container.style.cursor = 'zoom-out'
                } else {
                  container.style.cursor = 'zoom-in'
                }
              }
            }
          }, { passive: false })
          
          container.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
              initialDistance = 0
            }
          }, { passive: true })
        })
        
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

      on(root, 'click', '[data-quick-add]', (ev, btn) => {
        ev.preventDefault()
        ev.stopPropagation()
        if (btn.dataset.busy) return

        const id = btn.dataset.quickAdd
        const currentState = getState()
        const product = currentState.products.find(p => p.id === id)
        
        // Helper to perform the actual cart push
        const doAddToCart = (size = '') => {
          if (btn.dataset.busy) return
          btn.dataset.busy = '1'

          addToCart({ productId: id, size, color: '', qty: 1 })

          // Update cart badge
          const count = cartCount()
          const cartBadge = document.querySelector('a[href="#/cart"] span')
          if (cartBadge) {
            cartBadge.textContent = count
          } else {
            const cartLink = document.querySelector('a[href="#/cart"]')
            if (cartLink) {
              const b = document.createElement('span')
              b.className = 'absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white'
              b.textContent = count
              cartLink.appendChild(b)
            }
          }

          // Transition: icon → spinner → check
          const icon = btn.querySelector('.quick-add-icon')
          const spinner = btn.querySelector('.quick-add-spinner')
          const check = btn.querySelector('.quick-add-check')
          icon.classList.add('hidden')
          spinner.classList.remove('hidden')

          setTimeout(() => {
            spinner.classList.add('hidden')
            check.classList.remove('hidden')
            btn.classList.add('!bg-green-500', '!text-white')
            showMiniCart(id)

            setTimeout(() => {
              check.classList.add('hidden')
              icon.classList.remove('hidden')
              btn.classList.remove('!bg-green-500', '!text-white')
              delete btn.dataset.busy
            }, 1200)
          }, 350)
        }

        // Always open Size Selection Modal (even if no sizes available)
        modalContainer.innerHTML = sizeSelectionModal(product)
        
        // Setup listeners for the modal
        const closeModal = () => { modalContainer.innerHTML = '' }
        
        const closeBtn = modalContainer.querySelector('#close-quick-add')
        if (closeBtn) closeBtn.addEventListener('click', closeModal)
        
        // Dismiss on backdrop click
        const modalEl = modalContainer.querySelector('#quick-add-modal')
        if (modalEl) {
          modalEl.addEventListener('click', (e) => { 
            if (e.target.id === 'quick-add-modal') closeModal() 
          })
        }

        // Handle size click
        const sizeButtons = modalContainer.querySelectorAll('.size-select-btn')
        sizeButtons.forEach(sizeBtn => {
          sizeBtn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            const selectedSize = sizeBtn.dataset.size
            closeModal()
            doAddToCart(selectedSize)
          })
        })
      })

      // Return cleanup function
      return unsubscribe
    },
  }
}
