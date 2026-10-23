// node scripts/test-phone.mjs
import assert from 'node:assert/strict'
import { isValidWhatsapp, phoneKey } from '../src/utils/phone.js'

// ── validos ──
assert.ok(isValidWhatsapp('312 123 4567'), 'Mexico a 10 digitos')
assert.ok(isValidWhatsapp('(312) 123-4567'))
assert.ok(isValidWhatsapp('+52 312 123 4567'))
assert.ok(isValidWhatsapp('+52 1 312 123 4567'))
assert.ok(isValidWhatsapp('+1 619 555 1234'), 'Estados Unidos')
assert.ok(isValidWhatsapp('+502 5555 1234'), 'Guatemala con lada')
assert.ok(isValidWhatsapp('5555 1234'), 'Guatemala local, 8 digitos')

// ── invalidos ──
assert.ok(!isValidWhatsapp(''))
assert.ok(!isValidWhatsapp('312 12'), 'muy corto')
assert.ok(!isValidWhatsapp('1234567890123456'), 'mas de 15 digitos')
assert.ok(!isValidWhatsapp('312abc4567'), 'letras')
assert.ok(!isValidWhatsapp('31+2 123 4567'), '+ solo al inicio')

// ── misma persona, distinta forma de escribirlo ──
assert.equal(phoneKey('+52 1 312 123 4567'), '3121234567')
assert.equal(phoneKey('+52 312 123 4567'), '3121234567')
assert.equal(phoneKey('312-123-4567'), '3121234567')
assert.equal(phoneKey('00 52 312 123 4567'), '3121234567', 'prefijo internacional 00')
assert.equal(phoneKey('044 312 123 4567'), '3121234567', 'prefijo 044 de celular')
assert.equal(phoneKey('045 312 123 4567'), '3121234567')
assert.equal(phoneKey('+1 619 555 1234'), '16195551234')
assert.equal(phoneKey('+502 5555 1234'), '50255551234')

console.log('ok — phone')
