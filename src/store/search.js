import { state, emit } from './state.js'

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

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0.35)
    .slice(0, 5)
    .map((entry) => entry.product)
}
