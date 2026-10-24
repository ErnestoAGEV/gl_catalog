// node scripts/test-home-content.mjs
import assert from 'node:assert/strict'
import { resolveHomeContent, headlineHtml, safeLink, resolveImage } from '../src/pages/home/homeContent.js'
import { heroSlides, stats, categoryTiles, manifesto } from '../src/pages/home/homeData.js'

const opts = { marqueeDefault: 'DEFAULT' }
const v2 = (row) => ({ active: true, display_order: 1, ...row, content: { v: 2, ...(row.content || {}) } })

// Sin filas, o solo filas viejas (sin v:2): todo sale de los defaults. Las cifras viejas inventadas no vuelven.
const viejas = [{ section: 'stat', title: '2.4k', subtitle: 'Clientes activos', active: true, display_order: 1, content: null }]
for (const rows of [[], null, viejas]) {
  const c = resolveHomeContent(rows, opts)
  assert.equal(c.heroSlides, heroSlides)
  assert.equal(c.stats, stats)
  assert.equal(c.manifesto, manifesto)
  assert.equal(c.marquee, 'DEFAULT')
  assert.deepEqual(c.categoryTiles, categoryTiles)
}

// Inactivas no cuentan.
assert.equal(resolveHomeContent([v2({ section: 'stat', title: '9', active: false })], opts).stats, stats)

// Escape: nada de HTML guardado llega a la pagina.
const xss = resolveHomeContent([
  v2({ section: 'marquee', title: '<img src=x onerror=alert(1)>' }),
  v2({ section: 'hero_slide', title: '<b>Hola</b>', subtitle: '"><script>', cta_text: 'Ir', cta_link: 'javascript:alert(1)' }),
], opts)
assert.ok(!xss.marquee.includes('<img'))
assert.ok(!xss.heroSlides[0].headline.includes('<b>'))
assert.ok(!xss.heroSlides[0].body.includes('<script'))
assert.equal(xss.heroSlides[0].cta.href, '/catalog')

// Titulo: salto de linea y palabra destacada con estilo de tabla fija.
assert.equal(headlineHtml('Tu fit,\nperfecto.', 'perfecto.', 'brand'), 'Tu fit,<br/><span class="text-brand">perfecto.</span>')
assert.equal(headlineHtml('Denim\nhonesto.', 'honesto.', 'outline'), 'Denim<br/><span class="outline-text">honesto.</span>')
assert.equal(headlineHtml('A & B', 'B', 'raro" onclick="x'), 'A &amp; <span class="text-brand">B</span>')
assert.equal(headlineHtml('Sin acento', 'nope', 'brand'), 'Sin acento')

// Enlaces.
assert.equal(safeLink('/categoria/Camisas'), '/categoria/Camisas')
assert.equal(safeLink('#copy'), '#copy')
assert.equal(safeLink('https://wa.me/52'), 'https://wa.me/52')
for (const malo of ['javascript:alert(1)', '//evil.com', 'data:text/html,x', '']) assert.equal(safeLink(malo), '/catalog')

// Imagenes: local conserva srcset del default; subida pasa por Vercel en produccion; ajena se rechaza.
const base = heroSlides[0]
assert.equal(resolveImage(base.image, base).srcset, base.srcset)
const subida = 'https://abc.supabase.co/storage/v1/object/public/site/1-foto.jpg'
assert.equal(resolveImage(subida, base, { optimize: false }).image, subida)
const opt = resolveImage(subida, base, { optimize: true })
assert.ok(opt.image.startsWith('/_vercel/image?url=' + encodeURIComponent(subida)))
assert.ok(opt.srcset.includes('w=640') && opt.srcset.includes('w=1600'))
assert.equal(resolveImage('https://evil.com/x.jpg', base), null)

