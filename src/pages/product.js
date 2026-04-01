import { getState, addToCart, trackProductView, getProductById } from '../app/store.js'
import { navigate } from '../app/router.js'
import { formatMoney } from '../app/format.js'
import { showToast } from '../app/toast.js'
import { initModalCarousel, initModalZoom } from './catalogCarousels.js'
import { getBadgeColor } from './catalogCard.js'
import { handleQuickAdd } from './catalogQuickAdd.js'

function getRecommendedProducts(currentProduct, allProducts, limit = 4) {
  const candidates = allProducts.filter(p =>
    p.id !== currentProduct.id && p.badge !== 'Borrador'
  )

  // Same type first
  const sameType = candidates.filter(p => p.type === currentProduct.type)
  // Fill with others if needed
  const others = candidates.filter(p => p.type !== currentProduct.type)

  const result = [...sameType, ...others].slice(0, limit)
  return result
}

function recommendedCard(p) {
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop'
  const isPerfume = p.type === 'Perfumes'
  const imageFitClass = isPerfume ? 'object-contain p-3' : 'object-cover'
  const imageBgClass = isPerfume ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800'

  return `
    <a href="/producto/${p.id}" class="product-card group bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-200 md:hover:shadow-lg md:hover:-translate-y-0.5 active:scale-[0.98] block">
      <div class="relative aspect-[3/4] overflow-hidden ${imageBgClass}">
        <img src="${img}" alt="${p.name}" class="w-full h-full ${imageFitClass} group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" onerror="this.src='/placeholder.webp'"/>
        <div class="absolute top-2 left-2 flex flex-col gap-1 z-20">
          ${p.badge ? `<span class="px-2 py-0.5 text-[9px] font-bold tracking-wider ${getBadgeColor(p.badge)} text-white rounded-md uppercase">${p.badge}</span>` : ''}
          ${p.originalPrice ? `<span class="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-red-500 text-white rounded-md uppercase">-${Math.round((1 - p.price / p.originalPrice) * 100)}%</span>` : ''}
        </div>
        <!-- Quick Add -->
        <button data-quick-add="${p.id}" class="quick-add-btn absolute bottom-2 right-2 z-30 w-9 h-9 md:w-8 md:h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-800 dark:text-white md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 active:scale-90" type="button" aria-label="Agregar al carrito" onclick="event.preventDefault();event.stopPropagation();">
          <svg class="quick-add-icon w-4.5 h-4.5 md:w-4 md:h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          <svg class="quick-add-spinner hidden w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
          <svg class="quick-add-check hidden w-4.5 h-4.5 md:w-4 md:h-4 text-green-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </button>
      </div>
      <div class="p-2.5 md:p-4">
        <h3 class="text-[13px] md:text-sm font-semibold text-gray-900 dark:text-white truncate leading-snug">${p.name}</h3>
        <div class="flex items-baseline gap-1.5 mt-1">
          <p class="text-[15px] md:text-lg font-bold text-gray-900 dark:text-white tracking-tight">${formatMoney(p.price)}</p>
          ${p.originalPrice ? `<p class="text-[10px] md:text-xs text-gray-400 line-through">${formatMoney(p.originalPrice)}</p>` : ''}
        </div>
      </div>
    </a>
  `
}

