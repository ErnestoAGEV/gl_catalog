import { formatMoney } from '../../utils/format.js'
import { productPath } from '../../utils/productCopy.js'
import { getProductById, removeCartItem, setCartItemQty, cartTotal, getState, getCoupon, getDiscountAmount, applyCoupon, removeCoupon, addToCart } from '../../store/index.js'
import { on, qs } from '../../utils/dom.js'
import { BRAND } from '../../utils/config.js'
import { navigate } from '../../core/router.js'
import { isPerfumeCategory } from '../admin/adminProductsData.js'
import { escapeHtml } from '../../utils/sanitize.js'

function isInfiniteStock(stock) {
  return stock === undefined || stock === null || stock === '' || stock === '\u221E'
}

function colorNameToHex(name) {
  const map = {
    'negro': '#0A0A0F', 'blanco': '#FFFFFF', 'azul': '#214fc7',
    'rojo': '#b03832', 'verde': '#3b4a3e', 'gris': '#6b7280',
    'beige': '#d6c4a4', 'marino': '#19355c', 'oliva': '#566042',
    'hueso': '#F4EFE3', 'carb\u00F3n': '#3a3530', 'caf\u00E9': '#5c3d2e',
    'crudo': '#1d2a4a',
  }
  return map[(name || '').toLowerCase()] || '#6b7280'
}

