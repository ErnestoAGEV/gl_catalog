import { getAdminOrders } from '../../store/index.js'
import { formatMoney } from '../../utils/format.js'
import { ICON, statCard } from './adminIcons.js'

function isSuccessful(status) {
  const s = (status || '').toLowerCase()
  return s === 'completado' || s === 'pagado' || s === 'enviado'
}

function parseCartItems(cartItems) {
  try {
    if (!cartItems) return []
    if (typeof cartItems === 'string') return JSON.parse(cartItems)
    if (Array.isArray(cartItems)) return cartItems
    return []
  } catch {
    return []
  }
}

export function pageAdminReportes(state) {
  const html = `<div id="adm-rep-root" class="admin-view-in space-y-6">
    <div class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>`

  return {
    title: 'Reportes | G&L Admin',
    html,
    async onMount(root) {
      const repRoot = root.querySelector('#adm-rep-root')
      if (!repRoot) return

      const orders = await getAdminOrders()

      let currentRange = '30d'

      function getRangeDays(range) {
        if (range === '7d') return 7
        if (range === '30d') return 30
        if (range === '90d') return 90
        return null // Todo
      }

      function filterByRange(list, range) {
        const days = getRangeDays(range)
        if (!days) return list
        const cutoff = Date.now() - days * 86400000
        return list.filter(o => {
          const t = new Date(o.created_at).getTime()
          return Number.isFinite(t) && t >= cutoff
        })
      }

      function compute(range) {
        const inRange = filterByRange(orders, range)
        const successful = inRange.filter(o => isSuccessful(o.status))
        const revenue = successful.reduce((a, o) => a + (Number(o.total) || 0), 0)
        const avgTicket = successful.length ? revenue / successful.length : 0
        const conversionRate = inRange.length ? (successful.length / inRange.length) * 100 : 0

        // Revenue buckets (daily or monthly)
        const days = getRangeDays(range)
        const useDaily = days && days <= 30
        const buckets = []

        if (useDaily) {
          for (let i = days - 1; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400000)
            const key = d.toISOString().slice(0, 10)
            const label = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).replace('.', '')
            buckets.push({ key, label, value: 0 })
          }
          const idx = new Map(buckets.map((b, i) => [b.key, i]))
          successful.forEach(o => {
            const d = new Date(o.created_at)
            if (Number.isNaN(d.getTime())) return
            const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            const k = tz.toISOString().slice(0, 10)
            const i = idx.get(k)
            if (i != null) buckets[i].value += Number(o.total) || 0
          })
        } else {
          // Monthly: last 6 months
          const now = new Date()
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }).replace('.', '')
            buckets.push({ key, label, value: 0 })
          }
          const idx = new Map(buckets.map((b, i) => [b.key, i]))
          successful.forEach(o => {
            const d = new Date(o.created_at)
            if (Number.isNaN(d.getTime())) return
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const i = idx.get(key)
            if (i != null) buckets[i].value += Number(o.total) || 0
          })
        }

        // Revenue by category
        const catMap = new Map()
        successful.forEach(o => {
          parseCartItems(o.cart_items).forEach(it => {
            const type = (it?.type || 'Sin categoría').trim()
            const sub = Number(it?.subtotal) || (Number(it?.price || 0) * Number(it?.qty || 0))
            if (sub > 0) catMap.set(type, (catMap.get(type) || 0) + sub)
          })
        })
        const categories = [...catMap.entries()].sort((a, b) => b[1] - a[1])
        const catTotal = categories.reduce((a, c) => a + c[1], 0)

        // Top 10 products by units sold
        const prodMap = new Map()
        const prodRevMap = new Map()
        inRange.forEach(o => {
          parseCartItems(o.cart_items).forEach(it => {
            const name = (it?.name || '').trim()
            const qty = Number(it?.qty) || 0
            const sub = Number(it?.subtotal) || (Number(it?.price || 0) * qty)
            if (name && qty > 0) {
              prodMap.set(name, (prodMap.get(name) || 0) + qty)
              prodRevMap.set(name, (prodRevMap.get(name) || 0) + sub)
            }
          })
        })
        const topProducts = [...prodMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, qty]) => ({ name, qty, revenue: prodRevMap.get(name) || 0 }))

        // Payment methods
        const payMap = new Map()
        inRange.forEach(o => {
          const method = (o.payment_method || 'No especificado').trim()
          payMap.set(method, (payMap.get(method) || 0) + 1)
        })
        const payMethods = [...payMap.entries()].sort((a, b) => b[1] - a[1])
        const payTotal = payMethods.reduce((a, p) => a + p[1], 0)

        return {
          inRange, successful, revenue, avgTicket, conversionRate,
          buckets, categories, catTotal, topProducts,
          payMethods, payTotal, useDaily,
        }
      }

      function getPayIcon(method) {
        const m = (method || '').toLowerCase()
        if (m.includes('efectivo') || m.includes('cash')) return ICON.cash('w-5 h-5')
        if (m.includes('tarjeta') || m.includes('credit') || m.includes('transfer') || m.includes('depósito') || m.includes('deposito')) return ICON.card('w-5 h-5')
        if (m.includes('envío') || m.includes('envio') || m.includes('delivery') || m.includes('domicilio')) return ICON.truck('w-5 h-5')
        if (m.includes('tienda') || m.includes('pickup') || m.includes('recoger') || m.includes('sucursal')) return ICON.store('w-5 h-5')
        return ICON.cash('w-5 h-5')
      }

      function renderBarChart(buckets, useDaily) {
        const max = Math.max(...buckets.map(b => b.value), 1)
        const bestIdx = buckets.reduce((bi, b, i, arr) => b.value > arr[bi].value ? i : bi, 0)
        const showEvery = useDaily
          ? (buckets.length <= 7 ? 1 : 5)
          : 1

        const gridLines = [1, 0.66, 0.33, 0].map(f => {
          const val = max * f
          let lbl = '0'
          if (f > 0) {
            lbl = val >= 1000 ? '$' + Math.round(val / 1000) + 'k' : '$' + Math.round(val)
          }
          return `<div class="flex items-center gap-2"><span class="eyebrow text-faint w-9 text-right tnum">${lbl}</span><div class="flex-1 border-t border-dashed border-line"></div></div>`
        }).join('')

        return `
          <div class="relative">
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pt-1 pb-7">${gridLines}</div>
            <div class="relative flex items-end gap-[3px] h-[200px] pl-12 pr-1">
              ${buckets.map((b, i) => {
                const h = Math.max(2, (b.value / max) * 100)
                const best = i === bestIdx && b.value > 0
                return `<div class="group relative flex-1 flex flex-col justify-end h-full" data-bar>
                  <div class="adm-bar w-full rounded-t-[4px]" style="height:${h}%;background:${best ? 'var(--color-brand)' : 'rgba(33,79,199,0.24)'}"></div>
                  <div class="adm-bar-tip absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10 whitespace-nowrap">
                    <div class="bg-ink text-white text-[11px] font-semibold px-2 py-1 rounded-lg shadow-float tnum">${formatMoney(b.value)}</div>
                    <div class="w-2 h-2 bg-ink rotate-45 mx-auto -mt-1"></div>
                  </div>
                </div>`
              }).join('')}
            </div>
            <div class="flex gap-[3px] pl-12 pr-1 mt-2">
              ${buckets.map((b, i) => `<div class="flex-1 text-center">${i % showEvery === 0 ? `<span class="eyebrow text-faint tnum">${b.label}</span>` : ''}</div>`).join('')}
            </div>
          </div>`
      }

      function renderCategoryBars(categories, catTotal) {
        if (!categories.length) {
          return `<p class="text-[13px] text-muted py-6 text-center">Sin datos de categorías en el periodo.</p>`
        }
        const maxVal = categories[0]?.[1] || 1
        return `<div class="space-y-4">
          ${categories.map(([cat, val]) => {
            const pct = catTotal ? Math.round((val / catTotal) * 100) : 0
            const barW = Math.max(4, (val / maxVal) * 100)
            return `<div>
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[13px] font-medium text-body truncate">${cat}</span>
                <span class="text-[12.5px] font-semibold text-ink tnum shrink-0 ml-3">${formatMoney(val)} <span class="text-faint font-normal">(${pct}%)</span></span>
              </div>
              <div class="h-2.5 bg-canvas rounded-full overflow-hidden">
                <div class="h-full rounded-full" style="width:${barW}%;background:linear-gradient(90deg,var(--color-brand),rgba(33,79,199,0.6))"></div>
              </div>
            </div>`
          }).join('')}
        </div>`
      }

      function renderTopProducts(topProducts) {
        if (!topProducts.length) {
          return `<div class="text-center py-12">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-canvas border border-line flex items-center justify-center text-faint mb-4">${ICON.products('w-7 h-7')}</div>
            <p class="font-display font-bold text-ink text-[15px]">Sin datos</p>
            <p class="text-[13.5px] text-muted mt-1">No hay productos vendidos en el periodo.</p>
          </div>`
        }
        return `<div class="overflow-x-auto adm-scroll-thin">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-line">
                <th class="eyebrow text-faint pb-3 pr-3 w-10">#</th>
                <th class="eyebrow text-faint pb-3 pr-3">Producto</th>
                <th class="eyebrow text-faint pb-3 pr-3 text-right">Uds.</th>
                <th class="eyebrow text-faint pb-3 text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              ${topProducts.map((p, i) => `<tr class="group">
                <td class="py-3 pr-3">
                  <span class="w-6 h-6 rounded-md bg-canvas border border-line flex items-center justify-center eyebrow text-muted tnum">${i + 1}</span>
                </td>
                <td class="py-3 pr-3">
                  <span class="text-[13.5px] font-medium text-body">${p.name}</span>
                </td>
                <td class="py-3 pr-3 text-right">
                  <span class="text-[13px] font-semibold text-ink tnum">${p.qty}</span>
                </td>
                <td class="py-3 text-right">
                  <span class="text-[13px] font-semibold text-ink tnum">${formatMoney(p.revenue)}</span>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`
      }

      function renderPaymentMethods(payMethods, payTotal) {
        if (!payMethods.length) {
          return `<p class="text-[13px] text-muted py-6 text-center">Sin datos de métodos de pago en el periodo.</p>`
        }
        const maxVal = payMethods[0]?.[1] || 1
        return `<div class="space-y-4">
          ${payMethods.map(([method, count]) => {
            const pct = payTotal ? Math.round((count / payTotal) * 100) : 0
            const barW = Math.max(4, (count / maxVal) * 100)
            return `<div>
              <div class="flex items-center justify-between mb-1.5">
                <span class="flex items-center gap-2 text-[13px] font-medium text-body">
                  <span class="w-8 h-8 rounded-[9px] bg-brand-tint-2 text-brand flex items-center justify-center shrink-0">${getPayIcon(method)}</span>
                  <span class="truncate">${method}</span>
                </span>
                <span class="text-[12.5px] font-semibold text-ink tnum shrink-0 ml-3">${count} <span class="text-faint font-normal">(${pct}%)</span></span>
              </div>
              <div class="h-2.5 bg-canvas rounded-full overflow-hidden ml-10">
                <div class="h-full rounded-full bg-brand" style="width:${barW}%;opacity:0.75"></div>
              </div>
            </div>`
          }).join('')}
        </div>`
      }

      function render() {
        const d = compute(currentRange)
        const rangeLabel = currentRange === 'Todo' ? 'todo el historial' : `los últimos ${currentRange.replace('d', ' días')}`

        repRoot.innerHTML = `
          <div class="admin-view-in space-y-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p class="eyebrow text-brand mb-1.5">Analítica</p>
                <h2 class="font-display font-extrabold text-ink text-[26px] md:text-[30px] leading-none tracking-tight">Reportes</h2>
                <p class="text-[14px] text-muted mt-2">Rendimiento de tu tienda en ${rangeLabel}.</p>
              </div>
              <div class="adm-seg" id="adm-rep-range">
                ${['7d', '30d', '90d', 'Todo'].map(n => `<button data-r="${n}" class="${n === currentRange ? 'active' : ''}">${n === 'Todo' ? 'Todo' : n}</button>`).join('')}
              </div>
            </div>

            <!-- KPIs -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 admin-stagger">
              ${statCard({ eyebrow: 'Ventas del periodo', value: formatMoney(d.revenue), icon: 'cash', accent: '#214FC7', delta: `${d.successful.length} completadas`, deltaDir: d.revenue > 0 ? 'up' : 'flat', foot: 'ingresos totales' })}
              ${statCard({ eyebrow: 'Órdenes', value: d.inRange.length, icon: 'orders', delta: `${d.successful.length} exitosas`, deltaDir: d.inRange.length > 0 ? 'up' : 'flat', foot: 'en el periodo' })}
              ${statCard({ eyebrow: 'Ticket promedio', value: formatMoney(d.avgTicket), icon: 'trendUp', delta: d.successful.length > 0 ? `de ${d.successful.length} órdenes` : 'Sin datos', deltaDir: d.avgTicket > 0 ? 'up' : 'flat', foot: 'por pedido exitoso' })}
              ${statCard({ eyebrow: 'Tasa de conversión', value: d.conversionRate.toFixed(1) + '%', icon: 'check', accent: '#1E9E6A', delta: `${d.successful.length}/${d.inRange.length}`, deltaDir: d.conversionRate >= 50 ? 'up' : d.conversionRate > 0 ? 'flat' : 'flat', foot: 'órdenes exitosas' })}
            </div>

            <!-- Charts: Revenue + Category -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div class="bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
                <div class="flex items-start justify-between mb-5">
                  <div>
                    <h3 class="font-display font-bold text-ink text-[16px]">${d.useDaily ? 'Ingresos diarios' : 'Ingresos mensuales'}</h3>
                    <p class="text-[12.5px] text-muted mt-0.5">Pedidos exitosos · ${rangeLabel}</p>
                  </div>
                  <span class="w-8 h-8 rounded-[9px] bg-brand-tint-2 text-brand flex items-center justify-center shrink-0">${ICON.trendUp('w-[17px] h-[17px]')}</span>
                </div>
                ${renderBarChart(d.buckets, d.useDaily)}
              </div>

              <div class="bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
                <div class="flex items-start justify-between mb-5">
                  <div>
                    <h3 class="font-display font-bold text-ink text-[16px]">Revenue por categoría</h3>
                    <p class="text-[12.5px] text-muted mt-0.5">Distribución de ingresos · ${rangeLabel}</p>
                  </div>
                  <span class="w-8 h-8 rounded-[9px] bg-brand-tint-2 text-brand flex items-center justify-center shrink-0">${ICON.tag('w-[17px] h-[17px]')}</span>
                </div>
                ${renderCategoryBars(d.categories, d.catTotal)}
              </div>
            </div>

            <!-- Bottom: Top products + Payment methods -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div class="bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="font-display font-bold text-ink text-[16px]">Top 10 productos</h3>
                    <p class="text-[12.5px] text-muted mt-0.5">Por unidades vendidas · ${rangeLabel}</p>
                  </div>
                  <span class="w-8 h-8 rounded-[9px] bg-brand-tint-2 text-brand flex items-center justify-center shrink-0">${ICON.sparkle('w-[17px] h-[17px]')}</span>
                </div>
                ${renderTopProducts(d.topProducts)}
              </div>

              <div class="bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
                <div class="flex items-start justify-between mb-5">
                  <div>
                    <h3 class="font-display font-bold text-ink text-[16px]">Métodos de pago</h3>
                    <p class="text-[12.5px] text-muted mt-0.5">Distribución de órdenes · ${rangeLabel}</p>
                  </div>
                  <span class="w-8 h-8 rounded-[9px] bg-brand-tint-2 text-brand flex items-center justify-center shrink-0">${ICON.card('w-[17px] h-[17px]')}</span>
                </div>
                ${renderPaymentMethods(d.payMethods, d.payTotal)}
              </div>
            </div>
          </div>`

        // Wire range selector
        repRoot.querySelectorAll('#adm-rep-range button').forEach(btn => {
          btn.addEventListener('click', () => {
            currentRange = btn.dataset.r
            render()
          })
        })
      }

      render()
    }
  }
}
