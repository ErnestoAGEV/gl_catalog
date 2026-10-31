// Orden "Destacados" del catalogo. Puro: lo usan el catalogo del navegador y
// scripts/prerender.mjs, que tiene que pintar la parrilla en el mismo orden para
// que el navegador reutilice las fotos ya bajadas en vez de pedir otro juego.

export const CATEGORY_ORDER_FALLBACK = [
  'Pantalones',
  'Perfumes',
  'Camisas',
  'Playeras',
  'Polos',
  'Shorts',
  'Sudaderas',
  'Suéteres',
  'Chamarras',
  'Abrigos'
]

/** Agrupa por categoria segun `order`; dentro de cada una conserva el orden recibido. */
export function sortByCategoryOrder(products, order) {
  const rank = (p) => {
    const i = order.indexOf(p.type)
    return i === -1 ? order.length : i
  }
  return [...products].sort((a, b) => rank(a) - rank(b))
}
