import { getProductById, cartTotal, getCoupon, applyCoupon, removeCoupon } from '../app/store.js'
import { BRAND } from '../app/config.js'
import { buildOrderMessage, openWhatsAppWithMessage } from '../app/whatsapp.js'
import { on, qs } from '../app/dom.js'
import { formatMoney } from '../app/format.js'
import { checkoutHTML, couponAppliedHTML, couponInputHTML } from './checkoutView.js'

function needsAddress(_payment, deliveryMethod) {
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
    html: checkoutHTML({ subtotal, discount, total, freeShipping, itemCount, coupon }),
    onMount(root) {
      const form = qs(root, '#checkout-form')
      const addressWrap = qs(root, '#address-wrap')
      const errorBox = qs(root, '#form-error')
      const couponContent = root.querySelector('#coupon-content')
      const discountRow = root.querySelector('#discount-row')
      const discountCode = root.querySelector('#discount-code')
      const discountAmount = root.querySelector('#discount-amount')
      const totalAmount = root.querySelector('#total-amount')

      // ── Coupon UI ──
      const attachCouponHandlers = () => {
        const applyBtn = root.querySelector('#apply-coupon')
        const couponInput = root.querySelector('#coupon-input')
        const couponError = root.querySelector('#coupon-error')
        const removeBtn = root.querySelector('#remove-coupon')

        if (applyBtn && couponInput) {
          const doApply = () => {
            const code = couponInput.value.trim().toUpperCase()
            if (!code) return
            const result = applyCoupon(code, true)
            if (result.success) {
              updateCouponUI(getCoupon())
            } else {
              if (couponError) {
                couponError.textContent = result.message || 'Cupón inválido'
                couponError.classList.remove('hidden')
              }
            }
          }
          applyBtn.addEventListener('click', doApply)
          couponInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); doApply() } })
        }

        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            removeCoupon(true)
            updateCouponUI(null)
          })
        }
      }

      const updateCouponUI = (appliedCoupon) => {
        const currentSubtotal = cartTotal()
        const currentDiscount = appliedCoupon ? currentSubtotal * (appliedCoupon.discount || 0) : 0
        const currentTotal = currentSubtotal - currentDiscount

        if (appliedCoupon) {
          couponContent.innerHTML = couponAppliedHTML(appliedCoupon)
          discountRow.classList.remove('hidden')
          discountRow.classList.add('flex')
          discountCode.textContent = appliedCoupon.code
          discountAmount.textContent = '-' + formatMoney(currentDiscount)
        } else {
          couponContent.innerHTML = couponInputHTML()
          discountRow.classList.add('hidden')
          discountRow.classList.remove('flex')
        }

        totalAmount.textContent = formatMoney(currentTotal)
        attachCouponHandlers()
      }

      // Initial handler attachment
      attachCouponHandlers()

      // ── Address section show/hide ──
      const refreshConditional = () => {
        const payment = qs(root, 'select[name="paymentMethod"]').value
        const delivery = qs(root, 'select[name="deliveryMethod"]').value
        addressWrap.classList.toggle('hidden', !needsAddress(payment, delivery))
      }

      const setError = (msg) => {
        if (!msg) { errorBox.classList.add('hidden'); errorBox.textContent = ''; return }
        errorBox.textContent = msg
        errorBox.classList.remove('hidden')
      }

      refreshConditional()
      on(root, 'change', 'select[name="paymentMethod"],select[name="deliveryMethod"]', () => {
        setError('')
        refreshConditional()
      })

      // ── Form Submit ──
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
            return { name: p.name, type: p.type, size: i.size, color: i.color, qty, price, subtotal: qty * price }
          })
          .filter(Boolean)

        const currentSubtotal = cartTotal()
        const appliedCoupon = getCoupon()
        const currentDiscount = appliedCoupon ? currentSubtotal * (appliedCoupon.discount || 0) : 0
        const currentTotal = currentSubtotal - currentDiscount

        const message = buildOrderMessage({
          customer: { name, whatsapp, paymentMethod, deliveryMethod, address: requireAddress ? fullAddress : '' },
          cartLines,
          subtotal: currentSubtotal,
          discount: currentDiscount,
          couponCode: appliedCoupon?.code || null,
          total: currentTotal,
        })

        openWhatsAppWithMessage(message)
      })
    },
  }
}
