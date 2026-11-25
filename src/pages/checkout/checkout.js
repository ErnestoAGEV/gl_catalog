import { getProductById, getState, cartTotal, getCoupon, getDiscountAmount, applyCoupon, removeCoupon, saveOrder, clearCart, addToCart, quoteShipping, refreshPromotions, refreshProducts, subscribe } from '../../store/index.js'
import { isValidWhatsapp } from '../../utils/phone.js'
import { BRAND } from '../../utils/config.js'
import { buildOrderMessage, openWhatsAppWithMessage } from '../../utils/whatsapp.js'
import { on, qs } from '../../utils/dom.js'
import { formatMoney } from '../../utils/format.js'
import { isInfiniteStock } from '../../utils/stock.js'
import { checkoutHTML, checkoutSummaryHTML, couponAppliedHTML, couponInputHTML, checkoutSuccessHTML, shippingBlockHTML, carrierName, TIER_NAMES } from './checkoutView.js'
import { chargeFor, isFreeShipping, isMxZip, cartKey, MX_STATES } from '../../../supabase/functions/_shared/shipping.js'
import { sizeSelectionModal, trapModal } from '../catalog/catalogModals.js'
import { sanitizeText, sanitizeCouponCode, sanitizeEmail } from '../../utils/sanitize.js'
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
const ZIPCODE_RE  = /^[0-9]{4,6}$/
const ENVIO = 'Envío a domicilio'
const QUOTE_WAIT_MS = 8000


function nameError(value) {
  const name = sanitizeText(value)
  if (!name) return 'Ingresa tu nombre completo.'
  if (name.length < 3) return 'El nombre debe tener al menos 3 caracteres.'
  return ''
}

function emailError(value) {
  if (!String(value || '').trim()) return 'Ingresa tu correo.'
  if (!sanitizeEmail(value).valid) return 'El correo no es válido. Ejemplo: tucorreo@gmail.com'
  return ''
}

function whatsappError(value) {
  if (!String(value || '').trim()) return 'Ingresa tu número de WhatsApp.'
  if (!isValidWhatsapp(value)) return 'Ingresa tu WhatsApp con lada. Ejemplo: 312 123 4567 o +1 619 555 1234.'
  return ''
}

// El mensaje va en el <p id="<campo>-error"> bajo el input, ligado por aria-describedby
function setFieldError(field, message) {
  if (!field) return
  const msgEl = field.id ? document.getElementById(`${field.id}-error`) : null
  if (message) {
    field.classList.add('!border-red-500', '!ring-red-500/30', '!ring-1')
    field.setAttribute('aria-invalid', 'true')
    if (msgEl) {
      msgEl.textContent = typeof message === 'string' ? message : ''
      field.setAttribute('aria-describedby', msgEl.id)
    }
  } else {
    field.classList.remove('!border-red-500', '!ring-red-500/30', '!ring-1')
    field.removeAttribute('aria-invalid')
    field.removeAttribute('aria-describedby')
    if (msgEl) msgEl.textContent = ''
  }
}

function clearFieldErrors(root) {
  root.querySelectorAll('[aria-invalid="true"], .\\!border-red-500').forEach(el => setFieldError(el, ''))
}

