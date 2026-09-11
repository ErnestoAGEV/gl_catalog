// Páginas de marca. Lo que se prueba aquí es lo que puede romper en silencio:
// que el slug de la URL resuelva a la marca correcta, y que los perfumes no
// generen página — el catálogo lista casas ajenas y ese tema se habla por
// WhatsApp, no en un <h1>.
import assert from 'node:assert/strict'
import { brandSlug, brandIndex, findBrandBySlug, brandIntro } from '../src/utils/brands.js'

assert.equal(brandSlug('Wrangler'), 'wrangler')
assert.equal(brandSlug("Collor's"), 'collor-s')
assert.equal(brandSlug('Soul&Blues'), 'soul-blues')
assert.equal(brandSlug('Limón Silvestre'), 'limon-silvestre')

const p = (name, type, extra = {}) => ({ id: name, name, type, price: 500, sizes: ['30', '32'], ...extra })

const catalogo = [
  ...Array.from({ length: 5 }, (_, i) => p(`Wrangler - Jean ${i}`, 'Pantalones')),
  ...Array.from({ length: 4 }, (_, i) => p(`Versace - Eros ${i}`, 'Perfumes')),
  ...Array.from({ length: 3 }, (_, i) => p(`Lobo Solo - Bota ${i}`, 'Zapatos')),
  p('Wrangler - Camisa borrador', 'Camisas', { badge: 'Borrador' }),
]

const idx = brandIndex(catalogo)

// Solo Wrangler llega al minimo de piezas de ropa.
assert.deepEqual(idx.map(b => b.slug), ['wrangler'])

// Un perfume no genera pagina aunque pase el minimo.
assert.ok(!idx.some(b => b.name === 'Versace'), 'los perfumes no llevan pagina de marca')

// Los borradores no cuentan para el minimo ni aparecen.
assert.equal(idx[0].items.length, 5)

// El slug de la URL resuelve a su marca, y uno inventado no.
assert.equal(findBrandBySlug(catalogo, 'wrangler').name, 'Wrangler')
assert.equal(findBrandBySlug(catalogo, 'WRANGLER').name, 'Wrangler', 'el slug no distingue mayusculas')
assert.equal(findBrandBySlug(catalogo, 'versace'), null)
assert.equal(findBrandBySlug(catalogo, 'no-existe'), null)

// El parrafo sale de los datos, no de una plantilla fija.
const intro = brandIntro('Wrangler', idx[0].items)
assert.ok(intro.includes('5 piezas'), intro)
assert.ok(intro.includes('Wrangler'), intro)
assert.ok(intro.includes('$500'), intro)

console.log('ok — brands')
