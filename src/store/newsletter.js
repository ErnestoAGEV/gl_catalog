import { state, emit, dispatchError } from './state.js'
import { STORAGE_KEYS } from '../utils/config.js'
import { writeJson } from '../utils/storage.js'
import { sanitizeEmail } from '../utils/sanitize.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'

export async function subscribeNewsletter(email) {
  const { value: normalizedEmail, valid } = sanitizeEmail(email)
  if (!valid) return { ok: false, error: 'El correo electrónico no es válido.' }

  state.newsletter = { email: normalizedEmail, subscribedAt: Date.now() }
  writeJson(STORAGE_KEYS.newsletter, state.newsletter)
  emit()

  if (supabase) {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: normalizedEmail, source: 'home_page' })

    if (error) {
      if (error.code === '23505') return { ok: true }
      if (import.meta.env.DEV) console.error('Newsletter Supabase error:', error)
      return { ok: false, error: 'No se pudo guardar tu suscripción. Intenta de nuevo.' }
    }
  }

  return { ok: true }
}

export function isSubscribedNewsletter() {
  return Boolean(state.newsletter?.email)
}

export async function getAdminSubscribers() {
  if (!supabase || !state.isAdminAuthed) return []

  const access = await ensureAdminAccess()
  if (!access.ok) {
    dispatchError(access.error.message)
    return []
  }

  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
    if (error) throw error

    const getSubscriberTime = (row) => {
      const raw = row?.created_at
        || row?.subscribed_at
        || row?.createdAt
        || row?.subscribedAt
        || row?.updated_at
        || row?.updatedAt
        || null
      const ts = raw ? new Date(raw).getTime() : 0
      return Number.isFinite(ts) ? ts : 0
    }

    return (data || []).slice().sort((a, b) => getSubscriberTime(b) - getSubscriberTime(a))
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error fetching admin subscribers:', err)
    if (err?.code === '42501') {
      dispatchError('No tienes permisos para ver newsletter. Revisa la tabla admin_users y las políticas RLS.')
    } else {
      dispatchError('No se pudieron cargar los suscriptores de newsletter.')
    }
    return []
  }
}
