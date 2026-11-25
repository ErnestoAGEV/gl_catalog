// node scripts/test-coupons.mjs
import assert from 'node:assert/strict'
import { couponExpiryIso, couponExpiryDate } from '../src/utils/coupons.js'

assert.equal(couponExpiryIso('2026-12-31'), '2026-12-31T23:59:59-06:00')
assert.equal(couponExpiryIso(''), null)
assert.equal(couponExpiryDate('2026-12-31T23:59:59-06:00'), '2026-12-31')
assert.equal(couponExpiryDate('2027-01-01T05:59:59Z'), '2026-12-31')
assert.equal(couponExpiryDate(null), '')
