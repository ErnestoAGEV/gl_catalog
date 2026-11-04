// relatedProducts: la ficha del navegador y el prerender del build comparten
// este selector. Si divergieran, un crawler veria enlaces distintos a los del
// comprador — justo el tipo de desajuste que rompio las categorias.
//
// "Completa tu look": a una prenda de arriba le tocan pantalones y zapatos, a un
// pantalon camisas y polos. Un perfume recomienda perfumes.
import assert from 'node:assert/strict'
import { relatedProducts, isLookPairing } from '../src/utils/related.js'

const catalogo = [
  { id: 1, name: 'Camisa A', type: 'Camisas' },
  { id: 2, name: 'Camisa B', type: 'Camisas' },
  { id: 3, name: 'Pantalon A', type: 'Pantalones' },
  { id: 4, name: 'Camisa C', type: 'Camisas', badge: 'Borrador' },
  { id: 5, name: 'Pantalon B', type: 'Pantalones' },
  { id: 6, name: 'Polo A', type: 'Polos' },
  { id: 7, name: 'Bota A', type: 'Zapatos' },
  { id: 8, name: 'Eros', type: 'Perfumes' },
  { id: 9, name: 'Sauvage', type: 'Perfumes' },
]
const ids = (list) => list.map(p => p.id)

// Nunca se enlaza a si mismo ni a un borrador.
const camisa = catalogo[0]
const todos = relatedProducts(camisa, catalogo, 20)
assert.ok(!todos.some(p => p.id === camisa.id), 'no se enlaza a si mismo')
assert.ok(!todos.some(p => p.badge === 'Borrador'), 'los borradores no salen')

// Camisa: primero lo que combina (pantalones y zapatos, alternando), luego su
// misma categoria y las de arriba, y los perfumes al final.
assert.deepEqual(ids(relatedProducts(camisa, catalogo, 4)), [3, 7, 5, 2])
assert.deepEqual(ids(todos).slice(-2), [8, 9])

// Pantalon: camisas, polos y zapatos antes que otro pantalon.
const pantalon = catalogo[2]
assert.deepEqual(ids(relatedProducts(pantalon, catalogo, 3)), [1, 6, 7])

// Perfume: otros perfumes primero.
assert.deepEqual(ids(relatedProducts(catalogo[7], catalogo, 1)), [9])

// El limite se respeta y el orden no cambia al recortar.
assert.deepEqual(ids(relatedProducts(camisa, catalogo, 2)), [3, 7])

// Un producto solo en su categoria sigue teniendo con que enlazar.
const solitario = { id: 99, name: 'Tenis', type: 'Tenis' }
assert.equal(relatedProducts(solitario, [...catalogo, solitario], 4).length, 4)

// Catalogo de un solo producto: sin relacionados, y sin reventar.
assert.deepEqual(relatedProducts(camisa, [camisa], 6), [])

// El titulo de la seccion: "Completa tu look" solo cuando de verdad combina
assert.equal(isLookPairing(camisa), true)
assert.equal(isLookPairing(pantalon), true)
assert.equal(isLookPairing(catalogo[7]), false)

console.log('ok — related')
