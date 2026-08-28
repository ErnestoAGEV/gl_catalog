// Comprobación mínima del reparto entre galería y guía de tallas.
// node scripts/test-gallery-images.mjs
import assert from 'node:assert/strict'
import { splitGalleryImages } from '../src/utils/productImages.js'

// Caso normal: la guía sale de la galería
let r = splitGalleryImages(['/a/foto.jpg', '/a/guia-de-tallas-white-peack.jpeg'])
assert.deepEqual(r.gallery, ['/a/foto.jpg'])
assert.equal(r.sizeGuide, '/a/guia-de-tallas-white-peack.jpeg')

// Sin guía: nada cambia y el botón no debe aparecer
r = splitGalleryImages(['/a/1.jpg', '/a/2.jpg'])
assert.deepEqual(r.gallery, ['/a/1.jpg', '/a/2.jpg'])
assert.equal(r.sizeGuide, null)

// Solo la guía: la ficha no puede quedarse sin foto
r = splitGalleryImages(['/a/size-chart.png'])
assert.deepEqual(r.gallery, ['/a/size-chart.png'])
assert.equal(r.sizeGuide, null)

// Sin imágenes
r = splitGalleryImages([])
assert.deepEqual(r.gallery, [])
assert.equal(r.sizeGuide, null)

console.log('ok — 4 casos')
