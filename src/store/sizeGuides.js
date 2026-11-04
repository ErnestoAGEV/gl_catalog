import { state, emit, createStoreError } from './state.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'

// Mismo patron que categories.js: cache de 1 h y refresco en segundo plano.
const CACHE_KEY = 'gl_size_guides_cache'
const CACHE_TS_KEY = 'gl_size_guides_cache_ts'
const CACHE_TTL = 60 * 60 * 1000

/** Fila de la base -> SizeGuide, con arreglos aunque vengan nulos. */
function toGuide(row) {
  return {
    id: row.id,
    brand: row.brand || '',
    type: row.type || '',
    cut: row.cut || '',
    columns: Array.isArray(row.columns) ? row.columns.map(String) : [],
    rows: Array.isArray(row.rows)
      ? row.rows.map(r => ({ size: String(r?.size ?? ''), values: Array.isArray(r?.values) ? r.values.map(v => String(v ?? '')) : [] }))
      : [],
    note: row.note || null,
  }
}

function writeCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state.sizeGuides))
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString())
  } catch { /* ignore */ }
}

export async function loadSizeGuides() {
  if (!supabase) return
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const cacheTs = localStorage.getItem(CACHE_TS_KEY)
    if (cached && cacheTs && Date.now() - parseInt(cacheTs, 10) < CACHE_TTL) {
      state.sizeGuides = JSON.parse(cached).map(toGuide)
      emit()
      loadFromSupabase(true)
      return
    }
  } catch { /* ignore */ }
  await loadFromSupabase(false)
}

async function loadFromSupabase(isBackground) {
  try {
    const previousJson = isBackground ? JSON.stringify(state.sizeGuides) : null
    const { data, error } = await supabase.from('size_guides').select('*').order('brand')
    if (error) throw error
    state.sizeGuides = (data || []).map(toGuide)
    writeCache()
    if (!isBackground || JSON.stringify(state.sizeGuides) !== previousJson) emit()
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error loading size guides:', err)
  }
}

export function getSizeGuides() {
  return state.sizeGuides
}

const toRow = (g) => ({
  brand: String(g.brand || '').trim(),
  type: g.type,
  cut: String(g.cut || '').trim(),
  columns: g.columns,
  rows: g.rows,
  note: String(g.note || '').trim() || null,
})

export async function addSizeGuide(guide) {
  if (!supabase) return { error: createStoreError('No hay conexión.', 'SUPABASE_UNAVAILABLE') }
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const { data, error } = await supabase.from('size_guides').insert(toRow(guide)).select().single()
  if (error) return { error }
  state.sizeGuides = [...state.sizeGuides, toGuide(data)]
  writeCache()
  emit()
  return { data: toGuide(data) }
}

export async function updateSizeGuide(id, guide) {
  if (!supabase) return { error: createStoreError('No hay conexión.', 'SUPABASE_UNAVAILABLE') }
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const { data, error } = await supabase.from('size_guides').update(toRow(guide)).eq('id', id).select().single()
  if (error) return { error }
  state.sizeGuides = state.sizeGuides.map(g => (g.id === id ? toGuide(data) : g))
  writeCache()
  emit()
  return { error: null }
}

export async function deleteSizeGuide(id) {
  if (!supabase) return { error: createStoreError('No hay conexión.', 'SUPABASE_UNAVAILABLE') }
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const { error } = await supabase.from('size_guides').delete().eq('id', id)
  if (error) return { error }
  state.sizeGuides = state.sizeGuides.filter(g => g.id !== id)
  writeCache()
  emit()
  return { error: null }
}
