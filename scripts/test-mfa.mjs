// node scripts/test-mfa.mjs — pantalla del login del admin segun la sesion (auditoria B-9).
import assert from 'node:assert/strict'
import { mfaStep, factorName, cleanTotpCode } from '../src/utils/mfa.js'

assert.equal(mfaStep({ currentLevel: 'aal2', nextLevel: 'aal2' }), 'none')
assert.equal(mfaStep({ currentLevel: 'aal1', nextLevel: 'aal2' }), 'challenge')
assert.equal(mfaStep({ currentLevel: 'aal1', nextLevel: 'aal1' }), 'enroll')
assert.equal(mfaStep({ currentLevel: null, nextLevel: null }), 'login')
assert.equal(mfaStep(), 'login')

assert.equal(factorName([]), 'G&L admin')
assert.equal(factorName(['G&L admin']), 'G&L admin 2')
assert.equal(factorName(['G&L admin', 'G&L admin 2']), 'G&L admin 3')
assert.equal(factorName(['G&L admin 2']), 'G&L admin')
assert.equal(factorName(['G&L admin', 'G&L admin 3']), 'G&L admin 2')

assert.equal(cleanTotpCode('123456'), '123456')
assert.equal(cleanTotpCode(' 123 456 '), '123456')
assert.equal(cleanTotpCode('12345'), null)
assert.equal(cleanTotpCode('12345a'), null)
assert.equal(cleanTotpCode(null), null)

console.log('test-mfa ok')
