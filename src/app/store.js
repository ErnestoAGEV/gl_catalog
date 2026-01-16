import { STORAGE_KEYS, ADMIN_CREDENTIALS, COUPONS } from './config.js'
import { readJson, writeJson } from './storage.js'

const subscribers = new Set()

const state = {
  products: readJson(STORAGE_KEYS.products, []),
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

export function loadProducts() {
  state.products = readJson(STORAGE_KEYS.products, [])
  emit()
}

export function saveProducts(products) {
  state.products = products
  writeJson(STORAGE_KEYS.products, products)
  emit()
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
export function toggleWishlist(productId) {
  const idx = state.wishlist.indexOf(productId)
  if (idx === -1) {
    state.wishlist.push(productId)
  } else {
    state.wishlist.splice(idx, 1)
  }
  writeJson(STORAGE_KEYS.wishlist, state.wishlist)
  emit()
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
