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

export function relatedProducts(currentProduct, allProducts, limit = 4) {
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
