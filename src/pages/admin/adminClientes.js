import { getAdminOrders } from '../../store/index.js'
import { formatMoney } from '../../utils/format.js'
import { lockScroll, unlockScroll } from '../../utils/dom.js'
import { escapeHtml as esc } from '../../utils/sanitize.js'
import { ICON, statCard, statusPill } from './adminIcons.js'

function initials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function avatarColor(name) {
  const colors = ['#214FC7', '#1E9E6A', '#C9821A', '#D6453E', '#7C3AED', '#0891B2']
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return colors[Math.abs(hash) % colors.length]
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

function isSuccessfulStatus(status) {
  const s = (status || '').toString().trim().toLowerCase()
  return s === 'pagado' || s === 'enviado' || s === 'completado'
}

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Sin fecha'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function relTime(iso) {
  const d = new Date(iso), now = Date.now()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} dias`
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function buildCustomers(orders) {
  const map = new Map()
  for (const o of orders) {
    const key = (o.customer_whatsapp || '').trim()
    if (!key) continue
    if (!map.has(key)) {
      map.set(key, {
        name: o.customer_name || 'Sin nombre',
        whatsapp: key,
        orders: [],
        totalSpent: 0,
        firstOrder: o.created_at,
        lastOrder: o.created_at,
      })
    }
    const c = map.get(key)
    c.orders.push(o)
    c.totalSpent += Number(o.total) || 0
    // Keep latest name
    if (new Date(o.created_at) > new Date(c.lastOrder)) {
      c.lastOrder = o.created_at
      c.name = o.customer_name || c.name
    }
    if (new Date(o.created_at) < new Date(c.firstOrder)) {
      c.firstOrder = o.created_at
    }
  }

  return [...map.values()].map(c => ({
    ...c,
    orderCount: c.orders.length,
    ticketAvg: c.orders.length ? c.totalSpent / c.orders.length : 0,
  }))
}

export function pageAdminClientes(state) {
  return {
    title: 'Clientes | G&L Admin',
    html: `
      <div id="adm-clients-root" class="admin-view-in space-y-6">
        <div class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    `,

    async onMount(root) {
      const clientsRoot = root.querySelector('#adm-clients-root')
      if (!clientsRoot) return

      const orders = await getAdminOrders()
      const customers = buildCustomers(orders)

      const completedOrders = orders.filter(o => isSuccessfulStatus(o.status))
      const globalTicket = completedOrders.length
        ? completedOrders.reduce((a, o) => a + (Number(o.total) || 0), 0) / completedOrders.length
        : 0

      const now = Date.now()
      const weekAgo = now - 7 * 86400000
      const newCustomers = customers.filter(c => {
        const t = new Date(c.firstOrder).getTime()
        return Number.isFinite(t) && t >= weekAgo
      }).length

      const repeatRate = customers.length
        ? Math.round((customers.filter(c => c.orderCount >= 2).length / customers.length) * 100)
        : 0

      let searchTerm = ''
      let sortKey = 'totalSpent'
      let sortDir = 'desc'

      function getFiltered() {
        const term = searchTerm.toLowerCase()
        let list = customers.filter(c =>
          !term || c.name.toLowerCase().includes(term) || c.whatsapp.toLowerCase().includes(term)
        )
        list.sort((a, b) => {
          let va = a[sortKey], vb = b[sortKey]
          if (typeof va === 'string') va = va.toLowerCase()
          if (typeof vb === 'string') vb = vb.toLowerCase()
          if (va < vb) return sortDir === 'asc' ? -1 : 1
          if (va > vb) return sortDir === 'asc' ? 1 : -1
          return 0
        })
        return list
      }

      function render() {
        const filtered = getFiltered()

        clientsRoot.innerHTML = `
          <div class="admin-view-in space-y-6">
            <!-- KPIs -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 admin-stagger">
              ${statCard({ eyebrow: 'Total clientes', value: customers.length.toLocaleString(), icon: 'users', foot: 'clientes unicos' })}
              ${statCard({ eyebrow: 'Nuevos (7 dias)', value: newCustomers.toString(), icon: 'trendUp', accent: '#1E9E6A', delta: newCustomers > 0 ? `+${newCustomers}` : '0', deltaDir: newCustomers > 0 ? 'up' : 'flat', foot: 'esta semana' })}
              ${statCard({ eyebrow: 'Ticket promedio', value: formatMoney(globalTicket), icon: 'cash', foot: 'pedidos completados' })}
              ${statCard({ eyebrow: 'Tasa recompra', value: `${repeatRate}%`, icon: 'sparkle', accent: '#7C3AED', foot: 'con 2+ pedidos' })}
            </div>

            <!-- Toolbar + table -->
            <div class="bg-paper rounded-3xl border border-line shadow-card">
              <div class="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-line">
                <div class="relative flex-1 min-w-0">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">${ICON.search('w-[18px] h-[18px]')}</span>
                  <input id="clients-search" placeholder="Buscar por nombre o WhatsApp..." class="adm-fld pl-10" value="${searchTerm}" />
                </div>
                <button id="clients-export" class="adm-btn adm-btn-ghost">${ICON.arrowUpR('w-4 h-4')} Exportar CSV</button>
              </div>

              <!-- Desktop table -->
              <div class="hidden md:block overflow-x-auto adm-scroll-thin">
                <table class="w-full min-w-[700px]">
                  <thead>
                    <tr class="text-left">
                      <th class="eyebrow text-faint font-medium px-5 py-3">Cliente</th>
                      <th class="eyebrow text-faint font-medium px-5 py-3">WhatsApp</th>
                      <th class="eyebrow text-faint font-medium px-5 py-3 cursor-pointer select-none" data-sort="orderCount">
                        <span class="inline-flex items-center gap-1">Ordenes ${sortKey === 'orderCount' ? (sortDir === 'asc' ? ICON.chevUp('w-3.5 h-3.5') : ICON.chevDown('w-3.5 h-3.5')) : ''}</span>
                      </th>
                      <th class="eyebrow text-faint font-medium px-5 py-3 text-right cursor-pointer select-none" data-sort="totalSpent">
                        <span class="inline-flex items-center gap-1">Total gastado ${sortKey === 'totalSpent' ? (sortDir === 'asc' ? ICON.chevUp('w-3.5 h-3.5') : ICON.chevDown('w-3.5 h-3.5')) : ''}</span>
                      </th>
                      <th class="eyebrow text-faint font-medium px-5 py-3 cursor-pointer select-none" data-sort="lastOrder">
                        <span class="inline-flex items-center gap-1">Ultima compra ${sortKey === 'lastOrder' ? (sortDir === 'asc' ? ICON.chevUp('w-3.5 h-3.5') : ICON.chevDown('w-3.5 h-3.5')) : ''}</span>
                      </th>
                      <th class="eyebrow text-faint font-medium px-5 py-3 text-right cursor-pointer select-none" data-sort="ticketAvg">
                        <span class="inline-flex items-center gap-1">Ticket promedio ${sortKey === 'ticketAvg' ? (sortDir === 'asc' ? ICON.chevUp('w-3.5 h-3.5') : ICON.chevDown('w-3.5 h-3.5')) : ''}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filtered.length ? filtered.map(c => `
                      <tr class="border-t border-line hover:bg-canvas transition-colors cursor-pointer" data-client-row data-wa="${esc(c.whatsapp)}">
                        <td class="px-5 py-3.5">
                          <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[12px] font-bold shrink-0">${esc(initials(c.name))}</div>
                            <span class="text-[13.5px] font-semibold text-ink truncate">${esc(c.name)}</span>
                          </div>
                        </td>
                        <td class="px-5 py-3.5"><span class="text-[13px] text-body tnum">${esc(c.whatsapp)}</span></td>
                        <td class="px-5 py-3.5"><span class="text-[13.5px] font-semibold text-ink tnum">${c.orderCount}</span></td>
                        <td class="px-5 py-3.5 text-right"><span class="font-bold text-ink text-[14px] tnum">${formatMoney(c.totalSpent)}</span></td>
                        <td class="px-5 py-3.5"><span class="text-[13px] text-body">${relTime(c.lastOrder)}</span></td>
                        <td class="px-5 py-3.5 text-right"><span class="text-[13px] font-semibold text-ink tnum">${formatMoney(c.ticketAvg)}</span></td>
                      </tr>
                    `).join('') : `
                      <tr><td colspan="6" class="px-5 py-16 text-center">
                        <div>${ICON.users('w-10 h-10 mx-auto mb-3 text-line-strong')}
                        <p class="text-[14px] font-semibold text-body">${searchTerm ? 'Sin resultados' : 'No hay clientes'}</p>
                        <p class="text-[12.5px] text-muted mt-1">${searchTerm ? 'Prueba con otro termino' : 'Los clientes aparecen al recibir pedidos.'}</p></div>
                      </td></tr>
                    `}
                  </tbody>
                </table>
              </div>

              <!-- Mobile cards -->
              <div class="md:hidden divide-y divide-line">
                ${filtered.length ? filtered.map(c => `
                  <div class="p-4 active:bg-canvas transition-colors cursor-pointer" data-client-row data-wa="${esc(c.whatsapp)}">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[12px] font-bold shrink-0">${esc(initials(c.name))}</div>
                        <div class="min-w-0">
                          <p class="text-[14px] font-semibold text-ink truncate">${esc(c.name)}</p>
                          <p class="text-[11.5px] text-faint tnum">${esc(c.whatsapp)}</p>
                        </div>
                      </div>
                      <p class="font-bold text-ink text-[15px] tnum shrink-0">${formatMoney(c.totalSpent)}</p>
                    </div>
                    <div class="flex items-center justify-between mt-2.5">
                      <span class="text-[12px] text-muted">${c.orderCount} pedido${c.orderCount !== 1 ? 's' : ''} · ${relTime(c.lastOrder)}</span>
                      <span class="text-[12px] font-semibold text-brand tnum">${formatMoney(c.ticketAvg)} prom.</span>
                    </div>
                  </div>
                `).join('') : `
                  <div class="px-5 py-16 text-center">
                    ${ICON.users('w-10 h-10 mx-auto mb-3 text-line-strong')}
                    <p class="text-[14px] font-semibold text-body">${searchTerm ? 'Sin resultados' : 'No hay clientes'}</p>
                  </div>
                `}
              </div>

              <!-- Footer -->
              <div class="px-5 py-3 border-t border-line text-[12.5px] text-muted tnum">
                ${searchTerm ? `${filtered.length} de ${customers.length} clientes` : `${customers.length} clientes`}
              </div>
            </div>
          </div>
        `

        // ── Wire search ──
        const searchInput = clientsRoot.querySelector('#clients-search')
        searchInput?.addEventListener('input', (e) => {
          searchTerm = e.target.value.trim()
          render()
        })
        searchInput?.focus()

        // ── Wire sort headers ──
        clientsRoot.querySelectorAll('[data-sort]').forEach(th => {
          th.addEventListener('click', () => {
            const key = th.dataset.sort
            if (sortKey === key) {
              sortDir = sortDir === 'desc' ? 'asc' : 'desc'
            } else {
              sortKey = key
              sortDir = 'desc'
            }
            render()
          })
        })

        // ── Wire export CSV ──
        clientsRoot.querySelector('#clients-export')?.addEventListener('click', () => {
          if (!customers.length) return
          const rows = [
            'Cliente,WhatsApp,Ordenes,Total gastado,Ultima compra,Ticket promedio',
            ...getFiltered().map(c =>
              // not-html: fila de CSV en texto plano
              `"${c.name}",${c.whatsapp},${c.orderCount},${c.totalSpent.toFixed(2)},${formatDate(c.lastOrder)},${c.ticketAvg.toFixed(2)}`
            ),
          ].join('\n')
          const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `gl-clientes-${new Date().toISOString().slice(0, 10)}.csv`
          a.click()
          URL.revokeObjectURL(url)
        })

        // ── Wire row clicks → detail drawer ──
        clientsRoot.querySelectorAll('[data-client-row]').forEach(row => {
          row.addEventListener('click', () => {
            const wa = row.dataset.wa
            const customer = customers.find(c => c.whatsapp === wa)
            if (customer) openDrawer(customer)
          })
        })
      }

      // ── Detail Drawer ──
      function openDrawer(customer) {
        let drawer = document.getElementById('client-detail-drawer')
        if (drawer) drawer.remove()

        drawer = document.createElement('div')
        drawer.id = 'client-detail-drawer'
        drawer.className = 'fixed inset-0 layer-modal'
        drawer.innerHTML = `
          <div data-backdrop class="absolute inset-0 bg-ink/50 backdrop-blur-sm adm-anim-fade"></div>
          <aside class="absolute top-0 right-0 h-full w-full max-w-lg bg-paper border-l border-line shadow-pop overflow-y-auto adm-scroll-thin adm-anim-drawer">
            <div class="sticky top-0 bg-paper border-b border-line px-5 py-4 flex items-center justify-between z-10">
              <h3 class="font-display font-bold text-ink text-[17px]">Detalle de cliente</h3>
              <button data-close class="w-9 h-9 rounded-[10px] border border-line bg-paper flex items-center justify-center text-muted hover:text-ink transition-colors">${ICON.close('w-[18px] h-[18px]')}</button>
            </div>
            <div class="p-5 space-y-4">
              <!-- Customer header -->
              <div class="bg-paper rounded-xl2 border border-line p-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[16px] font-bold">${esc(initials(customer.name))}</div>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold text-ink text-[16px] truncate">${esc(customer.name)}</p>
                    <a href="https://wa.me/${customer.whatsapp.replace(/\D+/g, '')}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-[13px] text-brand hover:text-brand-ink transition-colors tnum">
                      ${ICON.whatsapp('w-4 h-4')}${esc(customer.whatsapp)}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Summary stats -->
              <div class="grid grid-cols-2 gap-2">
                <div class="bg-paper rounded-xl2 border border-line p-3.5">
                  <p class="eyebrow text-faint mb-1.5">Pedidos</p>
                  <p class="font-display font-bold text-ink text-[18px] tnum">${customer.orderCount}</p>
                </div>
                <div class="bg-paper rounded-xl2 border border-line p-3.5">
                  <p class="eyebrow text-faint mb-1.5">Total gastado</p>
                  <p class="font-display font-bold text-ink text-[18px] tnum">${formatMoney(customer.totalSpent)}</p>
                </div>
                <div class="bg-paper rounded-xl2 border border-line p-3.5">
                  <p class="eyebrow text-faint mb-1.5">Ticket promedio</p>
                  <p class="font-display font-bold text-ink text-[18px] tnum">${formatMoney(customer.ticketAvg)}</p>
                </div>
                <div class="bg-paper rounded-xl2 border border-line p-3.5">
                  <p class="eyebrow text-faint mb-1.5">Primera compra</p>
                  <p class="text-[13px] font-semibold text-ink">${formatDate(customer.firstOrder)}</p>
                </div>
              </div>

              <!-- Orders list -->
              <div class="bg-paper rounded-xl2 border border-line overflow-hidden">
                <div class="px-4 py-3 border-b border-line flex items-center justify-between">
                  <p class="font-semibold text-ink text-[14px]">Historial de pedidos</p>
                  <span class="text-[12px] text-muted tnum">${customer.orderCount} pedido${customer.orderCount !== 1 ? 's' : ''}</span>
                </div>
                <div class="divide-y divide-line">
                  ${customer.orders
                    .slice()
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map(o => {
                      const items = parseOrderItems(o.cart_items)
                      const summary = items.length
                        ? items.slice(0, 3).map(i => `${i.qty || 1}x ${i.name || 'Producto'}`).join(', ') + (items.length > 3 ? ` +${items.length - 3} mas` : '')
                        : 'Sin productos'
                      return `
                        <div class="px-4 py-3">
                          <div class="flex items-center justify-between mb-1.5">
                            <span class="text-[13px] font-semibold text-ink tnum">#${String(o.id).slice(0, 8)}</span>
                            ${statusPill(o.status)}
                          </div>
                          <div class="flex items-center justify-between">
                            <span class="text-[12px] text-muted">${formatDate(o.created_at)}</span>
                            <span class="text-[13px] font-bold text-ink tnum">${formatMoney(o.total || 0)}</span>
                          </div>
                          <p class="text-[11.5px] text-faint mt-1 truncate">${esc(summary)}</p>
                        </div>`
                    }).join('')}
                </div>
              </div>
            </div>
          </aside>
        `
        document.body.appendChild(drawer)
        lockScroll()

        const close = () => {
          drawer.remove()
          unlockScroll()
        }
        drawer.querySelector('[data-close]').addEventListener('click', close)
        drawer.querySelector('[data-backdrop]').addEventListener('click', close)
      }

      render()
    }
  }
}
