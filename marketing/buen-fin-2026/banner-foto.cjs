// node banner-foto.cjs → out/banner-home-buen-fin-foto.jpg (1080×1350) y su recorte cuadrado de celular
const { chromium } = require('playwright')
const path = require('path'), url = require('url')

;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } })
  await p.goto(url.pathToFileURL(path.join(__dirname, 'banner-foto.html')).href)
  const ok = await p.evaluate(async () => {
    await Promise.all([...document.fonts].map(f => f.load()))
    await Promise.all([...document.images].map(i => i.decode()))
    return ['800 100px Manrope', '400 40px "JetBrains Mono"'].every(f => document.fonts.check(f))
  })
  if (!ok) throw new Error('las fuentes no cargaron')
  // El texto debe caber en el cuadrado del celular y no pisar la ropa (empieza en ~54% del ancho)
  const box = await p.evaluate(() => { const r = document.querySelector('.copy').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, right: Math.max(...[...document.querySelectorAll('.copy > *')].map(e => e.getBoundingClientRect().right)) } })
  if (box.top < 135 || box.bottom > 1215) throw new Error('el texto se sale del cuadrado del celular: ' + JSON.stringify(box))
  if (box.right > 1080 * 0.54) throw new Error('el texto pisa la ropa: ' + JSON.stringify(box))
  await p.screenshot({ path: path.join(__dirname, 'out/banner-home-buen-fin-foto.jpg'), type: 'jpeg', quality: 90 })
  await p.screenshot({ path: path.join(__dirname, 'out/banner-home-buen-fin-foto-celular.png'), clip: { x: 0, y: 135, width: 1080, height: 1080 } })
  await b.close()
  console.log('listo', JSON.stringify(box))
})().catch(e => { console.error(e.message); process.exit(1) })
