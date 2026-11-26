// La CSP de vercel.json no deja correr scripts en linea salvo los que autoriza
// por hash. Este test falla si alguien agrega un onclick=, cambia un <script>
// de arranque sin actualizar su hash, o afloja la politica.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const sha = (code) => `'sha256-${createHash('sha256').update(code).digest('base64')}'`

const inlineScripts = (html) =>
  [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map(([, attrs, body]) => ({ attrs, body }))

// Scripts de arranque de index.html (canonical y ocultar el shell), en una sola
// linea cada uno para que el hash no cambie entre CRLF local y LF en Vercel.
const bootScripts = inlineScripts(read('index.html')).filter((s) => !/\bsrc=/.test(s.attrs))
assert.equal(bootScripts.length, 2, 'index.html debe tener exactamente 2 <script> en linea (canonical y shell)')
const hashes = bootScripts.map((s) => sha(s.body))

const CSP = [
  "default-src 'self'",
  // Turnstile (Tarea 12): sumar https://challenges.cloudflare.com a script-src y frame-src cuando haya llaves.
  `script-src 'self' ${hashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline'", // cientos de style=; no ejecuta codigo
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:", // https: se queda hasta la Tarea 11 (fotos de productos en hosts ajenos)
  "connect-src 'self' https://bcnfbrhcubpysqpyhbvf.supabase.co wss://bcnfbrhcubpysqpyhbvf.supabase.co",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ')

const vercel = JSON.parse(read('vercel.json'))
const csp = vercel.headers
  .find((h) => h.source === '/(.*)')
  .headers.find((h) => h.key === 'Content-Security-Policy').value
assert.equal(csp, CSP, 'la CSP de vercel.json no coincide (¿cambió un <script> de index.html? actualiza su hash)')
assert.ok(!/script-src[^;]*unsafe/.test(csp), 'script-src sin unsafe-*')

// Manejadores en linea y javascript: en las plantillas JS
const INLINE_HANDLER = /\son[a-z]+\s*=\s*["']/i
const JS_URL = /(href|src|action)\s*=\s*["']?\s*javascript:/i
const walk = (dir, ext) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name), ext) : d.name.endsWith(ext) ? [join(dir, d.name)] : [])

for (const file of walk(join(ROOT, 'src'), '.js')) {
  const code = readFileSync(file, 'utf8')
  assert.ok(!INLINE_HANDLER.test(code), `${file}: manejador en linea (on*=); usa addEventListener o data-*`)
  assert.ok(!JS_URL.test(code), `${file}: URL javascript:`)
}

// Cada <script> en linea tiene src, es JSON, o su hash esta en la CSP
function checkHtml(file, html) {
  assert.ok(!INLINE_HANDLER.test(html.replace(/<script\b[\s\S]*?<\/script>/gi, '')), `${file}: manejador en linea (on*=)`)
  assert.ok(!JS_URL.test(html), `${file}: URL javascript:`)
  for (const { attrs, body } of inlineScripts(html)) {
    if (/\bsrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs)) continue
    assert.ok(hashes.includes(sha(body)), `${file}: <script> en linea sin hash en la CSP: ${body.slice(0, 60)}`)
  }
}

checkHtml('index.html', read('index.html'))

const DIST = join(ROOT, 'dist')
let pages = 0
if (existsSync(DIST)) {
  for (const file of walk(DIST, '.html')) { checkHtml(file, readFileSync(file, 'utf8')); pages++ }
}

// autocomprobacion del detector
assert.ok(INLINE_HANDLER.test('<img onerror="x">') && !INLINE_HANDLER.test('<img data-fallback="x">'))

console.log(`test-csp: ok (CSP con 2 hashes; ${pages} paginas de dist revisadas)`)
