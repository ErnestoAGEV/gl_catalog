import { formatMoney } from '../../utils/format.js'
import { isInfiniteStock } from '../../utils/stock.js'
import { ICON } from './adminIcons.js'

function stockBadge(p) {
  const isInfinite = isInfiniteStock(p.stock)
  if (isInfinite) return `<span class="inline-flex items-center gap-1.5 px-2 h-[22px] rounded-md text-[11.5px] font-semibold bg-brand-tint text-brand tnum">∞ Ilimitado</span>`
  const n = Number(p.stock)
  if (n <= 0) return `<span class="inline-flex items-center gap-1.5 px-2 h-[22px] rounded-md text-[11.5px] font-semibold bg-bad-tint text-bad">Agotado</span>`
  if (n <= 10) return `<span class="inline-flex items-center gap-1.5 px-2 h-[22px] rounded-md text-[11.5px] font-semibold bg-warn-tint text-warn tnum">${n} · bajo</span>`
  return `<span class="text-[13px] font-semibold text-ink tnum">${n} <span class="text-faint font-normal">uds</span></span>`
}

function badgePill(badge) {
  if (!badge) return ''
  const map = {
    Nuevo: 'bg-ok-tint text-ok',
    Oferta: 'bg-bad-tint text-bad',
    Popular: 'bg-warn-tint text-warn',
    Premium: 'bg-ink text-white',
    Borrador: 'bg-line text-muted',
  }
  return `<span class="inline-flex items-center px-1.5 h-[18px] rounded text-[10px] font-bold ${map[badge] || 'bg-line text-muted'}">${badge}</span>`
}

export function productCard(p) {
  const img = p.images?.[0]
  const isPublished = p.badge !== 'Borrador'

  return `
    <tr class="border-t border-line hover:bg-canvas transition-colors group" data-product data-id="${p.id}">
      <td class="px-5 py-3">
        <div class="flex items-center gap-3">
          ${img
            ? `<div class="w-11 h-11 rounded-[10px] overflow-hidden bg-canvas border border-line shrink-0"><img src="${img}" alt="${p.name}" class="w-full h-full object-cover" loading="lazy"/></div>`
            : `<div class="w-11 h-11 rounded-[10px] bg-canvas border border-line flex items-center justify-center shrink-0 text-faint">${ICON.products('w-5 h-5')}</div>`
          }
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="text-[13.5px] font-semibold text-ink truncate max-w-[220px]">${p.name}</p>
              ${badgePill(p.badge)}
            </div>
            <p class="text-[11.5px] text-faint mt-0.5 truncate">${(p.sizes || []).join(', ')}${p.colors?.length ? ' · ' + p.colors.slice(0, 3).join(', ') : ''}</p>
          </div>
        </div>
      </td>
      <td class="px-5 py-3">
        <span class="inline-flex items-center px-2 h-[24px] rounded-md bg-canvas border border-line text-[12px] font-medium text-body">${p.type || 'Sin categoría'}</span>
      </td>
      <td class="px-5 py-3 text-right">
        <p class="text-[14px] font-bold text-ink tnum">${formatMoney(p.price)}</p>
        ${p.originalPrice ? `<p class="text-[11.5px] text-faint line-through tnum">${formatMoney(p.originalPrice)}</p>` : ''}
      </td>
      <td class="px-5 py-3">${stockBadge(p)}</td>
      <td class="px-5 py-3">
        <label class="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" class="sr-only" data-toggle-publish ${isPublished ? 'checked' : ''}>
          <span class="gl-toggle ${isPublished ? 'on' : ''}"></span>
          <span data-status-label class="text-[12.5px] font-medium ${isPublished ? 'text-ink' : 'text-muted'}">${isPublished ? 'Publicado' : 'Borrador'}</span>
        </label>
      </td>
      <td class="px-5 py-3">
        <div class="flex items-center justify-end gap-1">
          <button data-edit class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors">${ICON.edit('w-[17px] h-[17px]')}</button>
          <button data-delete class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors">${ICON.trash('w-[17px] h-[17px]')}</button>
        </div>
      </td>
    </tr>`
}

export function productCardMobile(p) {
  const img = p.images?.[0]
  const isPublished = p.badge !== 'Borrador'

  return `
    <div class="p-4 hover:bg-canvas transition-colors" data-product data-id="${p.id}">
      <div class="space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            ${img
              ? `<div class="w-12 h-12 rounded-[10px] overflow-hidden bg-canvas border border-line shrink-0"><img src="${img}" alt="${p.name}" class="w-full h-full object-cover" loading="lazy"/></div>`
              : `<div class="w-12 h-12 rounded-[10px] bg-canvas border border-line flex items-center justify-center shrink-0 text-faint">${ICON.products('w-5 h-5')}</div>`
            }
            <div class="min-w-0">
              <div class="flex items-center gap-1.5"><p class="font-semibold text-ink text-[13.5px] line-clamp-2">${p.name}</p>${badgePill(p.badge)}</div>
              <p class="text-[12px] text-faint mt-0.5">${p.type || 'Sin categoría'}</p>
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <button data-edit class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors">${ICON.edit('w-4 h-4')}</button>
            <button data-delete class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors">${ICON.trash('w-4 h-4')}</button>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <p class="eyebrow text-faint">Precio</p>
            <p class="font-bold text-ink tnum mt-0.5">${formatMoney(p.price)}</p>
          </div>
          <div>
            <p class="eyebrow text-faint">Stock</p>
            <div class="mt-0.5">${stockBadge(p)}</div>
          </div>
          <div>
            <p class="eyebrow text-faint">Estado</p>
            <div class="mt-0.5">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="sr-only" data-toggle-publish ${isPublished ? 'checked' : ''}>
                <span class="gl-toggle ${isPublished ? 'on' : ''}" style="width:32px;height:18px"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>`
}
