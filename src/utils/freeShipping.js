// Minimo de envio gratis. Vite lo inyecta al construir (vite.config.js lee
// shipping_settings); en node (pruebas, prerender) viene de globalThis o del respaldo.
export const FREE_SHIPPING_MIN = typeof __FREE_SHIPPING_MIN__ !== 'undefined' ? __FREE_SHIPPING_MIN__ : 1499
// Respuesta de la RPC free_shipping_min -> numero valido o 1499 (nunca 0 por un null/''/[]).
export const parseFreeShippingMin = (ok, raw) => (ok && typeof raw === 'number' && raw >= 0 ? raw : 1499)
export const freeShippingText = `$${FREE_SHIPPING_MIN.toLocaleString('es-MX')}`
