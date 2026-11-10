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

// ---- navegador: abre video.html con las fuentes cargadas ----
export async function openVideo(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
  await page.goto(pathToFileURL(path.join(DIR, 'video.html')).href)
  const ok = await page.evaluate(async () => {
    await Promise.all([...document.fonts].map(f => f.load()))
    return ['800 100px Manrope', '400 40px Inter', '400 40px "JetBrains Mono"'].every(f => document.fonts.check(f))
  })
  assert.ok(ok, 'las fuentes no cargaron')
  return page
}

const SAFE = { top: 269, bottom: 1651, left: 0, right: 1080 }

async function safe() {
  const { chromium } = await import('playwright')
  const T = load(), browser = await chromium.launch()
  try {
    const page = await openVideo(browser)
    const errs = await page.evaluate(({ T, SAFE }) => {
      const out = []
      const op = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity } return o }
      const rects = (el) => { const r = document.createRange(); r.selectNodeContents(el); return [...r.getClientRects()].filter(b => b.width && b.height) }
      const norm = (s) => s.replace(/\s+/g, ' ').trim()
      const N = Math.round(T.duration * T.fps)
      for (let f = 0; f < N; f++) {
        const t = f / T.fps
        render(t)
        for (const el of document.querySelectorAll('[data-copy]')) {
          if (op(el) <= 0.05) continue
          const c = el.dataset.copy
          const min = c === 'Descuentos no acumulables' ? 36 : 44
          if (parseFloat(getComputedStyle(el).fontSize) < min) out.push(`${t.toFixed(2)}s "${c}" font-size < ${min}`)
          if (el.dataset.bleed !== undefined && t < +el.dataset.bleed + 0.3) continue
          for (const b of rects(el)) if (b.top < SAFE.top - 0.5 || b.bottom > SAFE.bottom + 0.5 || b.left < SAFE.left - 0.5 || b.right > SAFE.right + 0.5)
            { out.push(`${t.toFixed(2)}s "${c}" fuera de zona segura (${Math.round(b.left)},${Math.round(b.top)})–(${Math.round(b.right)},${Math.round(b.bottom)})`); break }
        }
        if (out.length > 20) return out
      }
      for (const s of T.scenes) {
        const t = (s.start + s.end) / 2
        render(t)
        for (const c of s.copy) {
          const el = [...document.querySelectorAll('[data-copy]')].find(e => e.dataset.copy === c)
          if (!el) { out.push(`${s.id}: no existe [data-copy="${c}"]`); continue }
          if (norm(el.textContent) !== c) out.push(`${s.id}: texto "${norm(el.textContent)}" ≠ "${c}"`)
          if (op(el) < 0.95) out.push(`${s.id}: "${c}" opacidad ${op(el).toFixed(2)} a mitad de escena`)
          const bb = el.getBoundingClientRect(), sc = el.offsetWidth ? bb.width / el.offsetWidth : 0
          if (sc < 0.98 || sc > 1.02) out.push(`${s.id}: "${c}" escala ${sc.toFixed(3)} a mitad de escena`)
          const hit = document.elementFromPoint(bb.left + bb.width / 2, bb.top + bb.height / 2)
          if (!hit || !(el === hit || el.contains(hit))) out.push(`${s.id}: "${c}" tapado por ${hit && (hit.id || hit.className || hit.tagName)}`)
        }
      }
      return out
    }, { T, SAFE })
    assert.deepEqual(errs, [], '\n' + errs.join('\n'))
  } finally { await browser.close() }
}

async function determinism() {
  const { chromium } = await import('playwright')
  const T = load(), browser = await chromium.launch()
  try {
    const times = [5, ...T.scenes.map(s => (s.start + s.end) / 2), ...T.scenes.slice(1).map(s => s.start + 0.2)]
    const a = await openVideo(browser), b = await openVideo(browser)
    for (const t of times) {
      await a.evaluate(t => render(t), t)
      await b.evaluate(([t, d]) => { render(d - t); render(20); render(t) }, [t, T.duration])
      const [x, y] = [await a.screenshot(), await b.screenshot()]
      assert.ok(x.equals(y), `render(${t}) cambia según las llamadas anteriores`)
    }
  } finally { await browser.close() }
}

const modes = { copy, safe, determinism }
const mode = process.argv[2]
if (!modes[mode]) { console.error('modos: ' + Object.keys(modes).join(', ')); process.exit(2) }
try { await modes[mode](); console.log(`check ${mode}: OK`) }
catch (e) { console.error(`check ${mode}: FALLA — ${e.message}`); process.exit(1) }
