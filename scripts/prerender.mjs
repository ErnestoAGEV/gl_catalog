// Prerender de build: emite un HTML por ruta dentro de dist/ con el <head>
// correcto (title, description, canonical, OG, Twitter, JSON-LD) y un bloque
// de contenido rastreable. La SPA hidrata encima como siempre.
//
// Antes de esto, vercel.json reescribia TODA url a "/", asi que /catalog,
// /producto/:id y /categoria/:x servian el HTML de la home byte por byte:
// los crawlers y scrapers que no ejecutan JS (Bing, GPTBot, preview de
// WhatsApp) nunca veian el producto.
//
// Se ejecuta despues de `vite build`. Ver package.json.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { getSeoForRoute } from '../src/core/routeSeo.js'
import { infoPages } from '../src/pages/info/infoData.js'
import { INSTAGRAM_URL, STORE_PHONE, stores } from '../src/pages/home/homeData.js'
import {
  colorPhrase,
  productBrand,
  productDescription,
  productPath,
  sizeSummary,
  socialImage,
} from '../src/utils/productCopy.js'
import { isInStock } from '../src/utils/stock.js'
import { isPerfumeCategory } from '../src/pages/admin/adminProductsData.js'

const BASE_URL = 'https://www.glboutique.com.mx'
const DIST = 'dist'
const DEFAULT_IMAGE = `${BASE_URL}/bannergl.webp`

// En Vercel las variables vienen del entorno; en local, de .env (que vite
// carga solo, pero este script corre fuera de vite).
if (!process.env.VITE_SUPABASE_URL && existsSync('.env')) {
  // split /\r?\n/ y no '\n': con CRLF el \r sobrante rompe el $ del regex
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (match) process.env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, '')
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

// ── Utilidades ──────────────────────────────────────────────────────────────

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// JSON dentro de <script>: solo hay que cortar la secuencia que cerraria el tag
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

const absolute = (path) => new URL(path, BASE_URL).toString()

// Politica comercial real de la tienda. Google Shopping la muestra al comprador,
// asi que estos numeros tienen que cuadrar con lo que dice la tienda.
// freeShippingMin duplica el valor de src/utils/config.js (ese usa
// import.meta.env y no se puede importar desde node).
const FREE_SHIPPING_MIN = 1499
const SHIPPING_COST = 150

const shippingDetails = [
  {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: SHIPPING_COST, currency: 'MXN' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'MX' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 4, unitCode: 'DAY' },
    },
  },
  {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: 0,
      currency: 'MXN',
      // Envio gratis a partir de este subtotal
      eligibleTransactionVolume: {
        '@type': 'PriceSpecification',
        minPrice: FREE_SHIPPING_MIN,
        priceCurrency: 'MXN',
      },
    },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'MX' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 4, unitCode: 'DAY' },
    },
  },
]

// No hay devoluciones con reembolso: solo cambios, dentro de 8 dias desde la
// entrega, con el envio a cargo del cliente (salvo error de talla nuestro,
// matiz que schema.org no sabe expresar).
const returnPolicy = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'MX',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 8,
  returnMethod: 'https://schema.org/ReturnByMail',
  refundType: 'https://schema.org/ExchangeRefund',
  returnFees: 'https://schema.org/ReturnShippingFees',
  returnShippingFeesAmount: {
    '@type': 'MonetaryAmount',
    value: SHIPPING_COST,
    currency: 'MXN',
  },
}

async function supabaseSelect(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!res.ok) throw new Error(`Supabase ${table}: ${res.status} ${await res.text()}`)
  return res.json()
}

// ── Plantilla ───────────────────────────────────────────────────────────────

const template = readFileSync(join(DIST, 'index.html'), 'utf8')

const APP_OPEN = '<div id="app" class="overflow-x-clip">'
const SHELL_END = '<!-- prerender:shell-end'

const appOpenAt = template.indexOf(APP_OPEN)
const shellEndAt = template.indexOf(SHELL_END)
if (appOpenAt === -1 || shellEndAt === -1) {
  throw new Error('No encuentro los limites del shell en dist/index.html — revisa index.html')
}

const headTemplate = template.slice(0, appOpenAt + APP_OPEN.length)
const homeShell = template.slice(appOpenAt + APP_OPEN.length, shellEndAt)
const tail = template.slice(shellEndAt)

