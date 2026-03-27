import { formatMoney } from '../app/format.js'

export function getBadgeColor(badge) {
  return { 'Nuevo': 'bg-blue-500', 'Oferta': 'bg-red-500', 'Popular': 'bg-amber-500', 'Premium': 'bg-purple-500' }[badge] || 'bg-gray-700'
}

export function skeletonCard() {
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

export function skeletonGrid(count = 8) {
  return Array.from({ length: count }, () => skeletonCard()).join('')
}

export function productCard(p, idx) {
  const images = p.images && p.images.length > 0 
    ? p.images 
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop']
  const isPerfume = p.type === 'Perfumes'
  const imageFitClass = isPerfume ? 'object-contain bg-white' : 'object-cover object-center'
  const imageWrapClass = isPerfume ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800'
  
  // Carousel HTML (only show controls if more than 1 image)
  const carouselHTML = images.length > 1 ? `
    <div class="carousel-container relative group h-full" data-carousel>
      <div class="carousel-track flex h-full transition-transform duration-300" data-track>
        ${images.map((img, i) => `
          <img src="${img}" alt="${p.name}" class="w-full h-full min-w-full ${imageFitClass} flex-shrink-0" loading="lazy" data-slide="${i}" onerror="this.src='/placeholder.webp'"/>
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
    <div class="absolute inset-0 group-hover:scale-105 transition-transform duration-500 ease-out">
      <img src="${images[0]}" alt="${p.name}" class="w-full h-full ${imageFitClass}" loading="lazy" onerror="this.src='/placeholder.webp'"/>
    </div>
  `

  return `
    <article class="product-card group bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-800 md:hover:shadow-xl md:hover:shadow-gray-900/[0.08] dark:md:hover:shadow-none md:hover:-translate-y-1 md:hover:border-gray-200 dark:md:hover:border-gray-700 active:scale-[0.98] md:active:scale-100" data-product-id="${p.id}">
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
