import { state, emit, dispatchError, createStoreError } from './state.js'
import { STORAGE_KEYS } from '../utils/config.js'
import { readJson, writeJson } from '../utils/storage.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'
import { withTimeout } from '../utils/async.js'

const CACHE_KEY = 'gl_products_cache'
const CACHE_TIMESTAMP_KEY = 'gl_products_cache_timestamp'

/** Reescribe el caché local tras cada mutación; si no, al recargar se ve la lista vieja. */
function cacheProducts() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state.products))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (cacheError) {
    console.warn('Failed to cache products:', cacheError)
  }
}

/** Valida permisos de admin sin poder colgarse indefinidamente. */
function checkAdmin() {
  return withTimeout(ensureAdminAccess(), 15000, 'La validación de permisos')
}

let detectedOriginalPriceColumn = null

function mapRowToProduct(row) {
  if (detectedOriginalPriceColumn === null) {
    if ('originalPrice' in row) detectedOriginalPriceColumn = 'originalPrice'
    else if ('original_price' in row) detectedOriginalPriceColumn = 'original_price'
    else if ('originalprice' in row) detectedOriginalPriceColumn = 'originalprice'
  }

  const rawOriginalPrice = row.originalPrice ?? row.original_price ?? row.originalprice
  const originalPrice = (rawOriginalPrice != null && rawOriginalPrice !== '' && !isNaN(Number(rawOriginalPrice)))
    ? Number(rawOriginalPrice)
    : null

  return {
    ...row,
    id: row.id,
    name: row.name,
    price: Number(row.price),
    originalPrice,
    stock: row.stock,
    type: row.type,
    category: row.category,
    sizes: row.sizes || [],
    colors: row.colors || [],
    images: row.images && row.images.length > 0
      ? row.images
      : (row.image_url ? [row.image_url] : []),
    badge: row.badge,
  }
}

function mapProductToRow(p) {
  const origPriceVal = (p.originalPrice != null && p.originalPrice !== '' && !isNaN(Number(p.originalPrice)))
    ? Number(p.originalPrice)
    : null

  const row = {
    name: p.name,
    price: p.price,
    type: p.type,
    category: p.category || 'General',
    images: p.images || [],
    image_url: p.images?.[0] || null,
    sizes: p.sizes,
    colors: p.colors,
    stock: p.stock,
    badge: p.badge,
  }

  if (detectedOriginalPriceColumn) {
    row[detectedOriginalPriceColumn] = origPriceVal
  } else {
    row.originalPrice = origPriceVal
    row.original_price = origPriceVal
  }

  return row
}

export async function loadProducts() {
  const CACHE_TTL = 60 * 60 * 1000

  try {
    const cachedProducts = localStorage.getItem(CACHE_KEY)
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)

    if (cachedProducts && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp, 10)

      if (age < CACHE_TTL) {
        state.products = JSON.parse(cachedProducts)
        state.isLoading = false
        emit()

        loadProductsFromSupabase(true)
        return
      }
    }
  } catch (err) {
    console.warn('Cache read error:', err)
  }

  await loadProductsFromSupabase(false)
}

