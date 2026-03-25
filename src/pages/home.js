import { BRAND } from '../app/config.js'
import { getState, subscribeNewsletter, isSubscribedNewsletter, getMostViewedProducts, trackProductView, addToCart, cartCount } from '../app/store.js'
import { on, qs } from '../app/dom.js'
import { showMiniCart } from '../app/miniCart.js'
import { featuredProductCard, homeSkeletonCard, testimonialsSection } from './homeCards.js'
import { quickViewModal } from './catalogModals.js'
import { initModalCarousel, initModalZoom } from './catalogCarousels.js'
import { showToast } from '../app/toast.js'
import { handleQuickAdd } from './catalogQuickAdd.js'

export function pageHome() {
  const state = getState()
  const isSubscribed = isSubscribedNewsletter()
  const publicProducts = state.products.filter(p => p.badge !== 'Borrador')

    // Get featured products
  const featured = [...publicProducts].slice(0, 4)

    // Best sellers (most viewed by customers)
  const bestSellers = getMostViewedProducts(4)

    // New arrivals (with "Nuevo" badge)
  const newArrivals = publicProducts.filter(p => p.badge === 'Nuevo').slice(0, 4)

  return {
    title: `${BRAND.name} | Men´s Cloting`,
    html: `
      <!-- Hero Section - Premium Minimalist -->
      <section class="relative min-h-[90vh] md:min-h-[85vh] w-full overflow-hidden mb-8 md:mb-12">
        <!-- Background Image -->
        <div class="absolute inset-0">
          <img 
            src="https://images.squarespace-cdn.com/content/v1/65265e4b2af6d222af0e276c/268a695a-a105-4821-86e6-f6541497a0b3/editorial-fashion-photo-laughing-blue-studio-setup.jpg"
            alt="Nueva Colección"
            class="w-full h-full object-cover object-center"
            loading="lazy"
          />
          <!-- Subtle elegant overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10"></div>
        </div>
        
        <!-- Content - Bottom aligned on mobile, centered on desktop -->
        <div class="relative h-full min-h-[90vh] md:min-h-[85vh] flex items-end md:items-center justify-center px-6 md:px-12 pb-16 md:pb-0">
          <div class="max-w-2xl text-center space-y-6 md:space-y-8 animate-fade-in">
            <!-- Title -->
            <h1 class="text-4xl md:text-6xl font-semibold text-white leading-tight tracking-tight">
              Esenciales modernos
            </h1>
            
            <!-- Subtitle -->
            <p class="text-base md:text-xl text-white/90 font-light tracking-wide max-w-lg mx-auto">
              Detalles que marcan diferencia.
            </p>
            
            <!-- CTA -->
            <div class="pt-4 md:pt-6">
              <a 
                href="#/catalog" 
                class="inline-flex items-center justify-center gap-2 px-8 md:px-10 py-3.5 md:py-4 min-h-[48px] border-2 border-white text-white font-medium text-sm md:text-base rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-300 active:scale-95"
              >
                Descubrir colección
              </a>
            </div>
          </div>
        </div>
      </section>



      <!-- Quick Shop Categories -->
      <section class="mb-8 md:mb-12">
        <div class="flex items-center justify-between mb-5 md:mb-8">
          <h2 class="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Explora por categoría</h2>
          <a href="#/catalog" class="group text-xs md:text-sm font-medium text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1">
            Ver todo
            <svg class="w-3.5 h-3.5 md:w-4 md:h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <!-- Camisas -->
          <button data-category-filter="Camisas" class="relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block active:scale-95 w-full text-left cursor-pointer">
            <img src="https://i.pinimg.com/736x/f0/cc/e5/f0cce55c3da63f81343dd530422c7558.jpg" alt="Camisas" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 text-center md:transform md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-white/10 backdrop-blur rounded-full text-[9px] md:text-[10px] font-bold text-white uppercase tracking-widest mb-2 md:mb-3 border border-white/20 shadow-sm">Casual</span>
              <h3 class="text-lg md:text-2xl font-black text-white mb-1 md:mb-2 leading-tight drop-shadow-lg">Camisas</h3>
              <p class="hidden md:block text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Estilo y confort para cualquier ocasión.</p>
            </div>
          </button>
          
          <!-- Playeras -->
          <button data-category-filter="Polos" class="relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block active:scale-95 w-full text-left cursor-pointer">
            <img src="https://i.pinimg.com/1200x/b2/de/7a/b2de7a76b7037ee02ba7394cfb874849.jpg" alt="Polos" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 text-center md:transform md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-white/10 backdrop-blur rounded-full text-[9px] md:text-[10px] font-bold text-white uppercase tracking-widest mb-2 md:mb-3 border border-white/20 shadow-sm">Básicos</span>
              <h3 class="text-lg md:text-2xl font-black text-white mb-1 md:mb-2 leading-tight drop-shadow-lg">Polos</h3>
              <p class="hidden md:block text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Algodón pima de alta calidad.</p>
            </div>
          </button>
          
          <!-- Pantalones -->
          <button data-category-filter="Pantalones" class="relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block active:scale-95 w-full text-left cursor-pointer">
            <img src="https://i.pinimg.com/736x/8a/e5/6c/8ae56c59aba6c6a1f88e579b133a0104.jpg" alt="Pantalones" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Denim</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Jeans & Chinos</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Corte perfecto y durabilidad.</p>
            </div>
          </button>

          <!-- Perfumes -->
          <button data-category-filter="Perfumes" class="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block w-full text-left cursor-pointer">
            <img src="https://i.pinimg.com/736x/2c/f3/45/2cf345c33502c764d0a39389f18fce93.jpg" alt="Perfumes" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Fragancias</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Perfumes</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Las mejores fragancias para él.</p>
            </div>
          </button>
        </div>
      </section>

      <!-- Best Sellers - Grid -->
      <section class="mb-8 md:mb-12">
        <div class="flex items-end justify-between mb-5 md:mb-8">
          <div>
            <span class="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-brand uppercase tracking-widest mb-1.5 md:mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-brand"></span>
              Favoritos
            </span>
            <h2 class="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Lo más vendido</h2>
          </div>
          <a href="#/catalog" class="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            Ver catálogo
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          ${bestSellers.length > 0 
            ? bestSellers.map((p, i) => featuredProductCard(p, i)).join('') 
            : Array.from({ length: 4 }, () => homeSkeletonCard()).join('')
          }
        </div>
        
         <div class="mt-6 md:mt-8 text-center md:hidden">
            <a href="#/catalog" class="inline-flex items-center justify-center w-full px-6 py-3.5 min-h-[48px] bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 transition-colors active:scale-95">
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
      <section class="mb-8 md:mb-12 border-y border-gray-100 dark:border-gray-800 py-8 md:py-10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-y-6 md:gap-y-8 gap-x-3 md:gap-x-4">
          <!-- WhatsApp -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform text-green-600 dark:text-green-400">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            </div>
            <h3 class="text-xs md:text-sm font-bold text-gray-900 dark:text-white">WhatsApp</h3>
            <p class="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">Atención personalizada</p>
          </div>

          <!-- Shipping -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
            </div>
            <h3 class="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Envío Gratis</h3>
            <p class="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">+$999</p>
          </div>

          <!-- Warranty -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform text-purple-600 dark:text-purple-400">
               <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Garantía</h3>
            <p class="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">Calidad asegurada</p>
          </div>

          <!-- Payment -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform text-orange-600 dark:text-orange-400">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <h3 class="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Pago Seguro</h3>
            <p class="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">Tarjeta o efectivo</p>
          </div>
        </div>
      </section>

      ${testimonialsSection()}

      <!-- Promo Banners -->
      <section class="mb-8 md:mb-12 grid md:grid-cols-1 gap-6">
        <div class="relative rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl group min-h-[16rem] md:min-h-[18rem] flex items-center">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
            alt="Promo"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
          <div class="relative z-10 w-full p-5 md:p-10">
            <div class="max-w-md">
              <div class="inline-flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1 bg-brand text-white rounded-full mb-3 md:mb-4 shadow-lg shadow-brand/20">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                <span class="text-[9px] md:text-[10px] font-black uppercase tracking-wider">Oferta Exclusiva</span>
              </div>
              <h2 class="text-2xl md:text-4xl font-black text-white leading-tight mb-2">10% OFF</h2>
              <p class="text-sm md:text-lg text-gray-200 mb-4 md:mb-6 font-medium">Obtén un descuento especial en tu primera compra.</p>
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
      <section class="mb-8 relative overflow-hidden rounded-2xl md:rounded-[2rem] bg-brand p-6 md:p-12">
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
      <section class="mb-8 md:mb-12">
        <div class="text-center mb-6 md:mb-10">
           <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Nuestras Sucursales</h2>
           <p class="text-sm md:text-base text-gray-500 dark:text-gray-400">Visítanos en nuestras tiendas físicas</p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-4 md:gap-6">
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

      <div id="home-modal-container"></div>
    `,
    onMount(root) {
      // Category filter navigation
      root.querySelectorAll('[data-category-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          const types = btn.dataset.categoryFilter // e.g. "Camisas" or "Playeras,Polos"
          sessionStorage.setItem('gl_pending_type_filter', types)
          window.location.hash = '#/catalog'
        })
      })

      // Contenedor global de modales del Home
      const homeModalContainer = qs(root, '#home-modal-container')

      // Quick Add to Cart from home cards
      on(root, 'click', '[data-quick-add]', (ev, btn) => handleQuickAdd(ev, btn, homeModalContainer))

      // Product card click -> open quick view modal directly on home

      const openHomeModal = (product) => {
        trackProductView(product.id)
        homeModalContainer.innerHTML = quickViewModal(product)
        document.body.style.overflow = 'hidden'

        const closeModal = () => {
          homeModalContainer.querySelectorAll('.qv-size-btn').forEach(b => {
            b.classList.remove('qv-size-selected', 'border-brand', 'bg-brand', 'text-white', '!border-brand', '!bg-brand', '!text-white')
          })
          homeModalContainer.querySelectorAll('.modal-img-zoomable').forEach(img => {
            img.style.transform = ''
            img.style.transformOrigin = ''
          })
          const containers = homeModalContainer.querySelectorAll('[data-modal-carousel], [data-modal-single]')
          containers.forEach(c => { c.style.cursor = '' })
          homeModalContainer.innerHTML = ''
          document.body.style.overflow = ''
        }

        homeModalContainer.querySelector('#close-quickview').addEventListener('click', closeModal)
        homeModalContainer.querySelector('#quick-view-modal').addEventListener('click', (e) => {
          if (e.target.id === 'quick-view-modal') closeModal()
        })

        initModalCarousel(homeModalContainer.querySelector('[data-modal-carousel]'))
        initModalZoom(homeModalContainer)

        // Size button selection
        const sizeButtons = homeModalContainer.querySelectorAll('.qv-size-btn')
        sizeButtons.forEach(sizeBtn => {
          sizeBtn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            sizeButtons.forEach(b => {
              b.classList.remove('qv-size-selected', 'border-brand', 'bg-brand', 'text-white', '!border-brand', '!bg-brand', '!text-white')
              b.classList.add('border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300')
            })
            sizeBtn.classList.add('qv-size-selected', '!border-brand', '!bg-brand', '!text-white')
            sizeBtn.classList.remove('border-gray-200', 'dark:border-gray-700', 'text-gray-700', 'dark:text-gray-300', 'hover:text-brand')
            const qvBtn = homeModalContainer.querySelector('#qv-add-to-cart')
            if (qvBtn) {
              qvBtn.disabled = false
              qvBtn.classList.remove('opacity-50', 'cursor-not-allowed')
            }
          })
        })

        const qvAddBtn = homeModalContainer.querySelector('#qv-add-to-cart')
        if (product.sizes && product.sizes.length > 0) {
          qvAddBtn.disabled = true
          qvAddBtn.classList.add('opacity-50', 'cursor-not-allowed')
        }

        qvAddBtn.addEventListener('click', () => {
          if (qvAddBtn.disabled) return
          qvAddBtn.disabled = true
          const selectedSizeBtn = homeModalContainer.querySelector('.qv-size-selected')
          const size = selectedSizeBtn ? selectedSizeBtn.dataset.size : ''
          const colorSelect = homeModalContainer.querySelector('#qv-color')
          const color = colorSelect ? colorSelect.value : ''
          addToCart({ productId: product.id, size, color, qty: 1 })
          // El contador del carrito se actualiza globalmente desde store.js -> startApp.js
          closeModal()
        })
      }

      root.querySelectorAll('[data-home-qv]').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('[data-quick-add]')) return
          e.preventDefault()
          const state = getState()
            const product = publicProducts.find(p => p.id === card.dataset.homeQv)
          if (product) openHomeModal(product)
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
      const form = root.querySelector('#newsletter-form-page')
      if (form) {
        form.addEventListener('submit', async (ev) => {
          ev.preventDefault()
          const emailInput = form.querySelector('input[type="email"]')
          const submitBtn  = form.querySelector('button[type="submit"]')
          const email = emailInput ? emailInput.value.trim() : ''

          if (!email) return

          // Loading state
          const originalBtnHTML = submitBtn.innerHTML
          submitBtn.disabled = true
          submitBtn.innerHTML = `
            <span class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
              Enviando...
            </span>`

          // Remove previous error if any
          const prevErr = form.querySelector('.newsletter-error')
          if (prevErr) prevErr.remove()

          const result = await subscribeNewsletter(email)

          if (result.ok) {
            form.innerHTML = `
              <div class="flex flex-col items-center justify-center gap-2 text-white py-4 text-center animate-fade-in">
                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg mb-2">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <span class="text-sm font-bold">¡Suscripción exitosa!</span>
                <p class="text-xs text-blue-200">Gracias por unirte al Club G&L.</p>
              </div>`
          } else {
            // Restore button + show error
            submitBtn.disabled = false
            submitBtn.innerHTML = originalBtnHTML
            const errEl = document.createElement('p')
            errEl.className = 'newsletter-error text-xs text-red-300 text-center mt-2'
            errEl.textContent = result.error || 'Ocurrió un error. Intenta de nuevo.'
            form.appendChild(errEl)
          }
        })
      }
    },
  }
}
