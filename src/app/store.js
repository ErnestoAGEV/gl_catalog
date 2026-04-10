import { STORAGE_KEYS } from './config.js'
import { readJson, writeJson } from './storage.js'
import { sanitizeEmail, sanitizeCouponCode } from './sanitize.js'

const subscribers = new Set()
const VALID_THEMES = new Set(['light', 'dark'])

function getInitialTheme() {
  const savedTheme = readJson(STORAGE_KEYS.theme, 'light')
  return VALID_THEMES.has(savedTheme) ? savedTheme : 'light'
}

const state = {
  products: [], // Empty initially, populated by Supabase
  isLoading: true, // Loading state
  cart: readJson(STORAGE_KEYS.cart, []),
  isAdminAuthed: false, // Driven by Supabase session, not localStorage flag
  wishlist: readJson(STORAGE_KEYS.wishlist, []),
  theme: getInitialTheme(),
  coupon: readJson(STORAGE_KEYS.coupon, null),
  newsletter: readJson(STORAGE_KEYS.newsletter, null),
  searchQuery: '',
}

function emit() {
  for (const fn of subscribers) fn(getState())
}

export function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function getState() {
  return structuredClone(state)
}

import { supabase } from './supabase.js'

// Helper to map DB row -> App Product
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
    // Support both new 'images' array and old 'image_url' for backward compatibility
    images: row.images && row.images.length > 0 
      ? row.images 
      : (row.image_url ? [row.image_url] : []),
    badge: row.badge,
  }
}

// Helper to map App Product -> DB Row
function mapProductToRow(p) {
  return {
    name: p.name,
    price: p.price,
    type: p.type,
    category: p.category || 'General', // Fallback
    images: p.images || [], // Store array of images
    image_url: p.images?.[0] || null, // Keep first image for backward compatibility
    sizes: p.sizes,
    colors: p.colors,
    stock: p.stock,
    badge: p.badge,
    // created_at is handled by DB
  }
}

export async function loadProducts() {
  // Check for cached products first
  const CACHE_KEY = 'gl_products_cache'
  const CACHE_TIMESTAMP_KEY = 'gl_products_cache_timestamp'
  const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds
  
  try {
    const cachedProducts = localStorage.getItem(CACHE_KEY)
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    
    if (cachedProducts && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp, 10)
      
      if (age < CACHE_TTL) {
        // Cache is still fresh, use it
        state.products = JSON.parse(cachedProducts)
        state.isLoading = false
        emit()
        
        // Still fetch in background to update cache
        loadProductsFromSupabase(true)
        return
      }
    }
  } catch (err) {
    console.warn('Cache read error:', err)
  }
  
  // No cache or expired, load from Supabase
  await loadProductsFromSupabase(false)
}

function dispatchError(message) {
  window.dispatchEvent(new CustomEvent('gl:error', { detail: { message } }))
}

function createStoreError(message, code = 'STORE_ERROR') {
  return { message, code }
}

