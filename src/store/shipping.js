import { supabase } from '../core/supabase.js'

/**
 * Cotiza Estandar/Express con la Edge Function shipping-quote. Cualquier fallo
 * (429, 500, red, sin quoteId) vuelve {fallback: true}: el costo se confirma por WhatsApp.
 */
export async function quoteShipping({ zipCode, state, city, items }) {
  if (!supabase) return { fallback: true }
  try {
    const { data, error } = await supabase.functions.invoke('shipping-quote', {
      body: { zipCode: String(zipCode), state, city, items },
    })
    return error || !data?.quoteId ? { fallback: true } : data
  } catch (_err) {
    return { fallback: true }
  }
}
