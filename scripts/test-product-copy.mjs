// node scripts/test-product-copy.mjs
import assert from 'node:assert/strict'
import {
  colorPhrase,
  findProductByPath,
  productBrand,
  productDescription,
  fitNote,
  productPath,
  productSlug,
  productTitle,
  sizeSummary,
  socialImage,
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
assert.ok(d1.includes('chino de vestir'), d1)
assert.ok(d1.includes('en gris'), d1)
assert.ok(d1.includes('Tallas 30 a 40'), d1)
assert.ok(d1.includes('$570 MXN'), d1)

// Familia descrita por la tienda: su dato desplaza a la plantilla, y la nota
// larga sale entera para la pagina de producto.
assert.ok(d1.length <= 158, 'la meta se pasa de largo: ' + d1.length)
assert.ok(fitNote(pantalon).includes('línea de vestir de Oggi'), fitNote(pantalon))

// Familia sin describir: cae en la plantilla generica y no se inventa nada.
const generico = { ...pantalon, name: 'Marca Nueva - Modelo X' }
assert.ok(productDescription(generico).includes('pantalón para hombre'))
assert.strictEqual(fitNote(generico), '', 'sin familia no se inventa nota')

// El Gabarina va antes que el Vaxter general: si se invierte, gana el corte
// equivocado y la pagina dice mezclilla donde es gabardina.
assert.ok(fitNote({ name: 'Oggi - Vaxter Gabarina Khaki' }).includes('gabardina'))
assert.ok(fitNote({ name: 'Oggi - Vaxter Spring Ink' }).includes('mezclilla'))

// La descripcion propia de la base siempre gana.
assert.strictEqual(fitNote({ name: 'Oggi - Chinos 900', description: 'Texto propio.' }), 'Texto propio.')

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

// El title cede el medio antes que el nombre. Con un nombre de largo normal,
// eso basta para bajar de 60.
const largo = { ...pantalon, name: 'Soul&Blues - Outdoors Azul Marino', colors: ['Azul'] }
const titleLargo = productTitle(largo)
assert.ok(titleLargo.length <= 60, `title de ${titleLargo.length}: ${titleLargo}`)
assert.ok(titleLargo.startsWith(largo.name), 'el nombre nunca se recorta')
assert.ok(titleLargo.endsWith('| G&L'), 'la marca se queda')

// Cuando ni el nombre solo cabe, se queda el nombre: es lo que el comprador
// reconoce, y preferimos que Google corte la cola a cortar la marca.
const kilometrico = { ...pantalon, name: 'A'.repeat(70), colors: [] }
assert.equal(productTitle(kilometrico), `${'A'.repeat(70)} | G&L`)

// Si cabe entero, no se recorta nada
assert.equal(productTitle(perfume), 'Dolce & Gabbana - K | Perfume para hombre | G&L')

// ── slug de la url ──
const conId = { ...pantalon, id: 'ff60bff1-eaca-4eeb-a3ef-edfc3598bbc2' }
assert.equal(productSlug(conId), 'oggi-chinos-900-gris-ff60bff1')
assert.equal(productPath(conId), '/producto/oggi-chinos-900-gris-ff60bff1')
assert.ok(!/[^a-z0-9-]/.test(productSlug(conId)), 'el slug solo lleva minusculas, digitos y guiones')

// Acentos y simbolos no pueden acabar en la url
assert.equal(
  productSlug({ id: 'aabbccdd-0000-0000-0000-000000000000', name: 'Soul&Blues - Camisa Añil' }),
  'soul-blues-camisa-anil-aabbccdd'
)

// Renombrar un producto no puede romper el link ya compartido: se resuelve
// por el id del final, no por el texto.
const catalogoIds = [conId]
assert.equal(findProductByPath(catalogoIds, 'oggi-chinos-900-gris-ff60bff1')?.id, conId.id)
assert.equal(
  findProductByPath(catalogoIds, 'otro-nombre-cualquiera-ff60bff1')?.id,
  conId.id,
  'el slug viejo tiene que seguir resolviendo'
)
// Las urls con uuid repartidas por WhatsApp siguen abriendo el producto
assert.equal(findProductByPath(catalogoIds, conId.id)?.id, conId.id)
assert.equal(findProductByPath(catalogoIds, 'no-existe-00000000'), undefined)
assert.equal(findProductByPath([], 'lo-que-sea'), undefined)

// Los 4 duplicados de la base comparten nombre, color y precio: el id los separa
const gemelos = [
  { ...pantalon, id: '7876bdbc-3adc-4e14-8045-6f60fbe06547' },
  { ...pantalon, id: '92d18667-4f40-4ce6-9f6e-a0f934099d40' },
]
assert.equal(new Set(gemelos.map(productSlug)).size, 2, 'dos filas identicas comparten slug')

// ── imagen social ──
// WhatsApp no renderiza webp: la foto del CDN se pide en jpg
assert.equal(
  socialImage('https://assets.rediredi.com/items/images/abc.jpg?s=medium&f=webp'),
  'https://assets.rediredi.com/items/images/abc.jpg?s=large&f=jpg'
)
// Sin producto (home, info, 404) cae al jpg local, no al banner webp
assert.equal(socialImage(), 'https://www.glboutique.com.mx/heroeGL.jpg')
assert.equal(socialImage('/bannergl.webp'), 'https://www.glboutique.com.mx/heroeGL.jpg')
// Una url ajena en jpg se respeta tal cual
assert.equal(socialImage('https://otro.cdn/foto.jpg'), 'https://otro.cdn/foto.jpg')
assert.ok(!/\.webp/i.test(socialImage('https://cdn/x.webp')), 'nunca sale un webp en og:image')
// Un webp sin conversion se salta y toma la siguiente foto del producto, no el respaldo
assert.equal(
  socialImage(['https://cdn/x.webp', 'https://cdn/x.jpg']),
  'https://cdn/x.jpg'
)
// Las urls de Lee y Wrangler llevan `$&` literal: tiene que sobrevivir intacto
const scene7 = 'https://images.lee.com/is/image/Lee/112369188-HERO?$PDP24-XXLARGE$&fit=crop'
assert.equal(socialImage(scene7), scene7, 'la url con $& no se puede alterar')

console.log('ok — productCopy')
