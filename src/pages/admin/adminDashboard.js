import { getAdminOrders, getAdminSubscribers } from '../../store/index.js'
import { formatMoney } from '../../utils/format.js'
import { escapeHtml as esc } from '../../utils/sanitize.js'
import { ICON, statCard, statusPill } from './adminIcons.js'

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

function getTrendMeta(current, previous, betterWhenLower = false) {
  if (!Number.isFinite(current) || !Number.isFinite(previous))
    return { text: 'Sin referencia', dir: 'flat' }
  if (previous === 0 && current === 0)
    return { text: 'Sin cambios', dir: 'flat' }
  if (previous === 0 && current > 0)
    return { text: 'Nuevo', dir: betterWhenLower ? 'down' : 'up' }
  const delta = ((current - previous) / previous) * 100
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.1)
    return { text: 'Sin cambios', dir: 'flat' }
  const improved = betterWhenLower ? delta < 0 : delta > 0
  return {
    text: `${improved ? '+' : ''}${delta.toFixed(1)}%`,
    dir: improved ? 'up' : 'down',
  }
}

function relTime(iso) {
  const d = new Date(iso), now = Date.now()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function initials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function pageAdminDashboard(state) {
  const html = `<div id="adm-dash-root" class="admin-view-in space-y-6">
    <div class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>`

  return {
    title: 'Dashboard | G&L Admin',
    html,
    async onMount(root) {
      const dashRoot = root.querySelector('#adm-dash-root')
      if (!dashRoot) return

      const [orders, subscribers] = await Promise.all([
        getAdminOrders(),
        getAdminSubscribers(),
      ])

      const products = state.products || []
      const lowStockCount = products.filter(p => {
        const s = p?.stock
        if (s === null || s === undefined || s === '' || s === '∞') return false
        const n = Number(s)
        return Number.isFinite(n) && n > 0 && n <= 10
      }).length
      const outStockCount = products.filter(p => {
        const s = p?.stock
        if (s === null || s === undefined || s === '' || s === '∞') return false
        const n = Number(s)
        return Number.isFinite(n) && n <= 0
      }).length

      let currentDays = 7

      function compute(rangeDays) {
        const dayMs = 86400000
        const now = new Date()
        const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate())
        const rangeStart = startOfDay(new Date(Date.now() - (rangeDays - 1) * dayMs))
        const prevStart = startOfDay(new Date(rangeStart.getTime() - rangeDays * dayMs))

        const inRange = orders.filter(o => {
          const t = new Date(o.created_at).getTime()
          return Number.isFinite(t) && t >= rangeStart.getTime()
        })
        const inPrev = orders.filter(o => {
          const t = new Date(o.created_at).getTime()
          return Number.isFinite(t) && t >= prevStart.getTime() && t < rangeStart.getTime()
        })

        const paid = inRange.filter(o => isSuccessfulStatus(o.status))
        const paidPrev = inPrev.filter(o => isSuccessfulStatus(o.status))
        const revenue = paid.reduce((a, o) => a + (Number(o.total) || 0), 0)
        const revenuePrev = paidPrev.reduce((a, o) => a + (Number(o.total) || 0), 0)
        const ticket = paid.length ? revenue / paid.length : 0
        const ticketPrev = paidPrev.length ? revenuePrev / paidPrev.length : 0

        // Daily buckets
        const getDayKey = d => {
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          return local.toISOString().slice(0, 10)
        }
        const buckets = []
        for (let i = rangeDays - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * dayMs)
          buckets.push({ key: getDayKey(d), label: d, value: 0 })
        }
        const idx = new Map(buckets.map((b, i) => [b.key, i]))
        paid.forEach(o => {
          const d = new Date(o.created_at)
          if (Number.isNaN(d.getTime())) return
          const k = getDayKey(d)
          const i = idx.get(k)
          if (i != null) buckets[i].value += Number(o.total) || 0
        })

        // Status counts
        const st = { completado: 0, pendientedepago: 0, cancelado: 0 }
        inRange.forEach(o => {
          const k = normalizeStatus(o.status)
          if (st[k] != null) st[k]++
        })

        // Top products
        const map = new Map()
        inRange.forEach(o => parseOrderItems(o.cart_items).forEach(it => {
          const name = (it?.name || '').trim()
          const qty = Number(it?.qty) || 0
          if (name && qty > 0) map.set(name, (map.get(name) || 0) + qty)
        }))
        const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)

        // Subscribers delta
        const weekAgo = Date.now() - 7 * dayMs
        const newSubs = subscribers.filter(s => {
          const t = new Date(s.created_at).getTime()
          return Number.isFinite(t) && t >= weekAgo
        }).length

        return {
          inRange, paid, revenue, revenuePrev, ticket, ticketPrev,
          buckets, st, top, count: inRange.length,
          countPrev: inPrev.length, newSubs,
        }
      }

      function renderBarChart(buckets, days) {
        const max = Math.max(...buckets.map(b => b.value), 1)
        const avg = buckets.reduce((a, b) => a + b.value, 0) / buckets.length
        const bestIdx = buckets.reduce((bi, b, i, arr) => b.value > arr[bi].value ? i : bi, 0)
        const showEvery = days <= 7 ? 1 : days <= 30 ? 5 : 12

        const gridLines = [1, 0.66, 0.33, 0].map(f =>
          `<div class="flex items-center gap-2"><span class="eyebrow text-faint w-9 text-right tnum">${f === 0 ? '0' : '$' + Math.round((max * f) / 1000) + 'k'}</span><div class="flex-1 border-t border-dashed border-line"></div></div>`
        ).join('')

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
              ${buckets.map((b, i) => `<div class="flex-1 text-center">${i % showEvery === 0 ? `<span class="eyebrow text-faint tnum">${b.label.toLocaleDateString('es-MX', { day: '2-digit', month: days > 7 ? 'short' : undefined }).replace('.', '')}</span>` : ''}</div>`).join('')}
            </div>
          </div>`
      }

      function renderDonut(st, total) {
        const rows = [
          { k: 'completado', label: 'Completado', color: '#1E9E6A' },
          { k: 'pendientedepago', label: 'Pendiente de pago', color: '#C9821A' },
          { k: 'cancelado', label: 'Cancelado', color: '#D6453E' },
        ]
        const t = Math.max(total, 1)
        let acc = 0
        const R = 52, C = 2 * Math.PI * R
        const segs = rows.map(r => {
          const frac = st[r.k] / t
          const seg = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${r.color}" stroke-width="16" stroke-dasharray="${(frac * C).toFixed(1)} ${C}" stroke-dashoffset="${(-acc * C).toFixed(1)}" transform="rotate(-90 70 70)"/>`
          acc += frac
          return seg
        }).join('')
        const pct = Math.round((st.completado / t) * 100)
        return `
          <div class="flex items-center gap-5">
            <div class="relative shrink-0">
              <svg viewBox="0 0 140 140" width="124" height="124">
                <circle cx="70" cy="70" r="${R}" fill="none" stroke="#EEEFF2" stroke-width="16"/>${segs}
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-display font-extrabold text-ink text-[24px] leading-none tnum">${pct}%</span>
                <span class="eyebrow text-muted mt-1">éxito</span>
              </div>
            </div>
            <div class="flex-1 space-y-3">
              ${rows.map(r => `<div>
                <div class="flex items-center justify-between mb-1">
                  <span class="flex items-center gap-2 text-[13px] font-medium text-body"><span class="w-2 h-2 rounded-full" style="background:${r.color}"></span>${r.label}</span>
                  <span class="text-[13px] font-semibold text-ink tnum">${st[r.k]}</span>
                </div>
              </div>`).join('')}
            </div>
          </div>`
      }

      function render() {
        const d = compute(currentDays)
        const todayKey = new Date().toISOString().slice(0, 10)
        const today = d.buckets.find(b => b.key === todayKey)?.value || 0
        const best = Math.max(...d.buckets.map(b => b.value), 0)
        const avgDay = d.buckets.reduce((a, b) => a + b.value, 0) / d.buckets.length

        const revTrend = getTrendMeta(d.revenue, d.revenuePrev)
        const ordTrend = getTrendMeta(d.count, d.countPrev)
        const tickTrend = getTrendMeta(d.ticket, d.ticketPrev)

        dashRoot.innerHTML = `
          <div class="admin-view-in space-y-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p class="eyebrow text-brand mb-1.5">Resumen ejecutivo</p>
                <h2 class="font-display font-extrabold text-ink text-[26px] md:text-[30px] leading-none tracking-tight">Hola, Gerencia 👋</h2>
                <p class="text-[14px] text-muted mt-2">Esto pasó en tu tienda en los últimos ${currentDays} días.</p>
              </div>
              <div class="adm-seg" id="adm-dash-range">
                ${[7, 30, 90].map(n => `<button data-d="${n}" class="${n === currentDays ? 'active' : ''}">${n} días</button>`).join('')}
              </div>
            </div>

            <!-- KPIs -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 admin-stagger">
              ${statCard({ eyebrow: 'Ingresos', value: formatMoney(d.revenue), icon: 'cash', accent: '#214FC7', delta: revTrend.text, deltaDir: revTrend.dir, foot: 'vs periodo previo' })}
              ${statCard({ eyebrow: 'Órdenes', value: d.count, icon: 'orders', delta: ordTrend.text, deltaDir: ordTrend.dir, foot: 'en el periodo' })}
              ${statCard({ eyebrow: 'Ticket promedio', value: formatMoney(d.ticket), icon: 'trendUp', delta: tickTrend.text, deltaDir: tickTrend.dir, foot: 'por pedido' })}
              ${statCard({ eyebrow: 'Suscriptores', value: subscribers.length, icon: 'users', delta: d.newSubs > 0 ? `+${d.newSubs}` : '0', deltaDir: d.newSubs > 0 ? 'up' : 'flat', foot: 'esta semana' })}
            </div>

            <!-- Chart + Status donut -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div class="xl:col-span-2 bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
                <div class="flex items-start justify-between mb-5">
                  <div>
                    <h3 class="font-display font-bold text-ink text-[16px]">Ingresos por día</h3>
                    <p class="text-[12.5px] text-muted mt-0.5">Pedidos completados · últimos ${currentDays} días</p>
                  </div>
                  <div class="text-right">
                    <p class="eyebrow text-faint">Ventas hoy</p>
                    <p class="font-display font-extrabold text-brand text-[20px] leading-none mt-1 tnum">${formatMoney(today)}</p>
                  </div>
                </div>
                ${renderBarChart(d.buckets, currentDays)}
                <div class="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-line">
                  <div><p class="eyebrow text-faint mb-1">Promedio diario</p><p class="font-display font-bold text-ink text-[16px] tnum">${formatMoney(avgDay)}</p></div>
                  <div><p class="eyebrow text-faint mb-1">Mejor día</p><p class="font-display font-bold text-ink text-[16px] tnum">${formatMoney(best)}</p></div>
                  <div><p class="eyebrow text-faint mb-1">Pedidos pagados</p><p class="font-display font-bold text-ink text-[16px] tnum">${d.paid.length}</p></div>
                </div>
              </div>

              <div class="bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
                <h3 class="font-display font-bold text-ink text-[16px] mb-1">Estado de pedidos</h3>
                <p class="text-[12.5px] text-muted mb-5">${d.count} pedidos en el periodo</p>
                ${renderDonut(d.st, d.count)}
                <div class="mt-6 pt-5 border-t border-line flex items-center gap-3">
                  <span class="w-9 h-9 rounded-[10px] bg-warn-tint text-warn flex items-center justify-center shrink-0">${ICON.box('w-[18px] h-[18px]')}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-ink">${lowStockCount} con bajo stock · ${outStockCount} agotados</p>
                    <p class="text-[11.5px] text-muted">Revisa tu inventario</p>
                  </div>
                  <a href="/admin/products" class="text-brand hover:text-brand-ink shrink-0">${ICON.chevRight('w-5 h-5')}</a>
                </div>
              </div>
            </div>

            <!-- Recent orders + top + quick actions -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div class="xl:col-span-2 bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-display font-bold text-ink text-[16px]">Pedidos recientes</h3>
                  <a href="/admin/orders" class="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-ink">Ver todos ${ICON.chevRight('w-4 h-4')}</a>
                </div>
                <div class="divide-y divide-line">
                  ${orders.length === 0
                    ? `<div class="text-center py-12"><div class="w-14 h-14 mx-auto rounded-2xl bg-canvas border border-line flex items-center justify-center text-faint mb-4">${ICON.orders('w-7 h-7')}</div><p class="font-display font-bold text-ink text-[15px]">Sin pedidos</p><p class="text-[13.5px] text-muted mt-1">Aún no hay pedidos registrados.</p></div>`
                    : orders.slice(0, 6).map(o => `
                    <a href="/admin/orders" class="flex items-center gap-3 px-2 -mx-2 h-[52px] rounded-xl2 hover:bg-canvas transition-colors">
                      <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[12px] font-bold shrink-0">${esc(initials(o.customer_name))}</div>
                      <div class="min-w-0 flex-1">
                        <p class="text-[13.5px] font-semibold text-ink truncate">${esc(o.customer_name)}</p>
                        <p class="text-[11.5px] text-faint tnum">#${o.id} · ${relTime(o.created_at)}</p>
                      </div>
                      <div class="text-right shrink-0">
                        <p class="text-[13.5px] font-bold text-ink tnum">${formatMoney(o.total || 0)}</p>
                      </div>
                      <div class="shrink-0 hidden sm:flex w-[108px] justify-end">${statusPill(o.status)}</div>
                    </a>`).join('')
                  }
                </div>
              </div>

              <div class="space-y-5">
                <div class="bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
                  <h3 class="font-display font-bold text-ink text-[16px] mb-4">Más vendidos</h3>
                  <div class="space-y-3.5">
                    ${d.top.length > 0 ? d.top.map((t, i) => `<div class="flex items-center gap-3">
                      <span class="w-6 h-6 rounded-md bg-canvas border border-line flex items-center justify-center eyebrow text-muted tnum shrink-0">${i + 1}</span>
                      <p class="flex-1 min-w-0 text-[13.5px] font-medium text-body truncate">${t[0]}</p>
                      <span class="text-[12.5px] font-semibold text-ink tnum shrink-0">${t[1]} uds</span>
                    </div>`).join('') : '<p class="text-[13px] text-muted">Sin datos en el periodo.</p>'}
                  </div>
                </div>
                <div class="rounded-3xl p-5 md:p-6 bg-ink text-white relative overflow-hidden">
                  <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl" style="background:rgba(33,79,199,0.35)"></div>
                  <p class="eyebrow text-white/45 relative">Acciones rápidas</p>
                  <div class="mt-4 space-y-2 relative">
                    <a href="/admin/products" class="flex items-center gap-3 px-3 h-11 rounded-xl2 bg-white/[0.07] hover:bg-white/[0.12] transition-colors text-[14px] font-medium">
                      <span class="text-brand-tint">${ICON.plus('w-[18px] h-[18px]')}</span> Agregar producto
                      <span class="ml-auto text-white/30">${ICON.chevRight('w-4 h-4')}</span>
                    </a>
                    <a href="/admin/coupons" class="flex items-center gap-3 px-3 h-11 rounded-xl2 bg-white/[0.07] hover:bg-white/[0.12] transition-colors text-[14px] font-medium">
                      <span class="text-brand-tint">${ICON.coupon('w-[18px] h-[18px]')}</span> Crear cupón
                      <span class="ml-auto text-white/30">${ICON.chevRight('w-4 h-4')}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>`

        // Wire range selector
        dashRoot.querySelectorAll('#adm-dash-range button').forEach(btn => {
          btn.addEventListener('click', () => {
            currentDays = Number(btn.dataset.d)
            render()
          })
        })
      }

      render()
    }
  }
}
