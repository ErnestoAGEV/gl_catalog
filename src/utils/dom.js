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

/**
 * Bloqueo de scroll para modales y paneles.
 *
 * `body { overflow: hidden }` no sirve aqui: con `height: 100%` en body el
 * documento se encoge a la altura del viewport, el navegador recorta el
 * scrollTop a 0 y al cerrar el modal apareces arriba del todo. Se fija el body
 * y se compensa con `top`, que es la unica forma que conserva la posicion.
 */
let scrollLocks = 0
let lockedScrollY = 0

export function lockScroll() {
  if (scrollLocks++ > 0) return
  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0
  // Al salir el body del flujo desaparece la barra de scroll: sin esto la
  // pagina entera salta ~15px a la derecha en Windows.
  const gutter = window.innerWidth - document.documentElement.clientWidth
  document.body.style.position = 'fixed'
  document.body.style.top = `-${lockedScrollY}px`
  document.body.style.width = '100%'
  if (gutter > 0) document.body.style.paddingRight = `${gutter}px`
}

/** force: limpia el bloqueo sin devolver el scroll (para navegacion entre rutas) */
export function unlockScroll(force = false) {
  if (force) scrollLocks = 0
  else if (--scrollLocks > 0) return
  if (scrollLocks < 0) scrollLocks = 0
  if (document.body.style.position !== 'fixed') return
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  document.body.style.paddingRight = ''
  if (!force) window.scrollTo(0, lockedScrollY)
}
