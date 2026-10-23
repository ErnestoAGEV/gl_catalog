import { escapeHtml } from '../../utils/sanitize.js'
import { sortSizes } from '../../utils/productCopy.js'

// Selector de talla del "agregar rapido" (catalogo y upsell del checkout).
// La foto es la misma de la tarjeta: ya esta en cache, no cuesta egress.
export function sizeSelectionModal(p) {
  const sizes = sortSizes(p.sizes || [])
  const safeName = escapeHtml(p.name)
  const safeImg = escapeHtml(p.images?.[0] || '')

  return `
    <div id="quick-add-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="quick-add-title" class="bg-paper text-ink w-full max-w-lg rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden animate-slide-up border border-ink/10">
        <div class="p-5 sm:p-6 border-b border-ink/10 flex items-start gap-4 relative">
          <div class="w-16 h-16 rounded-2xl bg-fog overflow-hidden flex-shrink-0">
            <img src="${safeImg}" alt="" class="w-full h-full object-cover">
          </div>
          <div class="min-w-0 flex-1 pt-1 pr-10">
            <p class="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/60 mb-1">${sizes.length > 0 ? 'Elige tu talla' : 'Agregar a la bolsa'}</p>
            <h3 id="quick-add-title" class="font-display font-bold text-ink text-lg leading-tight">${safeName}</h3>
          </div>
          <button id="close-quick-add" type="button" class="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center text-ink/60 hover:text-ink hover:bg-fog transition-colors" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-5 sm:p-6 bg-fog/50 flex justify-center">
          ${sizes.length > 0 ? `
            <div class="flex flex-wrap justify-center gap-2.5">
              ${sizes.map(size => `
                <button type="button" class="size-select-btn flex-shrink-0 min-w-[3.5rem] h-11 px-4 rounded-full border border-ink/15 bg-paper text-ink text-[13px] font-semibold hover:border-ink hover:bg-ink hover:text-paper active:scale-95 transition-[transform,background-color,color] duration-200" data-size="${escapeHtml(size)}">
                  ${escapeHtml(size)}
                </button>
              `).join('')}
            </div>
          ` : `
            <button type="button" class="size-select-btn w-full h-12 rounded-full bg-ink text-paper hover:bg-brand text-[14px] font-semibold active:scale-[0.98] transition-[transform,background-color] duration-200" data-size="">
              Agregar a la bolsa
            </button>
          `}
        </div>
      </div>
    </div>
  `
}

/**
 * Comportamiento de dialogo para el modal de tallas: Esc cierra, Tab no se
 * sale y el foco vuelve a quien lo abrio. Devuelve la funcion que lo suelta.
 */
export function trapModal(container, onEscape) {
  const dialog = container.querySelector('#quick-add-modal')
  const opener = document.activeElement
  const focusables = () => [...(dialog?.querySelectorAll('button, [href], input, select, [tabindex]:not([tabindex="-1"])') || [])]
  const onKey = (e) => {
    // Si se navego con el modal abierto, la vista quedo oculta: soltar y no hacer nada
    if (!dialog?.isConnected || !dialog.getClientRects().length) { document.removeEventListener('keydown', onKey); return }
    if (e.key === 'Escape') { e.preventDefault(); onEscape(); return }
    if (e.key !== 'Tab') return
    const items = focusables()
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  document.addEventListener('keydown', onKey)
  focusables()[0]?.focus()
  return () => {
    document.removeEventListener('keydown', onKey)
    if (opener?.isConnected) opener.focus()
  }
}
