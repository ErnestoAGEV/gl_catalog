import { state, emit, dispatchError, createStoreError } from './state.js'
import { STORAGE_KEYS } from '../utils/config.js'
import { readJson, writeJson } from '../utils/storage.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'

function mapRowToProduct(row) {
  return {
    ...row,
    id: row.id,
    name: row.name,
    price: Number(row.price),
    originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
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
  return {
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
}

export async function loadProducts() {
  const CACHE_KEY = 'gl_products_cache'
  const CACHE_TIMESTAMP_KEY = 'gl_products_cache_timestamp'
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
    const previousCartSize = state.cart.length

    const result = await Promise.race([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      timeoutPromise
    ])

    const { data, error } = result

    if (error) throw error

    if (data) {
      state.products = data.map(mapRowToProduct)
      state.isLoading = false

      try {
        localStorage.setItem('gl_products_cache', JSON.stringify(state.products))
        localStorage.setItem('gl_products_cache_timestamp', Date.now().toString())
      } catch (cacheError) {
        console.warn('Failed to cache products:', cacheError)
      }

      const validProductIds = new Set(state.products.map(p => p.id))
      const initialCartSize = state.cart.length
      state.cart = state.cart.filter(item => validProductIds.has(item.productId))

      if (state.cart.length !== initialCartSize) {
        writeJson(STORAGE_KEYS.cart, state.cart)
      }

      const productsChanged = JSON.stringify(state.products) !== previousProductsJson
      const cartChanged = state.cart.length !== previousCartSize
      if (!isBackgroundUpdate || productsChanged || cartChanged || state.isLoading) {
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

  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const row = mapProductToRow(product)
  const { data, error } = await supabase.from('products').insert(row).select().single()

  if (error) {
    if (import.meta.env.DEV) console.error('Error creating product:', error)
    return { error }
  }

  const newProduct = mapRowToProduct(data)
  state.products.unshift(newProduct)
  emit()
  return { success: true }
}

export async function updateProduct(id, updates) {
  if (!supabase) {
    return { error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const row = mapProductToRow({ ...getProductById(id), ...updates })
  const { error } = await supabase.from('products').update(row).eq('id', id)

  if (error) {
    if (import.meta.env.DEV) console.error('Error updating product:', error)
    return { error }
  }

  const idx = state.products.findIndex(p => p.id === id)
  if (idx !== -1) {
    state.products[idx] = { ...state.products[idx], ...updates }
    emit()
  }
  return { success: true }
}

export async function deleteProduct(id) {
  if (!supabase) {
    return { error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    if (import.meta.env.DEV) console.error('Error deleting product:', error)
    return { error }
  }

  state.products = state.products.filter(p => p.id !== id)
  emit()
  return { success: true }
}

export async function uploadProductImage(file) {
  if (!supabase) {
    return { error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  const safeName = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase()
  const fileName = `${Date.now()}-${safeName || 'image.jpg'}`
  const { data, error } = await supabase.storage
    .from('products')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

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