/** Reescribe el <head> de la plantilla con los metadatos de una ruta. */
function buildHead({ title, description, robots, canonical, image, images, extraLd, ogType }) {
  let head = headTemplate

  // Ojo: el reemplazo va SIEMPRE como funcion. Con un string, JS expande `$&`,
  // `$'` y `$1` dentro del texto — y las urls de Lee y Wrangler llevan `$&`
  // literal (formato Scene7). Eso partia la url y duplicaba el meta tag.
  const sub = (pattern, text) => {
    head = head.replace(pattern, () => text)
  }

  sub(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)

  // description y robots vienen multilinea en index.html
  sub(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(description)}" />`
  )
  sub(
    /<meta\s+name="robots"[^>]*\/>/,
    `<meta name="robots" content="${escapeHtml(robots)}" />`
  )

  sub(
    /<meta\s+property="og:type"[^>]*\/>/,
    `<meta property="og:type" content="${escapeHtml(ogType || 'website')}" />`
  )
  sub(
    /<meta\s+property="og:url"[^>]*\/>/,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`
  )
  sub(
    /<meta\s+property="og:title"[^>]*\/>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  )
  sub(
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  )
  sub(
    /<meta\s+property="og:image"[^>]*\/>/,
    `<meta property="og:image" content="${escapeHtml(socialImage(images || image))}" />`
  )

  // El canonical ya no se calcula en runtime: cada ruta tiene su HTML propio.
  // El shell de la SPA (spa.html) es la excepcion: no representa una URL, asi
  // que se queda sin canonical en vez de declarar uno falso.
  sub(
    /<!-- Inline script: set canonical dynamically[\s\S]*?<\/script>/,
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : ''
  )

  const social = [
    `<meta property="og:site_name" content="G&amp;L" />`,
    `<meta property="og:locale" content="es_MX" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(socialImage(images || image))}" />`,
  ].join('\n    ')

  return head.replace('</head>', () => `    ${social}\n    ${extraLd || ''}\n  </head>`)
}