async function ensureAdminAccess() {
  if (!supabase) {
    return { ok: false, error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session) {
    if (state.isAdminAuthed) {
      state.isAdminAuthed = false
      emit()
    }
    return { ok: false, error: createStoreError('No autorizado', 'NOT_AUTHORIZED') }
  }

  const userId = data.session.user?.id
  if (!userId) {
    return { ok: false, error: createStoreError('No autorizado', 'NOT_AUTHORIZED') }
  }

  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (adminError) {
    if (import.meta.env.DEV) console.error('Admin access check failed:', adminError)
    return { ok: false, error: createStoreError('No se pudo validar permisos de administrador.', 'ADMIN_ACCESS_CHECK_FAILED') }
  }

  if (!adminUser) {
    return { ok: false, error: createStoreError('Tu usuario no está autorizado en admin_users.', 'NOT_ADMIN_USER') }
  }

  if (!state.isAdminAuthed) {
    state.isAdminAuthed = true
    emit()
  }

  return { ok: true }
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

  // Create timeout promise that rejects after 10 seconds
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: La conexión a Supabase tardó más de 10 segundos')), 10000)
  })

  try {
    const previousProductsJson = JSON.stringify(state.products)
    const previousCartSize = state.cart.length

    // Race between actual query and timeout
    const result = await Promise.race([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      timeoutPromise
    ])

    const { data, error } = result

    if (error) throw error

    if (data) {
      state.products = data.map(mapRowToProduct)
      state.isLoading = false
      
      // Save to cache
      try {
        localStorage.setItem('gl_products_cache', JSON.stringify(state.products))
        localStorage.setItem('gl_products_cache_timestamp', Date.now().toString())
      } catch (cacheError) {
        console.warn('Failed to cache products:', cacheError)
      }
      
      // Clean up cart: remove items that no longer exist in DB
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

// Reemplaza saveProducts con métodos granulares
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

  // Optimistic update locally
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

// Upload image to Supabase Storage
export async function uploadProductImage(file) {
  if (!supabase) {
    return { error: createStoreError('No hay conexión con la base de datos.', 'SUPABASE_UNAVAILABLE') }
  }

  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error }

  // Sanitize filename: remove accents/diacritics and non-ASCII chars (Supabase Storage rejects them)
  const safeName = file.name
    .normalize('NFD')                   // decompose accented chars (e.g. ñ → n + combining tilde)
    .replace(/[\u0300-\u036f]/g, '')    // strip combining diacritical marks
    .replace(/\s+/g, '-')              // spaces → hyphens
    .replace(/[^a-zA-Z0-9._-]/g, '')   // remove any remaining unsafe chars
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

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(data.path)

  return { publicUrl }
}

export function getProductById(id) {
  return state.products.find((p) => p.id === id) || null
}

export async function saveOrder(orderData) {
  if (!supabase) return { error: 'No hay conexión a la base de datos' }
  const { error } = await supabase.from('orders').insert(orderData)
  return { error }
}

export function addToCart({ productId, size, color, qty }) {
  const quantity = Math.max(1, Number(qty || 1))
  const key = `${productId}__${size || ''}__${color || ''}`

  const existing = state.cart.find((i) => i.key === key)
  if (existing) {
    existing.qty += quantity
  } else {
    state.cart.push({
      key,
      productId,
      size: size || '',
      color: color || '',
      qty: quantity,
    })
  }

  writeJson(STORAGE_KEYS.cart, state.cart)
  emit()
}

export function setCartItemQty(key, nextQty) {
  const item = state.cart.find((i) => i.key === key)
  if (!item) return
  item.qty = Math.max(1, Number(nextQty || 1))
  writeJson(STORAGE_KEYS.cart, state.cart)
  emit()
}

export function removeCartItem(key) {
  state.cart = state.cart.filter((i) => i.key !== key)
  writeJson(STORAGE_KEYS.cart, state.cart)
  emit()
}

export function clearCart() {
  state.cart = []
  writeJson(STORAGE_KEYS.cart, state.cart)
  emit()
}

export function cartCount() {
  return state.cart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
}

export function cartTotal() {
  return state.cart.reduce((acc, i) => {
    const product = getProductById(i.productId)
    const price = product?.price || 0
    return acc + price * (Number(i.qty) || 0)
  }, 0)
}

export function isAdminAuthed() {
  return state.isAdminAuthed
}

// Initialize admin session from Supabase on app startup (restores JWT if not expired)
export async function initAdminSession() {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  state.isAdminAuthed = Boolean(session)
  // Listen for future auth changes (token refresh, logout from another tab)
  supabase.auth.onAuthStateChange((_event, session) => {
    state.isAdminAuthed = Boolean(session)
    emit()
  })
  emit()
}

export async function adminLogin(email, pass) {
  if (!supabase) return { error: 'No hay conexión con la base de datos.' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
  if (error) return { error: error.message }
  state.isAdminAuthed = Boolean(data.session)
  emit()
  return { ok: true }
}

export async function adminLogout() {
  if (supabase) await supabase.auth.signOut()
  state.isAdminAuthed = false
  emit()
}

// ========== WISHLIST ==========
export function toggleWishlist(productId, silent = false) {
  const idx = state.wishlist.indexOf(productId)
  if (idx === -1) {
    state.wishlist.push(productId)
  } else {
    state.wishlist.splice(idx, 1)
  }
  writeJson(STORAGE_KEYS.wishlist, state.wishlist)
  if (!silent) emit()
}

export function isInWishlist(productId) {
  return state.wishlist.includes(productId)
}

export function getWishlistProducts() {
  return state.wishlist.map(id => getProductById(id)).filter(Boolean)
}

// ========== THEME ==========
export function getTheme() {
  return state.theme
}

export function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'
  writeJson(STORAGE_KEYS.theme, state.theme)
  emit()
  return state.theme
}

// ========== COUPONS ==========
export async function applyCoupon(code, silent = false) {
  const normalizedCode = sanitizeCouponCode(code)
  if (!normalizedCode) return { success: false, error: 'Código de cupón inválido' }
  if (!supabase) {
    return { success: false, error: 'No se pudo validar el cupón en este momento. Intenta de nuevo.' }
  }

  // Search un Supabase table "coupons"
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalizedCode)
    .eq('active', true)
    .single()

  if (error || !coupon) {
    return { success: false, error: 'Cupón no válido o expirado' }
  }

  // Format valid coupon
  state.coupon = { 
    code: coupon.code, 
    discount: Number(coupon.discount), 
    freeShipping: coupon.free_shipping,
    label: coupon.label 
  }
  
  writeJson(STORAGE_KEYS.coupon, state.coupon)
  if (!silent) emit()
  
  return { success: true, coupon: state.coupon }
}

