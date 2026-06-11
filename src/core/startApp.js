import { getRoute, onRouteChange, startRouter, navigate, scrollPositions } from './router.js'
import { getState, isAdminAuthed, loadProducts, loadCategories, subscribe, toggleTheme, getTheme, setSearchQuery, initAdminSession, getAdminOrders } from '../store/index.js'
import { renderRoute } from './views.js'
import { showToast } from '../utils/toast.js'
import { supabase } from './supabase.js'
import { formatMoney } from '../utils/format.js'
import { applySeo } from './seo.js'
import { addNotification, getNotifications, getUnreadCount, markAllRead, subscribeNotifications } from '../utils/notifications.js'

function playOrderAlertSound() {
  if (typeof window === 'undefined') return

  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return

  try {
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const beep = (startAt, frequency, duration, gainValue) => {
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

    beep(now, 880, 0.16, 0.1)
    beep(now + 0.2, 1046.5, 0.2, 0.08)

    window.setTimeout(() => {
      ctx.close().catch(() => {})
    }, 800)
  } catch (_err) {
    // Silent fail: browser policies may block audio until user interaction.
  }
}

function notifyIncomingOrder(order) {
  const customer = order?.customer_name || 'Cliente'
  const total = Number(order?.total || 0)

  addNotification({
    type: 'order',
    title: 'Nuevo pedido',
    body: `${customer} — ${formatMoney(total)}`,
    orderId: order?.id,
  })

  playOrderAlertSound()
  showToast(`Nuevo pedido de ${customer} (${formatMoney(total)})`, 'success', 6000)

  if (typeof window === 'undefined' || typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  try {
    const notification = new Notification('Nuevo pedido recibido', {
      body: `${customer} - ${formatMoney(total)}`,
    })
    notification.onclick = () => window.focus()
  } catch (_err) {
    // Ignore browser notification errors.
  }
}

export async function startApp(mountEl) {
  // Restore admin session from Supabase BEFORE first render so route guards work
  await initAdminSession()

  // Listen for Supabase errors dispatched by store.js — show elegant toast instead of alert()
  window.addEventListener('gl:error', (e) => {
    const msg = e.detail?.message || 'Ocurrió un error inesperado.'
    showToast(msg, 'error')
  })

  loadProducts()
  loadCategories()

  // Apply initial theme
  const applyTheme = () => {
    const theme = getTheme()
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.body.classList.toggle('bg-black', theme === 'dark')
    document.body.classList.toggle('bg-white', theme === 'light')
  }
  applyTheme()

  let stopAdminOrderNotifier = null
  const cachedViews = new Map() // { el, cleanup, seoConfig }
  let currentNonCachedView = null

  const startAdminOrderNotifier = () => {
    if (stopAdminOrderNotifier) return

    let stopped = false
    let pollingTimer = null
    let checking = false
    let channel = null
    const knownOrderIds = new Set()
    const notifiedOrderIds = new Set()
    const asKey = (value) => (value === null || value === undefined ? '' : String(value))

    window.__glGlobalOrderNotifierActive = true

    const notifyOnce = (order) => {
      const key = asKey(order?.id)
      if (!key || notifiedOrderIds.has(key)) return
      notifiedOrderIds.add(key)
      notifyIncomingOrder(order)
    }

    const bootstrap = async () => {
      const orders = await getAdminOrders()
      if (stopped || !orders.length) return
      orders.forEach(order => {
        const key = asKey(order?.id)
        if (key) knownOrderIds.add(key)
      })
    }

    const checkForNewOrders = async () => {
      if (stopped || checking) return
      checking = true
      try {
        const orders = await getAdminOrders()
        if (stopped || !orders.length) return

        const unseen = orders.filter(order => !knownOrderIds.has(asKey(order?.id)))
        if (!unseen.length) return

        unseen
          .slice()
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .forEach(order => {
            const key = asKey(order?.id)
            if (!key) return
            knownOrderIds.add(key)
            notifyOnce(order)
          })
      } catch (_err) {
        // Silent fallback: next polling cycle retries automatically.
      } finally {
        checking = false
      }
    }

    ;(async () => {
      await bootstrap().catch(() => {})
      if (stopped) return

      if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }

      pollingTimer = window.setInterval(() => {
        checkForNewOrders().catch(() => {})
      }, 5000)

      if (supabase) {
        try {
          channel = supabase
            .channel(`global-admin-orders-${Date.now()}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'orders',
            }, async (payload) => {
              if (stopped || !payload) return
              const incoming = payload?.new
              const key = asKey(incoming?.id)
              if (!key || knownOrderIds.has(key)) return
              knownOrderIds.add(key)
              notifyOnce(incoming)
            })
            .subscribe()
        } catch (_err) {
          // Polling keeps notifier alive if realtime cannot subscribe.
        }
      }
    })()

    stopAdminOrderNotifier = () => {
      stopped = true
      window.__glGlobalOrderNotifierActive = false
      if (pollingTimer) {
        window.clearInterval(pollingTimer)
        pollingTimer = null
      }
      if (channel) {
        supabase?.removeChannel(channel)
        channel = null
      }
      stopAdminOrderNotifier = null
    }
  }

  const syncAdminOrderNotifier = (path, authed) => {
    const inAdminArea = authed && path.startsWith('/admin') && path !== '/admin/login'
    if (inAdminArea) {
      startAdminOrderNotifier()
      return
    }

    if (stopAdminOrderNotifier) {
      stopAdminOrderNotifier()
    }
  }

  let renderPromise = Promise.resolve()

  const render = async (path, options = {}) => {
    const currentPromise = renderPromise
    let resolveNext
    renderPromise = new Promise(r => { resolveNext = r })
    await currentPromise

    try {
      await _render(path, options)
    } finally {
      resolveNext()
    }
  }

  const _render = async (path, options = {}) => {
    const { forceRebuild = false } = options

    // Clear scroll lock on real navigation (not in-page re-renders)
    if (!forceRebuild) {
      window.__glScrollLockUntil = 0
      // Pages that should always start at top on fresh navigation
      if (path === '/cart' || path === '/checkout' || path === '/checkout/success') {
        scrollPositions.delete(path)
      }
    }

    // ── Always reset body scroll lock on navigation ──
    document.body.style.overflow = ''

    // Remove orphaned overlays that live outside #app and could block
    // interaction on the new page.
    document.getElementById('fs-viewer')?.remove()          // fullscreen image viewer
    document.getElementById('order-details-modal')?.remove() // admin order detail modal

    const cacheKey = path === '/' ? '/' : (path.startsWith('/catalog') || path.startsWith('/categoria/') ? '/catalog' : null)

    // Capture the saved scroll position for this route BEFORE rendering
    let savedScroll = scrollPositions.get(path) ?? null

    const authed = isAdminAuthed()

    if (authed && path === '/admin/login') {
      navigate('/admin/products')
      return
    }

    if (!authed && path.startsWith('/admin') && path !== '/admin/login') {
      navigate('/admin/login')
      return
    }

    syncAdminOrderNotifier(path, authed)

    // ── Save admin sidebar nav scroll before destroying views ──
    const isAdminNav = path.startsWith('/admin') && path !== '/admin/login'
    let sidebarNavScroll = 0
    if (isAdminNav) {
      document.querySelectorAll('aside nav').forEach(nav => {
        if (nav.scrollTop > 0) sidebarNavScroll = nav.scrollTop
      })
    }

    // Hide all cached views
    cachedViews.forEach(v => { v.el.style.display = 'none' })
    if (currentNonCachedView) {
      currentNonCachedView.el.style.display = 'none'
    }

    // Check if the catalog needs to be rebuilt (e.g. navigating from home category cards)
    if (window.__glForceCatalogRebuild && cacheKey === '/catalog') {
      delete window.__glForceCatalogRebuild
      // Clear any saved scroll so the page starts at the top
      scrollPositions.delete(path)
      savedScroll = null
      if (cachedViews.has(cacheKey)) {
        const oldView = cachedViews.get(cacheKey)
        oldView.cleanup?.()
        oldView.el.remove()
        cachedViews.delete(cacheKey)
      }
    }

    if (cacheKey && cachedViews.has(cacheKey) && !forceRebuild) {
      // Restore from cache
      const view = cachedViews.get(cacheKey)
      view.el.style.display = ''
      applySeo(view.seoConfig)

      // Skip scroll reset if a data-scroll-to navigation is in progress
      if (window.__glScrollLockUntil && Date.now() < window.__glScrollLockUntil) {
        // noop — router will handle the scroll
      } else if (savedScroll === null) {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      } else {
        scrollPositions.delete(path)
        const applyScroll = () => {
          window.scrollTo({ top: savedScroll, behavior: 'instant' })
          document.documentElement.scrollTop = savedScroll
          document.body.scrollTop = savedScroll
        }
        requestAnimationFrame(() => {
          applyScroll()
          setTimeout(applyScroll, 50)
          setTimeout(applyScroll, 150)
          setTimeout(applyScroll, 400)
        })
      }

      setupGlobalHandlers()
      return
    }

    const { title, seo, html, onMount } = await renderRoute(path, getState())
    const seoConfig = {
      title: seo?.title || title,
      description: seo?.description,
      canonicalPath: seo?.canonicalPath || path.split('?')[0],
      robots: seo?.robots,
    }
    applySeo(seoConfig)

    if (cacheKey && forceRebuild && cachedViews.has(cacheKey)) {
       // Cleanup old cached version
       const oldView = cachedViews.get(cacheKey)
       oldView.cleanup?.()
       oldView.el.remove()
       cachedViews.delete(cacheKey)
    }

    // Create a container for this page route to prevent innerHTML destroying others
    const pageContainer = document.createElement('div')
    pageContainer.className = 'page-route-container'
    pageContainer.innerHTML = html
    mountEl.appendChild(pageContainer)

    const cleanup = onMount?.(pageContainer)

    // ── Restore admin sidebar nav scroll ──
    if (isAdminNav && sidebarNavScroll > 0) {
      requestAnimationFrame(() => {
        pageContainer.querySelectorAll('aside nav').forEach(nav => {
          nav.scrollTop = sidebarNavScroll
        })
      })
    }

    if (cacheKey) {
      cachedViews.set(cacheKey, { el: pageContainer, cleanup, seoConfig })
    } else {
      if (currentNonCachedView && !forceRebuild) {
         currentNonCachedView.cleanup?.()
         currentNonCachedView.el.remove()
      }
      if (forceRebuild && currentNonCachedView) {
         currentNonCachedView.cleanup?.()
         currentNonCachedView.el.remove()
      }
      currentNonCachedView = { el: pageContainer, cleanup }
    }

    // Handle pending scroll-to OR default scroll behavior
    // Skip scroll reset if a data-scroll-to navigation is in progress
    if (window.__glScrollLockUntil && Date.now() < window.__glScrollLockUntil) {
      // noop — router will handle the scroll
    } else if (savedScroll === null) {
      // For forward navigation: scroll to top immediately
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    } else {
      // Restoring: remove from in-memory map
      scrollPositions.delete(path)
      // For non-catalog pages apply saved scroll after DOM is painted
      if (!path.startsWith('/catalog') && !path.startsWith('/categoria/')) {
        const applyScroll = () => {
          window.scrollTo({ top: savedScroll, behavior: 'instant' })
          document.documentElement.scrollTop = savedScroll
          document.body.scrollTop = savedScroll
        }
        requestAnimationFrame(() => {
          applyScroll()
          setTimeout(applyScroll, 50)
          setTimeout(applyScroll, 150)
          setTimeout(applyScroll, 400)
        })
      }
    }

    // Setup global event listeners after render
    setupGlobalHandlers()
  }

  const setupGlobalHandlers = () => {
    // Theme toggle — avoid duplicates via data attribute
    const themeToggle = document.getElementById('theme-toggle')
    if (themeToggle && !themeToggle.dataset.glBound) {
      themeToggle.dataset.glBound = '1'
      themeToggle.addEventListener('click', () => {
        toggleTheme()
        applyTheme()
        render(getRoute())
      })
    }

    // Global search — avoid duplicates via data attribute
    const searchInput = document.getElementById('global-search')
    if (searchInput && !searchInput.dataset.glBound) {
      searchInput.dataset.glBound = '1'
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim()
          setSearchQuery(query)
          navigate('/catalog')
        }
      })
    }

    // ── Bell notification panel ──
    const bellBtn = document.getElementById('admin-bell')
    const bellPanel = document.getElementById('admin-bell-panel')
    const bellBadge = document.getElementById('admin-bell-badge')
    const bellList = document.getElementById('admin-bell-list')
    const bellReadAll = document.getElementById('admin-bell-read-all')

    if (bellBtn && !bellBtn.dataset.glBound) {
      bellBtn.dataset.glBound = '1'

      const updateBellBadge = () => {
        const count = getUnreadCount()
        if (!bellBadge) return
        if (count > 0) {
          bellBadge.classList.remove('hidden')
          // Upgrade to numbered badge when count > 0
          bellBadge.className = 'absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white ring-2 ring-paper'
          bellBadge.textContent = count > 9 ? '9+' : count
        } else {
          bellBadge.classList.add('hidden')
          bellBadge.textContent = ''
        }
      }

      const timeAgo = (date) => {
        const diff = (Date.now() - new Date(date).getTime()) / 1000
        if (diff < 60) return 'Ahora'
        if (diff < 3600) return `${Math.floor(diff / 60)}m`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`
        return `${Math.floor(diff / 86400)}d`
      }

      const renderBellList = () => {
        if (!bellList) return
        const notifs = getNotifications()
        if (!notifs.length) {
          bellList.innerHTML = `
            <div class="px-5 py-10 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 mx-auto mb-2 text-line-strong"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
              <p class="text-[13px] font-semibold text-body">Sin notificaciones</p>
              <p class="text-[12px] text-faint mt-0.5">Los nuevos pedidos aparecerán aquí</p>
            </div>`
          return
        }

        bellList.innerHTML = notifs.map(n => `
          <div class="flex items-start gap-3 px-4 py-3 border-b border-line last:border-0 hover:bg-canvas transition-colors ${n.read ? 'opacity-60' : ''}" ${n.orderId ? `data-bell-order="${n.orderId}" style="cursor:pointer"` : ''}>
            <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${n.read ? 'bg-line text-muted' : 'bg-brand-tint text-brand'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4H6Z"/><path d="M4 6h16"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-[13px] font-semibold text-ink">${n.title}</span>
                ${!n.read ? '<span class="w-1.5 h-1.5 rounded-full bg-brand shrink-0"></span>' : ''}
              </div>
              <p class="text-[12.5px] text-muted mt-0.5 truncate">${n.body}</p>
            </div>
            <span class="text-[11px] text-faint shrink-0 tnum mt-0.5">${timeAgo(n.time)}</span>
          </div>
        `).join('')

        // Clicking a notification navigates to orders
        bellList.querySelectorAll('[data-bell-order]').forEach(el => {
          el.addEventListener('click', () => {
            bellPanel.classList.add('hidden')
            navigate('/admin/orders')
          })
        })
      }

      // Toggle panel on click
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        const isOpen = !bellPanel.classList.contains('hidden')
        if (isOpen) {
          bellPanel.classList.add('hidden')
        } else {
          renderBellList()
          bellPanel.classList.remove('hidden')
        }
      })

      // Close panel on outside click
      const closeBellPanel = (e) => {
        if (bellPanel && !bellPanel.classList.contains('hidden') && !bellPanel.contains(e.target) && !bellBtn.contains(e.target)) {
          bellPanel.classList.add('hidden')
        }
      }
      document.addEventListener('click', closeBellPanel)
      // Store reference for cleanup
      bellBtn._glCleanup = () => document.removeEventListener('click', closeBellPanel)

      // Mark all read
      bellReadAll?.addEventListener('click', () => {
        markAllRead()
        renderBellList()
        updateBellBadge()
      })

      // Subscribe to notification changes for badge updates
      subscribeNotifications(() => {
        updateBellBadge()
        // If panel is open, re-render it
        if (bellPanel && !bellPanel.classList.contains('hidden')) {
          renderBellList()
        }
      })

      // Initial badge state
      updateBellBadge()
    }

    // Navigation custom event listener (for coupon apply/remove)
    if (!window.__glNavigationListenerAdded) {
      window.__glNavigationListenerAdded = true
      window.addEventListener('navigate', () => render(getRoute()))
    }
  }

  const stopRouteListener = onRouteChange(render)
  const stopRouter = startRouter()

  // startRouter() already calls notify() which triggers render via onRouteChange.
  // No extra render(getRoute()) needed — avoids double render on startup.

  // ─── Smart re-render: only re-render a page when its relevant state slice changes ───
  // Catalog manages its own updates via its own subscribe, so we skip it here.
  const routeRelevantKeys = {
    '/':              (s) => `${s.products.length}|${s.isLoading}|${s.products.filter(p => p.badge !== 'Borrador').length}`,
    '/producto':      (s) => `${s.products.length}|${s.isLoading}`,
    '/cart':          (s) => `${JSON.stringify(s.cart)}|${JSON.stringify(s.coupon)}|${s.products.length}`,
    '/wishlist':      (s) => JSON.stringify(s.wishlist),
    '/checkout':      (s) => `${JSON.stringify(s.cart)}|${JSON.stringify(s.coupon)}|${s.products.length}`,
    '/admin/products':(s) => JSON.stringify(s.products),
  }

  let prevSignatures = {}

  const unsub = subscribe((state) => {
    // 1. Global badge update — always runs, no full re-render
    const count = state.cart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
    document.querySelectorAll('a[href="/cart"]').forEach(link => {
      const container = link.querySelector('.relative') || link
      if (container === link && !['absolute', 'relative', 'fixed'].some(cls => link.classList.contains(cls))) {
        link.classList.add('relative')
      }
      let badge = container.querySelector('.cart-count-badge')
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span')
          badge.className = 'cart-count-badge absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white border-2 border-white dark:border-black'
          if (link.closest('nav.md\\:hidden')) {
            badge.classList.remove('-top-1', '-right-1')
            badge.classList.add('-top-1', '-right-2')
          }
          container.appendChild(badge)
        }
        badge.textContent = count
        badge.classList.remove('animate-pop')
        void badge.offsetWidth
        badge.classList.add('animate-pop')
      } else {
        if (badge) badge.remove()
      }
    })

    // 2. Selective page re-render
    const currentPath = getRoute()
    // Match dynamic routes like /producto/{id}
    const keyFn = routeRelevantKeys[currentPath] || (currentPath.startsWith('/producto/') ? routeRelevantKeys['/producto'] : null)
    if (!keyFn) return  // catalog and other self-managed pages → skip

    const sig = keyFn(state)
    if (prevSignatures[currentPath] === sig) return  // nothing relevant changed
    prevSignatures[currentPath] = sig
    // Prevent scroll-to-top during in-page re-renders (e.g. cart qty change)
    window.__glScrollLockUntil = Date.now() + 2000
    render(currentPath, { forceRebuild: true })
  })

  // First render is triggered by router, but store subscribe keeps it synced.
  // Cleanup function in case you ever want to unmount.
  return () => {
    if (stopAdminOrderNotifier) stopAdminOrderNotifier()
    stopRouter()
    stopRouteListener()
    unsub()
    cachedViews.forEach(v => v.cleanup?.())
    if (currentNonCachedView) currentNonCachedView.cleanup?.()
  }
}
