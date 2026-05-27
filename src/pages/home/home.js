import { BRAND } from '../../utils/config.js'
import { getState, subscribeNewsletter, isSubscribedNewsletter, getMostViewedProducts } from '../../store/index.js'
import { on, qs } from '../../utils/dom.js'
import { navigate } from '../../core/router.js'
import { bestSellerRow, homeSkeletonCard } from './homeCards.js'
import { sanitizeEmail } from '../../utils/sanitize.js'
import { formatMoney } from '../../utils/format.js'
import { heroSlides, categoryTiles, stats, stores } from './homeData.js'

export function pageHome() {
  const state = getState()
  const isSubscribed = isSubscribedNewsletter()
  const bestSellers = getMostViewedProducts(6)
  const topProduct = getMostViewedProducts(1)[0]
  const publicProducts = state.products.filter(p => p.badge !== 'Borrador')

  // Count pieces per category
  function countByType(type) {
    return publicProducts.filter(p => p.type === type).length
  }

  // Hero slides HTML
  const heroSlidesLeft = heroSlides.map((s, i) => `
    <div class="hero-slide absolute inset-0 flex flex-col justify-center transition-opacity duration-[1200ms] ease ${i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" data-slide="${i}">
      <h1 class="font-heading font-[800] text-[clamp(72px,11vw,184px)] leading-[0.86] tracking-[-0.04em] text-ink mb-6">${s.headline}</h1>
      ${s.couponBody ? `
        <p class="text-[17px] text-ink/70 max-w-[460px] leading-relaxed">
          Aplica <span class="bg-fog font-mono rounded-md px-2 py-1 text-[15px]">WELCOME10</span> en checkout. Válido para clientes nuevos en cualquier categoría.
        </p>
      ` : `<p class="text-[17px] text-ink/70 max-w-[460px] leading-relaxed">${s.body}</p>`}
      <div class="flex items-center gap-6 mt-8">
        ${s.cta.isCopy ? `
          <button id="hero-copy-coupon" class="group inline-flex items-center gap-2.5 h-14 px-7 rounded-full bg-brand text-paper text-[15px] font-semibold hover:bg-ink transition-colors">
            <span class="copy-label">${s.cta.label}</span>
            <span class="arrow-walk">→</span>
          </button>
        ` : `
          <a href="${s.cta.href}" class="hero-cta group inline-flex items-center gap-2.5 h-14 px-7 rounded-full bg-ink text-paper text-[15px] font-semibold hover:bg-brand transition-colors" data-href="${s.cta.href}">
            ${s.cta.label}
            <span class="arrow-walk">→</span>
          </a>
        `}
        ${s.secondary ? `<a href="${s.secondary.href}" class="ul-link text-[14px] font-medium text-ink/70 hover:text-ink">${s.secondary.label}</a>` : ''}
      </div>
    </div>
  `).join('')

  const heroSlidesRight = heroSlides.map((s, i) => `
    <div class="hero-img absolute inset-0 transition-opacity duration-[1200ms] ease ${i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" data-slide="${i}">
      <img src="${s.image}" alt="" class="w-full h-full object-cover" loading="${i === 0 ? 'eager' : 'lazy'}" />
      <div class="absolute bottom-4 left-4">
        <span class="${s.captionClass} text-paper text-[12px] font-mono px-3 py-1.5 rounded-full">${s.caption}</span>
      </div>
    </div>
  `).join('')

  // "Más vendido" card (inline, goes next to ticker)
  const topProductCard = topProduct ? `
    <a href="/producto/${topProduct.id}" class="hidden lg:flex items-center gap-4 bg-paper border border-ink/10 shadow-lg rounded-lg px-4 py-3 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-brand"></span>
        <span class="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/60">Más vendido</span>
      </div>
      <p class="font-heading font-bold text-[15px] text-ink leading-tight">${topProduct.name}</p>
      <span class="font-mono text-[13px] text-ink/70 shrink-0">${formatMoney(topProduct.price)}</span>
    </a>
  ` : ''

  // Category tiles HTML
  const categoriesHtml = categoryTiles.map(tile => {
    const pieces = countByType(tile.categoryType)
    const piecesLabel = `${pieces} pieza${pieces !== 1 ? 's' : ''}`

    if (tile.type === 'image-brand') {
      return `
        <a href="${tile.href}" class="ct ${tile.span} relative bg-ink text-paper rounded-md p-5 flex flex-col justify-between overflow-hidden group">
          <img src="${tile.image}" alt="${tile.name}" class="ct-img absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div class="absolute inset-0 bg-ink/35"></div>
          <span class="font-mono text-[10px] tracking-[0.22em] uppercase opacity-80 relative z-10">${tile.eyebrow}</span>
          <div class="ct-label relative z-10">
            <h3 class="font-heading font-[800] ${tile.headingSize} tracking-[-0.04em]">${tile.name}</h3>
            <span class="font-mono text-[11px] opacity-70">${piecesLabel} →</span>
          </div>
        </a>
      `
    }
    if (tile.type === 'image-ink') {
      return `
        <a href="${tile.href}" class="ct ${tile.span} relative bg-ink text-paper rounded-md p-5 flex flex-col justify-between overflow-hidden group">
          <img src="${tile.image}" alt="${tile.name}" class="ct-img absolute inset-0 w-full h-full object-cover opacity-30" loading="lazy" />
          <div class="absolute inset-0 bg-ink/40"></div>
          <span class="font-mono text-[10px] tracking-[0.22em] uppercase opacity-70 relative z-10">${tile.eyebrow}</span>
          <div class="ct-label relative z-10">
            <h3 class="font-heading font-[800] ${tile.headingSize} tracking-[-0.04em]">${tile.name}</h3>
            <span class="font-mono text-[11px] opacity-70">${piecesLabel} →</span>
          </div>
        </a>
      `
    }
    // Image tiles (Camisas = large, Jeans = medium)
    const isLarge = tile.span.includes('row-span-2')
    const gradient = isLarge
      ? 'bg-gradient-to-br from-ink/40 via-ink/0 to-ink/0'
      : 'bg-gradient-to-t from-ink/35 to-ink/0'
    return `
      <a href="${tile.href}" class="ct ${tile.span} relative rounded-md overflow-hidden group">
        <img src="${tile.image}" alt="${tile.name}" class="ct-img absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div class="absolute inset-0 ${gradient}"></div>
        <div class="relative h-full flex flex-col justify-between p-5 text-paper">
          ${isLarge ? `
            <div class="flex items-center justify-between">
              <span class="bg-paper text-ink rounded-full px-3 py-1.5 text-[11px] font-mono font-medium">${tile.eyebrow}</span>
              <span class="font-mono text-[11px] opacity-70">${piecesLabel}</span>
            </div>
          ` : `
            <span class="font-mono text-[11px] tracking-[0.14em] uppercase opacity-80">${tile.eyebrow}</span>
          `}
          <div class="ct-label">
            ${tile.subtitle ? `<span class="font-mono text-[11px] tracking-[0.14em] uppercase opacity-80 block mb-1">${tile.subtitle}</span>` : ''}
            <h3 class="font-heading font-[800] ${tile.headingSize} tracking-[-0.04em]">${tile.name}${isLarge ? ' →' : ''}</h3>
            ${!isLarge ? `<span class="font-mono text-[11px] opacity-70">${piecesLabel} →</span>` : ''}
          </div>
        </div>
      </a>
    `
  }).join('')

  // Best sellers list
  const bestSellersHtml = bestSellers.length > 0
    ? bestSellers.map((p, i) => bestSellerRow(p, i)).join('')
    : Array.from({ length: 6 }, (_, i) => `
        <li class="grid grid-cols-12 items-center gap-4 py-6 px-3 border-b border-[#EAE9E4]">
          <span class="col-span-1 h-4 w-6 rounded skeleton-shimmer"></span>
          <span class="col-span-7 md:col-span-6 h-8 w-3/4 rounded skeleton-shimmer"></span>
          <span class="hidden md:block col-span-3 h-4 w-1/2 rounded skeleton-shimmer"></span>
          <span class="col-span-4 md:col-span-2 h-4 w-16 rounded skeleton-shimmer ml-auto"></span>
        </li>
      `).join('')

  // Stats HTML
  const statsHtml = stats.map(s => `
    <div class="text-center md:text-left">
      <p class="font-heading font-bold text-[64px] leading-none tracking-[-0.04em] tabular-nums">${s.number}</p>
      <p class="font-mono text-[11px] tracking-[0.24em] uppercase opacity-60 mt-2">${s.caption}</p>
    </div>
  `).join('')

  // Stores HTML
  const storesHtml = stores.map(s => `
    <div class="group bg-fog hover:bg-ink hover:text-paper p-10 rounded-md min-h-[340px] flex flex-col justify-between transition-all duration-[350ms]">
      <div>
        <div class="flex items-center justify-between mb-4">
          <span class="font-mono text-[11px] tracking-[0.22em] uppercase opacity-60">Sucursal — ${s.id}</span>
          <span class="font-mono text-[10px] tracking-[0.24em] uppercase opacity-50">${s.coords}</span>
        </div>
        <h3 class="font-heading font-[800] text-[56px] tracking-[-0.04em] leading-none">${s.name}</h3>
        <p class="font-mono text-[13px] opacity-60 mb-6">${s.fullName}</p>
        <p class="text-[15px] max-w-sm opacity-90 leading-relaxed">${s.address}</p>
      </div>
      <div class="flex items-end justify-between mt-6">
        <div class="font-mono text-[11px] tracking-[0.16em] uppercase opacity-60 leading-relaxed">
          ${s.hours.map(h => `<span class="block">${h}</span>`).join('')}
        </div>
        <a href="${s.mapUrl}" target="_blank" rel="noopener noreferrer" class="ul-link text-[14px] font-medium shrink-0">Cómo llegar →</a>
      </div>
    </div>
  `).join('')

  return {
    title: `${BRAND.name} | Tu fit, perfecto`,
    fullWidth: true,
    noPaddingTop: true,
    forceLight: true,
    html: `
      <!-- §3 — Hero -->
      <section class="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 lg:pt-14 pb-16 lg:pb-20" id="hero-section">
        <!-- Eyebrow -->
        <div class="flex items-center gap-4 mb-8">
          <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60">Vol.03 — O/I '26</span>
          <span class="h-px flex-1 bg-ink/15"></span>
          <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60">Colima · Mx</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">
          <!-- Left: headline carousel -->
          <div class="lg:col-span-7 relative min-h-[440px] md:min-h-[540px]">
            ${heroSlidesLeft}
          </div>

          <!-- Right: image carousel -->
          <div class="lg:col-span-5">
            <div class="aspect-[4/5] bg-fog rounded-md overflow-hidden relative">
              ${heroSlidesRight}
            </div>
          </div>
        </div>

        <!-- Slide ticker -->
        <div class="flex items-center justify-between mt-8 gap-4">
          <div class="flex items-center gap-3 shrink-0">
            <span class="font-mono text-[13px] tabular-nums text-ink" id="slide-current">01</span>
            <div class="w-[160px] h-[2px] bg-ink/10 rounded-full overflow-hidden">
              <div class="h-full bg-ink origin-left" id="slide-progress" style="transform: scaleX(0)"></div>
            </div>
            <span class="font-mono text-[13px] tabular-nums text-ink/40">03</span>
          </div>
          ${topProductCard}
          <div class="flex items-center gap-2 shrink-0">
            <button id="hero-prev" class="w-11 h-11 rounded-full border border-ink/15 flex items-center justify-center text-ink hover:bg-ink hover:text-paper transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button id="hero-next" class="w-11 h-11 rounded-full border border-ink/15 flex items-center justify-center text-ink hover:bg-ink hover:text-paper transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </section>

      <!-- §4 — Stats Band -->
      <section class="bg-ink text-paper py-12 reveal">
        <div class="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            ${statsHtml}
          </div>
        </div>
      </section>

      <!-- §5 — Categories -->
      <section class="py-24 lg:py-32 reveal">
        <div class="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div class="flex flex-col md:flex-row md:items-end md:justify-between mb-14">
            <div>
              <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60 block mb-3">§ 01 — Categorías</span>
              <h2 class="font-heading font-[800] text-[clamp(56px,8vw,128px)] leading-[0.88] tracking-[-0.045em]">Explora<br/>por <span class="text-brand">categoría</span>.</h2>
            </div>
            <a href="/catalog" class="hidden md:inline-flex ul-link text-[14px] font-medium text-ink/70 hover:text-ink mt-4 md:mt-0">Catálogo completo →</a>
          </div>
          <div class="grid grid-cols-12 gap-4 auto-rows-[200px] md:auto-rows-[280px]">
            ${categoriesHtml}
          </div>
        </div>
      </section>

      <!-- §6 — Best Sellers -->
      <section class="bg-fog py-24 lg:py-32 relative reveal">
        <!-- Ambient bg text -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          <div class="marquee-track whitespace-nowrap opacity-[0.04]">
            <span class="font-heading font-[800] text-[180px] leading-none">BEST · SELLERS · FAVORITOS · 2026 &nbsp;&nbsp;</span>
            <span class="font-heading font-[800] text-[180px] leading-none">BEST · SELLERS · FAVORITOS · 2026 &nbsp;&nbsp;</span>
          </div>
          <div class="marquee-track-rev whitespace-nowrap opacity-[0.04] mt-[-40px]">
            <span class="font-heading font-[800] text-[180px] leading-none">BEST · SELLERS · FAVORITOS · 2026 &nbsp;&nbsp;</span>
            <span class="font-heading font-[800] text-[180px] leading-none">BEST · SELLERS · FAVORITOS · 2026 &nbsp;&nbsp;</span>
          </div>
        </div>

        <div class="max-w-[1440px] mx-auto px-6 lg:px-10 relative z-10">
          <!-- Header -->
          <div class="grid grid-cols-1 md:grid-cols-12 md:items-end gap-6 mb-12">
            <div class="md:col-span-7">
              <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60 block mb-3">§ 02 — Favoritos</span>
              <h2 class="font-heading font-[800] text-[clamp(56px,8vw,128px)] leading-[0.88] tracking-[-0.045em]">Lo que más se <span class="text-brand italic">llevan</span>.</h2>
            </div>
            <div class="md:col-span-5 md:text-right">
              <p class="text-[15px] text-ink/60 leading-relaxed">Productos elegidos por nuestros clientes esta temporada. Pasa el cursor sobre cada uno.</p>
            </div>
          </div>

          <!-- List -->
          <ul class="relative">
            ${bestSellersHtml}
          </ul>

          <!-- Bottom -->
          <div class="flex items-center justify-between mt-8">
            <a href="/catalog" class="ul-link text-[14px] font-medium text-ink/70 hover:text-ink">Ver los ${state.products.length > 0 ? state.products.filter(p => p.badge !== 'Borrador').length : '...'} productos →</a>
            <span class="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40">${bestSellers.length > 0 ? String(bestSellers.length).padStart(2, '0') : '00'} productos · vista lista</span>
          </div>
        </div>
      </section>

      <!-- §7 — Manifesto -->
      <section class="bg-brand text-paper py-28 lg:py-40 reveal">
        <div class="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            <div class="md:col-span-3">
              <p class="font-mono text-[11px] tracking-[0.32em] uppercase opacity-70 leading-relaxed">§ 03 — Manifiesto</p>
              <p class="font-mono text-[11px] tracking-[0.32em] uppercase opacity-70 mt-1">G&L / 2026</p>
            </div>
            <div class="md:col-span-9">
              <p class="font-heading font-medium text-[clamp(28px,3.6vw,52px)] leading-[1.1] tracking-[-0.03em]">
                No llenamos el clóset. Curamos. Cada temporada elegimos a mano las mejores marcas — la camisa que se pone una y otra vez, los jeans que solo se ven mejor con el tiempo, la fragancia que la gente te pregunta. <span class="opacity-70">Marcas seleccionadas, al mejor precio. En Colima desde 1995.</span>
              </p>
              <a href="/catalog" class="ul-link text-[14px] font-medium opacity-80 hover:opacity-100 inline-block mt-8">Descubre nuestras marcas →</a>
            </div>
          </div>
        </div>
      </section>

      <!-- §8 — Newsletter -->
      <section class="bg-ink text-paper py-24 lg:py-32 reveal">
        <div class="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div class="grid grid-cols-1 md:grid-cols-12 md:items-end gap-10">
            <div class="md:col-span-7">
              <span class="font-mono text-[11px] tracking-[0.28em] uppercase opacity-60 block mb-3">§ 04 — Club G&L</span>
              <h2 class="font-heading font-[800] text-[clamp(56px,8vw,124px)] leading-[0.86] tracking-[-0.045em]">
                Un correo<br/>al mes.<br/><span class="outline-text">10% off</span><br/><span class="text-brand">de bienvenida.</span>
              </h2>
            </div>
            <div class="md:col-span-5">
              <p class="text-[15px] text-paper/70 leading-relaxed mb-6">Drops antes que nadie. Rebajas privadas. Cero spam. Pausar o cancelar con un click — siempre.</p>

              ${isSubscribed ? `
                <div class="py-8 text-center">
                  <div class="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-7 h-7 text-paper" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <p class="font-heading font-bold text-[18px]">¡Ya estás dentro!</p>
                  <p class="text-paper/60 text-[14px] mt-1">Gracias por unirte al Club G&L.</p>
                </div>
              ` : `
                <form id="newsletter-form" class="border-b border-paper/30 flex items-center focus-within:border-paper transition-colors">
                  <input type="email" name="email" placeholder="tu@correo.com" class="flex-1 bg-transparent text-[17px] text-paper py-5 pr-4 placeholder:text-paper/30 focus:outline-none" required />
                  <button type="submit" class="text-[13px] font-bold text-paper shrink-0 hover:text-brand transition-colors">Suscribirme →</button>
                </form>
                <div class="flex items-center justify-between mt-4">
                  <span class="font-mono text-[11px] tracking-[0.2em] uppercase opacity-60">+2,400 suscriptores</span>
                  <span class="font-mono text-[11px] tracking-[0.2em] uppercase opacity-60">WELCOME10 al instante</span>
                </div>
              `}
            </div>
          </div>
        </div>
      </section>

      <!-- §9 — Sucursales -->
      <section class="py-24 lg:py-32 reveal scroll-mt-[72px]" id="sucursales">
        <div class="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div class="mb-14">
            <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60 block mb-3">§ 05 — Visítanos</span>
            <h2 class="font-heading font-[800] text-[clamp(56px,7vw,112px)] leading-[0.88] tracking-[-0.045em]">Dos puntos<br/>en <span class="text-brand">Colima</span>.</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${storesHtml}
          </div>
        </div>
      </section>

      <div id="home-quick-add-container"></div>
    `,
    onMount(root) {
      // ── Hero Carousel ──
      let currentSlide = 0
      const totalSlides = heroSlides.length
      const leftSlides = root.querySelectorAll('.hero-slide')
      const rightSlides = root.querySelectorAll('.hero-img')
      const slideCurrent = root.querySelector('#slide-current')
      const slideProgress = root.querySelector('#slide-progress')
      let autoTimer = null
      let progressAnim = null

      function goToSlide(idx) {
        currentSlide = ((idx % totalSlides) + totalSlides) % totalSlides
        leftSlides.forEach((el, i) => {
          el.style.opacity = i === currentSlide ? '1' : '0'
          el.style.zIndex = i === currentSlide ? '10' : '0'
        })
        rightSlides.forEach((el, i) => {
          el.style.opacity = i === currentSlide ? '1' : '0'
          el.style.zIndex = i === currentSlide ? '10' : '0'
        })
        if (slideCurrent) slideCurrent.textContent = String(currentSlide + 1).padStart(2, '0')
        resetProgress()
      }

      function resetProgress() {
        if (progressAnim) progressAnim.cancel()
        if (slideProgress) {
          slideProgress.style.transform = 'scaleX(0)'
          progressAnim = slideProgress.animate(
            [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
            { duration: 6000, easing: 'linear', fill: 'forwards' }
          )
        }
        clearInterval(autoTimer)
        autoTimer = setInterval(() => goToSlide(currentSlide + 1), 6000)
      }

      // Init
      resetProgress()

      const prevBtn = root.querySelector('#hero-prev')
      const nextBtn = root.querySelector('#hero-next')
      if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1))
      if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1))

      // Pause on hover
      const heroSection = root.querySelector('#hero-section')
      if (heroSection) {
        heroSection.addEventListener('mouseenter', () => {
          clearInterval(autoTimer)
          if (progressAnim) progressAnim.pause()
        })
        heroSection.addEventListener('mouseleave', () => {
          if (progressAnim) progressAnim.play()
          autoTimer = setInterval(() => goToSlide(currentSlide + 1), 6000)
        })
      }

      // ── Hero CTA links ──
      root.querySelectorAll('.hero-cta').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault()
          window.__glForceCatalogRebuild = true
          navigate(link.dataset.href || link.getAttribute('href'))
        })
      })

      // ── Copy coupon (hero slide 3) ──
      const copyBtn = root.querySelector('#hero-copy-coupon')
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText('WELCOME10')
          const label = copyBtn.querySelector('.copy-label')
          if (label) {
            const orig = label.textContent
            label.textContent = '¡Copiado!'
            copyBtn.querySelector('.arrow-walk').textContent = '✓'
            setTimeout(() => {
              label.textContent = orig
              copyBtn.querySelector('.arrow-walk').textContent = '→'
            }, 1800)
          }
        })
      }

      // ── Category links ──
      root.querySelectorAll('a[href^="/categoria/"]').forEach(link => {
        link.addEventListener('click', () => {
          window.__glForceCatalogRebuild = true
        })
      })

      // ── Best sellers row click ──
      root.querySelectorAll('.ls-row[data-href]').forEach(row => {
        row.addEventListener('click', (e) => {
          e.preventDefault()
          navigate(row.dataset.href)
        })
      })

      // ── Newsletter ──
      const form = root.querySelector('#newsletter-form')
      if (form) {
        form.addEventListener('submit', async (ev) => {
          ev.preventDefault()
          const emailInput = form.querySelector('input[type="email"]')
          const submitBtn = form.querySelector('button[type="submit"]')
          const { value: email, valid: emailValid } = sanitizeEmail(emailInput ? emailInput.value : '')

          if (!email) return
          if (!emailValid) {
            const prevErr = form.parentElement.querySelector('.newsletter-error')
            if (prevErr) prevErr.remove()
            const errEl = document.createElement('p')
            errEl.className = 'newsletter-error text-[12px] text-red-400 mt-2'
            errEl.textContent = 'Ingresa un correo electrónico válido.'
            form.after(errEl)
            return
          }

          const originalHTML = submitBtn.innerHTML
          submitBtn.disabled = true
          submitBtn.textContent = 'Enviando...'

          const prevErr = form.parentElement.querySelector('.newsletter-error')
          if (prevErr) prevErr.remove()

          const result = await subscribeNewsletter(email)

          if (result.ok) {
            const wrapper = form.closest('.md\\:col-span-5')
            if (wrapper) {
              // Remove the stats row below the form too
              const statsRow = wrapper.querySelector('.flex.items-center.justify-between.mt-4')
              if (statsRow) statsRow.remove()
            }
            form.outerHTML = `
              <div class="py-8 text-center animate-fade-in">
                <div class="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-7 h-7 text-paper" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <p class="font-heading font-bold text-[18px]">¡Suscripción exitosa!</p>
                <p class="text-paper/60 text-[14px] mt-1">Gracias por unirte al Club G&L.</p>
              </div>
            `
          } else {
            submitBtn.disabled = false
            submitBtn.innerHTML = originalHTML
            const errEl = document.createElement('p')
            errEl.className = 'newsletter-error text-[12px] text-red-400 mt-2'
            errEl.textContent = result.error || 'Ocurrió un error. Intenta de nuevo.'
            form.after(errEl)
          }
        })
      }

      // ── Scroll Reveal ──
      const reveals = root.querySelectorAll('.reveal')
      if (reveals.length) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in')
              observer.unobserve(entry.target)
            }
          })
        }, { threshold: 0.1 })
        reveals.forEach(el => observer.observe(el))
      }

      // ── Custom Cursor ──
      if (!window.matchMedia('(pointer: coarse)').matches) {
        // Check if cursor elements already exist (idempotent)
        if (!root.querySelector('.cursor-dot')) {
          const dot = document.createElement('div')
          dot.className = 'cursor-dot'
          const ring = document.createElement('div')
          ring.className = 'cursor-ring'
          root.appendChild(dot)
          root.appendChild(ring)

          document.body.classList.add('home')

          let mouseX = 0, mouseY = 0
          let ringX = 0, ringY = 0

          const onMouseMove = (e) => {
            mouseX = e.clientX
            mouseY = e.clientY
            dot.style.left = mouseX + 'px'
            dot.style.top = mouseY + 'px'
          }
          document.addEventListener('mousemove', onMouseMove)

          let rafId
          function lerpRing() {
            ringX += (mouseX - ringX) * 0.18
            ringY += (mouseY - ringY) * 0.18
            ring.style.left = ringX + 'px'
            ring.style.top = ringY + 'px'
            rafId = requestAnimationFrame(lerpRing)
          }
          rafId = requestAnimationFrame(lerpRing)

          // Hover states
          const addHover = () => document.body.classList.add('cursor-hover')
          const removeHover = () => document.body.classList.remove('cursor-hover')
          const addText = () => document.body.classList.add('cursor-text')
          const removeText = () => document.body.classList.remove('cursor-text')

          root.querySelectorAll('a, button, [data-cursor-hover]').forEach(el => {
            el.addEventListener('mouseenter', addHover)
            el.addEventListener('mouseleave', removeHover)
          })
          root.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('mouseenter', addText)
            el.addEventListener('mouseleave', removeText)
          })

          // Cleanup on route change (store reference for teardown)
          root.__cursorCleanup = () => {
            document.removeEventListener('mousemove', onMouseMove)
            cancelAnimationFrame(rafId)
            document.body.classList.remove('home', 'cursor-hover', 'cursor-text')
            dot.remove()
            ring.remove()
          }
        }
      }

      // Return cleanup function for startApp to call on route change
      return () => {
        clearInterval(autoTimer)
        if (progressAnim) progressAnim.cancel()
        if (root.__cursorCleanup) root.__cursorCleanup()
      }
    },
  }
}
