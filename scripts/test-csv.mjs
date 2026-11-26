// node scripts/test-csv.mjs — CSV sin inyeccion de formulas (auditoria B-6).
import assert from 'node:assert/strict'
import { csvCell, csvRow } from '../src/utils/csv.js'

assert.equal(csvCell('=HYPERLINK("http://x","Ver")'), `"'=HYPERLINK(""http://x"",""Ver"")"`)
assert.equal(csvCell('Juan "J" Pérez'), '"Juan ""J"" Pérez"')
assert.equal(csvCell('+52 312 123 4567'), `"'+52 312 123 4567"`)
assert.equal(csvCell('@a'), `"'@a"`)
assert.equal(csvCell('\tx'), `"'\tx"`)
assert.equal(csvCell('\rx'), `"'\rx"`)
assert.equal(csvCell(null), '""')
assert.equal(csvCell(12.5), '"12.5"')
assert.equal(csvRow(['a', 'b,c']), '"a","b,c"')
