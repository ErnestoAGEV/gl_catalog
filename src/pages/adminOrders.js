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
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" class="px-6 py-4 font-semibold min-w-[180px]">Cliente</th>
                <th scope="col" class="px-6 py-4 font-semibold min-w-[200px]">Productos</th>
                <th scope="col" class="px-6 py-4 font-semibold min-w-[100px]">Fecha</th>
                <th scope="col" class="px-6 py-4 font-semibold min-w-[200px]">Entrega</th>
                <th scope="col" class="px-6 py-4 font-semibold text-center min-w-[110px]">Pago</th>
                <th scope="col" class="px-6 py-4 font-semibold text-center min-w-[100px]">Total</th>
                <th scope="col" class="px-6 py-4 font-semibold text-center min-w-[130px]">Estado</th>
              </tr>
            </thead>
            <tbody id="orders-tbody" class="divide-y divide-gray-100 dark:divide-gray-800">
               <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-400">
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
      let pollingTimer = null
      let channel = null
      let isUnmounted = false
      let isCheckingOrders = false

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
          tbody.innerHTML = `<tr><td colspan="7" class="px-0 py-0">${emptyState}</td></tr>`
          mobileContainer.innerHTML = emptyState
          return
        }

        // Desktop Table
        tbody.innerHTML = orders.map(order => {
          let items = []
          try {
             items = typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : (order.cart_items || [])
          } catch(e) { console.error('Error parsing items for order', order.id) }

          const payment = getPaymentMeta(order.payment_method)

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
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${payment.className}">
                ${payment.label}
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
            </div>
          </div>
        `}).join('')

        attachStatusHandlers()
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
                if (!incoming?.id || isUnmounted) return
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
