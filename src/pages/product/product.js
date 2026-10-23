import { getState, addToCart, trackProductView, getProductById } from '../../store/index.js'
import { findProductByPath, fitNote, productPath, sortSizes } from '../../utils/productCopy.js'
import { isInStock } from '../../utils/stock.js'
import { navigate, normalizePath } from '../../core/router.js'
import { formatMoney } from '../../utils/format.js'
import { showToast } from '../../utils/toast.js'
import { BRAND } from '../../utils/config.js'
import { handleQuickAdd } from '../catalog/catalogQuickAdd.js'
import { isPerfumeCategory } from '../admin/adminProductsData.js'
import { escapeHtml } from '../../utils/sanitize.js'
import { splitGalleryImages } from '../../utils/productImages.js'
import { relatedProducts } from '../../utils/related.js'
import { flyToCart, lockScroll, unlockScroll } from '../../utils/dom.js'
import { pageNotFound } from '../notFound/notFound.js'

/* ── Color name → hex map ── */
const COLOR_HEX = {
  'negro': '#0A0A0F', 'blanco': '#FFFFFF', 'azul': '#214fc7',
  'rojo': '#b03832', 'verde': '#3b4a3e', 'gris': '#6b7280',
  'beige': '#d6c4a4', 'marino': '#19355c', 'oliva': '#566042',
  'hueso': '#F4EFE3', 'carbón': '#3a3530', 'café': '#5c3d2e',
  'crudo': '#E8DFD0', 'arena': '#C2B280', 'celeste': '#87CEEB',
  'rosa': '#E8A0BF', 'mostaza': '#D4A017', 'vino': '#722F37',
  'lavanda': '#B57EDC', 'coral': '#FF7F50', 'menta': '#98FF98',
  'terracota': '#CC6333', 'perla': '#EAE0C8', 'piedra': '#928E85',
  'chocolate': '#3C1414', 'marfil': '#FFFFF0', 'nude': '#E8C4A2',
  'khaki': '#C3B091', 'camel': '#C19A6B', 'ceniza': '#B2BEB5',
}
function hexFor(name) {
  if (!name) return '#D4D4D4'
  if (name.startsWith('#')) return name
  return COLOR_HEX[name.toLowerCase()] || '#D4D4D4'
}

/* ── Name formatting: last word → brand color ── */
function splitName(name) {
  const w = name.split(' ')
  if (w.length >= 3) { const last = w.pop(); return `${w.join(' ')}<br/><span class="text-brand">${last}</span>.` }
  if (w.length === 2) return `${w[0]} <span class="text-brand">${w[1]}</span>.`
  return `<span class="text-brand">${name}</span>.`
}

/* ── Stock status ──
   Decision del dueno: no se muestran existencias ni pistas de cuantas quedan.
   Solo "Agotado" cuando el admin escribio un 0. */
function stockStatus(product) {
  if (isInStock(product)) return { label: 'En stock', cls: 'text-brand', dot: 'bg-brand' }
  return { label: 'Agotado', cls: 'text-ink/60', dot: 'bg-ink/60' }
}

/* ── Editorial recommended card ── */
function recommendedCard(p, i) {
  const img = escapeHtml(p.images?.[0] || '/placeholder.webp')
  const safeName = escapeHtml(p.name)
  const safeType = escapeHtml(p.type || '')
  const isPerfume = isPerfumeCategory(p.type)
  const imgCls = isPerfume ? 'object-contain p-3' : 'object-cover'
  const bgCls = isPerfume ? 'bg-white' : 'bg-paper'
  const ord = String(i + 1).padStart(2, '0')
  const hasDiscount = p.originalPrice && p.originalPrice > p.price

  return `
    <a href="${productPath(p)}" class="group block">
      <div class="aspect-[4/5] rounded-md overflow-hidden ${bgCls} relative">
        <img src="${img}" alt="${safeName}" class="w-full h-full ${imgCls} transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.src='/placeholder.webp'"/>
        <div class="absolute top-3 right-3 font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 bg-paper/85 backdrop-blur px-2 py-1 rounded-full">${ord}</div>
        <button data-quick-add="${p.id}" type="button" class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-paper/90 backdrop-blur flex items-center justify-center text-ink hover:bg-ink hover:text-paper transition-colors opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0 z-10" aria-label="Agregar rápido">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
        </button>
      </div>
      <div class="mt-4 flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/65 mb-1">${safeType}</div>
          <div class="font-display font-bold text-[16px] leading-tight tracking-[-0.02em] truncate">${safeName}</div>
        </div>
        <div class="text-right whitespace-nowrap flex-shrink-0">
          ${hasDiscount ? `<div class="font-mono text-[11px] text-ink/60 line-through">${formatMoney(p.originalPrice)}</div>` : ''}
          <div class="font-mono text-[14px] font-semibold ${hasDiscount ? 'text-brand' : ''}">${formatMoney(p.price)}</div>
        </div>
      </div>
    </a>
  `
}

/* ══════════════════════════════════════════════
   PDP — Bold Editorial v2
   ══════════════════════════════════════════════ */
