// Texto de producto derivado de los atributos reales (marca, tipo, color,
// tallas, precio). Modulo puro, sin DOM: lo usan routeSeo.js en runtime y
// scripts/prerender.mjs en build.
//
// Ningun producto de la base tiene descripcion propia todavia, y la meta
// description era la misma plantilla para los 235. Esto no sustituye a una
// descripcion escrita a mano —cuando el campo `description` tenga texto, ese
// gana— pero al menos cada producto dice algo distinto y util.
import { groupOf } from './related.js'

// Largo del id que se pega al final del slug. 8 hex de un uuid v4 dan 4 mil
// millones de combinaciones: de sobra para 235 productos, y no hace falta que
// sea unico por si solo — el slug completo ya lo es.
const SHORT_ID_LENGTH = 8

const TYPE_SINGULAR = {
  Camisas: 'Camisa',
  Polos: 'Polo',
  Pantalones: 'Pantalón',
  Shorts: 'Short',
  Playeras: 'Playera',
  Perfumes: 'Perfume',
  'Perfumes Dama': 'Perfume',
}

// Las fragancias guardan la presentacion ("100 ml") en el campo de tallas
const isFragrance = (type) => String(type || '').startsWith('Perfume')

const LETTER_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']

const MAX_LENGTH = 158

// La marca vive dentro del nombre con el formato "Marca - Modelo". Siete
// productos se cargaron sin el espacio ("Collor's -Bermuda"), asi que el
// separador acepta espacios opcionales de los dos lados.
const BRAND_SEPARATOR = /\s*-\s*/

