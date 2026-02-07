import { getProductById, cartCount, getState } from './store.js'
import { formatMoney } from './format.js'

let activeTimer = null
let activeEl = null

function cleanup() {
  if (activeTimer) { clearTimeout(activeTimer); activeTimer = null }
  if (activeEl) {
    activeEl.classList.add('mini-cart-exit')
    const el = activeEl
    activeEl = null
    setTimeout(() => el.remove(), 250)
  }
  document.removeEventListener('keydown', onEsc)
  document.removeEventListener('click', onOutside)
}

function onEsc(e) { if (e.key === 'Escape') cleanup() }
function onOutside(e) {
  if (activeEl && !activeEl.contains(e.target)) cleanup()
}

/**
 * Show a mini cart preview after adding a product.
 * Desktop: popover drops from header cart icon area.
 * Mobile: compact bottom sheet above the bottom nav.
 */
export function showMiniCart(productId) {
  cleanup()

  const product = getProductById(productId)
  if (!product) return

  const state = getState()
  const img = product.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=120&h=150&fit=crop'
  const isPerfume = product.type === 'Perfumes'
  const imgFit = isPerfume ? 'object-contain bg-white' : 'object-cover'
  const isDark = state.theme === 'dark'
  const count = cartCount()
  const subtotal = state.cart.reduce((sum, item) => {
    const p = getProductById(item.productId)
    return sum + (p ? p.price * item.qty : 0)
  }, 0)

  const el = document.createElement('div')
  el.className = 'mini-cart-preview'
  el.setAttribute('role', 'status')
  el.setAttribute('aria-label', 'Producto agregado al carrito')
  el.innerHTML = `
    <div class="mini-cart-inner ${isDark ? 'bg-gray-900 border-gray-700/80 text-white' : 'bg-white border-gray-200 text-gray-900'}">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          <span class="text-[13px] font-semibold">Agregado al carrito</span>
        </div>
        <button class="mini-cart-close p-1 -mr-1 rounded-full ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors" aria-label="Cerrar">
          <svg class="w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Product row -->
      <div class="flex gap-3 px-4 py-2.5">
        <div class="w-14 h-[72px] md:w-12 md:h-16 rounded-lg overflow-hidden shrink-0 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}">
          <img src="${img}" alt="${product.name}" class="w-full h-full ${imgFit}" loading="lazy" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-medium truncate leading-snug">${product.name}</p>
          <p class="text-[12px] ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5">Cant: 1</p>
          <p class="text-[14px] font-bold mt-0.5">${formatMoney(product.price)}</p>
        </div>
      </div>

      <!-- Subtotal -->
      <div class="flex items-center justify-between px-4 py-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}">
        <span class="text-[12px] ${isDark ? 'text-gray-400' : 'text-gray-500'}">Subtotal (${count} ${count === 1 ? 'artículo' : 'artículos'})</span>
        <span class="text-[13px] font-bold">${formatMoney(subtotal)}</span>
      </div>

      <!-- CTA -->
      <div class="px-4 pb-3.5 pt-1">
        <a href="#/cart" class="mini-cart-cta flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all active:scale-[0.97] ${isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}">
          Ver carrito
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  `

  document.body.appendChild(el)
  activeEl = el

  // Animate in on next frame
  requestAnimationFrame(() => el.classList.add('mini-cart-visible'))

  // Close button
  el.querySelector('.mini-cart-close').addEventListener('click', (e) => {
    e.stopPropagation()
    cleanup()
  })

  // CTA closes preview on navigation
  el.querySelector('.mini-cart-cta').addEventListener('click', () => cleanup())

  // Keyboard dismiss
  setTimeout(() => document.addEventListener('keydown', onEsc), 10)

  // Outside click dismiss (delay so the Quick Add click doesn't immediately dismiss)
  setTimeout(() => document.addEventListener('click', onOutside), 100)

  // Auto-dismiss after 4 seconds
  activeTimer = setTimeout(cleanup, 4000)
}
