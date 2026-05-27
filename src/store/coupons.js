import { state, emit, createStoreError } from './state.js'
import { STORAGE_KEYS } from '../utils/config.js'
import { writeJson } from '../utils/storage.js'
import { sanitizeCouponCode } from '../utils/sanitize.js'
import { supabase } from '../core/supabase.js'
import { getProductById } from './products.js'
import { cartTotal } from './cart.js'
import { ensureAdminAccess } from './auth.js'

export async function applyCoupon(code, silent = false) {
  const normalizedCode = sanitizeCouponCode(code)
  if (!normalizedCode) return { success: false, error: 'Código de cupón inválido' }
  if (!supabase) {
    return { success: false, error: 'No se pudo validar el cupón en este momento. Intenta de nuevo.' }
  }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalizedCode)
    .eq('active', true)
    .single()

  if (error || !coupon) {
    return { success: false, error: 'Cupón no válido o expirado' }
  }

  const couponCategories = coupon.categories || []

  if (couponCategories.length > 0) {
    const hasApplicableItem = state.cart.some(item => {
      const p = getProductById(item.productId)
      return p && couponCategories.includes(p.type)
    })
    if (!hasApplicableItem) {
      return { success: false, error: 'Este cupón no aplica para los productos en tu carrito' }
    }
  }

  state.coupon = {
    code: coupon.code,
    discount: Number(coupon.discount),
    freeShipping: coupon.free_shipping,
    label: coupon.label,
    categories: couponCategories
  }

  writeJson(STORAGE_KEYS.coupon, state.coupon)
  if (!silent) emit()

  return { success: true, coupon: state.coupon }
}

export function removeCoupon(silent = false) {
  state.coupon = null
  writeJson(STORAGE_KEYS.coupon, null)
  if (!silent) emit()
}

export function getCoupon() {
  return state.coupon
}

export function getDiscountAmount(couponOverride = null) {
  const coupon = couponOverride || state.coupon
  if (!coupon) return 0

  const discountRate = coupon.discount || 0
  const applicableCategories = coupon.categories || []

  if (applicableCategories.length === 0) {
    return cartTotal() * discountRate
  }

  const applicableSubtotal = state.cart.reduce((acc, i) => {
    const product = getProductById(i.productId)
    if (!product) return acc
    if (!applicableCategories.includes(product.type)) return acc
    return acc + (product.price * i.qty)
  }, 0)

  return applicableSubtotal * discountRate
}

export function getDiscountedTotal() {
  return cartTotal() - getDiscountAmount()
}

export async function getAdminCoupons() {
  if (!supabase || !state.isAdminAuthed) return []

  const access = await ensureAdminAccess()
  if (!access.ok) return []

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error fetching admin coupons:', err)
    return []
  }
}

export async function createCoupon(payload) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }

  const { data, error } = await supabase
    .from('coupons')
    .insert(payload)
    .select()
    .single()
  if (error) {
    if (import.meta.env.DEV) console.error('Error creating coupon:', error)
    return { error }
  }
  return { data }
}

export async function updateCoupon(code, payload) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }

  const { error } = await supabase
    .from('coupons')
    .update(payload)
    .eq('code', code)
  if (error) {
    if (import.meta.env.DEV) console.error('Error updating coupon:', error)
    return { error }
  }
  return { error: null }
}

export async function deleteCoupon(code) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('code', code)
  if (error) {
    if (import.meta.env.DEV) console.error('Error deleting coupon:', error)
    return { error }
  }
  return { error: null }
}
