import { state, emit, createStoreError } from './state.js'
import { STORAGE_KEYS } from '../utils/config.js'
import { writeJson } from '../utils/storage.js'
import { sanitizeCouponCode } from '../utils/sanitize.js'
import { supabase } from '../core/supabase.js'
import { getProductById } from './products.js'
import { ensureAdminAccess } from './auth.js'
import { couponBase } from '../utils/promotions.js'

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

  // El porcentaje no se suma a la promo; el envio gratis si sigue valiendo.
  const anyPromo = state.cart.some(item => getProductById(item.productId)?.promo)
  if (anyPromo && !coupon.free_shipping && couponBase(cartLines(), couponCategories) === 0) {
    return { success: false, error: 'Los cupones no aplican a productos en promoción' }
  }

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
    categories: couponCategories,
    firstPurchaseOnly: Boolean(coupon.first_purchase_only)
  }

  writeJson(STORAGE_KEYS.coupon, state.coupon)
  if (!silent) emit()

  return { success: true, coupon: state.coupon }
}

/**
 * Aviso temprano para cupones de primera compra (WELCOME10): pregunta a la base
 * si ese WhatsApp o correo ya lo uso. La regla de verdad vive en place_order; esto solo
 * evita que el cliente se entere al final. Si la consulta falla, no se bloquea.
 */
export async function isFirstPurchaseCouponAvailable(code, whatsapp, email = '') {
  if (!supabase || !code || (!whatsapp && !email)) return true
  const { data, error } = await supabase.rpc('coupon_first_purchase_ok', { p_code: code, p_whatsapp: whatsapp || '', p_email: email || null })
  if (error) return true
  return data !== false
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

  // Misma base que place_order: sin lineas en promocion
  return couponBase(cartLines(), coupon.categories || []) * (coupon.discount || 0)
}

function cartLines() {
  return state.cart.map(i => ({ product: getProductById(i.productId), qty: Number(i.qty) || 0 }))
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