function writeRoute(path, html) {
  // El shell se concatena a mano dentro de un <div id="app"> ya abierto: si el
  // bloque no lo cierra, el HTML sale roto en las 240+ paginas de golpe.
  const open = (html.match(/<div\b/g) || []).length
  const close = (html.match(/<\/div>/g) || []).length
  if (open !== close) throw new Error(`${path}: divs desbalanceados (${open} abren, ${close} cierran)`)

  const file = path === '/' ? join(DIST, 'index.html') : join(DIST, path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

/**
 * Pie de contacto. El telefono vivia solo en el JSON-LD y en el footer que
 * pinta el JS: un crawler sin JS no encontraba ni un telefono en todo el sitio,
 * que en un negocio con dos tiendas fisicas es la senal local mas barata.
 */
function contactFooter() {
  const tel = STORE_PHONE.replace(/[^+\d]/g, '')
  const sucursales = stores
    .map((store) => `<p>${escapeHtml(store.name)} — ${escapeHtml(store.address)}</p>`)
    .join('\n              ')
  return `
            <footer class="mt-16 pt-8 border-t border-ink/10 font-mono text-[12px] tracking-[0.06em] text-ink/60">
              <p class="mb-2">
                <a class="ul-link hover:text-ink" href="tel:${tel}">${escapeHtml(STORE_PHONE)}</a>
                <span class="mx-2 text-ink/30">/</span>
                <a class="ul-link hover:text-ink" href="https://wa.me/${tel.replace('+', '')}">WhatsApp</a>
              </p>
              ${sucursales}
            </footer>`
}

// Cuantas fotos de la parrilla se piden de inmediato. Las de mas abajo van
// lazy: solo importan las que caen sobre el pliegue.
const EAGER_GRID_IMAGES = 4

/**
 * Parrilla de producto, compartida por /catalog y /categoria/*.
 *
 * Las primeras van `eager` y con `fetchpriority="high"` a proposito: en movil
 * el elemento LCP del catalogo era una foto de esta parrilla con
 * `loading="lazy"` que ademas no estaba en el HTML —la pintaba el JS despues
 * de pedirsela a Supabase—, y eso costaba ~2,9 s de LCP. Con `width`/`height`
 * declarados, ademas, la tarjeta reserva su hueco y no empuja el layout.
 */
function productGrid(items) {
  const cards = items
    .map((p, i) => {
      const prioridad =
        i < EAGER_GRID_IMAGES ? 'fetchpriority="high"' : 'loading="lazy"'
      return `<li>
                <a href="${productPath(p)}" class="block">
                  <img src="${escapeHtml(p.image_url || '/placeholder.webp')}" alt="${escapeHtml(p.name)}" width="600" height="800" ${prioridad} decoding="async" class="w-full h-auto rounded-xl object-cover">
                  <span class="mt-3 block text-[14px] font-medium">${escapeHtml(p.name)}</span>
                  <span class="block font-mono text-[13px] text-ink/60">$${escapeHtml(p.price)} MXN</span>
                </a>
              </li>`
    })
    .join('\n              ')
  return `<ul class="grid grid-cols-2 md:grid-cols-4 gap-6">
              ${cards}
            </ul>`
}

/**
 * FAQPage a partir de las secciones que ya se ven en la pagina.
 *
 * Aviso para quien lea esto esperando estrellitas: desde agosto de 2023 Google
 * limita los rich results de FAQ a sitios de gobierno y salud, asi que una
 * tienda NO va a ver el desplegable en el buscador. Se pone igual porque el
 * valor real esta en otro lado: deja el contenido en forma de pregunta y
 * respuesta, que es como lo extraen las AI Overviews, ChatGPT y Perplexity.
 *
 * La pregunta del schema es literalmente el <h2> visible y la respuesta el
 * mismo parrafo o lista. Si dejan de coincidir, sobra el marcado.
 */
function faqLd(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.sections.map((sec) => ({
      '@type': 'Question',
      name: sec.h,
      acceptedAnswer: {
        '@type': 'Answer',
        text: sec.list ? sec.list.join(' ') : sec.body,
      },
    })),
  }
}

/**
 * Parrafo de entrada de una categoria, armado con lo que hay de verdad en la
 * base: marcas, rango de tallas y rango de precio.
 *
 * Antes cada categoria era una frase de trece palabras sobre una parrilla, sin
 * nada que un buscador —ni un motor de IA— pudiera citar como respuesta a
 * "camisas para hombre en Colima". Esto no sustituye una guia de compra escrita
 * por alguien que conoce la prenda; es el piso factual, y tiene la ventaja de
 * que se actualiza solo cuando entra marca o talla nueva.
 */
function categoryIntro(category, items) {
  const marcas = [...new Set(items.map((p) => productBrand(p.name)))].filter((m) => m !== 'G&L')
  // Ordenadas por el numero que llevan delante: sin esto salia
  // "Presentaciones de 100 ml, 85 ml", que se lee como descuido.
  const tallas = sizeSummary(
    [...new Set(items.flatMap((p) => p.sizes || []))].sort(
      (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0)
    )
  )
  const precios = items.map((p) => Number(p.price)).filter(Number.isFinite)
  const min = Math.min(...precios)
  const max = Math.max(...precios)

  // Un perfume no tiene tallas ni es una "pieza de perfumes": la misma
  // distincion que ya hace la ficha de producto.
  const esPerfume = isPerfumeCategory(category)
  const frases = [
    esPerfume
      ? `${items.length} ${items.length === 1 ? 'fragancia' : 'fragancias'} en G&amp;L Colima, ` +
        `disponibles en las dos tiendas.`
      : `${items.length} ${items.length === 1 ? 'pieza' : 'piezas'} de ${category.toLowerCase()} ` +
        `en G&amp;L Colima, con ${items.length === 1 ? 'existencia' : 'existencias'} en las dos tiendas.`,
  ]
  if (marcas.length === 1) frases.push(`Todo de ${escapeHtml(marcas[0])}.`)
  else if (marcas.length > 1) {
    const lista = marcas.slice(0, 5).map(escapeHtml)
    frases.push(
      `Marcas: ${lista.join(', ')}${marcas.length > 5 ? ` y ${marcas.length - 5} más` : ''}.`
    )
  }
  if (tallas) {
    frases.push(
      esPerfume
        ? `Presentaciones de ${escapeHtml(tallas)}.`
        : `Tallas de la ${escapeHtml(tallas)}.`
    )
  }
  if (precios.length) {
    frases.push(
      min === max
        ? `Precio: $${min} MXN.`
        : `Precios de $${min} a $${max} MXN.`
    )
  }
  frases.push(
    `Envío a todo México por $${SHIPPING_COST} y gratis desde ` +
      `$${FREE_SHIPPING_MIN.toLocaleString('es-MX')}. ` +
      (esPerfume
        ? `¿No sabes cuál escoger? Pregúntanos por WhatsApp: te decimos a qué huele cada uno.`
        : `Si no te queda, lo cambiamos dentro de 8 días. ¿Dudas de talla? Pregúntanos por ` +
          `WhatsApp antes de comprar: tenemos la prenda enfrente.`)
  )
  return frases.join(' ')
}

/** ItemList que enumera exactamente lo que la pagina contiene. */
function itemListLd(items) {
  return {
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absolute(productPath(p)),
      name: p.name,
    })),
  }
}

/**
 * Bloque visible que la SPA reemplaza al hidratar. Estilado con las clases del sitio.
 * Cierra el <div id="app"> que abre headTemplate — igual que hace homeShell.
 */
