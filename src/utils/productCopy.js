// Texto de producto derivado de los atributos reales (marca, tipo, color,
// tallas, precio). Modulo puro, sin DOM: lo usan routeSeo.js en runtime y
// scripts/prerender.mjs en build.
//
// Ningun producto de la base tiene descripcion propia todavia, y la meta
// description era la misma plantilla para los 235. Esto no sustituye a una
// descripcion escrita a mano —cuando el campo `description` tenga texto, ese
// gana— pero al menos cada producto dice algo distinto y util.

const TYPE_SINGULAR = {
  Camisas: 'Camisa',
  Polos: 'Polo',
  Pantalones: 'Pantalón',
  Shorts: 'Short',
  Playeras: 'Playera',
  Perfumes: 'Perfume',
  'Perfumes Dama': 'Perfume',
}

// Las fragancias guardan la presentacion ("100 ml") en el campo de tallas
const isFragrance = (type) => String(type || '').startsWith('Perfume')

const LETTER_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

const MAX_LENGTH = 158

/** "Oggi - Chinos 900" -> "Oggi". 228 de 235 productos siguen ese formato. */
export function productBrand(name) {
  const brand = String(name || '').split(' - ')[0].trim()
  return brand || 'G&L'
}

export function typeSingular(type) {
  return TYPE_SINGULAR[type] || 'Prenda'
}

/**
 * Resume las tallas: numericas como rango ("30 a 40"), de letra en su orden
 * natural ("S a XL"), y cualquier otra cosa tal cual.
 */
export function sizeSummary(sizes) {
  const list = (sizes || []).map((s) => String(s).trim()).filter(Boolean)
  if (!list.length) return ''
  if (list.length === 1) return list[0]

  const numbers = list.map(Number)
  if (numbers.every((n) => Number.isFinite(n))) {
    const min = Math.min(...numbers)
    const max = Math.max(...numbers)
    return min === max ? String(min) : `${min} a ${max}`
  }

  const letters = list.filter((s) => LETTER_ORDER.includes(s.toUpperCase()))
  if (letters.length === list.length) {
    const sorted = [...letters].sort(
      (a, b) => LETTER_ORDER.indexOf(a.toUpperCase()) - LETTER_ORDER.indexOf(b.toUpperCase())
    )
    return `${sorted[0]} a ${sorted[sorted.length - 1]}`
  }

  return list.join(', ')
}

/** "Azul", "Azul y Negro", "Azul, Negro y Gris" */
export function colorPhrase(colors) {
  const list = (colors || []).map((c) => String(c).trim()).filter(Boolean)
  if (!list.length) return ''
  if (list.length === 1) return list[0]
  return `${list.slice(0, -1).join(', ')} y ${list[list.length - 1]}`
}

/**
 * Meta description y descripcion del schema. Va agregando datos mientras
 * quepan en MAX_LENGTH, para no cortar una frase a la mitad en el SERP.
 */
export function productDescription(product) {
  const own = String(product?.description || '').trim()
  if (own) return own

  const parts = []
  const singular = typeSingular(product?.type)
  const fragrance = isFragrance(product?.type)
  const audience = product?.type === 'Perfumes Dama' ? 'para dama' : 'para hombre'

  parts.push(`${product?.name}: ${singular.toLowerCase()} ${audience}`)

  const colors = colorPhrase(product?.colors)
  if (colors && !fragrance) parts.push(`en ${colors.toLowerCase()}`)

  let text = `${parts.join(' ')}.`

  const sizes = sizeSummary(product?.sizes)
  if (sizes) {
    const clause = fragrance ? ` Presentación ${sizes}.` : ` Tallas ${sizes}.`
    if (text.length + clause.length <= MAX_LENGTH) text += clause
  }

  const price = Number(product?.price)
  if (Number.isFinite(price) && price > 0) {
    const clause = ` $${price.toLocaleString('es-MX')} MXN.`
    if (text.length + clause.length <= MAX_LENGTH) text += clause
  }

  const tail = ' Envío a todo México desde Colima.'
  if (text.length + tail.length <= MAX_LENGTH) text += tail

  return text
}

/**
 * Title del SERP. Lleva el color porque 33 productos son la misma prenda en
 * varios colores, cada uno con su fila: sin el, 11 grupos comparten title y
 * compiten entre si. Ademas es como se busca ("chino Oggi negro").
 */
export function productTitle(product) {
  const singular = typeSingular(product?.type)
  const audience = product?.type === 'Perfumes Dama' ? 'dama' : 'hombre'
  const color = colorPhrase(product?.colors)
  const name = color ? `${product?.name} en ${color}` : product?.name
  return `${name} | ${singular} para ${audience} | G&L`
}
