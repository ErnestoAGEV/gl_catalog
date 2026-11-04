// Nombre de color -> muestra. Uno solo para la ficha, la bolsa y el catalogo:
// habia tres copias distintas y a ninguna le tocaba "Amarillo".
const COLOR_HEX = {
  'negro': '#0A0A0F', 'blanco': '#FFFFFF', 'azul': '#214fc7',
  'rojo': '#b03832', 'verde': '#3b4a3e', 'gris': '#6b7280',
  'beige': '#d6c4a4', 'marino': '#19355c', 'oliva': '#566042',
  'hueso': '#F4EFE3', 'carbón': '#3a3530', 'café': '#5c3d2e',
  'crudo': '#E8DFD0', 'arena': '#C2B280', 'celeste': '#87CEEB',
  'rosa': '#E8A0BF', 'mostaza': '#D4A017', 'vino': '#722F37',
  'lavanda': '#B57EDC', 'coral': '#FF7F50', 'menta': '#98FF98',
  'terracota': '#CC6333', 'perla': '#EAE0C8', 'piedra': '#928E85',
  'chocolate': '#3C1414', 'marfil': '#FFFFF0', 'nude': '#E8C4A2',
  'khaki': '#C3B091', 'camel': '#C19A6B', 'ceniza': '#B2BEB5',
  'amarillo': '#E8C547', 'naranja': '#E07B39', 'morado': '#6B4C9A',
  'plomo': '#5F6670', 'tabaco': '#7A5230',
}
const UNKNOWN = '#D4D4D4'

export function colorHex(name) {
  const n = String(name || '').trim()
  if (!n) return UNKNOWN
  if (n.startsWith('#')) return n
  return COLOR_HEX[n.toLowerCase()] || UNKNOWN
}
