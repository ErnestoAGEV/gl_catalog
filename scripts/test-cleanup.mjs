// toCleanup: el fallo que dejaba el panel de admin en blanco al volver a el.
//
// Siete de las diez paginas de admin declaran `async onMount`, asi que
// devuelven una promesa. El router la guardaba como si fuera la funcion de
// limpieza y, en la siguiente navegacion, hacia cleanup?.() sobre ella: un
// TypeError que tumbaba el render y dejaba la pantalla de error hasta recargar.
import assert from 'node:assert/strict'
import { toCleanup } from '../src/utils/async.js'

// Un onMount sincrono: su limpieza pasa tal cual.
let limpiado = false
const sincrono = () => { limpiado = true }
assert.equal(toCleanup(sincrono), sincrono)
toCleanup(sincrono)()
assert.equal(limpiado, true)

// Un onMount async: lo que sale tiene que ser llamable, que es justo lo que
// fallaba. Y su limpieza real debe acabar ejecutandose.
let limpiadoAsync = false
const promesa = Promise.resolve(() => { limpiadoAsync = true })
const fn = toCleanup(promesa)
assert.equal(typeof fn, 'function', 'un onMount async tiene que dar una funcion')
fn()
await promesa
await new Promise((r) => setTimeout(r, 0))
assert.equal(limpiadoAsync, true, 'la limpieza del montaje async debe ejecutarse')

// Un onMount async que no devuelve limpieza: llamarlo no puede reventar.
const sinLimpieza = toCleanup(Promise.resolve(undefined))
sinLimpieza()
await new Promise((r) => setTimeout(r, 0))

// Un montaje async que falla no debe propagar al router: la navegacion sigue.
const queFalla = toCleanup(Promise.reject(new Error('fallo de montaje')))
queFalla()
await new Promise((r) => setTimeout(r, 0))

// Sin onMount no hay nada que llamar.
assert.equal(toCleanup(undefined), undefined)
assert.equal(toCleanup(null), undefined)

// Y lo que reproduce el fallo original: llamar a la promesa a pelo lanza.
assert.throws(() => Promise.resolve()(), TypeError)

console.log('ok — cleanup')