function needsAddress(_payment, deliveryMethod) {
  return deliveryMethod === ENVIO
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
      // Total que el cliente tiene a la vista: es el que se manda como expectedTotal.
      // Si una promo cambia los precios con la pagina abierta, no se envia otro sin avisar.
      let shownTotal = total
      // Total de la base cuando aun asi no cuadra (p. ej. reloj del equipo desfasado)
      let serverTotal = null
      // Cotizacion de envio: idle | quoting | ready | fallback. `key` = CP|estado|carrito cotizado;
      // `seq` descarta respuestas viejas; `pending` es la peticion en vuelo.
      let quoteErrors = 0 // errores de cotizacion seguidos al enviar
      const ship = { status: 'idle', quote: null, tier: 'standard', key: '', seq: 0, timer: 0, pending: null }
      // Reveal on scroll
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') })
      }, { threshold: 0.1 })
      root.querySelectorAll('.reveal').forEach(el => io.observe(el))

      // Choice card groups — sync to hidden selects
      const valMap = { transferencia: 'Transferencia', recoger: 'Pago al recoger', envio: 'Envío a domicilio', tienda: 'Recoger en tienda' }
      const setupGroup = (id, selectName) => {
        const wrap = root.querySelector('#' + id)
        const sel = root.querySelector(`select[name="${selectName}"]`)
        if (!wrap || !sel) return
        const choices = [...wrap.querySelectorAll('.choice')]
        // Radiogroup: flechas mueven foco y seleccion, como un radio nativo
        wrap.addEventListener('keydown', (e) => {
          const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
          if (!step) return
          e.preventDefault()
          const next = choices[(choices.indexOf(document.activeElement) + step + choices.length) % choices.length]
          next.focus()
          next.click()
        })
        wrap.addEventListener('click', (e) => {
          const c = e.target.closest('.choice')
          if (!c) return
          choices.forEach(x => {
            const on = x === c
            x.classList.toggle('active', on)
            x.setAttribute('aria-checked', String(on))
            x.tabIndex = on ? 0 : -1
          })
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
      // Pagar al recoger solo tiene sentido recogiendo: marca la tienda sola.
      // Y si elige envio a domicilio, el pago vuelve a transferencia.
      root.querySelector('#pay-group')?.addEventListener('click', (e) => {
        if (e.target.closest('.choice')?.dataset.val === 'recoger') root.querySelector('#dlv-group [data-val="tienda"]:not(.active)')?.click()
      })
      root.querySelector('#dlv-group')?.addEventListener('click', (e) => {
        if (e.target.closest('.choice')?.dataset.val === 'envio') root.querySelector('#pay-group [data-val="transferencia"]:not(.active)')?.click()
      })
      // El resumen arranca plegado en celular: el formulario queda a la vista
      const narrow = window.matchMedia('(max-width: 1023px)')
      if (narrow.matches) root.querySelector('#co-summary')?.removeAttribute('open')
      // En escritorio no hay boton para abrirlo: si la pantalla crece, se abre
      narrow.addEventListener('change', (e) => { if (!e.matches) root.querySelector('#co-summary')?.setAttribute('open', '') })
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

      // ── Envio: cotizacion Estandar/Express ──
      const field = (name) => root.querySelector(`[name="${name}"]`)
      const deliveryNow = () => qs(root, 'select[name="deliveryMethod"]').value
      const cartItems = () => getState().cart.map(i => ({ productId: i.productId, qty: Number(i.qty) || 0 }))
      // Datos que definen la cotizacion; key '' si aun no alcanzan
      const quoteInputs = () => {
        const zip = (field('zipCode')?.value || '').trim()
        const state = field('state')?.value || ''
        const city = sanitizeText(field('city')?.value) || ''
        const items = cartItems()
        const ok = isMxZip(zip) && MX_STATES.some(s => s.code === state) && city && items.length
        return { zip, state, city, items, key: ok ? `${zip}|${state}|${cartKey(items)}` : '' }
      }
      // Cotizacion vigente: lista, para el CP/estado/carrito de hoy y con envio a domicilio
      const activeQuote = () => ship.status === 'ready' && deliveryNow() === ENVIO && ship.key === quoteInputs().key ? ship.quote : null
      const shipFreeMin = (q) => q.freeShippingMin ?? BRAND.freeShippingMin
      const shipCharge = (subtotal, coupon, tier = ship.tier) => {
        const q = activeQuote()
        return q ? chargeFor(q, tier, isFreeShipping(subtotal, coupon, shipFreeMin(q))) : 0
      }
      const renderShip = () => {
        const block = root.querySelector('#ship-block')
        if (!block) return
        const q = activeQuote()
        const subtotal = cartTotal()
        const coupon = getCoupon()
        const prices = q ? { standard: shipCharge(subtotal, coupon, 'standard'), express: q.express ? shipCharge(subtotal, coupon, 'express') : 0 } : null
        block.innerHTML = deliveryNow() === ENVIO ? shippingBlockHTML({ status: ship.status, quote: q, tier: ship.tier, prices }) : ''
      }
      const resetShip = (status = 'idle') => { ship.seq++; ship.status = status; ship.quote = null; ship.key = ''; ship.pending = null }
      const runQuote = () => {
        ship.timer = 0
        if (deliveryNow() !== ENVIO) return
        const { state, city, items, key, zip } = quoteInputs()
        // Fuera de Mexico o CP que no es de 5 digitos: no hay a quien cotizar, se confirma por WhatsApp
        if (state === 'otro' || (zip.length >= 4 && !isMxZip(zip))) {
          if (ship.status !== 'fallback') { resetShip('fallback'); renderShip(); refreshSummaryView({ keepShip: true }) }
          return
        }
        if (!key) {
          if (ship.status !== 'idle') { resetShip(); renderShip(); refreshSummaryView({ keepShip: true }) }
          return
        }
        if (key === ship.key && ship.status !== 'idle') return
        const seq = ++ship.seq
        ship.status = 'quoting'
        ship.quote = null
        ship.key = key
        renderShip()
        refreshSummaryView({ keepShip: true })
        ship.pending = quoteShipping({ zipCode: zip, state, city, items }).then((res) => {
          if (seq !== ship.seq) return
          ship.pending = null
          ship.status = res.fallback ? 'fallback' : 'ready'
          ship.quote = res.fallback ? null : res
          if (ship.tier === 'express' && !ship.quote?.express) ship.tier = 'standard'
          renderShip()
          refreshSummaryView({ keepShip: true })
        })
      }
      const scheduleQuote = () => {
        clearTimeout(ship.timer)
        ship.timer = setTimeout(runQuote, 400)
      }
      // Antes de enviar: lo que este por cotizarse se cotiza ya, y se espera la respuesta (tope 8 s)
      const settleShipping = async () => {
        clearTimeout(ship.timer)
        runQuote() // sin cambios en CP/estado/carrito no hace nada (Enter en la ciudad cae aqui)
        if (!ship.pending) return
        let timedOut = false
        await Promise.race([ship.pending, new Promise(r => setTimeout(() => { timedOut = true; r() }, QUOTE_WAIT_MS))])
        if (timedOut && ship.status === 'quoting') { resetShip('fallback'); renderShip(); refreshSummaryView({ keepShip: true }) }
      }

      const refreshSummaryView = ({ keepShip = false } = {}) => {
        // Recalculate totals
        const currentSubtotal = cartTotal()
        const currentCoupon = getCoupon()
        const currentDiscount = getDiscountAmount(currentCoupon)
        const currentCharge = shipCharge(currentSubtotal, currentCoupon)
        const currentTotal = currentSubtotal - currentDiscount + currentCharge
        shownTotal = currentTotal
        serverTotal = null
        const currentFreeShip = currentCoupon?.freeShipping || currentSubtotal >= BRAND.freeShippingMin
        const shipLabel = ship.status === 'quoting' && deliveryNow() === ENVIO ? 'Calculando…'
          : activeQuote() ? (currentCharge > 0 ? formatMoney(currentCharge) : 'Gratis')
          : currentFreeShip && ship.status !== 'fallback' ? 'Gratis' : 'Te lo confirmamos por WhatsApp'
        if (!keepShip) renderShip()
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
            shipLabel,
            upsellProducts 
          })
          
          attachCouponHandlers()
          attachUpsellHandlers()
        }
        // La linea plegada del celular vive fuera del wrapper: se actualiza aparte
        const sumTotal = root.querySelector('#co-summary-total')
        if (sumTotal) sumTotal.textContent = formatMoney(currentTotal)
        const sumCount = root.querySelector('#co-summary-count')
        if (sumCount) sumCount.textContent = `Tu pedido · ${currentItemCount} ${currentItemCount === 1 ? 'pieza' : 'piezas'}`
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

            let release = null
            const closeModal = () => {
              modalContainer.innerHTML = ''
              release?.()
            }
            release = trapModal(modalContainer, closeModal)

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
        // Atenuada tambien para teclado y lector de pantalla
        addressWrap.inert = !show
      }

      const setError = (msg, fieldEl = null, { scroll = true } = {}) => {
        if (!msg) {
          errorBox.classList.add('hidden')
          errorBox.textContent = ''
          return
        }
        errorBox.textContent = msg
        errorBox.classList.remove('hidden')
        // Resaltar campo con error
        if (fieldEl) setFieldError(fieldEl, msg)
        // Scroll suave al cuadro de error
        if (scroll) errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      refreshConditional()
      on(root, 'change', 'select[name="paymentMethod"],select[name="deliveryMethod"]', () => {
        setError('')
        clearFieldErrors(root)
        refreshConditional()
        refreshSummaryView()
        scheduleQuote()
      })

      // Estado en lista; "otro" abre el campo libre
      on(root, 'change', 'select[name="state"]', (_e, sel) => {
        setFieldError(sel, '')
        root.querySelector('#state-other-wrap').classList.toggle('hidden', sel.value !== 'otro')
        scheduleQuote()
      })
      on(root, 'input', 'input[name="zipCode"]', scheduleQuote)
      // La ciudad solo hace falta para cotizar; se revisa al salir del campo, no en cada letra
      on(root, 'focusout', 'input[name="city"]', scheduleQuote)
      on(root, 'change', 'input[name="shipTier"]', (_e, radio) => {
        ship.tier = radio.value
        refreshSummaryView({ keepShip: true })
      })
      scheduleQuote()

      // Limpiar error de campo al escribir
      form.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          setFieldError(e.target, '')
        }
      })

      // Validacion al salir del campo, no solo al enviar
      const blurChecks = { name: nameError, whatsapp: whatsappError, email: emailError }
      form.addEventListener('focusout', (e) => {
        const check = blurChecks[e.target.name]
        if (check) setFieldError(e.target, check(e.target.value))
      })

      // WELCOME10 es de primera compra: si place_order lo rechaza al enviar, se
      // quita el cupon y se explica
      const firstPurchaseMsg = (code) => `${code} es válido solo en la primera compra y este WhatsApp o correo ya lo utilizó. Retiramos el cupón y actualizamos tu total.`
      const dropFirstPurchaseCoupon = (code, opts) => {
        // Silencioso, como el boton de quitar: un emit repintaria la vista y el aviso se perderia
        removeCoupon(true)
        refreshSummaryView()
        setError(firstPurchaseMsg(code), null, opts)
      }
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

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault()
        setError('')
        clearFieldErrors(root)

        // ── Carrito vacío ──
        const liveCart = getState().cart
        if (!liveCart.length) {
          setError('Tu bolsa está vacía. Vuelve al catálogo para agregar productos.')
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
        const nameMsg = nameError(nameEl.value)
        if (nameMsg) return setError(nameMsg, nameEl)

        const whatsappMsg = whatsappError(whatsapp)
        if (whatsappMsg) return setError(whatsappMsg, whatsappEl)

        if (!paymentMethod) return setError('Selecciona un método de pago.', paymentEl)
        if (!deliveryMethod) return setError('Selecciona un método de entrega.', deliveryEl)

        // ── Validaciones de dirección ──
        const requireAddress = needsAddress(paymentMethod, deliveryMethod)
        let fullAddress = ''
        let email = ''
        let addressParts = null

        if (requireAddress) {
          const emailEl = root.querySelector('input[name="email"]')
          const emailMsg = emailError(emailEl?.value)
          if (emailMsg) return setError(emailMsg, emailEl)
          email = sanitizeEmail(emailEl.value).value

          const streetEl       = root.querySelector('input[name="street"]')
          const numExtEl       = root.querySelector('input[name="numExt"]')
          const numIntEl       = root.querySelector('input[name="numInt"]')
          const neighborhoodEl = root.querySelector('input[name="neighborhood"]')
          const cityEl         = root.querySelector('input[name="city"]')
          const zipCodeEl      = root.querySelector('input[name="zipCode"]')
          const stateEl        = root.querySelector('select[name="state"]')
          const stateOtherEl   = root.querySelector('input[name="stateOther"]')
          const referencesEl   = root.querySelector('textarea[name="references"]')

          const street       = sanitizeText(streetEl?.value)       || ''
          const numExt       = sanitizeText(numExtEl?.value)       || ''
          const numInt       = sanitizeText(numIntEl?.value)       || ''
          const neighborhood = sanitizeText(neighborhoodEl?.value) || ''
          const city         = sanitizeText(cityEl?.value)         || ''
          const zipCode      = (zipCodeEl?.value || '').trim()     || ''
          const stateSel     = stateEl?.value || ''
          const stateName    = stateSel === 'otro' ? (sanitizeText(stateOtherEl?.value) || '') : (MX_STATES.find(s => s.code === stateSel)?.name || '')
          const references   = sanitizeText(referencesEl?.value)  || ''

          if (!street)                              return setError('Ingresa la calle.', streetEl)
          if (!numExt)                              return setError('Ingresa el número exterior.', numExtEl)
          if (!neighborhood)                        return setError('Ingresa la colonia / asentamiento.', neighborhoodEl)
          if (!city)                                return setError('Ingresa la ciudad.', cityEl)
          if (!zipCode)                             return setError('Ingresa el código postal.', zipCodeEl)
          if (!ZIPCODE_RE.test(zipCode))            return setError('El código postal debe ser de 4 a 6 dígitos numéricos.', zipCodeEl)
          if (!stateSel)                            return setError('Selecciona tu estado.', stateEl)
          if (!stateName)                           return setError('Ingresa tu estado o región.', stateOtherEl)

          fullAddress = `${street} #${numExt}${numInt ? ' Int. ' + numInt : ''}, Col. ${neighborhood}, ${city}, ${stateName}, C.P. ${zipCode}${references ? ' | Ref: ' + references : ''}`
          addressParts = { street, numExt, numInt, neighborhood, city, state: stateSel === 'otro' ? null : stateSel, stateName, zip: zipCode, references }

          // Si aun se esta cotizando, se espera; si el total cambio por el envio, se confirma de nuevo
          const totalBefore = shownTotal
          setSubmitting(true)
          await settleShipping()
          setSubmitting(false)
          if (Math.abs(shownTotal - totalBefore) >= 0.005) {
            return setError(`Calculamos el envío de tu pedido. El total es ${formatMoney(shownTotal)}. Confirma de nuevo para enviarlo.`)
          }
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
          setError('Algunos productos de tu bolsa ya no están disponibles. Vuelve al catálogo.')
          return
        }

        const currentSubtotal = cartTotal()
        const appliedCoupon   = getCoupon()
        const currentDiscount = getDiscountAmount(appliedCoupon)
        const quote           = requireAddress ? activeQuote() : null
        const currentCharge   = shipCharge(currentSubtotal, appliedCoupon)
        const currentTotal    = currentSubtotal - currentDiscount + currentCharge
        if (Math.abs(currentTotal - shownTotal) >= 0.005) {
          refreshSummaryView()
          setError('Los precios cambiaron. Revisa el total y confirma de nuevo.')
          return
        }

        const message = buildOrderMessage({
          customer: { name, whatsapp, paymentMethod, deliveryMethod, address: requireAddress ? fullAddress : '' },
          cartLines,
          subtotal: currentSubtotal,
          discount: currentDiscount,
          couponCode: appliedCoupon?.code || null,
          shipping: quote ? { label: quote[ship.tier].carrier === 'local' ? carrierName('local') : `${TIER_NAMES[ship.tier]} · ${carrierName(quote[ship.tier].carrier)}`, cost: currentCharge } : null,
          total: serverTotal ?? currentTotal,
        })

        // Solo QUE se compra; los precios y el total los calcula place_order en
        // la base. Aca va el productId real siempre: es la llave para releer el
        // precio (el nulo de stock infinito lo pone la funcion al guardar).
        const orderData = {
          name,
          whatsapp,
          email: email || null,
          paymentMethod,
          deliveryMethod,
          address: requireAddress ? fullAddress : null,
          couponCode: appliedCoupon?.code || null,
          expectedTotal: serverTotal ?? Math.round(shownTotal * 100) / 100,
          shippingQuoteId: quote?.quoteId || null,
          shippingTier: quote ? ship.tier : null,
          addressParts,
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
            const usedCoupon = getCoupon()
            if (usedCoupon && /primera compra/i.test(error.message || '')) {
              dropFirstPurchaseCoupon(usedCoupon.code)
              setSubmitting(false)
              return
            }
            if (/vencio|carrito cambio|envio invalida/i.test(error.message || '')) {
              // La cotizacion caduco, el carrito cambio o la opcion ya no vale: se cotiza otra vez
              // y se confirma el precio nuevo. Al segundo error seguido, el pedido va sin cotizacion.
              quoteErrors++
              ship.tier = 'standard'
              ship.key = ''
              if (quoteErrors > 1) { resetShip('fallback'); ship.key = quoteInputs().key; renderShip(); refreshSummaryView({ keepShip: true }) }
              const requote = quoteErrors > 1 ? Promise.resolve() : settleShipping()
              requote.then(() => {
                setError(ship.status === 'fallback'
                  ? `Te confirmamos el costo de envío por WhatsApp. El total de tu pedido es ${formatMoney(shownTotal)}. Confirma de nuevo para enviarlo.`
                  : `Actualizamos el costo de tu envío. El total de tu pedido es ${formatMoney(shownTotal)}. Confirma de nuevo para enviarlo.`)
                setSubmitting(false)
              })
              return
            }
            if (/precios cambiaron/i.test(error.message || '')) {
              // Promo que empezo/termino, precio editado o cupon desactivado con la
              // pagina abierta: se recarga todo, se revalida el cupon y se repinta.
              const dbTotal = Number(error.details)
              const coupon = getCoupon()
              Promise.all([refreshPromotions(), refreshProducts()])
                .then(() => coupon ? applyCoupon(coupon.code, true).then(r => { if (!r.success && !r.rateLimited && !r.transient) removeCoupon(true) }) : null)
                .finally(() => {
                  refreshSummaryView()
                  // Si aun no cuadra (reloj del equipo desfasado) manda la base: se
                  // muestra su total y es el que se confirma en el siguiente intento
                  if (Number.isFinite(dbTotal) && Math.abs(dbTotal - shownTotal) >= 0.005) {
                    serverTotal = dbTotal
                    setError(`Los precios cambiaron. El total de tu pedido es ${formatMoney(dbTotal)}. Confirma de nuevo para enviarlo.`)
                  } else {
                    setError('Los precios cambiaron. Revisa el total y confirma de nuevo.')
                  }
                  setSubmitting(false)
                })
              return
            }
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
          // El cupon de bienvenida ya se uso: no debe quedar puesto para el siguiente pedido
          removeCoupon(true)
        }).catch(err => {
          setError('Ocurrió un error inesperado al conectar con el servidor.')
          setSubmitting(false)
        })
      })

      // Una promo que empieza o termina con el checkout abierto repinta el resumen
      let lastPromoRev = getState().promoRev
      const unsubPromo = subscribe(() => {
        scheduleQuote() // el carrito pudo cambiar; con la misma cotizacion vigente no hace nada
        const rev = getState().promoRev
        if (rev === lastPromoRev) return
        lastPromoRev = rev
        refreshSummaryView()
      })

      return () => {
        clearTimeout(ship.timer)
        ship.seq++
        unsubPromo()
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
