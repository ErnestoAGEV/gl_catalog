// node scripts/test-colors.mjs
// Un solo mapa de colores para la ficha, la bolsa y el catalogo. Habia tres
// copias distintas y a ninguna le tocaba "Amarillo": la muestra salia gris.
import assert from 'node:assert/strict'
import { colorHex } from '../src/utils/colors.js'

// Todos los colores que hoy usan los productos tienen muestra propia
for (const c of ['Azul', 'Negro', 'Beige', 'Gris', 'Verde', 'Café', 'Blanco', 'Rojo', 'Rosa', 'Arena', 'Vino', 'Amarillo']) {
  assert.notEqual(colorHex(c), colorHex('color-que-no-existe'), `${c} sin muestra`)
}
assert.equal(colorHex(' amarillo '), colorHex('Amarillo'))   // espacios y mayusculas
assert.equal(colorHex('#123456'), '#123456')                   // un hex se respeta
assert.equal(colorHex('Crudo'), '#E8DFD0')                     // la bolsa lo pintaba azul marino
assert.equal(colorHex(''), colorHex(null))

console.log('ok — colors')
