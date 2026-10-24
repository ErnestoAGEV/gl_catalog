// Plantillas de las secciones editables de la home (admin → Contenido).
// Puras: las usan home.js en el navegador y scripts/prerender.mjs en el build,
// asi el HTML que ve Google sale de la misma plantilla que el de la tienda.
// Los comentarios <!--hc:x--> marcan cada region para que el build la reemplace.

import { stores } from './homeData.js'

export const region = (name, html) => `<!--hc:${name}-->${html}<!--/hc:${name}-->`

export function heroLeftHtml(heroSlides) {
  return heroSlides.map((s, i) => `
    <div class="hero-slide absolute inset-0 flex flex-col justify-start md:justify-center transition-opacity duration-[1200ms] ease ${i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" data-slide="${i}">
      <${i === 0 ? 'h1' : 'h2'} class="font-heading font-[800] text-[clamp(52px,18.5vw,72px)] md:text-[clamp(72px,11vw,184px)] leading-[0.86] tracking-[-0.04em] text-ink mb-6">${s.headline}</${i === 0 ? 'h1' : 'h2'}>
      ${s.couponBody ? `
        <p class="text-[17px] text-ink/70 max-w-[460px] leading-relaxed">
          Aplica <span class="bg-fog font-mono rounded-md px-2 py-1 text-[15px]">WELCOME10</span> en checkout. Válido para clientes nuevos en cualquier categoría.
        </p>
      ` : `<p class="text-[17px] text-ink/70 max-w-[460px] leading-relaxed">${s.body}</p>`}
      <div class="flex items-center gap-6 mt-8">
        ${s.cta.isCopy ? `
          <button id="hero-copy-coupon" class="press group inline-flex items-center gap-2.5 h-14 px-7 rounded-full bg-brand text-paper text-[15px] font-semibold hover:bg-ink transition-colors">
            <span class="copy-label">${s.cta.label}</span>
            <span class="arrow-walk">→</span>
          </button>
        ` : `
          <a href="${s.cta.href}" class="hero-cta group inline-flex items-center gap-2.5 h-14 px-7 rounded-full bg-ink text-paper text-[15px] font-semibold hover:bg-brand transition-colors" data-href="${s.cta.href}">
            ${s.cta.label}
            <span class="arrow-walk">→</span>
          </a>
        `}
        ${s.secondary ? `<a href="${s.secondary.href}" class="ul-link text-[14px] font-medium text-ink/70 hover:text-ink">${s.secondary.label}</a>` : ''}
      </div>
    </div>
  `).join('')
}

export function heroRightHtml(heroSlides) {
  return heroSlides.map((s, i) => `
    <div class="hero-img absolute inset-0 transition-opacity duration-[1200ms] ease ${i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" data-slide="${i}">
      ${i === 0 ? `
      <img src="${s.image}" ${s.srcset ? `srcset="${s.srcset}" sizes="(max-width: 1023px) 92vw, 40vw"` : ''} width="${s.w}" height="${s.h}" alt="${s.caption}" class="w-full h-full object-cover" loading="eager" fetchpriority="high" />
      ` : `
      <img data-defer-src="${s.image}" ${s.srcset ? `data-defer-srcset="${s.srcset}" sizes="(max-width: 1023px) 92vw, 40vw"` : ''} width="${s.w}" height="${s.h}" alt="${s.caption}" class="w-full h-full object-cover" decoding="async" />
      `}
      <div class="absolute bottom-4 left-4">
        <span class="${s.captionClass} text-paper text-[12px] font-mono px-3 py-1.5 rounded-full">${s.caption}</span>
      </div>
    </div>
  `).join('')
}

export function categoriesHtml(categoryTiles, countByType) {
  return categoryTiles.map(tile => {
    const pieces = countByType(tile.categoryType)
    const piecesLabel = `${pieces} pieza${pieces !== 1 ? 's' : ''}`

    if (tile.type === 'image-brand') {
      return `
        <a href="${tile.href}" class="ct ${tile.span} relative bg-ink text-paper rounded-md p-5 flex flex-col justify-between overflow-hidden group">
          <img src="${tile.image}"${tile.srcset ? ` srcset="${tile.srcset}" sizes="(max-width: 768px) 100vw, 50vw"` : ''} alt="${tile.name}" width="${tile.w}" height="${tile.h}" class="ct-img absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
          <div class="absolute inset-0 bg-ink/35"></div>
          <span class="font-mono text-[11px] tracking-[0.22em] uppercase opacity-80 relative z-10">${tile.eyebrow}</span>
          <div class="ct-label relative z-10">
            <h3 class="font-heading font-[800] ${tile.headingSize} tracking-[-0.04em]">${tile.name}</h3>
            <span class="font-mono text-[11px] opacity-70">${piecesLabel} →</span>
          </div>
        </a>
      `
    }
    if (tile.type === 'image-ink') {
      return `
        <a href="${tile.href}" class="ct ${tile.span} relative bg-ink text-paper rounded-md p-5 flex flex-col justify-between overflow-hidden group">
          <img src="${tile.image}"${tile.srcset ? ` srcset="${tile.srcset}" sizes="(max-width: 768px) 100vw, 50vw"` : ''} alt="${tile.name}" width="${tile.w}" height="${tile.h}" class="ct-img absolute inset-0 w-full h-full object-cover opacity-30" loading="lazy" decoding="async" />
          <div class="absolute inset-0 bg-ink/40"></div>
          <span class="font-mono text-[11px] tracking-[0.22em] uppercase opacity-80 relative z-10">${tile.eyebrow}</span>
          <div class="ct-label relative z-10">
            <h3 class="font-heading font-[800] ${tile.headingSize} tracking-[-0.04em]">${tile.name}</h3>
            <span class="font-mono text-[11px] opacity-70">${piecesLabel} →</span>
          </div>
        </a>
      `
    }
    // Image tiles (Camisas = large, Jeans = medium)
    const isLarge = tile.span.includes('row-span-2')
    const gradient = isLarge
      ? 'bg-gradient-to-br from-ink/40 via-ink/0 to-ink/0'
      : 'bg-gradient-to-t from-ink/35 to-ink/0'
    return `
      <a href="${tile.href}" class="ct ${tile.span} relative rounded-md overflow-hidden group">
        <img src="${tile.image}"${tile.srcset ? ` srcset="${tile.srcset}" sizes="(max-width: 768px) 100vw, 50vw"` : ''} alt="${tile.name}" width="${tile.w}" height="${tile.h}" class="ct-img absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
        <div class="absolute inset-0 ${gradient}"></div>
        <div class="relative h-full flex flex-col justify-between p-5 text-paper">
          ${isLarge ? `
            <div class="flex items-center justify-between">
              <span class="bg-paper text-ink rounded-full px-3 py-1.5 text-[11px] font-mono font-medium">${tile.eyebrow}</span>
              <span class="font-mono text-[11px] opacity-70">${piecesLabel}</span>
            </div>
          ` : `
            <span class="font-mono text-[11px] tracking-[0.14em] uppercase opacity-80">${tile.eyebrow}</span>
          `}
          <div class="ct-label">
            ${tile.subtitle ? `<span class="font-mono text-[11px] tracking-[0.14em] uppercase opacity-80 block mb-1">${tile.subtitle}</span>` : ''}
            <h3 class="font-heading font-[800] ${tile.headingSize} tracking-[-0.04em]">${tile.name}${isLarge ? ' →' : ''}</h3>
            ${!isLarge ? `<span class="font-mono text-[11px] opacity-70">${piecesLabel} →</span>` : ''}
          </div>
        </div>
      </a>
    `
  }).join('')
}

