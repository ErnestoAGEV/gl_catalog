/**
 * Guias de tallas por corte. Una guia es de marca + tipo de prenda + corte
 * (opcional) y le toca sola a todo producto cuyo nombre empiece asi:
 * "Oggi · Vaxter" cubre "Oggi - Vaxter Gabardina Khaki" y cualquier Vaxter
 * que se de de alta despues. Ver docs/superpowers/specs/2026-11-03-guia-de-tallas-design.md
 */
import { productBrand, productModel } from './productCopy.js'
import { isPerfumeCategory, isShoeCategory } from '../pages/admin/adminProductsData.js'

const norm = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[`´‘’]/g, "'")
  .replace(/\s+/g, ' ')
  .trim()

const words = (s) => (norm(s) ? norm(s).split(' ') : [])

/** La guia que le toca al producto, o null. Gana la de corte mas largo. */
export function findSizeGuide(product, guides) {
  const name = String(product?.name || '')
  // Sin separador no hay marca: productBrand devolveria el nombre entero
  if (!name || productModel(name) === name.trim()) return null
  const brand = norm(productBrand(name))
  const model = words(productModel(name))

  let best = null
  let bestLen = -1
  for (const g of guides || []) {
    if (norm(g.brand) !== brand || g.type !== product.type) continue
    const cut = words(g.cut)
    if (cut.length > model.length || cut.some((w, i) => w !== model[i])) continue
    if (cut.length > bestLen) { best = g; bestLen = cut.length }
  }
  return best
}

export function guideRow(guide, size) {
  if (!guide || !size) return null
  return (guide.rows || []).find(r => String(r.size) === String(size)) || null
}

/** Pares etiqueta/valor de una talla, sin las celdas vacias. */
export function measuresFor(guide, size) {
  const row = guideRow(guide, size)
  if (!row) return []
  return (guide.columns || [])
    .map((label, i) => ({ label, value: String(row.values?.[i] ?? '').trim() }))
    .filter(m => m.value)
}

export function defaultColumns(type) {
  if (isPerfumeCategory(type)) return []
  if (isShoeCategory(type)) return ['Largo de plantilla']
  if (/pantal|short|bermuda/i.test(type || '')) return ['Cintura', 'Largo', 'Tiro']
  return ['Largo', 'Hombros', 'Pecho']
}

export function guideLabel(guide) {
  return `${guide.brand} · ${String(guide.cut || '').trim() || guide.type}`
}
