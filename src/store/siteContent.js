import { state } from './state.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'

export async function getSiteContent() {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('section', { ascending: true })
      .order('display_order', { ascending: true })
    if (error) throw error
    return data || []
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error fetching site content:', err)
    return []
  }
}

export async function getSiteContentBySection(section) {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('section', section)
      .order('display_order', { ascending: true })
    if (error) throw error
    return data || []
  } catch (err) {
    if (import.meta.env.DEV) console.error(`Error fetching site content for section "${section}":`, err)
    return []
  }
}

export async function addSiteContent(payload) {
  if (!supabase) return { data: null, error: 'No hay conexion con la base de datos.' }

  const access = await ensureAdminAccess()
  if (!access.ok) return { data: null, error: access.error }

  try {
    const { data, error } = await supabase
      .from('site_content')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error adding site content:', err)
    return { data: null, error: err }
  }
}

export async function updateSiteContent(id, updates) {
  if (!supabase) return { data: null, error: 'No hay conexion con la base de datos.' }

  const access = await ensureAdminAccess()
  if (!access.ok) return { data: null, error: access.error }

  try {
    const { data, error } = await supabase
      .from('site_content')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error updating site content:', err)
    return { data: null, error: err }
  }
}

export async function deleteSiteContent(id) {
  if (!supabase) return { error: 'No hay conexion con la base de datos.' }

  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  try {
    const { error } = await supabase
      .from('site_content')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error deleting site content:', err)
    return { error: err }
  }
}

export async function reorderSiteContent(ids) {
  if (!supabase) return { error: 'No hay conexion con la base de datos.' }

  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const updates = ids.map((id, i) => ({ id, display_order: i + 1 }))

  for (const u of updates) {
    const { error } = await supabase
      .from('site_content')
      .update({ display_order: u.display_order })
      .eq('id', u.id)
    if (error) return { error }
  }

  return { error: null }
}

export async function uploadSiteImage(file) {
  if (!supabase) return { url: null, error: 'No hay conexion con la base de datos.' }

  const access = await ensureAdminAccess()
  if (!access.ok) return { url: null, error: access.error }

  const safeName = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase()
  const fileName = `${Date.now()}-${safeName || 'image.jpg'}`

  const { data, error } = await supabase.storage
    .from('site-content')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    if (import.meta.env.DEV) console.error('Error uploading site image:', error)
    return { url: null, error }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('site-content')
    .getPublicUrl(data.path)

  return { url: publicUrl, error: null }
}
