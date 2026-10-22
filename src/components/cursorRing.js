// Aro que sigue al raton. Es solo decoracion: el puntero del sistema nunca se
// esconde, asi que si esto falla la pagina sigue teniendo puntero.

const LINK = 'a, button, summary, label, select, [role="button"], .chip, .swatch-btn, .size-pill, .thumb, .pcard, [data-cursor-hover]'
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]'

export function initCursorRing() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const ring = document.createElement('div')
  ring.className = 'cursor-ring'
  ring.setAttribute('aria-hidden', 'true')
  document.body.appendChild(ring)

  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, seen = false

  const tick = () => {
    x += (tx - x) * 0.25
    y += (ty - y) * 0.25
    ring.style.translate = `${x}px ${y}px`
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0
  }

  const setState = (t) => {
    ring.dataset.state = !t || location.pathname.startsWith('/admin') ? 'off'
      : t.closest?.('#pdp-stage.zoomed') ? 'zoom'
      : t.closest?.(TEXT) ? 'text'
      : t.closest?.(LINK) ? 'link'
      : ''
  }

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    tx = e.clientX
    ty = e.clientY
    // La primera vez aparece donde esta el raton, sin volar desde la esquina
    if (!seen) { seen = true; x = tx; y = ty }
    setState(e.target)
    if (!raf) raf = requestAnimationFrame(tick)
  }, { passive: true })

  addEventListener('pointerdown', () => ring.classList.add('is-down'))
  addEventListener('pointerup', () => {
    ring.classList.remove('is-down')
    // Un clic puede cambiar lo que hay bajo el raton (zoom, pagina nueva) sin moverlo
    setTimeout(() => { if (seen) setState(document.elementFromPoint(tx, ty)) }, 50)
  })
  document.documentElement.addEventListener('pointerleave', () => { ring.dataset.state = 'off' })
}