export function pageProduct(initialState) {
  const state = initialState
  const path = normalizePath(window.location.pathname)
  const product = findProductByPath(state.products, path.split('/producto/')[1])

  /* ── Cargando ──
     En un link compartido el catálogo aún no ha llegado, así que product es
     undefined y sin esto se pintaba el 404 durante un instante. */
  if (!product && state.isLoading) {
    const thumbs = Array.from({ length: 4 }, () => '<div class="aspect-square rounded-md skeleton-shimmer"></div>').join('')
    return {
      title: 'Cargando… | G&L',
      noPaddingTop: true,
      fullWidth: true,
      forceLight: true,
      html: `
        <div aria-busy="true">
          <span class="sr-only">Cargando producto…</span>

          <section class="pt-2 pb-1.5 sm:pt-4 sm:pb-2 border-b border-ink/5">
            <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
              <div class="flex items-center gap-3">
                <span class="h-3 w-14 rounded skeleton-shimmer"></span>
                <span class="h-3 w-16 rounded skeleton-shimmer"></span>
                <span class="h-3 w-24 rounded skeleton-shimmer"></span>
              </div>
            </div>
          </section>

          <section class="py-3 sm:py-5 lg:py-8">
            <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
                <div class="lg:col-span-6">
                  <div class="aspect-[4/5] rounded-md skeleton-shimmer"></div>
                  <div class="mt-4 hidden md:grid grid-cols-4 gap-3">${thumbs}</div>
                </div>
                <div class="lg:col-span-6">
                  <span class="block h-3 w-24 rounded skeleton-shimmer"></span>
                  <div class="mt-6 space-y-3">
                    <div class="h-10 lg:h-12 w-4/5 rounded skeleton-shimmer"></div>
                    <div class="h-10 lg:h-12 w-3/5 rounded skeleton-shimmer"></div>
                  </div>
                  <div class="mt-8 h-7 w-32 rounded skeleton-shimmer"></div>
                  <div class="mt-8 space-y-2.5">
                    <div class="h-3 w-full rounded skeleton-shimmer"></div>
                    <div class="h-3 w-11/12 rounded skeleton-shimmer"></div>
                    <div class="h-3 w-2/3 rounded skeleton-shimmer"></div>
                  </div>
                  <div class="mt-10 flex gap-2.5">
                    <div class="h-11 w-16 rounded-full skeleton-shimmer"></div>
                    <div class="h-11 w-16 rounded-full skeleton-shimmer"></div>
                    <div class="h-11 w-16 rounded-full skeleton-shimmer"></div>
                  </div>
                  <div class="mt-8 h-14 w-full rounded-full skeleton-shimmer"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      `,
      onMount() {}
    }
  }

  /* ── 404 ── */
  if (!product) {
    return pageNotFound(state, {
      title: 'Producto no encontrado | G&L',
      heading: 'Este producto<br/>ya no <span class="text-brand">está</span>.',
      body: 'Puede que se haya agotado o que el enlace esté incompleto. Mira lo que hay ahora en la tienda.',
    })
  }

  /* ── Data prep ── */
  const allImages = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop']
  const { gallery: images, sizeGuide: sizeGuideImage } = splitGalleryImages(allImages)
  const isPerfume = isPerfumeCategory(product.type)
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0
  const sizes = sortSizes(product.sizes)
  const hasSizes = sizes.length > 0
  // Con una sola talla no hay nada que elegir: viene marcada y el boton listo
  const initialSize = sizes.length === 1 ? sizes[0] : null
  const sizeWord = isPerfume ? 'Presentación' : 'Talla'
  const inStock = isInStock(product)
  const hasColors = product.colors && product.colors.length > 0
  const sku = escapeHtml(product.sku || 'GL-' + String(product.id).slice(0, 8))
  const ss = stockStatus(product)
  const bagIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>'
  const ctaText = (size) => {
    if (!inStock) return 'Agotado'
    if (hasSizes && !size) return isPerfume ? 'Elige la presentación' : 'Selecciona una talla'
    if (size) return isPerfume ? `Agregar · ${escapeHtml(size)}` : `Agregar · talla ${escapeHtml(size)}`
    return 'Agregar a la bolsa'
  }
  const ctaHint = !inStock
    ? 'Esta pieza se agotó. Pregúntanos por WhatsApp si vuelve.'
    : `Elige ${isPerfume ? 'una presentación' : 'una talla'} arriba para agregarla a la bolsa.`
  const categoryHref = product.type ? `/categoria/${encodeURIComponent(product.type)}` : '/catalog'
  const safeName = escapeHtml(product.name)
  const safeType = escapeHtml(product.type || '')
  const storeNote = fitNote(product)
  const safeDescription = escapeHtml(storeNote)
  const safeCuratorNote = escapeHtml(product.curatorNote || '')

  const publicProducts = state.products.filter(p => p.badge !== 'Borrador')
  const recommended = relatedProducts(product, publicProducts, 4)

  /* ── Badges ── */
  const badges = []
  if (discount > 0) badges.push(`<span class="font-mono text-[11px] tracking-[0.18em] uppercase bg-brand text-paper px-2.5 py-1 rounded-full">\u2212${discount}%</span>`)
  else if (product.badge === 'Oferta') badges.push(`<span class="font-mono text-[11px] tracking-[0.18em] uppercase bg-brand text-paper px-2.5 py-1 rounded-full">Oferta</span>`)
  if (product.badge === 'Nuevo') badges.push(`<span class="font-mono text-[11px] tracking-[0.18em] uppercase bg-paper text-ink px-2.5 py-1 rounded-full">Nuevo</span>`)
  if (product.badge === 'Más vendido' || product.badge === 'Popular') badges.push(`<span class="font-mono text-[11px] tracking-[0.18em] uppercase bg-ink text-paper px-2.5 py-1 rounded-full">Top</span>`)
  const badgesHtml = badges.join('')

  /* ── Swatches ── */
  const swatchesHtml = hasColors ? product.colors.map((c, i) =>
    `<button type="button" class="swatch-btn min-h-11${i === 0 ? ' active' : ''}" aria-pressed="${i === 0}" data-color="${c}"><span class="swatch-chip" style="background:${hexFor(c)}"></span><span class="name">${c}</span></button>`
  ).join('') : ''

  /* ── Sizes ── */
  const sizePillsHtml = sizes.map(s =>
    `<button type="button" class="size-pill${s === initialSize ? ' active' : ''}" aria-pressed="${s === initialSize}" data-size="${escapeHtml(s)}">${escapeHtml(s)}</button>`
  ).join('')

  /* ── Specs ── */
  const specRows = [
    product.material || product.composition ? { k: 'Tela', v: product.material || product.composition } : null,
    product.fit ? { k: 'Corte', v: product.fit } : null,
    product.care ? { k: 'Lavado', v: product.care } : null,
    product.origin ? { k: 'Hecho en', v: product.origin } : null,
    product.includes ? { k: 'Incluye', v: product.includes } : null,
  ].filter(Boolean)

  /* ── Description for accordion ── */
  const hasDescription = Boolean(storeNote)
  const showDetailsAccordion = specRows.length > 0 || hasDescription

  /* ══ HTML ══ */
  return {
    title: `${product.name} | G&L`,
    noPaddingTop: true,
    fullWidth: true,
    forceLight: true,
    html: `
      <!-- ── BREADCRUMB ── -->
      <section class="pt-2 pb-1.5 sm:pt-4 sm:pb-2 border-b border-ink/5">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <!-- Sin flex-wrap: en móvil el nombre saltaba a una segunda línea y
               empujaba 28px más la foto y todo lo que va debajo. Ahora la miga
               cabe en una línea y el nombre se corta con puntos suspensivos. -->
          <!-- py/-my en los enlaces: 44px de area tactil sin que la miga crezca -->
          <div class="flex items-center gap-2 sm:gap-3 font-mono text-[11px] tracking-[0.2em] uppercase sm:flex-wrap">
            <a href="/" class="text-ink/65 hover:text-ink hover:underline underline-offset-4 flex-shrink-0 py-3.5 -my-3.5">Inicio</a>
            <span class="text-ink/30 flex-shrink-0" aria-hidden="true">/</span>
            <a href="/catalog" class="text-ink/65 hover:text-ink hover:underline underline-offset-4 flex-shrink-0 py-3.5 -my-3.5">Tienda</a>
            <span class="text-ink/30 flex-shrink-0" aria-hidden="true">/</span>
            <a href="${categoryHref}" class="text-ink/65 hover:text-ink hover:underline underline-offset-4 flex-shrink-0 py-3.5 -my-3.5">${safeType || 'General'}</a>
            <span class="text-ink/30 flex-shrink-0">/</span>
            <span class="text-ink truncate">${safeName}</span>
            <span class="h-px flex-1 bg-ink/15 mx-3 hidden sm:block"></span>
            <span class="text-ink/65 hidden sm:inline">SKU · ${sku}</span>
          </div>
        </div>
      </section>

      <!-- ── PRODUCT GRID ── -->
      <section class="py-3 sm:py-5 lg:py-8">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">

            <!-- LEFT: Gallery -->
            <!-- Sin "reveal": las dos columnas de arriba del pliegue arrancaban
                 en opacity 0 hasta que el observador las descubria. Eso dejaba
                 el precio, las tallas y el boton de WhatsApp invisibles en la
                 primera pantalla de movil, y sacaba a la foto de la carrera por
                 el LCP — que acababa ganando el texto del marquee. El resto de
                 la pagina, mas abajo, conserva la animacion. -->
            <div class="lg:col-span-6">
              <div class="relative pdp-gallery">
                <!-- Stage -->
                <div class="gallery-stage${isPerfume ? ' !bg-white' : ''}" id="pdp-stage">
                  <img id="pdp-stage-img" data-vt-hero style="view-transition-name:gl-product-hero" src="${escapeHtml(images[0])}" alt="${safeName}" fetchpriority="high" decoding="async" class="stage-main"/>
                  ${badgesHtml ? `<div class="absolute top-4 left-4 flex gap-2 z-10">${badgesHtml}</div>` : ''}
                  <div class="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                    <span class="stage-chip font-mono text-[11px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"><span id="pdp-cur">01</span> / <span id="pdp-tot">${String(images.length).padStart(2, '0')}</span></span>
                    <button id="pdp-share" class="stage-btn w-9 h-9 rounded-full flex items-center justify-center" aria-label="Compartir">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    </button>
                  </div>
                  ${images.length > 1 ? `
                  <button id="pdp-prev" class="stage-btn absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center z-10" aria-label="Imagen anterior">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button id="pdp-next" class="stage-btn absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center z-10" aria-label="Imagen siguiente">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  ` : ''}
                  <div class="absolute left-4 bottom-4 right-4 flex items-end justify-between text-paper z-10">
                    <span class="font-mono text-[11px] tracking-[0.24em] uppercase bg-ink/75 px-2 py-1 rounded" id="pdp-caption">Imagen 01 de ${String(images.length).padStart(2, '0')}</span>
                    <!-- El boton mide 44px; el fondo oscuro solo envuelve el texto -->
                    <button type="button" id="pdp-zoom" aria-pressed="false" class="press hidden md:inline-flex items-end min-h-11 -mb-2.5 pb-2.5 font-mono text-[11px] tracking-[0.18em] uppercase"><span id="pdp-zoom-label" class="bg-ink/75 px-2 py-1 rounded">Click para zoom</span></button>
                  </div>
                </div>
                <!-- En movil no hay tira: empujaba nombre, precio y boton bajo el
                     pliegue, y ahi ya estan el swipe, las flechas y el contador.
                     El ! porque .thumb-rail fija display fuera de las capas. -->
                ${images.length > 1 ? `<div class="thumb-rail max-md:!hidden mt-4 overflow-x-auto pb-1" id="pdp-thumbs"></div>` : ''}
              </div>
            </div>

            <!-- RIGHT: Info -->
            <div class="lg:col-span-6">
              <div class="lg:sticky lg:top-[88px]">

                <!-- Eyebrow -->
                <div class="flex items-center gap-3 mb-3">
                  <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/65">${safeType}${product.subtitle ? ' · ' + escapeHtml(product.subtitle) : ''}</span>
                  <span class="h-px flex-1 bg-ink/15"></span>
                  <span class="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.2em] uppercase ${ss.cls}">
                    <span class="w-1.5 h-1.5 rounded-full ${ss.dot}"></span>
                    ${ss.label}
                  </span>
                </div>

                <!-- Name -->
                <h1 class="font-display font-extrabold text-[clamp(26px,3.2vw,46px)] leading-[0.95] tracking-[-0.035em] mb-2">${splitName(safeName)}</h1>

                <!-- Price -->
                <div class="flex items-baseline gap-4 mb-2">
                  <span class="font-display font-extrabold text-[clamp(28px,2.4vw,40px)] leading-none tracking-[-0.04em] digit-tabular${discount > 0 ? ' text-brand' : ''}">${formatMoney(product.price)}</span>
                  ${(product.originalPrice && Number(product.originalPrice) > Number(product.price)) ? `<span class="font-mono text-[16px] text-ink/60 line-through digit-tabular">${formatMoney(product.originalPrice)}</span>` : ''}
                </div>
                ${discount > 0 ? `
                <div class="flex items-center gap-3 mb-4">
                  <span class="font-mono text-[11px] tracking-[0.22em] uppercase text-brand">Ahorras ${formatMoney(product.originalPrice - product.price)} · ${discount}%</span>
                </div>` : '<div class="mb-4"></div>'}

                <!-- Colors -->
                ${hasColors ? `
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/65">Color · <span class="text-ink" id="pdp-color-name">${product.colors[0]}</span></span>
                  </div>
                  <div class="flex items-center gap-2.5 flex-wrap" id="pdp-colors">${swatchesHtml}</div>
                </div>` : ''}

                <!-- Sizes -->
                ${hasSizes ? `
                <div class="mb-5">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/65">${sizeWord} · <span class="text-ink" id="pdp-size-name">${initialSize ? escapeHtml(initialSize) : 'Selecciona'}</span></span>
                    ${sizeGuideImage ? `
                    <button type="button" id="pdp-size-guide" class="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/65 hover:text-ink hover:underline underline-offset-4 inline-flex items-center gap-1.5 min-h-11 -my-3.5">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
                      Guía de tallas
                    </button>` : ''}
                  </div>
                  <div class="flex items-center gap-2 flex-wrap" id="pdp-sizes">${sizePillsHtml}</div>
                </div>` : ''}

                <!-- CTAs -->
                <div class="space-y-2 mb-6">
                  <!-- aria-disabled y no disabled: sigue enfocable, asi el teclado
                       y el lector de pantalla se enteran de por que no agrega, y
                       el foco no se pierde al marcar "Agregado" -->
                  <button type="button" id="qv-add-to-cart" data-product-id="${product.id}" ${!inStock || (hasSizes && !initialSize) ? 'aria-disabled="true" aria-describedby="pdp-cta-hint"' : 'aria-disabled="false"'} class="press group relative flex items-center justify-center w-full bg-ink text-paper h-14 rounded-full text-[15px] font-semibold hover:bg-brand transition-colors aria-disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-ink">
                    <span id="pdp-add-label" class="inline-flex items-center gap-2.5">
                      ${bagIcon}
                      ${ctaText(initialSize)}
                    </span>
                    <span class="absolute right-2 inset-y-0 my-auto w-10 h-10 rounded-full bg-paper text-ink flex items-center justify-center">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
                    </span>
                  </button>
                  <p id="pdp-cta-hint" class="text-[13px] text-ink/70 text-center" hidden>${ctaHint}</p>
                  <a href="https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hola, me interesa ' + product.name)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full bg-paper text-ink border border-ink/15 hover:border-ink h-12 rounded-full text-[14px] font-semibold transition-colors">
                    <svg class="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.2s-.8 1-.9 1.2-.3.2-.6.1-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5s0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4s.2-1.3.2-1.4-.3-.2-.6-.4M12 21.8a9.9 9.9 0 01-5-1.4l-.4-.2-3.7 1 1-3.7-.2-.4a9.9 9.9 0 01-1.5-5.3c0-5.5 4.4-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9a9.8 9.8 0 012.9 7c0 5.5-4.4 9.9-9.9 9.9m8.4-18.3A11.8 11.8 0 0012 0C5.5 0 .2 5.3.2 11.9c0 2.1.5 4.1 1.6 6L0 24l6.3-1.7a11.9 11.9 0 005.7 1.5c6.6 0 11.9-5.3 11.9-11.9a11.8 11.8 0 00-3.5-8.4z"/></svg>
                    Pregunta por WhatsApp
                  </a>
                  <p id="pdp-cta-status" class="sr-only" aria-live="polite"></p>
                </div>

                <!-- Trust strip: los mismos datos que /envios y /cambios. Nada de "compra
                     segura": aqui no se paga en linea, se cierra por WhatsApp -->
                <div class="grid grid-cols-3 gap-px bg-ink/10 rounded-lg overflow-hidden mb-7">
                  <div class="bg-paper p-3 sm:p-4 text-center">
                    <svg class="w-5 h-5 mx-auto mb-1.5 text-brand" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9l2-4h14l2 4M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M16 13a4 4 0 11-8 0"/></svg>
                    <div class="font-mono text-[11px] tracking-[0.12em] uppercase leading-snug">Envío 3-4 días</div>
                  </div>
                  <div class="bg-paper p-3 sm:p-4 text-center">
                    <svg class="w-5 h-5 mx-auto mb-1.5 text-brand" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zM8 14h.01M12 14h4"/></svg>
                    <div class="font-mono text-[11px] tracking-[0.12em] uppercase leading-snug">Cambios 8 días</div>
                  </div>
                  <div class="bg-paper p-3 sm:p-4 text-center">
                    <svg class="w-5 h-5 mx-auto mb-1.5 text-brand" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0112 2.9 11.96 11.96 0 013.4 6 12 12 0 003 9c0 5.6 3.8 10.3 9 11.6 5.2-1.3 9-6 9-11.6 0-1-.1-2-.4-3z"/></svg>
                    <div class="font-mono text-[11px] tracking-[0.12em] uppercase leading-snug">Confirmamos por WhatsApp</div>
                  </div>
                </div>

                <!-- Accordions -->
                ${showDetailsAccordion ? `
                <!-- Cerrado a propósito: abierto la columna crece ~250px y el
                     panel se queda sin recorrido para fijarse -->
                <details class="acc">
                  <summary>
                    <span class="font-display font-bold text-[15px] tracking-[-0.02em]">Detalles del producto</span>
                    <svg class="chev w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
                  </summary>
                  <div class="body">
                    ${hasDescription ? `<p class="mb-4">${safeDescription}</p>` : ''}
                    ${specRows.length > 0 ? `<table class="specs">${specRows.map(r => `<tr><td class="k">${r.k}</td><td>${r.v}</td></tr>`).join('')}</table>` : ''}
                  </div>
                </details>` : ''}

                <details class="acc">
                  <summary>
                    <span class="font-display font-bold text-[15px] tracking-[-0.02em]">Envío y entrega</span>
                    <svg class="chev w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
                  </summary>
                  <div class="body">
                    Mandamos a todo México: gratis en compras de ${formatMoney(BRAND.freeShippingMin)} o más. Llega en 3 a 4 días hábiles desde que confirmamos el pago, y la guía te la pasamos por WhatsApp. Recoger en tienda no cuesta: lo apartas por WhatsApp y pasas por él a Colima Centro o Villa de Álvarez.
                  </div>
                </details>

                <details class="acc">
                  <summary>
                    <span class="font-display font-bold text-[15px] tracking-[-0.02em]">Cambios y devoluciones</span>
                    <svg class="chev w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
                  </summary>
                  <div class="body">
                    Tienes 8 días desde que lo recibes para cambiarlo, sin usar y con etiquetas. No hacemos reembolsos, pero sí cambios. Si escogiste otra talla, el envío del cambio corre por tu cuenta; si el error fue nuestro, lo pagamos nosotros. Escríbenos por WhatsApp.
                  </div>
                </details>

                <!-- Curator note -->
                ${product.curatorNote ? `
                <div class="mt-8 border border-ink/10 rounded-lg p-5">
                  <div class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/65 mb-3">Nota de la tienda</div>
                  <p class="font-display font-medium text-[16px] leading-snug tracking-[-0.01em]">"${safeCuratorNote}"</p>
                  <div class="mt-3 font-mono text-[11px] tracking-[0.24em] uppercase text-ink/65">— Equipo G&L</div>
                </div>` : ''}

              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ── PAIRS WELL WITH ── -->
      ${recommended.length > 0 ? `
      <section class="bg-fog py-16 lg:py-28">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div class="flex items-end justify-between mb-8 lg:mb-10 reveal">
            <div>
              <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60 block mb-4">§ — Combina con</span>
              <h2 class="font-display font-extrabold text-[clamp(28px,6vw,80px)] leading-[0.88] tracking-[-0.04em]">
                Va perfecta<br/>con <span class="text-brand">esto</span>.
              </h2>
            </div>
            <a href="/catalog" class="hidden md:inline-flex ul-link text-[13px] font-semibold pb-2">Ver catálogo →</a>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 reveal" id="pdp-rec-grid">
            ${recommended.map((p, i) => recommendedCard(p, i)).join('')}
          </div>
        </div>
      </section>` : ''}

      <!-- ── REVIEWS ── -->
      ${product.reviews && product.reviews.length > 0 ? (() => {
        const avg = (product.reviews.reduce((a, r) => a + (r.stars || 5), 0) / product.reviews.length).toFixed(1)
        const filledStars = Math.round(Number(avg))
        return `
      <section id="reviews" class="py-16 lg:py-28">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 reveal">
            <div class="lg:col-span-4">
              <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60 block mb-4">§ — Reseñas</span>
              <h2 class="font-display font-extrabold text-[clamp(40px,6vw,80px)] leading-[0.88] tracking-[-0.04em] mb-6">
                <span class="text-brand">${avg}</span><span class="text-ink/30">/5</span>
              </h2>
              <div class="flex items-center gap-1.5 text-[20px] mb-4">
                ${Array.from({ length: 5 }, (_, i) => `<span${i >= filledStars ? ' class="text-ink/30"' : ''}>★</span>`).join('')}
              </div>
              <p class="text-[14px] text-ink/65 max-w-sm">Promedio de ${product.reviews.length} reseña${product.reviews.length > 1 ? 's' : ''} verificada${product.reviews.length > 1 ? 's' : ''}.</p>
            </div>
            <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              ${product.reviews.slice(0, 4).map(r => `
              <div>
                <div class="flex items-center gap-1 text-[14px] mb-3">${Array.from({ length: 5 }, (_, i) => `<span${i >= (r.stars || 5) ? ' class="text-ink/30"' : ''}>★</span>`).join('')}</div>
                <p class="font-display text-[20px] leading-snug tracking-[-0.02em] mb-3">"${r.quote}"</p>
                <div class="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/65">${r.name || ''}${r.location ? ' · ' + r.location : ''}${r.date ? ' · ' + r.date : ''}</div>
              </div>`).join('')}
            </div>
          </div>
        </div>
      </section>`
      })() : ''}


      <!-- Quick Add Modal Container -->
      <div id="product-modal-container"></div>
      ${inStock ? `
      <!-- Barra fija en movil: aparece cuando el boton principal sale de la vista.
           Es un atajo visual; teclado y lector usan el boton principal. -->
      <div id="pdp-sticky" class="md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 px-3 pb-2 pointer-events-none translate-y-[160%] transition-transform duration-300 ease-out motion-reduce:transition-none" aria-hidden="true">
        <div class="pointer-events-auto flex items-center gap-3 rounded-full bg-paper/95 backdrop-blur border border-ink/10 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)] pl-4 pr-1.5 py-1.5">
          <span class="font-display font-extrabold text-[17px] tabular-nums shrink-0${discount > 0 ? ' text-brand' : ''}">${formatMoney(product.price)}</span>
          <button type="button" id="pdp-sticky-btn" tabindex="-1" class="flex-1 min-w-0 h-11 px-4 rounded-full bg-ink text-paper text-[14px] font-semibold truncate">${ctaText(initialSize)}</button>
        </div>
      </div>` : ''}
    `,

    /* ══ MOUNT ══ */
    onMount(root) {
      // ── Track view ──
      trackProductView(product.id)

      // ── Gallery ──
      let idx = 0
      const stage = root.querySelector('#pdp-stage')
      const stageImg = root.querySelector('#pdp-stage-img')
      const curEl = root.querySelector('#pdp-cur')
      const captionEl = root.querySelector('#pdp-caption')
      const thumbsEl = root.querySelector('#pdp-thumbs')

      // El escenario toma la proporción de la foto principal: así la llena
      // entera sin recortarla (zapatos 1:1, ropa 3:4, algún short 4:3). Solo la
      // primera, para que el precio no salte al pasar de foto; si otra tiene
      // otra proporción se ve entera con margen blanco. Topes para que una
      // foto muy alargada no deforme la ficha.
      const fitStage = () => {
        const { naturalWidth: w, naturalHeight: h } = stageImg
        if (!w || !h || idx !== 0) return
        stage.closest('.pdp-gallery')?.style.setProperty('--stage-ar', String(Math.min(Math.max(w / h, 0.6), 1.5)))
      }
      stageImg.addEventListener('load', fitStage)
      fitStage()

      function paintThumbs() {
        if (!thumbsEl) return
        thumbsEl.innerHTML = images.map((img, i) => `
          <button type="button" class="thumb${i === idx ? ' active' : ''}${isPerfume ? ' !bg-white' : ''}" data-i="${i}" aria-label="Ver imagen ${i + 1} de ${images.length}"${i === idx ? ' aria-current="true"' : ''}>
            <span class="idx" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
            <img src="${img}" alt="thumb ${i + 1}" loading="lazy" decoding="async" class="${isPerfume ? 'object-contain p-1' : ''}"/>
          </button>
        `).join('')
        thumbsEl.querySelectorAll('.thumb').forEach(b => b.addEventListener('click', () => go(Number(b.dataset.i))))
      }

      function go(i) {
        idx = (i + images.length) % images.length
        stageImg.src = images[idx]
        if (curEl) curEl.textContent = String(idx + 1).padStart(2, '0')
        if (captionEl) captionEl.textContent = `Imagen ${String(idx + 1).padStart(2, '0')} de ${String(images.length).padStart(2, '0')}`
        paintThumbs()
      }

      root.querySelector('#pdp-prev')?.addEventListener('click', () => go(idx - 1))
      root.querySelector('#pdp-next')?.addEventListener('click', () => go(idx + 1))

      const onKey = (e) => {
        // Sin esto, mover el cursor dentro de un campo cambiaría la foto
        if (e.target.closest?.('input, textarea, select, [contenteditable]')) return
        if (e.key === 'ArrowLeft') go(idx - 1)
        if (e.key === 'ArrowRight') go(idx + 1)
      }
      window.addEventListener('keydown', onKey)

      // Click-to-zoom
      const zoomBtn = root.querySelector('#pdp-zoom')
      const toggleZoom = () => {
        const on = stage.classList.toggle('zoomed')
        zoomBtn?.setAttribute('aria-pressed', String(on))
        const zoomLabel = root.querySelector('#pdp-zoom-label')
        if (zoomLabel) zoomLabel.textContent = on ? 'Click para reducir' : 'Click para zoom'
      }
      // Swipe horizontal en movil: el click de zoom no debe dispararse tras arrastrar
      let swiped = false
      if (stage && images.length > 1) {
        let sx = 0, sy = 0
        stage.addEventListener('touchstart', (e) => {
          swiped = false
          sx = e.changedTouches[0].clientX
          sy = e.changedTouches[0].clientY
        }, { passive: true })
        stage.addEventListener('touchend', (e) => {
          const dx = e.changedTouches[0].clientX - sx
          const dy = e.changedTouches[0].clientY - sy
          if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return
          swiped = true
          go(dx < 0 ? idx + 1 : idx - 1)
        }, { passive: true })
      }

      if (stage) {
        stage.addEventListener('click', (e) => {
          if (swiped) { swiped = false; return }
          if (e.target.closest('button')) return
          toggleZoom()
        })
      }
      zoomBtn?.addEventListener('click', toggleZoom)

      paintThumbs()

      // ── Guía de tallas ──
      // Vive en document.body para que no lo recorte ningún contenedor del
      // layout; startApp lo borra al navegar, junto al resto de overlays.
      const sizeGuideBtn = root.querySelector('#pdp-size-guide')
      if (sizeGuideBtn && sizeGuideImage) {
        sizeGuideBtn.addEventListener('click', () => {
          const prevFocus = document.activeElement
          const modal = document.createElement('div')
          modal.id = 'size-guide-modal'
          modal.className = 'fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink/70'
          modal.setAttribute('role', 'dialog')
          modal.setAttribute('aria-modal', 'true')
          modal.setAttribute('aria-label', 'Guía de tallas')
          modal.innerHTML = `
            <div class="relative bg-paper rounded-lg max-w-3xl w-full max-h-[88vh] overflow-auto p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="font-mono text-[11px] tracking-[0.24em] uppercase text-ink/60">Guía de tallas</span>
                <button type="button" data-close class="press stage-btn w-9 h-9 rounded-full flex items-center justify-center" aria-label="Cerrar">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>
              <img src="${escapeHtml(sizeGuideImage)}" alt="Guía de tallas de ${safeName}" class="w-full h-auto rounded"/>
            </div>`
          const close = () => {
            modal.remove()
            unlockScroll()
            document.removeEventListener('keydown', onEsc)
            prevFocus?.focus?.()
          }
          const onEsc = (e) => {
            if (e.key === 'Escape') return close()
            // Trampa de foco: el unico control es Cerrar, asi que Tab no sale del dialogo
            if (e.key === 'Tab') {
              e.preventDefault()
              modal.querySelector('[data-close]')?.focus()
            }
          }
          modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('[data-close]')) close()
          })
          document.addEventListener('keydown', onEsc)
          document.body.appendChild(modal)
          lockScroll()
          modal.querySelector('[data-close]')?.focus()
        })
      }

      // ── Share ──
      root.querySelector('#pdp-share')?.addEventListener('click', () => {
        const shareUrl = `${window.location.origin}${productPath(product)}`
        if (navigator.share) {
          navigator.share({ title: product.name, text: '¡Mira este producto en G&L!', url: shareUrl }).catch(() => {})
        } else {
          navigator.clipboard.writeText(shareUrl)
          showToast('Enlace copiado al portapapeles')
        }
      })

      // ── Colors ──
      let selectedColor = hasColors ? product.colors[0] : ''
      const colorsEl = root.querySelector('#pdp-colors')
      const colorNameEl = root.querySelector('#pdp-color-name')
      if (colorsEl) {
        colorsEl.addEventListener('click', (e) => {
          const btn = e.target.closest('.swatch-btn')
          if (!btn) return
          colorsEl.querySelectorAll('.swatch-btn').forEach(x => {
            x.classList.remove('active')
            x.setAttribute('aria-pressed', 'false')
          })
          btn.classList.add('active')
          btn.setAttribute('aria-pressed', 'true')
          selectedColor = btn.dataset.color
          if (colorNameEl) colorNameEl.textContent = selectedColor
        })
      }

      // ── Sizes ──
      let selectedSize = initialSize
      const sizesEl = root.querySelector('#pdp-sizes')
      const sizeNameEl = root.querySelector('#pdp-size-name')
      const addBtn = root.querySelector('#qv-add-to-cart')
      const addLabel = root.querySelector('#pdp-add-label')
      const hintEl = root.querySelector('#pdp-cta-hint')
      const statusEl = root.querySelector('#pdp-cta-status')
      const sticky = root.querySelector('#pdp-sticky')
      const stickyBtn = root.querySelector('#pdp-sticky-btn')
      const canAdd = () => inStock && (!hasSizes || Boolean(selectedSize))
      let addedTimer = 0

      function paintCta() {
        if (!addBtn) return
        const blocked = !canAdd()
        addBtn.setAttribute('aria-disabled', String(blocked))
        if (blocked) addBtn.setAttribute('aria-describedby', 'pdp-cta-hint')
        else addBtn.removeAttribute('aria-describedby')
        if (!blocked && hintEl) hintEl.hidden = true
        if (addLabel) addLabel.innerHTML = `${bagIcon} ${ctaText(selectedSize)}`
        if (stickyBtn) stickyBtn.innerHTML = ctaText(selectedSize)
      }

      // Limpiar antes de escribir: el mismo texto dos veces no se vuelve a anunciar
      function announce(msg) {
        if (!statusEl) return
        statusEl.textContent = ''
        setTimeout(() => { statusEl.textContent = msg }, 60)
      }

      if (sizesEl) {
        sizesEl.addEventListener('click', (e) => {
          const btn = e.target.closest('.size-pill')
          if (!btn || btn.classList.contains('disabled')) return
          sizesEl.querySelectorAll('.size-pill').forEach(x => {
            x.classList.remove('active')
            x.setAttribute('aria-pressed', 'false')
          })
          btn.classList.add('active')
          btn.setAttribute('aria-pressed', 'true')
          selectedSize = btn.dataset.size
          if (sizeNameEl) sizeNameEl.textContent = selectedSize
          clearTimeout(addedTimer)
          paintCta()
        })
      }

      // ── Add to cart ──
      let lastAddAt = 0
      function handleAdd() {
        if (!canAdd()) {
          if (hintEl) hintEl.hidden = false
          announce(ctaHint)
          return
        }
        // El boton ya no se deshabilita (perdia el foco): un doble clic sumaria dos piezas
        if (Date.now() - lastAddAt < 700) return
        lastAddAt = Date.now()
        addToCart({ productId: product.id, size: selectedSize || '', color: selectedColor, qty: 1 })
        flyToCart(root.querySelector('#pdp-stage-img'))
        showToast('¡Producto agregado a la bolsa!')
        const detail = selectedSize ? ` · ${isPerfume ? '' : 'talla '}${selectedSize}` : ''
        announce(`${product.name}${detail} agregado a la bolsa.`)

        // Sin disabled ni repintar el boton: el foco se queda donde estaba y la
        // talla sigue marcada por si quiere otra pieza igual
        if (addLabel) addLabel.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          ¡Agregado a la bolsa!
        `
        clearTimeout(addedTimer)
        addedTimer = setTimeout(paintCta, 1800)
      }

      addBtn?.addEventListener('click', handleAdd)

      // Barra fija: visible solo mientras el boton principal no se ve. El aviso
      // de "agregado" sube con ella para no quedar tapado (body.pdp-sticky-on).
      let stickyIo = null
      if (sticky && addBtn) {
        stickyIo = new IntersectionObserver(([entry]) => {
          // Si la ficha queda oculta (se fue a una vista en cache) el boton tampoco se ve: no mostrar
          const show = !entry.isIntersecting && root.offsetParent !== null
          sticky.classList.toggle('translate-y-[160%]', !show)
          document.body.classList.toggle('pdp-sticky-on', show)
        })
        stickyIo.observe(addBtn)
        stickyBtn?.addEventListener('click', () => {
          if (canAdd()) return handleAdd()
          // Sin talla: lleva a elegirla en vez de fallar en silencio
          sizesEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          if (hintEl) hintEl.hidden = false
        })
      }

      // ── Quick add from recommended ──
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

      // ── Reveal on scroll ──
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') })
      }, { threshold: 0.1 })
      root.querySelectorAll('.reveal').forEach(el => io.observe(el))

      // ── Cleanup ──
      return () => {
        window.removeEventListener('keydown', onKey)
        clearTimeout(addedTimer)
        io.disconnect()
        stickyIo?.disconnect()
        document.body.classList.remove('pdp-sticky-on')
      }
    }
  }
}
