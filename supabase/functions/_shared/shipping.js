// Lógica pura de envío. ESM sin APIs de Deno/Node/DOM: la importan el navegador,
// la Edge Function y las pruebas.

// Centavos enteros antes de dividir: 185.0000001 no debe subir a 190.
export const roundUp5 = (n) => Math.ceil(Math.round(n * 100) / 500) * 5

export function buildPackage(items, weights, settings) {
  let grams = 0
  let needsBox = false
  for (const { type, qty } of items) {
    const w = weights[type] ?? { grams: settings.default_grams, needs_box: settings.default_needs_box }
    grams += w.grams * qty
    needsBox ||= w.needs_box
  }
  const { envelope, box } = settings
  if (!needsBox && grams <= envelope.max_grams) {
    return { kind: 'envelope', grams, length: envelope.length, width: envelope.width, height: envelope.height }
  }
  if (grams > box.max_grams) return null
  return { kind: 'box', grams, length: box.length, width: box.width, height: box.height }
}

export function pickTiers(rates) {
  const rounded = rates.map((r) => ({ ...r, cost: r.price, price: roundUp5(r.price) }))
  if (!rounded.length) return null
  const standard = rounded.reduce((a, b) => (b.price < a.price ? b : a))
  // Express: llega estrictamente antes que Standard; días desconocidos no cuentan.
  const faster = standard.days == null ? [] : rounded.filter((r) => r.days != null && r.days < standard.days)
  const express = faster.length ? faster.reduce((a, b) => (b.price < a.price ? b : a)) : null
  return { standard, express }
}

export const isFreeShipping = (subtotal, coupon, min) => !!coupon?.freeShipping || subtotal >= min

// Envío gratis cubre Standard; Express cobra solo la diferencia.
export function chargeFor(tiers, tier, free) {
  if (tier === 'express') {
    if (!tiers.express) throw new Error('Sin tarifa Express')
    return free ? tiers.express.price - tiers.standard.price : tiers.express.price
  }
  return free ? 0 : tiers.standard.price
}

// Orden por código de carácter (igual que collate "C" en SQL); sin localeCompare.
export function cartKey(items) {
  const qty = {}
  for (const { productId, qty: q } of items) qty[String(productId)] = (qty[String(productId)] ?? 0) + q
  return Object.keys(qty)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((id) => `${id}:${qty[id]}`)
    .join('|')
}

export const isMxZip = (zip) => /^\d{5}$/.test(zip)

// shortcut: códigos ISO 3166-2:MX; verificar contra el formato de Envia al desplegar
export const MX_STATES = [
  ['AGU', 'Aguascalientes'], ['BCN', 'Baja California'], ['BCS', 'Baja California Sur'], ['CAM', 'Campeche'],
  ['CHP', 'Chiapas'], ['CHH', 'Chihuahua'], ['CMX', 'Ciudad de México'], ['COA', 'Coahuila'],
  ['COL', 'Colima'], ['DUR', 'Durango'], ['GUA', 'Guanajuato'], ['GRO', 'Guerrero'],
  ['HID', 'Hidalgo'], ['JAL', 'Jalisco'], ['MEX', 'Estado de México'], ['MIC', 'Michoacán'],
  ['MOR', 'Morelos'], ['NAY', 'Nayarit'], ['NLE', 'Nuevo León'], ['OAX', 'Oaxaca'],
  ['PUE', 'Puebla'], ['QUE', 'Querétaro'], ['ROO', 'Quintana Roo'], ['SLP', 'San Luis Potosí'],
  ['SIN', 'Sinaloa'], ['SON', 'Sonora'], ['TAB', 'Tabasco'], ['TAM', 'Tamaulipas'],
  ['TLA', 'Tlaxcala'], ['VER', 'Veracruz'], ['YUC', 'Yucatán'], ['ZAC', 'Zacatecas'],
].map(([code, name]) => ({ code, name }))
