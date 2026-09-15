import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

/**
 * fetch con corte para las llamadas de /auth/v1/.
 *
 * supabase-js serializa TODAS sus operaciones de auth detrás de un lock. Si una
 * petición de auth se cuelga (portátil que vuelve de suspensión, wifi que se
 * cae a media renovación de token), su fetch nunca termina, el lock nunca se
 * suelta y a partir de ahí todo lo que necesite sesión se queda esperando: subir
 * imagen falla con "No se pudo verificar la sesión" y el botón de salir parece
 * muerto. Solo se arreglaba recargando. Con un abort a los 15s el fetch termina
 * siempre, el lock se libera y el siguiente intento funciona.
 *
 * Solo auth: las subidas de imagen a Storage pueden tardar más y no bloquean nada.
 */
function fetchConCorte(input, init = {}) {
  const url = typeof input === 'string' ? input : input?.url ?? ''
  if (!url.includes('/auth/v1/') || init.signal) return fetch(input, init)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,       // Supabase guarda el JWT en localStorage de forma segura
      autoRefreshToken: true,     // Renueva el token antes de que expire
      detectSessionInUrl: false,
    },
    global: { fetch: fetchConCorte },
  })
} else {
  console.warn('Supabase credentials missing! Check your .env file.')
}

export { supabase }
