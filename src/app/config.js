export const BRAND = {
  name: import.meta.env.VITE_BRAND_NAME || 'G&L',
  tagline: 'Boutique de moda masculina en Colima. Curado desde 1995.',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '523121018263',
  freeShippingMin: 1499,
}

// Formato internacional sin '+' (ej: 5255XXXXXXXX). Reemplazar por el número real.
export const STORE_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '523121018263'

export const STORAGE_KEYS = {
  products: 'gl_products',
  cart: 'gl_cart',
  wishlist: 'gl_wishlist',
  theme: 'gl_theme',
  coupon: 'gl_coupon',
  newsletter: 'gl_newsletter',
  productViews: 'gl_product_views',
}
