import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'

/**
 * Cotiza Estandar/Express con la Edge Function shipping-quote. Cualquier fallo
 * (429, 500, red, sin quoteId) vuelve {fallback: true}: el costo se confirma por WhatsApp.
 */
export async function quoteShipping({ zipCode, state, city, items }) {
  if (!supabase) return { fallback: true }
  try {
    const { data, error } = await supabase.functions.invoke('shipping-quote', {
      body: { zipCode: String(zipCode), state, city, items },
    })
    return error || !data?.quoteId ? { fallback: true } : data
  } catch (_err) {
    return { fallback: true }
  }
}

// ── Admin: ajustes de envio (RLS: solo admin_users). La Edge Function los lee en cada cotizacion ──

export async function getShippingSettings() {
  const access = await ensureAdminAccess()
  if (!access.ok) return { settings: null, weights: [] }
  const [s, w] = await Promise.all([
    supabase.from('shipping_settings').select('*').eq('id', 1).single(),
    supabase.from('shipping_category_weights').select('*').order('category'),
  ])
  return { settings: s.error ? null : s.data, weights: w.error ? [] : w.data || [] }
}

async function adminWrite(run) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }
  const { error } = await run()
  return { error }
}

export const saveShippingSettings = (settings) =>
  adminWrite(() => supabase.from('shipping_settings').update(settings).eq('id', 1))

export const saveCategoryWeight = ({ category, grams, needs_box }) =>
  adminWrite(() => supabase.from('shipping_category_weights').upsert({ category, grams, needs_box }))

export const deleteCategoryWeight = (category) =>
  adminWrite(() => supabase.from('shipping_category_weights').delete().eq('category', category))
