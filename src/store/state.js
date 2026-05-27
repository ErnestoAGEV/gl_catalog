import { STORAGE_KEYS } from '../utils/config.js'
import { readJson } from '../utils/storage.js'

const VALID_THEMES = new Set(['light', 'dark'])

function getInitialTheme() {
  const savedTheme = readJson(STORAGE_KEYS.theme, 'light')
  return VALID_THEMES.has(savedTheme) ? savedTheme : 'light'
}

export const state = {
  products: [],
  categories: [],
  isLoading: true,
  cart: readJson(STORAGE_KEYS.cart, []),
  isAdminAuthed: false,
  wishlist: readJson(STORAGE_KEYS.wishlist, []),
  theme: getInitialTheme(),
  coupon: readJson(STORAGE_KEYS.coupon, null),
  newsletter: readJson(STORAGE_KEYS.newsletter, null),
  searchQuery: '',
}

const subscribers = new Set()

export function emit() {
  for (const fn of subscribers) fn(getState())
}

export function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function getState() {
  return {
    ...state,
    cart: [...state.cart],
    wishlist: [...state.wishlist],
    products: state.products,
    categories: state.categories,
  }
}

export function dispatchError(message) {
  window.dispatchEvent(new CustomEvent('gl:error', { detail: { message } }))
}

export function createStoreError(message, code = 'STORE_ERROR') {
  return { message, code }
}
