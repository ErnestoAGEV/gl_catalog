// relatedProducts: la ficha del navegador y el prerender del build comparten
// este selector. Si divergieran, un crawler veria enlaces distintos a los del
// comprador — justo el tipo de desajuste que rompio las categorias.
import assert from 'node:assert/strict'
import { relatedProducts } from '../src/utils/related.js'

const catalogo = [
  { id: 1, name: 'Camisa A', type: 'Camisas' },
  { id: 2, name: 'Camisa B', type: 'Camisas' },
  { id: 3, name: 'Pantalon A', type: 'Pantalones' },
  { id: 4, name: 'Camisa C', type: 'Camisas', badge: 'Borrador' },
  { id: 5, name: 'Pantalon B', type: 'Pantalones' },
]

const actual = catalogo[0]

// Nunca se enlaza a si mismo ni a un borrador.
const todos = relatedProducts(actual, catalogo, 10)
assert.ok(!todos.some(p => p.id === actual.id), 'no se enlaza a si mismo')
assert.ok(!todos.some(p => p.badge === 'Borrador'), 'los borradores no salen')

// Primero su categoria, despues el resto.
assert.deepEqual(todos.map(p => p.id), [2, 3, 5])

// El limite se respeta y el orden no cambia al recortar.
assert.deepEqual(relatedProducts(actual, catalogo, 2).map(p => p.id), [2, 3])

// Un producto solo en su categoria sigue teniendo con que enlazar.
const solitario = { id: 9, name: 'Zapato', type: 'Zapatos' }
assert.equal(relatedProducts(solitario, [...catalogo, solitario], 6).length, 4)

// Catalogo de un solo producto: sin relacionados, y sin reventar.
assert.deepEqual(relatedProducts(actual, [actual], 6), [])

console.log('ok — related')