function contentShell(inner) {
  // id="prerender-shell": startApp.js lo elimina al hidratar. Sin ese id el
  // bloque se queda en pantalla y la pagina real se dibuja debajo, duplicada.
  return `
      <div id="prerender-shell">
        <div class="min-h-dvh bg-paper text-ink">
          <div class="mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-10">
            ${inner}
            ${contactFooter()}
          </div>
        </div>
      </div>
    </div>
    `
}

function breadcrumbNav(trail) {
  const links = trail
    .map((item, i) =>
      i === trail.length - 1
        ? `<span class="text-ink/60">${escapeHtml(item.name)}</span>`
        : `<a class="ul-link hover:text-ink" href="${escapeHtml(item.path)}">${escapeHtml(item.name)}</a>`
    )
    .join('<span class="mx-2 text-ink/30">/</span>')
  return `<nav class="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50 mb-8">${links}</nav>`
}

const breadcrumbLd = (trail) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absolute(item.path),
  })),
})


// Las dos sucursales, generadas desde stores en vez de escritas a mano en el
// <head> de index.html. Van en todas las paginas.
//
// `url` apunta siempre a la pagina de la sucursal, no a la home: es su
// direccion canonica. Antes se emitia el mismo @id con url distinta segun la
// pagina, y eso deja al consumidor con dos versiones del mismo negocio.
function storeLd(store) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    '@id': `${BASE_URL}/#${store.schemaId}`,
    name: store.fullName,
    description: 'Moda masculina premium en Colima. Camisas, polos, jeans y perfumes.',
    url: absolute(`/sucursales/${store.slug}`),
    logo: `${BASE_URL}/icon-512.png?v=2`,
    image: `${BASE_URL}/icon-512.png?v=2`,
    telephone: STORE_PHONE,
    priceRange: '$$',
    currenciesAccepted: 'MXN',
    address: { '@type': 'PostalAddress', ...store.postal },
    geo: { '@type': 'GeoCoordinates', ...store.geo },
    hasMap: store.mapUrl,
    openingHoursSpecification: store.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days.length === 1 ? h.days[0] : h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    branchOf: { '@id': `${BASE_URL}/#marca` },
  }
}

const allStoresLd = stores.map((store) => jsonLd(storeLd(store))).join('\n    ')

// ── Rutas ───────────────────────────────────────────────────────────────────

const products = SUPABASE_URL
  ? (await supabaseSelect('products', 'select=id,name,price,original_price,type,image_url,images,description,stock,sizes,colors,badge,created_at'))
      .filter((p) => p.badge !== 'Borrador')
  : []

if (!SUPABASE_URL) {
  console.warn('[prerender] Sin VITE_SUPABASE_URL: solo prerenderizo las rutas estaticas')
}

const categories = [...new Set(products.map((p) => p.type).filter(Boolean))].sort()

const routes = []

// Home: conserva su shell prerenderizado actual
// El pie de contacto tambien en la home: su shell es un snapshot y tampoco
// traia el telefono como texto. Va DENTRO de #prerender-shell —por eso se
// inyecta en el marcador y no se concatena al final—: la hidratacion elimina
// ese nodo entero, y colgado por fuera se quedaria duplicado bajo el footer
// real de la SPA.
const HOME_SHELL_MARK = '<!-- prerender-shell:end -->'
if (!homeShell.includes(HOME_SHELL_MARK)) {
  throw new Error(`No encuentro ${HOME_SHELL_MARK} en el shell de la home — revisa index.html`)
}
routes.push({
  path: '/',
  shell: homeShell.replace(HOME_SHELL_MARK, () => `${contactFooter()}\n      ${HOME_SHELL_MARK}`),
})

routes.push({
  path: '/catalog',
  shell: contentShell(`
            ${breadcrumbNav([{ name: 'Inicio', path: '/' }, { name: 'Tienda', path: '/catalog' }])}
            <h1 class="font-heading font-[800] text-[clamp(40px,7vw,88px)] leading-[0.9] tracking-[-0.03em] mb-6">Tienda</h1>
            <p class="text-[17px] text-ink/70 max-w-[560px] leading-relaxed mb-10">${products.length} piezas de moda masculina en Colima: camisas, polos, jeans, playeras y perfumes.</p>
            <ul class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              ${categories.map((c) => `<li><a class="ul-link text-[15px] font-medium" href="/categoria/${encodeURIComponent(c)}">${escapeHtml(c)}</a></li>`).join('\n              ')}
            </ul>
            ${productGrid(products)}`),
  ld: [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Catálogo de ropa para hombre',
      url: absolute('/catalog'),
      isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
      // Enumera los 235: antes declaraba numberOfItems 235 con 100 ListItem
      // dentro, y ese desajuste lo reporta Search Console.
      mainEntity: itemListLd(products),
    },
    breadcrumbLd([{ name: 'Inicio', path: '/' }, { name: 'Tienda', path: '/catalog' }]),
  ],
})

