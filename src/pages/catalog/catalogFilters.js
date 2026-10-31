// Filter utilities for the catalog page
import { getActiveCategories } from '../../store/index.js'
import { CATEGORY_ORDER_FALLBACK, sortByCategoryOrder } from '../../utils/categoryOrder.js'

// Desired display order for product categories in the catalog
// This is now dynamic from the database, with a hardcoded fallback
export { CATEGORY_ORDER_FALLBACK }

export function getCategoryOrder() {
  const dbCategories = getActiveCategories()
  if (dbCategories && dbCategories.length > 0) {
    return dbCategories.map(c => c.name)
  }
  return CATEGORY_ORDER_FALLBACK
}

export function uniqueSorted(values) {
  return Array.from(new Set(values)).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)))
}

export function getFilterState(root) {
  // With dual panels (desktop + mobile), gather the first non-empty value for each filter
  const getVal = (name) => {
    const els = root.querySelectorAll(`[name="${name}"]`)
    for (const el of els) { if (el.value) return el.value }
    return ''
  }
  const type = getVal('type')
  const size = getVal('size')
  const color = getVal('color')
  const minPrice = getVal('minPrice')
  const maxPrice = getVal('maxPrice')
  const sort = getVal('sort')

  return { type, size, color, minPrice: minPrice ? Number(minPrice) : null, maxPrice: maxPrice ? Number(maxPrice) : null, sort }
}

export function applyFilters(products, filters) {
  let result = products.filter((p) => {
    if (filters.type && p.type !== filters.type) return false
    if (filters.size && !(p.sizes || []).includes(filters.size)) return false
    if (filters.color && !(p.colors || []).includes(filters.color)) return false
    if (filters.minPrice != null && p.price < filters.minPrice) return false
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false
    return true
  })
  if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price)
  else if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price)
  // Default: group products by category in the defined display order (dynamic from DB)
  else result = sortByCategoryOrder(result, getCategoryOrder())
  return result
}
