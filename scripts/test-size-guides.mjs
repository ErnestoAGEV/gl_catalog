// node scripts/test-size-guides.mjs
// Guias de tallas: una guia es de marca + tipo de prenda + corte, y le toca
// sola a cada producto cuyo nombre empieza asi. Lo que se prueba es lo que
// puede romper en silencio: que le toque la guia equivocada a un producto.
import assert from 'node:assert/strict'
import { findSizeGuide, guideRow, measuresFor, defaultColumns, guideLabel, sameGuideDraft } from '../src/utils/sizeGuides.js'

const g = (brand, type, cut, extra = {}) => ({ id: `${brand}|${type}|${cut}`, brand, type, cut, columns: ['Cintura', 'Largo', 'Tiro'], rows: [{ size: '32', values: ['82', '105', '26'] }], note: null, ...extra })
const vaxter = g('Oggi', 'Pantalones', 'Vaxter')
const vaxterSuper = g('Oggi', 'Pantalones', 'Vaxter Super')
const wp = g('White Peak', 'Polos', '', { columns: ['Largo', 'Ancho'], rows: [{ size: 'S', values: ['67', '50'] }] })
const collors = g("Collor's", 'Pantalones', 'Aiden')
const guides = [vaxter, vaxterSuper, wp, collors]
const p = (name, type) => ({ name, type })

assert.equal(findSizeGuide(p('Oggi - Vaxter Gabardina Khaki', 'Pantalones'), guides), vaxter)
assert.equal(findSizeGuide(p('Oggi - Vaxter Super Gabardina Khaki', 'Pantalones'), guides), vaxterSuper) // gana el corte mas largo
assert.equal(findSizeGuide(p('Oggi - Vaxters Raro', 'Pantalones'), guides), null)                      // palabra completa
assert.equal(findSizeGuide(p('OGGI - vaxter rebel negro', 'Pantalones'), guides), vaxter)              // mayusculas
assert.equal(findSizeGuide(p('Oggi - Chinos Slim', 'Pantalones'), guides), null)                        // sin guia
assert.equal(findSizeGuide(p('White Peak - Amarillo', 'Polos'), guides), wp)                            // marca sin corte
assert.equal(findSizeGuide(p('White Peak - Pantalon Khaki', 'Pantalones'), guides), null)              // otro tipo de prenda
assert.equal(findSizeGuide(p('Collor’s - Aiden 3362', 'Pantalones'), guides), collors)                 // apostrofo curvo
assert.equal(findSizeGuide(p('Collor`s -Aiden 3372', 'Pantalones'), guides), collors)                  // acento grave y sin espacio
assert.equal(findSizeGuide(p('Oggi - Váxter Avatar', 'Pantalones'), guides), vaxter)                   // acentos
assert.equal(findSizeGuide(p('Camisa sin marca', 'Camisas'), [g('Camisa sin marca', 'Camisas', '')]), null) // sin separador = sin marca
assert.equal(findSizeGuide(p('Oggi - Vaxter Rebel', 'Pantalones'), []), null)
assert.equal(findSizeGuide(null, guides), null)

assert.deepEqual(guideRow(vaxter, '32'), { size: '32', values: ['82', '105', '26'] })
assert.equal(guideRow(vaxter, '33'), null)
assert.equal(guideRow(vaxter, ''), null)
assert.deepEqual(measuresFor(vaxter, '32'), [{ label: 'Cintura', value: '82' }, { label: 'Largo', value: '105' }, { label: 'Tiro', value: '26' }])
assert.deepEqual(measuresFor(g('Oggi', 'Pantalones', 'X', { rows: [{ size: '32', values: ['82', '', '26'] }] }), '32'),
  [{ label: 'Cintura', value: '82' }, { label: 'Tiro', value: '26' }])                                   // celda vacia se omite
assert.deepEqual(measuresFor(g('Oggi', 'Pantalones', 'X', { rows: [{ size: '32', values: ['82'] }] }), '32'),
  [{ label: 'Cintura', value: '82' }])                                                                     // fila mas corta que las columnas
assert.deepEqual(measuresFor(vaxter, '33'), [])
assert.deepEqual(measuresFor(null, '32'), [])

assert.deepEqual(defaultColumns('Pantalones'), ['Cintura', 'Largo', 'Tiro'])
assert.deepEqual(defaultColumns('Shorts'), ['Cintura', 'Largo', 'Tiro'])
assert.deepEqual(defaultColumns('Polos'), ['Largo', 'Hombros', 'Pecho'])
assert.deepEqual(defaultColumns('Zapatos'), ['Largo de plantilla'])
assert.deepEqual(defaultColumns('Perfumes'), [])
assert.equal(guideLabel(vaxter), 'Oggi · Vaxter')
assert.equal(guideLabel(wp), 'White Peak · Polos')

// Cerrar el formulario de guia: solo pregunta si hay algo capturado que se perderia
const d = () => ({ brand: 'Oggi', type: 'Pantalones', cut: 'Vaxter', note: '', columns: ['Cintura', 'Largo'], rows: [{ size: '30', values: ['78', '104'] }] })
assert.equal(sameGuideDraft(d(), d()), true)
assert.equal(sameGuideDraft({ ...d(), rows: [{ size: '30', values: ['78', '105'] }] }, d()), false) // cambio una medida
assert.equal(sameGuideDraft({ ...d(), columns: ['Cintura', 'Largo', ''] }, d()), false)            // agrego columna
assert.equal(sameGuideDraft({ ...d(), cut: ' Vaxter ' }, d()), true)                                // espacios no cuentan
assert.equal(sameGuideDraft({ ...d(), rows: [{ size: '30', values: ['78', '104', ''] }] }, d()), true) // celda vacia de mas no cuenta

console.log('ok — size guides')
