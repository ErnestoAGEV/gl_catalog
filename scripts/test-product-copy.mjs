// node scripts/test-product-copy.mjs
import assert from 'node:assert/strict'
import {
  colorPhrase,
  productBrand,
  productDescription,
  productTitle,
  sizeSummary,
} from '../src/utils/productCopy.js'

// ── marca ──
assert.equal(productBrand('Oggi - Chinos 900'), 'Oggi')
assert.equal(productBrand('Dolce & Gabbana - K'), 'Dolce & Gabbana')
assert.equal(productBrand('Camisa lisa'), 'Camisa lisa', 'sin guion, el nombre completo')
assert.equal(productBrand(''), 'G&L', 'nombre vacio no rompe el schema')

// ── tallas ──
assert.equal(sizeSummary(['30', '32', '34', '36', '38', '40']), '30 a 40')
assert.equal(sizeSummary(['S', 'M', 'L', 'XL']), 'S a XL')
assert.equal(sizeSummary(['XL', 'S', 'M']), 'S a XL', 'ordena por talla, no alfabeticamente')
assert.equal(sizeSummary(['100 ml']), '100 ml', 'las fragancias traen presentacion aqui')
assert.equal(sizeSummary([]), '')
assert.equal(sizeSummary(['Unitalla']), 'Unitalla')
assert.equal(sizeSummary(['28', '28']), '28', 'min == max no imprime "28 a 28"')

// ── colores ──
assert.equal(colorPhrase(['Gris']), 'Gris')
assert.equal(colorPhrase(['Azul', 'Negro']), 'Azul y Negro')
assert.equal(colorPhrase(['Azul', 'Negro', 'Gris']), 'Azul, Negro y Gris')
assert.equal(colorPhrase([]), '')

// ── descripcion ──
const pantalon = {
  name: 'Oggi - Chinos 900',
  type: 'Pantalones',
  colors: ['Gris'],
  sizes: ['30', '32', '34', '36', '38', '40'],
  price: 570,
}
const d1 = productDescription(pantalon)
assert.ok(d1.includes('pantalón para hombre'), d1)
assert.ok(d1.includes('en gris'), d1)
assert.ok(d1.includes('Tallas 30 a 40'), d1)
assert.ok(d1.includes('$570 MXN'), d1)

const perfume = { name: 'Dolce & Gabbana - K', type: 'Perfumes', colors: [], sizes: ['100 ml'], price: 1550 }
const d2 = productDescription(perfume)
assert.ok(d2.includes('Presentación 100 ml'), d2)
assert.ok(!d2.includes('Tallas'), 'una fragancia no tiene tallas: ' + d2)
assert.ok(d2.includes('$1,550 MXN'), d2)

const dama = { name: 'Carolina Herrera - Good Girl', type: 'Perfumes Dama', sizes: ['100 ml'], price: 2100 }
assert.ok(productDescription(dama).includes('para dama'), 'Perfumes Dama no es "para hombre"')

// La descripcion propia gana siempre
assert.equal(
  productDescription({ ...pantalon, description: 'Chino de gabardina con caida recta.' }),
  'Chino de gabardina con caida recta.'
)

// ── cada producto dice algo distinto ──
// Era el problema de origen: 235 productos compartiendo la misma plantilla.
const catalogo = [
  pantalon,
  perfume,
  dama,
  { name: 'Nautica - Polo pique', type: 'Polos', colors: ['Azul'], sizes: ['S', 'M', 'L', 'XL'], price: 890 },
  { name: 'Nautica - Polo pique', type: 'Polos', colors: ['Rojo'], sizes: ['S', 'M', 'L'], price: 890 },
]
const descripciones = catalogo.map(productDescription)
assert.equal(new Set(descripciones).size, catalogo.length, 'hay descripciones repetidas')

// ── largo del SERP ──
for (const d of descripciones) {
  assert.ok(d.length <= 158, `descripcion de ${d.length} chars: ${d}`)
  assert.ok(d.endsWith('.'), `cortada a media frase: ${d}`)
}

// ── title ──
assert.equal(
  productTitle(pantalon),
  'Oggi - Chinos 900 en Gris | Pantalón para hombre | G&L'
)
assert.equal(
  productTitle(perfume),
  'Dolce & Gabbana - K | Perfume para hombre | G&L',
  'sin color, no cuelga un "en undefined"'
)

// Las 4 variantes de color del mismo chino no pueden compartir title: son
// paginas distintas compitiendo por la misma consulta.
const variantes = ['Gris', 'Negro', 'Beige', 'Azul'].map((c) =>
  productTitle({ ...pantalon, colors: [c] })
)
assert.equal(new Set(variantes).size, 4, 'variantes de color con title repetido')

console.log('ok — productCopy')
