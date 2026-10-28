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

// Como lo dice la gente: los jeans viven en "Pantalones" y ninguno se llama asi
const store = [
  { id: 10, name: 'Wrangler - Regular Fit WZWK', type: 'Pantalones' },
  { id: 11, name: 'Oggi - Pantalon Chino', type: 'Pantalones' },
  { id: 12, name: 'Jean Paul Gaultier - Le Male', type: 'Perfumes' },
  { id: 13, name: 'Rusty - Bermuda Slim', type: 'Shorts' },
  { id: 14, name: 'Carolina Herrera - Sport', type: 'Perfumes' },
  { id: 15, name: 'Paco Rabbane - One Million', type: 'Perfumes' },
  { id: 16, name: 'Soul&Blues - Camisa Negra', type: 'Camisas' },
  { id: 17, name: 'Dolce & Gabbana - Light Blue', type: 'Perfumes' },
  { id: 18, name: 'Collor’s - Cazadora', type: 'Suéteres' },
  { id: 19, name: 'White Peak - Negro', type: 'Polos', badge: 'Borrador' },
]
const find = (q, opts) => rankProducts(store, q, opts).map((p) => p.id)
// Sinonimo de categoria: primero los pantalones; el perfume "Jean" que lo dice tal cual, al final
assert.deepEqual(find('jeans').slice(0, 2).sort(), [10, 11])
assert.ok(!find('pantalones').includes(12)) // el sinonimo suelto en otra categoria es ruido
assert.deepEqual(find('bermudas'), [13])
assert.deepEqual(find('shorts'), [13])
assert.deepEqual(find('chamarra'), [18])
// "tenis" no es plural: con un producto que lo dice, igual trae la categoria
const shoes = [{ id: 1, name: 'Tenis Blanco', type: 'Zapatos' }, { id: 2, name: 'Bota 3732', type: 'Zapatos' }]
assert.deepEqual(rankProducts(shoes, 'tenis').map(p => p.id).sort(), [1, 2])
// Plural -> singular, y con error de dedo
assert.deepEqual(find('pantlones').sort(), [10, 11])
assert.deepEqual(find('vaqueros').sort(), [10, 11])
// Marcas y modelos mal escritos
assert.deepEqual(find('rangler'), [10])
assert.deepEqual(find('carolina herera'), [14])
assert.deepEqual(find('paco rabane'), [15])
assert.deepEqual(find('one milion'), [15])
assert.deepEqual(find('dolce gabana'), [17])
// Una palabra que existe no se "corrige": sport no se vuelve short
assert.deepEqual(find('sport'), [14])
// Ni a media palabra ("one" no esta en "pantalones") ni plural de marca ("blues" no es "blue")
assert.ok(!find('one').includes(10))
assert.ok(!find('soul blues').includes(17))
// El admin busca tambien entre borradores
assert.ok(!find('white peak').includes(19))
assert.deepEqual(find('white peak', { includeDrafts: true }), [19])

console.log('test-search ok')
