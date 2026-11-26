// node scripts/test-store-escaping.mjs
// Regresion de seguridad: nombre, tipo y colores de un producto (los escribe el admin,
// pero tambien pueden venir de una importacion) nunca se pintan crudos en la tienda.
import assert from 'node:assert/strict'

// catalogCard.js engancha un listener al cargar; en Node no hay DOM
// (sin pisar el document de otras pruebas: comparten proceso en npm test)
globalThis.document ??= {}
document.addEventListener ??= () => {}
const { productCard } = await import('../src/pages/catalog/catalogCard.js')
const { bestSellerRow } = await import('../src/pages/home/homeCards.js')

const evil = '<img src=x onerror=alert(1)>'
const p = { id: 'x', name: evil, type: evil, price: 100, images: ['https://bcnfbrhcubpysqpyhbvf.supabase.co/a.webp'], sizes: [evil], colors: [evil], stock: '' }
for (const html of [productCard(p, 0), bestSellerRow(p, 0)]) {
  assert.ok(!html.includes('<img src=x'), 'HTML del producto sin escapar')
  assert.ok(html.includes('&lt;img src=x'))
}

// Rompe-atributo: una comilla no debe cerrar alt/src/data-*
const brk = { ...p, name: '" onmouseover="x', type: '" onmouseover="x', images: ['" onmouseover="x'] }
for (const html of [productCard(brk, 0), bestSellerRow(brk, 0)]) {
  assert.ok(!html.includes('" onmouseover="x'), 'comilla sin escapar en atributo')
}

// Datos normales: sin doble escape
const ok = productCard({ id: 'y', name: 'Camisa Lino', type: 'Camisas', price: 100, images: ['https://x/a.webp?a=1&b=2'], sizes: ['M'], colors: ['Negro'] }, 0)
assert.ok(ok.includes('Camisa Lino') && !ok.includes('&amp;amp;'))
console.log('ok')
