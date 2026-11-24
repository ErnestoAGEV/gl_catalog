// Minimo de envio gratis. Vite lo inyecta al construir (vite.config.js lee
// shipping_settings); en node (pruebas, prerender) viene de globalThis o del respaldo.
export const FREE_SHIPPING_MIN = typeof __FREE_SHIPPING_MIN__ !== 'undefined' ? __FREE_SHIPPING_MIN__ : 1499
export const freeShippingText = `$${FREE_SHIPPING_MIN.toLocaleString('es-MX')}`