// La misma marca se tecleo con acento agudo y con tilde invertida (Collor`s y
// Collor's): sin normalizar, el schema y el listado de marcas de cada
// categoria la cuentan dos veces.
const normalizeApostrophes = (text) => text.replace(/[`´‘’]/g, "'")

/** "Oggi - Chinos 900" -> "Oggi". */
export function productBrand(name) {
  const brand = String(name || '').split(BRAND_SEPARATOR)[0].trim()
  // En la base hay "VerdeTabaco" y "Verde Tabaco": es la misma marca
  return normalizeApostrophes(brand).replace(/^VerdeTabaco$/i, 'Verde Tabaco') || 'G&L'
}

/** "Oggi - Chinos 900" -> "Chinos 900". Lo que queda al quitar la marca. */
export function productModel(name) {
  const text = String(name || '')
  const at = text.search(BRAND_SEPARATOR)
  if (at === -1) return text.trim()
  return text.slice(at).replace(BRAND_SEPARATOR, '').trim()
}

export function typeSingular(type) {
  return TYPE_SINGULAR[type] || 'Prenda'
}

/**
 * Resume las tallas: numericas como rango ("30 a 40"), de letra en su orden
 * natural ("S a XL"), y cualquier otra cosa tal cual.
 */
export function sizeSummary(sizes) {
  const list = (sizes || []).map((s) => String(s).trim()).filter(Boolean)
  if (!list.length) return ''
  if (list.length === 1) return list[0]

  const numbers = list.map(Number)
  if (numbers.every((n) => Number.isFinite(n))) {
    const min = Math.min(...numbers)
    const max = Math.max(...numbers)
    return min === max ? String(min) : `${min} a ${max}`
  }

  const letters = list.filter((s) => LETTER_ORDER.includes(s.toUpperCase()))
  if (letters.length === list.length) {
    const sorted = [...letters].sort(
      (a, b) => LETTER_ORDER.indexOf(a.toUpperCase()) - LETTER_ORDER.indexOf(b.toUpperCase())
    )
    return `${sorted[0]} a ${sorted[sorted.length - 1]}`
  }

  return list.join(', ')
}

/**
 * Orden en que se muestran las tallas: numericas de menor a mayor, luego las
 * de letra (XS..XXXL), luego volumenes de perfume ("80 ml" < "100 ml") y al
 * final cualquier otra cosa alfabetica. Sin duplicados.
 */
export function sortSizes(sizes) {
  const list = [...new Set((sizes || []).map((s) => String(s).trim()).filter(Boolean))]
  const rank = (s) => {
    if (Number.isFinite(Number(s))) return [0, Number(s)]
    const letter = LETTER_ORDER.indexOf(s.toUpperCase())
    if (letter !== -1) return [1, letter]
    const ml = s.match(/^(\d+(?:\.\d+)?)\s*ml$/i)
    if (ml) return [2, Number(ml[1])]
    return [3, 0]
  }
  return list.sort((a, b) => {
    const [ga, va] = rank(a)
    const [gb, vb] = rank(b)
    return ga - gb || va - vb || a.localeCompare(b, 'es')
  })
}

// Filtro de tallas del catalogo: en "Todo" se juntaban 25 tallas de cintura,
// letra, calzado y ml. Se agrupan por tipo de prenda, no por el valor: el 28
// de un pantalon y el 28 de un zapato no son la misma talla.
const SIZE_GROUP_LABELS = [['top', 'Ropa'], ['other', 'Otras'], ['bottom', 'Cintura'], ['shoes', 'Calzado'], ['perfume', 'Perfume']]

export function sizeGroups(products) {
  const byGroup = new Map()
  for (const p of products || []) {
    const type = groupOf(p.type)
    for (const raw of p.sizes || []) {
      const size = String(raw).trim()
      // La letra siempre es talla de ropa y los ml de perfume, sea cual sea la prenda
      const g = LETTER_ORDER.includes(size.toUpperCase()) ? 'top' : /\d\s*ml$/i.test(size) ? 'perfume' : type
      if (!byGroup.has(g)) byGroup.set(g, [])
      byGroup.get(g).push(size)
    }
  }
  return SIZE_GROUP_LABELS
    .filter(([g]) => byGroup.has(g))
    .map(([g, label]) => ({ label, sizes: sortSizes(byGroup.get(g)) }))
    .filter(x => x.sizes.length)
}

/** "Azul", "Azul y Negro", "Azul, Negro y Gris" */
export function colorPhrase(colors) {
  const list = (colors || []).map((c) => String(c).trim()).filter(Boolean)
  if (!list.length) return ''
  if (list.length === 1) return list[0]
  return `${list.slice(0, -1).join(', ')} y ${list[list.length - 1]}`
}

// ── Lo que sabe la tienda ───────────────────────────────────────────────────
//
// Estos datos no estan en la base y no se pueden derivar del nombre: como cae
// un corte, de que es la tela, para quien es. Salen del mostrador (Ernesto,
// sept 2026) y son lo unico que el comprador no puede ver en la foto.
//
// Van por familia, no por SKU: un Vaxter Stone y un Vaxter Ink son el mismo
// pantalon en otro color. Asi cubren tambien los modelos que entren despues.
//
// `corta` entra en la meta description; `larga` es el parrafo de la pagina.
// El orden importa: la primera que casa gana, y las reglas mas especificas
// (Gabarina, Chinos Slim) van antes que las generales.
const FAMILIES = [
  {
    test: /oggi\s*-\s*vaxter.*gabar?d?ina/i,
    corta: 'corte Vaxter recto slim, en gabardina',
    larga:
      'Es el corte Vaxter —recto slim, tiro largo, cintura media y pierna amplia— confeccionado ' +
      'en gabardina en lugar de mezclilla. Tiene una apariencia más formal y combina bien con camisa.',
  },
  {
    test: /oggi\s*-\s*vaxter/i,
    denim: true,
    corta: 'corte recto slim, tiro largo, cintura media y pierna amplia',
    larga:
      'El Vaxter es el corte favorito de nuestros clientes. Es un recto slim que se ajusta sin apretar, ' +
      'con tiro largo, cintura media y pierna amplia. Está disponible en mezclilla con stretch y en ' +
      'mezclilla rígida; si tienes dudas sobre cuál elegir, con gusto te asesoramos por WhatsApp.',
  },
  {
    test: /oggi\s*-\s*power/i,
    denim: true,
    corta: 'corte clásico todo recto, tiro alto y cintura alta',
    larga:
      'El Power es el corte clásico de Oggi: recto de principio a fin, con tiro alto y cintura alta. ' +
      'Es una buena opción si prefieres evitar los tiros bajos. Está disponible en mezclilla rígida y ' +
      'en mezclilla con stretch; consúltanos por WhatsApp para elegir la que más te convenga.',
  },
  {
    test: /oggi\s*-\s*iron/i,
    denim: true,
    corta: 'slim, cintura media y tiro corto',
    larga:
      'El Iron es el corte más entallado de la línea: slim, con cintura media y tiro corto. Es la opción ' +
      'indicada si prefieres un pantalón ajustado; si lo buscas de tiro largo, te recomendamos el Vaxter.',
  },
  {
    test: /oggi\s*-\s*leader/i,
    denim: true,
    corta: 'jean de mezclilla en corte loose',
    larga:
      'El Leader está confeccionado en mezclilla, en corte loose: más holgado que el Vaxter, con más ' +
      'amplitud en la pierna para mayor comodidad.',
  },
  {
    test: /oggi\s*-\s*chinos?\s+slim/i,
    corta: 'chino de vestir, pierna un poco ajustada',
    larga:
      'Los chinos forman la línea de vestir de Oggi. Este es el modelo Slim: la pierna es un poco más ' +
      'ajustada que la del chino regular, sin llegar a ser skinny. Funciona tanto con camisa y zapato ' +
      'para una ocasión formal como con tenis para el día a día.',
  },
  {
    test: /oggi\s*-\s*chinos?/i,
    corta: 'chino de vestir, pierna amplia',
    larga:
      'Los chinos forman la línea de vestir de Oggi. Este es el corte regular, de pierna amplia, y es un ' +
      'pantalón muy versátil: combina con camisa y zapato para una ocasión formal, y con tenis para el ' +
      'día a día.',
  },
  {
    test: /wrangler\s*-\s*wrangler\s+slim/i,
    denim: true,
    corta: 'vaquero slim en mezclilla rígida de tejido cruzado',
    larga:
      'El Slim Fit es el modelo más solicitado de Wrangler: conserva el corte vaquero con un ajuste más ' +
      'estilizado. Está confeccionado en mezclilla rígida de tejido cruzado, más resistente que la ' +
      'mezclilla convencional y pensada para el trabajo de campo y la monta.',
  },
  {
    test: /wrangler\s*-\s*wrangler\s+regular/i,
    denim: true,
    corta: 'vaquero regular en mezclilla rígida de tejido cruzado',
    larga:
      'El Regular conserva el corte vaquero, con la pierna más holgada que el Slim Fit. Como todos ' +
      'nuestros Wrangler, está confeccionado en mezclilla rígida de tejido cruzado, sin stretch: una tela ' +
      'más resistente que la mezclilla convencional, pensada para el campo y la monta.',
  },
  {
    test: /white\s*peak/i,
    tipo: 'Polos',
    corta: 'polo de algodón, tela fresca',
    larga:
      'Las White Peak están confeccionadas en algodón, una tela fresca, adecuada para climas cálidos. ' +
      'Si prefieres una tela deportiva con mayor transpiración, te sugerimos las Soul&Blues.',
  },
  {
    test: /soul\s*&\s*blues/i,
    tipo: 'Polos',
    corta: 'polo en tela tipo dry fit, transpirable',
    larga:
      'Las Soul&Blues están confeccionadas en tela tipo dry fit, que transpira y resulta cómoda para el ' +
      'calor o para pasar todo el día fuera. Si prefieres algodón, las White Peak son igualmente frescas.',
  },
  {
    test: /odyssey\s+mandarin\s+sky/i,
    corta: 'fragancia dulce, versátil de día y de noche',
    larga:
      'Es una fragancia dulce y versátil, adecuada tanto para el día como para la noche. La ' +
      'recomendamos especialmente para la temporada de invierno.',
  },
  {
    test: /rusty\s*-\s*bermuda\s+slim/i,
    corta: 'bermuda slim, tiro medio, arriba de la rodilla',
    larga:
      'Bermuda de corte slim y tiro medio. Su largo queda arriba de la rodilla, lo que la distingue ' +
      'de un short largo.',
  },
  {
    test: /sherman\s*morgan\s*-\s*playeras?\s+oversize/i,
    corta: 'playera oversize de 250 g',
    larga:
      'Playera de 250 gramos: una tela con cuerpo, que no transparenta ni se deforma al primer ' +
      'lavado. Corte oversize, holgado en hombros y cuerpo.',
  },
  {
    test: /lee\s*-\s*slim\s*fit/i,
    denim: true,
    corta: 'pierna slim y cintura alta',
    larga: 'Corte Lee de pierna slim y cintura alta.',
  },
  {
    test: /lee\s*-\s*regular\s*fit/i,
    denim: true,
    corta: 'pierna amplia, cintura alta, mezclilla rígida',
    larga: 'Corte Lee de pierna amplia y cintura alta, en mezclilla rígida.',
  },
  {
    test: /paddocks\s*-\s*san\s*francisco/i,
    denim: true,
    corta: 'el corte Buffalo en tallas extra',
    larga:
      'Es el corte Buffalo —clásico, de pierna amplia, tiro alto y cintura alta— en tallas extra. ' +
      'Es el modelo que recomendamos si no encuentras tu talla en el resto de la tienda.',
  },
  {
    test: /paddocks\s*-\s*buffalo/i,
    denim: true,
    corta: 'corte clásico, pierna amplia, tiro alto y cintura alta',
    larga:
      'El Buffalo es el corte clásico de Paddocks: pierna amplia, tiro alto y cintura alta. ' +
      'Si buscas la misma horma en talla extra, te recomendamos el San Francisco.',
  },
  {
    test: /paddocks\s*-\s*relaxed/i,
    denim: true,
    corta: 'recto slim de pierna relajada y cintura media',
    larga:
      'El Relaxed es un recto slim con pierna relajada y cintura media: más ajustado que el Buffalo ' +
      'y más holgado que el Rocker.',
  },
  {
    test: /paddocks\s*-\s*rocker/i,
    denim: true,
    corta: 'slim de cintura baja',
    larga:
      'El Rocker es el corte más ajustado de Paddocks: slim y de cintura baja. Si lo prefieres más ' +
      'holgado, te recomendamos el Relaxed; si lo buscas de cintura alta, el Buffalo.',
  },
  {
    test: /oaktree\s*-\s*polo/i,
    corta: 'polo de algodón pima, hecho en México',
    larga:
      'Polo de algodón pima, hecho en México. Está disponible en talla extra, una medida difícil de ' +
      'encontrar en polos.',
  },
  {
    test: /oaktree\s*-/i,
    corta: 'hecho en México',
    larga: 'Oaktree es una marca mexicana: sus camisas y playeras se fabrican en México.',
  },
  {
    // El apostrofo de la marca esta tecleado de tres formas distintas, y en
    // estas siete el separador va sin espacio: el patron no depende de ninguno.
    test: /collor.{0,2}s\s*-?\s*bermuda\s+gabardina/i,
    corta: 'bermuda de gabardina de horma justa; sugerimos una talla más',
    larga:
      'Bermuda de gabardina. Es la única prenda de la tienda con horma algo justa: si estás entre ' +
      'dos tallas o prefieres un ajuste holgado, te recomendamos pedir una talla más de la que usas.',
  },
]

// Varias marcas cruzan categorias —White Peak hace polos y pantalones,
// Soul&Blues hace polos, camisas y shorts—, asi que una familia que describe
// una prenda concreta declara su `tipo`. Sin este candado, cinco pantalones
// White Peak decian ser polos de algodon.
function familyFor(product) {
  const name = String(product?.name || '')
  const type = String(product?.type || '')
  return FAMILIES.find((f) => f.test.test(name) && (!f.tipo || f.tipo === type))
}

/** true si la prenda es de una familia de mezclilla (se busca como "jeans"). */
export const isDenim = (product) => Boolean(familyFor(product)?.denim)

/**
 * El parrafo de la tienda para este producto, o cadena vacia si su familia
 * todavia no esta descrita. La descripcion propia de la base siempre gana.
 */
export function fitNote(product) {
  const own = String(product?.description || '').trim()
  if (own) return own
  return familyFor(product)?.larga || ''
}

/** La version corta, para que quepa en la meta description. */
function fitShort(product) {
  return familyFor(product)?.corta || ''
}

/**
 * Meta description y descripcion del schema. Va agregando datos mientras
 * quepan en MAX_LENGTH, para no cortar una frase a la mitad en el SERP.
 */
export function productDescription(product) {
  const own = String(product?.description || '').trim()
  if (own) return own

  const parts = []
  const singular = typeSingular(product?.type)
  const fragrance = isFragrance(product?.type)
  const audience = product?.type === 'Perfumes Dama' ? 'para dama' : 'para hombre'

  // Cuando la tienda ya describio la familia, ese dato vale mas en el SERP que
  // repetir el tipo: "corte recto slim, tiro largo" contra "pantalon para hombre".
  const fit = fitShort(product)
  parts.push(`${product?.name}: ${fit || `${singular.toLowerCase()} ${audience}`}`)

  const colors = colorPhrase(product?.colors)
  if (colors && !fragrance) parts.push(`en ${colors.toLowerCase()}`)

  let text = `${parts.join(' ')}.`

  const sizes = sizeSummary(product?.sizes)
  if (sizes) {
    const clause = fragrance ? ` Presentación ${sizes}.` : ` Tallas ${sizes}.`
    if (text.length + clause.length <= MAX_LENGTH) text += clause
  }

  const price = Number(product?.price)
  if (Number.isFinite(price) && price > 0) {
    const clause = ` $${price.toLocaleString('es-MX')} MXN.`
    if (text.length + clause.length <= MAX_LENGTH) text += clause
  }

  const tail = ' Envío a todo México.'
  if (text.length + tail.length <= MAX_LENGTH) text += tail

  return text
}

/**
 * Title del SERP. Lleva el color porque 33 productos son la misma prenda en
 * varios colores, cada uno con su fila: sin el, 11 grupos comparten title y
 * compiten entre si. Ademas es como se busca ("chino Oggi negro").
 */
// Google corta el title alrededor de los 60 caracteres. Con el formato largo
// se pasaban 118 de 235 productos, hasta 86 caracteres: el comprador veia la
// marca cortada a media palabra.
const MAX_TITLE = 60

/**
 * Title de producto. El tipo y el publico ayudan a posicionar, pero lo que el
 * comprador reconoce es el nombre y el color: si no cabe todo, cede el medio y
 * nunca el nombre.
 */
export function productTitle(product) {
  // "Jeans" es como se busca la mezclilla; un chino o una gabardina siguen siendo "Pantalón"
  const singular = familyFor(product)?.denim ? 'Jeans' : typeSingular(product?.type)
  const dama = product?.type === 'Perfumes Dama'
  const color = colorPhrase(product?.colors)
  // "White Peak - Amarillo en Amarillo": si el nombre ya dice el color, no se repite
  const fold = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const saysColor = color && fold(product?.name).split(/[^a-z0-9]+/).includes(fold(color))
  const name = color && !saysColor ? `${product?.name} en ${color}` : product?.name

  // "para dama" se conserva un escalon mas que "para hombre": la tienda es de
  // moda masculina, asi que ahi el publico si distingue.
  const candidatos = [
    `${name} | ${singular} para ${dama ? 'dama' : 'hombre'} | G&L`,
    `${name} | ${dama ? `${singular} dama` : singular} | G&L`,
    `${name} | G&L`,
  ]
  return candidatos.find((t) => t.length <= MAX_TITLE) || candidatos[candidatos.length - 1]
}

// ── Merchant Center ─────────────────────────────────────────────────────────

/** Publico del producto para el schema: Merchant pide genero y edad en ropa. */
export function productAudience(product) {
  return {
    '@type': 'PeopleAudience',
    suggestedGender: product?.type === 'Perfumes Dama' ? 'female' : 'male',
    suggestedMinAge: 13,
  }
}

/**
 * Precio tachado como ListPrice, solo si de verdad es mayor que el de venta:
 * un precio de lista igual o menor Google lo marca como error.
 */
export function listPriceSpec(product) {
  const list = Number(product?.original_price)
  if (!(list > Number(product?.price))) return undefined
  return {
    '@type': 'UnitPriceSpecification',
    price: list,
    priceCurrency: 'MXN',
    priceType: 'https://schema.org/ListPrice',
  }
}

// ── URL del producto ────────────────────────────────────────────────────────
//
// El uuid crudo no dice nada al que ve el link en WhatsApp ni a Google. El
// slug lleva marca, modelo y color, y termina con los primeros 8 caracteres
// del id.
//
// Ese sufijo no es decoracion: la URL se resuelve por el, no por el texto. Asi
// renombrar un producto desde el panel no rompe los links ya compartidos, y
// dos filas con el mismo nombre y color no colisionan.

/** "Oggi - Chinos 900" + ["Gris"] -> "oggi-chinos-900-gris" */
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function productSlug(product) {
  const shortId = String(product?.id || '').replace(/-/g, '').slice(0, SHORT_ID_LENGTH)
  const words = slugify([product?.name, ...(product?.colors || [])].join(' '))
  return words ? `${words}-${shortId}` : shortId
}

export function productPath(product) {
  return `/producto/${productSlug(product)}`
}

/**
 * Encuentra el producto de una ruta. Acepta el slug nuevo y el uuid completo
 * de las urls viejas: hay links de esos repartidos por conversaciones de
 * WhatsApp y tienen que seguir abriendo el producto.
 */
export function findProductByPath(products, segment) {
  const raw = String(segment || '').trim()
  if (!raw || !products?.length) return undefined

  const direct = products.find((p) => String(p.id) === raw)
  if (direct) return direct

  const shortId = raw.split('-').pop()
  if (!shortId) return undefined
  return products.find(
    (p) => String(p.id).replace(/-/g, '').slice(0, SHORT_ID_LENGTH) === shortId
  )
}

// ── Imagen para la preview de WhatsApp / Facebook ───────────────────────────
//
// El CDN sirve las fotos en webp (`?f=webp`), y ni WhatsApp ni Facebook
// renderizan webp en la preview de un link: la descartan y muestran lo que
// tuvieran cacheado. Para og:image se les pide la misma foto en jpg.
//
// Google si lee webp, asi que el JSON-LD y los <img> de la pagina se quedan
// como estan — esto es solo para el meta tag.

const SOCIAL_FALLBACK = '/heroeGL.jpg'
const SITE_URL = 'https://www.glboutique.com.mx'

export function socialImage(...urls) {
  for (const url of urls.flat()) {
    if (!url) continue
    const absolute = new URL(url, SITE_URL)
    // El CDN de la tienda sirve webp por defecto; la misma foto en jpg existe.
    if (absolute.searchParams.get('f') === 'webp') {
      absolute.searchParams.set('f', 'jpg')
      absolute.searchParams.set('s', 'large')
      return absolute.toString()
    }
    // Un webp que no se puede convertir se salta: mejor la siguiente foto del
    // producto que una imagen que no es del producto.
    if (/\.webp$/i.test(absolute.pathname)) continue
    return absolute.toString()
  }
  return `${SITE_URL}${SOCIAL_FALLBACK}`
}
