// node scripts/test-stock.mjs
import assert from 'node:assert/strict'
import { isInStock, isInfiniteStock } from '../src/utils/stock.js'

// La tienda no lleva inventario por prenda: el campo vacio es ilimitado, no
// agotado. Al reves —como lo tenia el prerender— publicaba OutOfStock en 209
// de 235 productos.
for (const vacio of [undefined, null, '', '∞']) {
  assert.equal(isInfiniteStock(vacio), true, `${JSON.stringify(vacio)} deberia ser ilimitado`)
  assert.equal(isInStock({ stock: vacio }), true, `${JSON.stringify(vacio)} deberia estar disponible`)
}

// Un numero si limita
assert.equal(isInStock({ stock: 3 }), true)
assert.equal(isInStock({ stock: 1 }), true)

// Y el 0 explicito es la unica forma de decir "agotado"
assert.equal(isInfiniteStock(0), false)
assert.equal(isInStock({ stock: 0 }), false)
assert.equal(isInStock({ stock: '0' }), false)

// Un producto sin el campo tampoco desaparece del catalogo
assert.equal(isInStock({}), true)
assert.equal(isInStock(undefined), true)

console.log('ok — stock')
