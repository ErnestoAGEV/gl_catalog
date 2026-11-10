// node check.mjs <copy|safe|determinism|timing|audio|final> — sale con código ≠ 0 si algo falla.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const DIR = path.dirname(fileURLToPath(import.meta.url))
const load = () => { delete require.cache[require.resolve('./timeline.js')]; return require('./timeline.js') }

export const COPY = ['Buen Fin', '10%', 'en toda la tienda', '15%', 'en perfumes y pantalones seleccionados',
  'Descuentos no acumulables', 'Del 13 al 16 de noviembre', 'Tiendas en Colima · En línea · WhatsApp',
  'Envíos a todo México', 'Wrangler, Oggi y más', 'Escríbenos por WhatsApp', '312 101 8263', 'glboutique.com.mx', 'Tu fit perfecto']
export const VO = ['Este Buen Fin, en ge y ele…', '10% en toda la tienda.', 'Y 15% en perfumes y pantalones seleccionados.',
  'Del 13 al 16 de noviembre, en nuestras tiendas de Colima, en línea y por WhatsApp.', 'Envíos a todo México.',
  'Escríbenos por WhatsApp o entra a nuestra tienda en línea. Ge y ele, tu fit perfecto.']
const BANNED = ['¡', 'original', 'Punto Oggi', 'distribuidor']

function copy() {
  const T = load()
  const all = T.scenes.flatMap(s => s.copy)
  for (const c of COPY) assert.ok(all.includes(c), `falta en pantalla: "${c}"`)
  T.scenes.forEach((s, i) => assert.equal(s.vo, VO[i], `voz de la escena ${s.id}`))
  for (const t of [...all, ...T.scenes.map(s => s.vo)]) for (const b of BANNED) assert.ok(!t.includes(b), `texto prohibido "${b}" en "${t}"`)
  assert.deepEqual(T.scenes.map(s => s.id), ['intro', 'diez', 'quince', 'fechas', 'envios', 'cierre'])
  assert.equal(T.scenes[0].start, 0)
  T.scenes.forEach((s, i) => { if (i) assert.equal(s.start, T.scenes[i - 1].end, `hueco antes de ${s.id}`) })
  assert.equal(T.scenes.at(-1).end, T.duration)
  assert.ok(T.duration >= 20 && T.duration <= 25, `duración ${T.duration} fuera de 20–25`)
  assert.ok(Number.isInteger(Math.round(T.duration * T.fps * 1e6) / 1e6), 'duration*fps no es entero')
}

const modes = { copy }
const mode = process.argv[2]
if (!modes[mode]) { console.error('modos: ' + Object.keys(modes).join(', ')); process.exit(2) }
try { await modes[mode](); console.log(`check ${mode}: OK`) }
catch (e) { console.error(`check ${mode}: FALLA — ${e.message}`); process.exit(1) }
