import { formatMoney } from '../../utils/format.js'
import { productPath } from '../../utils/productCopy.js'
import { isPerfumeCategory } from '../admin/adminProductsData.js'

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
    <li class="ls-row relative py-6 px-3 border-b border-[#EAE9E4] cursor-pointer" data-href="${productPath(p)}">
      <div class="grid grid-cols-12 items-center gap-4">
        <span class="col-span-1 font-mono text-[12px] text-ink/50">${rank}</span>
        <span class="ls-name col-span-7 md:col-span-6 font-heading font-bold text-[clamp(24px,2.5vw,40px)] tracking-[-0.03em] leading-tight">${p.name}</span>
        <span class="hidden md:block col-span-3 font-mono text-[12px] text-ink/55 uppercase tracking-wider">${descriptor}</span>
        <div class="col-span-4 md:col-span-2 flex flex-col md:flex-row items-end md:items-center justify-end gap-0 md:gap-1.5 font-mono text-[15px] font-semibold">
          ${(p.originalPrice && Number(p.originalPrice) > Number(p.price)) ? `<span class="text-ink/40 line-through font-normal text-[12px]">${formatMoney(p.originalPrice)}</span>` : ''}
          <span>${formatMoney(p.price)}</span>
        </div>
      </div>
      <img class="thumb" src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='/placeholder.webp'" />
    </li>
  `
}
