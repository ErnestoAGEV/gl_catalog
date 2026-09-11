/**
 * Rechaza si `promise` no resuelve en `ms`. Evita spinners infinitos cuando
 * una petición de red (o el lock de auth de supabase-js) se queda colgada.
 */
export function withTimeout(promise, ms, label = 'La operación') {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`${label} tardó más de ${Math.round(ms / 1000)}s.`)
        err.name = 'TimeoutError'
        reject(err)
      }, ms)
    }),
  ]).finally(() => clearTimeout(timer))
}

/**
 * Normaliza lo que devuelve un `onMount`.
 *
 * Un `onMount` sincrono devuelve su funcion de limpieza. Uno declarado `async`
 * devuelve una promesa — y llamar a una promesa lanza "is not a function". Ese
 * TypeError tumbaba el render entero: siete de las diez paginas del panel de
 * admin declaran `async onMount`, asi que al volver a cualquiera de ellas la
 * pantalla acababa en "No pudimos cargar esta pagina" y solo se recuperaba
 * recargando. De paso, la limpieza de esas siete no llegaba a ejecutarse nunca,
 * dejando sueltos sus temporizadores y sus canales de realtime.
 *
 * Devuelve siempre una funcion, o undefined si no habia nada que limpiar.
 */
export function toCleanup(mounted) {
  if (typeof mounted === 'function') return mounted
  if (!mounted || typeof mounted.then !== 'function') return undefined
  // La limpieza real llega cuando el montaje async termine. Si para entonces ya
  // se pidio desmontar, se ejecuta igualmente: es lo que libera los recursos.
  return () => {
    mounted
      .then((fn) => {
        if (typeof fn === 'function') fn()
      })
      .catch(() => {})
  }
}

// node src/utils/async.js
if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('async.js')) {
  ;(async () => {
    const ok = await withTimeout(Promise.resolve('ok'), 50)
    if (ok !== 'ok') throw new Error('withTimeout should pass through resolved values')
    try {
      await withTimeout(new Promise(r => setTimeout(r, 100)), 10, 'Guardar')
      throw new Error('withTimeout should have rejected')
    } catch (e) {
      if (e.name !== 'TimeoutError' || !e.message.includes('Guardar')) throw e
    }
    console.log('withTimeout ok')
  })()
}
