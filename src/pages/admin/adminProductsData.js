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
  'Zapatos',
  'Perfumes',
]

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']

export const PANTS_SIZE_OPTIONS = ['28', '30', '32', '33', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52']

export const PERFUME_SIZE_OPTIONS = ['85 ml', '100 ml', '125 ml', '150 ml', '200 ml']

// Tallas MX de calzado (22 a 31, en pasos de media talla)
export const SHOE_SIZE_OPTIONS = Array.from({ length: 19 }, (_, i) => String(22 + i * 0.5))

/**
 * Returns true if the given category/type name is a perfume category.
 * Matches "Perfumes", "Perfumes Dama", "Perfumes Arabes", etc.
 */
export function isPerfumeCategory(type) {
  return typeof type === 'string' && type.toLowerCase().startsWith('perfume')
}

/**
 * Returns true if the given category/type name is footwear.
 * Matches "Zapatos", "Tenis", "Botas", "Sandalias", "Calzado", "Huaraches"...
 */
export function isShoeCategory(type) {
  return typeof type === 'string' && /zapat|tenis|calzad|bota|sandali|huarache|mocasin|mocasín/i.test(type)
}

export function parseList(value) {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}
