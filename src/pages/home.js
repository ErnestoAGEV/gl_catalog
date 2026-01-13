import { BRAND } from '../app/config.js'
import { formatMoney } from '../app/format.js'
import { getState, isInWishlist, toggleWishlist, subscribeNewsletter, isSubscribedNewsletter } from '../app/store.js'
import { on, qs } from '../app/dom.js'

// Hero slides for carousel
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=800&h=600&fit=crop',
    badge: 'NUEVA COLECCIÓN 2026',
    title: 'Estilo<br/>sin esfuerzo',
    subtitle: 'Descubre nuestra colección de ropa masculina.',
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
  const inWishlist = isInWishlist(p.id)
  
  return `
    <article class="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in h-full flex flex-col" style="animation-delay: ${idx * 50}ms">
      <a href="#/catalog" class="block relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img 
          src="${img}" 
          alt="${p.name}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          ${p.badge ? `<span class="inline-flex px-2.5 py-1 text-[10px] font-bold tracking-wider ${getBadgeColor(p.badge)} text-white uppercase rounded-md shadow-sm">${p.badge}</span>` : ''}
          ${p.stock <= 5 && p.stock > 0 ? `<span class="inline-flex px-2.5 py-1 text-[10px] font-bold tracking-wider bg-orange-500 text-white uppercase rounded-md shadow-sm">¡Últimas piezas!</span>` : ''}
        </div>

        <!-- Wishlist -->
        <button 
          data-wishlist="${p.id}" 
          class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all text-gray-400 hover:text-red-500 dark:text-gray-400 group-hover/btn:text-red-500"
        >
          <svg class="w-5 h-5 ${inWishlist ? 'text-red-500 fill-current' : 'fill-none'}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
      </a>
      
      <div class="p-4 flex flex-col flex-grow">
        <div class="flex items-center gap-1.5 mb-2">
          ${renderStars(p.rating || 4.5)}
          <span class="text-xs font-medium text-gray-400 dark:text-gray-500">(${p.reviews || 0})</span>
        </div>
        
        <h3 class="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-brand transition-colors">${p.name}</h3>
        
        <div class="mt-auto flex items-center gap-2 pt-2">
            <p class="text-lg font-black text-gray-900 dark:text-white">${formatMoney(p.price)}</p>
            ${p.originalPrice ? `<p class="text-xs text-gray-400 line-through decoration-gray-400/50">${formatMoney(p.originalPrice)}</p>` : ''}
            ${p.originalPrice ? `<span class="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">-${Math.round((1 - p.price/p.originalPrice)*100)}%</span>` : ''}
        </div>
      </div>
    </article>
  `
}

