import { formatMoney } from '../app/format.js'
import { getProductById, removeCartItem, setCartItemQty, cartTotal } from '../app/store.js'
import { on, qs } from '../app/dom.js'

function lineRow(item) {
  const p = getProductById(item.productId)
  if (!p) return ''

  const subtotal = (p.price || 0) * (Number(item.qty) || 0)
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=100&h=100&fit=crop'

  return `
    <div class="flex gap-3 py-4 border-b border-gray-200 dark:border-gray-800" data-cart-item data-key="${item.key}">
      <div class="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img src="${img}" alt="${p.name}" class="w-full h-full object-cover" loading="lazy"/>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">${p.name}</h3>
            <p class="text-xs text-gray-500 mt-0.5">${item.size || ''} ${item.color ? `/ ${item.color}` : ''}</p>
          </div>
          <button type="button" class="text-gray-400 hover:text-red-500 transition-colors p-2 -mr-2" data-remove aria-label="Eliminar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
            <button type="button" class="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700" data-qty-minus>−</button>
            <input
              class="w-12 h-10 md:w-10 md:h-8 bg-transparent text-center text-sm font-medium text-gray-900 dark:text-white focus:outline-none"
              type="number"
              min="1"
              inputmode="numeric"
              data-qty
              value="${item.qty}"
            />
            <button type="button" class="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700" data-qty-plus>+</button>
          </div>
          <div class="text-sm font-semibold text-gray-900 dark:text-white">${formatMoney(subtotal)}</div>
        </div>
      </div>
    </div>
  `
}

export function pageCart(state) {
  const itemCount = state.cart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)

  return {
    title: 'Carrito | G&L',
    html: `
      <!-- Header -->
      <section class="mb-4">
        <a href="#/catalog" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Seguir comprando
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Carrito (${itemCount})</h1>
      </section>

      <!-- Cart Items -->
      <section class="mb-6" id="cart-list"></section>

      <!-- Summary -->
      <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
        <div class="space-y-3 mb-5">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span id="cart-total" class="text-gray-900 dark:text-white"></span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Envío</span>
            <span class="text-gray-500 dark:text-gray-400">Por calcular</span>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
            <span class="font-semibold text-gray-900 dark:text-white">Total</span>
            <span id="cart-total-final" class="text-lg font-bold text-gray-900 dark:text-white"></span>
          </div>
        </div>

        <a
          href="#/checkout"
          class="flex items-center justify-center gap-2 w-full rounded-lg bg-black dark:bg-white px-4 py-3.5 text-sm font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Continuar al checkout
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </a>

        <p class="text-center text-xs text-gray-500 mt-4">
          Pago seguro por WhatsApp
        </p>
      </section>
    `,
    onMount(root) {
      const list = qs(root, '#cart-list')
      const totalEl = qs(root, '#cart-total')
      const totalFinalEl = root.querySelector('#cart-total-final')

      const render = () => {
        if (!state.cart.length) {
          list.innerHTML = `
            <div class="text-center py-16">
              <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg class="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tu carrito está vacío</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Explora nuestra colección</p>
              <a href="#/catalog" class="inline-flex items-center gap-2 rounded-full bg-black dark:bg-white px-6 py-3 text-sm font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                Ir a la tienda
              </a>
            </div>
          `
        } else {
          list.innerHTML = state.cart.map(lineRow).join('')
        }
        const total = cartTotal()
        totalEl.textContent = formatMoney(total)
        if (totalFinalEl) totalFinalEl.textContent = formatMoney(total)
      }

      render()

      const getKey = (el) => el.closest('[data-cart-item]')?.getAttribute('data-key')

      on(root, 'click', '[data-remove]', (_ev, btn) => {
        const key = getKey(btn)
        if (!key) return
        removeCartItem(key)
      })

      on(root, 'click', '[data-qty-minus]', (_ev, btn) => {
        const wrap = btn.closest('[data-cart-item]')
        const key = wrap?.getAttribute('data-key')
        const input = wrap?.querySelector('[data-qty]')
        if (!key || !(input instanceof HTMLInputElement)) return
        const next = Math.max(1, Number(input.value || 1) - 1)
        setCartItemQty(key, next)
      })

      on(root, 'click', '[data-qty-plus]', (_ev, btn) => {
        const wrap = btn.closest('[data-cart-item]')
        const key = wrap?.getAttribute('data-key')
        const input = wrap?.querySelector('[data-qty]')
        if (!key || !(input instanceof HTMLInputElement)) return
        const next = Math.max(1, Number(input.value || 1) + 1)
        setCartItemQty(key, next)
      })

      on(root, 'change', '[data-qty]', (_ev, inputEl) => {
        const wrap = inputEl.closest('[data-cart-item]')
        const key = wrap?.getAttribute('data-key')
        if (!key || !(inputEl instanceof HTMLInputElement)) return
        setCartItemQty(key, Number(inputEl.value || 1))
      })
    },
  }
}
