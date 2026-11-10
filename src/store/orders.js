import { state } from './state.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'

/**
 * El pedido lo arma la base, no el navegador: place_order relee los precios de
 * `products` y revalida el cupon antes de insertar. Aca solo se dice QUE se
 * quiere comprar. Ver supabase/place-order.sql
 */
export async function saveOrder({ name, whatsapp, email, paymentMethod, deliveryMethod, address, items, couponCode, expectedTotal }) {
  if (!supabase) return { error: 'No hay conexión a la base de datos' }
  const { error } = await supabase.rpc('place_order', {
    p_customer_name: name,
    p_customer_whatsapp: whatsapp,
    p_payment_method: paymentMethod,
    p_delivery_method: deliveryMethod,
    p_address: address || null,
    p_items: items,
    p_coupon_code: couponCode || null,
    p_customer_email: email || null,
    // Si la promo cambio con la pagina abierta, la base rechaza en vez de cobrar otro total
    p_expected_total: expectedTotal ?? null,
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

export function updateAdminOrderStatus(orderId, newStatus) {
  return updateAdminOrder(orderId, { status: newStatus })
}

/** Costo de envio que se cobro aparte; null lo borra */
export function updateAdminOrderShipping(orderId, shippingCost) {
  return updateAdminOrder(orderId, { shipping_cost: shippingCost })
}

/**
 * Manda al cliente el correo de confirmacion (una vez por pedido). Devuelve el
 * estado de send_order_confirmation: 'sent', 'no_email', 'already_sent'...
 * Ver supabase/order-confirmation.sql
 */
export async function sendOrderConfirmation(orderId, { subject, html }) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }
  const { data, error } = await supabase.rpc('send_order_confirmation', { p_order_id: String(orderId), p_subject: subject, p_html: html })
  if (error && import.meta.env.DEV) console.error('Error sending order confirmation:', error)
  return { result: data, error }
}

async function updateAdminOrder(orderId, fields) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update(fields)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Error updating order:', err)
    return { error: err.message }
  }
}

/**
 * Correos del equipo que reciben el aviso de cada pedido nuevo o cancelado.
 * Ver supabase/order-staff-notify.sql
 */
export async function getOrderNotifyEmails() {
  const access = await ensureAdminAccess()
  if (!access.ok) return { emails: [], error: access.error.message }
  const { data, error } = await supabase.from('order_notify_emails').select('email').order('created_at')
  return { emails: (data || []).map(r => r.email), error }
}

export async function addOrderNotifyEmail(email) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }
  const { error } = await supabase.from('order_notify_emails').insert({ email })
  return { error }
}

export async function removeOrderNotifyEmail(email) {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }
  const { error } = await supabase.from('order_notify_emails').delete().eq('email', email)
  return { error }
}

/** Manda el ultimo pedido, marcado [Prueba], a la lista: 'sent', 'no_emails', 'no_orders' o 'error' */
export async function sendOrderStaffTest() {
  const access = await ensureAdminAccess()
  if (!access.ok) return { error: access.error.message }
  const { data, error } = await supabase.rpc('send_order_staff_test')
  return { result: data, error }
}