for (const category of categories) {
  const path = `/categoria/${encodeURIComponent(category)}`
  const items = products.filter((p) => p.type === category)
  const trail = [
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/catalog' },
    { name: category, path },
  ]
  routes.push({
    path: `/categoria/${category}`,
    canonicalPath: path,
    seoPath: path,
    image: items[0]?.image_url || DEFAULT_IMAGE,
    shell: contentShell(`
            ${breadcrumbNav(trail)}
            <h1 class="font-heading font-[800] text-[clamp(40px,7vw,88px)] leading-[0.9] tracking-[-0.03em] mb-6">${escapeHtml(category)}</h1>
            <p class="text-[17px] text-ink/70 max-w-[640px] leading-relaxed mb-10">${categoryIntro(category, items)}</p>
            ${productGrid(items)}`),
    ld: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${category} para hombre en Colima`,
        url: absolute(path),
        mainEntity: itemListLd(items),
      },
      breadcrumbLd(trail),
    ],
  })
}

// La base no tiene concepto de grupo: 33 productos son la misma prenda en
// varios colores, con una fila y una URL cada uno, y el nombre repetido es lo
// unico que los une. Sin ProductGroup, Google los ve como 33 productos que
// compiten entre si en vez de un chino en cuatro colores.
//
// Solo agrupamos cuando el nombre se repite; un producto suelto no es grupo.
const variantGroups = new Map()
for (const product of products) {
  const key = product.name.trim()
  if (!variantGroups.has(key)) variantGroups.set(key, [])
  variantGroups.get(key).push(product)
}
for (const [key, group] of variantGroups) {
  if (group.length < 2) variantGroups.delete(key)
}

/**
 * El grupo debe contener la variante de esta pagina exactamente una vez: si no
 * esta, hasVariant se contradice con isVariantOf; si esta dos veces, el mismo
 * @id queda definido dos veces con datos distintos.
 */
function assertOneSelfReference(product, group) {
  const mine = group.filter((variant) => variant.id === product.id).length
  if (mine !== 1) {
    throw new Error(`Grupo "${product.name}": la variante ${product.id} aparece ${mine} veces`)
  }
  return group
}

/** @id estable del grupo: el nombre no vale como fragmento de URL. */
const groupId = (name) =>
  `${BASE_URL}/#grupo-${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

console.log(
  `[prerender] ${variantGroups.size} grupos de variantes ` +
    `(${[...variantGroups.values()].reduce((n, g) => n + g.length, 0)} productos)`
)

for (const product of products) {
  const path = productPath(product)
  const image = product.image_url || product.images?.[0] || DEFAULT_IMAGE
  const group = variantGroups.get(product.name.trim())
  const trail = [
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/catalog' },
    ...(product.type ? [{ name: product.type, path: `/categoria/${encodeURIComponent(product.type)}` }] : []),
    { name: product.name, path },
  ]
  const inStock = isInStock(product)

  routes.push({
    path,
    image,
    // Para la preview de WhatsApp: si la principal es un webp que no se puede
    // convertir, sirve la siguiente foto del producto. Y si todas son webp,
    // el logo — antes que una foto de otra prenda, que confunde al comprador.
    images: [product.image_url, ...(product.images || []), '/icon-512.png?v=2'],
    shell: contentShell(`
            ${breadcrumbNav(trail)}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="900" height="1200" fetchpriority="high" decoding="async" class="w-full h-auto rounded-2xl object-cover">
              <div>
                <h1 class="font-heading font-[800] text-[clamp(32px,5vw,64px)] leading-[0.95] tracking-[-0.03em] mb-4">${escapeHtml(product.name)}</h1>
                <p class="font-mono text-[20px] mb-6">$${escapeHtml(product.price)} MXN${product.original_price ? ` <s class="text-ink/40 text-[15px]">$${escapeHtml(product.original_price)}</s>` : ''}</p>
                <p class="text-[16px] text-ink/70 leading-relaxed mb-6">${escapeHtml(productDescription(product))}</p>
                ${product.sizes?.length ? `<p class="text-[14px] text-ink/60 mb-2">Tallas: ${escapeHtml(product.sizes.join(', '))}</p>` : ''}
                ${product.colors?.length ? `<p class="text-[14px] text-ink/60 mb-6">Colores: ${escapeHtml(product.colors.join(', '))}</p>` : ''}
                <p class="text-[14px] text-ink/60">${inStock ? 'Disponible' : 'Agotado'} · Envío $${SHIPPING_COST} MXN a todo México, gratis en compras +$${FREE_SHIPPING_MIN.toLocaleString('es-MX')} · Entrega en 3-4 días hábiles · Cambios dentro de 8 días · 2 tiendas físicas en Colima</p>
              </div>
            </div>`),
    ld: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${absolute(path)}#product`,
        name: product.name,
        description: productDescription(product),
        image: (product.images?.length ? product.images : [image]).filter(Boolean),
        sku: String(product.id),
        category: product.type || undefined,
        // Los nombres del catalogo vienen como "Marca - Modelo"; Google marca error
        // si le declaras la tienda como brand del producto.
        brand: { '@type': 'Brand', name: product.name.split(' - ')[0].trim() || 'G&L' },
        // Atributos que faltaban: sin color ni size, Google no sabe en que se
        // diferencia una variante de la siguiente.
        color: product.colors?.length ? colorPhrase(product.colors) : undefined,
        size: product.sizes?.length ? product.sizes : undefined,
        ...(group
          ? {
              inProductGroupWithID: product.name.trim(),
              isVariantOf: { '@id': groupId(product.name) },
            }
          : {}),
        offers: {
          '@type': 'Offer',
          url: absolute(path),
          price: Number(product.price),
          priceCurrency: 'MXN',
          availability: `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`,
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': `${BASE_URL}/#marca` },
          shippingDetails,
          hasMerchantReturnPolicy: returnPolicy,
        },
      },
      // El grupo va en la pagina de cada variante, que es donde Google lo
      // espera: no hay una URL de grupo que sirva de canonical.
      ...(group
        ? [
            {
              '@context': 'https://schema.org',
              '@type': 'ProductGroup',
              '@id': groupId(product.name),
              name: product.name,
              productGroupID: product.name.trim(),
              category: product.type || undefined,
              brand: { '@type': 'Brand', name: product.name.split(' - ')[0].trim() || 'G&L' },
              // Solo el color: la base no guarda stock ni precio por talla, asi
              // que declarar la talla como eje seria inventar variantes.
              variesBy: ['https://schema.org/color'],
              // La variante de esta pagina va solo por referencia: ya esta
              // definida arriba y repetirla dejaria dos versiones del mismo
              // @id. Las otras llevan datos, para que la referencia resuelva
              // y Google pueda armar el selector de color.
              hasVariant: assertOneSelfReference(product, group).map((variant) => {
                const variantPath = productPath(variant)
                const variantId = `${absolute(variantPath)}#product`
                if (variant.id === product.id) return { '@id': variantId }
                // Los mismos datos que el Product principal: Google recorre
                // cada nodo anidado y avisa si a una variante le falta el
                // envio o la politica de cambios.
                return {
                  '@type': 'Product',
                  '@id': variantId,
                  name: variant.name,
                  description: productDescription(variant),
                  url: absolute(variantPath),
                  image: variant.image_url || DEFAULT_IMAGE,
                  sku: String(variant.id),
                  color: variant.colors?.length ? colorPhrase(variant.colors) : undefined,
                  size: variant.sizes?.length ? variant.sizes : undefined,
                  offers: {
                    '@type': 'Offer',
                    url: absolute(variantPath),
                    price: Number(variant.price),
                    priceCurrency: 'MXN',
                    availability: `https://schema.org/${isInStock(variant) ? 'InStock' : 'OutOfStock'}`,
                    itemCondition: 'https://schema.org/NewCondition',
                    shippingDetails,
                    hasMerchantReturnPolicy: returnPolicy,
                  },
                }
              }),
            },
          ]
        : []),
      breadcrumbLd(trail),
    ],
  })
}

// Paginas de confianza: el copy vive en infoData.js, aqui se vuelca a HTML
// plano para el crawler que no ejecuta JS.
for (const [path, page] of Object.entries(infoPages)) {
  const trail = [
    { name: 'Inicio', path: '/' },
    ...(page.store ? [{ name: 'Sucursales', path: '/sucursales' }] : []),
    { name: page.eyebrow, path },
  ]
  const body = page.sections
    .map(
      (sec) =>
        `<h2 class="font-heading font-[800] text-[clamp(24px,3vw,34px)] tracking-[-0.02em] mt-10 mb-4">${sec.h}</h2>` +
        (sec.body
          ? `<p class="text-[16px] text-ink/75 max-w-[640px] leading-relaxed">${sec.body}</p>`
          : '') +
        (sec.list
          ? `<ul class="space-y-3 max-w-[640px] mt-4">${sec.list
              .map((i) => `<li class="text-[16px] text-ink/75 leading-relaxed">— ${i}</li>`)
              .join('')}</ul>`
          : '')
    )
    .join('\n              ')

  routes.push({
    path,
    shell: contentShell(`
            ${breadcrumbNav(trail)}
            <h1 class="font-heading font-[800] text-[clamp(44px,7vw,92px)] leading-[0.92] tracking-[-0.035em] mb-6">${page.heading}</h1>
            <p class="text-[18px] text-ink/70 max-w-[640px] leading-relaxed">${page.lead}</p>
            ${body}`),
    ld: [breadcrumbLd(trail), ...(page.faq ? [faqLd(page)] : [])],
  })
}

// Rutas de carrito/checkout: noindex, pero necesitan HTML propio para no
// depender del rewrite catch-all
for (const path of ['/cart', '/checkout', '/checkout/success']) {
  routes.push({ path, shell: contentShell('') })
}

// ── Escritura ───────────────────────────────────────────────────────────────

// La entidad de marca. Se referencia desde WebSite.publisher, de las dos
// ClothingStore por branchOf y de cada Offer por seller, pero hasta ahora solo
// se declaraba como stub de un campo (`name`) repetido en cada sitio. Sin url,
// logo ni sameAs no hay grafo de entidad: ni Knowledge Panel ni Merchant Center
// pueden confirmar que esas referencias hablan del mismo negocio.
const brandLd = jsonLd({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${BASE_URL}/#marca`,
  name: 'G&L',
  alternateName: 'G&L Boutique',
  url: `${BASE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/icon-512.png?v=2`,
    width: 512,
    height: 512,
  },
  image: `${BASE_URL}/icon-512.png?v=2`,
  description:
    'Boutique de moda masculina en Colima desde 1995. Camisas, polos, jeans, ' +
    'playeras, shorts y perfumes, con dos tiendas fisicas y venta por WhatsApp.',
  foundingDate: '1995',
  telephone: STORE_PHONE,
  areaServed: { '@type': 'Country', name: 'MX' },
  // Perfiles que confirman la entidad desde fuera. Solo los reales: un sameAs
  // inventado es peor que ninguno.
  sameAs: [INSTAGRAM_URL, ...stores.map((store) => store.mapUrl)],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: STORE_PHONE,
    areaServed: 'MX',
    availableLanguage: ['es'],
  },
})

