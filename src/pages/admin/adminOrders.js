import { getAdminOrders, updateAdminOrderStatus, updateAdminOrderShipping, getProductById, getState } from '../../store/index.js'
import { splitGalleryImages } from '../../utils/productImages.js'
import { isPerfumeCategory } from './adminProductsData.js'
import { formatMoney } from '../../utils/format.js'
import { lockScroll, unlockScroll } from '../../utils/dom.js'
import { supabase } from '../../core/supabase.js'
import { showToast } from '../../utils/toast.js'
import { escapeHtml as esc } from '../../utils/sanitize.js'
import { ICON, statusPill, statCard } from './adminIcons.js'

function getPaymentMeta(paymentMethod) {
  const raw = (paymentMethod || '').toString().trim()
  const normalized = raw.toLowerCase()
  if (!normalized) return { label: 'Sin definir', cls: 'bg-line text-muted', icon: 'card' }
  if (normalized.includes('transfer')) return { label: raw, cls: 'bg-brand-tint text-brand', icon: 'cash' }
  if (normalized.includes('efectivo') || normalized.includes('recoger')) return { label: raw, cls: 'bg-ok-tint text-ok', icon: 'cash' }
  if (normalized === 'whatsapp') return { label: 'WhatsApp', cls: 'bg-ok-tint text-ok', icon: 'whatsapp' }
  return { label: raw, cls: 'bg-brand-tint text-brand-ink', icon: 'card' }
}

const STATUS_META = {
  completado: { label: 'Completado', cls: 'text-ok bg-ok-tint', dot: '#1E9E6A' },
  pendientedepago: { label: 'Pendiente', cls: 'text-warn bg-warn-tint', dot: '#C9821A' },
  cancelado: { label: 'Cancelado', cls: 'text-bad bg-bad-tint', dot: '#D6453E' },
}
const STATUS_OPTS = [
  { v: 'completado', label: 'Completado' },
  { v: 'pendientedepago', label: 'Pendiente de pago' },
  { v: 'cancelado', label: 'Cancelado' },
]

function statusDropdownHtml(order) {
  const s = (order.status || '').toLowerCase()
  const m = STATUS_META[s] || { label: order.status || '—', cls: 'text-muted bg-line', dot: '#A4A8B2' }
  return `
    <div class="relative inline-block" data-status-wrap data-id="${order.id}">
      <button type="button" data-status-btn class="inline-flex items-center gap-1.5 pl-2.5 pr-2 h-[30px] rounded-full text-[12px] font-semibold ${m.cls} hover:brightness-95 transition-colors cursor-pointer">
        <span class="w-1.5 h-1.5 rounded-full" style="background:${m.dot}"></span>${esc(m.label)}
        ${ICON.chevDown('w-3.5 h-3.5 opacity-60')}
      </button>
      <div data-status-menu class="hidden absolute right-0 top-[34px] z-30 w-[180px] bg-paper rounded-xl2 border border-line shadow-pop p-1 adm-anim-pop">
        ${STATUS_OPTS.map(opt => `<button type="button" data-set="${opt.v}" class="w-full flex items-center gap-2 px-2.5 h-9 rounded-lg text-[13px] font-medium text-body hover:bg-canvas transition-colors ${opt.v === s ? 'bg-canvas' : ''}">
          <span class="w-1.5 h-1.5 rounded-full" style="background:${(STATUS_META[opt.v] || {}).dot || '#A4A8B2'}"></span>${opt.label}
          ${opt.v === s ? `<span class="ml-auto text-brand">${ICON.check('w-4 h-4')}</span>` : ''}
        </button>`).join('')}
      </div>
    </div>`
}

/**
 * Foto del producto pedido. El pedido guarda productId nulo cuando el stock es
 * ilimitado, asi que ahi se busca por nombre. splitGalleryImages aparta la
 * tabla de tallas para no enseñarla como si fuera el producto.
 */
function itemThumb(item) {
  const byId = item?.productId ? getProductById(item.productId) : null
  const product = byId || getState().products.find(p => p.name === item?.name) || null
  const { gallery } = splitGalleryImages(product?.images || [])
  if (!gallery.length) return ''
  const fit = isPerfumeCategory(product?.type) ? 'object-contain bg-white p-0.5' : 'object-cover'
  return `<img src="${esc(gallery[0])}" alt="" loading="lazy" class="w-full h-full ${fit}" />`
}

