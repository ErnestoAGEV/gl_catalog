import { STORAGE_KEYS, ADMIN_CREDENTIALS, COUPONS } from './config.js'
import { readJson, writeJson } from './storage.js'

const subscribers = new Set()

const state = {
  products: [], // Empty initially, populated by Supabase
  isLoading: true, // Loading state
  cart: readJson(STORAGE_KEYS.cart, []),
  adminSession: readJson(STORAGE_KEYS.adminSession, null),
  wishlist: readJson(STORAGE_KEYS.wishlist, []),
  theme: 'light', // Always start in light mode
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
  // First load? Maybe show empty or verify if we want to show cached?
  // For now, fetch fresh.
  
  if (!supabase) {
    console.error('Supabase client not initialized')
    alert('ERROR: No se pudo conectar a la base de datos. Verifica tu archivo .env y las credenciales (VITE_SUPABASE_URL).')
    state.isLoading = false
    emit()
    return
  }

  // Create timeout promise that rejects after 10 seconds
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: La conexión a Supabase tardó más de 10 segundos')), 10000)
  })

  try {
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
      
      // Clean up cart: remove items that no longer exist in DB
      const validProductIds = new Set(state.products.map(p => p.id))
      const initialCartSize = state.cart.length
      state.cart = state.cart.filter(item => validProductIds.has(item.productId))
      
      if (state.cart.length !== initialCartSize) {
        writeJson(STORAGE_KEYS.cart, state.cart)
      }

      emit()
    }
  } catch (err) {
    console.error('Error loading products:', err)
    alert('ERROR DE RED: ' + err.message + '\n\nPosible causa: Firewall, antivirus, o red bloqueando Supabase.')
    state.isLoading = false
    emit()
  }
}

// Reemplaza saveProducts con métodos granulares
export async function addProduct(product) {
  const row = mapProductToRow(product)
  const { data, error } = await supabase.from('products').insert(row).select().single()
  
  if (error) {
    console.error('Error creating product:', error)
    return { error }
  }

  const newProduct = mapRowToProduct(data)
  state.products.unshift(newProduct)
  emit()
  return { success: true }
}

export async function updateProduct(id, updates) {
  const row = mapProductToRow({ ...getProductById(id), ...updates })
  const { error } = await supabase.from('products').update(row).eq('id', id)

  if (error) {
    console.error('Error updating product:', error)
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
  const { error } = await supabase.from('products').delete().eq('id', id)
  
  if (error) {
    console.error('Error deleting product:', error)
    return { error }
  }

  state.products = state.products.filter(p => p.id !== id)
  emit()
  return { success: true }
}

// Upload image to Supabase Storage
export async function uploadProductImage(file) {
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`
  const { data, error } = await supabase.storage
    .from('products')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading image:', error)
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
  return Boolean(state.adminSession && state.adminSession.ok)
}

export function adminLogin(user, pass) {
  const ok = user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass
  state.adminSession = ok ? { ok: true, at: Date.now() } : null
  writeJson(STORAGE_KEYS.adminSession, state.adminSession)
  emit()
  return ok
}

export function adminLogout() {
  state.adminSession = null
  writeJson(STORAGE_KEYS.adminSession, null)
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
export function applyCoupon(code, silent = false) {
  const normalizedCode = code.toUpperCase().trim()
  const coupon = COUPONS[normalizedCode]
  if (coupon) {
    state.coupon = { code: normalizedCode, ...coupon }
    writeJson(STORAGE_KEYS.coupon, state.coupon)
    if (!silent) emit()
    return { success: true, coupon: state.coupon }
  }
  return { success: false, error: 'Cupón no válido' }
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
export function subscribeNewsletter(email) {
  state.newsletter = { email, subscribedAt: Date.now() }
  writeJson(STORAGE_KEYS.newsletter, state.newsletter)
  emit()
  return true
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

export function searchProducts(query) {
  const q = query.toLowerCase().trim()
  if (!q) return state.products
  return state.products.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.type.toLowerCase().includes(q) ||
    p.colors.some(c => c.toLowerCase().includes(q))
  )
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
  const products = state.products

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
