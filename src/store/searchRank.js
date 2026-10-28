// Modulo puro (sin state ni import.meta): lo prueba scripts/test-search.mjs.

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

// Plural a singular, para que "pantalones" encuentre "Pantalon Outdoors" y
// "camisas" encuentre "Camisa Negra": pantalon-es, sueter-es, camisa-s, jean-s.
function stem(word) {
  if (word.length < 4) return word
  if (/[nrld]es$/.test(word)) return word.slice(0, -2)
  if (word.endsWith('s')) return word.slice(0, -1)
  return word
}

// Como lo dice la gente vs. como esta en el catalogo: los jeans viven en la
// categoria "Pantalones" y ninguno se llama "jeans". Todo en singular y sin acentos.
const SYNONYM_GROUPS = [
  ['pantalon', 'jean', 'denim', 'vaquero'],
  ['short', 'bermuda'],
  ['playera', 'camiseta', 'remera', 'tshirt', 't-shirt'],
  ['polo', 'chomba'],
  ['sueter', 'sweater', 'sudadera', 'hoodie', 'chamarra', 'chaqueta', 'cazadora', 'chaleco', 'jacket', 'abrigo'],
  ['zapato', 'calzado', 'bota', 'botin', 'huarache', 'tenis'],
  ['perfume', 'fragancia', 'locion', 'colonia', 'aroma'],
  ['dama', 'mujer'],
]
const SYNONYMS = new Map(SYNONYM_GROUPS.flatMap(group => group.map(word => [word, group])))

// Cuantas letras puede fallar una palabra: ninguna si es corta ("lee", "one").
const typoLimit = (word) => (word.length >= 7 ? 2 : word.length >= 4 ? 1 : 0)

// Palabras del catalogo a una o dos letras de la que se escribio: "rangler" ->
// wrangler, "herera" -> herrera, "rabane" -> rabbane. Solo se usa cuando la
// palabra no existe tal cual, asi "sport" no se vuelve "short".
function typoFixes(token, vocab) {
  const max = typoLimit(token)
  if (!max) return []
  return [...vocab].filter(word => Math.abs(word.length - token.length) <= max && levenshteinDistance(token, word) <= max)
}

// El grupo de sinonimos de la palabra (o de lo que se quiso escribir)
function synonymsOf(words, fuzzy) {
  for (const word of words) {
    // La palabra tal cual antes que su singular: "tenis" no es plural de "teni"
    if (SYNONYMS.has(word)) return SYNONYMS.get(word)
    if (SYNONYMS.has(stem(word))) return SYNONYMS.get(stem(word))
  }
  if (!fuzzy) return null
  for (const word of words) {
    const s = stem(word).length >= 4 ? stem(word) : word
    const max = typoLimit(s)
    if (!max) continue
    for (const [syn, group] of SYNONYMS) {
      if (Math.abs(syn.length - s.length) <= max && levenshteinDistance(s, syn) <= max) return group
    }
  }
  return null
}

// La palabra al inicio de una palabra del texto: "one" no esta en "pantalones",
// "polo" si esta en "polos".
function hasWord(text, word) {
  for (let i = text.indexOf(word); i !== -1; i = text.indexOf(word, i + 1)) {
    if (i === 0 || !/[a-z0-9]/.test(text[i - 1])) return true
  }
  return false
}

// Que se busca por cada palabra: el texto y sus sinonimos. El singular solo
// si la palabra no esta tal cual ("blues" de Soul&Blues no debe volverse
// "blue" y traer Light Blue); las correcciones solo si tampoco esta el singular.
function queryTerm(token, catalogText, vocab) {
  const words = [token]
  if (!hasWord(catalogText, token)) {
    if (hasWord(catalogText, stem(token))) words.push(stem(token))
    else words.push(stem(token), ...typoFixes(token, vocab))
  }
  const known = words.some(word => hasWord(catalogText, word))
  return { words, group: synonymsOf(words, !known) }
}

// 3 = el producto es de la categoria que se nombro ("jeans" -> Pantalones),
// 2 = trae la palabra, 1 = trae un sinonimo, 0 = nada
function termHit(term, meta) {
  if (term.group && term.group.some(word => hasWord(meta.type, word))) return 3
  if (term.words.some(word => hasWord(meta.joined, word))) return 2
  return term.group && term.group.some(word => hasWord(meta.joined, word)) ? 1 : 0
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

/** includeDrafts: el admin tambien busca entre los borradores */
export function rankProducts(products, query, { includeDrafts = false } = {}) {
  const q = normalizeSearchText(query)
  const activeProducts = includeDrafts ? products : products.filter(p => p.badge !== 'Borrador')
  if (!q) return activeProducts

  // Varias palabras: primero lo que trae todas ("polo negro" = polos negros),
  // luego lo que trae alguna. Dentro de cada grupo, lo que mejor coincide:
  // la categoria nombrada, luego la palabra tal cual, luego un sinonimo.
  const metas = activeProducts.map(getProductSearchMeta)
  const catalogText = metas.map(m => m.joined).join(' ')
  const vocab = new Set(catalogText.split(/[^a-z0-9]+/).filter(w => w.length >= 3))
  const tokens = q.split(/\s+/).filter(Boolean)
  const terms = tokens.map(t => queryTerm(t, catalogText, vocab))
  // Si la palabra nombra una categoria que existe, los sinonimos sueltos en
  // otros productos son ruido: "pantalones" no debe traer el perfume Jean Paul.
  const categoryIntent = terms.map(term => metas.some(meta => termHit(term, meta) === 3))

  const scored = activeProducts.map((product, i) => {
    const meta = metas[i]
    const directMatch = meta.searchable.some((field) => hasWord(field, q))
    const hits = terms.map((term, k) => {
      const hit = termHit(term, meta)
      return categoryIntent[k] && hit === 1 ? 0 : hit
    })
    const tier = directMatch || hits.every(Boolean) ? 2 : hits.some(Boolean) ? 1 : 0
    const strength = hits.reduce((a, h) => a + h, 0)
    const score = getSimilarityScore(q, meta)
    return { product, tier, strength, score }
  })


  const matches = scored
    .filter((entry) => entry.tier > 0)
    .sort((a, b) => b.tier - a.tier || b.strength - a.strength || b.score - a.score)
    .map((entry) => entry.product)

  if (matches.length > 0) return matches

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0.35)
    .slice(0, 5)
    .map((entry) => entry.product)
}
