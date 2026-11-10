// node sheet.cjs → out/sheet.png con todos los stills/ en una cuadrícula (cada uno a 270×480)
const sharp = require('sharp'), fs = require('fs'), path = require('path')
;(async () => {
  const dir = path.join(__dirname, 'stills')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort((a, b) => parseFloat(a.slice(1)) - parseFloat(b.slice(1)))
  const w = 270, h = 480, cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols)
  const tiles = await Promise.all(files.map(async (f, i) => ({
    input: await sharp(path.join(dir, f)).resize(w, h).toBuffer(), left: (i % cols) * (w + 10), top: Math.floor(i / cols) * (h + 10),
  })))
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true })
  await sharp({ create: { width: cols * (w + 10), height: rows * (h + 10), channels: 3, background: '#888' } }).composite(tiles).png().toFile(path.join(__dirname, 'out/sheet.png'))
  console.log('out/sheet.png', files.length)
})()
