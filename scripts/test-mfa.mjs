// node scripts/test-mfa.mjs — pantalla del login del admin segun la sesion (auditoria B-9).
import assert from 'node:assert/strict'
import { mfaStep, factorName, cleanTotpCode, isWrongCode, verifyAgainst } from '../src/utils/mfa.js'

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

const wrong = { code: 'mfa_verification_failed', message: 'Invalid TOTP code entered' }
assert.equal(isWrongCode(wrong), true)
assert.equal(isWrongCode({ message: 'Invalid TOTP code entered' }), true)
assert.equal(isWrongCode({ code: 'over_request_rate_limit' }), false)

// Dos dispositivos: el codigo es del segundo.
const tried = []
assert.deepEqual(await verifyAgainst(['f1', 'f2'], async (id) => { tried.push(id); return id === 'f2' ? null : wrong }), { ok: true })
assert.deepEqual(tried, ['f1', 'f2'])
// El primero acepta: no se prueba el segundo.
tried.length = 0
assert.deepEqual(await verifyAgainst(['f1', 'f2'], async (id) => { tried.push(id); return null }), { ok: true })
assert.deepEqual(tried, ['f1'])
assert.deepEqual(await verifyAgainst(['f1', 'f2'], async () => wrong), { wrongCode: true })
assert.deepEqual(await verifyAgainst(['f1', 'f2'], async (id) => id === 'f1' ? wrong : { code: 'x' }), { failed: true })
assert.deepEqual(await verifyAgainst([], async () => null), { failed: true })

console.log('test-mfa ok')
