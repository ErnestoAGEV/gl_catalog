export const BRAND = {
  name: 'G&L',
  tagline: 'Ropa de hombre en México. Compra rápida por WhatsApp.',
  whatsapp: '523123202932',
  freeShippingMin: 999,
}

// Formato internacional sin '+' (ej: 5255XXXXXXXX). Reemplazar por el número real.
export const STORE_WHATSAPP_NUMBER = '523123202932'

export const STORAGE_KEYS = {
  products: 'gl_products',
  cart: 'gl_cart',
  adminSession: 'gl_admin_session',
  wishlist: 'gl_wishlist',
  theme: 'gl_theme',
  coupon: 'gl_coupon',
  newsletter: 'gl_newsletter',
}

export const COUPONS = {
  'WELCOME10': { discount: 0.10, label: '10% de descuento' },
  'VERANO20': { discount: 0.20, label: '20% de descuento' },
  'ENVIOGRATIS': { discount: 0, freeShipping: true, label: 'Envío gratis' },
}

export const ADMIN_CREDENTIALS = {
  user: 'admin',
  pass: 'admin123',
}
