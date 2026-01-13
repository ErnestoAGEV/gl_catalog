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
  },
  {
    image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&h=600&fit=crop',
    badge: 'OFERTAS ESPECIALES',
    title: 'Hasta 30%<br/>de descuento',
    subtitle: 'En prendas seleccionadas. Por tiempo limitado.',
  },
  {
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&h=600&fit=crop',
    badge: 'TEMPORADA',
    title: 'Lo mejor<br/>del invierno',
    subtitle: 'Chamarras, sudaderas y más.',
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
    <article class="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all animate-fade-in" style="animation-delay: ${idx * 100}ms">
      <a href="#/catalog" class="block">
        <div class="aspect-[3/4] overflow-hidden relative bg-gray-100">
          <img 
            src="${img}" 
            alt="${p.name}"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-10"
            loading="lazy"
          />
          
          <!-- Badges -->
          <div class="absolute top-2 left-2 flex flex-col gap-1 z-20">
            ${p.badge ? `<span class="inline-block px-2 py-1 text-[10px] font-bold ${getBadgeColor(p.badge)} text-white rounded">${p.badge.toUpperCase()}</span>` : ''}
            ${p.stock <= 5 && p.stock > 0 ? `<span class="inline-block px-2 py-1 text-[10px] font-bold bg-orange-500 text-white rounded">¡Últimas ${p.stock}!</span>` : ''}
          </div>

          <!-- Wishlist button -->
          <button 
            data-wishlist="${p.id}" 
            class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform btn-scale"
          >
            <svg class="w-4 h-4 ${inWishlist ? 'text-red-500' : 'text-gray-400'}" fill="${inWishlist ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>
      </a>
      
      <div class="p-3">
        <div class="flex items-center gap-1 mb-1">
          ${renderStars(p.rating || 4.5)}
          <span class="text-[10px] text-gray-500">(${p.reviews || 0})</span>
        </div>
        <h3 class="text-sm font-medium text-gray-900 truncate">${p.name}</h3>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-base font-bold text-gray-900">${formatMoney(p.price)}</p>
          ${p.originalPrice ? `<p class="text-xs text-gray-400 line-through">${formatMoney(p.originalPrice)}</p>` : ''}
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
      <!-- Hero Carousel -->
      <section class="relative -mx-4 -mt-5 mb-8 h-[60vh] min-h-[420px] overflow-hidden">
        <div id="hero-carousel" class="flex h-full transition-transform duration-500 ease-out">
          ${heroSlides.map((slide, idx) => `
            <div class="flex-shrink-0 w-full h-full relative">
              <img 
                src="${slide.image}"
                alt="Hero ${idx + 1}"
                class="absolute inset-0 w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
              
              <div class="relative h-full flex flex-col justify-end p-6 pb-16">
                <span class="inline-block w-fit px-3 py-1 mb-4 text-xs font-medium tracking-wider text-white bg-white/20 backdrop-blur rounded-full">
                  ${slide.badge}
                </span>
                <h1 class="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-3">
                  ${slide.title}
                </h1>
                <p class="text-base text-gray-200 mb-6 max-w-xs">
                  ${slide.subtitle}
                </p>
                <div class="flex gap-3">
                  <a
                    href="#/catalog"
                    class="inline-flex items-center justify-center px-6 py-3 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors btn-scale"
                  >
                    Comprar ahora
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Carousel indicators -->
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          ${heroSlides.map((_, idx) => `
            <button data-slide="${idx}" class="w-2 h-2 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/40'} transition-colors"></button>
          `).join('')}
        </div>

        <!-- Carousel arrows -->
        <button id="hero-prev" class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white hover:bg-black/50 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button id="hero-next" class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white hover:bg-black/50 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </section>

      <!-- Categories -->
      <section class="mb-10">
        <h2 class="text-lg font-bold text-white mb-4">Categorías</h2>
        <div class="grid grid-cols-3 gap-2">
          <a href="#/catalog" class="relative aspect-square rounded-xl overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop" alt="Camisas" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:from-black/80 transition-colors"></div>
            <span class="absolute bottom-3 left-3 text-xs font-bold text-white">CAMISAS</span>
          </a>
          <a href="#/catalog" class="relative aspect-square rounded-xl overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&h=300&fit=crop" alt="Playeras" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:from-black/80 transition-colors"></div>
            <span class="absolute bottom-3 left-3 text-xs font-bold text-white">PLAYERAS</span>
          </a>
          <a href="#/catalog" class="relative aspect-square rounded-xl overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=300&fit=crop" alt="Pantalones" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:from-black/80 transition-colors"></div>
            <span class="absolute bottom-3 left-3 text-xs font-bold text-white">PANTALONES</span>
          </a>
        </div>
      </section>

      <!-- Best Sellers -->
      <section class="mb-10">
        <div class="flex items-end justify-between mb-5">
          <div>
            <span class="text-xs font-medium text-brand uppercase tracking-wider">Lo más vendido</span>
            <h2 class="text-xl font-bold text-white mt-1">Favoritos del público</h2>
          </div>
          <a href="#/catalog" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Ver todo →
          </a>
        </div>
        <div class="grid grid-cols-2 gap-3 stagger-children">
          ${bestSellers.map((p, i) => featuredProductCard(p, i)).join('')}
        </div>
      </section>

      <!-- Promo Banner -->
      <section class="mb-10 relative rounded-2xl overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=250&fit=crop"
          alt="Promo"
          class="w-full h-44 object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent flex items-center p-6">
          <div>
            <p class="text-brand text-xs font-bold uppercase tracking-wider mb-1">CUPÓN EXCLUSIVO</p>
            <p class="text-2xl font-bold text-white mb-1">10% de descuento</p>
            <p class="text-sm text-gray-300 mb-3">Usa el código <span class="font-mono bg-white/20 px-2 py-0.5 rounded">WELCOME10</span></p>
            <a href="#/catalog" class="inline-flex text-sm font-medium text-white underline underline-offset-2 hover:no-underline">
              Comprar ahora →
            </a>
          </div>
        </div>
      </section>

      <!-- New Arrivals -->
      ${newArrivals.length > 0 ? `
      <section class="mb-10">
        <div class="flex items-end justify-between mb-5">
          <div>
            <span class="text-xs font-medium text-blue-400 uppercase tracking-wider">Recién llegados</span>
            <h2 class="text-xl font-bold text-white mt-1">Nuevos productos</h2>
          </div>
          <a href="#/catalog" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Ver todo →
          </a>
        </div>
        <div class="grid grid-cols-2 gap-3 stagger-children">
          ${newArrivals.map((p, i) => featuredProductCard(p, i)).join('')}
        </div>
      </section>
      ` : ''}

      <!-- USP Banner -->
      <section class="mb-10 rounded-2xl bg-gray-900/80 p-6">
        <div class="grid grid-cols-2 gap-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">WhatsApp</p>
              <p class="text-xs text-gray-400">Compra fácil</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">Envío gratis</p>
              <p class="text-xs text-gray-400">+$999 MXN</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">Garantía</p>
              <p class="text-xs text-gray-400">Calidad 100%</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">Pago flexible</p>
              <p class="text-xs text-gray-400">Contra entrega</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="mb-10">
        <h2 class="text-lg font-bold text-white mb-4">Lo que dicen nuestros clientes</h2>
        <div class="flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
          ${testimonials.map(t => `
            <div class="flex-shrink-0 w-72 bg-gray-900 rounded-xl p-4">
              <div class="flex items-center gap-3 mb-3">
                <img src="${t.avatar}" alt="${t.name}" class="w-10 h-10 rounded-full object-cover"/>
                <div>
                  <p class="text-sm font-semibold text-white">${t.name}</p>
                  <div class="flex">${renderStars(t.rating)}</div>
                </div>
              </div>
              <p class="text-sm text-gray-300">"${t.text}"</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Instagram Feed -->
      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-white">Síguenos en Instagram</h2>
          <a href="https://instagram.com" target="_blank" class="text-sm text-gray-400 hover:text-white transition-colors">@gyl.mx</a>
        </div>
        <div class="grid grid-cols-4 gap-1 rounded-xl overflow-hidden">
          ${instagramPosts.map(img => `
            <a href="https://instagram.com" target="_blank" class="aspect-square overflow-hidden group">
              <img src="${img}" alt="Instagram" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
            </a>
          `).join('')}
        </div>
      </section>

      <!-- Newsletter -->
      <section class="mb-6 bg-brand rounded-2xl p-6 text-center">
        <h2 class="text-xl font-bold text-white mb-2">¿Quieres recibir ofertas?</h2>
        <p class="text-sm text-blue-100 mb-4">Suscríbete y recibe un cupón de 10% de descuento</p>
        
        ${isSubscribed ? `
          <div class="flex items-center justify-center gap-2 text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="text-sm font-medium">¡Ya estás suscrito!</span>
          </div>
        ` : `
          <form id="newsletter-form" class="flex gap-2">
            <input 
              type="email" 
              name="email"
              placeholder="tu@email.com" 
              class="flex-1 px-4 py-2.5 rounded-full bg-white/20 border border-white/30 text-white placeholder:text-blue-100 text-sm focus:outline-none focus:border-white"
              required
            />
            <button type="submit" class="px-5 py-2.5 bg-white text-brand font-semibold rounded-full text-sm hover:bg-blue-50 transition-colors btn-scale">
              Suscribir
            </button>
          </form>
        `}
      </section>
    `,
    onMount(root) {
      // Hero carousel
      const carousel = qs(root, '#hero-carousel')
      const indicators = root.querySelectorAll('[data-slide]')
      let currentSlide = 0
      const totalSlides = heroSlides.length

      const goToSlide = (idx) => {
        currentSlide = idx
        carousel.style.transform = `translateX(-${idx * 100}%)`
        indicators.forEach((ind, i) => {
          ind.classList.toggle('bg-white', i === idx)
          ind.classList.toggle('bg-white/40', i !== idx)
        })
      }

      on(root, 'click', '[data-slide]', (ev, btn) => {
        goToSlide(Number(btn.dataset.slide))
      })

      on(root, 'click', '#hero-prev', () => {
        goToSlide((currentSlide - 1 + totalSlides) % totalSlides)
      })

      on(root, 'click', '#hero-next', () => {
        goToSlide((currentSlide + 1) % totalSlides)
      })

      // Auto-advance carousel
      let autoSlide = setInterval(() => goToSlide((currentSlide + 1) % totalSlides), 5000)
      root.addEventListener('mouseenter', () => clearInterval(autoSlide))
      root.addEventListener('mouseleave', () => {
        autoSlide = setInterval(() => goToSlide((currentSlide + 1) % totalSlides), 5000)
      })

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
