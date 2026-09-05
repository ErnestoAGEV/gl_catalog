import { BRAND } from '../../utils/config.js'
import { stores } from '../home/homeData.js'
import { infoPages } from './infoData.js'

/**
 * Renderer unico de las paginas de confianza. Las cuatro comparten layout, asi
 * que el contenido vive en infoData.js y aqui solo se pinta.
 */
export function pageInfo(state, path) {
  const page = infoPages[path]
  if (!page) return null

  const waLink = (text) =>
    `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`

  const sections = page.sections
    .map(
      (s) => `
      <section class="border-t border-ink/10 py-10">
        <h2 class="font-heading font-[800] text-[clamp(24px,3vw,34px)] tracking-[-0.02em] mb-4">${s.h}</h2>
        ${
          s.list
            ? `<ul class="space-y-3 max-w-[640px]">${s.list
                .map(
                  (item) =>
                    `<li class="flex gap-3 text-[16px] text-ink/75 leading-relaxed"><span class="text-brand shrink-0">—</span><span>${item}</span></li>`
                )
                .join('')}</ul>`
            : `<p class="text-[16px] text-ink/75 max-w-[640px] leading-relaxed">${s.body}</p>`
        }
      </section>`
    )
    .join('')

  const storesBlock = page.showStores
    ? `
      <section class="border-t border-ink/10 py-10">
        <h2 class="font-heading font-[800] text-[clamp(24px,3vw,34px)] tracking-[-0.02em] mb-6">Sucursales</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          ${stores
            .map(
              (store) => `
            <div>
              <span class="font-mono text-[11px] tracking-[0.24em] uppercase text-ink/50">${store.id} · ${store.name}</span>
              <h3 class="font-heading font-[800] text-[22px] mt-2 mb-3">${store.fullName}</h3>
              <p class="text-[15px] text-ink/75 leading-relaxed mb-3">${store.address}</p>
              <p class="font-mono text-[12px] text-ink/60 leading-relaxed mb-4">${store.hours.join('<br/>')}</p>
              <a href="${store.mapUrl}" target="_blank" rel="noopener noreferrer" class="ul-link text-[14px] font-medium">Ver en Google Maps</a>
            </div>`
            )
            .join('')}
        </div>
      </section>`
    : ''

  const ctaHref = page.cta.whatsapp ? waLink(page.cta.whatsapp) : page.cta.href
  const ctaAttrs = page.cta.whatsapp ? ' target="_blank" rel="noopener noreferrer"' : ''

  return {
    title: `${page.eyebrow} | G&L`,
    forceLight: true,
    html: `
      <div class="max-w-[900px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
        <nav class="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50 mb-8">
          <a class="ul-link hover:text-ink" href="/">Inicio</a>
          <span class="mx-2 text-ink/30">/</span>
          <span class="text-ink/60">${page.eyebrow}</span>
        </nav>

        <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/60">${page.eyebrow}</span>
        <h1 class="font-heading font-[800] text-[clamp(44px,7vw,92px)] leading-[0.92] tracking-[-0.035em] text-ink mt-4 mb-6">${page.heading}</h1>
        <p class="text-[18px] text-ink/70 max-w-[640px] leading-relaxed mb-4">${page.lead}</p>

        ${sections}
        ${storesBlock}

        <div class="border-t border-ink/10 pt-10">
          <a href="${ctaHref}"${ctaAttrs} class="inline-flex items-center gap-2.5 h-14 px-7 rounded-full bg-ink text-paper text-[15px] font-semibold hover:bg-brand transition-colors">
            ${page.cta.label}
            <span class="arrow-walk">→</span>
          </a>
        </div>
      </div>
    `,
  }
}
