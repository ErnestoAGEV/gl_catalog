// Contenido editable de la home: filas de site_content (admin → Contenido) sobre
// los defaults de homeData.js. Puro (sin DOM ni Supabase) para probarlo en node.
//
// Solo cuentan las filas con content.v === 2. Las anteriores traen cifras que
// ya se quitaron del sitio ("2.4k clientes", "4.9/5") y no deben volver.
// Por seccion: sin filas v2 activas, se usa el default; la home nunca queda vacia.

import { escapeHtml } from '../../utils/sanitize.js'
import { heroSlides, categoryTiles, stats, manifesto } from './homeData.js'

export const CONTENT_VERSION = 2

// Anchos que pide la home al optimizador de Vercel; deben estar en images.sizes de vercel.json.
export const IMAGE_WIDTHS = [640, 1080, 1600]

const ACCENT_CLASS = { brand: 'text-brand', outline: 'outline-text' }
const STORAGE_PATH = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//

const active = (rows, section) => (rows || [])
  .filter(r => r && r.section === section && r.active && r.content?.v === CONTENT_VERSION)
  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

/** Enlaces permitidos: rutas internas, el boton de copiar cupon y https. Nada de javascript:. */
// Comillas, < > o espacios en una URL solo sirven para salirse del atributo: se rechaza entera.
const UNSAFE_URL = /["'<>\s]/

export function safeLink(href, fallback = '/catalog') {
  const h = String(href || '').trim()
  if (UNSAFE_URL.test(h)) return fallback
  if (h === '#copy' || /^\/(?!\/)/.test(h) || /^https:\/\//.test(h)) return h
  return fallback
}

const isUploaded = (url) => STORAGE_PATH.test(String(url || ''))

/**
 * Imagen para el HTML. Las locales (/img) conservan su srcset; las subidas a
 * Supabase pasan por el optimizador de Vercel para que Supabase entregue cada
 * foto una vez y no en cada visita (el cached egress ya tumbo la tienda).
 * Devuelve null si la URL no es local ni de nuestro Storage.
 */
export function resolveImage(url, defaults = {}, { optimize = false } = {}) {
  const u = String(url || '').trim()
  if (!u || UNSAFE_URL.test(u)) return null
  if (u === defaults.image) return { image: defaults.image, srcset: defaults.srcset, w: defaults.w, h: defaults.h }
  if (/^\/(?!\/)/.test(u)) return { image: u, srcset: '', w: defaults.w, h: defaults.h }
  if (!isUploaded(u)) return null
  if (!optimize) return { image: u, srcset: '' }
  const at = (w) => `/_vercel/image?url=${encodeURIComponent(u)}&w=${w}&q=75`
  return { image: at(1080), srcset: IMAGE_WIDTHS.map(w => `${at(w)} ${w}w`).join(', ') }
}

/** Titulo del hero: saltos de linea y palabra destacada sobre texto ya escapado. */
export function headlineHtml(title, accent, accentStyle) {
  let html = escapeHtml(String(title || ''))
  const word = escapeHtml(String(accent || '').trim())
  if (word && html.includes(word)) {
    const cls = ACCENT_CLASS[accentStyle] || ACCENT_CLASS.brand
    const at = html.lastIndexOf(word)
    html = `${html.slice(0, at)}<span class="${cls}">${word}</span>${html.slice(at + word.length)}`
  }
  return html.replace(/\r?\n/g, '<br/>')
}

function resolveHero(rows, opts) {
  const list = active(rows, 'hero_slide')
  if (!list.length) return heroSlides
  return list.map((r, i) => {
    const c = r.content || {}
    const href = safeLink(r.cta_link)
    const isCopy = href === '#copy'
    // Si quitan la foto o no es valida, la del default de esa posicion (o la primera).
    const base = heroSlides[i] || heroSlides[0]
    // Tras reordenar, una foto local puede venir de otra posicion: sus medidas y srcset son los de ese default.
    const own = heroSlides.find(d => d.image === r.image_url) || base
    const img = resolveImage(r.image_url, own, opts) || { image: base.image, srcset: base.srcset, w: base.w, h: base.h }
    return {
      headline: headlineHtml(r.title, c.accent, c.accentStyle),
      body: escapeHtml(r.subtitle || ''),
      couponBody: isCopy && !String(r.subtitle || '').trim(),
      cta: { label: escapeHtml(r.cta_text || (isCopy ? 'Copiar código' : 'Ver más')), href, isCopy },
      image: img.image,
      srcset: img.srcset,
      w: img.w || c.w || 1080,
      h: img.h || c.h || 1350,
      caption: escapeHtml(c.caption || ''),
      captionClass: isCopy ? 'bg-brand' : 'bg-ink/40 backdrop-blur',
    }
  })
}

function resolveStats(rows) {
  const list = active(rows, 'stat')
  if (!list.length) return stats
  return list.map(r => {
    const kind = r.content?.kind
    // "4.8/5": el "/5" va chico y tenue, como en el diseño; "31." con el punto en azul via accent.
    const number = headlineHtml(r.title, r.content?.accent, 'brand')
      .replace(/(\/\d+)$/, '<span class="text-[0.56em] opacity-40">$1</span>')
    return {
      number,
      caption: escapeHtml(r.subtitle || ''),
      catalogCount: kind === 'catalogCount',
      reviewsLink: kind === 'googleReviews',
    }
  })
}

function resolveTiles(rows, opts) {
  const list = active(rows, 'category_tile')
  // El diseño del mosaico depende de la posicion: cada fila edita el lugar display_order (1-4).
  return categoryTiles.map((base, i) => {
    const r = list.find(x => x.display_order === i + 1)
    if (!r) return base
    const href = safeLink(r.cta_link, base.href)
    const m = href.match(/^\/categoria\/([^/?#]+)/)
    const own = categoryTiles.find(d => d.image === r.image_url) || base
    const img = resolveImage(r.image_url, own, opts) || { image: base.image, srcset: base.srcset, w: base.w, h: base.h }
    return {
      ...base,
      name: escapeHtml(r.title || base.name),
      href,
      categoryType: m ? decodeURIComponent(m[1]) : base.categoryType,
      eyebrow: escapeHtml(r.content?.eyebrow ?? base.eyebrow ?? ''),
      subtitle: r.subtitle ? escapeHtml(r.subtitle) : '',
      image: img.image,
      srcset: img.srcset,
      w: img.w || base.w,
      h: img.h || base.h,
    }
  })
}

function resolveManifesto(rows) {
  const r = active(rows, 'manifesto')[0]
  if (!r) return manifesto
  return {
    text: headlineHtml(r.title || manifesto.text), // escapa y respeta los saltos de linea del textarea
    tail: escapeHtml(r.subtitle || ''),
    ctaLabel: escapeHtml(r.cta_text || ''),
    ctaHref: safeLink(r.cta_link),
  }
}

/**
 * @param {object[]} rows filas de site_content
 * @param {{ marqueeDefault: string, optimize?: boolean }} opts
 * Todo lo que devuelve ya es HTML seguro para interpolar.
 */
export function resolveHomeContent(rows, { marqueeDefault, optimize = false }) {
  const marqueeRow = active(rows, 'marquee')[0]
  return {
    heroSlides: resolveHero(rows, { optimize }),
    stats: resolveStats(rows),
    categoryTiles: resolveTiles(rows, { optimize }),
    manifesto: resolveManifesto(rows),
    marquee: marqueeRow?.title ? escapeHtml(marqueeRow.title) : marqueeDefault,
  }
}

// ── Del contenido actual a filas editables ──
// El admin las inserta cuando alguien pulsa "Personalizar" en una seccion, asi la
// primera version editable es identica a lo que la tienda muestra hoy.

const stripTags = (html) => String(html || '').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

function accentOf(html) {
  const m = String(html || '').match(/<span class="(text-brand|outline-text)">([^<]+)<\/span>/)
  return m ? { accent: m[2], accentStyle: m[1] === 'outline-text' ? 'outline' : 'brand' } : {}
}

const row = (section, display_order, fields, content = {}) => ({
  section, display_order, active: true,
  title: '', subtitle: '', cta_text: null, cta_link: null, image_url: null,
  ...fields,
  content: { v: CONTENT_VERSION, ...content },
})

/** Filas v2 que reproducen la seccion tal como esta en homeData.js. */
export function defaultRows(section, { marqueeDefault = '' } = {}) {
  if (section === 'hero_slide') {
    return heroSlides.map((s, i) => row('hero_slide', i + 1, {
      title: stripTags(s.headline),
      subtitle: s.body || '',
      cta_text: s.cta?.label || '',
      cta_link: s.cta?.href || '/catalog',
      image_url: s.image,
    }, { ...accentOf(s.headline), caption: s.caption || '' }))
  }
  if (section === 'stat') {
    return stats.map((s, i) => row('stat', i + 1, {
      title: s.catalogCount ? '' : stripTags(s.number),
      subtitle: stripTags(s.caption).replace(/\s+/g, ' '),
    }, {
      ...(s.number ? { accent: accentOf(s.number).accent } : {}),
      kind: s.catalogCount ? 'catalogCount' : s.reviewsLink ? 'googleReviews' : null,
    }))
  }
  if (section === 'category_tile') {
    return categoryTiles.map((t, i) => row('category_tile', i + 1, {
      title: t.name, subtitle: t.subtitle || '', cta_link: t.href, image_url: t.image,
    }, { eyebrow: t.eyebrow || '' }))
  }
  if (section === 'manifesto') {
    return [row('manifesto', 1, { title: manifesto.text, subtitle: manifesto.tail, cta_text: manifesto.ctaLabel, cta_link: manifesto.ctaHref })]
  }
  if (section === 'marquee') {
    return [row('marquee', 1, { title: stripTags(marqueeDefault) })]
  }
  return []
}
