import { formatMoney } from '../app/format.js'
import { getBadgeColor } from './adminProductsData.js'

export function productCard(p) {
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop'
  
  const isInfinite = p.stock === undefined || p.stock === null || p.stock === '' || p.stock === '∞'
  const stockValue = isInfinite ? '∞' : Number(p.stock)
  
  let stockBadgeHtml = ''
  if (isInfinite || stockValue > 10) {
    stockBadgeHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">En Stock</span>`
  } else if (stockValue > 0) {
    stockBadgeHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">Bajo Stock</span>`
  } else {
    stockBadgeHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Agotado</span>`
  }
  
  const stockText = isInfinite ? '∞ uds.' : `${stockValue} uds.`
  const isPublished = p.badge !== 'Borrador'

  return `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group bg-white dark:bg-gray-800" data-product data-id="${p.id}">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
            <img src="${img}" alt="${p.name}" class="w-full h-full object-cover"/>
          </div>
          <div>
            <div class="font-medium text-gray-900 dark:text-white line-clamp-1">${p.name}</div>
            <div class="text-[10px] text-gray-500 mt-0.5">${(p.sizes || []).join(', ')} ${p.colors?.length ? '• ' + p.colors.join(', ') : ''}</div>
          </div>
        </div>
      </td>
      
      <td class="px-6 py-4">
        <span class="text-gray-600 dark:text-gray-300">${p.type || 'Sin categoría'}</span>
      </td>
      
      <td class="px-6 py-4 font-semibold text-gray-900 dark:text-white">
        ${formatMoney(p.price)}
      </td>
      
      <td class="px-6 py-4">
        <div class="flex flex-col items-start gap-1">
          ${stockBadgeHtml}
          <span class="text-xs text-gray-500">${stockText}</span>
        </div>
      </td>
      
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <label class="relative inline-flex items-center cursor-pointer">
            <!-- Interfaz visual solamente por el momento -->
            <input type="checkbox" class="sr-only peer" ${isPublished ? 'checked' : ''} disabled>
            <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
          </label>
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">${isPublished ? 'Publicado' : 'Borrador'}</span>
        </div>
      </td>
      
      <td class="px-6 py-4 text-center">
        <div class="flex items-center justify-center gap-3">
          <button type="button" class="text-gray-400 hover:text-brand transition-colors p-1" data-edit title="Editar">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
             </svg>
          </button>
          <button type="button" class="text-gray-400 hover:text-red-500 transition-colors p-1" data-delete title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `
}
