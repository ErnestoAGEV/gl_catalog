import { getAdminOrders, updateAdminOrderStatus } from '../app/store.js'
import { formatMoney } from '../app/format.js'
import { supabase } from '../app/supabase.js'
import { showToast } from '../app/toast.js'

function getPaymentMeta(paymentMethod) {
  const raw = (paymentMethod || '').toString().trim()
  const normalized = raw.toLowerCase()

  if (!normalized) {
    return {
      label: 'Sin definir',
      className: 'bg-gray-100 text-gray-700',
    }
  }

  if (normalized.includes('transfer')) {
    return {
      label: raw,
      className: 'bg-blue-100 text-blue-800',
    }
  }

  if (normalized.includes('efectivo') || normalized.includes('recoger')) {
    return {
      label: raw,
      className: 'bg-emerald-100 text-emerald-800',
    }
  }

  if (normalized === 'whatsapp') {
    return {
      label: 'WhatsApp',
      className: 'bg-green-100 text-green-800',
    }
  }

  return {
    label: raw,
    className: 'bg-indigo-100 text-indigo-800',
  }
}

function notifyNewOrder(order) {
  const customer = order?.customer_name || 'Cliente'
  const total = Number(order?.total || 0)

  playNewOrderSound()
  showToast(`Nuevo pedido de ${customer} (${formatMoney(total)})`, 'success', 6000)

  if (typeof window === 'undefined' || typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  try {
    const notification = new Notification('Nuevo pedido recibido', {
      body: `${customer} - ${formatMoney(total)}`,
    })

    notification.onclick = () => {
      window.focus()
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('Browser notification failed', err)
  }
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

    window.setTimeout(() => {
      ctx.close().catch(() => {})
    }, 800)
  } catch (err) {
    if (import.meta.env.DEV) console.warn('Audio notification failed', err)
  }
}

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
        
        <!-- Desktop Table View -->
        <div class="hidden md:block">
          <table class="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" class="px-6 py-4 font-semibold">Pedido</th>
                <th scope="col" class="px-6 py-4 font-semibold">Cliente</th>
                <th scope="col" class="px-6 py-4 font-semibold">Fecha</th>
                <th scope="col" class="px-6 py-4 font-semibold text-center">Total</th>
                <th scope="col" class="px-6 py-4 font-semibold text-center">Estado</th>
                <th scope="col" class="px-6 py-4 font-semibold text-center">Detalle</th>
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

        <!-- Mobile Card View -->
        <div id="orders-mobile" class="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          <!-- Cards rendered here -->
        </div>

      </div>
    </div>
  `

  return { 
    title: 'Órdenes | G&L Admin', 
    html,
    onMount(root) {
      const tbody = root.querySelector('#orders-tbody')
      const mobileContainer = root.querySelector('#orders-mobile')
      if (!tbody || !mobileContainer) return

      const globalNotifierActive = typeof window !== 'undefined' && window.__glGlobalOrderNotifierActive === true
      let knownOrderIds = new Set()
      const notifiedOrderIds = new Set()
      let ordersById = new Map()
      let pollingTimer = null
      let channel = null
      let isUnmounted = false
      let isCheckingOrders = false

      const ensureOrderDetailsModal = () => {
        let modal = document.getElementById('order-details-modal')
        if (modal) return modal

        modal = document.createElement('div')
        modal.id = 'order-details-modal'
        modal.className = 'fixed inset-0 layer-modal hidden items-center justify-center bg-black/60 p-4'
        modal.innerHTML = `
          <div class="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h3 class="text-base font-bold text-gray-900 dark:text-white">Detalle de orden</h3>
              <button type="button" id="order-details-close" class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Cerrar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div id="order-details-content" class="p-5"></div>
          </div>
        `

        document.body.appendChild(modal)

        const closeModal = () => {
          modal.classList.add('hidden')
          modal.classList.remove('flex')
          document.body.style.overflow = ''
        }

        const normalizePhone = (value) => (value || '').toString().replace(/\D+/g, '')

        const copyToClipboard = async (text) => {
          const value = (text || '').toString().trim()
          if (!value) return false

          try {
            if (navigator?.clipboard?.writeText) {
              await navigator.clipboard.writeText(value)
              return true
            }
          } catch {
            // Fallback below.
          }

          try {
            const ta = document.createElement('textarea')
            ta.value = value
            ta.setAttribute('readonly', '')
            ta.style.position = 'absolute'
            ta.style.left = '-9999px'
            document.body.appendChild(ta)
            ta.select()
            const ok = document.execCommand('copy')
            document.body.removeChild(ta)
            return ok
          } catch {
            return false
          }
        }

        modal.querySelector('#order-details-close')?.addEventListener('click', closeModal)
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal()
        })

        modal.addEventListener('click', async (e) => {
          const btn = e.target?.closest?.('[data-order-action]')
          if (!btn) return

          const action = btn.getAttribute('data-order-action')
          if (!action) return

          if (action === 'copy-address') {
            const encodedAddress = btn.getAttribute('data-address') || ''
            const address = decodeURIComponent(encodedAddress)
            const ok = await copyToClipboard(address)
            showToast(ok ? 'Dirección copiada' : 'No se pudo copiar la dirección', ok ? 'success' : 'error')
            return
          }

          if (action === 'copy-summary') {
            const encodedSummary = btn.getAttribute('data-summary') || ''
            const summary = decodeURIComponent(encodedSummary)
            const ok = await copyToClipboard(summary)
            showToast(ok ? 'Resumen copiado' : 'No se pudo copiar el resumen', ok ? 'success' : 'error')
            return
          }

          if (action === 'open-whatsapp') {
            const encodedPhone = btn.getAttribute('data-phone') || ''
            const phoneRaw = decodeURIComponent(encodedPhone)
            const phone = normalizePhone(phoneRaw)
            if (!phone) {
              showToast('No hay teléfono válido para WhatsApp', 'error')
              return
            }
            window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer')
            return
          }

          if (action === 'print-order') {
            const encoded = btn.getAttribute('data-print') || ''
            if (!encoded) return

            let data = null
            try {
              data = JSON.parse(decodeURIComponent(encoded))
            } catch {
              showToast('No se pudo preparar la impresión', 'error')
              return
            }

            const printWindow = window.open('', '_blank', 'width=900,height=700')
            if (!printWindow) {
              showToast('El navegador bloqueó la ventana de impresión', 'error')
              return
            }

            const itemsHtml = (data.items || []).map(item => `
              <tr>
                <td>${item.name || 'Producto'}</td>
                <td>${item.size || 'Única'}</td>
                <td>${item.qty || 0}</td>
                <td>${formatMoney(item.price || 0)}</td>
              </tr>
            `).join('')

            printWindow.document.write(`
              <html>
                <head>
                  <title>Orden #${(data.id || '').toString().slice(0, 8)}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                    h1 { margin: 0 0 8px; }
                    .meta { margin: 4px 0; color: #374151; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 14px; }
                    th { background: #f9fafb; }
                  </style>
                </head>
                <body>
                  <h1>Detalle de orden</h1>
                  <p class="meta"><strong>Pedido:</strong> #${(data.id || '').toString().slice(0, 8)}</p>
                  <p class="meta"><strong>Cliente:</strong> ${data.customerName || 'Sin nombre'}</p>
                  <p class="meta"><strong>WhatsApp:</strong> ${data.customerWhatsapp || 'Sin teléfono'}</p>
                  <p class="meta"><strong>Fecha:</strong> ${data.when || 'Sin fecha'}</p>
                  <p class="meta"><strong>Entrega:</strong> ${data.deliveryMethod || 'Sin método'}</p>
                  <p class="meta"><strong>Dirección:</strong> ${data.address || 'Sin dirección'}</p>
                  <p class="meta"><strong>Pago:</strong> ${data.paymentLabel || 'Sin definir'}</p>
                  <p class="meta"><strong>Total:</strong> ${formatMoney(data.total || 0)}</p>
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Talla</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml || '<tr><td colspan="4">Sin productos</td></tr>'}
                    </tbody>
                  </table>
                </body>
              </html>
            `)
            printWindow.document.close()
            printWindow.focus()
            printWindow.print()
          }
        })

        return modal
      }

      const openOrderDetails = (orderId) => {
        const modal = ensureOrderDetailsModal()
        const content = modal.querySelector('#order-details-content')
        const order = ordersById.get(String(orderId))
        if (!content || !order) return

        let items = []
        try {
          items = typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : (order.cart_items || [])
        } catch {
          items = []
        }

        const payment = getPaymentMeta(order.payment_method)
        const createdAt = new Date(order.created_at)
        const when = Number.isNaN(createdAt.getTime())
          ? 'Sin fecha'
          : `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        const printPayload = encodeURIComponent(JSON.stringify({
          id: order.id,
          customerName: order.customer_name,
          customerWhatsapp: order.customer_whatsapp,
          when,
          deliveryMethod: order.delivery_method,
          address: order.address,
          paymentLabel: payment.label,
          total: Number(order.total) || 0,
          items,
        }))
        const summaryLines = [
          `Pedido #${String(order.id).slice(0, 8)}`,
          `Cliente: ${order.customer_name || 'Sin nombre'}`,
          `WhatsApp: ${order.customer_whatsapp || 'Sin teléfono'}`,
          `Fecha: ${when}`,
          `Entrega: ${order.delivery_method || 'Sin método'}`,
          `Dirección: ${order.address || 'Sin dirección'}`,
          `Pago: ${payment.label}`,
          'Productos:',
          ...(items.length
            ? items.map(item => `- ${item?.qty || 0}x ${item?.name || 'Producto'} (${item?.size || 'Única'}) · ${formatMoney(item?.price || 0)}`)
            : ['- Sin productos registrados']),
          `Total: ${formatMoney(order.total || 0)}`,
        ]
        const encodedSummary = encodeURIComponent(summaryLines.join('\n'))

        content.innerHTML = `
          <div class="space-y-5">
            <div class="flex flex-wrap gap-2">
              <button type="button" data-order-action="open-whatsapp" data-phone="${encodeURIComponent(order.customer_whatsapp || '')}" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a2 2 0 011.948 1.553l.638 2.87a2 2 0 01-.545 1.86l-1.27 1.27a16 16 0 006.364 6.364l1.27-1.27a2 2 0 011.86-.545l2.87.638A2 2 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                WhatsApp
              </button>
              <button type="button" data-order-action="copy-address" data-address="${encodeURIComponent(order.address || '')}" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16h8M8 12h8m-8-4h8m2 12H6a2 2 0 01-2-2V6a2 2 0 012-2h8l6 6v8a2 2 0 01-2 2z"/></svg>
                Copiar dirección
              </button>
              <button type="button" data-order-action="copy-summary" data-summary="${encodedSummary}" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-8 4h6M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/></svg>
                Copiar resumen
              </button>
              <button type="button" data-order-action="print-order" data-print="${printPayload}" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9V4h12v5M6 14H4a2 2 0 00-2 2v4h4m0 0h12m-12 0v-4h12v4m0 0h4v-4a2 2 0 00-2-2h-2"/></svg>
                Imprimir
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <p class="text-xs uppercase tracking-wide text-gray-500">Cliente</p>
                <p class="mt-1 font-semibold text-gray-900 dark:text-white">${order.customer_name || 'Sin nombre'}</p>
                <p class="text-sm text-brand mt-1">${order.customer_whatsapp || 'Sin teléfono'}</p>
              </div>
              <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <p class="text-xs uppercase tracking-wide text-gray-500">Pedido</p>
                <p class="mt-1 font-semibold text-gray-900 dark:text-white">#${String(order.id).slice(0, 8)}</p>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${when}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <p class="text-xs uppercase tracking-wide text-gray-500">Total</p>
                <p class="mt-1 font-bold text-gray-900 dark:text-white">${formatMoney(order.total || 0)}</p>
              </div>
              <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <p class="text-xs uppercase tracking-wide text-gray-500">Pago</p>
                <span class="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${payment.className}">${payment.label}</span>
              </div>
              <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <p class="text-xs uppercase tracking-wide text-gray-500">Estado</p>
                <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">${(order.status || 'sin estado').toString()}</p>
              </div>
            </div>

            <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs uppercase tracking-wide text-gray-500">Entrega</p>
              <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">${order.delivery_method || 'Sin método'}</p>
              ${order.address ? `<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">${order.address}</p>` : '<p class="mt-1 text-sm text-gray-500">Sin dirección</p>'}
            </div>

            <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs uppercase tracking-wide text-gray-500 mb-2">Productos</p>
              <div class="space-y-2">
                ${items.length
                  ? items.map(item => `
                    <div class="flex items-start justify-between gap-3 text-sm">
                      <div class="min-w-0">
                        <p class="font-medium text-gray-900 dark:text-white truncate">${item?.name || 'Producto'}</p>
                        <p class="text-xs text-gray-500">Talla: ${item?.size || 'Única'}</p>
                      </div>
                      <div class="text-right flex-shrink-0">
                        <p class="font-semibold text-gray-900 dark:text-white">${item?.qty || 0}x</p>
                        <p class="text-xs text-gray-500">${formatMoney(item?.price || 0)}</p>
                      </div>
                    </div>
                  `).join('')
                  : '<p class="text-sm text-gray-500">Sin productos registrados en la orden.</p>'
                }
              </div>
            </div>
          </div>
        `

        modal.classList.remove('hidden')
        modal.classList.add('flex')
        document.body.style.overflow = 'hidden'
      }

      const attachDetailHandlers = () => {
        root.querySelectorAll('[data-order-detail]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-order-detail')
            if (!id) return
            openOrderDetails(id)
          })
        })
      }

      const notifyOnce = (order) => {
        const id = order?.id
        if (!id) return
        if (notifiedOrderIds.has(id)) return
        notifiedOrderIds.add(id)
        notifyNewOrder(order)
      }

      const attachStatusHandlers = () => {
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

      const renderOrders = (orders) => {
        if (!orders.length) {
          const emptyState = `
            <div class="px-6 py-12 text-center text-gray-500">
              <div class="w-16 h-16 mx-auto bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
              Aún no hay pedidos registrados.
            </div>
          `
          tbody.innerHTML = `<tr><td colspan="6" class="px-0 py-0">${emptyState}</td></tr>`
          mobileContainer.innerHTML = emptyState
          return
        }

        ordersById = new Map(orders.map(order => [String(order.id), order]))

        // Desktop Table
        tbody.innerHTML = orders.map(order => {
          let items = []
          try {
             items = typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : (order.cart_items || [])
          } catch(e) { console.error('Error parsing items for order', order.id) }

          const payment = getPaymentMeta(order.payment_method)

          return `
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="font-semibold text-gray-900 dark:text-white">#${String(order.id).slice(0, 8)}</div>
              <div class="text-xs text-gray-500 mt-1">${payment.label}</div>
            </td>
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900 dark:text-white">${order.customer_name}</div>
              <div class="text-xs text-brand mt-1">${order.customer_whatsapp}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
              <div>${new Date(order.created_at).toLocaleDateString()}</div>
              <div>${new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
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
            <td class="px-6 py-4 text-center">
              <button type="button" data-order-detail="${order.id}" class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Ver detalle
              </button>
            </td>
          </tr>
        `}).join('')

        // Mobile Cards
        mobileContainer.innerHTML = orders.map(order => {
          let items = []
          try {
             items = typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : (order.cart_items || [])
          } catch(e) { console.error('Error parsing items for order', order.id) }

          const payment = getPaymentMeta(order.payment_method)

          return `
          <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div class="space-y-3">
              <div>
                <p class="text-xs text-gray-500 font-semibold">Cliente</p>
                <p class="font-medium text-gray-900 dark:text-white">${order.customer_name}</p>
                <p class="text-xs text-brand">${order.customer_whatsapp}</p>
              </div>
              
              <div>
                <p class="text-xs text-gray-500 font-semibold">Productos</p>
                <div class="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                  ${items.map(item => `
                     <div class="truncate" title="${item.name} (${item.size || 'Unica'})">
                       <span class="font-semibold">${item.qty}x</span> ${item.name}
                       ${item.size ? `<span class="text-gray-400">(${item.size})</span>` : ''}
                     </div>
                  `).join('')}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-gray-500 font-semibold">Fecha</p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">${new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-semibold">Total</p>
                  <p class="font-semibold text-gray-900 dark:text-white">${formatMoney(order.total || 0)}</p>
                </div>
              </div>

              <div>
                <p class="text-xs text-gray-500 font-semibold">Entrega</p>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  ${order.delivery_method === 'Envío a domicilio' ? '🚚 Envío a Domicilio' : '🏪 Recoge en Tienda'}
                </p>
                ${order.delivery_method === 'Envío a domicilio' && order.address ? `
                  <p class="text-xs text-gray-500 mt-1 truncate">${order.address}</p>
                ` : ''}
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-gray-500 font-semibold">Pago</p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${payment.className}">
                    ${payment.label}
                  </span>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-semibold">Estado</p>
                  <select data-id="${order.id}" data-original="${order.status}" class="status-select outline-none bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                     <option value="pendientedepago" ${order.status === 'pendientedepago' ? 'selected' : ''}>Pendiente</option>
                     <option value="completado" ${order.status === 'completado' ? 'selected' : ''}>Completado</option>
                     <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                  </select>
                </div>
              </div>

              <button type="button" data-order-detail="${order.id}" class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Ver detalle completo
              </button>
            </div>
          </div>
        `}).join('')

        attachStatusHandlers()
        attachDetailHandlers()
      }

      const loadAndRender = async () => {
        const orders = await getAdminOrders()
        if (isUnmounted) return
        knownOrderIds = new Set(orders.map(order => order.id))
        renderOrders(orders)
      }

      const checkForNewOrders = async () => {
        if (isUnmounted || isCheckingOrders) return
        isCheckingOrders = true

        try {
          const orders = await getAdminOrders()
          if (isUnmounted || !orders.length) return

          const unseen = orders.filter(order => !knownOrderIds.has(order.id))
          if (!unseen.length) return

          // Show notifications in chronological order for a natural sequence.
          unseen
            .slice()
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .forEach(order => {
              knownOrderIds.add(order.id)
              notifyOnce(order)
            })

          renderOrders(orders)
        } catch (err) {
          if (import.meta.env.DEV) console.warn('checkForNewOrders failed', err)
        } finally {
          isCheckingOrders = false
        }
      }

      ;(async () => {
        await loadAndRender()
        if (isUnmounted) return

        if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {})
        }

        if (globalNotifierActive) return

        // Fallback polling always runs, even if realtime fails.
        pollingTimer = window.setInterval(() => {
          checkForNewOrders().catch(() => {})
        }, 5000)

        if (supabase) {
          try {
            channel = supabase
              .channel(`admin-orders-new-${Date.now()}`)
              .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
              }, async (payload) => {
                const incoming = payload?.new
                if (!payload || !incoming?.id || isUnmounted) return
                if (knownOrderIds.has(incoming.id)) return

                knownOrderIds.add(incoming.id)
                notifyOnce(incoming)
                await checkForNewOrders()
              })
              .subscribe()
          } catch (err) {
            if (import.meta.env.DEV) console.warn('Realtime subscription failed', err)
          }
        }
      })()

      return () => {
        isUnmounted = true
        if (pollingTimer) {
          window.clearInterval(pollingTimer)
          pollingTimer = null
        }
        if (channel) {
          supabase?.removeChannel(channel)
          channel = null
        }
      }
    }
  }
}
