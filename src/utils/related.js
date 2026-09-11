/**
 * Productos relacionados: primero los de la misma categoria, luego el resto.
 *
 * Vive aparte porque lo usan dos sitios con datos de distinta forma: la ficha
 * del navegador, que recibe el producto ya mapeado, y el prerender del build,
 * que trabaja con la fila cruda de Supabase. Los campos que mira esta funcion
 * — id, type, badge — se llaman igual en las dos, asi que la seleccion es una
 * sola y no puede divergir entre lo que ve el usuario y lo que ve un crawler.
 */
export function relatedProducts(currentProduct, allProducts, limit = 4) {
  const candidates = allProducts.filter(p => p.id !== currentProduct.id && p.badge !== 'Borrador')
  const sameType = candidates.filter(p => p.type === currentProduct.type)
  const others = candidates.filter(p => p.type !== currentProduct.type)
  return [...sameType, ...others].slice(0, limit)
}
