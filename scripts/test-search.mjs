// searchProducts: con varias palabras manda lo que las trae todas; sin acentos
// y con el respaldo difuso para errores de dedo.
import assert from 'node:assert/strict'
import { rankProducts } from '../src/store/searchRank.js'

const products = [
  { id: 1, name: 'Camisa Oxford', type: 'Camisas', colors: ['Negro'] },
  { id: 2, name: 'Polo Pique', type: 'Polos', colors: ['Blanco'] },
  { id: 3, name: 'Polo Slim', type: 'Polos', colors: ['Negro'] },
  { id: 4, name: 'Polo Borrador', type: 'Polos', colors: ['Negro'], badge: 'Borrador' },
  { id: 5, name: 'Pantalón Chino', type: 'Pantalones', colors: ['Beige'] },
]
const ids = (q) => rankProducts(products, q).map((p) => p.id)

// Las dos palabras primero; las parciales despues; el borrador nunca
assert.equal(ids('polo negro')[0], 3)
assert.deepEqual(ids('polo negro').sort(), [1, 2, 3])
assert.deepEqual(ids('negro polo').slice(0, 1), [3])
// Una palabra: igual que antes
assert.deepEqual(ids('polo').sort(), [2, 3])
// Acentos
assert.deepEqual(ids('pantalon'), [5])
assert.deepEqual(ids('PANTALÓN'), [5])
// Error de dedo: cae al difuso
assert.ok(ids('camsia').includes(1))

console.log('test-search ok')
