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
const SHELL_END = '<!-- Fallback content for search engines'

const appOpenAt = template.indexOf(APP_OPEN)
const shellEndAt = template.indexOf(SHELL_END)
if (appOpenAt === -1 || shellEndAt === -1) {
  throw new Error('No encuentro los limites del shell en dist/index.html — revisa index.html')
}

const headTemplate = template.slice(0, appOpenAt + APP_OPEN.length)
const homeShell = template.slice(appOpenAt + APP_OPEN.length, shellEndAt)
const tail = template.slice(shellEndAt)

/** Reescribe el <head> de la plantilla con los metadatos de una ruta. */
function buildHead({ title, description, robots, canonical, image, extraLd, ogType }) {
  let head = headTemplate

  head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)

  // description y robots vienen multilinea en index.html
  head = head.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(description)}" />`
  )
  head = head.replace(
    /<meta\s+name="robots"[^>]*\/>/,
    `<meta name="robots" content="${escapeHtml(robots)}" />`
  )

  head = head.replace(
    /<meta\s+property="og:type"[^>]*\/>/,
    `<meta property="og:type" content="${escapeHtml(ogType || 'website')}" />`
  )
  head = head.replace(
    /<meta\s+property="og:url"[^>]*\/>/,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`
  )
  head = head.replace(
    /<meta\s+property="og:title"[^>]*\/>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  )
  head = head.replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  )
  head = head.replace(
    /<meta\s+property="og:image"[^>]*\/>/,
    `<meta property="og:image" content="${escapeHtml(image)}" />`
  )

  // El canonical ya no se calcula en runtime: cada ruta tiene su HTML propio.
  head = head.replace(
    /<!-- Inline script: set canonical dynamically[\s\S]*?<\/script>/,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`
  )

  const social = [
    `<meta property="og:site_name" content="G&amp;L" />`,
    `<meta property="og:locale" content="es_MX" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ].join('\n    ')

  return head.replace('</head>', `    ${social}\n    ${extraLd || ''}\n  </head>`)
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
routes.push({ path: '/', shell: homeShell })

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
          url: absolute(`/producto/${p.id}`),
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
                .slice(0, 24)
                .map(
                  (p) => `<li>
                <a href="/producto/${p.id}" class="block">
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
            url: absolute(`/producto/${p.id}`),
            name: p.name,
          })),
        },
      },
      breadcrumbLd(trail),
    ],
  })
}

for (const product of products) {
  const path = `/producto/${product.id}`
  const image = product.image_url || product.images?.[0] || DEFAULT_IMAGE
  const trail = [
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/catalog' },
    ...(product.type ? [{ name: product.type, path: `/categoria/${encodeURIComponent(product.type)}` }] : []),
    { name: product.name, path },
  ]
  const inStock = (product.stock ?? 0) > 0

  routes.push({
    path,
    image,
    shell: contentShell(`
            ${breadcrumbNav(trail)}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="900" height="1200" fetchpriority="high" decoding="async" class="w-full h-auto rounded-2xl object-cover">
              <div>
                <h1 class="font-heading font-[800] text-[clamp(32px,5vw,64px)] leading-[0.95] tracking-[-0.03em] mb-4">${escapeHtml(product.name)}</h1>
                <p class="font-mono text-[20px] mb-6">$${escapeHtml(product.price)} MXN${product.original_price ? ` <s class="text-ink/40 text-[15px]">$${escapeHtml(product.original_price)}</s>` : ''}</p>
                <p class="text-[16px] text-ink/70 leading-relaxed mb-6">${escapeHtml(product.description || `${product.name} disponible en G&L, moda masculina premium en Colima.`)}</p>
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
        description:
          product.description || `${product.name} disponible en G&L, moda masculina premium en Colima.`,
        image: (product.images?.length ? product.images : [image]).filter(Boolean),
        sku: String(product.id),
        category: product.type || undefined,
        // Los nombres del catalogo vienen como "Marca - Modelo"; Google marca error
        // si le declaras la tienda como brand del producto.
        brand: { '@type': 'Brand', name: product.name.split(' - ')[0].trim() || 'G&L' },
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
      breadcrumbLd(trail),
    ],
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
  const extraLd = [websiteLd, ...(route.ld || []).map(jsonLd)].join('\n    ')

  const head = buildHead({
    title: seo.title,
    description: seo.description,
    robots: seo.robots,
    canonical,
    image: route.image || DEFAULT_IMAGE,
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
  ...products.map((p) => ({
    loc: `${BASE_URL}/producto/${p.id}`,
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
