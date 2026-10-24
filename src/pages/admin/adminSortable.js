import { ICON } from './adminIcons.js'
import { escapeHtml } from '../../utils/sanitize.js'

/** Agarre para una fila de makeSortable. */
export function dragHandle(label) {
  return `<button type="button" data-drag-handle class="w-8 h-10 -ml-1 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-line/60 cursor-grab active:cursor-grabbing transition-colors shrink-0" style="touch-action:none" aria-label="Mover ${escapeHtml(label)}. Usa las flechas arriba y abajo" title="Arrastra para mover">${ICON.grip('w-5 h-5')}</button>`
}

/**
 * Reordenar arrastrando las filas [data-sort-id] de listEl. El mouse arrastra desde
 * cualquier parte de la fila; en touch solo desde el agarre, para que el resto de la
 * fila siga haciendo scroll. Con teclado, flechas sobre el agarre.
 * onSave(ids) guarda el orden nuevo y re-renderiza; se llama solo si el orden cambio.
 */
export function makeSortable(listEl, onSave) {
  let saving = false
  const rows = () => [...listEl.querySelectorAll('[data-sort-id]')]
  const initial = rows().map(r => r.dataset.sortId).join()

  const save = async (focusId) => {
    const ids = rows().map(r => r.dataset.sortId)
    if (ids.join() === initial) return
    saving = true
    listEl.classList.add('opacity-60', 'pointer-events-none')
    try {
      await onSave(ids)
    } finally {
      saving = false
      listEl.classList.remove('opacity-60', 'pointer-events-none')
    }
    if (focusId) document.querySelector(`[data-sort-id="${focusId}"] [data-drag-handle]`)?.focus()
  }

  rows().forEach(row => {
    row.addEventListener('pointerdown', (e) => {
      if (saving || e.button !== 0) return
      const fromHandle = !!e.target.closest('[data-drag-handle]')
      if (!fromHandle && (e.pointerType !== 'mouse' || e.target.closest('button, a, input'))) return
      e.preventDefault()

      let startY = e.pageY // pagina, no pantalla: el auto-scroll no debe despegar la fila del cursor
      let moved = false
      row.setPointerCapture(e.pointerId)

      const onMove = (ev) => {
        if (!moved) {
          if (Math.abs(ev.pageY - startY) < 4) return
          moved = true
          row.classList.add('relative', 'z-10', 'shadow-pop', 'border-brand')
        }
        const prev = row.previousElementSibling
        const next = row.nextElementSibling
        const before = row.offsetTop
        // Cruzar la mitad del vecino lo intercambia; la fila sigue bajo el puntero.
        if (next && ev.clientY > next.getBoundingClientRect().top + next.offsetHeight / 2) {
          listEl.insertBefore(next, row)
        } else if (prev && ev.clientY < prev.getBoundingClientRect().top + prev.offsetHeight / 2) {
          listEl.insertBefore(row, prev)
        }
        startY += row.offsetTop - before
        row.style.transform = `translateY(${ev.pageY - startY}px)`
        // Cerca del borde la pagina avanza sola, para llevar una fila mas alla de lo visible.
        const edge = 48
        if (ev.clientY < edge) window.scrollBy(0, -12)
        else if (ev.clientY > window.innerHeight - edge) window.scrollBy(0, 12)
      }

      const onEnd = () => {
        row.removeEventListener('pointermove', onMove)
        row.removeEventListener('pointerup', onEnd)
        row.removeEventListener('pointercancel', onEnd)
        row.style.transform = ''
        row.classList.remove('relative', 'z-10', 'shadow-pop', 'border-brand')
        if (moved) save()
      }

      row.addEventListener('pointermove', onMove)
      row.addEventListener('pointerup', onEnd)
      row.addEventListener('pointercancel', onEnd)
    })

    row.querySelector('[data-drag-handle]')?.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      const sibling = e.key === 'ArrowUp' ? row.previousElementSibling : row.nextElementSibling
      if (!sibling || saving) return
      listEl.insertBefore(row, e.key === 'ArrowUp' ? sibling : sibling.nextElementSibling)
      save(row.dataset.sortId)
    })
  })
}
