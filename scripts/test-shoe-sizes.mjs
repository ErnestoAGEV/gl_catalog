// node scripts/test-shoe-sizes.mjs
import assert from 'node:assert/strict'
import { isShoeCategory, isPerfumeCategory, SHOE_SIZE_OPTIONS } from '../src/pages/admin/adminProductsData.js'

for (const t of ['Zapatos', 'Tenis', 'Botas', 'Calzado Dama', 'Sandalias', 'Huaraches'])
  assert.equal(isShoeCategory(t), true, t)
for (const t of ['Camisas', 'Pantalones', 'Perfumes', '', null])
  assert.equal(isShoeCategory(t), false, String(t))

// Un producto nunca cae en dos grupos a la vez
assert.equal(isShoeCategory('Perfumes') && isPerfumeCategory('Perfumes'), false)

assert.equal(SHOE_SIZE_OPTIONS[0], '22')
assert.equal(SHOE_SIZE_OPTIONS.at(-1), '31')
assert.ok(SHOE_SIZE_OPTIONS.includes('26.5'))

console.log('ok')
