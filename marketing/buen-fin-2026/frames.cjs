// node frames.cjs all            → frames/f0000.png… (borra frames/ antes)
// node frames.cjs stills 1.5,7,… → stills/t1.50.png…
const { chromium } = require('playwright')
const fs = require('fs'), path = require('path'), url = require('url')
const T = require('./timeline.js')

;(async () => {
  const mode = process.argv[2]
  const N = Math.round(T.duration * T.fps)
  const times = mode === 'all' ? [...Array(N).keys()].map(i => i / T.fps) : process.argv[3].split(',').map(Number)
  const dir = path.join(__dirname, mode === 'all' ? 'frames' : 'stills')
  if (mode === 'all') fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
  await p.goto(url.pathToFileURL(path.join(__dirname, 'video.html')).href)
  const ok = await p.evaluate(async () => {
    await Promise.all([...document.fonts].map(f => f.load()))
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})))
    return ['800 100px Manrope', '400 40px Inter', '400 40px "JetBrains Mono"'].every(f => document.fonts.check(f))
  })
  if (!ok) throw new Error('las fuentes no cargaron')
  for (let i = 0; i < times.length; i++) {
    await p.evaluate(t => render(t), times[i])
    const name = mode === 'all' ? `f${String(i).padStart(4, '0')}.png` : `t${times[i].toFixed(2)}.png`
    await p.screenshot({ path: path.join(dir, name) })
  }
  console.log('cuadros', times.length)
  await b.close()
})().catch(e => { console.error(e.message); process.exit(1) })
