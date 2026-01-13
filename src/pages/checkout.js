import { formatMoney } from '../app/format.js'
import { getProductById, cartTotal, getCoupon, applyCoupon, removeCoupon, getDiscountedTotal } from '../app/store.js'
import { BRAND } from '../app/config.js'
import { buildOrderMessage, openWhatsAppWithMessage } from '../app/whatsapp.js'
import { on, qs } from '../app/dom.js'

function needsAddress(paymentMethod, deliveryMethod) {
  return paymentMethod === 'Transferencia' && deliveryMethod === 'Envío a domicilio'
}

export function pageCheckout(state) {
  const subtotal = cartTotal()
  const coupon = getCoupon()
  const discount = coupon ? subtotal * (coupon.discount || 0) : 0
  const total = subtotal - discount
  const freeShipping = coupon?.freeShipping || subtotal >= BRAND.freeShippingMin
  const itemCount = state.cart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)

  return {
    title: 'Checkout | G&L',
    html: `
      <section class="mb-5">
        <a href="#/cart" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al carrito
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
      </section>

      <!-- Order Summary -->
      <section class="mb-5 rounded-xl bg-gray-100 dark:bg-gray-900 p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">Resumen del pedido</div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">${itemCount} productos</span>
            <span class="text-gray-900 dark:text-white">${formatMoney(subtotal)}</span>
          </div>
          ${coupon ? `
          <div class="flex justify-between text-emerald-400">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              ${coupon.code}
            </span>
            <span>-${formatMoney(discount)}</span>
          </div>
          ` : ''}
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Envío</span>
            <span class="${freeShipping ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'}">${freeShipping ? 'GRATIS' : 'Por calcular'}</span>
          </div>
          <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <span class="font-semibold text-gray-900 dark:text-white">Total</span>
            <span class="text-lg font-bold text-gray-900 dark:text-white">${formatMoney(total)}</span>
          </div>
        </div>
      </section>

      <!-- Coupon -->
      <section class="mb-5 rounded-xl bg-gray-100 dark:bg-gray-900 p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">¿Tienes un cupón?</div>
        ${coupon ? `
          <div class="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <div>
                <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">${coupon.code}</p>
                <p class="text-xs text-emerald-600/70 dark:text-emerald-400/70">${coupon.label}</p>
              </div>
            </div>
            <button id="remove-coupon" class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Quitar</button>
          </div>
        ` : `
          <div class="flex gap-2">
            <input id="coupon-input" type="text" placeholder="Código de cupón" class="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none uppercase"/>
            <button id="apply-coupon" class="px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">Aplicar</button>
          </div>
          <p id="coupon-error" class="hidden text-xs text-red-500 mt-2"></p>
          <p class="text-xs text-gray-500 mt-2">Prueba: WELCOME10, VERANO20</p>
        `}
      </section>

      <!-- Form -->
      <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5 mb-6">
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-4">Información de contacto</div>

        <form id="checkout-form" class="space-y-4" novalidate>
          <div>
            <label class="block text-xs text-gray-500 mb-1.5">Nombre completo</label>
            <input name="name" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none" placeholder="Tu nombre" />
          </div>

          <div>
            <label class="block text-xs text-gray-500 mb-1.5">WhatsApp</label>
            <input name="whatsapp" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none" inputmode="tel" placeholder="+52 55 1234 5678" />
          </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1.5">Pago</label>
              <select name="paymentMethod" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none">
                <option value="">Seleccionar</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Pago al recoger">Efectivo</option>
              </select>
            </div>

            <div>
              <label class="block text-xs text-gray-500 mb-1.5">Entrega</label>
              <select name="deliveryMethod" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none">
                <option value="">Seleccionar</option>
                <option value="Recoger en tienda">Recoger</option>
                <option value="Envío a domicilio">Envío</option>
              </select>
            </div>
          </div>

          <div id="address-wrap" class="hidden">
            <label class="block text-xs text-gray-500 mb-1.5">Dirección de envío</label>
            <textarea
              name="address"
              rows="2"
              class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none resize-none"
              placeholder="Calle, número, colonia, C.P."
            ></textarea>
          </div>

          <div id="form-error" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500"></div>

          <button
            type="submit"
            class="flex items-center justify-center gap-2 w-full rounded-lg bg-green-500 hover:bg-green-600 px-4 py-3.5 text-sm font-semibold text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            Enviar por WhatsApp
          </button>
        </form>
      </section>

      <!-- Trust -->
      <section class="flex justify-center gap-6 py-4">
        <div class="text-center">
          <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <span class="text-xs text-gray-500">Seguro</span>
        </div>
        <div class="text-center">
          <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span class="text-xs text-gray-500">Rápido</span>
        </div>
        <div class="text-center">
          <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <span class="text-xs text-gray-500">Sin pago online</span>
        </div>
      </section>
    `,
    onMount(root) {
      const form = qs(root, '#checkout-form')
      const addressWrap = qs(root, '#address-wrap')
      const errorBox = qs(root, '#form-error')

      // Coupon handlers
      const couponInput = qs(root, '#coupon-input')
      const applyBtn = qs(root, '#apply-coupon')
      const removeBtn = qs(root, '#remove-coupon')
      const couponError = qs(root, '#coupon-error')

      if (applyBtn && couponInput) {
        applyBtn.addEventListener('click', () => {
          const code = couponInput.value.trim().toUpperCase()
          if (!code) return
          
          const result = applyCoupon(code)
          if (result.success) {
            // Reload page to show applied coupon
            window.dispatchEvent(new CustomEvent('navigate'))
          } else {
            couponError.textContent = result.message || 'Cupón inválido'
            couponError.classList.remove('hidden')
          }
        })

        couponInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            applyBtn.click()
          }
        })
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          removeCoupon()
          window.dispatchEvent(new CustomEvent('navigate'))
        })
      }

      const refreshConditional = () => {
        const payment = qs(root, 'select[name="paymentMethod"]').value
        const delivery = qs(root, 'select[name="deliveryMethod"]').value
        addressWrap.classList.toggle('hidden', !needsAddress(payment, delivery))
      }

      const setError = (msg) => {
        if (!msg) {
          errorBox.classList.add('hidden')
          errorBox.textContent = ''
          return
        }
        errorBox.textContent = msg
        errorBox.classList.remove('hidden')
      }

      refreshConditional()
      on(root, 'change', 'select[name="paymentMethod"],select[name="deliveryMethod"]', () => {
        setError('')
        refreshConditional()
      })

      form.addEventListener('submit', (ev) => {
        ev.preventDefault()
        setError('')

        if (!state.cart.length) {
          setError('Tu carrito está vacío. Volvé al catálogo para agregar productos.')
          return
        }

        const name = qs(root, 'input[name="name"]').value.trim()
        const whatsapp = qs(root, 'input[name="whatsapp"]').value.trim()
        const paymentMethod = qs(root, 'select[name="paymentMethod"]').value
        const deliveryMethod = qs(root, 'select[name="deliveryMethod"]').value
        const address = qs(root, 'textarea[name="address"]').value.trim()

        if (!name) return setError('Ingresá tu nombre.')
        if (!whatsapp) return setError('Ingresá tu WhatsApp.')
        if (!paymentMethod) return setError('Seleccioná un método de pago.')
        if (!deliveryMethod) return setError('Seleccioná un método de entrega.')

        const requireAddress = needsAddress(paymentMethod, deliveryMethod)
        if (requireAddress && !address) return setError('Ingresá tu dirección completa.')

        const cartLines = state.cart
          .map((i) => {
            const p = getProductById(i.productId)
            if (!p) return null
            const qty = Number(i.qty) || 0
            const price = Number(p.price) || 0
            return {
              name: p.name,
              type: p.type,
              size: i.size,
              color: i.color,
              qty,
              price,
              subtotal: qty * price,
            }
          })
          .filter(Boolean)

        const subtotal = cartTotal()
        const appliedCoupon = getCoupon()
        const discount = appliedCoupon ? subtotal * (appliedCoupon.discount || 0) : 0
        const total = subtotal - discount

        const message = buildOrderMessage({
          customer: {
            name,
            whatsapp,
            paymentMethod,
            deliveryMethod,
            address: requireAddress ? address : '',
          },
          cartLines,
          subtotal,
          discount,
          couponCode: appliedCoupon?.code || null,
          total,
        })

        openWhatsAppWithMessage(message)
      })
    },
  }
}
