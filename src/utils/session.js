/**
 * Traduce el resultado de getSession() a una de tres cosas, que antes se
 * confundian en una sola.
 *
 * supabase-js coordina el refresco del token entre pestañas con
 * navigator.locks. Con la tienda y el panel abiertos a la vez, la llamada de
 * una pestaña puede abortar ("AbortError: signal is aborted without reason") o
 * quedarse esperando el lock de la otra. Eso NO significa que no haya sesion:
 * significa que no se pudo comprobar. Tratarlo como "no hay sesion" es lo que
 * cerraba la sesion del admin y lo devolvia al login al volver del catalogo.
 *
 * Vive aqui, sin importar supabase, para poder probarla desde node.
 */
export function classifySessionResult({ data, error, threw } = {}) {
  if (threw || error) return 'inconcluyente'
  return data?.session ? 'con-sesion' : 'sin-sesion'
}
