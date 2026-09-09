// node scripts/test-resize-image.mjs
import assert from 'node:assert/strict'
import { fitWithin, toJpgName } from '../src/utils/resizeImage.js'

// Una foto del telefono se reduce sin deformarse.
assert.deepEqual(fitWithin(4032, 3024), { w: 1400, h: 1050 })
assert.deepEqual(fitWithin(3024, 4032), { w: 1050, h: 1400 })

// Lo que ya cabe se deja intacto: reescalar hacia arriba solo pierde nitidez.
assert.deepEqual(fitWithin(800, 600), { w: 800, h: 600 })
assert.deepEqual(fitWithin(1400, 1400), { w: 1400, h: 1400 })

// Un panorama extremo no puede colapsar a cero pixeles de alto.
assert.deepEqual(fitWithin(9000, 3), { w: 1400, h: 1 })

// Sin dimensiones no hay nada que hacer, y no debe dividir entre cero.
assert.deepEqual(fitWithin(0, 0), { w: 0, h: 0 })

// La salida es JPEG siempre: WhatsApp no renderiza WebP en la vista previa.
assert.equal(toJpgName('IMG_4335.HEIC'), 'IMG_4335.jpg')
assert.equal(toJpgName('foto.webp'), 'foto.jpg')
assert.equal(toJpgName('camisa.azul.png'), 'camisa.azul.jpg')
assert.equal(toJpgName('sin-extension'), 'sin-extension.jpg')

console.log('ok — resizeImage')
