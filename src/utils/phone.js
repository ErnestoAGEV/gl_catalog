// WhatsApp del cliente: Mexico a 10 digitos, o cualquier pais con su lada
// (+1 de Estados Unidos, +502 de Guatemala...). Se aceptan espacios, guiones
// y parentesis; lo que cuenta son de 8 a 15 digitos (el maximo de E.164).
export function isValidWhatsapp(value) {
  const raw = String(value || '').trim()
  if (!/^\+?[\d\s\-().]+$/.test(raw)) return false
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

// Misma regla que phone_key() en supabase/place-order.sql: "+52 1 312...",
// "00 52 312...", "044 312..." y "312..." son el mismo numero mexicano.
export function phoneKey(value) {
  const digits = String(value || '').replace(/\D/g, '').replace(/^00/, '')
  if (/^04[45]\d{10}$/.test(digits)) return digits.slice(3)
  if (/^521\d{10}$/.test(digits)) return digits.slice(3)
  if (/^52\d{10}$/.test(digits)) return digits.slice(2)
  return digits
}
