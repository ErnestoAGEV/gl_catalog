// node scripts/test-changed-columns.mjs
import assert from 'node:assert/strict'
import { changedColumns } from '../src/utils/changedColumns.js'

const row = { name: 'Bota', price: 850, images: ['a.jpg'], image_url: 'a.jpg', original_price: null, badge: 'Borrador', stock: null }

// El switch de publicar solo manda badge: precio y fotos del cache viejo no se tocan.
assert.deepEqual(changedColumns(row, { badge: '' }), { badge: 'Borrador' })

// images arrastra image_url y originalPrice su columna snake_case.
assert.deepEqual(changedColumns(row, { images: [], originalPrice: null }), { images: ['a.jpg'], image_url: 'a.jpg', original_price: null })

// Un campo presente aunque sea null se manda (vaciar el stock es un cambio).
assert.deepEqual(changedColumns(row, { stock: null }), { stock: null })

console.log('ok — changedColumns')