function lineRow(item, idx) {
  const p = getProductById(item.productId)
  if (!p) return ''

  const img = escapeHtml(p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop')
  const safeName = escapeHtml(p.name)
  const safeType = escapeHtml(p.type || '')
  const safeColor = escapeHtml(item.color || '')
  const safeSize = escapeHtml(item.size || '')
  const safeKey = escapeHtml(item.key || '')
  const ord = String(idx + 1).padStart(2, '0')
  const sub = (p.price || 0) * (Number(item.qty) || 0)
  const hasDiscount = p.originalPrice && p.originalPrice > p.price
  const colorHex = colorNameToHex(item.color)
  const sku = escapeHtml(p.sku || `GL-${String(item.productId).slice(0, 8)}`)

  return `
    <div class="cart-row grid grid-cols-12 gap-4 items-center py-6" data-cart-item data-key="${safeKey}">
      <div class="col-span-12 md:col-span-6 flex gap-4 md:gap-5">
        <div class="w-20 md:w-28 flex-shrink-0 rounded-md overflow-hidden bg-fog aspect-[4/5]">
          <img src="${img}" alt="${safeName}" class="w-full h-full object-cover" loading="lazy"/>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 mb-1">
            <span class="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/45">${ord}</span>
            <span class="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/55">${safeType}</span>
          </div>
          <div class="font-display font-extrabold text-[clamp(18px,2vw,28px)] leading-[1] tracking-[-0.03em] mb-2 truncate">${safeName}</div>
          <div class="flex items-center gap-2 md:gap-3 font-mono text-[10px] md:text-[11px] text-ink/55 flex-wrap">
            ${safeColor ? `<span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-full border border-ink/15" style="background:${colorHex}"></span>${safeColor}</span><span class="opacity-40">\u00B7</span>` : ''}
            ${safeSize ? `<span>Talla ${safeSize}</span><span class="opacity-40">\u00B7</span>` : ''}
            <span class="hidden md:inline">${sku}</span>
          </div>
          <div class="mt-3 flex items-center gap-4 text-[12px]">
            <button class="ul-link text-ink/65 hover:text-brand" data-remove>Eliminar</button>
          </div>
        </div>
      </div>
      <div class="col-span-6 md:col-span-3 flex md:justify-center">
        <div class="qty-stepper">
          <button data-qty-minus aria-label="Disminuir">\u2212</button>
          <input value="${item.qty}" inputmode="numeric" min="1" max="99" data-qty/>
          <button data-qty-plus aria-label="Aumentar">+</button>
        </div>
      </div>
      <div class="col-span-6 md:col-span-3 text-right">
        ${hasDiscount ? `<div class="font-mono text-[12px] text-ink/40 line-through">${formatMoney(p.originalPrice * item.qty)}</div>` : ''}
        <div class="font-display font-extrabold text-[clamp(18px,2vw,28px)] leading-none tracking-[-0.03em] digit-tabular ${hasDiscount ? 'text-brand' : ''}">${formatMoney(sub)}</div>
        <div class="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase text-ink/45">${formatMoney(p.price)} c/u</div>
      </div>
    </div>
  `
}

export function pageCart(state) {
  const cart = state.cart
  const itemCount = cart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
  const countText = String(itemCount).padStart(2, '0')
  const pieceWord = itemCount === 1 ? 'pieza' : 'piezas'

  // Upsell: 3 random products not in cart, not draft, in stock
  const cartItemIds = new Set(cart.map(i => i.productId))
  const eligibleUpsell = state.products.filter(p =>
    p.badge !== 'Borrador' && !cartItemIds.has(p.id) && (isInfiniteStock(p.stock) || Number(p.stock) > 0)
  )
  const upsellProducts = eligibleUpsell.sort(() => 0.5 - Math.random()).slice(0, 3)

  return {
    title: 'Bolsa | G&L',
    noPaddingTop: true,
    fullWidth: true,
    forceLight: true,
    html: `
      <!-- HERO HEADER -->
      <section class="pt-8 md:pt-14 lg:pt-20 pb-8 md:pb-10 border-b border-ink/10">
        <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10">
          <div class="flex items-center gap-2 md:gap-3 mb-6 md:mb-8 flex-wrap">
            <a href="/catalog" class="inline-flex items-center gap-2 font-mono text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-ink/55 hover:text-ink">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Seguir comprando
            </a>
            <span class="h-px flex-1 bg-ink/15 mx-2 md:mx-3 hidden md:block"></span>
            <span class="hidden md:inline font-mono text-[11px] tracking-[0.28em] uppercase text-ink/55">Paso 01 \u2014 Bolsa</span>
            <span class="hidden md:inline opacity-30">\u00B7</span>
            <span class="hidden md:inline font-mono text-[11px] tracking-[0.28em] uppercase opacity-40">02 \u2014 Datos</span>
            <span class="hidden md:inline opacity-30">\u00B7</span>
            <span class="hidden md:inline font-mono text-[11px] tracking-[0.28em] uppercase opacity-40">03 \u2014 WhatsApp</span>
          </div>

          <div class="grid grid-cols-12 gap-4 md:gap-6 lg:gap-10 items-end">
            <div class="col-span-12 lg:col-span-9">
              <h1 class="font-display font-extrabold text-[clamp(48px,11vw,184px)] leading-[0.86] tracking-[-0.04em]">
                Tu <span class="text-brand">bolsa</span><br/>
                <span class="outline-text" id="hero-count">${countText} ${pieceWord}.</span>
              </h1>
            </div>
            <div class="col-span-12 lg:col-span-3 lg:text-right mt-2 lg:mt-0">
              <p class="text-[13px] md:text-[15px] text-ink/70 max-w-[320px] lg:ml-auto leading-relaxed">
                Reserva sin pagar online. Cerramos cada pedido por WhatsApp \u2014 pago en transferencia o al recoger.
              </p>
            </div>
          </div>

          <!-- Free-shipping progress -->
          <div class="mt-8 md:mt-12" id="shipping-progress"></div>
        </div>
      </section>

      <!-- BODY GRID -->
      <section class="py-8 md:py-14 lg:py-20">
        <div class="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10">
          <div class="grid grid-cols-12 gap-6 md:gap-8 lg:gap-12">

            <!-- RIGHT: PRICING RAIL (first on mobile) -->
            <aside id="rail-aside" class="col-span-12 lg:col-span-4 order-first lg:order-none">
              <div class="lg:sticky lg:top-[96px] space-y-4" id="pricing-rail"></div>
            </aside>

            <!-- LEFT: ITEMS -->
            <div class="col-span-12 lg:col-span-8">
              <!-- Column header (desktop) -->
              <div id="col-header" class="hidden md:grid grid-cols-12 gap-4 pb-4 font-mono text-[10px] tracking-[0.28em] uppercase text-ink/45">
                <div class="col-span-6">Producto</div>
                <div class="col-span-3 text-center">Cantidad</div>
                <div class="col-span-3 text-right">Total</div>
              </div>

              <div id="cart-list"></div>

              <!-- Empty state -->
              <div id="cart-empty" class="hidden py-16 md:py-20 text-center">
                <div class="font-display font-extrabold text-[48px] md:text-[80px] outline-text leading-none">Bolsa vac\u00EDa</div>
                <p class="mt-4 text-ink/60">A\u00FAn no has agregado nada.</p>
                <a href="/catalog" class="mt-6 inline-flex items-center gap-3 bg-ink text-paper px-7 h-12 md:h-14 rounded-full text-[13px] md:text-[14px] font-semibold hover:bg-brand transition-colors">
                  Explorar cat\u00E1logo
                  <span class="arrow-walk inline-block">\u2192</span>
                </a>
              </div>

              <!-- Utility row -->
              <div id="cart-utility" class="mt-8 flex items-center justify-between flex-wrap gap-3">
                <button class="font-mono text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-ink/60 hover:text-ink inline-flex items-center gap-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 12h14M5 16h10"/></svg>
                  Guardar para despu\u00E9s
                </button>
                <a href="/catalog" class="ul-link text-[13px] font-semibold">\u2190 Seguir comprando</a>
              </div>

              <!-- Recommended -->
              <div class="mt-16 md:mt-20" id="cart-recommended">
                <div class="flex items-end justify-between mb-6">
                  <div>
                    <div class="font-mono text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-ink/55 mb-3">\u00A7 \u2014 Completa tu look</div>
                    <h2 class="font-display font-extrabold text-[clamp(28px,5vw,64px)] leading-[0.9] tracking-[-0.04em]">
                      Tambi\u00E9n va con<br/>lo de tu bolsa.
                    </h2>
                  </div>
                  <a href="/catalog" class="hidden md:inline-flex ul-link text-[13px] font-semibold pb-2">Ver m\u00E1s \u2192</a>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4" id="upsell-grid"></div>
              </div>
            </div>

          </div>
        </div>
      </section>
    `,
    onMount(root) {
      const list = qs(root, '#cart-list')
      const emptyEl = qs(root, '#cart-empty')
      const utilityRow = qs(root, '#cart-utility')
      const pricingRail = qs(root, '#pricing-rail')
      const railAside = qs(root, '#rail-aside')
      const colHeader = qs(root, '#col-header')
      const shippingProgress = qs(root, '#shipping-progress')
      const heroCount = qs(root, '#hero-count')
      const upsellGrid = qs(root, '#upsell-grid')
      const recommendedSection = qs(root, '#cart-recommended')

      // ── Cursor init ──
      if (!window.matchMedia('(pointer: coarse)').matches) {
        if (!document.querySelector('.cursor-dot')) {
          const dot = document.createElement('div')
          dot.className = 'cursor-dot'
          const ring = document.createElement('div')
          ring.className = 'cursor-ring'
          document.body.appendChild(dot)
          document.body.appendChild(ring)
        }
        document.body.classList.add('catalog')
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
          document.body.classList.remove('catalog', 'cursor-hover', 'cursor-text')
        }
      }

      function bindCursor() {
        if (window.matchMedia('(pointer: coarse)').matches) return
        const addHover = () => document.body.classList.add('cursor-hover')
        const removeHover = () => document.body.classList.remove('cursor-hover')
        const addText = () => document.body.classList.add('cursor-text')
        const removeText = () => document.body.classList.remove('cursor-text')
        root.querySelectorAll('a, button, summary, [data-cursor-hover]').forEach(el => {
          el.removeEventListener('mouseenter', addHover)
          el.removeEventListener('mouseleave', removeHover)
          el.addEventListener('mouseenter', addHover)
          el.addEventListener('mouseleave', removeHover)
        })
        root.querySelectorAll('input, textarea, select').forEach(el => {
          el.removeEventListener('mouseenter', addText)
          el.removeEventListener('mouseleave', removeText)
          el.addEventListener('mouseenter', addText)
          el.addEventListener('mouseleave', removeText)
        })
      }

      // ── Render upsell ──
      function renderUpsell() {
        if (upsellProducts.length === 0) {
          recommendedSection.classList.add('hidden')
          return
        }
        recommendedSection.classList.remove('hidden')
        upsellGrid.innerHTML = upsellProducts.map(p => {
          const img = escapeHtml(p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop')
          const safeName = escapeHtml(p.name)
          const safeType = escapeHtml(p.type || '')
          const perfume = isPerfumeCategory(p.type)
          const bgClass = perfume ? 'bg-white' : 'bg-fog'
          const imgClass = perfume ? 'object-contain p-3' : 'object-cover'
          return `
            <a href="${productPath(p)}" class="group block" data-upsell-link="${p.id}">
              <div class="aspect-[4/5] ${bgClass} rounded-md overflow-hidden">
                <img src="${img}" alt="${safeName}" class="w-full h-full ${imgClass} group-hover:scale-105 transition-transform duration-700" loading="lazy"/>
              </div>
              <div class="mt-3 flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/55">${safeType}</div>
                  <div class="font-display font-bold text-[14px] md:text-[15px] leading-tight truncate">${safeName}</div>
                </div>
                <div class="font-mono text-[12px] md:text-[13px] font-semibold flex-shrink-0">${formatMoney(p.price)}</div>
              </div>
            </a>
          `
        }).join('')
      }

      // ── Render pricing rail ──
      function renderRail() {
        const liveCart = getState().cart
        const subtotal = cartTotal()
        const coupon = getCoupon()
        const discount = getDiscountAmount()
        const total = subtotal - discount
        const count = liveCart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
        const freeShipping = subtotal >= BRAND.freeShippingMin

        const couponHtml = coupon
          ? `<div class="flex items-center justify-between bg-brand/[0.07] border border-brand/30 rounded-full px-4 h-12">
              <div class="flex items-center gap-2 md:gap-3 min-w-0">
                <span class="font-mono text-[11px] md:text-[12px] font-semibold text-brand truncate">${coupon.code}</span>
                <span class="font-mono text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-brand/75 hidden sm:inline">${coupon.label || `\u2212${Math.round((coupon.discount || 0) * 100)}% aplicado`}</span>
              </div>
              <button data-remove-coupon class="text-[11px] font-mono uppercase tracking-wider text-ink/55 hover:text-brand flex-shrink-0">Quitar</button>
            </div>`
          : ''

        pricingRail.innerHTML = `
          <!-- Pricing card -->
          <div class="rail p-5 md:p-7">
            <div class="flex items-center justify-between mb-5 md:mb-6">
              <div class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55">Resumen</div>
              <div class="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/55">${count} ${count === 1 ? 'pieza' : 'piezas'}</div>
            </div>
            <div class="space-y-3 font-mono text-[12px] md:text-[13px] digit-tabular">
              <div class="row"><span class="text-ink/65">Subtotal</span><span>${formatMoney(subtotal)}</span></div>
              ${coupon ? `<div class="row text-brand"><span class="inline-flex items-center gap-2">Descuento <span class="bg-brand/10 px-1.5 py-0.5 rounded text-[10px] tracking-wider">${coupon.code}</span></span><span>\u2212${formatMoney(discount)}</span></div>` : ''}
              <div class="row"><span class="text-ink/65">Env\u00EDo</span><span class="${freeShipping ? 'text-brand' : 'text-ink/65'}">${freeShipping ? '\u00A1Gratis!' : 'Por calcular'}</span></div>
              <div class="row"><span class="text-ink/65">Impuestos</span><span>Incluidos</span></div>
            </div>
            <div class="my-5 md:my-6 h-px bg-ink/10"></div>
            <div class="flex items-baseline justify-between">
              <div class="font-mono text-[11px] tracking-[0.28em] uppercase">Total</div>
              <div class="font-display font-extrabold text-[32px] md:text-[44px] tracking-[-0.04em] digit-tabular">${formatMoney(total)}</div>
            </div>
            <div class="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase text-ink/45 text-right">MXN \u00B7 IVA incluido</div>
            <a href="/checkout" class="mt-5 md:mt-7 group flex items-center justify-between gap-3 bg-ink text-paper pl-5 md:pl-7 pr-2 md:pr-3 h-14 md:h-16 rounded-full text-[14px] md:text-[15px] font-semibold hover:bg-brand transition-colors">
              <span>Continuar al checkout</span>
              <span class="w-10 md:w-12 h-10 md:h-12 rounded-full bg-paper text-ink flex items-center justify-center flex-shrink-0">
                <svg class="w-4 md:w-5 h-4 md:h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
              </span>
            </a>
            <div class="mt-4 flex items-center justify-center gap-2 font-mono text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-ink/55">
              <svg class="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 11c0-1.7 1.3-3 3-3s3 1.3 3 3v3M8 11V8c0-2.2 1.8-4 4-4s4 1.8 4 4M6 11h12v9H6z"/></svg>
              Cierre seguro \u00B7 sin pago online
            </div>
          </div>

          <!-- Coupon card -->
          <div class="border border-ink/10 rounded-lg p-4 md:p-5">
            <div class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55 mb-3">Cup\u00F3n</div>
            ${couponHtml}
            <details class="${coupon ? 'mt-3' : ''}" id="coupon-details">
              <summary class="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/55 hover:text-ink cursor-pointer">${coupon ? '+ Otro c\u00F3digo' : '+ Agregar c\u00F3digo'}</summary>
              <div class="mt-3 flex gap-2">
                <input type="text" id="coupon-input" placeholder="C\u00D3DIGO" class="flex-1 font-mono text-[12px] tracking-wider uppercase border border-ink/15 rounded-full px-4 h-11 outline-none focus:border-ink placeholder:text-ink/35"/>
                <button id="coupon-apply-btn" class="px-4 md:px-5 h-11 rounded-full bg-ink text-paper text-[12px] font-semibold hover:bg-brand transition-colors">Aplicar</button>
              </div>
              <div id="coupon-error" class="hidden mt-2 font-mono text-[10px] text-red-600"></div>
            </details>
          </div>

          <!-- Trust strip -->
          <div class="grid grid-cols-3 gap-px bg-ink/10 rounded-lg overflow-hidden">
            <div class="bg-paper p-3 md:p-4 text-center">
              <div class="font-display font-extrabold text-[18px] md:text-[22px] leading-none">31<span class="text-brand">.</span></div>
              <div class="mt-1 font-mono text-[8px] md:text-[9px] tracking-[0.18em] uppercase text-ink/55">A\u00F1os en Colima</div>
            </div>
            <div class="bg-paper p-3 md:p-4 text-center">
              <div class="font-display font-extrabold text-[18px] md:text-[22px] leading-none">4.9<span class="opacity-40 text-[12px] md:text-[14px]">/5</span></div>
              <div class="mt-1 font-mono text-[8px] md:text-[9px] tracking-[0.18em] uppercase text-ink/55">+500 rese\u00F1as</div>
            </div>
            <div class="bg-paper p-3 md:p-4 text-center">
              <div class="font-display font-extrabold text-[18px] md:text-[22px] leading-none">02</div>
              <div class="mt-1 font-mono text-[8px] md:text-[9px] tracking-[0.18em] uppercase text-ink/55">Sucursales</div>
            </div>
          </div>
        `
      }

      // ── Render shipping progress ──
      function renderShippingProgress() {
        const subtotal = cartTotal()
        const pct = Math.min(100, (subtotal / BRAND.freeShippingMin) * 100)
        const active = subtotal >= BRAND.freeShippingMin
        const sheenHtml = active
          ? `<div class="absolute inset-0" style="background:linear-gradient(90deg,transparent,rgba(33,79,199,.55),transparent);animation:scroll-x 2.4s linear infinite;"></div>`
          : ''

        const statusHtml = active
          ? `<span class="text-brand">\u00A1Activo!</span>`
          : `<span class="text-ink/60">Faltan ${formatMoney(BRAND.freeShippingMin - subtotal)}</span>`

        shippingProgress.innerHTML = `
          <div class="flex items-baseline justify-between mb-2 md:mb-3">
            <div class="font-mono text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-ink/55">Env\u00EDo gratis a ${formatMoney(BRAND.freeShippingMin)}</div>
            <div class="font-mono text-[11px] md:text-[12px] digit-tabular">${formatMoney(subtotal)} / ${formatMoney(BRAND.freeShippingMin)} \u00B7 ${statusHtml}</div>
          </div>
          <div class="h-[6px] w-full bg-fog rounded-full overflow-hidden relative">
            <div class="h-full bg-ink rounded-full relative overflow-hidden transition-[width] duration-500" style="width:${pct}%">
              ${sheenHtml}
            </div>
          </div>
        `
      }

      // ── Main render ──
      const render = () => {
        const liveCart = getState().cart
        const count = liveCart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
        const countText = String(count).padStart(2, '0')
        const pieceWord = count === 1 ? 'pieza' : 'piezas'

        // Update hero
        heroCount.textContent = `${countText} ${pieceWord}.`

        if (!liveCart.length) {
          list.innerHTML = ''
          emptyEl.classList.remove('hidden')
          utilityRow.classList.add('hidden')
          recommendedSection.classList.add('hidden')
          railAside.classList.add('hidden')
          colHeader.classList.add('hidden')
          shippingProgress.classList.add('hidden')
        } else {
          emptyEl.classList.add('hidden')
          utilityRow.classList.remove('hidden')
          railAside.classList.remove('hidden')
          colHeader.classList.remove('hidden')
          shippingProgress.classList.remove('hidden')
          list.innerHTML = liveCart.map((item, idx) => lineRow(item, idx)).join('')
          renderUpsell()
          renderRail()
          renderShippingProgress()
        }
        bindCursor()
      }

      render()

      // ── Reveal observer ──
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
      }, { threshold: 0.1 })
      root.querySelectorAll('.reveal').forEach(el => io.observe(el))

      // ── Event handlers ──
      const getKey = (el) => el.closest('[data-cart-item]')?.getAttribute('data-key')

      on(root, 'click', '[data-remove]', (_ev, btn) => {
        const key = getKey(btn)
        if (!key) return
        removeCartItem(key)
        render()
      })

      on(root, 'click', '[data-qty-minus]', (_ev, btn) => {
        const wrap = btn.closest('[data-cart-item]')
        const key = wrap?.getAttribute('data-key')
        const input = wrap?.querySelector('[data-qty]')
        if (!key || !(input instanceof HTMLInputElement)) return
        const next = Math.max(1, Number(input.value || 1) - 1)
        setCartItemQty(key, next)
        render()
      })

      on(root, 'click', '[data-qty-plus]', (_ev, btn) => {
        const wrap = btn.closest('[data-cart-item]')
        const key = wrap?.getAttribute('data-key')
        const input = wrap?.querySelector('[data-qty]')
        if (!key || !(input instanceof HTMLInputElement)) return
        const next = Math.min(99, Number(input.value || 1) + 1)
        setCartItemQty(key, next)
        render()
      })

      on(root, 'change', '[data-qty]', (_ev, inputEl) => {
        const wrap = inputEl.closest('[data-cart-item]')
        const key = wrap?.getAttribute('data-key')
        if (!key || !(inputEl instanceof HTMLInputElement)) return
        const val = Math.max(1, Math.min(99, Number(inputEl.value) || 1))
        setCartItemQty(key, val)
        render()
      })

      // Coupon apply
      on(root, 'click', '#coupon-apply-btn', async () => {
        const input = root.querySelector('#coupon-input')
        const errorEl = root.querySelector('#coupon-error')
        if (!input || !errorEl) return
        const code = input.value.trim()
        if (!code) return

        errorEl.classList.add('hidden')
        const result = await applyCoupon(code, true)
        if (result.success) {
          render()
        } else {
          errorEl.textContent = result.error || 'Cup\u00F3n no v\u00E1lido'
          errorEl.classList.remove('hidden')
        }
      })

      // Coupon remove
      on(root, 'click', '[data-remove-coupon]', () => {
        removeCoupon(true)
        render()
      })

      // Upsell navigation
      on(root, 'click', '[data-upsell-link]', (ev, el) => {
        ev.preventDefault()
        const href = el.getAttribute('href')
        if (href) navigate(href)
      })

      // ── Cleanup ──
      return () => {
        if (root.__cursorCleanup) root.__cursorCleanup()
      }
    },
  }
}