// Hoja de pedido para imprimir. Se abre en una ventana aparte, asi que todo va
// en linea (estilos y la URL absoluta del logo) y se imprime al cargar el logo.
function printOrderHtml(d) {
  const shipping = d.shipping == null ? null : Number(d.shipping) || 0
  const toPay = (Number(d.total) || 0) + (shipping || 0)
  const rows = (d.items || []).map(i => {
    const variant = [i.size ? `Talla ${esc(i.size)}` : '', i.color ? esc(i.color) : ''].filter(Boolean).join(' · ') || 'Única'
    const qty = Number(i.qty) || 0
    return `<tr><td class="q">${qty}</td><td><b>${esc(i.name) || 'Producto'}</b><span>${variant}</span></td><td class="n">${formatMoney(i.price || 0)}</td><td class="n">${formatMoney((Number(i.price) || 0) * qty)}</td></tr>`
  }).join('')
  const row = (label, value, cls = '') => `<div class="t ${cls}"><span>${label}</span><span>${value}</span></div>`
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Orden #${esc(d.shortId)}</title><style>
    @page{size:letter;margin:14mm}
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{margin:0;font-family:"Helvetica Neue",Arial,sans-serif;color:#15171C;font-size:13px;line-height:1.45}
    .sheet{max-width:760px;margin:0 auto;padding:8px}
    header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:16px;border-bottom:3px solid #214FC7}
    header img{height:54px;display:block}
    header .shop{font-size:11px;color:#767B86;margin-top:6px}
    header .id{text-align:right}
    header .id small{display:block;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#767B86}
    header .id strong{display:block;font-size:24px;letter-spacing:-.02em}
    header .id em{font-style:normal;font-size:12px;color:#2B2E36}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
    .card{border:1px solid #E9EAEE;border-radius:12px;padding:12px 14px}
    .card h3{margin:0 0 6px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#214FC7}
    .card p{margin:2px 0}
    .card .big{font-size:15px;font-weight:700}
    .pill{display:inline-block;margin-top:6px;background:#EAEFFB;color:#1A3E9E;border-radius:99px;padding:2px 10px;font-size:11px;font-weight:700}
    table{width:100%;border-collapse:collapse}
    thead th{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#767B86;text-align:left;padding:8px 10px;border-bottom:1px solid #DCDEE4}
    tbody td{padding:10px;border-bottom:1px solid #E9EAEE;vertical-align:top}
    tbody td span{display:block;font-size:11.5px;color:#767B86}
    .q{width:42px;font-weight:700;text-align:center}
    .n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
    thead th.n{text-align:right}
    .totals{margin:16px 0 0 auto;width:280px}
    .t{display:flex;justify-content:space-between;padding:5px 0;font-variant-numeric:tabular-nums}
    .t.muted{color:#767B86}
    .t.disc{color:#1E9E6A}
    .t.grand{margin-top:6px;padding:10px 14px;background:#214FC7;color:#fff;border-radius:10px;font-size:16px;font-weight:800}
    footer{margin-top:28px;padding-top:12px;border-top:1px solid #E9EAEE;text-align:center;font-size:11px;color:#767B86}
  </style></head><body><div class="sheet">
    <header>
      <div><img src="${location.origin}/email-logo.png" alt="G&amp;L"><div class="shop">glboutique.com.mx</div></div>
      <div class="id"><small>Pedido</small><strong>#${esc(d.shortId)}</strong><em>${esc(d.when) || 'Sin fecha'}</em></div>
    </header>
    <div class="cards">
      <div class="card"><h3>Cliente</h3>
        <p class="big">${esc(d.customerName) || 'Sin nombre'}</p>
        <p>WhatsApp: ${esc(d.customerWhatsapp) || 'Sin teléfono'}</p>
        ${d.customerEmail ? `<p>Correo: ${esc(d.customerEmail)}</p>` : ''}
        <span class="pill">${esc(d.paymentLabel) || 'Pago sin definir'}</span>
      </div>
      <div class="card"><h3>Entrega</h3>
        <p class="big">${esc(d.deliveryMethod) || 'Sin método'}</p>
        <p>${esc(d.address) || 'Recoge en tienda'}</p>
      </div>
    </div>
    <table><thead><tr><th class="q">Cant.</th><th>Producto</th><th class="n">Precio</th><th class="n">Importe</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4">Sin productos</td></tr>'}</tbody></table>
    <div class="totals">
      ${row('Subtotal', formatMoney(d.subtotal || 0), 'muted')}
      ${Number(d.discount) > 0 ? row(`Descuento${d.couponCode ? ` (${esc(d.couponCode)})` : ''}`, `−${formatMoney(d.discount)}`, 'disc') : ''}
      ${shipping != null ? row('Envío', shipping > 0 ? formatMoney(shipping) : 'Gratis', 'muted') : ''}
      ${row('Total', formatMoney(toPay), 'grand')}
    </div>
    <footer>Gracias por tu compra en G&amp;L · Dudas o cambios por WhatsApp</footer>
  </div><script>
    var img = document.images[0];
    function go(){ window.focus(); window.print() }
    if (img.complete) go(); else { img.onload = go; img.onerror = go }
  </script></body></html>`
}

function initials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function notifyNewOrder(order) {
  const customer = order?.customer_name || 'Cliente'
  const total = Number(order?.total || 0)
  playNewOrderSound()
  showToast(`Nuevo pedido de ${esc(customer)} (${formatMoney(total)})`, 'success', 6000)
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    const notification = new Notification('Nuevo pedido recibido', { body: `${customer} - ${formatMoney(total)}` })
    notification.onclick = () => { window.focus() }
  } catch (err) { if (import.meta.env.DEV) console.warn('Browser notification failed', err) }
}

function playNewOrderSound() {
  if (typeof window === 'undefined') return
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return
  try {
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const createBeep = (startAt, frequency, duration, gainValue) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, startAt)
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startAt)
      osc.stop(startAt + duration)
    }
    createBeep(now, 880, 0.16, 0.12)
    createBeep(now + 0.2, 1046.5, 0.2, 0.1)
    window.setTimeout(() => { ctx.close().catch(() => {}) }, 800)
  } catch (err) { if (import.meta.env.DEV) console.warn('Audio notification failed', err) }
}

function relTime(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return 'Sin fecha'
  return `${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function avatarColor(name) {
  const colors = ['#214FC7', '#1E9E6A', '#C9821A', '#D6453E', '#7C3AED', '#0891B2']
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return colors[Math.abs(hash) % colors.length]
}

export function pageAdminOrders(state) {
  return {
    title: 'Órdenes | G&L Admin',
    html: `
      <div class="admin-view-in space-y-6">
        <!-- KPIs -->
        <div id="orders-kpis" class="grid grid-cols-2 lg:grid-cols-4 gap-4 admin-stagger">
          ${statCard({ eyebrow: 'Total pedidos', value: '—', icon: 'orders', foot: 'Cargando...' })}
          ${statCard({ eyebrow: 'Ingresos', value: '—', icon: 'cash', accent: '#1E9E6A' })}
          ${statCard({ eyebrow: 'Pendientes', value: '—', icon: 'clock', accent: '#C9821A' })}
          ${statCard({ eyebrow: 'Completados', value: '—', icon: 'check', accent: '#1E9E6A' })}
        </div>

        <!-- Toolbar + table -->
        <div class="bg-paper rounded-3xl border border-line shadow-card">
          <div class="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-line">
            <div class="relative flex-1 min-w-0">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">${ICON.search('w-[18px] h-[18px]')}</span>
              <input id="orders-search" placeholder="Buscar por cliente o pedido..." class="adm-fld pl-10" />
            </div>
            <div id="orders-filters" class="flex items-center gap-2 overflow-x-auto adm-scroll-thin -mx-1 px-1 pb-0.5 lg:pb-0">
              <button data-filter="all" class="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-[10px] text-[13px] font-semibold border transition-colors bg-ink text-white border-ink">Todos</button>
              <button data-filter="pendientedepago" class="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-[10px] text-[13px] font-semibold border transition-colors bg-paper text-body border-line hover:border-line-strong">Pendientes</button>
              <button data-filter="completado" class="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-[10px] text-[13px] font-semibold border transition-colors bg-paper text-body border-line hover:border-line-strong">Completados</button>
              <button data-filter="cancelado" class="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-[10px] text-[13px] font-semibold border transition-colors bg-paper text-body border-line hover:border-line-strong">Cancelados</button>
            </div>
          </div>

          <!-- Desktop table -->
          <div class="hidden md:block">
            <table class="w-full">
              <thead>
                <tr class="text-left">
                  <th class="eyebrow text-faint font-medium px-5 py-3">Pedido</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3">Cliente</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3">Fecha</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3 text-right">Total</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3">Estado</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody id="orders-tbody"></tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div id="orders-mobile" class="md:hidden divide-y divide-line"></div>

          <!-- Footer -->
          <div id="orders-footer" class="px-5 py-3 border-t border-line text-[12.5px] text-muted tnum"></div>
        </div>
      </div>
    `,

    onMount(root) {
      const tbody = root.querySelector('#orders-tbody')
      const mobileContainer = root.querySelector('#orders-mobile')
      const kpis = root.querySelector('#orders-kpis')
      const footerEl = root.querySelector('#orders-footer')
      const searchInput = root.querySelector('#orders-search')
      const filtersContainer = root.querySelector('#orders-filters')

      if (!tbody || !mobileContainer) return

      const globalNotifierActive = typeof window !== 'undefined' && window.__glGlobalOrderNotifierActive === true
      let knownOrderIds = new Set()
      const notifiedOrderIds = new Set()
      let ordersById = new Map()
      let allOrders = []
      let pollingTimer = null
      let channel = null
      let isUnmounted = false
      let isCheckingOrders = false
      let searchTerm = ''
      let statusFilter = 'all'

      const FILTER_CLS_ACTIVE = 'shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-[10px] text-[13px] font-semibold border transition-colors bg-ink text-white border-ink'
      const FILTER_CLS_IDLE = 'shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-[10px] text-[13px] font-semibold border transition-colors bg-paper text-body border-line hover:border-line-strong'
      const FILTER_LABELS = { all: 'Todos', pendientedepago: 'Pendientes', completado: 'Completados', cancelado: 'Cancelados' }

      // ── Detail Drawer ──
      const ensureDetailDrawer = () => {
        let drawer = document.getElementById('order-detail-drawer')
        if (drawer) return drawer
        drawer = document.createElement('div')
        drawer.id = 'order-detail-drawer'
        drawer.className = 'fixed inset-0 layer-modal hidden'
        drawer.innerHTML = `
          <div data-backdrop class="absolute inset-0 bg-ink/50 backdrop-blur-sm adm-anim-fade"></div>
          <aside class="absolute top-0 right-0 h-full w-full max-w-lg bg-paper border-l border-line shadow-pop overflow-y-auto adm-scroll-thin adm-anim-drawer">
            <div class="sticky top-0 bg-paper border-b border-line px-5 py-4 flex items-center justify-between z-10">
              <h3 class="font-display font-bold text-ink text-[17px]">Detalle de orden</h3>
              <button data-close class="w-9 h-9 rounded-[10px] border border-line bg-paper flex items-center justify-center text-muted hover:text-ink transition-colors">${ICON.close('w-[18px] h-[18px]')}</button>
            </div>
            <div id="order-detail-content" class="p-5"></div>
          </aside>`
        document.body.appendChild(drawer)

        const close = () => { drawer.classList.add('hidden'); unlockScroll() }
        drawer.querySelector('[data-close]').addEventListener('click', close)
        drawer.querySelector('[data-backdrop]').addEventListener('click', close)

        const normalizePhone = (v) => (v || '').toString().replace(/\D+/g, '')
        const copyToClipboard = async (text) => {
          const value = (text || '').toString().trim()
          if (!value) return false
          try { if (navigator?.clipboard?.writeText) { await navigator.clipboard.writeText(value); return true } } catch {}
          try { const ta = document.createElement('textarea'); ta.value = value; ta.setAttribute('readonly',''); ta.style.position='absolute'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok } catch { return false }
        }

        drawer.addEventListener('click', async (e) => {
          const btn = e.target?.closest?.('[data-order-action]')
          if (!btn) return
          const action = btn.getAttribute('data-order-action')
          if (action === 'copy-address') { const ok = await copyToClipboard(decodeURIComponent(btn.getAttribute('data-address') || '')); showToast(ok ? 'Dirección copiada' : 'No se pudo copiar', ok ? 'success' : 'error') }
          if (action === 'copy-summary') { const ok = await copyToClipboard(decodeURIComponent(btn.getAttribute('data-summary') || '')); showToast(ok ? 'Resumen copiado' : 'No se pudo copiar', ok ? 'success' : 'error') }
          if (action === 'open-whatsapp') { const phone = normalizePhone(decodeURIComponent(btn.getAttribute('data-phone') || '')); if (!phone) { showToast('Sin teléfono válido', 'error'); return }; window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer') }
          if (action === 'print-order') {
            let data; try { data = JSON.parse(decodeURIComponent(btn.getAttribute('data-print') || '')) } catch { showToast('Error al preparar impresión', 'error'); return }
            const pw = window.open('', '_blank', 'width=900,height=700')
            if (!pw) { showToast('Ventana bloqueada', 'error'); return }
            pw.document.write(printOrderHtml(data))
            pw.document.close()
          }
        })
        return drawer
      }

      const openOrderDetails = (orderId) => {
        const drawer = ensureDetailDrawer()
        const content = drawer.querySelector('#order-detail-content')
        const order = ordersById.get(String(orderId))
        if (!content || !order) return
        let items = []
        try { items = typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : (order.cart_items || []) } catch { items = [] }
        const payment = getPaymentMeta(order.payment_method)
        const createdAt = new Date(order.created_at)
        const when = Number.isNaN(createdAt.getTime()) ? 'Sin fecha' : `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        const itemsTotal = items.reduce((a, it) => a + (Number(it?.price) || 0) * (Number(it?.qty) || 0), 0)
        const subtotal = order.subtotal != null ? Number(order.subtotal) : itemsTotal
        const discount = Number(order.discount) || 0
        const shipping = order.shipping_cost == null ? null : Number(order.shipping_cost)
        const toPay = (Number(order.total) || 0) + (shipping || 0)
        const printPayload = encodeURIComponent(JSON.stringify({ shortId: String(order.id).slice(0, 8), customerName: order.customer_name, customerWhatsapp: order.customer_whatsapp, customerEmail: order.customer_email, when, deliveryMethod: order.delivery_method, address: order.address, paymentLabel: payment.label, subtotal, discount, couponCode: order.coupon_code, shipping, total: Number(order.total) || 0, items }))
        // not-html: se copia al portapapeles como texto plano
        const summaryLines = [`Pedido #${String(order.id).slice(0,8)}`, `Cliente: ${order.customer_name||'Sin nombre'}`, `WhatsApp: ${order.customer_whatsapp||'Sin teléfono'}`, ...(order.customer_email ? [`Correo: ${order.customer_email}`] : []), `Fecha: ${when}`, `Entrega: ${order.delivery_method||'Sin método'}`, `Dirección: ${order.address||'Sin dirección'}`, `Pago: ${payment.label}`, 'Productos:', ...(items.length ? items.map(i => `- ${i?.qty||0}x ${i?.name||'Producto'} (${i?.size||'Única'}) · ${formatMoney(i?.price||0)}`) : ['- Sin productos']), ...(shipping != null ? [`Envío: ${formatMoney(shipping)}`] : []), `Total: ${formatMoney(toPay)}`]

        const deliveryIcon = (order.delivery_method || '').includes('domicilio') ? 'truck' : 'store'
        const deliveryLabel = (order.delivery_method || '').includes('domicilio') ? 'Domicilio' : 'En tienda'

        content.innerHTML = `
          <div class="space-y-4">
            <!-- Actions -->
            <div class="grid grid-cols-2 gap-2">
              <button data-order-action="open-whatsapp" data-phone="${encodeURIComponent(order.customer_whatsapp||'')}" class="adm-btn adm-btn-ink h-10 text-[13px]">${ICON.whatsapp('w-[17px] h-[17px]')} WhatsApp</button>
              <button data-order-action="print-order" data-print="${printPayload}" class="adm-btn adm-btn-ghost h-10 text-[13px]">${ICON.print('w-[17px] h-[17px]')} Imprimir</button>
              <button data-order-action="copy-address" data-address="${encodeURIComponent(order.address||'')}" class="adm-btn adm-btn-ghost h-10 text-[13px]">${ICON.copy('w-[16px] h-[16px]')} Copiar dirección</button>
              <button data-order-action="copy-summary" data-summary="${encodeURIComponent(summaryLines.join('\n'))}" class="adm-btn adm-btn-ghost h-10 text-[13px]">${ICON.list('w-[16px] h-[16px]')} Copiar resumen</button>
            </div>

            <!-- Customer -->
            <div class="bg-paper rounded-xl2 border border-line p-4">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[14px] font-bold">${esc(initials(order.customer_name))}</div>
                <div class="min-w-0">
                  <p class="font-semibold text-ink text-[15px] truncate">${esc(order.customer_name)||'Sin nombre'}</p>
                  <p class="text-[13px] text-brand tnum">${esc(order.customer_whatsapp)||'Sin teléfono'}</p>
                  ${order.customer_email ? `<p class="text-[12.5px] text-muted truncate">${esc(order.customer_email)}</p>` : ''}
                </div>
              </div>
            </div>

            <!-- Meta grid -->
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-paper rounded-xl2 border border-line p-3.5">
                <p class="eyebrow text-faint mb-1.5">Estado</p>
                ${statusPill(order.status)}
              </div>
              <div class="bg-paper rounded-xl2 border border-line p-3.5">
                <p class="eyebrow text-faint mb-1.5">Pago</p>
                <span class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">${ICON[payment.icon]('w-4 h-4 text-muted')}${esc(payment.label)}</span>
              </div>
              <div class="bg-paper rounded-xl2 border border-line p-3.5">
                <p class="eyebrow text-faint mb-1.5">Fecha</p>
                <p class="text-[13px] font-semibold text-ink">${createdAt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p class="text-[11.5px] text-faint tnum">${createdAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div class="bg-paper rounded-xl2 border border-line p-3.5">
                <p class="eyebrow text-faint mb-1.5">Entrega</p>
                <span class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">${ICON[deliveryIcon]('w-4 h-4 text-muted')}${deliveryLabel}</span>
              </div>
            </div>

            ${order.address ? `<div class="bg-paper rounded-xl2 border border-line p-4 flex items-start gap-3">
              <span class="text-muted mt-0.5">${ICON.map('w-[18px] h-[18px]')}</span>
              <div><p class="eyebrow text-faint mb-1">Dirección de envío</p><p class="text-[13.5px] text-body leading-relaxed">${esc(order.address)}</p></div>
            </div>` : ''}

            <!-- Products -->
            <div class="bg-paper rounded-xl2 border border-line overflow-hidden">
              <div class="px-4 py-3 border-b border-line flex items-center justify-between">
                <p class="font-semibold text-ink text-[14px]">Productos</p>
                <span class="text-[12px] text-muted tnum">${items.length} artículo${items.length !== 1 ? 's' : ''}</span>
              </div>
              <div class="divide-y divide-line">
                ${items.length ? items.map(item => `<div class="flex items-center gap-3 px-4 py-3">
                  <div class="relative w-12 h-12 shrink-0">
                    <div class="w-full h-full rounded-lg bg-canvas border border-line overflow-hidden">
                      ${itemThumb(item) || `<span class="w-full h-full flex items-center justify-center text-muted">${ICON.image('w-4 h-4')}</span>`}
                    </div>
                    <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center tnum">${Number(item?.qty)||0}</span>
                  </div>
                  <div class="min-w-0 flex-1"><p class="text-[13.5px] font-medium text-ink truncate">${esc(item?.name)||'Producto'}</p><p class="text-[11.5px] text-faint">Talla ${esc(item?.size)||'Única'}</p></div>
                  <p class="text-[13px] font-semibold text-ink tnum shrink-0">${formatMoney((item?.price||0) * (item?.qty||0))}</p>
                </div>`).join('') : '<div class="px-4 py-6 text-center text-[13px] text-muted">Sin productos registrados.</div>'}
              </div>
            </div>

            <!-- Envío: lo captura el admin cuando ya sabe cuánto costó -->
            <form data-shipping-form class="bg-paper rounded-xl2 border border-line p-4">
              <label for="order-shipping" class="eyebrow text-faint mb-1.5 block">Costo de envío</label>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint text-[14px]">$</span>
                  <input id="order-shipping" name="shipping" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" value="${shipping != null ? shipping : ''}" class="adm-fld pl-7 tnum" />
                </div>
                <button type="submit" class="adm-btn adm-btn-ink h-10 px-4 text-[13px]">Guardar</button>
              </div>
              <p class="text-[11.5px] text-faint mt-1.5">Vacío = sin envío. Se suma al total de la hoja impresa.</p>
            </form>

            <!-- Total -->
            <div class="bg-paper rounded-xl2 border border-line px-4 py-3">
              <div class="flex items-center justify-between text-[13px] text-muted mb-1"><span>Subtotal</span><span class="tnum">${formatMoney(subtotal)}</span></div>
              ${discount > 0 ? `<div class="flex items-center justify-between text-[13px] text-ok mb-1"><span>Descuento${order.coupon_code ? ` (${esc(order.coupon_code)})` : ''}</span><span class="tnum">−${formatMoney(discount)}</span></div>` : ''}
              ${shipping != null ? `<div class="flex items-center justify-between text-[13px] text-muted mb-1"><span>Envío</span><span class="tnum">${shipping > 0 ? formatMoney(shipping) : 'Gratis'}</span></div>` : ''}
              <div class="flex items-center justify-between"><span class="font-display font-bold text-ink text-[16px]">Total</span><span class="font-display font-extrabold text-ink text-[20px] tnum">${formatMoney(toPay)}</span></div>
            </div>
          </div>`

        content.querySelector('[data-shipping-form]')?.addEventListener('submit', async (e) => {
          e.preventDefault()
          const form = e.currentTarget
          const raw = form.shipping.value.trim()
          const value = raw === '' ? null : Math.round(Number(raw) * 100) / 100
          if (value != null && !(value >= 0 && value < 100000)) { showToast('Escribe un costo de envío válido', 'error'); return }
          const btn = form.querySelector('button[type="submit"]')
          btn.disabled = true
          const { error } = await updateAdminOrderShipping(order.id, value)
          btn.disabled = false
          if (error) { showToast('No se pudo guardar el envío', 'error'); return }
          order.shipping_cost = value
          showToast('Envío guardado', 'success')
          openOrderDetails(order.id)   // repinta totales y la hoja de impresión
        })

        // Al repintar (guardar envío) el drawer ya está abierto: no se bloquea dos veces
        if (drawer.classList.contains('hidden')) {
          drawer.classList.remove('hidden')
          lockScroll()
        }
      }

      // ── KPI Update ──
      const updateKPIs = (orders) => {
        const total = orders.length
        const completedOrders = orders.filter(o => o.status === 'completado')
        const revenue = completedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0)
        const pending = orders.filter(o => o.status === 'pendientedepago').length
        const ticket = completedOrders.length ? revenue / completedOrders.length : 0
        kpis.innerHTML = `
          ${statCard({ eyebrow: 'Total pedidos', value: total.toLocaleString(), icon: 'orders', accent: '#214FC7', foot: 'histórico' })}
          ${statCard({ eyebrow: 'Ingresos confirmados', value: formatMoney(revenue), icon: 'cash', foot: 'pedidos completados' })}
          ${statCard({ eyebrow: 'Pendientes de pago', value: pending.toString(), icon: 'clock', accent: '#C9821A', foot: 'requieren seguimiento' })}
          ${statCard({ eyebrow: 'Ticket promedio', value: formatMoney(ticket), icon: 'trendUp' })}
        `
      }

      // ── Render ──
      const getFiltered = () => {
        const term = searchTerm.toLowerCase()
        return allOrders.filter(o => {
          const matchStatus = statusFilter === 'all' || o.status === statusFilter
          const matchSearch = !term || (o.customer_name || '').toLowerCase().includes(term) || String(o.id).toLowerCase().includes(term)
          return matchStatus && matchSearch
        })
      }

      const renderOrders = (orders) => {
        allOrders = orders
        ordersById = new Map(orders.map(o => [String(o.id), o]))
        updateKPIs(orders)
        renderFiltered()
      }

      const renderFiltered = () => {
        const filtered = getFiltered()

        if (!filtered.length) {
          const msg = allOrders.length ? 'Sin resultados' : 'No hay pedidos'
          tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-16 text-center"><div>${ICON.orders('w-10 h-10 mx-auto mb-3 text-line-strong')}<p class="text-[14px] font-semibold text-body">${msg}</p></div></td></tr>`
          mobileContainer.innerHTML = `<div class="px-5 py-16 text-center">${ICON.orders('w-10 h-10 mx-auto mb-3 text-line-strong')}<p class="text-[14px] font-semibold text-body">${msg}</p></div>`
          footerEl.textContent = `0 pedidos`
          return
        }

        tbody.innerHTML = filtered.map(order => {
          const payment = getPaymentMeta(order.payment_method)
          return `
          <tr class="border-t border-line hover:bg-canvas transition-colors cursor-pointer group" data-row data-id="${order.id}">
            <td class="px-5 py-3.5">
              <p class="text-[13.5px] font-semibold text-ink tnum">#${String(order.id).slice(0,8)}</p>
              <span class="inline-flex items-center gap-1 text-[11.5px] text-muted mt-0.5">${ICON[payment.icon]('w-3.5 h-3.5')}${esc(payment.label)}</span>
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[11px] font-bold shrink-0">${esc(initials(order.customer_name))}</div>
                <div class="min-w-0"><p class="text-[13.5px] font-semibold text-ink truncate">${esc(order.customer_name)}</p><p class="text-[11.5px] text-faint tnum">${esc(order.customer_whatsapp)}</p></div>
              </div>
            </td>
            <td class="px-5 py-3.5"><p class="text-[13px] text-body">${new Date(order.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</p><p class="text-[11.5px] text-faint tnum">${new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p></td>
            <td class="px-5 py-3.5 text-right"><span class="font-bold text-ink text-[14px] tnum">${formatMoney(order.total||0)}</span></td>
            <td class="px-5 py-3.5" data-stop>${statusDropdownHtml(order)}</td>
            <td class="px-5 py-3.5 text-right"><span class="inline-flex items-center gap-1 text-[13px] font-semibold text-muted group-hover:text-brand transition-colors">Ver ${ICON.chevRight('w-4 h-4')}</span></td>
          </tr>`
        }).join('')

        mobileContainer.innerHTML = filtered.map(order => {
          const payment = getPaymentMeta(order.payment_method)
          const deliveryLabel = (order.delivery_method || '').includes('domicilio') ? 'Envío' : 'Tienda'
          return `
          <div class="p-4 active:bg-canvas transition-colors cursor-pointer" data-row data-id="${order.id}">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[12px] font-bold shrink-0">${esc(initials(order.customer_name))}</div>
                <div class="min-w-0"><p class="text-[14px] font-semibold text-ink truncate">${esc(order.customer_name)}</p><p class="text-[11.5px] text-faint tnum">#${String(order.id).slice(0,8)} · ${relTime(order.created_at)}</p></div>
              </div>
              <p class="font-bold text-ink text-[15px] tnum shrink-0">${formatMoney(order.total||0)}</p>
            </div>
            <div class="flex items-center justify-between mt-3">
              <span class="inline-flex items-center gap-1.5 text-[12px] text-muted">${ICON[payment.icon]('w-4 h-4')}${esc(payment.label)} · ${deliveryLabel}</span>
              ${statusPill(order.status)}
            </div>
          </div>`
        }).join('')

        footerEl.textContent = searchTerm || statusFilter !== 'all'
          ? `${filtered.length} de ${allOrders.length} pedidos`
          : `${allOrders.length} pedidos`

        // Update filter button counts + active state
        const counts = { all: allOrders.length, completado: 0, pendientedepago: 0, cancelado: 0 }
        allOrders.forEach(o => { const k = (o.status || '').toLowerCase(); if (counts[k] != null) counts[k]++ })
        filtersContainer.querySelectorAll('[data-filter]').forEach(btn => {
          const f = btn.dataset.filter
          const isActive = f === statusFilter
          btn.className = isActive ? FILTER_CLS_ACTIVE : FILTER_CLS_IDLE
          btn.innerHTML = `${FILTER_LABELS[f] || f}<span class="tnum ${isActive ? 'text-white/55' : 'text-faint'}">${counts[f] ?? 0}</span>`
        })

        attachRowHandlers()
        attachDropdownHandlers()
      }

      const attachRowHandlers = () => {
        root.querySelectorAll('[data-row]').forEach(row => {
          row.addEventListener('click', (e) => {
            if (e.target.closest('[data-stop]')) return
            const id = row.dataset.id
            if (id) openOrderDetails(id)
          })
        })
      }

      const attachDropdownHandlers = () => {
        root.querySelectorAll('[data-status-wrap]').forEach(wrap => {
          const btn = wrap.querySelector('[data-status-btn]')
          const menu = wrap.querySelector('[data-status-menu]')
          if (!btn || !menu) return

          btn.addEventListener('click', (e) => {
            e.stopPropagation()
            root.querySelectorAll('[data-status-menu]').forEach(m => { if (m !== menu) m.classList.add('hidden') })
            menu.classList.toggle('hidden')
          })

          menu.querySelectorAll('[data-set]').forEach(opt => {
            opt.addEventListener('click', async (e) => {
              e.stopPropagation()
              menu.classList.add('hidden')
              const orderId = wrap.dataset.id
              const newStatus = opt.dataset.set
              const order = ordersById.get(String(orderId))
              if (!order || order.status === newStatus) return
              const oldStatus = order.status
              order.status = newStatus
              updateKPIs(allOrders)
              renderFiltered()
              const { error } = await updateAdminOrderStatus(orderId, newStatus)
              if (error) {
                order.status = oldStatus
                updateKPIs(allOrders)
                renderFiltered()
                showToast('Error al actualizar estado', 'error')
                return
              }
              showToast(`Estado actualizado a "${(STATUS_META[newStatus] || {}).label || newStatus}"`, 'success')
            })
          })
        })

      }

      const notifyOnce = (order) => {
        const id = order?.id
        if (!id || notifiedOrderIds.has(id)) return
        notifiedOrderIds.add(id)
        notifyNewOrder(order)
      }

      // ── Close status dropdowns on outside click ──
      const closeStatusMenus = () => root.querySelectorAll('[data-status-menu]').forEach(m => m.classList.add('hidden'))
      document.addEventListener('click', closeStatusMenus)

      // ── Search + Filters ──
      searchInput?.addEventListener('input', (e) => { searchTerm = e.target.value.trim(); renderFiltered() })
      filtersContainer?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-filter]')
        if (!btn) return
        statusFilter = btn.dataset.filter
        renderFiltered()
      })

      // ── Data loading ──
      const loadAndRender = async () => {
        const orders = await getAdminOrders()
        if (isUnmounted) return
        knownOrderIds = new Set(orders.map(o => o.id))
        renderOrders(orders)
      }

      const checkForNewOrders = async () => {
        if (isUnmounted || isCheckingOrders) return
        isCheckingOrders = true
        try {
          const orders = await getAdminOrders()
          if (isUnmounted || !orders.length) return
          const unseen = orders.filter(o => !knownOrderIds.has(o.id))
          if (!unseen.length) return
          unseen.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).forEach(order => { knownOrderIds.add(order.id); notifyOnce(order) })
          renderOrders(orders)
        } catch (err) { if (import.meta.env.DEV) console.warn('checkForNewOrders failed', err) }
        finally { isCheckingOrders = false }
      }

      ;(async () => {
        await loadAndRender()
        if (isUnmounted) return
        if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'default') { Notification.requestPermission().catch(() => {}) }
        if (globalNotifierActive) return

        pollingTimer = window.setInterval(() => { checkForNewOrders().catch(() => {}) }, 5000)

        if (supabase) {
          try {
            channel = supabase
              .channel(`admin-orders-new-${Date.now()}`)
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
                const incoming = payload?.new
                if (!payload || !incoming?.id || isUnmounted) return
                if (knownOrderIds.has(incoming.id)) return
                knownOrderIds.add(incoming.id)
                notifyOnce(incoming)
                await checkForNewOrders()
              })
              .subscribe()
          } catch (err) { if (import.meta.env.DEV) console.warn('Realtime subscription failed', err) }
        }
      })()

      return () => {
        isUnmounted = true
        document.removeEventListener('click', closeStatusMenus)
        if (pollingTimer) { window.clearInterval(pollingTimer); pollingTimer = null }
        if (channel) { supabase?.removeChannel(channel); channel = null }
      }
    }
  }
}
