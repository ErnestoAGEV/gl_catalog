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
import { productBrand, sizeSummary } from './productCopy.js'
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
  const buscado = brandSlug(decodeURIComponent(slug || ''))
  return brandIndex(products, min).find((b) => b.slug === buscado) || null
}

/**
 * Párrafo de apertura, armado con los datos reales igual que el de categoría:
 * cuántas piezas, de qué tipo, en qué tallas y a qué precio. Texto plano —
 * quien lo pinte se encarga de escaparlo.
 */
export function brandIntro(brand, items) {
  const tipos = [...new Set(items.map((p) => p.type).filter(Boolean))]
  const tallas = sizeSummary(
    [...new Set(items.flatMap((p) => p.sizes || []))].sort(
      (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0)
    )
  )
  const precios = items.map((p) => Number(p.price)).filter(Number.isFinite)

  const frases = [
    `${items.length} ${items.length === 1 ? 'pieza' : 'piezas'} de ${brand} en G&L Colima, ` +
      `con existencias en las dos tiendas.`,
  ]
  if (tipos.length === 1) frases.push(`Todo en ${tipos[0].toLowerCase()}.`)
  else if (tipos.length > 1) {
    const lista = tipos.slice(0, 4).map((t) => t.toLowerCase())
    frases.push(`Hay ${lista.join(', ')}${tipos.length > 4 ? ` y ${tipos.length - 4} categorías más` : ''}.`)
  }
  if (tallas) frases.push(`Tallas de la ${tallas}.`)
  if (precios.length) {
    const min = Math.min(...precios)
    const max = Math.max(...precios)
    frases.push(min === max ? `Precio: $${min} MXN.` : `Precios de $${min} a $${max} MXN.`)
  }
  frases.push('Pregunta por WhatsApp y te decimos qué hay en cada tienda.')
  return frases.join(' ')
}
