import { state } from './state.js'
import { supabase } from '../core/supabase.js'
import { ensureAdminAccess } from './auth.js'

export async function saveOrder(orderData) {
  if (!supabase) return { error: 'No hay conexión a la base de datos' }
  const { error } = await supabase.from('orders').insert(orderData)
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
