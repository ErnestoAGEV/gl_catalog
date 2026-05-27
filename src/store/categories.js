import { state, emit, createStoreError } from './state.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'

export async function loadCategories() {
  if (!supabase) return

  const CACHE_KEY = 'gl_categories_cache'
  const CACHE_TS_KEY = 'gl_categories_cache_ts'
  const CACHE_TTL = 60 * 60 * 1000

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const cacheTs = localStorage.getItem(CACHE_TS_KEY)
    if (cached && cacheTs && Date.now() - parseInt(cacheTs, 10) < CACHE_TTL) {
      state.categories = JSON.parse(cached)
      emit()
      loadCategoriesFromSupabase(true)
      return
    }
  } catch { /* ignore */ }

  await loadCategoriesFromSupabase(false)
}

async function loadCategoriesFromSupabase(isBackground = false) {
  if (!supabase) return
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) throw error
    if (data) {
      state.categories = data
      try {
        localStorage.setItem('gl_categories_cache', JSON.stringify(data))
        localStorage.setItem('gl_categories_cache_ts', Date.now().toString())
      } catch { /* ignore */ }
      if (!isBackground || JSON.stringify(state.categories) !== JSON.stringify(data)) {
        emit()
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error loading categories:', err)
  }
}

export function getCategories() {
  return state.categories
}

export function getActiveCategories() {
  return state.categories.filter(c => c.active)
}

export function getCategoryNames() {
  return state.categories.filter(c => c.active).map(c => c.name)
}

export async function addCategory(name) {
  if (!supabase) return { error: createStoreError('No hay conexión.', 'SUPABASE_UNAVAILABLE') }
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const maxOrder = state.categories.reduce((max, c) => Math.max(max, c.display_order || 0), 0)

  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), display_order: maxOrder + 1, active: true })
    .select()
    .single()
  if (error) return { error }

  state.categories.push(data)
  state.categories.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  emit()
  return { data }
}

export async function updateCategory(id, updates) {
  if (!supabase) return { error: createStoreError('No hay conexión.', 'SUPABASE_UNAVAILABLE') }
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const { error } = await supabase.from('categories').update(updates).eq('id', id)
  if (error) return { error }

  const idx = state.categories.findIndex(c => c.id === id)
  if (idx !== -1) {
    state.categories[idx] = { ...state.categories[idx], ...updates }
    state.categories.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  }
  emit()
  return { error: null }
}

export async function deleteCategory(id) {
  if (!supabase) return { error: createStoreError('No hay conexión.', 'SUPABASE_UNAVAILABLE') }
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error }

  state.categories = state.categories.filter(c => c.id !== id)
  emit()
  return { error: null }
}

export async function reorderCategories(orderedIds) {
  if (!supabase) return { error: createStoreError('No hay conexión.', 'SUPABASE_UNAVAILABLE') }
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const updates = orderedIds.map((id, i) => ({ id, display_order: i + 1 }))

  for (const u of updates) {
    const { error } = await supabase.from('categories').update({ display_order: u.display_order }).eq('id', u.id)
    if (error) return { error }
  }

  for (const u of updates) {
    const cat = state.categories.find(c => c.id === u.id)
    if (cat) cat.display_order = u.display_order
  }
  state.categories.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  emit()
  return { error: null }
}
