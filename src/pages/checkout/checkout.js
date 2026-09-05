import { getProductById, getState, cartTotal, getCoupon, getDiscountAmount, applyCoupon, removeCoupon, saveOrder, clearCart, addToCart } from '../../store/index.js'
import { BRAND } from '../../utils/config.js'
import { buildOrderMessage, openWhatsAppWithMessage } from '../../utils/whatsapp.js'
import { on, qs } from '../../utils/dom.js'
import { formatMoney } from '../../utils/format.js'
import { checkoutHTML, checkoutSummaryHTML, couponAppliedHTML, couponInputHTML, checkoutSuccessHTML } from './checkoutView.js'
import { sizeSelectionModal } from '../catalog/catalogModals.js'
import { sanitizeText, sanitizeCouponCode } from '../../utils/sanitize.js'
import { navigate } from '../../core/router.js'

const CHECKOUT_SUCCESS_STORAGE_KEY = 'gl_checkout_success'

function persistCheckoutSuccess(payload) {
  try {
    sessionStorage.setItem(CHECKOUT_SUCCESS_STORAGE_KEY, JSON.stringify(payload))
  } catch (_err) {
    // Ignore storage failures; route fallback will still work.
  }
}

function readCheckoutSuccess() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SUCCESS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      name: sanitizeText(String(parsed.name || 'Cliente')) || 'Cliente',
      waUrl: typeof parsed.waUrl === 'string' ? parsed.waUrl : '',
    }
  } catch (_err) {
    return null
  }
}

