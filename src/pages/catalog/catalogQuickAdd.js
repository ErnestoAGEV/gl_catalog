/**
 * catalogQuickAdd.js
 * Lógica del botón "Quick Add" de las tarjetas del catálogo:
 *   - Abre el modal de selección de talla (sizeSelectionModal)
 *   - Anima el botón: icono → spinner → check
 *   - Llama a addToCart y showMiniCart
 */

import { addToCart, getState } from '../../store/index.js'
import { showMiniCart } from '../../components/miniCart.js'
import { sizeSelectionModal, trapModal } from './catalogModals.js'
import { flyToCart } from '../../utils/dom.js'

/**
 * Maneja un clic en [data-quick-add].
 * @param {Event} ev
 * @param {HTMLElement} btn - el botón [data-quick-add]
 * @param {HTMLElement} modalContainer - el div #modal-container donde se monta el modal
 */
export function handleQuickAdd(ev, btn, modalContainer) {
  ev.preventDefault()
  ev.stopPropagation()
  if (btn.dataset.busy) return

  const id = btn.dataset.quickAdd
  const currentState = getState()
  const product = currentState.products.find(p => p.id === id)

  // Añade al carrito y anima el botón
  const doAddToCart = (size = '') => {
    if (btn.dataset.busy) return
    btn.dataset.busy = '1'

    addToCart({ productId: id, size, color: '', qty: 1 })
    flyToCart(btn.closest('a')?.querySelector('img'))

    // Animación: icono → spinner → check
    const icon = btn.querySelector('.quick-add-icon')
    const spinner = btn.querySelector('.quick-add-spinner')
    const check = btn.querySelector('.quick-add-check')
    // El boton de "Va perfecta con esto" no trae los iconos de la animacion
    if (!icon || !spinner || !check) {
      showMiniCart(id)
      delete btn.dataset.busy
      return
    }
    icon.classList.add('hidden')
    spinner.classList.remove('hidden')

    setTimeout(() => {
      spinner.classList.add('hidden')
      check.classList.remove('hidden')
      btn.classList.add('!bg-green-500', '!text-white')
      showMiniCart(id)

      setTimeout(() => {
        check.classList.add('hidden')
        icon.classList.remove('hidden')
        btn.classList.remove('!bg-green-500', '!text-white')
        delete btn.dataset.busy
      }, 1200)
    }, 350)
  }

  // Abrir modal de selección de talla
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
    modalEl.addEventListener('click', (e) => {
      if (e.target.id === 'quick-add-modal') closeModal()
    })
  }

  // Clic en una talla
  const sizeButtons = modalContainer.querySelectorAll('.size-select-btn')
  sizeButtons.forEach(sizeBtn => {
    sizeBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const selectedSize = sizeBtn.dataset.size
      closeModal()
      doAddToCart(selectedSize)
    })
  })
}
