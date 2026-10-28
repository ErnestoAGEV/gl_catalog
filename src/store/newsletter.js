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
      // Ya existe: si se habia dado de baja, se reactiva (y recibe la bienvenida).
      if (error.code === '23505') {
        await supabase.rpc('newsletter_resubscribe', { p_email: normalizedEmail })
        return { ok: true }
      }
      if (import.meta.env.DEV) console.error('Newsletter Supabase error:', error)
      return { ok: false, error: 'No se pudo guardar tu suscripción. Intenta de nuevo.' }
    }
  }

  return { ok: true }
}

/** Plantilla de email_templates ('welcome' o el borrador 'campaign'); data null = aún no se guarda. */
export async function getEmailTemplate(key) {
  if (!supabase) return { data: null, error: 'No hay conexion con la base de datos.' }
  const access = await ensureAdminAccess()
  if (!access.ok) return { data: null, error: access.error }
  const { data, error } = await supabase.from('email_templates').select('*').eq('key', key).maybeSingle()
  if (error && import.meta.env.DEV) console.error('Error fetching email template:', error)
  return { data, error }
}

export async function saveEmailTemplate(key, { subject, html, fields, enabled }) {
  if (!supabase) return { error: 'No hay conexion con la base de datos.' }
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }
  const { error } = await supabase.from('email_templates')
    .upsert({ key, subject, html, fields, enabled, updated_at: new Date().toISOString() })
  if (error && import.meta.env.DEV) console.error('Error saving email template:', error)
  return { error }
}

/** Manda el correo a los suscriptores activos, o solo a testEmail. Devuelve { count } o { error }. */
export async function sendNewsletter({ subject, html, testEmail = null }) {
  if (!supabase) return { error: 'No hay conexion con la base de datos.' }
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }
  const { data, error } = await supabase.rpc('send_newsletter', { p_subject: subject, p_html: html, p_test_email: testEmail })
  if (error && import.meta.env.DEV) console.error('Error sending newsletter:', error)
  return error ? { error: error.message || 'No se pudo enviar.' } : { count: data }
}

/** Estado del último envío: { subject, created_at, total, delivered, failed, pending } o null. */
export async function getLastCampaign() {
  if (!supabase) return null
  const access = await ensureAdminAccess()
  if (!access.ok) return null
  const { data, error } = await supabase.rpc('newsletter_last_campaign')
  if (error && import.meta.env.DEV) console.error('Error fetching last campaign:', error)
  return error ? null : data
}

/** Enlace de baja de los correos: true si se dio de baja, false si el enlace no es de nadie, null si falló la red. */
export async function unsubscribeNewsletter(token) {
  if (!/^[0-9a-f-]{36}$/i.test(token || '')) return false
  if (!supabase) return null
  const { data, error } = await supabase.rpc('newsletter_unsubscribe', { p_token: token })
  if (error && import.meta.env.DEV) console.error('Error unsubscribing:', error)
  return error ? null : data === true
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
