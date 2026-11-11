// node banner.cjs → out/banner-home-buen-fin.jpg (1080×1350) y su recorte cuadrado de celular para revisar
const { chromium } = require('playwright')
const path = require('path'), url = require('url')

;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } })
  await p.goto(url.pathToFileURL(path.join(__dirname, 'banner.html')).href)
  const ok = await p.evaluate(async () => {
    await Promise.all([...document.fonts].map(f => f.load()))
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})))
    return ['800 100px Manrope', '400 40px "JetBrains Mono"'].every(f => document.fonts.check(f))
  })
  if (!ok) throw new Error('las fuentes no cargaron')
  // El contenido no debe salirse del cuadrado central (recorte del celular)
  const fuera = await p.evaluate(() => [...document.querySelectorAll('.safe *')].some(e => { const r = e.getBoundingClientRect(); return r.top < 135 || r.bottom > 1215 || r.left < 0 || r.right > 1080 }))
  if (fuera) throw new Error('hay contenido fuera del cuadrado central')
  await p.screenshot({ path: path.join(__dirname, 'out/banner-home-buen-fin.jpg'), type: 'jpeg', quality: 90 })
  await p.screenshot({ path: path.join(__dirname, 'out/banner-home-buen-fin-celular.png'), clip: { x: 0, y: 135, width: 1080, height: 1080 } })
  await b.close()
  console.log('listo')
})().catch(e => { console.error(e.message); process.exit(1) })