function clearCheckoutSuccess() {
  try {
    sessionStorage.removeItem(CHECKOUT_SUCCESS_STORAGE_KEY)
  } catch (_err) {
    // Ignore storage failures.
  }
}

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
  // Entering the checkout form should always reset any previous success payload.
  clearCheckoutSuccess()

  const subtotal = cartTotal()
  const coupon = getCoupon()
  const discount = getDiscountAmount()
  const total = subtotal - discount
  const freeShipping = coupon?.freeShipping || subtotal >= BRAND.freeShippingMin
  const itemCount = state.cart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)

  // Create Upsell items (random selection of products not in cart)
  const cartItemIds = new Set(state.cart.map(i => i.productId))
  const eligibleUpsell = state.products.filter(p => p.badge !== 'Borrador' && !cartItemIds.has(p.id) && (isInfiniteStock(p.stock) || Number(p.stock) > 0))
  const upsellProducts = eligibleUpsell.sort(() => 0.5 - Math.random()).slice(0, 3)

  return {
    title: 'Checkout | G&L',
    noPaddingTop: true,
    fullWidth: true,
    forceLight: true,
    html: checkoutHTML({ subtotal, discount, total, freeShipping, itemCount, coupon, upsellProducts }),
    onMount(root) {
      // Body class for custom cursor
      document.body.classList.add('checkout')

      // Reveal on scroll
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') })
      }, { threshold: 0.1 })
      root.querySelectorAll('.reveal').forEach(el => io.observe(el))

      // Cursor bindings
      const bindCursor = () => {
        root.querySelectorAll('a, button, [data-cursor-hover], summary, .choice').forEach(el => {
          el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'))
          el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'))
        })
        root.querySelectorAll('input, textarea, select').forEach(el => {
          el.addEventListener('mouseenter', () => document.body.classList.add('cursor-text'))
          el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-text'))
        })
      }
      bindCursor()

      // Choice card groups — sync to hidden selects
      const valMap = { transferencia: 'Transferencia', recoger: 'Pago al recoger', envio: 'Envío a domicilio', tienda: 'Recoger en tienda' }
      const setupGroup = (id, selectName) => {
        const wrap = root.querySelector('#' + id)
        const sel = root.querySelector(`select[name="${selectName}"]`)
        if (!wrap || !sel) return
        wrap.addEventListener('click', (e) => {
          const c = e.target.closest('.choice')
          if (!c) return
          wrap.querySelectorAll('.choice').forEach(x => x.classList.remove('active'))
          c.classList.add('active')
          sel.value = valMap[c.dataset.val] || ''
          sel.dispatchEvent(new Event('change', { bubbles: true }))

          if (id === 'dlv-group') {
            const addr = root.querySelector('#address-wrap')
            if (addr) {
              if (c.dataset.val === 'tienda') {
                addr.style.opacity = '.45'
                addr.style.pointerEvents = 'none'
              } else {
                addr.style.opacity = '1'
                addr.style.pointerEvents = 'auto'
              }
            }
          }
        })
      }
      setupGroup('pay-group', 'paymentMethod')
      setupGroup('dlv-group', 'deliveryMethod')
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
                refreshSummaryView()
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
            refreshSummaryView()
          })
        }
      }

      const refreshSummaryView = () => {
        // Recalculate totals
        const currentSubtotal = cartTotal()
        const currentCoupon = getCoupon()
        const currentDiscount = getDiscountAmount(currentCoupon)
        const currentTotal = currentSubtotal - currentDiscount
        const currentFreeShip = currentCoupon?.freeShipping || currentSubtotal >= BRAND.freeShippingMin
        const liveCart = getState().cart
        const currentItemCount = liveCart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)

        // Find the wrapper and replace HTML
        const wrapper = root.querySelector('#checkout-summary-column')
        if (wrapper) {
          wrapper.innerHTML = checkoutSummaryHTML({ 
            subtotal: currentSubtotal, 
            discount: currentDiscount, 
            total: currentTotal, 
            freeShipping: currentFreeShip, 
            itemCount: currentItemCount, 
            coupon: currentCoupon, 
            upsellProducts 
          })
          
          attachCouponHandlers()
          attachUpsellHandlers()
          bindCursor()
        }
      }

      const attachUpsellHandlers = () => {
        root.querySelectorAll('[data-upsell-id]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault()
            const productId = btn.dataset.upsellId
            const product = getProductById(productId)
            if (!product) return

            // Create a temporary modal container if none exists, or use the body
            let modalContainer = document.getElementById('modal-container')
            if (!modalContainer) {
              modalContainer = document.createElement('div')
              modalContainer.id = 'modal-container'
              document.body.appendChild(modalContainer)
            }

            modalContainer.innerHTML = sizeSelectionModal(product)

            const closeModal = () => { modalContainer.innerHTML = '' }

            const closeBtn = modalContainer.querySelector('#close-quick-add')
            if (closeBtn) closeBtn.addEventListener('click', closeModal)

            const modalEl = modalContainer.querySelector('#quick-add-modal')
            if (modalEl) {
              modalEl.addEventListener('click', (ev) => {
                if (ev.target.id === 'quick-add-modal') closeModal()
              })
            }

            const sizeButtons = modalContainer.querySelectorAll('.size-select-btn')
            sizeButtons.forEach(sizeBtn => {
              sizeBtn.addEventListener('click', (ev) => {
                ev.preventDefault()
                ev.stopPropagation()
                const size = sizeBtn.dataset.size
                addToCart({ productId, size, color: '', qty: 1 })
                closeModal()
                
                // Hide from upsell list smoothly and update summary
                const itemDiv = btn.closest('.flex.items-center.gap-3')
                if (itemDiv) itemDiv.style.display = 'none'
                
                refreshSummaryView()
                
                // Limpiar el aviso si había error de "Carrito vacío"
                setError('')
              })
            })
          })
        })
      }

      // Initial handler attachment
      attachCouponHandlers()
      attachUpsellHandlers()

      // ── Address section show/hide ──
      const refreshConditional = () => {
        const payment = qs(root, 'select[name="paymentMethod"]').value
        const delivery = qs(root, 'select[name="deliveryMethod"]').value
        const show = needsAddress(payment, delivery)
        addressWrap.style.opacity = show ? '1' : '.45'
        addressWrap.style.pointerEvents = show ? 'auto' : 'none'
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
        const liveCart = getState().cart
        if (!liveCart.length) {
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
        const cartLines = liveCart
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
        const currentDiscount = getDiscountAmount(appliedCoupon)
        const currentTotal    = currentSubtotal - currentDiscount

        const message = buildOrderMessage({
          customer: { name, whatsapp, paymentMethod, deliveryMethod, address: requireAddress ? fullAddress : '' },
          cartLines,
          subtotal: currentSubtotal,
          discount: currentDiscount,
          couponCode: appliedCoupon?.code || null,
          total: currentTotal,
        })

        // Solo QUE se compra; los precios y el total los calcula place_order en
        // la base. Aca va el productId real siempre: es la llave para releer el
        // precio (el nulo de stock infinito lo pone la funcion al guardar).
        const orderData = {
          name,
          whatsapp,
          paymentMethod,
          deliveryMethod,
          address: requireAddress ? fullAddress : null,
          couponCode: appliedCoupon?.code || null,
          items: liveCart.map(i => ({
            productId: i.productId,
            size: i.size,
            color: i.color,
            qty: Number(i.qty) || 0,
          })),
        }

        setSubmitting(true)
        
        saveOrder(orderData).then(({ error }) => {
          if (error) {
            // place_order devuelve mensajes en claro (carrito vacio, limite de
            // pedidos, producto no disponible); si no, un texto generico.
            setError(error.message || 'No se pudo registrar tu pedido. Intenta de nuevo por favor.')
            setSubmitting(false)
            return
          }

          let waUrl = ''
          try {
            waUrl = openWhatsAppWithMessage(message)
          } catch (err) {
            console.error('WhatsApp failed to open', err)
          }

          persistCheckoutSuccess({ name, waUrl })
          navigate('/checkout/success')
          clearCart()
        }).catch(err => {
          setError('Ocurrió un error inesperado al conectar con el servidor.')
          setSubmitting(false)
        })
      })

      // Cleanup: remove body class on unmount
      return () => {
        document.body.classList.remove('checkout', 'cursor-hover', 'cursor-text')
        io.disconnect()
      }
    },
  }
}

export function pageCheckoutSuccess() {
  const successData = readCheckoutSuccess()
  if (!successData) {
    return {
      title: 'Checkout | G&L',
      noPaddingTop: true,
      fullWidth: true,
      forceLight: true,
      html: checkoutHTML({ subtotal: 0, discount: 0, total: 0, freeShipping: false, itemCount: 0, coupon: null }),
      onMount() {
        navigate('/checkout')
      },
    }
  }

  return {
    title: 'Pedido Confirmado | G&L',
    noPaddingTop: true,
    fullWidth: true,
    forceLight: true,
    html: checkoutSuccessHTML(successData),
    onMount() {
      clearCheckoutSuccess()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
  }
}
