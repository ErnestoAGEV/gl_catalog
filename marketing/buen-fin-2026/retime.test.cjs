// node retime.test.cjs
const assert = require('assert/strict'), os = require('os'), fs = require('fs'), path = require('path')
const { execFileSync } = require('child_process')
const { retime, dur } = require('./retime.js')
const T = require('./timeline.js')

// dur() lee la duración real de un WAV
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retime-'))
const wav = path.join(tmp, 's.wav')
execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '1.7', '-y', wav])
assert.ok(Math.abs(dur(wav) - 1.7) < 0.02)

// fórmula: voStart = start+0.2; end = ceil0.5(max(start+min, voStart+dur+0.4)); envios min 3.0
const R = retime(T, [1.6, 1.4, 2.6, 5.2, 0.8, 5.5])
assert.deepEqual(R.scenes.map(s => [s.start, s.voStart, s.end]), [
  [0, 0.2, 2.5],        // max(2.5, 2.2) = 2.5
  [2.5, 2.7, 5],        // max(5.0, 4.5) = 5
  [5, 5.2, 8.5],        // 8.2 → 8.5
  [8.5, 8.7, 14.5],     // 14.3 → 14.5
  [14.5, 14.7, 17.5],   // envios: mínimo 3.0 gana sobre 15.9
  [17.5, 17.7, 24],     // 17.7+5.5+0.4 = 23.6 → 24
])
assert.equal(R.duration, 24)
assert.ok(Number.isInteger(R.duration * R.fps))
assert.throws(() => retime(T, [3, 3, 4, 7, 2, 7]), /acelerar la voz/)
console.log('retime.test: OK')