const websiteLd = jsonLd({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  url: `${BASE_URL}/`,
  name: 'G&L',
  inLanguage: 'es-MX',
  publisher: { '@id': `${BASE_URL}/#marca` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/catalog?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
})

for (const route of routes) {
  const seoPath = route.seoPath || route.path
  const seo = getSeoForRoute(seoPath, seoPath, { products })
  const canonical = absolute(route.canonicalPath || seo.canonicalPath || route.path)
  const extraLd = [brandLd, websiteLd, allStoresLd, ...(route.ld || []).map(jsonLd)].join('\n    ')

  const head = buildHead({
    title: seo.title,
    description: seo.description,
    robots: seo.robots,
    canonical,
    image: route.image || DEFAULT_IMAGE,
    images: route.images,
    ogType: route.path.startsWith('/producto/') ? 'product' : 'website',
    extraLd,
  })

  writeRoute(route.path, head + route.shell + tail)
}

// 404 real: Vercel sirve dist/404.html cuando ninguna ruta hace match
writeFileSync(
  join(DIST, '404.html'),
  buildHead({
    title: 'Página no encontrada | G&L',
    description: 'La página que buscas no existe. Explora el catálogo de G&L.',
    robots: 'noindex,follow',
    canonical: absolute('/404'),
    image: DEFAULT_IMAGE,
    extraLd: [brandLd, websiteLd].join('\n    '),
  }) +
    contentShell(`
            <h1 class="font-heading font-[800] text-[clamp(40px,7vw,88px)] leading-[0.9] tracking-[-0.03em] mb-6">404</h1>
            <p class="text-[17px] text-ink/70 mb-8">La página que buscas no existe.</p>
            <a href="/catalog" class="inline-flex items-center h-14 px-7 rounded-full bg-ink text-paper text-[15px] font-semibold">Ir a la tienda</a>`) +
    tail
)

// Shell de la SPA para /producto/:id y /categoria/:name que no existen todavia
// en dist/.
//
// El caso real que sostiene: un producto dado de alta en el panel abre de
// inmediato porque la SPA lo resuelve contra Supabase, sin esperar al deploy,
// que es manual. Antes esos rewrites apuntaban a "/", asi que cualquier url
// inventada devolvia la home entera con 200, index,follow y canonical "/" —
// un espacio infinito de duplicados de la home.
//
// Este shell hace lo mismo para el usuario y nada para el indice: noindex y
// sin canonical. Si la SPA encuentra el producto, applySeo() pone en runtime
// el title, el canonical y el index,follow que le corresponden.
writeFileSync(
  join(DIST, 'spa.html'),
  buildHead({
    title: 'G&L | Tu fit perfecto',
    description: 'Moda masculina premium en Colima. Camisas, polos, jeans y perfumes en G&L.',
    robots: 'noindex,follow',
    canonical: null,
    image: DEFAULT_IMAGE,
    extraLd: [brandLd, websiteLd].join('\n    '),
  }) +
    contentShell(`
            <p class="text-[17px] text-ink/70">Cargando…</p>`) +
    tail
)

// ── Sitemap ─────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)
const lastmodOf = (p) => (p.created_at ? p.created_at.slice(0, 10) : today)

const urls = [
  { loc: `${BASE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
  { loc: `${BASE_URL}/catalog`, lastmod: today, changefreq: 'daily', priority: '0.9' },
  ...categories.map((c) => ({
    loc: `${BASE_URL}/categoria/${encodeURIComponent(c)}`,
    lastmod: today,
    changefreq: 'weekly',
    priority: '0.8',
  })),
  ...Object.keys(infoPages).map((path) => ({
    loc: `${BASE_URL}${path}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.6',
  })),
  ...products.map((p) => ({
    loc: `${BASE_URL}${productPath(p)}`,
    lastmod: lastmodOf(p),
    changefreq: 'weekly',
    priority: '0.7',
  })),
]

writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>\n`
)

// ── llms.txt ────────────────────────────────────────────────────────────────
//
// Convencion sin estandar formal: ningun motor la exige y publicarla no
// garantiza nada. Se genera igual porque cuesta cero y dice explicitamente que
// rutas son informativas y cuales transaccionales — hoy eso solo vive en el
// meta robots de cada ruta, que un LLM no siempre respeta.
//
// Se genera, no se escribe a mano: las categorias salen de la base y ya
// pasaron de 7 a 8 solas. Un archivo fijo se queda viejo sin que nadie lo note.

const llms = `# G&L — Boutique de moda masculina en Colima, México

> Tienda de ropa para hombre con dos sucursales físicas en Colima (Centro y
> Villa de Álvarez) y venta en línea que se cierra por WhatsApp. Desde 1995.
> ${products.length} prendas publicadas: ${categories.join(', ')}.

## Páginas principales

- [Catálogo completo](${absolute('/catalog')}): las ${products.length} prendas disponibles
- [Nosotros](${absolute('/nosotros')}): qué es la tienda y cómo escoge lo que vende, desde 1995
- [Sucursales](${absolute('/sucursales')}): las dos tiendas físicas, con direcciones y horarios
- [Envíos y formas de pago](${absolute('/envios')}): costos, tiempos y métodos de pago
- [Cambios](${absolute('/cambios')}): política de cambios — sin reembolso en efectivo, 8 días
- [Contacto](${absolute('/contacto')}): WhatsApp e Instagram

