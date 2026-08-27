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
