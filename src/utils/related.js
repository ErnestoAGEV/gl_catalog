/**
 * Productos relacionados: "Completa tu look".
 *
 * A una prenda de arriba le tocan primero pantalones, shorts y zapatos; a un
 * pantalon, camisas, polos y zapatos. Se intercalan por tipo para que no salgan
 * cuatro pantalones seguidos. Despues va su misma categoria y el resto, y los
 * perfumes al final (un perfume, en cambio, recomienda perfumes).
 *
 * Vive aparte porque lo usan dos sitios con datos de distinta forma: la ficha
 * del navegador, que recibe el producto ya mapeado, y el prerender del build,
 * que trabaja con la fila cruda de Supabase. Los campos que mira esta funcion
 * — id, type, badge — se llaman igual en las dos, asi que la seleccion es una
 * sola y no puede divergir entre lo que ve el usuario y lo que ve un crawler.
 */
import { isPerfumeCategory, isShoeCategory } from '../pages/admin/adminProductsData.js'

export function groupOf(type) {
  if (isPerfumeCategory(type)) return 'perfume'
  if (isShoeCategory(type)) return 'shoes'
  if (/pantal|short|bermuda|jean|chino/i.test(type || '')) return 'bottom'
  if (/camis|polo|player|su[eé]ter|sudader|chamarr|abrig|knit/i.test(type || '')) return 'top'
  return 'other'
}

const COMPLEMENTS = { top: ['bottom', 'shoes'], bottom: ['top', 'shoes'], shoes: ['bottom', 'top'] }

/** true si la seccion puede llamarse "Completa tu look" (hay con que combinar). */
export function isLookPairing(product) {
  return Boolean(COMPLEMENTS[groupOf(product?.type)])
}

// Uno de cada tipo por vuelta, en el orden en que aparecen los tipos
function interleaveByType(list) {
  const buckets = new Map()
  for (const p of list) {
    if (!buckets.has(p.type)) buckets.set(p.type, [])
    buckets.get(p.type).push(p)
  }
  const out = []
  const queues = [...buckets.values()]
  while (queues.some(q => q.length)) for (const q of queues) if (q.length) out.push(q.shift())
  return out
}

// Misma prenda en otro color: la base no tiene grupos, el nombre repetido es lo
// unico que los une (la misma clave que variantGroups en el prerender).
const sameName = (a, b) => {
  const name = String(a?.name || '').trim()
  return name !== '' && name === String(b?.name || '').trim()
}
// Local y no productBrand(): productCopy.js importa de aqui y seria un ciclo.
// Sin " - " en el nombre no hay marca.
const brandOf = (name) => {
  const text = String(name || '')
  return /\s*-\s*/.test(text) ? text.split(/\s*-\s*/)[0].trim() : ''
}
const sameBrandType = (a, b) => {
  const brand = brandOf(a?.name)
  return brand !== '' && brand === brandOf(b?.name) && a.type === b.type
}

/**
 * Relacionados de la ficha: (1) la misma prenda en otro color, (2) la misma
 * marca y tipo, y despues el orden de lookProducts. Antes 88 pantalones
 * recibian casi los mismos 6 enlaces.
 */
export function relatedProducts(currentProduct, allProducts, limit = 4) {
  const candidates = allProducts.filter(p => p.id !== currentProduct.id && p.badge !== 'Borrador')
  const colors = candidates.filter(p => sameName(p, currentProduct))
  const brand = candidates.filter(p => !sameName(p, currentProduct) && sameBrandType(p, currentProduct))
  const used = new Set([...colors, ...brand])
  const rest = lookProducts(currentProduct, candidates.filter(p => !used.has(p)), limit)
  return [...colors, ...brand, ...rest].slice(0, limit)
}

/** Titulo de la seccion segun lo que de verdad lista. */
export function relatedTitle(currentProduct, items) {
  const half = items.length / 2
  if (items.length && items.filter(p => sameName(p, currentProduct)).length >= half) return 'Otros colores'
  if (items.length && items.filter(p => sameName(p, currentProduct) || sameBrandType(p, currentProduct)).length >= half) {
    return `Más ${brandOf(currentProduct.name)}`
  }
  return isLookPairing(currentProduct) ? 'Completa tu look' : 'Más de la tienda'
}

/** "Completa tu look" puro: lo que combina, su categoria y el resto. Lo usa la bolsa. */
export function lookProducts(currentProduct, allProducts, limit = 4) {
  const candidates = allProducts.filter(p => p.id !== currentProduct.id && p.badge !== 'Borrador')
  const wanted = COMPLEMENTS[groupOf(currentProduct.type)] || []
  const pairs = interleaveByType(candidates.filter(p => wanted.includes(groupOf(p.type))))
  const sameType = candidates.filter(p => p.type === currentProduct.type)
  const used = new Set([...pairs, ...sameType])
  const rest = candidates.filter(p => !used.has(p))
  // Junto a ropa, los perfumes van al final
  const sortedRest = groupOf(currentProduct.type) === 'perfume'
    ? rest
    : [...rest.filter(p => groupOf(p.type) !== 'perfume'), ...rest.filter(p => groupOf(p.type) === 'perfume')]
  return [...pairs, ...sameType, ...sortedRest].slice(0, limit)
}
