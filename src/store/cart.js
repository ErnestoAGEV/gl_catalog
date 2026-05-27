import { state, emit } from './state.js'
import { STORAGE_KEYS } from '../utils/config.js'
import { writeJson } from '../utils/storage.js'
import { getProductById } from './products.js'

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