async function loadProductsFromSupabase(isBackgroundUpdate = false) {
  if (!supabase) {
    if (import.meta.env.DEV) console.error('Supabase client not initialized')
    if (!isBackgroundUpdate) {
      dispatchError('No se pudo conectar al catálogo. Verifica tu conexión e intenta de nuevo.')
      state.isLoading = false
      emit()
    }
    return
  }

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: La conexión a Supabase tardó más de 10 segundos')), 10000)
  })

  try {
    const previousProductsJson = JSON.stringify(state.products)

    const result = await Promise.race([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      timeoutPromise
    ])

    const { data, error } = result

    if (error) throw error

    if (data) {
      const cartSizeBeforeCleanup = state.cart.length
      state.products = data.map(mapRowToProduct)
      state.isLoading = false

      cacheProducts()

      const validProductIds = new Set(state.products.map(p => p.id))
      state.cart = state.cart.filter(item => validProductIds.has(item.productId))

      if (state.cart.length !== cartSizeBeforeCleanup) {
        writeJson(STORAGE_KEYS.cart, state.cart)
      }

      const productsChanged = JSON.stringify(state.products) !== previousProductsJson
      const cartChanged = state.cart.length !== cartSizeBeforeCleanup
      if (!isBackgroundUpdate || productsChanged || cartChanged) {
        emit()
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error loading products:', err)
    if (!isBackgroundUpdate) {
      dispatchError('No se pudo cargar el catálogo. Revisa tu conexión a internet e intenta recargar la página.')
      state.isLoading = false
      emit()
    }
  }
}

export async function addProduct(product) {
  if (!supabase) {
    return { error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const access = await checkAdmin()
  if (!access.ok) return { error: access.error }

  const row = mapProductToRow(product)

  const insert = (payload) => withTimeout(
    supabase.from('products').insert(payload).select().single(),
    20000,
    'El guardado'
  )

  const executeInsert = async (payload) => {
    try {
      return await insert(payload)
    } catch (e) {
      if (e.name === 'AbortError' || e.message?.includes('aborted')) {
        await new Promise(r => setTimeout(r, 250))
        return await insert(payload)
      }
      throw e
    }
  }

  let { data, error } = await executeInsert(row)

  if (error && (error.message?.includes('aborted') || error.name === 'AbortError')) {
    await new Promise(r => setTimeout(r, 300))
    const retry = await executeInsert(row)
    data = retry.data
    error = retry.error
  }

  if (error && (error.message?.includes('original_price') || error.message?.includes('originalPrice') || error.message?.includes('originalprice') || error.code === 'PGRST204')) {
    delete row.original_price
    delete row.originalPrice
    delete row.originalprice
    const retry = await executeInsert(row)
    data = retry.data
    error = retry.error
  }

  if (error) {
    if (import.meta.env.DEV) console.error('Error creating product:', error)
    return { error }
  }

  const newProduct = mapRowToProduct(data)
  state.products.unshift(newProduct)
  cacheProducts()
  emit()
  return { success: true }
}

export async function updateProduct(id, updates) {
  if (!supabase) {
    return { error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const access = await checkAdmin()
  if (!access.ok) return { error: access.error }

  const row = mapProductToRow({ ...getProductById(id), ...updates })

  const update = (payload) => withTimeout(
    supabase.from('products').update(payload).eq('id', id),
    20000,
    'La actualización'
  )

  const executeUpdate = async (payload) => {
    try {
      return await update(payload)
    } catch (e) {
      if (e.name === 'AbortError' || e.message?.includes('aborted')) {
        await new Promise(r => setTimeout(r, 250))
        return await update(payload)
      }
      throw e
    }
  }

  let { error } = await executeUpdate(row)

  if (error && (error.message?.includes('aborted') || error.name === 'AbortError')) {
    await new Promise(r => setTimeout(r, 300))
    const retry = await executeUpdate(row)
    error = retry.error
  }

  if (error && (error.message?.includes('original_price') || error.message?.includes('originalPrice') || error.message?.includes('originalprice') || error.code === 'PGRST204')) {
    delete row.original_price
    delete row.originalPrice
    delete row.originalprice
    const retry = await executeUpdate(row)
    error = retry.error
  }

  if (error) {
    if (import.meta.env.DEV) console.error('Error updating product:', error)
    return { error }
  }

  const idx = state.products.findIndex(p => p.id === id)
  if (idx !== -1) {
    state.products[idx] = { ...state.products[idx], ...updates }
    cacheProducts()
    emit()
  }
  return { success: true }
}

export async function deleteProduct(id) {
  if (!supabase) {
    return { error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const access = await checkAdmin()
  if (!access.ok) return { error: access.error }

  const del = () => withTimeout(supabase.from('products').delete().eq('id', id), 20000, 'El borrado')

  let error
  try {
    const res = await del()
    error = res.error
  } catch (e) {
    if (e.name === 'AbortError' || e.message?.includes('aborted')) {
      await new Promise(r => setTimeout(r, 250))
      const retry = await del()
      error = retry.error
    } else {
      throw e
    }
  }

  if (error) {
    if (import.meta.env.DEV) console.error('Error deleting product:', error)
    return { error }
  }

  state.products = state.products.filter(p => p.id !== id)
  cacheProducts()
  emit()
  return { success: true }
}

export async function uploadProductImage(file) {
  if (!supabase) {
    return { error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const access = await checkAdmin()
  if (!access.ok) return { error: access.error }

  const safeName = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase()
  const fileName = `${Date.now()}-${safeName || 'image.jpg'}`

  const upload = () => withTimeout(
    supabase.storage.from('products').upload(fileName, file, { cacheControl: '3600', upsert: false }),
    60000,
    `La subida de ${file.name}`
  )

  let data, error
  try {
    const res = await upload()
    data = res.data
    error = res.error
  } catch (e) {
    if (e.name === 'AbortError' || e.message?.includes('aborted')) {
      await new Promise(r => setTimeout(r, 300))
      const retry = await upload()
      data = retry.data
      error = retry.error
    } else {
      throw e
    }
  }

  if (error) {
    if (import.meta.env.DEV) console.error('Error uploading image:', error)
    return { error }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(data.path)

  return { publicUrl }
}

export function getProductById(id) {
  return state.products.find((p) => p.id === id) || null
}

export function trackProductView(productId) {
  const views = readJson(STORAGE_KEYS.productViews, {})
  views[productId] = (views[productId] || 0) + 1
  writeJson(STORAGE_KEYS.productViews, views)
}

export function getProductViewCounts() {
  return readJson(STORAGE_KEYS.productViews, {})
}

export function getMostViewedProducts(limit = 4) {
  const views = getProductViewCounts()
  const products = state.products.filter(p => p.badge !== 'Borrador')

  const sorted = [...products].sort((a, b) => {
    const viewsA = views[a.id] || 0
    const viewsB = views[b.id] || 0
    return viewsB - viewsA
  })

  const hasViews = Object.keys(views).length > 0
  if (!hasViews) return sorted.slice(0, limit)

  const viewed = sorted.filter(p => (views[p.id] || 0) > 0)
  if (viewed.length >= limit) return viewed.slice(0, limit)

  const unviewed = sorted.filter(p => !(views[p.id] || 0))
  return [...viewed, ...unviewed].slice(0, limit)
}