export function statsHtml(stats, catalogCount) {
  return stats.map(s => {
    const caption = s.reviewsLink
      ? `<a href="${stores[0].mapUrl}" target="_blank" rel="noopener" class="ul-link hover:opacity-100">${s.caption}</a>`
      : s.caption
    return `
    <div class="text-left">
      <p class="font-heading font-bold text-[44px] md:text-[64px] leading-none tracking-[-0.04em] tabular-nums"${s.catalogCount ? ' data-catalog-count' : ''}>${s.catalogCount ? (catalogCount || '—') : s.number}</p>
      <p class="font-mono text-[11px] tracking-[0.14em] md:tracking-[0.24em] leading-snug uppercase opacity-70 mt-2">${caption}</p>
    </div>
  `}).join('')
}

export function manifestoHtml(manifesto) {
  return `
              <p class="font-heading font-semibold text-[22px] leading-[1.3] md:text-[clamp(28px,3.6vw,52px)] md:leading-[1.1] tracking-[-0.03em]">
                ${manifesto.text}${manifesto.tail ? ` <span class="opacity-80">${manifesto.tail}</span>` : ''}
              </p>
              ${manifesto.ctaLabel ? `<a href="${manifesto.ctaHref}" class="ul-link text-[14px] font-medium opacity-80 hover:opacity-100 inline-block mt-8">${manifesto.ctaLabel}</a>` : ''}`
}

export const slideCountHtml = (n) => String(n).padStart(2, '0')

// Seccion entera, no solo el contenido: asi index.html solo lleva el marcador.
export function reviewsHtml(reviews) {
  const storeOf = (slug) => stores.find(s => s.slug === slug)
  return `
      <section class="py-24 lg:py-32 reveal">
        <div class="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div class="grid grid-cols-1 md:grid-cols-12 md:items-end gap-8 mb-12">
            <div class="md:col-span-7">
              <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60 block mb-3">§ 05 — Opiniones</span>
              <h2 class="font-heading font-[800] text-[clamp(56px,7vw,112px)] max-md:text-[clamp(44px,14.4vw,56px)] leading-[0.98] tracking-[-0.045em]">Lo que dicen<br/>en <span class="text-brand">Google</span>.</h2>
            </div>
            <div class="md:col-span-5 flex gap-10 md:justify-end">
              ${Object.entries(reviews.ratings).map(([slug, r]) => `
              <a href="${storeOf(slug).mapUrl}" target="_blank" rel="noopener" class="group block">
                <p class="font-heading font-bold text-[44px] md:text-[56px] leading-none tracking-[-0.04em] tabular-nums">${r.value}<span class="text-brand text-[0.6em] align-top ml-1" aria-hidden="true">★</span></p>
                <p class="font-mono text-[11px] tracking-[0.14em] uppercase text-ink/60 mt-2 group-hover:text-ink transition-colors">${storeOf(slug).name} · ${r.count} opiniones</p>
              </a>`).join('')}
            </div>
          </div>
          <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
            ${reviews.items.map((r, i) => `
            <li class="${i >= 4 ? 'hidden md:flex' : 'flex'} flex-col justify-between gap-6 bg-fog rounded-md p-6 md:p-8">
              <blockquote class="text-[17px] leading-relaxed text-ink">“${r.text}”</blockquote>
              <p class="font-mono text-[11px] tracking-[0.14em] uppercase text-ink/60">${r.author} · ${storeOf(r.store).name}</p>
            </li>`).join('')}
          </ul>
          <a href="${stores[0].mapUrl}" target="_blank" rel="noopener" class="ul-link inline-flex items-center min-h-11 mt-6 text-[14px] font-medium text-ink/70 hover:text-ink">Ver todas las opiniones en Google →</a>
        </div>
      </section>`
}
