export function qs(root, selector) {
  const el = root.querySelector(selector)
  if (!el) throw new Error(`Missing element: ${selector}`)
  return el
}

export function on(root, eventName, selector, handler) {
  root.addEventListener(eventName, (ev) => {
    const target = ev.target
    if (!(target instanceof Element)) return
    const match = target.closest(selector)
    if (!match || !root.contains(match)) return
    handler(ev, match)
  })
}

/**
 * La foto del producto "vuela" hasta el icono de la bolsa al agregarlo.
 * Silenciosa si no hay foto, no hay bolsa visible o el usuario pidió menos
 * movimiento: es decoración, nunca debe romper el añadir al carrito.
 */
export function flyToCart(sourceEl) {
  if (!sourceEl) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // Puede haber varios enlaces a /cart (header y nav móvil): vale el visible
  const target = [...document.querySelectorAll('a[href="/cart"]')].find(el => el.offsetParent !== null)
  if (!target) return

  const from = sourceEl.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  if (!from.width || !to.width) return

  const ghost = sourceEl.cloneNode(true)
  ghost.removeAttribute('id')
  ghost.style.cssText = `position:fixed;margin:0;left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;object-fit:cover;border-radius:10px;z-index:9999;pointer-events:none;`
  document.body.appendChild(ghost)

  const dx = (to.left + to.width / 2) - (from.left + from.width / 2)
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2)

  const anim = ghost.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) scale(.45)`, opacity: .95, offset: .6 },
    { transform: `translate(${dx}px, ${dy}px) scale(.06)`, opacity: .2 },
  ], { duration: 750, easing: 'cubic-bezier(.5,0,.75,.4)' })

  anim.onfinish = () => ghost.remove()
  anim.oncancel = () => ghost.remove()
}
