import { getProductById, cartTotal, getCoupon, applyCoupon, removeCoupon, saveOrder, clearCart } from '../app/store.js'
import { BRAND } from '../app/config.js'
import { buildOrderMessage, openWhatsAppWithMessage } from '../app/whatsapp.js'
import { on, qs } from '../app/dom.js'
import { formatMoney } from '../app/format.js'
import { checkoutHTML, couponAppliedHTML, couponInputHTML, checkoutSuccessHTML } from './checkoutView.js'
import { sanitizeText, sanitizeCouponCode } from '../app/sanitize.js'

// ── Helpers de validación ──
const WHATSAPP_RE = /^[+]?[0-9\s\-().]{7,20}$/
const ZIPCODE_RE  = /^[0-9]{4,6}$/

function isInfiniteStock(stock) {
  return stock === null || stock === undefined || stock === '' || stock === '∞'
}

function setFieldError(field, hasError) {
  if (!field) return
  if (hasError) {
    field.classList.add('!border-red-500', '!ring-red-500/30', '!ring-1')
  } else {
    field.classList.remove('!border-red-500', '!ring-red-500/30', '!ring-1')
  }
}

function clearFieldErrors(root) {
  root.querySelectorAll('.\\!border-red-500').forEach(el => {
    el.classList.remove('!border-red-500', '!ring-red-500/30', '!ring-1')
  })
}

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
            const code = sanitizeCouponCode(couponInput.value)
            if (!code) {
              if (couponError) {
                couponError.textContent = 'Ingresa un código de cupón.'
                couponError.classList.remove('hidden')
              }
              return
            }
            applyCoupon(code, true).then(result => {
              if (result.success) {
                if (couponError) couponError.classList.add('hidden')
                updateCouponUI(getCoupon())
              } else {
                if (couponError) {
                  couponError.textContent = result.error || 'Cupón inválido'
                  couponError.classList.remove('hidden')
                }
              }
            })
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

      const setError = (msg, fieldEl = null) => {
        if (!msg) {
          errorBox.classList.add('hidden')
          errorBox.textContent = ''
          return
        }
        errorBox.textContent = msg
        errorBox.classList.remove('hidden')
        // Resaltar campo con error
        if (fieldEl) setFieldError(fieldEl, true)
        // Scroll suave al cuadro de error
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      refreshConditional()
      on(root, 'change', 'select[name="paymentMethod"],select[name="deliveryMethod"]', () => {
        setError('')
        clearFieldErrors(root)
        refreshConditional()
      })

      // Limpiar error de campo al escribir
      form.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          setFieldError(e.target, false)
        }
      })

      // ── Form Submit ──
      const submitBtns = root.querySelectorAll('button[type="submit"]')

      const setSubmitting = (loading) => {
        submitBtns.forEach(btn => {
          btn.disabled = loading
          btn.dataset.original = btn.dataset.original || btn.innerHTML
          if (loading) {
            btn.innerHTML = `<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg> Enviando...`
            btn.classList.add('opacity-70', 'cursor-not-allowed')
          } else {
            btn.innerHTML = btn.dataset.original
            btn.classList.remove('opacity-70', 'cursor-not-allowed')
          }
        })
      }

      form.addEventListener('submit', (ev) => {
        ev.preventDefault()
        setError('')
        clearFieldErrors(root)

        // ── Carrito vacío ──
        if (!state.cart.length) {
          setError('Tu carrito está vacío. Volvé al catálogo para agregar productos.')
          return
        }

        const nameEl      = qs(root, 'input[name="name"]')
        const whatsappEl  = qs(root, 'input[name="whatsapp"]')
        const paymentEl   = qs(root, 'select[name="paymentMethod"]')
        const deliveryEl  = qs(root, 'select[name="deliveryMethod"]')

        const name           = sanitizeText(nameEl.value)
        const whatsapp       = whatsappEl.value.trim()
        const paymentMethod  = paymentEl.value
        const deliveryMethod = deliveryEl.value

        // ── Validaciones de contacto ──
        if (!name) return setError('Ingresa tu nombre completo.', nameEl)
        if (name.length < 3) return setError('El nombre debe tener al menos 3 caracteres.', nameEl)

        if (!whatsapp) return setError('Ingresa tu número de WhatsApp.', whatsappEl)
        if (!WHATSAPP_RE.test(whatsapp)) return setError('El número de WhatsApp no parece válido. Ej: +52 312 123 4567.', whatsappEl)

        if (!paymentMethod) return setError('Selecciona un método de pago.', paymentEl)
        if (!deliveryMethod) return setError('Selecciona un método de entrega.', deliveryEl)

        // ── Validaciones de dirección ──
        const requireAddress = needsAddress(paymentMethod, deliveryMethod)
        let fullAddress = ''

        if (requireAddress) {
          const streetEl       = root.querySelector('input[name="street"]')
          const numExtEl       = root.querySelector('input[name="numExt"]')
          const numIntEl       = root.querySelector('input[name="numInt"]')
          const neighborhoodEl = root.querySelector('input[name="neighborhood"]')
          const cityEl         = root.querySelector('input[name="city"]')
          const zipCodeEl      = root.querySelector('input[name="zipCode"]')
          const stateEl        = root.querySelector('input[name="state"]')
          const referencesEl   = root.querySelector('textarea[name="references"]')

          const street       = sanitizeText(streetEl?.value)       || ''
          const numExt       = sanitizeText(numExtEl?.value)       || ''
          const numInt       = sanitizeText(numIntEl?.value)       || ''
          const neighborhood = sanitizeText(neighborhoodEl?.value) || ''
          const city         = sanitizeText(cityEl?.value)         || ''
          const zipCode      = (zipCodeEl?.value || '').trim()     || ''
          const stateVal     = sanitizeText(stateEl?.value)        || ''
          const references   = sanitizeText(referencesEl?.value)  || ''

          if (!street)                              return setError('Ingresa la calle.', streetEl)
          if (!numExt)                              return setError('Ingresa el número exterior.', numExtEl)
          if (!neighborhood)                        return setError('Ingresa la colonia / asentamiento.', neighborhoodEl)
          if (!city)                                return setError('Ingresa la ciudad.', cityEl)
          if (!zipCode)                             return setError('Ingresa el código postal.', zipCodeEl)
          if (!ZIPCODE_RE.test(zipCode))            return setError('El código postal debe ser de 4 a 6 dígitos numéricos.', zipCodeEl)
          if (!stateVal)                            return setError('Ingresa el estado.', stateEl)

          fullAddress = `${street} #${numExt}${numInt ? ' Int. ' + numInt : ''}, Col. ${neighborhood}, ${city}, ${stateVal}, C.P. ${zipCode}${references ? ' | Ref: ' + references : ''}`
        }

        // ── Construir y enviar el pedido ──
        const cartLines = state.cart
          .map((i) => {
            const p = getProductById(i.productId)
            if (!p) return null
            const qty = Number(i.qty) || 0
            const price = Number(p.price) || 0
            const hasInfiniteStock = isInfiniteStock(p.stock)
            return { 
              // For unlimited inventory, omit productId so stock triggers can safely skip decrement.
              productId: hasInfiniteStock ? null : i.productId,
              stock_unlimited: hasInfiniteStock,
              name: p.name, 
              type: p.type, 
              size: i.size, 
              color: i.color, 
              qty, 
              price, 
              subtotal: qty * price 
            }
          })
          .filter(Boolean)

        if (!cartLines.length) {
          setError('Algunos productos de tu carrito ya no están disponibles. Volvé al catálogo.')
          return
        }

        const currentSubtotal = cartTotal()
        const appliedCoupon   = getCoupon()
        const currentDiscount = appliedCoupon ? currentSubtotal * (appliedCoupon.discount || 0) : 0
        const currentTotal    = currentSubtotal - currentDiscount

        const message = buildOrderMessage({
          customer: { name, whatsapp, paymentMethod, deliveryMethod, address: requireAddress ? fullAddress : '' },
          cartLines,
          subtotal: currentSubtotal,
          discount: currentDiscount,
          couponCode: appliedCoupon?.code || null,
          total: currentTotal,
        })

        const orderData = {
          customer_name: name,
          customer_whatsapp: whatsapp,
          payment_method: paymentMethod,
          delivery_method: deliveryMethod,
          address: requireAddress ? fullAddress : null,
          cart_items: cartLines,
          subtotal: currentSubtotal,
          discount: currentDiscount,
          coupon_code: appliedCoupon?.code || null,
          total: currentTotal,
          status: 'pendientedepago'
        }

        setSubmitting(true)
        
        saveOrder(orderData).then(({ error }) => {
          if (error) {
            setError('No se pudo registrar tu pedido. Intenta de nuevo por favor.')
            setSubmitting(false)
            return
          }

          let waUrl = ''
          try {
            waUrl = openWhatsAppWithMessage(message)
          } catch (err) {
            console.error('WhatsApp failed to open', err)
          }

          clearCart()
          root.innerHTML = checkoutSuccessHTML({ name, waUrl })
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }).catch(err => {
          setError('Ocurrió un error inesperado al conectar con el servidor.')
          setSubmitting(false)
        })
      })
    },
  }
}
