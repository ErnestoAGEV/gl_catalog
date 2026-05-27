import { getState, addToCart, trackProductView, getProductById } from '../../store/index.js'
import { navigate } from '../../core/router.js'
import { formatMoney } from '../../utils/format.js'
import { showToast } from '../../utils/toast.js'
import { BRAND } from '../../utils/config.js'
import { getBadgeColor } from '../catalog/catalogCard.js'
import { handleQuickAdd } from '../catalog/catalogQuickAdd.js'
import { isPerfumeCategory } from '../admin/adminProductsData.js'

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

/* ── Stock status ── */
function stockStatus(product) {
  const s = product.stock
  if (s === undefined || s === null || s > 3) return { label: 'En stock', cls: 'text-brand', dot: 'bg-brand' }
  if (s <= 0) return { label: 'Agotado', cls: 'text-ink/40', dot: 'bg-ink/40' }
  return { label: 'Últimas piezas', cls: 'text-amber-500', dot: 'bg-amber-500' }
}

/* ── Recommended products (unchanged logic) ── */
function getRecommendedProducts(currentProduct, allProducts, limit = 4) {
  const candidates = allProducts.filter(p => p.id !== currentProduct.id && p.badge !== 'Borrador')
  const sameType = candidates.filter(p => p.type === currentProduct.type)
  const others = candidates.filter(p => p.type !== currentProduct.type)
  return [...sameType, ...others].slice(0, limit)
}

