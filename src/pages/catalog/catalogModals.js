import { formatMoney } from '../../utils/format.js'
import { isPerfumeCategory } from '../admin/adminProductsData.js'
import { escapeHtml } from '../../utils/sanitize.js'

export function quickViewModal(p) {
  const images = p.images && p.images.length > 0
    ? p.images
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop']
  const isPerfume = isPerfumeCategory(p.type)
  const modalImageFitClass = isPerfume ? 'object-contain bg-transparent' : 'object-contain md:object-cover object-center bg-transparent'
  const safeName = escapeHtml(p.name)
  const safeType = escapeHtml(p.type || '')

  const colorOpts = (p.colors || []).map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')
  const hasDiscount = p.originalPrice && Number(p.originalPrice) > Number(p.price)
  const discount = hasDiscount ? Math.round((1 - p.price / p.originalPrice) * 100) : 0

  // Modal carousel HTML (larger version)
  const modalCarouselHTML = images.length > 1 ? `
    <div class="modal-carousel relative overflow-hidden bg-transparent cursor-zoom-in w-full h-full flex items-center" data-modal-carousel>
      <div class="modal-carousel-track flex transition-transform duration-300 h-full w-full" data-modal-track>
        ${images.map((img, i) => `
          <img src="${escapeHtml(img)}" alt="${safeName}" class="modal-img-zoomable w-full h-full ${modalImageFitClass} flex-shrink-0 min-w-full transition-transform duration-200" data-modal-slide="${i}"/>
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
        ${images.map((_, i) => `<span class="w-2 h-2 rounded-full ${i === 0 ? 'bg-white shadow-md' : 'bg-white/50'} transition-[transform,background-color] duration-200" data-modal-dot="${i}"></span>`).join('')}
      </div>
      
      <!-- Thumbnails (Desktop only) -->
      <div class="hidden md:flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-2 z-10" data-modal-thumbs>
        ${images.map((img, i) => `
          <button class="w-12 h-12 rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-white' : 'border-white/40'} hover:border-white transition-colors input-focus" data-modal-thumb="${i}">
            <img src="${escapeHtml(img)}" alt="Thumb ${i+1}" class="w-full h-full object-cover"/>
          </button>
        `).join('')}
      </div>
      
      <!-- El contador de imágenes ha sido removido de la vista móvil -->
      
      <!-- Sin badges en el modal -->
    </div>
  ` : `
    <div class="relative overflow-hidden bg-transparent cursor-zoom-in w-full h-full flex items-center justify-center" data-modal-single>
      <img src="${escapeHtml(images[0])}" alt="${safeName}" class="modal-img-zoomable w-full h-full ${modalImageFitClass} transition-transform duration-200"/>
      
      <!-- Sin badges en el modal -->
    </div>
  `

  return `
    <div id="quick-view-modal" class="fixed inset-0 z-[70] flex flex-col md:items-center md:justify-center bg-white dark:bg-gray-900 md:bg-black/60 md:backdrop-blur-sm animate-fade-in">
      <!-- Mobile: full screen, Desktop: centered modal -->
      <div class="bg-white dark:bg-gray-900 w-full h-[100dvh] md:h-auto md:max-h-[92dvh] md:w-auto md:max-w-3xl md:mx-4 md:rounded-2xl md:shadow-2xl flex flex-col relative animate-slide-up">

        <!-- Top Navigation (Fixed inside modal) -->
        <div class="absolute top-4 left-4 right-4 flex justify-between z-[80] pointer-events-none">
          <!-- Back button (Close) -->
          <button id="close-quickview" class="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:scale-105 transition-transform pointer-events-auto">
            <svg class="w-5 h-5 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          
          <!-- Share button -->
          <button id="share-quickview" class="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:scale-105 transition-transform pointer-events-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          </button>
        </div>

        <!-- Mobile layout: stacked image top + info below, compact -->
        <!-- Desktop: horizontal side-by-side -->
        <div class="flex flex-col md:flex-row md:items-stretch w-full flex-1 min-h-0">

          <!-- Image Section -->
          <div class="relative w-full flex-1 min-h-0 md:w-80 lg:w-[400px] md:self-stretch bg-white">
            <div class="absolute inset-0">
              ${modalCarouselHTML}
            </div>
          </div>

          <!-- Content Section -->
          <div class="px-5 py-4 pb-6 md:p-8 flex flex-col flex-none md:flex-1 md:w-80 lg:w-[380px] md:overflow-y-auto bg-white dark:bg-gray-900 z-10 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] md:shadow-none -mt-4 rounded-t-[20px] md:mt-0 md:rounded-t-none">

            <!-- Category -->
            <div class="mb-0.5">
              <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">${safeType}</span>
            </div>

            <!-- Name -->
            <h2 class="text-[22px] md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-1.5 tracking-tight line-clamp-2">${safeName}</h2>

            <!-- Price row -->
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xl md:text-2xl font-black text-gray-900 dark:text-white">${formatMoney(p.price)}</span>
              ${hasDiscount ? `<span class="text-[13px] font-medium text-gray-400 line-through">${formatMoney(p.originalPrice)}</span>` : ''}
              ${discount > 0 ? `<span class="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">-${discount}%</span>` : ''}
            </div>

            <!-- Selectors -->
            <div class="mb-4">
              <!-- Size Buttons -->
              ${(p.sizes && p.sizes.length > 0) ? `
                <div class="mb-3">
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="text-[11px] font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">Talla</label>
                  </div>
                  <!-- Horizontal scrolling list of sizes -->
                  <div class="flex overflow-x-auto gap-2 pb-1 hide-scrollbar" id="qv-size-buttons">
                    ${p.sizes.map(size => `
                      <button
                        class="qv-size-btn flex-shrink-0 h-9 px-4 rounded-full border border-gray-200 dark:border-gray-700 transition-[transform,background-color] duration-200 text-[13px] font-semibold
                               hover:border-brand dark:hover:border-brand text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 active:scale-95"
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
                <div class="mb-3">
                  <label class="text-[11px] font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider mb-1.5 block">Color</label>
                  <div class="relative">
                    <select id="qv-color" class="w-full h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-[13px] font-medium text-gray-900 dark:text-white focus:border-brand focus:ring-1 focus:ring-brand appearance-none outline-none">
                      ${colorOpts}
                    </select>
                    <svg class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Add to cart button -->
            <button id="qv-add-to-cart" data-product-id="${p.id}"
              class="w-full flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-3.5 mt-auto text-[15px] font-bold text-white hover:opacity-90 active:scale-[0.98] transition-[transform,background-color] duration-200 shadow-md shadow-brand/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

export function sizeSelectionModal(p) {
  const sizes = p.sizes || []
  const safeName = escapeHtml(p.name)
  const safeImg = escapeHtml(p.images?.[0] || '')

  return `
    <div id="quick-add-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden animate-slide-up border border-gray-100 dark:border-gray-800">
        <!-- Header -->
        <div class="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-start gap-4 relative">
          <div class="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 overflow-hidden flex-shrink-0 shadow-sm">
            <img src="${safeImg}" alt="${safeName}" class="w-full h-full object-cover">
          </div>
          <div class="min-w-0 flex-1 pt-1 pr-8">
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">${sizes.length > 0 ? 'Selecciona tu talla' : 'Agregar al carrito'}</p>
            <h3 class="font-manrope font-bold text-gray-900 dark:text-white text-lg leading-tight">${safeName}</h3>
          </div>
          <!-- Close Button -->
          <button id="close-quick-add" class="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label="Cerrar modal">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-5 sm:p-6 bg-gray-50/50 dark:bg-gray-900/50 flex justify-center">
          ${sizes.length > 0 ? `
            <!-- Horizontal wrapping list of sizes -->
            <div class="flex flex-wrap justify-center gap-2.5">
              ${sizes.map(size => `
                <button class="size-select-btn flex-shrink-0 min-w-[3.5rem] h-10 px-4 rounded-full border border-gray-200 dark:border-gray-700 transition-[transform,background-color] duration-200 text-[13px] font-semibold hover:border-brand dark:hover:border-brand hover:text-brand text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 active:scale-95 shadow-sm hover:shadow" data-size="${size}">
                  ${size}
                </button>
              `).join('')}
            </div>
          ` : `
            <button class="size-select-btn w-full py-3.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-bold tracking-wide active:scale-[0.98] transition-[transform,background-color] duration-200 shadow-lg hover:shadow-xl" data-size="">
              Agregar a la bolsa
            </button>
          `}
        </div>
      </div>
    </div>
  `
}
