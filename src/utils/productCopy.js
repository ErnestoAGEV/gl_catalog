// Texto de producto derivado de los atributos reales (marca, tipo, color,
// tallas, precio). Modulo puro, sin DOM: lo usan routeSeo.js en runtime y
// scripts/prerender.mjs en build.
//
// Ningun producto de la base tiene descripcion propia todavia, y la meta
// description era la misma plantilla para los 235. Esto no sustituye a una
// descripcion escrita a mano —cuando el campo `description` tenga texto, ese
// gana— pero al menos cada producto dice algo distinto y util.

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

const LETTER_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

const MAX_LENGTH = 158

/** "Oggi - Chinos 900" -> "Oggi". 228 de 235 productos siguen ese formato. */
export function productBrand(name) {
  const brand = String(name || '').split(' - ')[0].trim()
  return brand || 'G&L'
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
    test: /oggi\s*-\s*vaxter\s+gabarina/i,
    corta: 'corte Vaxter recto slim, en gabardina',
    larga:
      'Es el mismo corte Vaxter —recto slim, tiro largo, cintura media y pierna amplia— ' +
      'pero en gabardina en lugar de mezclilla. Se ve más de vestir y va con camisa sin problema.',
  },
  {
    test: /oggi\s*-\s*vaxter/i,
    corta: 'corte recto slim, tiro largo, cintura media y pierna amplia',
    larga:
      'El Vaxter es el pantalón que más sale de la tienda. Corte recto slim: entalla sin apretar, ' +
      'con tiro largo, cintura media y pierna amplia. No es un skinny. Lo manejamos en mezclilla ' +
      'con stretch y en mezclilla rígida: pregunta por WhatsApp cuál buscas antes de que te lo mandemos.',
  },
  {
    test: /oggi\s*-\s*power/i,
    corta: 'corte clásico todo recto, tiro alto y cintura alta',
    larga:
      'El Power es el corte clásico de Oggi: todo recto, de tiro alto y cintura alta. Es el que busca ' +
      'quien no se acomoda con los tiros bajos. Va en mezclilla rígida y en mezclilla con stretch: ' +
      'pregúntanos por WhatsApp cuál te conviene.',
  },
  {
    test: /oggi\s*-\s*iron/i,
    corta: 'slim, cintura media y tiro corto',
    larga:
      'El Iron es el más entallado de la línea: corte slim, cintura media y tiro corto. Si te gusta el ' +
      'pantalón pegado y bajo de cintura, es este. Si lo prefieres de tiro largo, mejor el Vaxter.',
  },
  {
    test: /oggi\s*-\s*chinos?\s+slim/i,
    corta: 'chino de vestir, pierna un poco ajustada',
    larga:
      'Los chinos son la línea de vestir de Oggi. Este es el Slim: la pierna va un poco más ajustada ' +
      'que el chino normal, pero no llega a skinny. Sirve igual con camisa y zapato para algo formal ' +
      'que con tenis para el diario.',
  },
  {
    test: /oggi\s*-\s*chinos?/i,
    corta: 'chino de vestir, pierna amplia',
    larga:
      'Los chinos son la línea de vestir de Oggi. Este es el corte normal, de pierna amplia. Es el ' +
      'pantalón versátil de verdad: aguanta camisa y zapato para algo formal, y al día siguiente sale ' +
      'con tenis.',
  },
  {
    test: /wrangler\s*-\s*wrangler\s+slim/i,
    corta: 'vaquero slim en mezclilla rígida de tejido cruzado',
    larga:
      'Es el Wrangler que más se vende. Sigue siendo corte vaquero, en Slim. Toda la mezclilla Wrangler ' +
      'que manejamos es rígida: en esta marca no hay stretch. Cuesta más que un Oggi por la tela, que es ' +
      'mezclilla de tejido cruzado, bastante más resistente y pensada para montar. Es la que se lleva ' +
      'la gente que anda en el campo y a caballo.',
  },
  {
    test: /wrangler\s*-\s*wrangler\s+regular/i,
    corta: 'vaquero regular en mezclilla rígida de tejido cruzado',
    larga:
      'Corte vaquero regular: más suelto de pierna que el Slim, que es el que más se vende. La mezclilla ' +
      'es la misma, rígida y de tejido cruzado, porque en Wrangler no manejamos stretch. Esa tela es la ' +
      'razón de que cueste más que un Oggi: aguanta mucho más y está pensada para montar y para el campo.',
  },
  {
    test: /white\s*peak/i,
    corta: 'polo de algodón, fresca',
    larga:
      'Las White Peak son de algodón. Es una tela fresca, que aquí en Colima es lo que importa. Si ' +
      'prefieres una tela deportiva que transpire más, checa las Soul&Blues.',
  },
  {
    test: /soul\s*&\s*blues/i,
    corta: 'polo en tela tipo dry fit, transpirable',
    larga:
      'Las Soul&Blues vienen en tela tipo dry fit: transpiran, así que son las que piden para el calor ' +
      'o para andar todo el día fuera. Si prefieres algodón, las White Peak son igual de frescas.',
  },
  {
    test: /odyssey\s+mandarin\s+sky/i,
    corta: 'fragancia dulce, versátil de día y de noche',
    larga:
      'Es un perfume dulce y de los más versátiles que tenemos: funciona igual de día que de noche. ' +
      'Lo recomendamos sobre todo para la temporada de invierno.',
  },
  {
    test: /rusty\s*-\s*bermuda\s+slim/i,
    corta: 'bermuda slim, tiro medio, arriba de la rodilla',
    larga:
      'Bermuda de corte slim y tiro medio. Queda arriba de la rodilla, que es lo que la ' +
      'diferencia de un short largo.',
  },
  {
    test: /sherman\s*morgan\s*-\s*playeras?\s+oversize/i,
    corta: 'playera oversize de 250 g',
    larga:
      'Playera de 250 gramos: es tela de peso, no de las que transparentan ni se deforman al ' +
      'primer lavado. Corte oversize, holgada de hombro y cuerpo.',
  },
  {
    test: /lee\s*-\s*slim\s*fit/i,
    corta: 'pierna slim y cintura alta',
    larga: 'Corte Lee de pierna slim y cintura alta.',
  },
  {
    test: /lee\s*-\s*regular\s*fit/i,
    corta: 'pierna amplia, cintura alta, mezclilla rígida',
    larga: 'Corte Lee de pierna amplia y cintura alta, en mezclilla rígida.',
  },
  {
    test: /paddocks\s*-\s*san\s*francisco/i,
    corta: 'el corte Buffalo en tallas extra',
    larga:
      'Es el mismo corte Buffalo —clásico, pierna amplia, tiro alto y cintura alta— pero en ' +
      'tallas extra. Es al que mandamos a quien no encuentra su talla en el resto de la tienda.',
  },
  {
    test: /paddocks\s*-\s*buffalo/i,
    corta: 'corte clásico, pierna amplia, tiro alto y cintura alta',
    larga:
      'El Buffalo es el corte clásico de Paddocks: pierna amplia, tiro alto y cintura alta. ' +
      'Si buscas la misma horma en talla extra, pregunta por el San Francisco.',
  },
  {
    test: /paddocks\s*-\s*relaxed/i,
    corta: 'recto slim de pierna relajada y cintura media',
    larga:
      'El Relaxed es un recto slim con la pierna relajada y cintura media: ni tan amplio como el ' +
      'Buffalo ni tan pegado como el Rocker.',
  },
  {
    test: /paddocks\s*-\s*rocker/i,
    corta: 'slim de cintura baja',
    larga:
      'El Rocker es el más pegado de Paddocks: corte slim y cintura baja. Si lo quieres más ' +
      'suelto, el Relaxed; si lo quieres de cintura alta, el Buffalo.',
  },
  {
    test: /oaktree\s*-\s*polo/i,
    corta: 'polo de algodón pima, hecho en México',
    larga:
      'Polo de algodón pima, hecho en México. Lo manejamos en talla extra, que es justo lo que ' +
      'cuesta encontrar en polos.',
  },
  {
    test: /oaktree\s*-/i,
    corta: 'hecho en México',
    larga: 'Oaktree es marca mexicana: sus camisas y playeras están hechas en México.',
  },
]