export function removeCoupon(silent = false) {
  state.coupon = null
  writeJson(STORAGE_KEYS.coupon, null)
  if (!silent) emit()
}

export function getCoupon() {
  return state.coupon
}

export function getDiscountedTotal() {
  const subtotal = cartTotal()
  if (!state.coupon) return subtotal
  const discount = state.coupon.discount || 0
  return subtotal * (1 - discount)
}

// ========== NEWSLETTER ==========
export async function subscribeNewsletter(email) {
  const { value: normalizedEmail, valid } = sanitizeEmail(email)
  if (!valid) return { ok: false, error: 'El correo electrónico no es válido.' }

  // Always persist locally so UI shows "subscribed" immediately on reload
  state.newsletter = { email: normalizedEmail, subscribedAt: Date.now() }
  writeJson(STORAGE_KEYS.newsletter, state.newsletter)
  emit()

  // Persist to Supabase if available
  if (supabase) {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: normalizedEmail, source: 'home_page' })

    if (error) {
      // 23505 = unique_violation (email already registered) → treat as success
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

// ========== SEARCH ==========
export function setSearchQuery(query) {
  state.searchQuery = query
  emit()
}

export function getSearchQuery() {
  return state.searchQuery
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function levenshteinDistance(a, b) {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0))

  for (let i = 0; i < rows; i++) matrix[i][0] = i
  for (let j = 0; j < cols; j++) matrix[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[rows - 1][cols - 1]
}

function getProductSearchMeta(product) {
  const name = normalizeSearchText(product.name)
  const type = normalizeSearchText(product.type)
  const category = normalizeSearchText(product.category)
  const badge = normalizeSearchText(product.badge)
  const colors = (product.colors || []).map(normalizeSearchText)

  const searchable = [name, type, category, badge, ...colors].filter(Boolean)
  const joined = searchable.join(' ')

  return { name, type, category, badge, colors, searchable, joined }
}

function getSimilarityScore(query, productMeta) {
  const tokens = query.split(/\s+/).filter(Boolean)
  if (!tokens.length) return 0

  let score = 0

  if (productMeta.name === query) score += 3
  if (productMeta.name.includes(query)) score += 1.5
  if (productMeta.joined.includes(query)) score += 1

  for (const token of tokens) {
    if (productMeta.name.includes(token)) score += 0.75
    else if (productMeta.joined.includes(token)) score += 0.4

    // Typo-tolerant scoring against each word from name and related fields.
    const words = productMeta.joined.split(/\s+/).filter(Boolean)
    let bestWordSimilarity = 0
    for (const word of words) {
      const maxLen = Math.max(token.length, word.length)
      if (!maxLen) continue
      const dist = levenshteinDistance(token, word)
      const similarity = 1 - dist / maxLen
      if (similarity > bestWordSimilarity) bestWordSimilarity = similarity
    }
    score += bestWordSimilarity * 0.7
  }

  return score
}

export function searchProducts(query) {
  const q = normalizeSearchText(query)
  const activeProducts = state.products.filter(p => p.badge !== 'Borrador')
  if (!q) return activeProducts

  const scored = activeProducts.map((product) => {
    const meta = getProductSearchMeta(product)
    const directMatch = meta.searchable.some((field) => field.includes(q))
    const score = getSimilarityScore(q, meta)
    return { product, directMatch, score }
  })

  const directMatches = scored
    .filter((entry) => entry.directMatch)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product)

  if (directMatches.length > 0) return directMatches

  // If there is no direct match, return the closest product name candidates.
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0.35)
    .slice(0, 5)
    .map((entry) => entry.product)
}

