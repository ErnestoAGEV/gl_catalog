// Aviso de privacidad y Terminos: tienen que existir, estar completos y sin
// marcadores sin llenar, y el pie debe enlazarlos.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { infoPages } from '../src/pages/info/infoData.js'

for (const path of ['/privacidad', '/terminos']) {
  const page = infoPages[path]
  assert.ok(page, `falta ${path}`)
  assert.ok(page.sections.length >= 5, `${path}: ${page.sections.length} secciones`)
  assert.ok(!JSON.stringify(page).includes('[['), `${path}: quedan marcadores [[ ]]`)
}
const aviso = JSON.stringify(infoPages['/privacidad'])
for (const dato of ['Ernesto Vega Vega', 'Ignacio Zaragoza #140', '28000', 'glboutiquecolima@gmail.com', 'ARCO']) {
  assert.ok(aviso.includes(dato), `el aviso no dice ${dato}`)
}
assert.ok(!/RFC|CURP/.test(aviso), 'no se publica RFC ni CURP')
for (const page of Object.values(infoPages)) assert.ok(!JSON.stringify(page).includes('¡'), 'sin "¡"')

const layout = readFileSync(new URL('../src/components/layout.js', import.meta.url), 'utf8')
assert.ok(layout.includes('href="/privacidad"') && layout.includes('href="/terminos"'), 'el pie no enlaza los legales')

console.log('ok — info pages')
