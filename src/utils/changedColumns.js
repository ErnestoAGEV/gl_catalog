// Columnas de la fila que se derivan de un campo con otro nombre.
const SOURCE = { image_url: 'images', original_price: 'originalPrice', originalprice: 'originalPrice' }

/** Deja en row solo las columnas que vienen de un campo presente en updates. */
export function changedColumns(row, updates) {
  return Object.fromEntries(Object.entries(row).filter(([col]) => (SOURCE[col] || col) in updates))
}
