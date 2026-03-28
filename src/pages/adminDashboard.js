import { getAdminOrders, getAdminSubscribers } from '../app/store.js'
import { formatMoney } from '../app/format.js'

function normalizeStatus(status) {
  return (status || '').toString().trim().toLowerCase()
}

function isSuccessfulStatus(status) {
  const s = normalizeStatus(status)
  return s === 'pagado' || s === 'enviado' || s === 'completado'
}

function parseOrderItems(cartItems) {
  try {
    if (!cartItems) return []
    if (typeof cartItems === 'string') return JSON.parse(cartItems)
    if (Array.isArray(cartItems)) return cartItems
    return []
  } catch {
    return []
  }
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(value)}%`
}

function getTrendMeta(current, previous, betterWhenLower = false) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return {
      text: 'Sin referencia',
      className: 'text-gray-500',
    }
  }

  if (previous === 0 && current === 0) {
    return {
      text: 'Sin cambios',
      className: 'text-gray-500',
    }
  }

  if (previous === 0 && current > 0) {
    const isPositive = !betterWhenLower
    return {
      text: `${isPositive ? '▲' : '▼'} Nuevo`,
      className: isPositive ? 'text-emerald-600' : 'text-red-600',
    }
  }

  const delta = ((current - previous) / previous) * 100
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.1) {
    return {
      text: 'Sin cambios',
      className: 'text-gray-500',
    }
  }

  const improved = betterWhenLower ? delta < 0 : delta > 0
  const symbol = improved ? '▲' : '▼'
  const className = improved ? 'text-emerald-600' : 'text-red-600'

  return {
    text: `${symbol} ${Math.abs(delta).toFixed(1)}%`,
    className,
  }
}

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

      <div class="flex flex-wrap items-center gap-2 mb-2" id="dash-range-selector" role="tablist" aria-label="Rango de tiempo">
        <button type="button" data-range="7" class="dash-range-btn px-3 py-1.5 rounded-lg text-xs font-semibold border border-brand bg-brand text-white">7d</button>
        <button type="button" data-range="30" class="dash-range-btn px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">30d</button>
        <button type="button" data-range="90" class="dash-range-btn px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">90d</button>
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

      <!-- Management Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-gray-500">Ventas Hoy</p>
          <p id="dash-sales-today" class="mt-2 text-xl font-bold text-gray-900 dark:text-white">...</p>
          <p id="dash-sales-today-trend" class="mt-1 text-xs text-gray-500">...</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-gray-500">Ventas en Rango</p>
          <p id="dash-sales-month" class="mt-2 text-xl font-bold text-gray-900 dark:text-white">...</p>
          <p id="dash-sales-month-trend" class="mt-1 text-xs text-gray-500">...</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-gray-500">Ticket Promedio</p>
          <p id="dash-average-ticket" class="mt-2 text-xl font-bold text-gray-900 dark:text-white">...</p>
          <p id="dash-average-ticket-trend" class="mt-1 text-xs text-gray-500">...</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-gray-500">Conversión Pedidos</p>
          <p id="dash-conversion-rate" class="mt-2 text-xl font-bold text-gray-900 dark:text-white">...</p>
          <p id="dash-conversion-rate-trend" class="mt-1 text-xs text-gray-500">...</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-gray-500">Tasa de Cancelación</p>
          <p id="dash-cancel-rate" class="mt-2 text-xl font-bold text-gray-900 dark:text-white">...</p>
          <p id="dash-cancel-rate-trend" class="mt-1 text-xs text-gray-500">...</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-gray-500">Pendientes de Pago</p>
          <p id="dash-pending-payments" class="mt-2 text-xl font-bold text-gray-900 dark:text-white">...</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-gray-500">Stock Crítico (<=10)</p>
          <p id="dash-low-stock" class="mt-2 text-xl font-bold text-gray-900 dark:text-white">...</p>
          <p id="dash-out-stock" class="mt-1 text-xs text-gray-500">...</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-xs uppercase tracking-wide text-gray-500">Top Producto (30d)</p>
          <p id="dash-top-product" class="mt-2 text-base font-bold text-gray-900 dark:text-white truncate">...</p>
          <p id="dash-top-product-units" class="mt-1 text-xs text-gray-500">...</p>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-gray-900 dark:text-white">Ventas por día</h3>
            <span id="dash-sales-chart-subtitle" class="text-xs text-gray-500">Últimos 7 días</span>
          </div>
          <div id="dash-sales-chart" class="h-48 flex items-end gap-1.5 sm:gap-2"></div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-6">
          <h3 class="font-bold text-gray-900 dark:text-white mb-4">Estado de pedidos</h3>
          <div id="dash-status-chart" class="space-y-3"></div>
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
      const [orders, subscribers] = await Promise.all([
        getAdminOrders(),
        getAdminSubscribers(),
      ])

      const revenueEl = root.querySelector('#dash-revenue')
      const ordersCountEl = root.querySelector('#dash-orders-count')
      const subscribersCountEl = root.querySelector('#dash-subscribers-count')
      const recentOrdersEl = root.querySelector('#dash-recent-orders')
      const salesTodayEl = root.querySelector('#dash-sales-today')
      const salesMonthEl = root.querySelector('#dash-sales-month')
      const averageTicketEl = root.querySelector('#dash-average-ticket')
      const conversionRateEl = root.querySelector('#dash-conversion-rate')
      const cancelRateEl = root.querySelector('#dash-cancel-rate')
      const salesTodayTrendEl = root.querySelector('#dash-sales-today-trend')
      const salesMonthTrendEl = root.querySelector('#dash-sales-month-trend')
      const averageTicketTrendEl = root.querySelector('#dash-average-ticket-trend')
      const conversionRateTrendEl = root.querySelector('#dash-conversion-rate-trend')
      const cancelRateTrendEl = root.querySelector('#dash-cancel-rate-trend')
      const pendingPaymentsEl = root.querySelector('#dash-pending-payments')
      const lowStockEl = root.querySelector('#dash-low-stock')
      const outStockEl = root.querySelector('#dash-out-stock')
      const topProductEl = root.querySelector('#dash-top-product')
      const topProductUnitsEl = root.querySelector('#dash-top-product-units')
      const salesChartEl = root.querySelector('#dash-sales-chart')
      const salesChartSubtitleEl = root.querySelector('#dash-sales-chart-subtitle')
      const statusChartEl = root.querySelector('#dash-status-chart')
      const rangeButtons = Array.from(root.querySelectorAll('.dash-range-btn'))

      const totalRevenue = orders.reduce((acc, order) => {
        if (!isSuccessfulStatus(order.status)) return acc
        return acc + (Number(order.total) || 0)
      }, 0)

      if (revenueEl) revenueEl.textContent = formatMoney(totalRevenue)
      if (ordersCountEl) ordersCountEl.textContent = orders.length
      if (subscribersCountEl) subscribersCountEl.textContent = subscribers.length

      const now = new Date()
      const currentDay = now.toISOString().slice(0, 10)
      const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString().slice(0, 10)
      const paidOrders = orders.filter(order => isSuccessfulStatus(order.status))
      const pendingPayments = orders.filter(order => normalizeStatus(order.status) === 'pendientedepago').length

      const salesToday = paidOrders.reduce((acc, order) => {
        const orderDate = new Date(order.created_at)
        if (Number.isNaN(orderDate.getTime())) return acc
        return orderDate.toISOString().slice(0, 10) === currentDay
          ? acc + (Number(order.total) || 0)
          : acc
      }, 0)

      const salesYesterday = paidOrders.reduce((acc, order) => {
        const orderDate = new Date(order.created_at)
        if (Number.isNaN(orderDate.getTime())) return acc
        return orderDate.toISOString().slice(0, 10) === yesterday
          ? acc + (Number(order.total) || 0)
          : acc
      }, 0)

      const products = state.products || []
      const lowStockProducts = products.filter(product => {
        const stock = product?.stock
        if (stock === null || stock === undefined || stock === '' || stock === '∞') return false
        const n = Number(stock)
        return Number.isFinite(n) && n > 0 && n <= 10
      }).length

      const outStockProducts = products.filter(product => {
        const stock = product?.stock
        if (stock === null || stock === undefined || stock === '' || stock === '∞') return false
        const n = Number(stock)
        return Number.isFinite(n) && n <= 0
      }).length
      if (salesTodayEl) salesTodayEl.textContent = formatMoney(salesToday)
      const salesTodayTrend = getTrendMeta(salesToday, salesYesterday)

      if (salesTodayTrendEl) {
        salesTodayTrendEl.textContent = `${salesTodayTrend.text} vs ayer`
        salesTodayTrendEl.className = `mt-1 text-xs ${salesTodayTrend.className}`
      }

      if (pendingPaymentsEl) pendingPaymentsEl.textContent = String(pendingPayments)
      if (lowStockEl) lowStockEl.textContent = String(lowStockProducts)
      if (outStockEl) outStockEl.textContent = `${outStockProducts} agotados`

      const dayMs = 24 * 60 * 60 * 1000
      const getDayKey = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)
      const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

      const sumRevenue = (list) => list.reduce((acc, order) => acc + (Number(order.total) || 0), 0)

      const renderRangeData = (rangeDays) => {
        const rangeStart = startOfDay(new Date(Date.now() - ((rangeDays - 1) * dayMs)))
        const prevStart = startOfDay(new Date(rangeStart.getTime() - (rangeDays * dayMs)))
        const prevEnd = startOfDay(new Date(rangeStart.getTime() - dayMs))

        const inRange = orders.filter(order => {
          const t = new Date(order.created_at).getTime()
          return Number.isFinite(t) && t >= rangeStart.getTime()
        })

        const inPrevRange = orders.filter(order => {
          const t = new Date(order.created_at).getTime()
          return Number.isFinite(t) && t >= prevStart.getTime() && t <= (prevEnd.getTime() + dayMs - 1)
        })

        const paidInRange = inRange.filter(order => isSuccessfulStatus(order.status))
        const paidInPrevRange = inPrevRange.filter(order => isSuccessfulStatus(order.status))

        const salesRange = sumRevenue(paidInRange)
        const salesPrevRange = sumRevenue(paidInPrevRange)
        const averageTicket = paidInRange.length ? (salesRange / paidInRange.length) : 0
        const averageTicketPrev = paidInPrevRange.length ? (salesPrevRange / paidInPrevRange.length) : 0

        const completed = inRange.filter(order => normalizeStatus(order.status) === 'completado').length
        const completedPrev = inPrevRange.filter(order => normalizeStatus(order.status) === 'completado').length
        const canceled = inRange.filter(order => normalizeStatus(order.status) === 'cancelado').length
        const canceledPrev = inPrevRange.filter(order => normalizeStatus(order.status) === 'cancelado').length

        const conversionRate = inRange.length ? (completed / inRange.length) * 100 : 0
        const conversionRatePrev = inPrevRange.length ? (completedPrev / inPrevRange.length) * 100 : 0
        const cancelRate = inRange.length ? (canceled / inRange.length) * 100 : 0
        const cancelRatePrev = inPrevRange.length ? (canceledPrev / inPrevRange.length) * 100 : 0

        if (salesMonthEl) salesMonthEl.textContent = formatMoney(salesRange)
        if (averageTicketEl) averageTicketEl.textContent = formatMoney(averageTicket)
        if (conversionRateEl) conversionRateEl.textContent = formatPercent(conversionRate)
        if (cancelRateEl) cancelRateEl.textContent = formatPercent(cancelRate)

        const salesTrend = getTrendMeta(salesRange, salesPrevRange)
        const avgTrend = getTrendMeta(averageTicket, averageTicketPrev)
        const convTrend = getTrendMeta(conversionRate, conversionRatePrev)
        const cancTrend = getTrendMeta(cancelRate, cancelRatePrev, true)

        if (salesMonthTrendEl) {
          salesMonthTrendEl.textContent = `${salesTrend.text} vs periodo anterior`
          salesMonthTrendEl.className = `mt-1 text-xs ${salesTrend.className}`
        }
        if (averageTicketTrendEl) {
          averageTicketTrendEl.textContent = `${avgTrend.text} vs periodo anterior`
          averageTicketTrendEl.className = `mt-1 text-xs ${avgTrend.className}`
        }
        if (conversionRateTrendEl) {
          conversionRateTrendEl.textContent = `${convTrend.text} vs periodo anterior`
          conversionRateTrendEl.className = `mt-1 text-xs ${convTrend.className}`
        }
        if (cancelRateTrendEl) {
          cancelRateTrendEl.textContent = `${cancTrend.text} vs periodo anterior`
          cancelRateTrendEl.className = `mt-1 text-xs ${cancTrend.className}`
        }

        // Top product in selected range
        const topProductsMap = new Map()
        inRange.forEach(order => {
          parseOrderItems(order.cart_items).forEach(item => {
            const name = (item?.name || 'Producto sin nombre').toString().trim()
            const qty = Number(item?.qty) || 0
            if (!name || qty <= 0) return
            topProductsMap.set(name, (topProductsMap.get(name) || 0) + qty)
          })
        })

        let topName = 'Sin datos recientes'
        let topQty = 0
        for (const [name, qty] of topProductsMap.entries()) {
          if (qty > topQty) {
            topName = name
            topQty = qty
          }
        }
        if (topProductEl) topProductEl.textContent = topName
        if (topProductUnitsEl) topProductUnitsEl.textContent = `${topQty} unidades vendidas (${rangeDays}d)`

        // Sales chart (daily bars)
        const dayTotals = []
        for (let i = rangeDays - 1; i >= 0; i -= 1) {
          const d = new Date(Date.now() - (i * dayMs))
          const key = getDayKey(d)
          dayTotals.push({
            key,
            label: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
            value: 0,
          })
        }
        const indexByKey = new Map(dayTotals.map((item, idx) => [item.key, idx]))
        paidInRange.forEach(order => {
          const d = new Date(order.created_at)
          if (Number.isNaN(d.getTime())) return
          const key = getDayKey(d)
          const idx = indexByKey.get(key)
          if (idx === undefined) return
          dayTotals[idx].value += Number(order.total) || 0
        })

        const maxSales = Math.max(...dayTotals.map(i => i.value), 1)
        if (salesChartEl) {
          salesChartEl.innerHTML = dayTotals.map((item, idx) => {
            const h = Math.max(6, Math.round((item.value / maxSales) * 100))
            const showLabel = rangeDays <= 14 || idx % Math.ceil(rangeDays / 7) === 0
            return `
              <div class="flex-1 min-w-0 flex flex-col items-center justify-end gap-1">
                <div title="${item.label}: ${formatMoney(item.value)}" class="w-full rounded-t-md bg-brand/80 hover:bg-brand transition-colors" style="height:${h}%"></div>
                <span class="text-[10px] text-gray-400 leading-none ${showLabel ? '' : 'opacity-0'}">${item.label}</span>
              </div>
            `
          }).join('')
        }

        if (salesChartSubtitleEl) {
          salesChartSubtitleEl.textContent = `Últimos ${rangeDays} días`
        }

        // Status chart (horizontal bars)
        const statusGroups = [
          { key: 'completado', label: 'Completado', color: 'bg-emerald-500' },
          { key: 'pendientedepago', label: 'Pendiente de pago', color: 'bg-amber-500' },
          { key: 'cancelado', label: 'Cancelado', color: 'bg-red-500' },
          { key: 'otros', label: 'Otros', color: 'bg-slate-500' },
        ]

        const statusCount = { completado: 0, pendientedepago: 0, cancelado: 0, otros: 0 }
        inRange.forEach(order => {
          const s = normalizeStatus(order.status)
          if (s === 'completado') statusCount.completado += 1
          else if (s === 'pendientedepago') statusCount.pendientedepago += 1
          else if (s === 'cancelado') statusCount.cancelado += 1
          else statusCount.otros += 1
        })

        const totalStatus = Math.max(inRange.length, 1)
        if (statusChartEl) {
          statusChartEl.innerHTML = statusGroups.map(group => {
            const count = statusCount[group.key]
            const pct = Math.round((count / totalStatus) * 100)
            return `
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-gray-600 dark:text-gray-300">${group.label}</span>
                  <span class="text-gray-500">${count} (${pct}%)</span>
                </div>
                <div class="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div class="h-full ${group.color}" style="width:${pct}%"></div>
                </div>
              </div>
            `
          }).join('')
        }
      }

      rangeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const days = Number(btn.dataset.range) || 30
          rangeButtons.forEach(item => {
            const active = item === btn
            item.className = active
              ? 'dash-range-btn px-3 py-1.5 rounded-lg text-xs font-semibold border border-brand bg-brand text-white'
              : 'dash-range-btn px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50'
          })
          renderRangeData(days)
        })
      })

      renderRangeData(7)

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
