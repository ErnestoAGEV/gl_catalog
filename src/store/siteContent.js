import { state, emit } from './state.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'
import { resizeForUpload } from '../utils/resizeImage.js'

const CACHE_KEY = 'gl_site_content_cache'
const CACHE_TS_KEY = 'gl_site_content_cache_ts'
const CACHE_TTL = 60 * 60 * 1000

function setSiteContent(rows) {
  if (JSON.stringify(rows) === JSON.stringify(state.siteContent)) return
  state.siteContent = rows
  state.siteContentRev++
  emit()
}

/**
 * Contenido de la home para la tienda. Con cache caliente pinta al instante y
 * refresca en segundo plano; son ~2 KB, una consulta por navegador por hora.
 */
export async function loadSiteContent() {
  if (!supabase) return
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const ts = Number(localStorage.getItem(CACHE_TS_KEY))
    if (cached) setSiteContent(JSON.parse(cached))
    if (cached && Date.now() - ts < CACHE_TTL) return
  } catch { /* cache corrupta: se ignora */ }

  const rows = await getSiteContent()
  if (!rows.length) return // un fallo de red no debe borrar lo que hay
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows))
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()))
  } catch { /* storage lleno: sin cache */ }
  setSiteContent(rows)
}

/** Tras editar en el admin: relee y actualiza la cache de este navegador. */
export async function refreshSiteContent() {
  try { localStorage.removeItem(CACHE_TS_KEY) } catch { /* sin storage */ }
  await loadSiteContent()
}

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

/** Varias filas en una sola peticion: o entran todas o ninguna (no deja secciones a medias). */
export async function addSiteContentRows(rows) {
  if (!supabase) return { data: null, error: 'No hay conexion con la base de datos.' }

  const access = await ensureAdminAccess()
  if (!access.ok) return { data: null, error: access.error }

  const { data, error } = await supabase.from('site_content').insert(rows).select()
  if (error && import.meta.env.DEV) console.error('Error adding site content rows:', error)
  return { data, error }
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

/** Sube una foto del contenido ya reducida (1400px JPEG) y devuelve sus medidas para evitar saltos de layout. */
export async function uploadSiteImage(original) {
  if (!supabase) return { url: null, error: 'No hay conexion con la base de datos.' }

  const access = await ensureAdminAccess()
  if (!access.ok) return { url: null, error: access.error }

  const file = await resizeForUpload(original)
  let w = null
  let h = null
  try {
    const bitmap = await createImageBitmap(file)
    w = bitmap.width
    h = bitmap.height
    bitmap.close?.()
  } catch { /* sin medidas: la home usa las del default */ }

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
      cacheControl: '31536000', // inmutable: el nombre lleva Date.now()
      upsert: false
    })

  if (error) {
    if (import.meta.env.DEV) console.error('Error uploading site image:', error)
    return { url: null, error }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('site-content')
    .getPublicUrl(data.path)

  return { url: publicUrl, w, h, error: null }
}
