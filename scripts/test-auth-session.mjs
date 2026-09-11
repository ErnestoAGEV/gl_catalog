// classifySessionResult: la regla que faltaba en el panel de admin.
//
// Con la tienda y el panel abiertos en dos pestañas, supabase-js aborta la
// llamada de una de ellas por el lock de auth ("AbortError: signal is aborted
// without reason"). El codigo lo leia como "no hay sesion", cerraba la sesion
// del admin y lo mandaba al login — donde el boton se quedaba en "Ingresando…".
//
// La regla: un fallo al comprobar no es lo mismo que una sesion ausente.
import assert from 'node:assert/strict'
import { classifySessionResult } from '../src/utils/session.js'

// Sesion presente.
assert.equal(classifySessionResult({ data: { session: { user: { id: 'u1' } } } }), 'con-sesion')

// Sesion ausente de verdad: el servidor contesto y no hay nadie dentro.
assert.equal(classifySessionResult({ data: { session: null } }), 'sin-sesion')
assert.equal(classifySessionResult({ data: {} }), 'sin-sesion')

// No se pudo comprobar. Estos tres NO pueden cerrar la sesion.
assert.equal(classifySessionResult({ error: new Error('AbortError') }), 'inconcluyente')
assert.equal(classifySessionResult({ threw: true }), 'inconcluyente')
assert.equal(classifySessionResult({}), 'sin-sesion', 'una respuesta vacia sin error si es sesion ausente')

// Un error manda aunque venga con datos: no fiarse de una respuesta a medias.
assert.equal(
  classifySessionResult({ data: { session: { user: { id: 'u1' } } }, error: new Error('x') }),
  'inconcluyente'
)

// Sin argumentos no revienta.
assert.equal(classifySessionResult(), 'sin-sesion')

console.log('ok — auth session')
