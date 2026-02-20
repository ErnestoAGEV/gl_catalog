// Static data for the admin products page

export const BADGE_OPTIONS = [
  { value: '', label: 'Sin badge', color: 'bg-gray-500' },
  { value: 'Nuevo', label: 'Nuevo', color: 'bg-blue-500' },
  { value: 'Oferta', label: 'Oferta', color: 'bg-red-500' },
  { value: 'Popular', label: 'Popular', color: 'bg-amber-500' },
  { value: 'Premium', label: 'Premium', color: 'bg-purple-500' },
]

export const CATEGORY_OPTIONS = [
  'Camisas',
  'Playeras',
  'Polos',
  'Pantalones',
  'Shorts',
  'Sudaderas',
  'Suéteres',
  'Chamarras',
  'Abrigos',
  'Perfumes',
]

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const PANTS_SIZE_OPTIONS = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52']

export const PERFUME_SIZE_OPTIONS = ['80 ml', '100 ml', '125 ml', '150 ml', '200 ml']

export function parseList(value) {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

export function getBadgeColor(badge) {
  const found = BADGE_OPTIONS.find(b => b.value === badge)
  return found?.color || 'bg-gray-500'
}
