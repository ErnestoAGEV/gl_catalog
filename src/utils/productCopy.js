// Texto de producto derivado de los atributos reales (marca, tipo, color,
// tallas, precio). Modulo puro, sin DOM: lo usan routeSeo.js en runtime y
// scripts/prerender.mjs en build.
//
// Ningun producto de la base tiene descripcion propia todavia, y la meta
// description era la misma plantilla para los 235. Esto no sustituye a una
// descripcion escrita a mano —cuando el campo `description` tenga texto, ese
// gana— pero al menos cada producto dice algo distinto y util.

// Largo del id que se pega al final del slug. 8 hex de un uuid v4 dan 4 mil
// millones de combinaciones: de sobra para 235 productos, y no hace falta que
// sea unico por si solo — el slug completo ya lo es.
const SHORT_ID_LENGTH = 8

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

// ── URL del producto ────────────────────────────────────────────────────────
//
// El uuid crudo no dice nada al que ve el link en WhatsApp ni a Google. El
// slug lleva marca, modelo y color, y termina con los primeros 8 caracteres
// del id.
//
// Ese sufijo no es decoracion: la URL se resuelve por el, no por el texto. Asi
// renombrar un producto desde el panel no rompe los links ya compartidos, y
// dos filas con el mismo nombre y color no colisionan.

/** "Oggi - Chinos 900" + ["Gris"] -> "oggi-chinos-900-gris" */
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function productSlug(product) {
  const shortId = String(product?.id || '').replace(/-/g, '').slice(0, SHORT_ID_LENGTH)
  const words = slugify([product?.name, ...(product?.colors || [])].join(' '))
  return words ? `${words}-${shortId}` : shortId
}

export function productPath(product) {
  return `/producto/${productSlug(product)}`
}

/**
 * Encuentra el producto de una ruta. Acepta el slug nuevo y el uuid completo
 * de las urls viejas: hay links de esos repartidos por conversaciones de
 * WhatsApp y tienen que seguir abriendo el producto.
 */
export function findProductByPath(products, segment) {
  const raw = String(segment || '').trim()
  if (!raw || !products?.length) return undefined

  const direct = products.find((p) => String(p.id) === raw)
  if (direct) return direct

  const shortId = raw.split('-').pop()
  if (!shortId) return undefined
  return products.find(
    (p) => String(p.id).replace(/-/g, '').slice(0, SHORT_ID_LENGTH) === shortId
  )
}

// ── Imagen para la preview de WhatsApp / Facebook ───────────────────────────
//
// El CDN sirve las fotos en webp (`?f=webp`), y ni WhatsApp ni Facebook
// renderizan webp en la preview de un link: la descartan y muestran lo que
// tuvieran cacheado. Para og:image se les pide la misma foto en jpg.
//
// Google si lee webp, asi que el JSON-LD y los <img> de la pagina se quedan
// como estan — esto es solo para el meta tag.

const SOCIAL_FALLBACK = '/heroeGL.jpg'
const SITE_URL = 'https://www.glboutique.com.mx'

export function socialImage(...urls) {
  for (const url of urls.flat()) {
    if (!url) continue
    const absolute = new URL(url, SITE_URL)
    // El CDN de la tienda sirve webp por defecto; la misma foto en jpg existe.
    if (absolute.searchParams.get('f') === 'webp') {
      absolute.searchParams.set('f', 'jpg')
      absolute.searchParams.set('s', 'large')
      return absolute.toString()
    }
    // Un webp que no se puede convertir se salta: mejor la siguiente foto del
    // producto que una imagen que no es del producto.
    if (/\.webp$/i.test(absolute.pathname)) continue
    return absolute.toString()
  }
  return `${SITE_URL}${SOCIAL_FALLBACK}`
}
