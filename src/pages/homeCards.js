import { formatMoney } from '../app/format.js'
import { testimonials } from './homeData.js'

export function getBadgeColor(badge) {
  const colors = {
    'Nuevo': 'bg-blue-500',
    'Oferta': 'bg-red-500',
    'Popular': 'bg-amber-500',
    'Premium': 'bg-purple-500',
  }
  return colors[badge] || 'bg-gray-700'
}

export function homeSkeletonCard() {
  return `
    <article class="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 h-full flex flex-col">
      <div class="aspect-[3/4] md:aspect-[4/5] skeleton-shimmer"></div>
      <div class="p-2.5 md:p-4 flex flex-col flex-grow">
        <div class="h-3.5 md:h-4 w-4/5 rounded-md skeleton-shimmer"></div>
        <div class="mt-auto pt-1.5 md:pt-2">
          <div class="h-4 md:h-5 w-1/3 rounded-md skeleton-shimmer"></div>
        </div>
      </div>
    </article>
  `
}

export function renderStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  let html = ''
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      html += '<svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>'
    } else if (i === fullStars && hasHalf) {
      html += '<svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" opacity="0.5"/></svg>'
    } else {
      html += '<svg class="w-3.5 h-3.5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>'
    }
  }
  return html
}

export function featuredProductCard(p, idx) {
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop'
  const isPerfume = p.type === 'Perfumes'
  const imageFitClass = isPerfume ? 'object-contain p-4' : 'object-cover'
  const imageBgClass = isPerfume ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800'
  
  return `
    <article class="product-card group relative bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-200 md:hover:shadow-lg md:hover:shadow-gray-900/[0.06] dark:md:hover:shadow-none md:hover:-translate-y-0.5 md:hover:border-gray-200 dark:md:hover:border-gray-700 active:scale-[0.98] md:active:scale-100 animate-fade-in h-full flex flex-col cursor-pointer" style="animation-delay: ${idx * 40}ms" data-home-qv="${p.id}">
      <div class="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden ${imageBgClass}">
        <div class="absolute inset-0 group-hover:scale-[1.03] transition-transform duration-500 ease-out">
          <img 
            src="${img}" 
            alt="${p.name}"
            class="w-full h-full ${imageFitClass}"
            loading="lazy"
            onerror="this.src='/placeholder.webp'"
          />
        </div>
        
        <!-- Badges -->
        <div class="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1 z-20">
          ${p.badge ? `<span class="inline-flex px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-bold tracking-wider ${getBadgeColor(p.badge)} text-white uppercase rounded-md">${p.badge}</span>` : ''}
          ${p.stock <= 5 && p.stock > 0 ? `<span class="inline-flex px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-bold tracking-wider bg-orange-500 text-white uppercase rounded-md">¡Últimas!</span>` : ''}
        </div>
        <!-- Quick Add -->
        <button data-quick-add="${p.id}" class="quick-add-btn absolute bottom-2 right-2 z-30 w-9 h-9 md:w-8 md:h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-800 dark:text-white md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 active:scale-90" type="button" aria-label="Agregar al carrito">
          <svg class="quick-add-icon w-4.5 h-4.5 md:w-4 md:h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          <svg class="quick-add-spinner hidden w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
          <svg class="quick-add-check hidden w-4.5 h-4.5 md:w-4 md:h-4 text-green-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </button>
      </div>
      
      <div class="p-2.5 md:p-4 flex flex-col flex-grow">
        <h3 class="text-[13px] md:text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">${p.name}</h3>
        
        <div class="mt-auto pt-1.5 md:pt-2">
          <div class="flex items-baseline gap-1.5 md:gap-2">
            <p class="text-[15px] md:text-lg font-bold text-gray-900 dark:text-white tracking-tight">${formatMoney(p.price)}</p>
            ${p.originalPrice ? `<p class="text-[10px] md:text-sm text-gray-400 line-through">${formatMoney(p.originalPrice)}</p>` : ''}
            ${p.originalPrice ? `<span class="text-[9px] md:text-xs font-bold text-green-600 dark:text-green-400">-${Math.round((1 - p.price/p.originalPrice)*100)}%</span>` : ''}
          </div>
        </div>
      </div>
    </article>
  `
}

export function testimonialsSection() {
  const starSvg = '<svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>'

  return `
    <section class="mb-8 md:mb-12 relative px-2">
       <div class="text-center mb-6 md:mb-10">
          <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">La experiencia G&L</h2>
          <div class="inline-flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800">
             <span class="text-2xl font-black text-gray-900 dark:text-white">4.9</span>
             <div class="flex flex-col items-start leading-none">
                <div class="flex gap-0.5 mb-1">
                   ${[1,2,3,4,5].map(() => starSvg).join('')}
                </div>
                <span class="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Basado en +500 reseñas</span>
             </div>
          </div>
       </div>
       
      <div class="grid md:grid-cols-3 gap-4 md:gap-6">
        ${testimonials.map(t => `
          <div class="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none relative group hover:-translate-y-1 transition-transform duration-300">
             <div class="absolute top-6 right-6 text-gray-100 dark:text-gray-800 group-hover:text-brand/10 transition-colors duration-300">
                <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
             </div>
            <div class="relative z-10 flex flex-col h-full">
              <div class="flex items-center gap-1 mb-4">
                 ${renderStars(t.rating)}
              </div>
              <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed italic flex-grow">"${t.text}"</p>
              <div class="flex items-center gap-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                <img src="${t.avatar}" alt="${t.name}" class="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm" loading="lazy" onerror="this.src='/placeholder.webp'"/>
                <div>
                  <h4 class="text-sm font-bold text-gray-900 dark:text-white">${t.name}</h4>
                  <span class="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Compra verificada
                  </span>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `
}
