// node src/utils/dom.scrollLock.test.js
import assert from 'node:assert/strict'

const style = {}
globalThis.document = { body: { style }, documentElement: { scrollTop: 0, clientWidth: 1000 } }
globalThis.window = {
  scrollY: 0, innerWidth: 1015,
  scrollTo: (_x, y) => { globalThis.window.scrollY = y },
}

const { lockScroll, unlockScroll } = await import('./dom.js')

// Devuelve al usuario donde estaba, que es el bug que motivo todo esto
window.scrollY = 1240
lockScroll()
assert.equal(style.position, 'fixed')
assert.equal(style.top, '-1240px')
assert.equal(style.paddingRight, '15px', 'compensa la barra de scroll que desaparece')
window.scrollY = 0                       // el navegador recorta el scroll al fijar el body
unlockScroll()
assert.equal(window.scrollY, 1240, 'vuelve a la posicion previa')
assert.equal(style.position, '')

// Modal sobre modal: solo el ultimo cierre desbloquea
window.scrollY = 500
lockScroll(); lockScroll()
unlockScroll()
assert.equal(style.position, 'fixed', 'sigue bloqueado con un modal abierto')
unlockScroll()
assert.equal(window.scrollY, 500)

// Navegar entre rutas suelta el bloqueo sin tocar el scroll
window.scrollY = 800
lockScroll()
window.scrollY = 0
unlockScroll(true)
assert.equal(style.position, '')
assert.equal(window.scrollY, 0, 'force no restaura: de eso se encarga el router')

// Desbloquear de mas no deja el contador en negativo
unlockScroll(); unlockScroll()
window.scrollY = 300
lockScroll()
unlockScroll()
assert.equal(window.scrollY, 300)

console.log('scroll lock: ok')
