/**
 * sanitize.js — Utilería central de sanitización de inputs
 * Usar antes de enviar cualquier dato de usuario a Supabase o al DOM.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COUPON_RE = /[^A-Z0-9]/g

/**
 * Elimina etiquetas HTML y hace trim al string.
 * Usar para: nombres, direcciones, referencias, etc.
 * @param {string} val
 * @returns {string}
 */
export function sanitizeText(val) {
  if (typeof val !== 'string') return ''
  return val
    .trim()
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/&(lt|gt|amp|quot|#x27);/gi, '') // strip HTML entities
    .slice(0, 500) // límite razonable de longitud
}

/**
 * Normaliza y valida un email.
 * @param {string} val
 * @returns {{ value: string, valid: boolean }}
 */
export function sanitizeEmail(val) {
  if (typeof val !== 'string') return { value: '', valid: false }
  const value = val.trim().toLowerCase().slice(0, 254)
  return { value, valid: EMAIL_RE.test(value) }
}

/**
 * Limpia un código de cupón: solo letras mayúsculas y dígitos, máx. 20 chars.
 * @param {string} val
 * @returns {string}
 */
export function sanitizeCouponCode(val) {
  if (typeof val !== 'string') return ''
  return val.toUpperCase().trim().replace(COUPON_RE, '').slice(0, 20)
}

/**
 * Convierte un valor a número, devolviendo `def` si no es válido.
 * @param {*} val
 * @param {number} def - Valor por defecto
 * @returns {number}
 */
export function sanitizeNumber(val, def = 0) {
  const n = Number(val)
  return Number.isFinite(n) && n >= 0 ? n : def
}

/**
 * Escapa caracteres especiales HTML para uso seguro en innerHTML.
 * Usar cuando se interpolea texto de usuario en plantillas HTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
