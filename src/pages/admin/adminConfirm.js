import { ICON } from './adminIcons.js'
import { lockScroll, unlockScroll } from '../../utils/dom.js'
import { escapeHtml as esc } from '../../utils/sanitize.js'

/**
 * Modal de confirmacion para acciones destructivas del admin.
 * Se cierra con el boton, con clic en el fondo o con Escape.
 * @param {{ title: string, message: string, highlight?: string, confirmLabel?: string }} opts
 * @returns {Promise<boolean>} true si se confirmo, false si se cancelo
 */
export function confirmDelete({ title, message, highlight = '', confirmLabel = 'Eliminar' }) {
  return new Promise(resolve => {
    document.getElementById('adm-confirm-modal')?.remove()

    const modal = document.createElement('div')
    modal.id = 'adm-confirm-modal'
    modal.className = 'fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade'
    modal.innerHTML = `
      <div class="w-full max-w-sm bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden" role="alertdialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="p-5 text-center">
          <div class="w-11 h-11 rounded-xl2 bg-bad-tint text-bad flex items-center justify-center mx-auto mb-3">${ICON.trash('w-5 h-5')}</div>
          <h3 class="font-display font-bold text-ink text-[17px]">${esc(title)}</h3>
          <p class="text-[13.5px] text-muted mt-1">${highlight ? `Vas a eliminar <span class="font-semibold text-body">"${esc(highlight)}"</span>. ` : ''}${esc(message)}</p>
        </div>
        <div class="px-5 pb-5 flex gap-2.5">
          <button type="button" data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
          <button type="button" data-confirm class="adm-btn flex-1" style="background:#D6453E;color:#fff">${esc(confirmLabel)}</button>
        </div>
      </div>`
    document.body.appendChild(modal)
    lockScroll()

    const close = (confirmed) => {
      document.removeEventListener('keydown', onKey)
      modal.remove()
      unlockScroll()
      resolve(confirmed)
    }
    function onKey(e) { if (e.key === 'Escape') close(false) }

    modal.querySelector('[data-cancel]').addEventListener('click', () => close(false))
    modal.querySelector('[data-confirm]').addEventListener('click', () => close(true))
    modal.addEventListener('click', (e) => { if (e.target === modal) close(false) })
    document.addEventListener('keydown', onKey)
    modal.querySelector('[data-confirm]').focus()
  })
}
