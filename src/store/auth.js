import { state, emit, createStoreError } from './state.js'
import { supabase } from '../core/supabase.js'
import { withTimeout } from '../utils/async.js'
import { classifySessionResult } from '../utils/session.js'
import { mfaStep, verifyAgainst } from '../utils/mfa.js'

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

  // supabase-js llama a este callback DENTRO de su lock de auth y lo espera
  // (p. ej. TOKEN_REFRESHED, cada hora). Una consulta aqui pide el token, el
  // token pide el lock, y el lock espera al callback: interbloqueo. Esa pestaña
  // se queda con el lock para siempre y, como navigator.locks es compartido,
  // todas las pestañas fallan con "No se pudo verificar la sesión". Por eso el
  // trabajo se aplaza con setTimeout, como pide la documentacion de supabase.
  supabase.auth.onAuthStateChange((_event, session) => setTimeout(async () => {
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
  }, 0))
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
  if (!data.session?.user?.id) return { error: 'No se pudo obtener el usuario.' }
  // La pertenencia a admin_users se comprueba en completeAdminLogin, despues del
  // segundo paso: con la Fase D una sesion aal1 ya no puede leer admin_users.
  return { ok: true }
}

/** Cierra el login: pertenencia a admin_users (de siempre) y marca la sesion. */
export async function completeAdminLogin() {
  if (!supabase) return { error: 'No hay conexión con la base de datos.' }
  const { estado, session } = await leerSesion()
  if (estado === 'inconcluyente') return { error: 'No se pudo verificar la sesión. Reintenta en un momento.' }
  const userId = session?.user?.id
  if (!userId) return { error: 'No se pudo obtener el usuario.' }

  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { error: 'No se pudo validar permisos de administrador.' }
  if (!adminUser) {
    await supabase.auth.signOut()
    return { error: 'Tu usuario no está autorizado como administrador.' }
  }

  state.isAdminAuthed = true
  emit()
  return { ok: true }
}

/** Factores de la cuenta, frescos del servidor (no de la sesion en cache). */
async function fetchFactors() {
  const { data, error } = await withTimeout(supabase.auth.mfa.listFactors(), 15000, 'La consulta de dispositivos')
  if (error) throw error
  return data
}

/**
 * 'login' | 'none' | 'challenge' | 'enroll' (ver utils/mfa.js). Lanza si no se
 * pudo comprobar (lock colgado, red): la pagina lo muestra y pide la contraseña.
 * En aal1 se decide con listFactors() y no con session.user.factors, que puede
 * estar viejo (factor borrado por recuperacion, o dado de alta en otra pestaña).
 */
export async function getMfaStep() {
  if (!supabase) return 'login'
  const { data, error } = await withTimeout(supabase.auth.mfa.getAuthenticatorAssuranceLevel(), 8000, 'La sesión')
  if (error) throw error
  if (data?.currentLevel !== 'aal1') return mfaStep(data)
  const factors = await fetchFactors()
  return mfaStep({ currentLevel: 'aal1', nextLevel: factors.totp.length ? 'aal2' : 'aal1' })
}

/** { factors: [{ id, friendly_name, created_at }] } (solo verificados) | { error } */
export async function listMfaFactors() {
  if (!supabase) return { error: 'No hay conexión con la base de datos.' }
  try {
    const data = await fetchFactors()
    return { factors: data.totp.map(({ id, friendly_name, created_at }) => ({ id, friendly_name, created_at })) }
  } catch {
    return { error: 'No se pudieron cargar tus dispositivos.' }
  }
}

/** { factorId, qr, secret } | { challenge: true } (ya tiene factor y le falta el codigo) | { error } */
export async function startMfaEnroll(name) {
  if (!supabase) return { error: 'No hay conexión con la base de datos.' }
  try {
    const list = await fetchFactors()
    // Con un factor verificado, un alta solo se permite en aal2 (agregar otro
    // dispositivo). En aal1 lo que falta es el codigo, no otra alta.
    if (list.totp.length) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel !== 'aal2') return { challenge: true }
    }
    // Un alta a medias (se recargo la pagina antes del codigo) deja un factor
    // sin verificar que bloquea la siguiente: se borran antes de empezar.
    for (const f of list.all) {
      if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
    const { data, error } = await withTimeout(
      supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: name }),
      15000,
      'El alta'
    )
    if (error) return { error: 'No se pudo preparar el alta. Reintenta en un momento.' }
    return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
  } catch {
    return { error: 'No se pudo preparar el alta. Reintenta en un momento.' }
  }
}

const WRONG_CODE = 'Código incorrecto. Revisa la hora de tu teléfono e inténtalo de nuevo.'
const VERIFY_FAILED = 'No se pudo verificar el código. Recarga la página e inténtalo de nuevo.'

/**
 * { ok } | { error, wrongCode } | { enroll: true } (ya no tiene factores: se
 * borraron para recuperarlo). wrongCode cuenta para el bloqueo progresivo.
 * Sin factorId se prueba contra todos los verificados: cada telefono da su codigo.
 */
export async function verifyMfa(code, factorId) {
  if (!supabase) return { error: 'No hay conexión con la base de datos.' }
  try {
    let ids = factorId ? [factorId] : null
    if (!ids) {
      ids = (await fetchFactors()).totp.map((f) => f.id)
      if (!ids.length) return { enroll: true }
    }
    const r = await verifyAgainst(ids, async (id) => {
      // Un timeout se devuelve como error para que se pruebe el siguiente factor.
      try {
        const { error } = await withTimeout(
          supabase.auth.mfa.challengeAndVerify({ factorId: id, code }),
          20000,
          'La verificación'
        )
        return error
      } catch (err) {
        return err
      }
    })
    if (r.ok) return { ok: true }
    if (r.rateLimited) return { error: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.' }
    return r.wrongCode ? { error: WRONG_CODE, wrongCode: true } : { error: VERIFY_FAILED }
  } catch {
    return { error: VERIFY_FAILED }
  }
}

export async function adminLogout() {
  // signOut tambien pasa por el lock de auth: si algo lo tiene tomado, el await
  // no vuelve nunca y el boton de salir parece muerto. Se corta a los 5s y se
  // borra el token a mano, para que salir signifique salir de verdad.
  if (supabase) {
    try {
      await withTimeout(supabase.auth.signOut(), 5000, 'El cierre de sesión')
    } catch {
      try {
        for (const k of Object.keys(localStorage)) {
          if (/^sb-.*-auth-token$/.test(k)) localStorage.removeItem(k)
        }
      } catch { /* modo privado sin localStorage */ }
    }
  }
  state.isAdminAuthed = false
  emit()
}