export function pageProduct(initialState) {
  const state = initialState
  const path = window.location.pathname
  const productId = path.split('/producto/')[1]
  const product = state.products.find(p => String(p.id) === String(productId))

  if (!product) {
    return {
      title: 'Producto no encontrado | G&L',
      noPaddingTop: true,
      html: `
        <div class="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
          <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Producto no encontrado</h1>
          <p class="text-gray-500 dark:text-gray-400 mb-6">El producto que buscas no existe o fue eliminado.</p>
          <a href="/catalog" class="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-full hover:opacity-90 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Ir al catálogo
          </a>
        </div>
      `,
      onMount() {}
    }
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop']
  const isPerfume = product.type === 'Perfumes'
  const modalImageFitClass = isPerfume ? 'object-contain bg-transparent' : 'object-contain md:object-cover object-center bg-transparent'

  const colorOpts = (product.colors || []).map(c => `<option value="${c}">${c}</option>`).join('')
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0

  // Carousel HTML
  const carouselHTML = images.length > 1 ? `
    <div class="modal-carousel relative overflow-hidden bg-transparent cursor-zoom-in w-full h-full flex items-center" data-modal-carousel>
      <div class="modal-carousel-track flex transition-transform duration-300 h-full w-full" data-modal-track>
        ${images.map((img, i) => `
          <img src="${img}" alt="${product.name}" class="modal-img-zoomable w-full h-full ${modalImageFitClass} flex-shrink-0 min-w-full transition-transform duration-200" data-modal-slide="${i}"/>
        `).join('')}
      </div>
      
      <!-- Navigation Buttons -->
      <button class="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur text-gray-800 dark:text-white shadow-lg flex items-center justify-center z-10" data-modal-prev>
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button class="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur text-gray-800 dark:text-white shadow-lg flex items-center justify-center z-10" data-modal-next>
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
      
      <!-- Dots (mobile) -->
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
    </div>
  ` : `
    <div class="relative overflow-hidden bg-transparent cursor-zoom-in w-full h-full flex items-center justify-center" data-modal-single>
      <img src="${images[0]}" alt="${product.name}" class="modal-img-zoomable w-full h-full ${modalImageFitClass} transition-transform duration-200"/>
    </div>
  `

  const publicProducts = state.products.filter(p => p.badge !== 'Borrador')
  const recommended = getRecommendedProducts(product, publicProducts, 4)

  return {
    title: `${product.name} | G&L`,
    noPaddingTop: true,
    hideHeaderOnMobile: true,
    html: `
      <div id="product-page" class="relative bg-white dark:bg-gray-900 min-h-screen -mx-3 md:-mx-4 -mb-6">

        <!-- Top Navigation -->
        <div class="absolute top-4 left-4 right-4 md:top-4 md:left-4 md:right-4 flex justify-between items-center z-[80] pointer-events-none" id="product-top-nav">
          <!-- Back button -->
          <button id="product-back" class="md:hidden w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:scale-105 transition-transform pointer-events-auto">
            <svg class="w-5 h-5 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          
          <!-- Share button -->
          <button id="product-share" class="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:scale-105 transition-transform pointer-events-auto ml-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          </button>
        </div>

        <!-- Product Content -->
        <div class="flex flex-col md:flex-row md:min-h-screen">

          <!-- Image Section -->
          <!-- Mobile: fills top portion, Desktop: sticky left half -->
          <div class="relative w-full h-[60vh] md:h-auto md:w-1/2 md:sticky md:top-0 md:self-start md:min-h-screen bg-white dark:bg-gray-900">
            <div class="absolute inset-0 md:relative md:h-screen">
              ${carouselHTML}
            </div>
          </div>

          <!-- Content Section -->
          <div class="relative bg-white dark:bg-gray-900 z-10 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] md:shadow-none -mt-4 rounded-t-[20px] md:mt-0 md:rounded-t-none md:w-1/2 md:min-h-screen md:flex md:flex-col">
            
            <div class="px-5 py-6 md:px-10 md:py-12 lg:px-16 md:max-w-xl md:mx-auto md:flex md:flex-col md:justify-center md:flex-1">
              <!-- Category -->
              <div class="mb-0.5">
                <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">${product.type}</span>
              </div>

              <!-- Name -->
              <h1 class="text-[22px] md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-1.5 md:mb-3 tracking-tight">${product.name}</h1>

              <!-- Price row -->
              <div class="flex items-center gap-2 mb-4 md:mb-6">
                <span class="text-xl md:text-3xl font-black text-gray-900 dark:text-white">${formatMoney(product.price)}</span>
                ${product.originalPrice ? `<span class="text-[13px] md:text-base font-medium text-gray-400 line-through">${formatMoney(product.originalPrice)}</span>` : ''}
                ${discount > 0 ? `<span class="text-[10px] md:text-xs font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">-${discount}%</span>` : ''}
              </div>

              <!-- Selectors -->
              <div class="mb-4 md:mb-6">
                <!-- Size Buttons -->
                ${(product.sizes && product.sizes.length > 0) ? `
                  <div class="mb-3 md:mb-4">
                    <div class="flex items-center justify-between mb-1.5 md:mb-2">
                      <label class="text-[11px] md:text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">Talla</label>
                    </div>
                    <div class="flex overflow-x-auto gap-2 pb-1 hide-scrollbar" id="qv-size-buttons">
                      ${product.sizes.map(size => `
                        <button
                          class="qv-size-btn flex-shrink-0 h-9 md:h-10 px-4 md:px-5 rounded-full border border-gray-200 dark:border-gray-700 transition-all text-[13px] md:text-sm font-semibold
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
                ${(product.colors && product.colors.length > 0) ? `
                  <div class="mb-3 md:mb-4">
                    <label class="text-[11px] md:text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider mb-1.5 md:mb-2 block">Color</label>
                    <div class="relative">
                      <select id="qv-color" class="w-full h-10 md:h-11 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-[13px] md:text-sm font-medium text-gray-900 dark:text-white focus:border-brand focus:ring-1 focus:ring-brand appearance-none outline-none">
                        ${colorOpts}
                      </select>
                      <svg class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                ` : ''}
              </div>

              <!-- Add to cart button -->
              <button id="qv-add-to-cart" data-product-id="${product.id}"
                class="w-full flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-3.5 md:py-4 text-[15px] md:text-base font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-brand/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>

        <!-- Recommended Products Section -->
        ${recommended.length > 0 ? `
        <section class="px-4 md:px-8 lg:px-16 py-8 md:py-16 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800" id="recommended-section">
          <div class="max-w-7xl mx-auto">
            <div class="flex items-center justify-between mb-5 md:mb-8">
              <div>
                <span class="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-brand uppercase tracking-widest mb-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  Recomendados
                </span>
                <h2 class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">También te puede gustar</h2>
              </div>
              <a href="/catalog" class="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700">
                Ver catálogo
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6" id="recommended-grid">
              ${recommended.map(p => recommendedCard(p)).join('')}
            </div>
          </div>
        </section>
        ` : ''}

        <!-- Quick Add Modal Container -->
        <div id="product-modal-container"></div>
      </div>
    `,
    onMount(root) {
      // Track view
      trackProductView(product.id)

      // Back button
      const backBtn = root.querySelector('#product-back')
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          if (window.history.length > 1) {
            window.history.back()
          } else {
            navigate('/catalog')
          }
        })
      }

      // Share button
      const shareBtn = root.querySelector('#product-share')
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          const shareUrl = `${window.location.origin}/producto/${product.id}`
          if (navigator.share) {
            navigator.share({
              title: product.name,
              text: '¡Mira este producto en G&L!',
              url: shareUrl
            }).catch(() => {})
          } else {
            navigator.clipboard.writeText(shareUrl)
            showToast('Enlace copiado al portapapeles')
          }
        })
      }

      // Initialize carousel and zoom
      initModalCarousel(root.querySelector('[data-modal-carousel]'))
      initModalZoom(root)

      // Size button selection logic
      const sizeButtons = root.querySelectorAll('.qv-size-btn')
      sizeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          sizeButtons.forEach(b => {
            b.classList.remove('qv-size-selected', 'border-brand', 'bg-brand', 'text-white', '!border-brand', '!bg-brand', '!text-white')
            b.classList.add('border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300')
          })
          btn.classList.add('qv-size-selected', '!border-brand', '!bg-brand', '!text-white')
          btn.classList.remove('border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300', 'hover:text-brand')

          const addBtn = root.querySelector('#qv-add-to-cart')
          if (addBtn) {
            addBtn.disabled = false
            addBtn.classList.remove('opacity-50', 'cursor-not-allowed')
          }
        })
      })

      // Add to cart
      const addBtn = root.querySelector('#qv-add-to-cart')
      if (product.sizes && product.sizes.length > 0) {
        addBtn.disabled = true
        addBtn.classList.add('opacity-50', 'cursor-not-allowed')
      }

      addBtn?.addEventListener('click', () => {
        if (addBtn.disabled) return
        addBtn.disabled = true

        const selectedSizeBtn = root.querySelector('.qv-size-selected')
        const size = selectedSizeBtn ? selectedSizeBtn.dataset.size : ''
        const colorSelect = root.querySelector('#qv-color')
        const color = colorSelect ? colorSelect.value : ''

        addToCart({ productId: product.id, size, color, qty: 1 })
        showToast('¡Producto agregado al carrito!')

        // Visual feedback
        addBtn.innerHTML = `
          <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          ¡Agregado!
        `
        setTimeout(() => {
          addBtn.disabled = false
          addBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            Agregar al carrito
          `
          // Re-disable if sizes needed and none selected
          if (product.sizes && product.sizes.length > 0 && !root.querySelector('.qv-size-selected')) {
            addBtn.disabled = true
            addBtn.classList.add('opacity-50', 'cursor-not-allowed')
          }
        }, 2000)
      })

      // Quick add from recommended products
      const modalContainer = root.querySelector('#product-modal-container')
      if (modalContainer) {
        root.addEventListener('click', (e) => {
          const quickAddBtn = e.target.closest('[data-quick-add]')
          if (quickAddBtn) {
            e.preventDefault()
            e.stopPropagation()
            handleQuickAdd(e, quickAddBtn, modalContainer)
          }
        })
      }
    }
  }
}
