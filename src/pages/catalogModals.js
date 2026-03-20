import { getBadgeColor } from './catalogCard.js'
import { formatMoney } from '../app/format.js'

export function quickViewModal(p) {
  const images = p.images && p.images.length > 0 
    ? p.images 
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop']
  const isPerfume = p.type === 'Perfumes'
  const modalImageFitClass = isPerfume ? 'object-contain bg-white' : 'object-cover'
  
  const colorOpts = (p.colors || []).map(c => `<option value="${c}">${c}</option>`).join('')
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0

  // Modal carousel HTML (larger version)
  const modalCarouselHTML = images.length > 1 ? `
    <div class="modal-carousel relative overflow-hidden ${isPerfume ? 'bg-white' : 'bg-gray-100'} cursor-zoom-in md:flex-1 md:min-h-0" data-modal-carousel>
      <div class="modal-carousel-track flex transition-transform duration-300 h-full" data-modal-track>
        ${images.map((img, i) => `
          <img src="${img}" alt="${p.name}" class="modal-img-zoomable w-full aspect-[4/3] md:h-full md:w-auto md:aspect-auto ${modalImageFitClass} flex-shrink-0 min-w-full transition-transform duration-200" data-modal-slide="${i}"/>
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
    <div class="relative overflow-hidden ${isPerfume ? 'bg-white' : 'bg-gray-100'} cursor-zoom-in md:flex-1 md:min-h-0" data-modal-single>
      <img src="${images[0]}" alt="${p.name}" class="modal-img-zoomable w-full aspect-[4/3] md:h-full md:w-auto md:aspect-auto ${modalImageFitClass} transition-transform duration-200"/>
      
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
      <div class="bg-white dark:bg-gray-900 w-full md:w-auto md:max-w-2xl md:mx-4 md:rounded-2xl rounded-t-3xl animate-slide-up shadow-2xl">

        <!-- Drag handle (mobile only) -->
        <div class="md:hidden flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <!-- Mobile layout: stacked image top + info below, compact -->
        <!-- Desktop: horizontal side-by-side -->
        <div class="md:flex md:items-stretch">

          <!-- Image Section -->
          <div class="relative md:w-72 lg:w-80 flex-shrink-0 md:self-stretch md:flex md:flex-col">
            ${modalCarouselHTML}
          </div>

          <!-- Content Section -->
          <div class="px-4 pt-3 pb-6 md:p-6 flex flex-col md:w-72 lg:w-80 md:overflow-y-auto">

            <!-- Mobile: top row with name + close affordance -->
            <div class="flex items-start justify-between gap-2 mb-1">
              <span class="text-[10px] font-bold text-brand uppercase tracking-widest">${p.type}</span>
              ${discount > 0 ? `<span class="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">-${discount}%</span>` : ''}
            </div>

            <!-- Name -->
            <h2 class="text-base md:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-snug line-clamp-2">${p.name}</h2>

            <!-- Price row -->
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-xl md:text-3xl font-black text-gray-900 dark:text-white">${formatMoney(p.price)}</span>
              ${p.originalPrice ? `<span class="text-sm text-gray-400 line-through">${formatMoney(p.originalPrice)}</span>` : ''}
            </div>

            <!-- Stock warning -->
            ${p.stock && p.stock <= 5 ? `
              <div class="flex items-center gap-2 mb-3 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <svg class="w-3.5 h-3.5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span class="text-xs font-medium text-orange-700 dark:text-orange-400">¡Solo quedan ${p.stock} unidades!</span>
              </div>
            ` : ''}

            <!-- Selectors -->
            <div class="mb-4">
              <!-- Size Buttons -->
              ${(p.sizes && p.sizes.length > 0) ? `
                <div class="mb-3">
                  <label class="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Talla</label>
                  <div class="flex flex-wrap gap-1.5" id="qv-size-buttons">
                    ${p.sizes.map(size => `
                      <button
                        class="qv-size-btn min-w-[2.6rem] h-9 px-2 rounded-lg border-2 transition-all text-sm font-semibold
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
                  <label class="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Color</label>
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
            <button id="qv-add-to-cart" data-product-id="${p.id}"
              class="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-dark active:scale-[0.98] transition-all shadow-md shadow-brand/20 min-h-[48px]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              Agregar al carrito
            </button>

            <!-- Trust badges (hidden on mobile to save space) -->
            <div class="hidden md:block mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
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

export function sizeSelectionModal(p) {
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
