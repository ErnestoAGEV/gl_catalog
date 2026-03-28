import { getState, getAdminOrders, getAdminSubscribers } from '../app/store.js'
import { formatMoney } from '../app/format.js'

export function pageAdminDashboard(state) {
  const productsCount = state.products?.length || 0

  const html = `
    <div class="animate-fade-in space-y-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-manrope font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p class="text-gray-500 mt-1">Resumen de la tienda G&L</p>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <!-- Metric 1: Ventas Totales -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div class="absolute right-0 top-0 w-24 h-24 bg-brand/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div class="flex items-start sm:items-center gap-3 sm:gap-4 relative z-10">
            <div class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
              <svg class="w-5 sm:w-6 h-5 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="text-xs sm:text-sm font-medium text-gray-500">Ingresos Totales</p>
              <h3 id="dash-revenue" class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">...</h3>
            </div>
          </div>
        </div>

        <!-- Metric 2: Órdenes -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div class="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div class="flex items-start sm:items-center gap-3 sm:gap-4 relative z-10">
            <div class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
              <svg class="w-5 sm:w-6 h-5 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </div>
            <div>
              <p class="text-xs sm:text-sm font-medium text-gray-500">Órdenes Totales</p>
              <h3 id="dash-orders-count" class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">...</h3>
            </div>
          </div>
        </div>

        <!-- Metric 3: Catálogo -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div class="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div class="flex items-start sm:items-center gap-3 sm:gap-4 relative z-10">
            <div class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 flex-shrink-0">
              <svg class="w-5 sm:w-6 h-5 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <div>
              <p class="text-xs sm:text-sm font-medium text-gray-500">Productos Activos</p>
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">${productsCount}</h3>
            </div>
          </div>
        </div>

        <!-- Metric 4: Newsletter -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div class="absolute right-0 top-0 w-24 h-24 bg-green-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div class="flex items-start sm:items-center gap-3 sm:gap-4 relative z-10">
            <div class="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0">
              <svg class="w-5 sm:w-6 h-5 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <div>
              <p class="text-xs sm:text-sm font-medium text-gray-500">Suscriptores</p>
              <h3 id="dash-subscribers-count" class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">...</h3>
            </div>
          </div>
        </div>

      </div>

      <!-- Main Activity Area -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        <!-- Órdenes Recientes -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col min-h-[24rem]">
           <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
             <h3 class="font-bold text-gray-900 dark:text-white">Pedidos Recientes</h3>
             <a href="#/admin/orders" class="text-sm font-medium text-brand hover:text-brand-dark transition-colors">Ver todos</a>
           </div>
           
           <div id="dash-recent-orders" class="flex-1 p-6 flex flex-col justify-center items-center text-center">
             <div class="animate-pulse flex flex-col items-center">
               <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-3"></div>
               <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
               <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
             </div>
           </div>
        </div>

        <!-- Acciones Rápidas -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 class="font-bold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
          <div class="space-y-3">
            <a href="#/admin/products" class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand hover:text-brand transition-colors group">
              <div class="w-10 h-10 bg-gray-50 dark:bg-gray-700 group-hover:bg-brand/10 rounded-lg flex items-center justify-center transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand transition-colors">Agregar Producto</p>
                <p class="text-xs text-gray-500">Publicar en el catálogo</p>
              </div>
            </a>
            
            <a href="#/admin/coupons" class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand hover:text-brand transition-colors group">
              <div class="w-10 h-10 bg-gray-50 dark:bg-gray-700 group-hover:bg-brand/10 rounded-lg flex items-center justify-center transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand transition-colors">Crear Cupón</p>
                <p class="text-xs text-gray-500">Ofrecer descuentos</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  `

  return { 
    title: 'Dashboard | G&L Admin', 
    html,
    async onMount(root) {
      // 1. Fetch data
      const [orders, subscribers] = await Promise.all([
        getAdminOrders(),
        getAdminSubscribers()
      ])

      // 2. Calculate Revenue
      const validStatuses = ['pagado', 'enviado', 'completado']
      const totalRevenue = orders.reduce((acc, order) => {
        if (validStatuses.includes(order.status.toLowerCase())) {
           return acc + (Number(order.total) || 0)
        }
        return acc
      }, 0)

      // 3. Update DOM
      const revenueEl = root.querySelector('#dash-revenue')
      const ordersCountEl = root.querySelector('#dash-orders-count')
      const subscribersCountEl = root.querySelector('#dash-subscribers-count')
      const recentOrdersEl = root.querySelector('#dash-recent-orders')

      if (revenueEl) revenueEl.textContent = formatMoney(totalRevenue)
      if (ordersCountEl) ordersCountEl.textContent = orders.length
      if (subscribersCountEl) subscribersCountEl.textContent = subscribers.length

      // 4. Render Recent Orders List
      if (recentOrdersEl) {
        if (orders.length === 0) {
          recentOrdersEl.innerHTML = `
            <div class="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            </div>
            <p class="text-sm text-gray-500 max-w-sm">Aún no hay pedidos registrados en la tienda.</p>
          `
        } else {
          const recentOrders = orders.slice(0, 5) // Show top 5
          recentOrdersEl.className = "flex-1 p-0 overflow-y-auto w-full" // Reset centering for the list
          recentOrdersEl.innerHTML = `
            <ul class="divide-y divide-gray-100 dark:divide-gray-800 w-full">
              ${recentOrders.map(order => `
                <li class="p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">${order.customer_name}</p>
                    <p class="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                       <span>${new Date(order.created_at).toLocaleDateString()}</span>
                       <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                       <span>${order.payment_method === 'whatsapp' ? 'WhatsApp' : 'Tarjeta'}</span>
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-gray-900 dark:text-white">${formatMoney(order.total || 0)}</p>
                    <span class="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      order.status === 'completado' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }">
                      ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </li>
              `).join('')}
            </ul>
          `
        }
      }
    }
  }
}
