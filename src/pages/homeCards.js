import { formatMoney } from '../app/format.js'
import { isPerfumeCategory } from './adminProductsData.js'

export function getBadgeColor(badge) {
  const colors = {
    'Nuevo': 'bg-blue-500',
    'Oferta': 'bg-red-500',
    'Popular': 'bg-amber-500',
    'Premium': 'bg-purple-500',
  }
  return colors[badge] || 'bg-gray-700'
}

export function homeSkeletonCard() {
  return `
    <article class="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 h-full flex flex-col">
      <div class="aspect-[3/4] md:aspect-[4/5] skeleton-shimmer"></div>
      <div class="p-2.5 md:p-4 flex flex-col flex-grow">
        <div class="h-3.5 md:h-4 w-4/5 rounded-md skeleton-shimmer"></div>
        <div class="mt-auto pt-1.5 md:pt-2">
          <div class="h-4 md:h-5 w-1/3 rounded-md skeleton-shimmer"></div>
        </div>
      </div>
    </article>
  `
}

export function bestSellerRow(p, idx) {
  const rank = String(idx + 1).padStart(2, '0')
  const img = p.images?.[0] || '/placeholder.webp'
  const isPerfume = isPerfumeCategory(p.type)
  const descriptor = p.type ? `${p.type}` : ''

  return `
    <li class="ls-row relative py-6 px-3 border-b border-[#EAE9E4] cursor-pointer" data-href="/producto/${p.id}">
      <div class="grid grid-cols-12 items-center gap-4">
        <span class="col-span-1 font-mono text-[12px] text-ink/50">${rank}</span>
        <span class="ls-name col-span-10 md:col-span-6 font-heading font-bold text-[clamp(24px,2.5vw,40px)] tracking-[-0.03em] leading-tight">${p.name}</span>
        <span class="hidden md:block col-span-3 font-mono text-[12px] text-ink/55 uppercase tracking-wider">${descriptor}</span>
        <span class="col-span-1 md:col-span-2 text-right font-mono text-[15px] font-semibold">
          ${p.originalPrice ? `<span class="text-ink/40 line-through font-normal text-[12px] mr-1">${formatMoney(p.originalPrice)}</span>` : ''}
          ${formatMoney(p.price)}
        </span>
      </div>
      <img class="thumb" src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='/placeholder.webp'" />
    </li>
  `
}
