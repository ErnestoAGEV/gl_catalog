import { formatMoney } from '../app/format.js'
import { getBadgeColor } from './adminProductsData.js'

export function productCard(p) {
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop'
  
  return `
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all" data-product data-id="${p.id}">
      <div class="flex gap-4 p-4">
        <!-- Image -->
        <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img src="${img}" alt="${p.name}" class="w-full h-full object-cover"/>
        </div>
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">${p.name}</h3>
              <p class="text-sm text-gray-500">${p.type}</p>
            </div>
            <div class="flex items-center gap-1">
              ${p.badge ? `<span class="px-2 py-0.5 text-[10px] font-bold ${getBadgeColor(p.badge)} text-white rounded-md">${p.badge}</span>` : ''}
            </div>
          </div>
          
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-bold text-gray-900">${formatMoney(p.price)}</span>
              ${p.originalPrice ? `<span class="text-sm text-gray-400 line-through">${formatMoney(p.originalPrice)}</span>` : ''}
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs text-gray-500">Stock: ${p.stock || '∞'}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>${(p.sizes || []).join(', ')}</span>
            <span>•</span>
            <span>${(p.colors || []).join(', ')}</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex border-t border-gray-100">
        <button type="button" class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-brand hover:bg-gray-50 transition-colors" data-edit>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Editar
        </button>
        <button type="button" class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors border-l border-gray-100" data-delete>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>
    </div>
  `
}