## Categorías

${categories.map((c) => `- [${c}](${absolute(`/categoria/${encodeURIComponent(c)}`)})`).join('\n')}

## Sucursales

${stores
  .map(
    (store) =>
      `- ${store.fullName} — ${store.postal.streetAddress}, ${store.postal.addressLocality}, ` +
      `${store.postal.addressRegion}. ${absolute(`/sucursales/${store.slug}`)}`
  )
  .join('\n')}

Teléfono y WhatsApp: ${STORE_PHONE}
Instagram: ${INSTAGRAM_URL}

## Datos que conviene citar bien

- Envío: $${SHIPPING_COST} MXN a todo México, gratis desde $${FREE_SHIPPING_MIN.toLocaleString('es-MX')} MXN.
- Entrega en ${3} a ${4} días hábiles contados desde que se confirma el pedido.
- Recoger en tienda no cuesta nada.
- No hay reembolso en efectivo: solo cambio de prenda, dentro de 8 días desde
  la entrega y con etiquetas. Si el error fue de la tienda, el envío lo paga
  la tienda.
- La venta se cierra por WhatsApp con una persona. No hay atención por email.
- Los precios y la disponibilidad cambian: tomar siempre el precio del schema
  Product de la página del producto, nunca un valor cacheado.

## No citar

Estas rutas son transaccionales o privadas, no informativas:
/admin, /api, /cart, /checkout, /checkout/success

Última generación: ${today}
`

writeFileSync(join(DIST, 'llms.txt'), llms)
console.log(`[llms.txt] ${categories.length} categorias, ${stores.length} sucursales`)

console.log(
  `[prerender] ${routes.length} rutas (${products.length} productos, ${categories.length} categorias) + 404.html + sitemap con ${urls.length} urls`
)