/* ── Editorial recommended card ── */
function recommendedCard(p, i) {
  const img = p.images?.[0] || '/placeholder.webp'
  const isPerfume = isPerfumeCategory(p.type)
  const imgCls = isPerfume ? 'object-contain p-3' : 'object-cover'
  const bgCls = isPerfume ? 'bg-white' : 'bg-paper'
  const ord = String(i + 1).padStart(2, '0')
  const hasDiscount = p.originalPrice && p.originalPrice > p.price

  return `
    <a href="/producto/${p.id}" class="group block">
      <div class="aspect-[4/5] rounded-md overflow-hidden ${bgCls} relative">
        <img src="${img}" alt="${p.name}" class="w-full h-full ${imgCls} transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.src='/placeholder.webp'"/>
        <div class="absolute top-3 right-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink/60 bg-paper/85 backdrop-blur px-2 py-1 rounded-full">${ord}</div>
        <button data-quick-add="${p.id}" type="button" class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-paper/90 backdrop-blur flex items-center justify-center text-ink hover:bg-ink hover:text-paper transition-colors opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 z-10" onclick="event.preventDefault();event.stopPropagation();" aria-label="Agregar rápido">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
        </button>
      </div>
      <div class="mt-4 flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/55 mb-1">${p.type || ''}</div>
          <div class="font-display font-bold text-[16px] leading-tight tracking-[-0.02em] truncate">${p.name}</div>
        </div>
        <div class="text-right whitespace-nowrap flex-shrink-0">
          ${hasDiscount ? `<div class="font-mono text-[11px] text-ink/40 line-through">${formatMoney(p.originalPrice)}</div>` : ''}
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
  const path = window.location.pathname
  const productId = path.split('/producto/')[1]
  const product = state.products.find(p => String(p.id) === String(productId))

  /* ── 404 ── */
  if (!product) {
    return {
      title: 'Producto no encontrado | G&L',
      noPaddingTop: true,
      fullWidth: true,
      forceLight: true,
      html: `
        <div class="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
          <h1 class="font-display font-extrabold text-[clamp(48px,8vw,120px)] leading-[0.88] tracking-[-0.04em] outline-text mb-6">404.</h1>
          <p class="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/55 mb-8">Producto no encontrado</p>
          <a href="/catalog" class="inline-flex items-center gap-2 bg-ink text-paper px-6 h-12 rounded-full text-[13px] font-semibold hover:bg-brand transition-colors">
            Ir al catálogo <span class="arrow-walk">→</span>
          </a>
        </div>
      `,
      onMount() {}
    }
  }

  /* ── Data prep ── */
  const images = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop']
  const isPerfume = isPerfumeCategory(product.type)
  const stageImgClass = isPerfume ? 'object-contain' : 'object-cover'
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0
  const hasSizes = product.sizes && product.sizes.length > 0
  const hasColors = product.colors && product.colors.length > 0
  const sku = product.sku || 'GL-' + String(product.id).slice(0, 8)
  const ss = stockStatus(product)
  const categoryHref = product.type ? `/categoria/${encodeURIComponent(product.type)}` : '/catalog'

  const publicProducts = state.products.filter(p => p.badge !== 'Borrador')
  const recommended = getRecommendedProducts(product, publicProducts, 4)

  /* ── Badges ── */
  const badges = []
  if (discount > 0) badges.push(`<span class="font-mono text-[10px] tracking-[0.18em] uppercase bg-brand text-paper px-2.5 py-1 rounded-full">\u2212${discount}%</span>`)
  if (product.badge === 'Nuevo') badges.push(`<span class="font-mono text-[10px] tracking-[0.18em] uppercase bg-paper text-ink px-2.5 py-1 rounded-full">Nuevo</span>`)
  if (product.badge === 'Más vendido' || product.badge === 'Popular') badges.push(`<span class="font-mono text-[10px] tracking-[0.18em] uppercase bg-ink text-paper px-2.5 py-1 rounded-full">Top</span>`)
  const badgesHtml = badges.join('')

  /* ── Swatches ── */
  const swatchesHtml = hasColors ? product.colors.map((c, i) =>
    `<button type="button" class="swatch-btn${i === 0 ? ' active' : ''}" data-color="${c}"><span class="swatch-chip" style="background:${hexFor(c)}"></span><span class="name">${c}</span></button>`
  ).join('') : ''

  /* ── Sizes ── */
  const sizePillsHtml = hasSizes ? product.sizes.map(s =>
    `<button type="button" class="size-pill" data-size="${s}">${s}</button>`
  ).join('') : ''

  /* ── Specs ── */
  const specRows = [
    product.material || product.composition ? { k: 'Tela', v: product.material || product.composition } : null,
    product.fit ? { k: 'Corte', v: product.fit } : null,
    product.care ? { k: 'Lavado', v: product.care } : null,
    product.origin ? { k: 'Hecho en', v: product.origin } : null,
    product.includes ? { k: 'Incluye', v: product.includes } : null,
  ].filter(Boolean)

  /* ── Description for accordion ── */
  const hasDescription = product.description && product.description.trim()
  const showDetailsAccordion = specRows.length > 0 || hasDescription

  /* ══ HTML ══ */
  return {
    title: `${product.name} | G&L`,
    noPaddingTop: true,
    fullWidth: true,
    forceLight: true,
    html: `
      <!-- ── BREADCRUMB ── -->
      <section class="pt-6 pb-2 border-b border-ink/5">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div class="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] tracking-[0.28em] uppercase flex-wrap">
            <a href="/" class="text-ink/55 hover:text-ink ul-link">Inicio</a>
            <span class="text-ink/30">/</span>
            <a href="/catalog" class="text-ink/55 hover:text-ink ul-link">Tienda</a>
            <span class="text-ink/30">/</span>
            <a href="${categoryHref}" class="text-ink/55 hover:text-ink ul-link">${product.type || 'General'}</a>
            <span class="text-ink/30">/</span>
            <span class="text-ink">${product.name}</span>
            <span class="h-px flex-1 bg-ink/15 mx-3 hidden sm:block"></span>
            <span class="text-ink/55 hidden sm:inline">SKU · ${sku}</span>
          </div>
        </div>
      </section>

      <!-- ── PRODUCT GRID ── -->
      <section class="py-8 lg:py-14">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">

            <!-- LEFT: Gallery -->
            <div class="lg:col-span-7 reveal">
              <div class="relative">
                <!-- Stage -->
                <div class="gallery-stage${isPerfume ? ' !bg-white' : ''}" id="pdp-stage">
                  <img id="pdp-stage-img" src="${images[0]}" alt="${product.name}" class="${stageImgClass}${isPerfume ? ' p-6' : ''}"/>
                  ${badgesHtml ? `<div class="absolute top-4 left-4 flex gap-2 z-10">${badgesHtml}</div>` : ''}
                  <div class="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                    <span class="font-mono text-[10px] tracking-[0.2em] uppercase bg-paper/85 backdrop-blur px-2.5 py-1 rounded-full"><span id="pdp-cur">01</span> / <span id="pdp-tot">${String(images.length).padStart(2, '0')}</span></span>
                    <button id="pdp-share" class="w-9 h-9 rounded-full bg-paper/85 backdrop-blur flex items-center justify-center hover:bg-ink hover:text-paper transition-colors" aria-label="Compartir">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    </button>
                  </div>
                  ${images.length > 1 ? `
                  <button id="pdp-prev" class="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper/85 backdrop-blur flex items-center justify-center hover:bg-ink hover:text-paper transition-colors z-10">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button id="pdp-next" class="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper/85 backdrop-blur flex items-center justify-center hover:bg-ink hover:text-paper transition-colors z-10">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  ` : ''}
                  <div class="absolute left-4 bottom-4 right-4 flex items-end justify-between text-paper z-10">
                    <span class="font-mono text-[10px] tracking-[0.24em] uppercase bg-ink/40 backdrop-blur px-2 py-1 rounded" id="pdp-caption">Imagen 01 de ${String(images.length).padStart(2, '0')}</span>
                    <span class="font-mono text-[10px] tracking-[0.18em] uppercase bg-ink/40 backdrop-blur px-2 py-1 rounded hidden md:inline">Click para zoom</span>
                  </div>
                </div>
                ${images.length > 1 ? `<div class="thumb-rail mt-4 overflow-x-auto pb-1" id="pdp-thumbs"></div>` : ''}
              </div>
            </div>

            <!-- RIGHT: Info -->
            <div class="lg:col-span-5 reveal">
              <div class="lg:sticky lg:top-[88px]">

                <!-- Eyebrow -->
                <div class="flex items-center gap-3 mb-5">
                  <span class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55">${product.type || ''}${product.subtitle ? ' · ' + product.subtitle : ''}</span>
                  <span class="h-px flex-1 bg-ink/15"></span>
                  <span class="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] uppercase ${ss.cls}">
                    <span class="w-1.5 h-1.5 rounded-full ${ss.dot}"></span>
                    ${ss.label}
                  </span>
                </div>

                <!-- Name -->
                <h1 class="font-display font-extrabold text-[clamp(28px,5vw,72px)] leading-[0.92] tracking-[-0.04em] mb-3">${splitName(product.name)}</h1>

                <!-- Price -->
                <div class="flex items-baseline gap-4 mb-2">
                  <span class="font-display font-extrabold text-[clamp(32px,4vw,56px)] leading-none tracking-[-0.04em] digit-tabular${discount > 0 ? ' text-brand' : ''}">${formatMoney(product.price)}</span>
                  ${product.originalPrice ? `<span class="font-mono text-[16px] text-ink/40 line-through digit-tabular">${formatMoney(product.originalPrice)}</span>` : ''}
                </div>
                ${discount > 0 ? `
                <div class="flex items-center gap-3 mb-8">
                  <span class="font-mono text-[10px] tracking-[0.22em] uppercase text-brand">Ahorras ${formatMoney(product.originalPrice - product.price)} · ${discount}%</span>
                </div>` : '<div class="mb-8"></div>'}

                <!-- Colors -->
                ${hasColors ? `
                <div class="mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <span class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55">Color · <span class="text-ink" id="pdp-color-name">${product.colors[0]}</span></span>
                    <span class="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">${product.colors.length} disponible${product.colors.length > 1 ? 's' : ''}</span>
                  </div>
                  <div class="flex items-center gap-2.5 flex-wrap" id="pdp-colors">${swatchesHtml}</div>
                </div>` : ''}

                <!-- Sizes -->
                ${hasSizes ? `
                <div class="mb-7">
                  <div class="flex items-center justify-between mb-3">
                    <span class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55">Talla · <span class="text-ink" id="pdp-size-name">Selecciona</span></span>
                    <button class="ul-link font-mono text-[10px] tracking-[0.22em] uppercase text-ink/65 hover:text-ink inline-flex items-center gap-1.5">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
                      Guía de tallas
                    </button>
                  </div>
                  <div class="flex items-center gap-2 flex-wrap" id="pdp-sizes">${sizePillsHtml}</div>
                </div>` : ''}

                <!-- CTAs -->
                <div class="space-y-2.5 mb-7">
                  <button id="qv-add-to-cart" data-product-id="${product.id}" class="group relative flex items-center justify-center w-full bg-ink text-paper h-16 rounded-full text-[15px] font-semibold hover:bg-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"${hasSizes ? ' disabled' : ''}>
                    <span id="pdp-add-label" class="inline-flex items-center gap-2.5">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                      ${hasSizes ? 'Selecciona una talla' : 'Agregar a la bolsa'}
                    </span>
                    <span class="absolute right-2 inset-y-0 my-auto w-12 h-12 rounded-full bg-paper text-ink flex items-center justify-center">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
                    </span>
                  </button>
                  <a href="https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hola, me interesa ' + product.name)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full bg-paper text-ink border border-ink/15 hover:border-ink h-14 rounded-full text-[14px] font-semibold transition-colors">
                    <svg class="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.2s-.8 1-.9 1.2-.3.2-.6.1-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5s0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4s.2-1.3.2-1.4-.3-.2-.6-.4M12 21.8a9.9 9.9 0 01-5-1.4l-.4-.2-3.7 1 1-3.7-.2-.4a9.9 9.9 0 01-1.5-5.3c0-5.5 4.4-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9a9.8 9.8 0 012.9 7c0 5.5-4.4 9.9-9.9 9.9m8.4-18.3A11.8 11.8 0 0012 0C5.5 0 .2 5.3.2 11.9c0 2.1.5 4.1 1.6 6L0 24l6.3-1.7a11.9 11.9 0 005.7 1.5c6.6 0 11.9-5.3 11.9-11.9a11.8 11.8 0 00-3.5-8.4z"/></svg>
                    Pregunta por WhatsApp
                  </a>
                </div>

                <!-- Trust strip -->
                <div class="grid grid-cols-3 gap-px bg-ink/10 rounded-lg overflow-hidden mb-7">
                  <div class="bg-paper p-3 sm:p-4 text-center">
                    <svg class="w-5 h-5 mx-auto mb-1.5 text-brand" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9l2-4h14l2 4M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M16 13a4 4 0 11-8 0"/></svg>
                    <div class="font-mono text-[9px] sm:text-[10px] tracking-[0.18em] uppercase">Envío 2-3 días</div>
                  </div>
                  <div class="bg-paper p-3 sm:p-4 text-center">
                    <svg class="w-5 h-5 mx-auto mb-1.5 text-brand" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zM8 14h.01M12 14h4"/></svg>
                    <div class="font-mono text-[9px] sm:text-[10px] tracking-[0.18em] uppercase">Cambios 15 días</div>
                  </div>
                  <div class="bg-paper p-3 sm:p-4 text-center">
                    <svg class="w-5 h-5 mx-auto mb-1.5 text-brand" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0112 2.9 11.96 11.96 0 013.4 6 12 12 0 003 9c0 5.6 3.8 10.3 9 11.6 5.2-1.3 9-6 9-11.6 0-1-.1-2-.4-3z"/></svg>
                    <div class="font-mono text-[9px] sm:text-[10px] tracking-[0.18em] uppercase">Compra segura</div>
                  </div>
                </div>

                <!-- Accordions -->
                ${showDetailsAccordion ? `
                <details class="acc" open>
                  <summary>
                    <span class="font-display font-bold text-[15px] tracking-[-0.02em]">Detalles del producto</span>
                    <svg class="chev w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
                  </summary>
                  <div class="body">
                    ${hasDescription ? `<p class="mb-4">${product.description}</p>` : ''}
                    ${specRows.length > 0 ? `<table class="specs">${specRows.map(r => `<tr><td class="k">${r.k}</td><td>${r.v}</td></tr>`).join('')}</table>` : ''}
                  </div>
                </details>` : ''}

                <details class="acc">
                  <summary>
                    <span class="font-display font-bold text-[15px] tracking-[-0.02em]">Envío y entrega</span>
                    <svg class="chev w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
                  </summary>
                  <div class="body">
                    Envío gratis en compras +$${BRAND.freeShippingMin} MXN — todo México. Entrega en 2-3 días hábiles vía Estafeta/DHL. Recoger en tienda sin costo: lo apartamos por 48 horas en Colima Centro o Villa de Álvarez.
                  </div>
                </details>

                <details class="acc">
                  <summary>
                    <span class="font-display font-bold text-[15px] tracking-[-0.02em]">Cambios y devoluciones</span>
                    <svg class="chev w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
                  </summary>
                  <div class="body">
                    Cambios sin preguntas dentro de los primeros 15 días — con etiqueta y sin uso. Si no te quedó la talla, te la cambiamos por tu cuenta o pasas por la tienda. Escríbenos por WhatsApp.
                  </div>
                </details>

                <!-- Curator note -->
                ${product.curatorNote ? `
                <div class="mt-8 border border-ink/10 rounded-lg p-5">
                  <div class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55 mb-3">Nota del curador</div>
                  <p class="font-display font-medium text-[16px] leading-snug tracking-[-0.01em]">"${product.curatorNote}"</p>
                  <div class="mt-3 font-mono text-[10px] tracking-[0.24em] uppercase text-ink/55">— Equipo G&L</div>
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
                <div class="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/55">${r.name || ''}${r.location ? ' · ' + r.location : ''}${r.date ? ' · ' + r.date : ''}</div>
              </div>`).join('')}
            </div>
          </div>
        </div>
      </section>`
      })() : ''}


      <!-- Quick Add Modal Container -->
      <div id="product-modal-container"></div>
    `,

    /* ══ MOUNT ══ */
    onMount(root) {
      // ── Cursor init ──
      if (!window.matchMedia('(pointer: coarse)').matches) {
        if (!document.querySelector('.cursor-dot')) {
          const d = document.createElement('div'); d.className = 'cursor-dot'
          const r = document.createElement('div'); r.className = 'cursor-ring'
          document.body.appendChild(d); document.body.appendChild(r)
        }
        document.body.classList.add('product')
        const dot = document.querySelector('.cursor-dot')
        const ring = document.querySelector('.cursor-ring')
        let rx = 0, ry = 0, tx = 0, ty = 0
        const onMouse = (e) => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; tx = e.clientX; ty = e.clientY }
        window.addEventListener('mousemove', onMouse)
        function tick() { rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; root.__cursorRaf = requestAnimationFrame(tick) }
        tick()
        root.__cursorCleanup = () => {
          window.removeEventListener('mousemove', onMouse)
          if (root.__cursorRaf) cancelAnimationFrame(root.__cursorRaf)
          document.body.classList.remove('product', 'cursor-hover', 'cursor-text', 'cursor-zoom')
        }
      }

      function bindCursor() {
        if (window.matchMedia('(pointer: coarse)').matches) return
        const addHover = () => document.body.classList.add('cursor-hover')
        const removeHover = () => document.body.classList.remove('cursor-hover')
        root.querySelectorAll('a, button, summary, .swatch-btn, .size-pill, .thumb, [data-cursor-hover]').forEach(el => {
          el.removeEventListener('mouseenter', addHover)
          el.removeEventListener('mouseleave', removeHover)
          el.addEventListener('mouseenter', addHover)
          el.addEventListener('mouseleave', removeHover)
        })
      }

      // ── Track view ──
      trackProductView(product.id)

      // ── Gallery ──
      let idx = 0
      const stage = root.querySelector('#pdp-stage')
      const stageImg = root.querySelector('#pdp-stage-img')
      const curEl = root.querySelector('#pdp-cur')
      const captionEl = root.querySelector('#pdp-caption')
      const thumbsEl = root.querySelector('#pdp-thumbs')

      function paintThumbs() {
        if (!thumbsEl) return
        thumbsEl.innerHTML = images.map((img, i) => `
          <button class="thumb${i === idx ? ' active' : ''}${isPerfume ? ' !bg-white' : ''}" data-i="${i}">
            <span class="idx">${String(i + 1).padStart(2, '0')}</span>
            <img src="${img}" alt="thumb ${i + 1}" class="${isPerfume ? 'object-contain p-1' : ''}"/>
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
        bindCursor()
      }

      root.querySelector('#pdp-prev')?.addEventListener('click', () => go(idx - 1))
      root.querySelector('#pdp-next')?.addEventListener('click', () => go(idx + 1))

      const onKey = (e) => {
        if (e.key === 'ArrowLeft') go(idx - 1)
        if (e.key === 'ArrowRight') go(idx + 1)
      }
      window.addEventListener('keydown', onKey)

      // Click-to-zoom
      if (stage) {
        stage.addEventListener('click', (e) => {
          if (e.target.closest('button')) return
          stage.classList.toggle('zoomed')
          document.body.classList.toggle('cursor-zoom', stage.classList.contains('zoomed'))
        })
      }

      paintThumbs()

      // ── Share ──
      root.querySelector('#pdp-share')?.addEventListener('click', () => {
        const shareUrl = `${window.location.origin}/producto/${product.id}`
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
          colorsEl.querySelectorAll('.swatch-btn').forEach(x => x.classList.remove('active'))
          btn.classList.add('active')
          selectedColor = btn.dataset.color
          if (colorNameEl) colorNameEl.textContent = selectedColor
          bindCursor()
        })
      }

      // ── Sizes ──
      let selectedSize = null
      const sizesEl = root.querySelector('#pdp-sizes')
      const sizeNameEl = root.querySelector('#pdp-size-name')
      const addBtn = root.querySelector('#qv-add-to-cart')
      const addLabel = root.querySelector('#pdp-add-label')

      if (sizesEl) {
        sizesEl.addEventListener('click', (e) => {
          const btn = e.target.closest('.size-pill')
          if (!btn || btn.classList.contains('disabled')) return
          sizesEl.querySelectorAll('.size-pill').forEach(x => x.classList.remove('active'))
          btn.classList.add('active')
          selectedSize = btn.dataset.size
          if (sizeNameEl) sizeNameEl.textContent = selectedSize
          if (addBtn) {
            addBtn.disabled = false
            if (addLabel) addLabel.innerHTML = `
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              Agregar · talla ${selectedSize}
            `
          }
          bindCursor()
        })
      }

      // ── Add to cart ──
      function handleAdd() {
        if (hasSizes && !selectedSize) return
        addToCart({ productId: product.id, size: selectedSize || '', color: selectedColor, qty: 1 })
        showToast('¡Producto agregado al carrito!')

        const origLabel = addLabel ? addLabel.innerHTML : ''
        if (addLabel) addLabel.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          ¡Agregado a la bolsa!
        `
        if (addBtn) addBtn.disabled = true

        setTimeout(() => {
          if (addLabel) addLabel.innerHTML = origLabel
          if (addBtn) {
            addBtn.disabled = false
            if (hasSizes && !root.querySelector('#pdp-sizes .size-pill.active')) {
              addBtn.disabled = true
              selectedSize = null
              if (addLabel) addLabel.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                Selecciona una talla
              `
            }
          }
        }, 1800)
      }

      addBtn?.addEventListener('click', handleAdd)

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

      // ── Cursor bind ──
      bindCursor()

      // ── Reveal on scroll ──
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') })
      }, { threshold: 0.1 })
      root.querySelectorAll('.reveal').forEach(el => io.observe(el))

      // ── Cleanup ──
      return () => {
        window.removeEventListener('keydown', onKey)
        root.__cursorCleanup?.()
        io.disconnect()
      }
    }
  }
}
