import { state, emit, createStoreError } from './state.js'
import { supabase } from '../core/supabase.js'

export async function ensureAdminAccess() {
  if (!supabase) {
    return { ok: false, error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session) {
    if (state.isAdminAuthed) {
      state.isAdminAuthed = false
      emit()
    }
    return { ok: false, error: createStoreError('No autorizado', 'NOT_AUTHORIZED') }
  }

  const userId = data.session.user?.id
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
  const { data: { session } } = await supabase.auth.getSession()

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
    emit()
  })
  emit()
}

export async function adminLogin(email, pass) {
  if (!supabase) return { error: 'No hay conexión con la base de datos.' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
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
