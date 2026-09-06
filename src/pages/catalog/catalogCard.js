import { formatMoney } from '../../utils/format.js'
import { productPath } from '../../utils/productCopy.js'
import { isPerfumeCategory } from '../admin/adminProductsData.js'

export function skeletonCard() {
  return `
    <div class="block">
      <div class="pimg-wrap animate-pulse"></div>
      <div class="mt-4 space-y-2">
        <div class="h-2.5 w-24 bg-fog rounded"></div>
        <div class="h-4 w-3/4 bg-fog rounded"></div>
        <div class="h-3 w-16 bg-fog rounded"></div>
      </div>
    </div>
  `
}

export function skeletonGrid(count = 8) {
  return Array.from({ length: count }, () => skeletonCard()).join('')
}

export function productCard(p, idx) {
  const images = p.images && p.images.length > 0
    ? p.images
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop']
  const img1 = images[0]
  const img2 = images[1] || images[0]
  const ord = String(idx + 1).padStart(2, '0')
  const isPerfume = isPerfumeCategory(p.type)
  const imgClass = isPerfume ? 'pimg pimg-contain' : 'pimg'
  const imgAltClass = isPerfume ? 'pimg alt pimg-contain' : 'pimg alt'

  // Badges
  const badges = []
  if (p.originalPrice && p.originalPrice > p.price) {
    const pct = Math.round((1 - p.price / p.originalPrice) * 100)
    badges.push(`<span class="badge-dot bg-brand text-paper">\u2212${pct}%</span>`)
  } else if (p.badge === 'Oferta') {
    badges.push(`<span class="badge-dot bg-brand text-paper">Oferta</span>`)
  }
  if (p.badge === 'Nuevo') {
    badges.push(`<span class="badge-dot bg-paper text-ink">Nuevo</span>`)
  }
  if (p.badge === 'Más vendido' || p.badge === 'Popular') {
    badges.push(`<span class="badge-dot bg-ink text-paper">Top</span>`)
  }

  // Eyebrow text
  const eyebrow = p.type || ''

  // Colors / swatches
  const swatches = (p.colors || []).map(c => {
    const hex = c.startsWith('#') ? c : colorNameToHex(c)
    return `<span class="swatch" style="background:${hex}"></span>`
  }).join('')

  // Sizes
  const sizeText = (p.sizes || []).slice(0, 5).join(' \u00B7 ')

  // Price
  const hasDiscount = p.originalPrice && p.originalPrice > p.price
  const priceClass = hasDiscount ? 'text-brand' : ''

  return `
    <a href="${productPath(p)}" class="pcard group block" data-product-id="${p.id}" style="--i:${idx}">
      <div class="pimg-wrap${isPerfume ? ' bg-white' : ''}">
        <img src="${img1}" alt="${p.name}" class="${imgClass}" loading="lazy" decoding="async" />
        <img src="${img2}" alt="" class="${imgAltClass}" loading="lazy" decoding="async" />
        <div class="badge-wrap">${badges.join('')}</div>
        <div class="absolute top-3 right-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink/60 bg-paper/80 backdrop-blur px-2 py-1 rounded-full">${ord}</div>
        <div class="quick-add">
          <button class="qa-btn" data-quickview="${p.id}" type="button">
            <span>Vista r\u00E1pida</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      <div class="mt-4 flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/55 mb-1.5">${eyebrow}</div>
          <div class="font-display font-bold text-[15px] md:text-[18px] leading-tight tracking-[-0.02em] truncate">${p.name}</div>
        </div>
        <div class="text-right whitespace-nowrap flex-shrink-0">
          ${hasDiscount ? `<div class="font-mono text-[11px] text-ink/40 line-through">${formatMoney(p.originalPrice)}</div>` : ''}
          <div class="font-mono text-[13px] md:text-[14px] font-semibold ${priceClass}">${formatMoney(p.price)}</div>
        </div>
      </div>
      <div class="mt-2 flex items-center gap-1.5">
        ${swatches}
        ${sizeText ? `<span class="font-mono text-[10px] text-ink/45 ml-auto">${sizeText}</span>` : ''}
      </div>
    </a>
  `
}

function colorNameToHex(name) {
  const map = {
    'negro': '#0A0A0F', 'blanco': '#FFFFFF', 'azul': '#214fc7',
    'rojo': '#b03832', 'verde': '#3b4a3e', 'gris': '#6b7280',
    'beige': '#d6c4a4', 'marino': '#19355c', 'oliva': '#566042',
    'hueso': '#F4EFE3', 'carbón': '#3a3530', 'café': '#5c3d2e',
  }
  return map[name.toLowerCase()] || name
}
