// node scripts/test-admin-escaping.mjs
// Regresion de seguridad: los datos que escribe un visitante (checkout, newsletter)
// nunca deben interpolarse crudos en el HTML del admin. Un ${campo} sin esc() falla.
// Un bloque precedido por "// not-html:" va en texto plano (CSV, portapapeles) y se omite.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { escapeHtml, sanitizeText } from '../src/utils/sanitize.js'

const DIR = 'src/pages/admin'
// Campos que llena el cliente, no el admin
const FIELDS = /\$\{\s*(?:esc\()?\s*[\w.?]*(customer_name|customer_whatsapp|customerName|customerWhatsapp|\.address|sub\.email|c\.name|c\.whatsapp|initials\(|method\b)/g

const leaks = []
for (const file of readdirSync(DIR).filter(f => f.endsWith('.js'))) {
  const lines = readFileSync(`${DIR}/${file}`, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if ((lines[i - 1] || '').includes('not-html:')) return
    for (const m of line.matchAll(FIELDS)) {
      if (m[0].includes('esc(')) continue
      const rest = line.slice(m.index + m[0].length)
      if (/^[\w.)]*\s*\?/.test(rest)) continue // condicion de ternario, no es salida
      leaks.push(`${file}:${i + 1}  ${line.slice(m.index, m.index + 60).trim()}`)
    }
  })
}
assert.deepEqual(leaks, [], `Datos del cliente sin escapar:\n${leaks.join('\n')}`)

// Tienda: nombres de producto/categoria, resenas y notificaciones tambien llegan a innerHTML.
// Un ${p.name} pelado (sin escapeHtml/esc) falla; "// not-html:" lo exime igual que arriba.
const STORE_FILES = ['src/core/startApp.js', 'src/pages/catalog/catalog.js', 'src/pages/catalog/catalogCard.js',
  'src/pages/home/homeCards.js', 'src/pages/home/home.js', 'src/pages/product/product.js', 'src/pages/admin/adminCategories.js',
  'src/pages/admin/adminProductCard.js', 'src/pages/admin/adminProductForm.js', 'src/pages/admin/adminProducts.js', 'src/pages/admin/adminNewOrder.js', 'src/components/headerSearch.js']
const BARE = /\$\{\s*(?:p\.name|p\.type|p\.id|cat\.name|r\.quote|n\.title|n\.body|topProduct\.name|x|c|b|badge|type|color|b\.label|b\.value|item\.src)\s*\}/g
const storeLeaks = []
for (const file of STORE_FILES) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if ((lines[i - 1] || '').includes('not-html:')) return
    for (const m of line.matchAll(BARE)) storeLeaks.push(`${file}:${i + 1}  ${line.slice(m.index, m.index + 60).trim()}`)
  })
}
assert.deepEqual(storeLeaks, [], `Datos de la tienda sin escapar:\n${storeLeaks.join('\n')}`)

// Nuevo pedido: nombres de producto hostiles salen escapados en resultados, filas y resumen
import { resultsHtml, itemsHtml, summaryLinesHtml } from '../src/pages/admin/newOrderParts.js'
const evil = { id: 1, name: '<img src=x onerror=alert(1)>', brand: '<b>x</b>', price: 10, sizes: ['<s>'], colors: [] }
for (const html of [resultsHtml([evil], true), itemsHtml([{ productId: 1, size: '<s>', color: '', qty: 1 }], () => evil), summaryLinesHtml([{ productId: 1, size: '<s>', color: '', qty: 1 }], () => evil)]) {
  assert.ok(!/<img|<b>|<s>/.test(html), `Nuevo pedido sin escapar: ${html}`)
}

// El toast pinta con textContent: un ${message} en su plantilla lo reabriria.
assert.ok(!readFileSync('src/utils/toast.js', 'utf8').includes('${message}'), 'toast.js interpola message en HTML')

assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;')
assert.equal(escapeHtml('" onmouseover="x'), '&quot; onmouseover=&quot;x')

// sanitizeText: un tag SIN cerrar tambien inyecta, porque el markup de alrededor
// lo cierra por el. No debe sobrevivir ningun < ni >.
assert.equal(sanitizeText('<img src=x onerror=alert(1)'), 'img src=x onerror=alert(1)')
assert.equal(sanitizeText('<b>Juan</b> Perez'), 'Juan Perez')
assert.equal(sanitizeText('  Calle 5 de Mayo #12  '), 'Calle 5 de Mayo #12')
assert.ok(!/[<>]/.test(sanitizeText('a<b>c<d')))

console.log('ok')
