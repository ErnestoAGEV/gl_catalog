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
import { STORE_PHONE, stores } from '../src/pages/home/homeData.js'
import { colorPhrase, productDescription, productPath, socialImage } from '../src/utils/productCopy.js'
import { isInStock } from '../src/utils/stock.js'

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
  sub(
    /<!-- Inline script: set canonical dynamically[\s\S]*?<\/script>/,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`
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
    branchOf: { '@type': 'Organization', '@id': `${BASE_URL}/#marca`, name: 'G&L' },
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
            <ul class="grid grid-cols-2 md:grid-cols-4 gap-4">
              ${categories.map((c) => `<li><a class="ul-link text-[15px] font-medium" href="/categoria/${encodeURIComponent(c)}">${escapeHtml(c)}</a></li>`).join('\n              ')}
            </ul>`),
  ld: [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Catálogo de ropa para hombre',
      url: absolute('/catalog'),
      isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: products.length,
        itemListElement: products.slice(0, 100).map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: absolute(productPath(p)),
          name: p.name,
        })),
      },
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
            <p class="text-[17px] text-ink/70 max-w-[560px] leading-relaxed mb-10">${items.length} ${items.length === 1 ? 'pieza disponible' : 'piezas disponibles'} en G&amp;L Colima.</p>
            <ul class="grid grid-cols-2 md:grid-cols-4 gap-6">
              ${items
                // Sin recorte: la categoria mas grande son 84 productos, y
                // cortar en 24 dejaba 105 fichas sin un solo enlace interno.
                .map(
                  (p) => `<li>
                <a href="${productPath(p)}" class="block">
                  <img src="${escapeHtml(p.image_url || '/placeholder.webp')}" alt="${escapeHtml(p.name)}" width="600" height="800" loading="lazy" decoding="async" class="w-full h-auto rounded-xl object-cover">
                  <span class="mt-3 block text-[14px] font-medium">${escapeHtml(p.name)}</span>
                  <span class="block font-mono text-[13px] text-ink/60">$${escapeHtml(p.price)} MXN</span>
                </a>
              </li>`
                )
                .join('\n              ')}
            </ul>`),
    ld: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${category} para hombre en Colima`,
        url: absolute(path),
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: items.slice(0, 100).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: absolute(productPath(p)),
            name: p.name,
          })),
        },
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
          seller: { '@type': 'Organization', '@id': `${BASE_URL}/#marca`, name: 'G&L' },
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
        (sec.list
          ? `<ul class="space-y-3 max-w-[640px]">${sec.list
              .map((i) => `<li class="text-[16px] text-ink/75 leading-relaxed">— ${i}</li>`)
              .join('')}</ul>`
          : `<p class="text-[16px] text-ink/75 max-w-[640px] leading-relaxed">${sec.body}</p>`)
    )
    .join('\n              ')

  routes.push({
    path,
    shell: contentShell(`
            ${breadcrumbNav(trail)}
            <h1 class="font-heading font-[800] text-[clamp(44px,7vw,92px)] leading-[0.92] tracking-[-0.035em] mb-6">${page.heading}</h1>
            <p class="text-[18px] text-ink/70 max-w-[640px] leading-relaxed">${page.lead}</p>
            ${body}`),
    ld: [breadcrumbLd(trail)],
  })
}

// Rutas de carrito/checkout: noindex, pero necesitan HTML propio para no
// depender del rewrite catch-all
for (const path of ['/cart', '/checkout', '/checkout/success']) {
  routes.push({ path, shell: contentShell('') })
}

// ── Escritura ───────────────────────────────────────────────────────────────

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
  const extraLd = [websiteLd, allStoresLd, ...(route.ld || []).map(jsonLd)].join('\n    ')

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
    extraLd: websiteLd,
  }) +
    contentShell(`
            <h1 class="font-heading font-[800] text-[clamp(40px,7vw,88px)] leading-[0.9] tracking-[-0.03em] mb-6">404</h1>
            <p class="text-[17px] text-ink/70 mb-8">La página que buscas no existe.</p>
            <a href="/catalog" class="inline-flex items-center h-14 px-7 rounded-full bg-ink text-paper text-[15px] font-semibold">Ir a la tienda</a>`) +
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

console.log(
  `[prerender] ${routes.length} rutas (${products.length} productos, ${categories.length} categorias) + 404.html + sitemap con ${urls.length} urls`
)
