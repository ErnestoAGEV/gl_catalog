// Fragmentos HTML puros de "Nuevo pedido" (sin red ni DOM, para poder probarlos).
import { escapeHtml } from '../../utils/sanitize.js'
import { formatMoney } from '../../utils/format.js'

const esc = (v) => escapeHtml(String(v ?? ''))
export const MAX_QTY = 50

export function resultsHtml(list, hasTerm) {
  if (!hasTerm) return ''
  if (!list.length) return '<li class="text-[13px] text-muted">Sin resultados.</li>'
  return list.map(p => `<li><button type="button" data-add="${esc(p.id)}" class="w-full flex items-center justify-between gap-3 text-left px-3 h-10 rounded-xl2 bg-canvas hover:bg-line/60 text-[13.5px]"><span class="truncate text-ink">${esc(p.name)}${p.brand ? ` <span class="text-faint">· ${esc(p.brand)}</span>` : ''}</span><span class="tnum text-muted shrink-0">${formatMoney(p.price)}</span></button></li>`).join('')
}

const selectHtml = (label, key, idx, opts, value) => opts?.length
  ? `<label class="text-[11px] text-faint block">${label}<select data-key="${key}" data-idx="${idx}" class="adm-fld mt-0.5 py-2">${opts.map(o => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>` : ''

export function itemsHtml(items, lookup) {
  if (!items.length) return '<p class="text-[13px] text-muted">Todavía no agregas productos.</p>'
  return items.map((it, i) => {
    const p = lookup(it.productId)
    return `<div class="flex flex-wrap items-end gap-3 py-3 border-t border-line first:border-t-0">
      <div class="flex-1 min-w-[160px]"><p class="text-[13.5px] font-semibold text-ink">${esc(p?.name || 'Producto')}</p><p class="text-[12px] text-muted tnum">${formatMoney(p?.price || 0)} c/u · precio de la tienda</p></div>
      ${selectHtml('Talla', 'size', i, p?.sizes, it.size)}
      ${selectHtml('Color', 'color', i, p?.colors, it.color)}
      <label class="text-[11px] text-faint block">Cant.<input data-key="qty" data-idx="${i}" type="number" min="1" max="${MAX_QTY}" step="1" value="${esc(it.qty)}" class="adm-fld tnum mt-0.5 py-2 w-20" /></label>
      <button type="button" data-remove="${i}" class="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint" aria-label="Quitar ${esc(p?.name || 'producto')}">×</button>
    </div>`
  }).join('')
}

export function summaryLinesHtml(items, lookup) {
  return items.map(it => {
    const p = lookup(it.productId)
    const v = [it.size, it.color].filter(Boolean).join(' · ')
    return `<div class="flex justify-between gap-3 text-[12.5px] text-body"><span class="truncate">${esc(p?.name || 'Producto')}${v ? ` <span class="text-faint">(${esc(v)})</span>` : ''}</span><span class="tnum shrink-0">${esc(it.qty)} × ${formatMoney(p?.price || 0)}</span></div>`
  }).join('')
}
