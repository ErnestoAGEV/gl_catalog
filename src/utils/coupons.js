// Vigencia de cupones: el admin elige un dia y vence al final de ese dia en
// hora de Ciudad de Mexico (UTC-6 fijo, sin horario de verano desde 2022).

// '2026-12-31' -> '2026-12-31T23:59:59-06:00'; '' -> null (sin vencimiento)
export function couponExpiryIso(dateStr) {
  return dateStr ? `${dateStr}T23:59:59-06:00` : null
}

// Inversa: timestamptz -> 'aaaa-mm-dd' en hora de Ciudad de Mexico; null -> ''
export function couponExpiryDate(iso) {
  if (!iso) return ''
  return new Date(new Date(iso).getTime() - 6 * 3600 * 1000).toISOString().slice(0, 10)
}
