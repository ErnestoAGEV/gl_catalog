import { BRAND } from '../app/config.js'
import { formatMoney } from '../app/format.js'
import { getState, subscribeNewsletter, isSubscribedNewsletter, getMostViewedProducts, trackProductView, addToCart, cartCount } from '../app/store.js'
import { on, qs } from '../app/dom.js'
import { showToast } from '../app/toast.js'
import { showMiniCart } from '../app/miniCart.js'

// Hero slides for carousel
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=800&h=600&fit=crop',
    badge: 'NUEVA COLECCIÓN 2026',
    title: 'Estilo<br/>sin esfuerzo',
    subtitle: 'Descubre tu estilo con nosotros.',
    accent: 'from-blue-600/30',
  },
  {
    image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&h=600&fit=crop',
    badge: 'OFERTAS ESPECIALES',
    title: 'Hasta 30%<br/>de descuento',
    subtitle: 'En prendas seleccionadas. Por tiempo limitado.',
    accent: 'from-red-600/30',
  },
  {
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&h=600&fit=crop',
    badge: 'TEMPORADA',
    title: 'Lo mejor<br/>del invierno',
    subtitle: 'Chamarras, sudaderas y más.',
    accent: 'from-purple-600/30',
  },
]

// Testimonials
const testimonials = [
  { name: 'Carlos M.', rating: 5, text: 'Excelente calidad en las playeras. Ya es mi tercera compra.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Roberto G.', rating: 5, text: 'El envío fue rapidísimo y la atención por WhatsApp muy buena.', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
  { name: 'Miguel A.', rating: 4, text: 'Los pantalones quedaron perfectos. Muy recomendado.', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
]

// Instagram feed (simulated)
const instagramPosts = [
  'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=300&h=300&fit=crop',
]

function getBadgeColor(badge) {
  const colors = {
    'Nuevo': 'bg-blue-500',
    'Oferta': 'bg-red-500',
    'Popular': 'bg-amber-500',
    'Premium': 'bg-purple-500',
  }
  return colors[badge] || 'bg-gray-700'
}

function homeSkeletonCard() {
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


function renderStars(rating) {
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

function featuredProductCard(p, idx) {
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop'
  const isPerfume = p.type === 'Perfumes'
  const imageFitClass = isPerfume ? 'object-contain p-4' : 'object-cover'
  const imageBgClass = isPerfume ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800'
  
  return `
    <article class="product-card group relative bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-200 md:hover:shadow-lg md:hover:shadow-gray-900/[0.06] dark:md:hover:shadow-none md:hover:-translate-y-0.5 md:hover:border-gray-200 dark:md:hover:border-gray-700 active:scale-[0.98] md:active:scale-100 animate-fade-in h-full flex flex-col cursor-pointer" style="animation-delay: ${idx * 40}ms" data-home-qv="${p.id}">
      <div class="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden ${imageBgClass}">
        <img 
          src="${img}" 
          alt="${p.name}"
          class="w-full h-full ${imageFitClass} group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          loading="lazy"
        />
        
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

export function pageHome() {
  const state = getState()
  
  // Get featured products
  const featured = [...state.products]
    .slice(0, 4)
  
  // Best sellers (most viewed by customers)
  const bestSellers = getMostViewedProducts(4)

  // New arrivals (with "Nuevo" badge)
  const newArrivals = state.products.filter(p => p.badge === 'Nuevo').slice(0, 4)

  const isSubscribed = isSubscribedNewsletter()

  return {
    title: `${BRAND.name} | Men´s Cloting`,
    html: `
      <!-- Hero Section - Redesigned -->
      <section class="relative mb-8">
        <div class="relative h-[65vh] min-h-[500px] w-full overflow-hidden rounded-2xl">
            <img 
              src="${heroSlides[0].image}"
              alt="Nueva Colección"
              class="absolute inset-0 w-full h-full object-cover object-center animate-fade-in"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent"></div>
            <div class="absolute inset-0 flex items-center p-6 md:p-12">
              <div class="max-w-lg space-y-6 animate-slide-up">
                 <span class="inline-block px-3 py-1 bg-brand text-white text-xs font-bold tracking-[0.2em] uppercase rounded shadow-lg shadow-brand/20 backdrop-blur-sm">
                  ${heroSlides[0].badge}
                </span>
                <h1 class="text-5xl md:text-7xl font-black text-white leading-[1.1] drop-shadow-xl">
                  ${heroSlides[0].title}
                </h1>
                <p class="text-lg text-gray-200 font-medium leading-relaxed drop-shadow-md border-l-4 border-brand pl-4">
                   ${heroSlides[0].subtitle}
                </p>
                
                <div class="pt-4">
                  <a href="#/catalog" class="group inline-flex items-center gap-3 px-8 py-4 bg-brand text-white text-sm font-bold rounded-full hover:bg-brand-dark transition-all shadow-lg shadow-brand/40 hover:shadow-brand/60 hover:-translate-y-1">
                    Ver colección
                    <svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                  </a>
                </div>
              </div>
            </div>
        </div>
      </section>



      <!-- Quick Shop Categories -->
      <section class="mb-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Explora por categoría</h2>
          <a href="#/catalog" class="group text-sm font-medium text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1">
            Ver todo
            <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <!-- Camisas -->
          <a href="#/catalog" class="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://i.pinimg.com/736x/f0/cc/e5/f0cce55c3da63f81343dd530422c7558.jpg" alt="Camisas" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Casual</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Camisas</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Estilo y confort para cualquier ocasión.</p>
            </div>
          </a>
          
          <!-- Playeras -->
          <a href="#/catalog" class="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://i.pinimg.com/736x/9d/b5/3a/9db53ac193e070ec32bfc55102d5cadb.jpg" alt="Playeras" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Básicos</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Playeras</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Algodón pima de alta calidad.</p>
            </div>
          </a>
          
          <!-- Pantalones -->
          <a href="#/catalog" class="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://i.pinimg.com/736x/8a/e5/6c/8ae56c59aba6c6a1f88e579b133a0104.jpg" alt="Pantalones" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Denim</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Jeans & Chinos</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Corte perfecto y durabilidad.</p>
            </div>
          </a>

          <!-- Perfumes -->
          <a href="#/catalog" class="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://i.pinimg.com/736x/2c/f3/45/2cf345c33502c764d0a39389f18fce93.jpg" alt="Perfumes" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Fragancias</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Perfumes</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Las mejores fragancias para él.</p>
            </div>
          </a>
        </div>
      </section>

      <!-- Best Sellers - Grid -->
      <section class="mb-16">
        <div class="flex items-end justify-between mb-8">
          <div>
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-brand uppercase tracking-widest mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-brand"></span>
              Favoritos
            </span>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Lo más vendido</h2>
          </div>
          <a href="#/catalog" class="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            Ver catálogo
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          ${bestSellers.length > 0 
            ? bestSellers.map((p, i) => featuredProductCard(p, i)).join('') 
            : Array.from({ length: 4 }, () => homeSkeletonCard()).join('')
          }
        </div>
        
         <div class="mt-8 text-center md:hidden">
            <a href="#/catalog" class="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 transition-colors">
                Ver más productos
            </a>
        </div>
      </section>

      <!-- New Arrivals -->
      ${newArrivals.length > 0 ? `
      <section class="mb-16">
        <div class="flex items-center justify-between mb-8">
           <div>
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Recién llegados
            </span>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Recien Llegados</h2>
          </div>
          <a href="#/catalog" class="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            Ver todo
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 stagger-children">
          ${newArrivals.length > 0 
            ? newArrivals.map((p, i) => featuredProductCard(p, i)).join('')
            : Array.from({ length: 4 }, () => homeSkeletonCard()).join('')
          }
        </div>
      </section>
      ` : ''}

      <!-- Features / Trust Section -->
      <section class="mb-12 border-y border-gray-100 dark:border-gray-800 py-10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
          <!-- WhatsApp -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-green-600 dark:text-green-400">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Pedido por WhatsApp</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Atención personalizada</p>
          </div>

          <!-- Shipping -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
            </div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Envío Gratis</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">En compras +$999</p>
          </div>

          <!-- Warranty -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-purple-600 dark:text-purple-400">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Garantía de Calidad</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Satisfacción asegurada</p>
          </div>

          <!-- Payment -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-orange-600 dark:text-orange-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Pago Seguro</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Con tarjeta o efectivo</p>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="mb-12 relative px-2">
         <div class="text-center mb-10">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">La experiencia G&L</h2>
            <div class="inline-flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800">
               <span class="text-2xl font-black text-gray-900 dark:text-white">4.9</span>
               <div class="flex flex-col items-start leading-none">
                  <div class="flex gap-0.5 mb-1">
                     ${[1,2,3,4,5].map(() => '<svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>').join('')}
                  </div>
                  <span class="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Basado en +500 reseñas</span>
               </div>
            </div>
         </div>
         
        <div class="grid md:grid-cols-3 gap-6">
          ${testimonials.map(t => `
            <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none relative group hover:-translate-y-1 transition-transform duration-300">
               <div class="absolute top-6 right-6 text-gray-100 dark:text-gray-800 group-hover:text-brand/10 transition-colors duration-300">
                  <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
               </div>
              <div class="relative z-10 flex flex-col h-full">
                <div class="flex items-center gap-1 mb-4">
                   ${renderStars(t.rating)}
                </div>
                <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed italic flex-grow">"${t.text}"</p>
                <div class="flex items-center gap-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                  <img src="${t.avatar}" alt="${t.name}" class="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"/>
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

      <!-- Promo Banners -->
      <section class="mb-16 grid md:grid-cols-1 gap-6">
        <div class="relative rounded-[2rem] overflow-hidden shadow-2xl group min-h-[18rem] flex items-center">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
            alt="Promo"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
          <div class="relative z-10 w-full p-6 md:p-10">
            <div class="max-w-md">
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-brand text-white rounded-full mb-4 shadow-lg shadow-brand/20">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                <span class="text-[10px] font-black uppercase tracking-wider">Oferta Exclusiva</span>
              </div>
              <h2 class="text-3xl md:text-4xl font-black text-white leading-tight mb-2">10% OFF</h2>
              <p class="text-base md:text-lg text-gray-200 mb-6 font-medium">Obtén un descuento especial en tu primera compra.</p>
              <div class="flex flex-col sm:flex-row items-start gap-3 w-full sm:w-auto">
                <div class="relative group/code w-full sm:w-auto">
                   <code class="block px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white font-mono text-lg tracking-widest text-center">WELCOME10</code>
                   <button id="copy-coupon" class="absolute inset-0 w-full h-full flex items-center justify-center bg-brand/90 opacity-0 group-hover/code:opacity-100 transition-opacity rounded-xl cursor-copy text-white font-bold text-xs gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      Copiar
                   </button>
                </div>
                <a href="#/catalog" class="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors w-full sm:w-auto">
                  Usar cupón
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Newsletter -->
      <section class="mb-8 relative overflow-hidden rounded-[2rem] bg-brand p-8 md:p-12">
        <div class="absolute inset-0 bg-blue-600"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-brand via-blue-700 to-indigo-900"></div>
        <!-- Decorative circles -->
         <div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/5 blur-3xl"></div>
         <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-black/10 blur-2xl"></div>
        
        <div class="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div class="text-left">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full mb-4 border border-white/10">
                    <svg class="w-4 h-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span class="text-[10px] font-bold text-white uppercase tracking-wider">Club G&L</span>
                </div>
                <h2 class="text-3xl md:text-4xl font-black text-white mb-3">Únete a nosotros.</h2>
                <p class="text-blue-100 text-lg">Suscríbete para recibir ofertas exclusivas y novedades antes que nadie. Además, <strong>10% OFF</strong> en tu primera orden.</p>
            </div>
        
          ${isSubscribed ? `
            <div class="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20">
              <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-900/20">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-1">¡Ya estás dentro!</h3>
              <p class="text-blue-200 text-sm">Gracias por ser parte de la comunidad.</p>
            </div>
          ` : `
            <form id="newsletter-form-page" class="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div class="flex flex-col gap-4">
                  <div>
                    <label class="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2" for="email-page">Correo electrónico</label>
                    <input 
                        type="email" 
                        name="email"
                        id="email-page"
                        placeholder="ejemplo@correo.com" 
                        class="w-full px-5 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-blue-300/50 focus:outline-none focus:bg-black/30 focus:border-white/30 transition-all"
                        required
                    />
                  </div>
                  <button type="submit" class="w-full px-6 py-4 bg-white text-brand font-black rounded-xl text-sm uppercase tracking-wide hover:bg-blue-50 hover:scale-[1.02] transition-all shadow-lg shadow-black/20">
                    Suscribirme ahora
                  </button>
                  <p class="text-xs text-blue-300 text-center">Respetamos tu privacidad. Sin spam.</p>
              </div>
            </form>
          `}
        </div>
      </section>

      <!-- Locations -->
      <section class="mb-16">
        <div class="text-center mb-10">
           <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nuestras Sucursales</h2>
           <p class="text-gray-500 dark:text-gray-400">Visítanos en nuestras tiendas físicas</p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-6">
           <!-- Colima -->
           <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg flex items-start gap-4 hover:shadow-xl transition-all group">
             <div class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
             </div>
             <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Colima Centro</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Zaragoza #140<br/>Col. Centro, Colima</p>
                <a href="https://www.google.com/maps/place/G%26L+Colima/@19.2424015,-103.7280069,17z/data=!3m2!4b1!5s0x84255aab867046b3:0x293c46c0e72ef43a!4m6!3m5!1s0x84255aab8670a0bf:0x969da2ab885623e0!8m2!3d19.2424015!4d-103.725432!16s%2Fg%2F11c45qrg02?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" class="inline-flex items-center gap-1 text-sm font-bold text-brand mt-3 hover:underline">
                   Ver en mapa
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </a>
             </div>
           </div>

           <!-- Villa de Alvarez -->
           <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg flex items-start gap-4 hover:shadow-xl transition-all group">
             <div class="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
             </div>
             <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Villa de Álvarez</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Av. María Ahumada de Gómez #30<br/>Local #6</p>
                <a href="https://www.google.com/maps/place/G%26L+Villa+de+%C3%81lvarez/@19.271313,-103.770113,14z/data=!3m1!4b1!4m6!3m5!1s0x842545c072adffd5:0xdfee853b24213661!8m2!3d19.2713167!4d-103.7332035!16s%2Fg%2F11h53ml_dy?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" class="inline-flex items-center gap-1 text-sm font-bold text-brand mt-3 hover:underline">
                   Ver en mapa
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </a>
             </div>
           </div>
        </div>
      </section>

    `,
    onMount(root) {
      // Quick Add to Cart from home cards
      on(root, 'click', '[data-quick-add]', (ev, btn) => {
        ev.preventDefault()
        ev.stopPropagation()
        if (btn.dataset.busy) return
        btn.dataset.busy = '1'

        const id = btn.dataset.quickAdd
        addToCart({ productId: id, size: '', color: '', qty: 1 })

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
      })

      // Product card click -> navigate to catalog quick view
      root.querySelectorAll('[data-home-qv]').forEach(card => {
        card.addEventListener('click', (e) => {
          // Don't navigate if Quick Add was clicked
          if (e.target.closest('[data-quick-add]')) return
          e.preventDefault()
          const productId = card.dataset.homeQv
          trackProductView(productId)
          sessionStorage.setItem('gl_pending_quickview', productId)
          window.location.hash = '#/catalog'
        })
      })

      // Copy coupon code
      const copyBtn = qs(root, '#copy-coupon')
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText('WELCOME10')
          copyBtn.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
          setTimeout(() => {
            copyBtn.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>'
          }, 2000)
        })
      }

      // Newsletter Logic (Page only)
      const form = qs(root, '#newsletter-form-page')
      if (form) {
        form.addEventListener('submit', (ev) => {
          ev.preventDefault()
          const emailInput = form.querySelector('input[type="email"]')
          const email = emailInput ? emailInput.value.trim() : ''
          
          if (email) {
            subscribeNewsletter(email)
            form.innerHTML = `
                  <div class="flex flex-col items-center justify-center gap-2 text-white py-4 text-center animate-fade-in">
                    <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg mb-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span class="text-sm font-bold">¡Suscripción exitosa!</span>
                    <p class="text-xs text-blue-200">Revisa tu correo para tu cupón.</p>
                  </div>
            `
          }
        })
      }
    },
  }
}