export function pageHome() {
  const state = getState()
  
  // Get featured products (best rated)
  const featured = [...state.products]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4)
  
  // Best sellers (most reviews)
  const bestSellers = [...state.products]
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
    .slice(0, 4)

  // New arrivals (with "Nuevo" badge)
  const newArrivals = state.products.filter(p => p.badge === 'Nuevo').slice(0, 4)

  const isSubscribed = isSubscribedNewsletter()

  return {
    title: `${BRAND.name} | Ropa de Hombre`,
    html: `
      <!-- Hero Section - Redesigned -->
      <section class="relative -mx-4 -mt-5 mb-8">
        <div class="relative h-[65vh] min-h-[500px] w-full overflow-hidden">
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="#/catalog" class="relative aspect-[3/4] md:aspect-[4/5] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500">
            <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop" alt="Camisas" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent transition-opacity"></div>
            <div class="absolute inset-x-0 bottom-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20">Casual</span>
              <h3 class="text-3xl font-black text-white mb-2 leading-tight">Camisas Premium</h3>
              <div class="h-0 group-hover:h-auto overflow-hidden transition-all duration-500">
                  <p class="text-gray-300 text-sm pt-2 border-t border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">Descubre nuestra colección de camisas fit y casuales.</p>
              </div>
            </div>
          </a>
          
          <a href="#/catalog" class="relative aspect-[3/4] md:aspect-[4/5] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500">
            <img src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop" alt="Playeras" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent transition-opacity"></div>
             <div class="absolute inset-x-0 bottom-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20">Básicos</span>
              <h3 class="text-3xl font-black text-white mb-2 leading-tight">Playeras Esenciales</h3>
               <div class="h-0 group-hover:h-auto overflow-hidden transition-all duration-500">
                  <p class="text-gray-300 text-sm pt-2 border-t border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">Algodón pima de alta calidad para tu día a día.</p>
              </div>
            </div>
          </a>
          
          <a href="#/catalog" class="relative aspect-[3/4] md:aspect-[4/5] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500">
            <img src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop" alt="Pantalones" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent transition-opacity"></div>
             <div class="absolute inset-x-0 bottom-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20">Denim</span>
              <h3 class="text-3xl font-black text-white mb-2 leading-tight">Jeans & Pantalones</h3>
               <div class="h-0 group-hover:h-auto overflow-hidden transition-all duration-500">
                  <p class="text-gray-300 text-sm pt-2 border-t border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">Corte perfecto y durabilidad garantizada.</p>
              </div>
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
          ${bestSellers.map((p, i) => featuredProductCard(p, i)).join('')}
        </div>
        
         <div class="mt-8 text-center md:hidden">
            <a href="#/catalog" class="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 transition-colors">
                Ver más productos
            </a>
        </div>
      </section>

      <!-- Promo Banner -->
      <section class="mb-16 relative rounded-[2rem] overflow-hidden shadow-2xl group">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
          alt="Promo"
          class="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
        <div class="absolute inset-0 flex items-center p-8 md:p-12">
          <div class="max-w-md animate-slide-up">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-brand text-white rounded-full mb-4 shadow-lg shadow-brand/20">
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span class="text-[10px] font-black uppercase tracking-wider">Oferta Exclusiva</span>
            </div>
            
            <h2 class="text-4xl md:text-5xl font-black text-white leading-tight mb-2">10% OFF</h2>
            <p class="text-lg text-gray-200 mb-6 font-medium">Obtén un descuento especial en tu primera compra.</p>
            
            <div class="flex flex-col sm:flex-row items-start gap-3">
              <div class="relative group/code">
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
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Nuevos lanazamientos</h2>
          </div>
          <a href="#/catalog" class="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            Ver todo
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 stagger-children">
          ${newArrivals.map((p, i) => featuredProductCard(p, i)).join('')}
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

      <!-- Instagram Feed -->
      <section class="mb-16">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Síguenos en Instagram</h2>
            <p class="text-gray-500 dark:text-gray-400 mt-1">Únete a nuestra comunidad @gyl.mx</p>
          </div>
          <a href="https://instagram.com" target="_blank" class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full text-white text-sm font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:-translate-y-0.5 transition-all">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            Seguir
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${instagramPosts.map((img, i) => `
            <a href="https://instagram.com" target="_blank" class="aspect-square rounded-2xl overflow-hidden group relative shadow-md hover:shadow-xl transition-all">
              <img src="${img}" alt="Instagram" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
            </a>
          `).join('')}
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
            <form id="newsletter-form" class="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div class="flex flex-col gap-4">
                  <div>
                    <label class="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2" for="email">Correo electrónico</label>
                    <input 
                        type="email" 
                        name="email"
                        id="email"
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
    `,
    onMount(root) {
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

      // Wishlist toggle
      on(root, 'click', '[data-wishlist]', (ev, btn) => {
        ev.preventDefault()
        ev.stopPropagation()
        const productId = btn.dataset.wishlist
        toggleWishlist(productId)
        
        // Animate heart
        const svg = btn.querySelector('svg')
        svg.classList.add('heart-pop')
        setTimeout(() => svg.classList.remove('heart-pop'), 300)
      })

      // Newsletter form
      const newsletterForm = qs(root, '#newsletter-form')
      if (newsletterForm) {
        newsletterForm.addEventListener('submit', (ev) => {
          ev.preventDefault()
          const email = newsletterForm.querySelector('input[name="email"]').value.trim()
          if (email) {
            subscribeNewsletter(email)
            newsletterForm.innerHTML = `
              <div class="flex items-center justify-center gap-2 text-white py-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-sm font-medium">¡Gracias por suscribirte!</span>
              </div>
            `
          }
        })
      }
    },
  }
}
