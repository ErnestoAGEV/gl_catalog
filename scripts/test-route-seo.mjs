// Titles y metas de categoria y marca. Lo que se prueba es lo que hace que
// compitan en busquedas nacionales: "jeans" en el title, marcas y rango de
// precio en la meta, y un solo canonical por marca.
import assert from 'node:assert/strict'
import { categoryLabel, clipMeta, getSeoForRoute } from '../src/core/routeSeo.js'

const p = (name, type, price, extra = {}) => ({ id: name, name, type, price, sizes: ['32'], ...extra })
const state = {
  isLoading: false,
  products: [
    p('Wrangler - Wrangler Slim Fit WBK', 'Pantalones', 760),
    p('Wrangler - Wrangler Slim Fit NAV', 'Pantalones', 850),
    p('Wrangler - Wrangler Regular Fit ZTN', 'Pantalones', 945),
    p('Wrangler - Camisa Logo Roja', 'Camisas', 650),
    p('Oggi - Vaxter Spring Stone', 'Pantalones', 800),
    p('Oggi - Leader Negro', 'Pantalones', 900),
    p('Wrangler - Borrador', 'Pantalones', 5000, { badge: 'Borrador' }),
    p('Versace - Eros', 'Perfumes', 1800),
    p('Carolina Herrera - 212', 'Perfumes', 2100),
  ],
}
const seo = (path) => getSeoForRoute(path, path, state)

assert.equal(categoryLabel('Pantalones'), 'Jeans y pantalones para hombre')
assert.equal(categoryLabel('Camisas'), 'Camisas para hombre')
assert.equal(categoryLabel('Perfumes Dama'), 'Perfumes Dama')

// ── categoria ──
const cat = seo('/categoria/Pantalones')
assert.equal(cat.title, 'Jeans y pantalones para hombre | G&L')
for (const t of ['Wrangler', 'Oggi', '$760', '$945', 'todo México']) assert.ok(cat.description.includes(t), cat.description)
assert.ok(!cat.description.includes('5,000') && !cat.description.includes('$5000'), 'el borrador no cuenta: ' + cat.description)
assert.ok(cat.description.length <= 160, cat.description)
// Wrangler (3) antes que Oggi (2): ordenadas por conteo
assert.ok(cat.description.indexOf('Wrangler') < cat.description.indexOf('Oggi'), cat.description)

// Perfumes: sin nombres de casas (decision en brands.js), solo precio
const perf = seo('/categoria/Perfumes')
assert.ok(!perf.description.includes('Versace') && !perf.description.includes('Carolina'), perf.description)
assert.ok(perf.description.includes('$1,800') && perf.description.includes('$2,100'), perf.description)

// Sin productos cargados: la meta de siempre, sin "De $Infinity"
const vacio = getSeoForRoute('/categoria/Camisas', '/categoria/Camisas', { products: [], isLoading: true })
assert.ok(!vacio.description.includes('Infinity') && vacio.description.includes('todo México'), vacio.description)

// ── marca ──
const wr = seo('/marca/wrangler')
assert.equal(wr.title, 'Jeans y camisas Wrangler para hombre | G&L')
assert.ok(wr.title.startsWith('Jeans'))
assert.ok(wr.title.length <= 60)
assert.ok(wr.description.startsWith('4 piezas de Wrangler'), wr.description)
assert.ok(wr.description.includes('$650') && wr.description.includes('$945') && wr.description.includes('todo México'), wr.description)
assert.ok(wr.description.length <= 160, wr.description)

// Un solo canonical por marca: /marca/Wrangler hidrata con el de /marca/wrangler
assert.equal(seo('/marca/Wrangler').canonicalPath, '/marca/wrangler')

// "jeans" solo para mezclilla: Oggi con Vaxter y chinos, White Peak sin mezclilla
const mezcla = (nombres) => ({ products: nombres.map((n, i) => ({ id: `x${i}`, name: n, type: 'Pantalones', price: 500 })), isLoading: false })
const og = getSeoForRoute('/marca/oggi', '/marca/oggi', mezcla(['Oggi - Vaxter Azul', 'Oggi - Vaxter Negro', 'Oggi - Chinos 900', 'Oggi - Chinos Slim']))
assert.equal(og.title, 'Jeans y pantalones Oggi para hombre | G&L')
assert.ok(og.description.includes('jeans y pantalones'), og.description)
const wp = getSeoForRoute('/marca/white-peak', '/marca/white-peak', mezcla(['White Peak - Pantalon A', 'White Peak - Pantalon B', 'White Peak - Pantalon C', 'White Peak - Pantalon D']))
assert.ok(!/jeans/i.test(wp.title + wp.description), wp.title)

// Descripcion propia larga: se corta en una frase, nunca pasa de 160
const larga = 'Primera frase del producto con detalle. ' + 'Texto que sigue y sigue sin parar. '.repeat(30)
const corta = clipMeta(larga)
assert.ok(corta.length <= 160 && corta.endsWith('.'), corta)
assert.equal(clipMeta('Corta.'), 'Corta.')

console.log('ok — route seo')
