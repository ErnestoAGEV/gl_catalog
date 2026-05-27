import { state, emit } from './state.js'
import { STORAGE_KEYS } from '../utils/config.js'
import { writeJson } from '../utils/storage.js'
import { getProductById } from './products.js'

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