// Slide cupon: '#copy' sin texto conserva el bloque de WELCOME10.
const cupon = resolveHomeContent([v2({ section: 'hero_slide', title: '−10%', cta_link: '#copy' })], opts).heroSlides[0]
assert.equal(cupon.cta.isCopy, true)
assert.equal(cupon.couponBody, true)
assert.equal(cupon.captionClass, 'bg-brand')

// Cifras: tipos especiales y "/5" en chico.
const s = resolveHomeContent([
  v2({ section: 'stat', title: '120', subtitle: 'Piezas', content: { kind: 'catalogCount' } }),
  v2({ section: 'stat', title: '4.8/5', subtitle: 'Google', display_order: 2, content: { kind: 'googleReviews' } }),
], opts).stats
assert.equal(s[0].catalogCount, true)
assert.equal(s[1].reviewsLink, true)
assert.ok(s[1].number.startsWith('4.8<span'))

// Mosaico: edita la posicion indicada, el resto queda; categoryType sale del enlace.
const t = resolveHomeContent([v2({ section: 'category_tile', display_order: 2, title: 'Chamarras', cta_link: '/categoria/Chamarras%20Piel' })], opts).categoryTiles
assert.equal(t[0], categoryTiles[0])
assert.equal(t[1].name, 'Chamarras')
assert.equal(t[1].categoryType, 'Chamarras Piel')
assert.equal(t[1].span, categoryTiles[1].span)

console.log('ok — homeContent')

// Ida y vuelta: "Personalizar" debe dejar la tienda exactamente igual que hoy.
import { defaultRows } from '../src/pages/home/homeContent.js'
{
  const rows = ['hero_slide', 'stat', 'category_tile', 'manifesto'].flatMap(s => defaultRows(s))
  const c = resolveHomeContent(rows, opts)
  c.heroSlides.forEach((s, i) => {
    const d = heroSlides[i]
    assert.equal(s.headline, d.headline, `headline ${i}`)
    assert.equal(s.cta.href, d.cta.href)
    assert.equal(s.cta.isCopy, !!d.cta.isCopy)
    assert.equal(s.couponBody, !!d.couponBody)
    assert.equal(s.image, d.image)
    assert.equal(s.srcset, d.srcset)
  })
  c.stats.forEach((s, i) => {
    const d = stats[i]
    assert.equal(s.catalogCount, !!d.catalogCount)
    assert.equal(s.reviewsLink, !!d.reviewsLink)
    if (!d.catalogCount) assert.equal(s.number, d.number, `stat ${i}`)
  })
  c.categoryTiles.forEach((t, i) => {
    const d = categoryTiles[i]
    for (const k of ['name', 'href', 'categoryType', 'eyebrow', 'image', 'srcset', 'span']) assert.equal(t[k], d[k] ?? t[k], `tile ${i} ${k}`)
  })
  assert.equal(c.manifesto.text, manifesto.text)
  assert.equal(resolveHomeContent(defaultRows('marquee', { marqueeDefault: 'Hola — ' }), opts).marquee, 'Hola —')
}
console.log('ok — homeContent ida y vuelta')

// Revision: URLs que intentan salirse del atributo se rechazan enteras.
assert.equal(safeLink('/catalog" onmouseover="alert(1)'), '/catalog')
assert.equal(safeLink('/categoria/Camisas extra'), '/catalog')
assert.equal(resolveImage('/img/x.jpg" onerror="alert(2)', heroSlides[0]), null)

// Revision: tras reordenar, la foto local conserva su propio srcset y medidas.
{
  const [s0] = resolveHomeContent([v2({ section: 'hero_slide', title: 'Denim', image_url: heroSlides[1].image })], opts).heroSlides
  assert.equal(s0.srcset, heroSlides[1].srcset)
  assert.equal(s0.h, heroSlides[1].h)
}

// Revision: el manifiesto respeta los saltos de linea, escapados.
assert.equal(resolveHomeContent([v2({ section: 'manifesto', title: 'Uno\n<dos>' })], opts).manifesto.text, 'Uno<br/>&lt;dos&gt;')
console.log('ok — homeContent revision')
