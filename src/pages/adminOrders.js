import { getAdminOrders, updateAdminOrderStatus } from '../app/store.js'
import { formatMoney } from '../app/format.js'

export function pageAdminOrders(state) {
  const html = `
    <div class="animate-fade-in space-y-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-manrope font-bold text-gray-900 dark:text-white">Órdenes</h1>
          <p class="text-gray-500 mt-1">Gestiona los pedidos de los clientes</p>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" class="px-6 py-4 font-semibold min-w-[200px]">Cliente</th>
                <th scope="col" class="px-6 py-4 font-semibold min-w-[280px]">Productos</th>
                <th scope="col" class="px-6 py-4 font-semibold min-w-[130px]">Fecha</th>
                <th scope="col" class="px-6 py-4 font-semibold min-w-[300px]">Entrega</th>
                <th scope="col" class="px-6 py-4 font-semibold text-center min-w-[140px]">Pago</th>
                <th scope="col" class="px-6 py-4 font-semibold text-center min-w-[120px]">Total</th>
                <th scope="col" class="px-6 py-4 font-semibold text-center min-w-[180px]">Estado</th>
              </tr>
            </thead>
            <tbody id="orders-tbody" class="divide-y divide-gray-100 dark:divide-gray-800">
               <tr>
                 <td colspan="6" class="px-6 py-12 text-center text-gray-400">
                    <div class="animate-pulse flex flex-col items-center">
                       <svg class="w-8 h-8 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       <span>Cargando órdenes...</span>
                    </div>
                 </td>
               </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `

  return { 
    title: 'Órdenes | G&L Admin', 
    html,
    async onMount(root) {
      const tbody = root.querySelector('#orders-tbody')
      if (!tbody) return
      
      const orders = await getAdminOrders()
      
      if (orders.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="px-6 py-12 text-center text-gray-500">
              <div class="w-16 h-16 mx-auto bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
              Aún no hay pedidos registrados.
            </td>
          </tr>
        `
        return
      }
      
      tbody.innerHTML = orders.map(order => {
        let items = []
        try {
           items = typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : (order.cart_items || [])
        } catch(e) { console.error('Error parsing items for order', order.id) }
        
        return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
          <td class="px-6 py-4">
            <div class="font-medium text-gray-900 dark:text-white">${order.customer_name}</div>
            <div class="text-xs text-brand mt-1">${order.customer_whatsapp}</div>
          </td>
          <td class="px-6 py-4">
            <div class="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
              ${items.map(item => `
                 <div class="truncate" title="${item.name} (${item.size || 'Unica'})">
                   <span class="font-semibold">${item.qty}x</span> ${item.name}
                   ${item.size ? `<span class="text-gray-400">(${item.size})</span>` : ''}
                 </div>
              `).join('')}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
            <div>${new Date(order.created_at).toLocaleDateString()}</div>
            <div>${new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </td>
          <td class="px-6 py-4 text-xs">
            <span class="font-medium text-gray-900 border-b pb-0.5 min-w-max pr-2 border-gray-100 dark:border-gray-700 dark:text-white">
              ${order.delivery_method === 'Envío a domicilio' ? '🚚 Envío a Domicilio' : '🏪 Recoge en Tienda'}
            </span>
            ${order.delivery_method === 'Envío a domicilio' && order.address ? `
              <div class="text-gray-500 mt-1" title="${order.address}">${order.address}</div>
            ` : ''}
          </td>
          <td class="px-6 py-4 text-center">
             <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${order.payment_method === 'whatsapp' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
              ${order.payment_method === 'whatsapp' ? 'WhatsApp' : 'Tarjeta / Online'}
            </span>
          </td>
          <td class="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">
            ${formatMoney(order.total || 0)}
          </td>
          <td class="px-6 py-4 text-center">
             <select data-id="${order.id}" data-original="${order.status}" class="status-select outline-none bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-brand focus:border-brand block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                <option value="pendientedepago" ${order.status === 'pendientedepago' ? 'selected' : ''}>Pendiente de pago</option>
                <option value="completado" ${order.status === 'completado' ? 'selected' : ''}>Completado</option>
                <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
             </select>
          </td>
        </tr>
      `}).join('')

      // Status Change Listener
      root.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
          const el = e.target
          const newStatus = el.value
          const orderId = el.dataset.id
          const originalStatus = el.dataset.original
          
          el.disabled = true
          
          const { error } = await updateAdminOrderStatus(orderId, newStatus)
          
          el.disabled = false
          
          if (error) {
            alert('Error al actualizar el estado: ' + error)
            el.value = originalStatus
            return
          }
          
          el.dataset.original = newStatus
        })
      })
    }
  }
}
