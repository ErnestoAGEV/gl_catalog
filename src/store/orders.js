import { state } from './state.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'

/**
 * El pedido lo arma la base, no el navegador: place_order relee los precios de
 * `products` y revalida el cupon antes de insertar. Aca solo se dice QUE se
 * quiere comprar. Ver supabase/place-order.sql
 */
export async function saveOrder({ name, whatsapp, paymentMethod, deliveryMethod, address, items, couponCode }) {
  if (!supabase) return { error: 'No hay conexión a la base de datos' }
  const { error } = await supabase.rpc('place_order', {
    p_customer_name: name,
    p_customer_whatsapp: whatsapp,
    p_payment_method: paymentMethod,
    p_delivery_method: deliveryMethod,
    p_address: address || null,
    p_items: items,
    p_coupon_code: couponCode || null,
  })
  return { error }
}

export async function getAdminOrders() {
  if (!supabase || !state.isAdminAuthed) return []

  const access = await ensureAdminAccess()
  if (!access.ok) return []

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error fetching admin orders:', err)
    return []
  }
}

export async function updateAdminOrderStatus(orderId, newStatus) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error updating order status:', err)
    return { error: err.message }
  }
}