/**
 * El parrafo de la tienda para este producto, o cadena vacia si su familia
 * todavia no esta descrita. La descripcion propia de la base siempre gana.
 */
export function fitNote(product) {
  const own = String(product?.description || '').trim()
  if (own) return own
  const name = String(product?.name || '')
  return FAMILIES.find((f) => f.test.test(name))?.larga || ''
}

/** La version corta, para que quepa en la meta description. */
function fitShort(product) {
  const name = String(product?.name || '')
  return FAMILIES.find((f) => f.test.test(name))?.corta || ''
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

  const tail = ' Envío a todo México desde Colima.'
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
  const singular = typeSingular(product?.type)
  const dama = product?.type === 'Perfumes Dama'
  const color = colorPhrase(product?.colors)
  const name = color ? `${product?.name} en ${color}` : product?.name

  // "para dama" se conserva un escalon mas que "para hombre": la tienda es de
  // moda masculina, asi que ahi el publico si distingue.
  const candidatos = [
    `${name} | ${singular} para ${dama ? 'dama' : 'hombre'} | G&L`,
    `${name} | ${dama ? `${singular} dama` : singular} | G&L`,
    `${name} | G&L`,
  ]
  return candidatos.find((t) => t.length <= MAX_TITLE) || candidatos.at(-1)
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
