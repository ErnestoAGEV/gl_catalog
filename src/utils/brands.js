/**
 * Marcas: indice, slug de URL y texto de apertura.
 *
 * La base no tiene columna de marca. El formulario del admin sí pide una, pero
 * la compone dentro del nombre ("Marca - Modelo"), así que la única fuente es
 * `productBrand()`, que además normaliza las tres grafías de Collor's.
 *
 * Lo usan el prerender del build y el catálogo del navegador. Una sola
 * definición a propósito: cuando la selección vive en dos sitios, tarde o
 * temprano un crawler y un comprador acaban viendo cosas distintas.
 */
import { productBrand, sizeSummary, sortSizes } from './productCopy.js'
import { safeDecode } from './sanitize.js'
import { isPerfumeCategory } from '../pages/admin/adminProductsData.js'

/** Mínimo de piezas para que una marca merezca página propia. */
export const MIN_PRODUCTOS_POR_MARCA = 4

export function brandSlug(brand) {
  return String(brand)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Marcas con página propia: solo ropa y solo con surtido suficiente.
 *
 * Los perfumes quedan fuera a propósito. El catálogo lista casas ajenas
 * (Versace, Carolina Herrera, Paco Rabanne…) y la tienda ya decidió que ese
 * tema se habla por WhatsApp y no en la página: una landing "Versace en
 * Colima" diría en un <h1> justo lo que se acordó no decir. Las marcas de
 * ropa que sí se distribuyen no tienen ese problema.
 */
export function brandIndex(products, min = MIN_PRODUCTOS_POR_MARCA) {
  const porMarca = new Map()
  for (const p of products) {
    if (p.badge === 'Borrador') continue
    if (isPerfumeCategory(p.type)) continue
    const marca = productBrand(p.name)
    if (!marca || marca === 'G&L') continue
    if (!porMarca.has(marca)) porMarca.set(marca, [])
    porMarca.get(marca).push(p)
  }

  return [...porMarca.entries()]
    .filter(([, items]) => items.length >= min)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, items]) => ({ name, slug: brandSlug(name), items }))
}

/** Resuelve el slug de la URL a su marca. Devuelve null si no tiene página. */
export function findBrandBySlug(products, slug, min = MIN_PRODUCTOS_POR_MARCA) {
  const buscado = brandSlug(safeDecode(slug || ''))
  return brandIndex(products, min).find((b) => b.slug === buscado) || null
}

/**
 * Texto propio de las dos marcas que la tienda maneja desde 2005, indexado por
 * brandSlug. Sale de las notas de mostrador de FAMILIES (productCopy.js) y de
 * los hechos que confirmó el dueño (nov 2026). Ninguna otra marca lleva años
 * ni "distribuidor oficial": no hay con qué respaldarlo.
 */
export const BRAND_COPY = {
  wrangler:
    'Ofrecemos Wrangler desde 2005. Contamos con los cortes Slim Fit y Regular, y con la línea ' +
    'Silver Edition, todos en mezclilla rígida de tejido cruzado: una tela resistente, pensada para ' +
    'el campo y la monta.',
  oggi:
    'Ofrecemos Oggi desde 2005. El Vaxter es el corte favorito de nuestros clientes: un recto slim ' +
    'disponible en mezclilla con stretch y en mezclilla rígida. El Power es el corte clásico, recto y ' +
    'de tiro alto; el Iron, el más entallado, de tiro corto. El Leader es de mezclilla, en corte loose, ' +
    'y los chinos forman la línea de vestir, en corte regular y Slim.',
}

// Como se nombra cada tipo en el parrafo: "pantalones" solo no dice "jeans",
// que es como se busca.
const typeLabel = (type) => (type === 'Pantalones' ? 'jeans y pantalones' : type.toLowerCase())

/**
 * Párrafo de apertura, armado con los datos reales igual que el de categoría:
 * cuántas piezas, de qué tipo, en qué tallas y a qué precio. Texto plano —
 * quien lo pinte se encarga de escaparlo.
 */
export function brandIntro(brand, items) {
  const tipos = [...new Set(items.map((p) => p.type).filter(Boolean))]
  // Una frase por tipo: juntas, la 30 de cintura y la M de camisa se leian como una sola escala.
  const tallas = tipos
    .map((t) => [t, sizeSummary(sortSizes(items.filter((p) => p.type === t).flatMap((p) => p.sizes || [])))])
    .filter(([, resumen]) => resumen)
    .map(([t, resumen]) => [t, resumen.replace(' a ', ' a la ')])
    .map(([t, resumen]) => (tipos.length === 1 ? `de la ${resumen}` : `${typeLabel(t)} de la ${resumen}`))
  const precios = items.map((p) => Number(p.price)).filter(Number.isFinite)

  const frases = BRAND_COPY[brandSlug(brand)] ? [BRAND_COPY[brandSlug(brand)]] : []
  frases.push(`Actualmente hay ${items.length} ${items.length === 1 ? 'pieza disponible' : 'piezas disponibles'} de ${brand}.`)
  if (tipos.length === 1) frases.push(`Toda la selección es de ${typeLabel(tipos[0])}.`)
  else if (tipos.length > 1) {
    const lista = tipos.slice(0, 4).map(typeLabel)
    frases.push(`Incluye ${lista.join(', ')}${tipos.length > 4 ? ` y ${tipos.length - 4} categorías más` : ''}.`)
  }
  if (tallas.length) frases.push(tipos.length === 1 ? `Tallas ${tallas[0]}.` : `Tallas: ${tallas.join('; ')}.`)
  if (precios.length) {
    const min = Math.min(...precios)
    const max = Math.max(...precios)
    frases.push(min === max ? `Precio: $${min} MXN.` : `Precios de $${min} a $${max} MXN.`)
  }
  frases.push('Enviamos a todo México en 3 a 4 días hábiles.')
  frases.push('Con gusto te confirmamos por WhatsApp la disponibilidad en cada sucursal.')
  return frases.join(' ')
}
