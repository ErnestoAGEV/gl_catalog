// Existencias. Una sola definicion, porque estaba copiada en cuatro archivos
// con matices distintos y el prerender la tenia al reves: publicaba
// `OutOfStock` para 209 de 235 productos.
//
// La regla del negocio es que la tienda no lleva inventario por prenda. Por eso
// el campo `stock` vacio significa ilimitado —el formulario de admin tiene `∞`
// de placeholder— y solo un numero explicito limita. Un 0 escrito a mano es la
// unica forma de decir "agotado".

const INFINITE = '∞' // ∞

export function isInfiniteStock(stock) {
  return stock === undefined || stock === null || stock === '' || stock === INFINITE
}

/** ¿Se puede comprar? Vacio = si; un numero, solo si queda algo. */
export function isInStock(product) {
  return isInfiniteStock(product?.stock) || Number(product?.stock) > 0
}