// ========== PRODUCT VIEWS TRACKING ==========
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

  // Sort products by view count descending
  const sorted = [...products].sort((a, b) => {
    const viewsA = views[a.id] || 0
    const viewsB = views[b.id] || 0
    return viewsB - viewsA
  })

  // If no views exist yet, return first N products as fallback
  const hasViews = Object.keys(views).length > 0
  if (!hasViews) return sorted.slice(0, limit)

  // Only return products that have at least 1 view, padded with others if needed
  const viewed = sorted.filter(p => (views[p.id] || 0) > 0)
  if (viewed.length >= limit) return viewed.slice(0, limit)

  // Pad with unviewed products
  const unviewed = sorted.filter(p => !(views[p.id] || 0))
  return [...viewed, ...unviewed].slice(0, limit)
}

// ========== ADMIN QUERIES ==========
export async function getAdminOrders() {
  if (!supabase || !state.isAdminAuthed) return []

  const access = await ensureAdminAccess()
  if (!access.ok) return []

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error fetching admin orders:', err)
    return []
  }
}

export async function getAdminCoupons() {
  if (!supabase || !state.isAdminAuthed) return []

  const access = await ensureAdminAccess()
  if (!access.ok) return []

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error fetching admin coupons:', err)
    return []
  }
}

export async function createCoupon(payload) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }

  const { data, error } = await supabase
    .from('coupons')
    .insert(payload)
    .select()
    .single()
  if (error) {
    if (import.meta.env.DEV) console.error('Error creating coupon:', error)
    return { error }
  }
  return { data }
}

export async function updateCoupon(code, payload) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }

  const { error } = await supabase
    .from('coupons')
    .update(payload)
    .eq('code', code)
  if (error) {
    if (import.meta.env.DEV) console.error('Error updating coupon:', error)
    return { error }
  }
  return { error: null }
}

export async function deleteCoupon(code) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('code', code)
  if (error) {
    if (import.meta.env.DEV) console.error('Error deleting coupon:', error)
    return { error }
  }
  return { error: null }
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

export async function updateAdminOrderStatus(orderId, newStatus) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single()
      
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error updating order status:', err)
    return { error: err.message }
  }
}
