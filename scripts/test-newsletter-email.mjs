// node scripts/test-newsletter-email.mjs
import assert from 'node:assert/strict'
import { newsletterEmailHtml, WELCOME_DEFAULTS, CAMPAIGN_DEFAULTS, UNSUB_PLACEHOLDER } from '../src/pages/admin/newsletterEmail.js'

// Modo texto: lo que escribe el admin se escapa, no se cuela HTML en el correo.
const html = newsletterEmailHtml({ title: '<script>x</script>', body: 'uno\n\ndos <b>', ctaUrl: 'javascript:alert(1)', imageUrl: 'data:x' }, '523121018263')
assert.ok(!html.includes('<script>x'))
assert.ok(html.includes('&lt;script&gt;'))
assert.ok(html.includes('dos &lt;b&gt;'))
// Enlaces que no son http(s) caen al default o desaparecen.
assert.ok(!html.includes('javascript:'))
assert.ok(html.includes(`href="${WELCOME_DEFAULTS.ctaUrl}"`))
assert.ok(!html.includes('data:x'))
assert.equal((html.match(/<img/g) || []).length, 1) // solo el logo
// Párrafos separados por línea vacía, código vacío = sin etiqueta.
assert.equal((html.match(/<p style="margin:0 0 16px/g) || []).length, 2)
assert.ok(!newsletterEmailHtml({ code: '' }).includes('class="gl-code"'))
assert.ok(html.includes('https://wa.me/523121018263'))

// Modo HTML: el cuerpo entra tal cual (lo escribe un admin), el título se sigue escapando.
const raw = newsletterEmailHtml({ bodyMode: 'html', body: '<p style="color:red">Hola <b>VIP</b></p>', title: 'A & B' })
assert.ok(raw.includes('<p style="color:red">Hola <b>VIP</b></p>'))
assert.ok(raw.includes('A &amp; B'))

// Envío sin botón ni código: ni botón ni etiqueta.
const bare = newsletterEmailHtml({ ...CAMPAIGN_DEFAULTS, ctaLabel: '', title: 'Rebajas', body: 'Hola' })
assert.ok(!bare.includes('border-radius:999px'))
assert.ok(!bare.includes('class="gl-code"'))

// Todo correo lleva el enlace de baja para que Supabase lo personalice.
assert.ok(html.includes(`href="${UNSUB_PLACEHOLDER}"`))
assert.ok(bare.includes(`href="${UNSUB_PLACEHOLDER}"`))

console.log('ok — newsletterEmail')

// checkEmailHtml: bloquea lo peligroso o roto, avisa lo que los correos ignoran.
import { checkEmailHtml } from '../src/pages/admin/newsletterEmail.js'
const ok = checkEmailHtml('<p style="color:red">Hola <b>VIP</b><br>ya</p><img src="https://x.mx/a.jpg" alt="a"><!-- <script> -->')
assert.deepEqual(ok, { errors: [], warnings: [] })
assert.ok(checkEmailHtml('<script>alert(1)</script>').errors.some(e => e.includes('<script>')))
assert.ok(checkEmailHtml('<img src=x onerror=alert(1) alt="">').errors.some(e => e.includes('on...')))
assert.ok(checkEmailHtml('<a href="javascript:alert(1)">x</a>').errors.some(e => e.includes('javascript:')))
assert.deepEqual(checkEmailHtml('<p>Hola <b>sin cerrar</p>').errors, ['Falta cerrar <b>.'])
assert.deepEqual(checkEmailHtml('<p>Hola</p></div>').errors, ['Sobra un </div> sin su <div>.'])
assert.deepEqual(checkEmailHtml('<table><tr><td>x</td></tr>').errors, ['Falta cerrar <table>.'])
assert.deepEqual(checkEmailHtml('<ul><li>uno<li>dos</ul><p>a<p>b').errors, []) // cierres opcionales válidos
assert.ok(checkEmailHtml('<p>Hola</p><a href="x"').errors.some(e => e.includes('sin terminar')))
assert.equal(checkEmailHtml('<style>p{}</style><img src="http://x/a.jpg"><div style="display:flex"></div>').warnings.length, 4)
console.log('ok — checkEmailHtml')
