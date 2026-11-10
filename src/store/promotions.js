import { state, emit } from './state.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'
import { withTimeout } from '../utils/async.js'
import { writeJson } from '../utils/storage.js'
import { nextBoundary, boundaryDelay } from '../utils/promotions.js'
import { withPromotions } from './products.js'

const CACHE_KEY = 'gl_promotions_cache'
let boundaryTimer = null

/** Recalcula precios con las promos de state y programa el próximo cambio (inicio/fin). */
export function reapplyPromotions() {
  const before = priceKey()
  state.products = withPromotions(state.products)
  // Las vistas con firma (home, ficha, bolsa) solo se repintan si algo de la firma cambia
  if (priceKey() !== before) state.promoRev = (state.promoRev || 0) + 1
  emit()
  clearTimeout(boundaryTimer)
  const delay = boundaryDelay(nextBoundary(state.promotions, Date.now()), Date.now())
  if (delay != null) boundaryTimer = setTimeout(reapplyPromotions, delay)
}

function priceKey() {
  return state.products.map(p => `${p.price}:${p.promo?.id || ''}`).join()
}

/** La RLS solo devuelve las que corren o están dentro de su aviso. */
export async function loadPromotions() {
  if (!supabase) return
  try {
    const { data, error } = await withTimeout(
      supabase.from('promotions').select('*').eq('active', true).gt('ends_at', new Date().toISOString()),
      10000,
      'La carga de promociones'
    )
    if (error) throw error
    state.promotions = data || []
    writeJson(CACHE_KEY, state.promotions)
  } catch (err) {
    // Sin red se queda el cache; place_order cobra lo correcto y avisa si no cuadra
    if (import.meta.env.DEV) console.warn('Promociones:', err)
  }
  reapplyPromotions()
}

export const refreshPromotions = loadPromotions

export function getPromotions() {
  return state.promotions
}

// ── Admin ────────────────────────────────────────────────────────────────

async function adminCall(fn) {
  if (!supabase) return { error: { message: 'No hay conexión con la base de datos.' } }
  const access = await withTimeout(ensureAdminAccess(), 15000, 'La validación de permisos')
  if (!access.ok) return { error: access.error }
  try {
    return await withTimeout(fn(), 20000, 'El guardado')
  } catch (err) {
    return { error: err }
  }
}

export async function getAdminPromotions() {
  const { data, error } = await adminCall(() =>
    supabase.from('promotions').select('*').order('starts_at', { ascending: false }))
  if (error && import.meta.env.DEV) console.error('Error fetching promotions:', error)
  return data || []
}

async function afterAdminChange(result) {
  // El admin también es la tienda: que vea el efecto sin recargar
  if (!result.error) await loadPromotions()
  return result
}

export async function createPromotion(payload) {
  return afterAdminChange(await adminCall(() => supabase.from('promotions').insert(payload).select().single()))
}

export async function updatePromotion(id, payload) {
  return afterAdminChange(await adminCall(() => supabase.from('promotions').update(payload).eq('id', id)))
}

export async function deletePromotion(id) {
  return afterAdminChange(await adminCall(() => supabase.from('promotions').delete().eq('id', id)))
}

/** Al renombrar una categoría (products.type), las promos que la nombran la siguen. */
export async function renamePromotionCategory(oldName, newName) {
  const { data } = await adminCall(() =>
    supabase.from('promotions').select('id, categories').contains('categories', [oldName]))
  for (const row of data || []) {
    const categories = row.categories.map(c => (c === oldName ? newName : c))
    const { error } = await adminCall(() => supabase.from('promotions').update({ categories }).eq('id', row.id))
    if (error && import.meta.env.DEV) console.error('Promo al renombrar categoría:', error)
  }
  if (data?.length) await loadPromotions()
}
