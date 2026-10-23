import { state, emit } from './state.js'
import { rankProducts } from './searchRank.js'

export function setSearchQuery(query) {
  state.searchQuery = query
  emit()
}

export function getSearchQuery() {
  return state.searchQuery
}

export function searchProducts(query) {
  return rankProducts(state.products, query)
}
