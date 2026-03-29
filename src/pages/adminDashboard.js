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
    <div class="animate-fade-in space-y-10 pb-12 surface-atelier min-h-screen pt-4">
      <!-- Header Area (Editorial Style) -->
      <div class="px-6 md:px-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl md:text-5xl font-manrope font-extrabold tracking-tight text-[#191C1D]">Estadísticas de Venta</h1>
          <p class="text-[#434654] font-inter mt-2 md:mt-3 text-base md:text-lg">Resumen ejecutivo • G&L Digital Atelier</p>
        </div>
        <div class="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0" id="dash-range-selector" role="tablist" aria-label="Rango de tiempo">
          <button type="button" data-range="7" class="dash-range-btn whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border border-transparent bg-[#214FC7] text-white shadow-sm">7 días</button>
          <button type="button" data-range="30" class="dash-range-btn whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border border-[#C4C5D6]/30 text-[#434654] hover:bg-[#EDEEEF]">30 días</button>
          <button type="button" data-range="90" class="dash-range-btn whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border border-[#C4C5D6]/30 text-[#434654] hover:bg-[#EDEEEF]">90 días</button>
        </div>
      </div>

      <!-- Hero Metrics (Tonal Layering) -->
      <div class="px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Metric: Revenue -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden group">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-[#214FC7]/5 rounded-full transition-transform group-hover:scale-125"></div>
          <p class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-[#434654] mb-3">Ingresos Totales</p>
          <h3 id="dash-revenue" class="text-3xl sm:text-4xl font-manrope font-extrabold text-[#191C1D]">...</h3>
          <div id="dash-sales-month-trend" class="mt-4 text-xs sm:text-sm font-bold">...</div>
        </div>

        <!-- Metric: Orders -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden group">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full transition-transform group-hover:scale-125"></div>
          <p class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-[#434654] mb-3">Órdenes Realizadas</p>
          <h3 id="dash-orders-count" class="text-3xl sm:text-4xl font-manrope font-extrabold text-[#191C1D]">...</h3>
          <div id="dash-conversion-rate-trend" class="mt-4 text-xs sm:text-sm font-bold">...</div>
        </div>

        <!-- Metric: Products -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden group">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full transition-transform group-hover:scale-125"></div>
          <p class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-[#434654] mb-3">Productos en Catálogo</p>
          <h3 class="text-3xl sm:text-4xl font-manrope font-extrabold text-[#191C1D]">${productsCount}</h3>
          <p id="dash-low-stock" class="mt-4 text-xs sm:text-sm text-[#434654]">Cargando inventario...</p>
        </div>

        <!-- Metric: Subscribers -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden group">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full transition-transform group-hover:scale-125"></div>
          <p class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-[#434654] mb-3">Suscripciones</p>
          <h3 id="dash-subscribers-count" class="text-3xl sm:text-4xl font-manrope font-extrabold text-[#191C1D]">...</h3>
          <p class="mt-4 text-xs sm:text-sm text-[#434654]">Audiencia activa</p>
        </div>

      </div>

      <!-- Main Visual Data Area -->
      <div class="px-6 md:px-10 grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <!-- Sales Chart -->
        <div class="xl:col-span-2 bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)]">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 class="text-xl sm:text-2xl font-manrope font-extrabold text-[#191C1D]">Rendimiento Diario</h3>
              <p id="dash-sales-chart-subtitle" class="text-[#434654] text-xs sm:text-sm mt-1">Últimos 7 días</p>
            </div>
            <div class="sm:text-right">
              <p class="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#434654]">Ventas hoy</p>
              <p id="dash-sales-today" class="text-xl sm:text-2xl font-manrope font-extrabold text-[#214FC7]">...</p>
            </div>
          </div>
          
          <!-- Legend -->
          <div class="flex flex-wrap gap-4 mb-6 pb-4 border-b border-[#EDEEEF]">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4" style="background-color: #10b981;"></div>
              <span class="text-sm text-[#434654]">Excelente</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4" style="background-color: #06b6d4;"></div>
              <span class="text-sm text-[#434654]">Bueno</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4" style="background-color: #f59e0b;"></div>
              <span class="text-sm text-[#434654]">Regular</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4" style="background-color: #ef4444;"></div>
              <span class="text-sm text-[#434654]">Bajo</span>
            </div>
          </div>
          
          <div id="dash-sales-chart" class="h-72 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-4 sm:pb-0 relative"></div>
          
          <p class="text-sm text-[#434654] mt-4">
            ✓ Cada barra = ventas de un día • Pasa el mouse para ver el monto exacto
          </p>
        </div>

        <!-- Logistics & Status -->
        <div class="bg-white rounded-[2rem] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)]">
          <h3 class="text-2xl font-manrope font-extrabold text-[#191C1D] mb-8">Estado de Logística</h3>
          <div id="dash-status-chart" class="space-y-6"></div>
          
          <div class="mt-12 pt-8 border-t border-[#EDEEEF]">
            <p class="text-xs font-bold uppercase tracking-widest text-[#434654] mb-4">Eficiencia Operativa</p>
            <div class="space-y-4">
               <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-[#434654]">Ticket Promedio</span>
                    <span id="dash-average-ticket" class="font-bold">...</span>
                  </div>
                  <div id="dash-average-ticket-trend" class="text-[11px]">...</div>
               </div>
               <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="text-[#434654]">Tasa de Cancelación</span>
                    <span id="dash-cancel-rate" class="font-bold text-red-600">...</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Recent Activity & Quick Tools -->
      <div class="px-6 md:px-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Pedidos Recientes (The Gallery List) -->
        <div class="lg:col-span-2 bg-[#EDEEEF]/40 rounded-[2rem] p-6 sm:p-8 flex flex-col min-h-[30rem]">
           <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
             <h3 class="text-xl sm:text-2xl font-manrope font-extrabold text-[#191C1D]">Pedidos Recientes</h3>
             <a href="/admin/orders" class="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white text-xs sm:text-sm font-bold shadow-sm hover:bg-[#214FC7] hover:text-white transition-all w-fit">Ver Historial</a>
           </div>
           
           <div id="dash-recent-orders" class="flex-1 flex flex-col">
              <div class="m-auto text-center opacity-40">
                <div class="w-10 h-10 border-2 border-[#214FC7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="font-manrope font-bold text-sm">Sincronizando Atelier...</p>
              </div>
           </div>
        </div>

        <!-- Quick Access (Atelier Tools) -->
        <div class="space-y-6">
          <div class="bg-[#214FC7] rounded-[2rem] p-8 text-white shadow-xl shadow-[#214FC7]/20 relative overflow-hidden group">
            <div class="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
            <h3 class="text-xl font-manrope font-extrabold mb-2 relative z-10">Atelier Tools</h3>
            <p class="text-white/70 text-sm mb-8 relative z-10">Acciones rápidas de gestión</p>
            
            <div class="space-y-4 relative z-10">
              <a href="/admin/products" class="flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all group/btn">
                <span class="font-bold">Nuevo Producto</span>
                <svg class="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              </a>
              <a href="/admin/coupons" class="flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all group/btn">
                <span class="font-bold">Crear Cupón</span>
                <svg class="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              </a>
            </div>
          </div>

          <!-- Top Product Card -->
          <div class="bg-white rounded-[2rem] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)]">
            <p class="text-xs font-bold uppercase tracking-widest text-[#434654] mb-6">Pieza más Vendida</p>
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-[#EDEEEF] flex items-center justify-center text-[#214FC7]">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p id="dash-top-product" class="font-manrope font-extrabold text-[#191C1D] truncate text-lg">Cargando...</p>
                <p id="dash-top-product-units" class="text-sm text-[#434654] mt-1">...</p>
              </div>
            </div>
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
        const avgSales = dayTotals.reduce((acc, item) => acc + item.value, 0) / dayTotals.length
        
        if (salesChartEl) {
          salesChartEl.innerHTML = `
            <div class="w-full h-full flex flex-col justify-between">
              <!-- Barras -->
              <div class="flex-1 flex items-end justify-between gap-3 mb-6">
                ${dayTotals.map((item) => {
                  const h = Math.max(5, (item.value / maxSales) * 100)
                  let barColor = '#3b82f6'
                  if (item.value === 0) barColor = '#e5e7eb'
                  else if (item.value >= avgSales * 1.2) barColor = '#10b981'
                  else if (item.value >= avgSales) barColor = '#06b6d4'
                  else if (item.value >= avgSales * 0.5) barColor = '#f59e0b'
                  else barColor = '#ef4444'
                  
                  return `
                    <div class="flex-1 flex flex-col items-center group">
                      <div class="w-full flex items-end justify-center mb-2 h-6">
                        <span class="text-xs font-bold text-[#191C1D] opacity-0 group-hover:opacity-100 transition-opacity">
                          ${formatMoney(item.value)}
                        </span>
                      </div>
                      <div class="w-full rounded-t transition-all hover:shadow-lg" 
                           style="height: ${h}%; background-color: ${barColor}; min-height: 8px;">
                      </div>
                    </div>
                  `
                }).join('')}
              </div>
              
              <!-- Fechas abajo -->
              <div class="flex justify-between gap-3 pt-4 border-t border-[#e5e7eb]">
                ${dayTotals.map((item) => `
                  <div class="flex-1 text-center">
                    <span class="text-xs font-semibold text-[#434654]">${item.label}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `
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
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="font-bold text-[#191C1D]">${group.label}</span>
                  <span class="text-[#434654]">${count} (${pct}%)</span>
                </div>
                <div class="h-1.5 rounded-full bg-[#EDEEEF] overflow-hidden">
                  <div class="h-full ${group.color.replace('bg-', 'bg-[#').replace('500', ']')}" style="width:${pct}%; background-color: ${group.key === 'completado' ? '#10b981' : group.key === 'pendientedepago' ? '#f59e0b' : group.key === 'cancelado' ? '#ef4444' : '#64748b'}"></div>
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
              ? 'dash-range-btn px-5 py-2 rounded-full text-sm font-bold transition-all border border-transparent bg-[#214FC7] text-white shadow-sm'
              : 'dash-range-btn px-5 py-2 rounded-full text-sm font-bold transition-all border border-[#C4C5D6]/30 text-[#434654] hover:bg-[#EDEEEF]'
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
          const recentOrders = orders.slice(0, 5)
          recentOrdersEl.innerHTML = `
            <ul class="space-y-4 w-full">
              ${recentOrders.map(order => `
                <li class="bg-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group gap-3">
                  <div class="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div class="w-10 h-10 flex-shrink-0 rounded-full bg-[#EDEEEF] flex items-center justify-center font-bold text-[#191C1D] text-xs">
                      ${order.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div class="min-w-0">
                      <p class="font-manrope font-extrabold text-[#191C1D] truncate text-sm sm:text-base">${order.customer_name}</p>
                      <p class="text-[10px] sm:text-[11px] font-bold text-[#434654] flex items-center gap-1.5 mt-0.5 uppercase tracking-tighter">
                         <span class="truncate">${new Date(order.created_at).toLocaleDateString()}</span>
                         <span class="opacity-30">•</span>
                         <span class="${order.payment_method === 'whatsapp' ? 'text-emerald-600' : 'text-[#214FC7]'} whitespace-nowrap">${order.payment_method === 'whatsapp' ? 'WhatsApp' : 'Tarjeta'}</span>
                      </p>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="font-manrope font-extrabold text-[#191C1D] text-sm sm:text-base">${formatMoney(order.total || 0)}</p>
                    <span class="inline-flex mt-1 items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest ${
                      order.status === 'completado' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }">
                      ${order.status}
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
