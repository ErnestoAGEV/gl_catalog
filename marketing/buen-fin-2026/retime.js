// node retime.js <dirWavs>  — ajusta timeline.js a la duración real de s1.wav…s6.wav y escribe timeline.json.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process')

const MIN = { envios: 3.0 }, MIN_DEFAULT = 2.5, LEAD = 0.2, TAIL = 0.4, MAX = 25
const up = (x) => Math.ceil(x * 2 - 1e-9) / 2 // siguiente 0.5 s = un tiempo a 120 BPM = 15 cuadros

const dur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()

function retime(T, durs) {
  let t = 0
  const scenes = T.scenes.map((s, i) => {
    const start = t, voStart = +(start + LEAD).toFixed(3)
    const end = up(Math.max(start + (MIN[s.id] ?? MIN_DEFAULT), voStart + durs[i] + TAIL))
    t = end
    return { ...s, start, voStart, end }
  })
  if (t > MAX) throw new Error(`duración ${t}s > ${MAX}s. Opciones, en orden: acelerar la voz hasta 1.15× (atempo), bajar márgenes a 0.15/0.25, recortar la frase 4.`)
  return { ...T, duration: t, scenes }
}

function write(T, file) {
  const src = fs.readFileSync(file, 'utf8')
  let i = 0
  const out = src.replace(/start: [\d.]+, end: [\d.]+, voStart: [\d.]+/g, () => {
    const s = T.scenes[i++]; return `start: ${s.start}, end: ${s.end}, voStart: ${s.voStart}`
  }).replace(/duration: [\d.]+/, `duration: ${T.duration}`)
  if (i !== T.scenes.length) throw new Error('timeline.js no tiene el formato esperado')
  fs.writeFileSync(file, out)
  fs.writeFileSync(path.join(path.dirname(file), 'timeline.json'), JSON.stringify(T, null, 2))
}

module.exports = { retime, dur }

if (require.main === module) {
  const dir = process.argv[2]
  if (!dir) { console.error('uso: node retime.js <dirWavs>'); process.exit(2) }
  const file = path.join(__dirname, 'timeline.js')
  const T = require(file)
  const durs = T.scenes.map((_, i) => dur(path.join(dir, `s${i + 1}.wav`)))
  const R = retime(T, durs)
  write(R, file)
  console.log('duración', R.duration, R.scenes.map(s => `${s.id} ${s.start}–${s.end}`).join(' | '))
}
