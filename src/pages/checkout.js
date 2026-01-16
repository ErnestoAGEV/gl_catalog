import { formatMoney } from '../app/format.js'
import { getProductById, cartTotal, getCoupon, applyCoupon, removeCoupon, getDiscountedTotal } from '../app/store.js'
import { BRAND } from '../app/config.js'
import { buildOrderMessage, openWhatsAppWithMessage } from '../app/whatsapp.js'
import { on, qs } from '../app/dom.js'

function needsAddress(paymentMethod, deliveryMethod) {
  return deliveryMethod === 'Envío a domicilio'
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
      <div class="w-full max-w-full overflow-x-hidden">
      <section class="mb-5">
        <a href="#/cart" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al carrito
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
      </section>

      <!-- Main Layout: 2 columns on desktop -->
      <div class="w-full max-w-full lg:grid lg:grid-cols-5 lg:gap-6 overflow-hidden box-border">
        
        <!-- Left Column: Form (3/5 width on desktop) -->
        <div class="lg:col-span-3 space-y-5 overflow-hidden w-full max-w-full min-w-0">
          
          <!-- Contact Info -->
          <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">1</div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">Información de contacto</span>
            </div>

            <form id="checkout-form" class="space-y-4" novalidate>
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Nombre completo</label>
                <input name="name" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Tu nombre completo" />
              </div>

              <div>
                <label class="block text-xs text-gray-500 mb-1.5">WhatsApp</label>
                <input name="whatsapp" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" inputmode="tel" placeholder="+52 312 123 4567" />
              </div>
          </section>

          <!-- Payment & Delivery -->
          <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">2</div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">Pago y entrega</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Método de pago</label>
                <select name="paymentMethod" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30">
                  <option value="">Seleccionar...</option>
                  <option value="Transferencia">💳 Transferencia bancaria</option>
                  <option value="Pago al recoger">💵 Efectivo al recibir</option>
                </select>
              </div>

              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Método de entrega</label>
                <select name="deliveryMethod" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30">
                  <option value="">Seleccionar...</option>
                  <option value="Recoger en tienda">🏪 Recoger en tienda</option>
                  <option value="Envío a domicilio">🚚 Envío a domicilio</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Shipping Address (conditional) -->
          <section id="address-wrap" class="hidden rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">3</div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">Dirección de envío</span>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Calle</label>
                <input name="street" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Ej: Av. Insurgentes Sur" />
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">Núm. exterior</label>
                  <input name="numExt" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="123" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">Núm. interior</label>
                  <input name="numInt" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Opcional" />
                </div>
              </div>
              
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Colonia</label>
                <input name="neighborhood" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Nombre de la colonia" />
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">Ciudad</label>
                  <input name="city" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Colima" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">Código Postal</label>
                  <input name="zipCode" inputmode="numeric" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="28000" />
                </div>
              </div>
              
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Estado</label>
                <input name="state" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Colima" />
              </div>
              
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Referencias para el repartidor</label>
                <textarea
                  name="references"
                  rows="2"
                  class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 resize-none"
                  placeholder="Entre calles, color de casa, referencias..."
                ></textarea>
              </div>
            </div>
          </section>

          <!-- Error message -->
          <div id="form-error" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500"></div>

          <!-- Submit button (mobile only) -->
          <div class="lg:hidden">
            <button
              type="submit"
              form="checkout-form"
              class="flex items-center justify-center gap-2 w-full rounded-xl bg-green-500 hover:bg-green-600 px-4 py-4 text-sm font-semibold text-white transition-colors shadow-lg shadow-green-500/20"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar pedido por WhatsApp
            </button>
          </div>
          </form>
        </div>

        <!-- Right Column: Summary (2/5 width on desktop, sticky) -->
        <div class="lg:col-span-2 mt-6 lg:mt-0 overflow-hidden w-full max-w-full min-w-0">
          <div class="lg:sticky lg:top-24 space-y-4">
            
            <!-- Order Summary -->
            <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
              <div class="text-sm font-medium text-gray-900 dark:text-white mb-4">Resumen del pedido</div>
              
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">${itemCount} productos</span>
                  <span class="text-gray-900 dark:text-white">${formatMoney(subtotal)}</span>
                </div>
                
                <div id="discount-row" class="${coupon ? 'flex' : 'hidden'} justify-between text-brand">
                  <span class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                    <span id="discount-code">${coupon?.code || ''}</span>
                  </span>
                  <span id="discount-amount">-${formatMoney(discount)}</span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Envío</span>
                  <span class="${freeShipping ? 'text-brand font-medium' : 'text-gray-500 dark:text-gray-400'}">${freeShipping ? '¡GRATIS!' : 'Por calcular'}</span>
                </div>
                
                <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <span class="font-semibold text-gray-900 dark:text-white">Total</span>
                  <span id="total-amount" class="text-xl font-bold text-gray-900 dark:text-white">${formatMoney(total)}</span>
                </div>
              </div>
            </section>

            <!-- Coupon -->
            <section id="coupon-section" class="rounded-xl bg-gray-100 dark:bg-gray-900 p-4">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">Cupón de descuento</div>
              <div id="coupon-content">
              ${coupon ? `
                <div class="flex items-center justify-between bg-brand/10 border border-brand/30 rounded-lg p-3">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    <div>
                      <p class="text-sm font-medium text-brand">${coupon.code}</p>
                      <p class="text-xs text-brand/70">${coupon.label}</p>
                    </div>
                  </div>
                  <button id="remove-coupon" class="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">Quitar</button>
                </div>
              ` : `
                <div class="flex gap-2">
                  <input id="coupon-input" type="text" placeholder="Código" class="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none uppercase"/>
                  <button id="apply-coupon" class="px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors">Aplicar</button>
                </div>
                <p id="coupon-error" class="hidden text-xs text-red-500 mt-2"></p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Prueba: <span class="font-medium text-brand">WELCOME10</span>, <span class="font-medium text-brand">VERANO20</span></p>
              `}
              </div>
            </section>

            <!-- Submit button (desktop only) -->
            <button
              type="submit"
              form="checkout-form"
              class="hidden lg:flex items-center justify-center gap-2 w-full rounded-xl bg-green-500 hover:bg-green-600 px-4 py-4 text-sm font-semibold text-white transition-colors shadow-lg shadow-green-500/20"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar pedido por WhatsApp
            </button>

            <!-- Trust badges -->
            <div class="flex justify-center gap-4 py-2">
              <div class="text-center">
                <div class="w-8 h-8 mx-auto mb-1 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <span class="text-[10px] text-gray-500">Seguro</span>
              </div>
              <div class="text-center">
                <div class="w-8 h-8 mx-auto mb-1 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span class="text-[10px] text-gray-500">Rápido</span>
              </div>
              <div class="text-center">
                <div class="w-8 h-8 mx-auto mb-1 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span class="text-[10px] text-gray-500">Sin pago online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    `,
    onMount(root) {
      const form = qs(root, '#checkout-form')
      const addressWrap = qs(root, '#address-wrap')
      const errorBox = qs(root, '#form-error')

      // Coupon handlers - use querySelector directly since these may not exist
      const couponContent = root.querySelector('#coupon-content')
      const discountRow = root.querySelector('#discount-row')
      const discountCode = root.querySelector('#discount-code')
      const discountAmount = root.querySelector('#discount-amount')
      const totalAmount = root.querySelector('#total-amount')

      const updateCouponUI = (appliedCoupon) => {
        const currentSubtotal = cartTotal()
        const currentDiscount = appliedCoupon ? currentSubtotal * (appliedCoupon.discount || 0) : 0
        const currentTotal = currentSubtotal - currentDiscount

        if (appliedCoupon) {
          // Show applied coupon
          couponContent.innerHTML = `
            <div class="flex items-center justify-between bg-brand/10 border border-brand/30 rounded-lg p-3">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <div>
                  <p class="text-sm font-medium text-brand">${appliedCoupon.code}</p>
                  <p class="text-xs text-brand/70">${appliedCoupon.label}</p>
                </div>
              </div>
              <button id="remove-coupon" class="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">Quitar</button>
            </div>
          `
          // Update discount row
          discountRow.classList.remove('hidden')
          discountRow.classList.add('flex')
          discountCode.textContent = appliedCoupon.code
          discountAmount.textContent = '-' + formatMoney(currentDiscount)
          
          const newRemoveBtn = root.querySelector('#remove-coupon')
          if (newRemoveBtn) {
            newRemoveBtn.addEventListener('click', () => {
              removeCoupon(true)
              updateCouponUI(null)
            })
          }
        } else {
          // Show input form
          couponContent.innerHTML = `
            <div class="flex gap-2">
              <input id="coupon-input" type="text" placeholder="Código" class="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none uppercase"/>
              <button id="apply-coupon" class="px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors">Aplicar</button>
            </div>
            <p id="coupon-error" class="hidden text-xs text-red-500 mt-2"></p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Prueba: <span class="font-medium text-brand">WELCOME10</span>, <span class="font-medium text-brand">VERANO20</span></p>
          `
          // Hide discount row
          discountRow.classList.add('hidden')
          discountRow.classList.remove('flex')
          
          // Re-attach apply handlers
          const newApplyBtn = root.querySelector('#apply-coupon')
          const newCouponInput = root.querySelector('#coupon-input')
          const newCouponError = root.querySelector('#coupon-error')
          
          if (newApplyBtn && newCouponInput) {
            newApplyBtn.addEventListener('click', () => {
              const code = newCouponInput.value.trim().toUpperCase()
              if (!code) return
              
              const result = applyCoupon(code, true)
              if (result.success) {
                updateCouponUI(getCoupon())
              } else {
                newCouponError.textContent = result.message || 'Cupón inválido'
                newCouponError.classList.remove('hidden')
              }
            })

            newCouponInput.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                newApplyBtn.click()
              }
            })
          }
        }
        
        // Update total
        totalAmount.textContent = formatMoney(currentTotal)
      }

      // Initial coupon handlers
      const couponInput = root.querySelector('#coupon-input')
      const applyBtn = root.querySelector('#apply-coupon')
      const removeBtn = root.querySelector('#remove-coupon')
      const couponError = root.querySelector('#coupon-error')

      if (applyBtn && couponInput) {
        applyBtn.addEventListener('click', () => {
          const code = couponInput.value.trim().toUpperCase()
          if (!code) return
          
          const result = applyCoupon(code, true)
          if (result.success) {
            updateCouponUI(getCoupon())
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
          removeCoupon(true)
          updateCouponUI(null)
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

        if (!name) return setError('Ingresa tu nombre.')
        if (!whatsapp) return setError('Ingresa tu WhatsApp.')
        if (!paymentMethod) return setError('Selecciona un método de pago.')
        if (!deliveryMethod) return setError('Selecciona un método de entrega.')

        const requireAddress = needsAddress(paymentMethod, deliveryMethod)
        let fullAddress = ''
        
        if (requireAddress) {
          const street = root.querySelector('input[name="street"]')?.value.trim() || ''
          const numExt = root.querySelector('input[name="numExt"]')?.value.trim() || ''
          const numInt = root.querySelector('input[name="numInt"]')?.value.trim() || ''
          const neighborhood = root.querySelector('input[name="neighborhood"]')?.value.trim() || ''
          const city = root.querySelector('input[name="city"]')?.value.trim() || ''
          const zipCode = root.querySelector('input[name="zipCode"]')?.value.trim() || ''
          const stateVal = root.querySelector('input[name="state"]')?.value.trim() || ''
          const references = root.querySelector('textarea[name="references"]')?.value.trim() || ''
          
          if (!street) return setError('Ingresa la calle.')
          if (!numExt) return setError('Ingresa el número exterior.')
          if (!neighborhood) return setError('Ingresa la colonia.')
          if (!city) return setError('Ingresa la ciudad.')
          if (!zipCode) return setError('Ingresa el código postal.')
          if (!stateVal) return setError('Ingresa el estado.')
          
          fullAddress = `${street} #${numExt}${numInt ? ' Int. ' + numInt : ''}, Col. ${neighborhood}, ${city}, ${stateVal}, C.P. ${zipCode}${references ? ' | Ref: ' + references : ''}`
        }

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
            address: requireAddress ? fullAddress : '',
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
