import { state, emit, createStoreError } from './state.js'
import { supabase } from '../core/supabase.js'
import { withTimeout } from '../utils/async.js'
import { classifySessionResult } from '../utils/session.js'

/** getSession() que ni se cuelga ni miente. No toca el lock de supabase-js. */
async function leerSesion() {
  try {
    const res = await withTimeout(supabase.auth.getSession(), 8000, 'La sesión')
    return { estado: classifySessionResult(res), session: res?.data?.session ?? null }
  } catch {
    return { estado: classifySessionResult({ threw: true }), session: null }
  }
}

export async function ensureAdminAccess() {
  if (!supabase) {
    return { ok: false, error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const { estado, session } = await leerSesion()

  // No se pudo comprobar: se deniega esta operacion, pero no se cierra la
  // sesion. Cerrarla por una comprobacion fallida era el fallo.
  if (estado === 'inconcluyente') {
    return { ok: false, error: createStoreError('No se pudo verificar la sesión. Reintenta en un momento.', 'SESSION_CHECK_FAILED') }
  }

  if (estado === 'sin-sesion') {
    if (state.isAdminAuthed) {
      state.isAdminAuthed = false
      emit()
    }
    return { ok: false, error: createStoreError('No autorizado', 'NOT_AUTHORIZED') }
  }

  const userId = session.user?.id
  if (!userId) {
    return { ok: false, error: createStoreError('No autorizado', 'NOT_AUTHORIZED') }
  }

  if (state.isAdminAuthed) {
    return { ok: true }
  }

  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (adminError) {
    if (import.meta.env.DEV) console.error('Admin access check failed:', adminError)
    return { ok: false, error: createStoreError('No se pudo validar permisos de administrador.', 'ADMIN_ACCESS_CHECK_FAILED') }
  }

  if (!adminUser) {
    return { ok: false, error: createStoreError('Tu usuario no está autorizado en admin_users.', 'NOT_ADMIN_USER') }
  }

  if (!state.isAdminAuthed) {
    state.isAdminAuthed = true
    emit()
  }

  return { ok: true }
}

export function isAdminAuthed() {
  return state.isAdminAuthed
}

export async function initAdminSession() {
  if (!supabase) return
  const { estado, session } = await leerSesion()

  // Si no se pudo comprobar, se deja el estado como estaba en vez de asumir que
  // no hay nadie dentro.
  if (estado === 'inconcluyente') {
    emit()
    return
  }

  if (session) {
    const userId = session.user?.id
    if (userId) {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()
      state.isAdminAuthed = Boolean(adminUser)
    } else {
      state.isAdminAuthed = false
    }
  } else {
    state.isAdminAuthed = false
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session) {
      const userId = session.user?.id
      if (userId) {
        // Mismo criterio que arriba: si la consulta falla no sabemos si es
        // admin, y no saberlo no es motivo para echarlo. Antes el error se
        // descartaba al desestructurar y un fallo de red lo deslogueaba.
        try {
          const { data: adminUser, error } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle()
          if (!error) state.isAdminAuthed = Boolean(adminUser)
        } catch { /* se conserva el estado anterior */ }
      } else {
        state.isAdminAuthed = false
      }
    } else {
      // Sesion nula desde el propio evento si es concluyente: es un cierre.
      state.isAdminAuthed = false
    }
    emit()
  })
  emit()
}

export async function adminLogin(email, pass) {
  if (!supabase) return { error: 'No hay conexión con la base de datos.' }

  // signInWithPassword no solo devuelve error: tambien puede lanzar. Con dos
  // pestañas abiertas lanza AbortError por el lock de auth, y ese throw subia
  // hasta el submit del formulario, que se quedaba en "Ingresando…" para
  // siempre porque nunca llegaba a reponer el boton.
  let data, error
  try {
    ;({ data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password: pass }),
      20000,
      'El inicio de sesión'
    ))
  } catch (err) {
    const abortado = err?.name === 'AbortError' || /aborted/i.test(String(err?.message))
    return {
      error: abortado || err?.name === 'TimeoutError'
        ? 'La sesión se quedó esperando a otra pestaña. Cierra las demás pestañas de la tienda y reintenta.'
        : 'No se pudo iniciar sesión. Reintenta en un momento.',
    }
  }
  if (error) return { error: error.message }

  const userId = data.session?.user?.id
  if (!userId) return { error: 'No se pudo obtener el usuario.' }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!adminUser) {
    await supabase.auth.signOut()
    return { error: 'Tu usuario no está autorizado como administrador.' }
  }

  state.isAdminAuthed = true
  emit()
  return { ok: true }
}

export async function adminLogout() {
  if (supabase) await supabase.auth.signOut()
  state.isAdminAuthed = false
  emit()
}
