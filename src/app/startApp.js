import { getRoute, onRouteChange, startRouter, navigate, scrollPositions } from './router.js'
import { getState, isAdminAuthed, loadProducts, subscribe, toggleTheme, getTheme, setSearchQuery, initAdminSession, getAdminOrders } from './store.js'
import { renderRoute } from './views.js'
import { showToast } from './toast.js'
import { supabase } from './supabase.js'
import { formatMoney } from './format.js'
import { applySeo } from './seo.js'

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

    // ── Always reset body scroll lock on navigation ──
    document.body.style.overflow = ''

    // Remove orphaned overlays that live outside #app and could block
    // interaction on the new page.
    document.getElementById('fs-viewer')?.remove()          // fullscreen image viewer
    document.getElementById('order-details-modal')?.remove() // admin order detail modal

    const cacheKey = path === '/' ? '/' : (path.startsWith('/catalog') ? '/catalog' : null)

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

      // Apply scroll
      if (savedScroll === null) {
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

    // For forward navigation: scroll to top immediately
    if (savedScroll === null) {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    } else {
      // Restoring: remove from in-memory map
      scrollPositions.delete(path)
      // For non-catalog pages apply saved scroll after DOM is painted
      if (!path.startsWith('/catalog')) {
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
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle')
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        toggleTheme()
        applyTheme()
        render(getRoute()) // Re-render with new theme
      })
    }

    // Global search
    const searchInput = document.getElementById('global-search')
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim()
          setSearchQuery(query)
          navigate('/catalog')
        }
      })
    }

    // Navigation custom event listener (for coupon apply/remove)
    // Avoid attaching duplicate event listeners if it already exists
    if (!window.__glNavigationListenerAdded) {
      window.__glNavigationListenerAdded = true
      window.addEventListener('navigate', () => render(getRoute()), { once: true })
    }
  }

  const stopRouteListener = onRouteChange(render)
  const stopRouter = startRouter()

  // Ensure first paint even if hash doesn't change.
  render(getRoute())

  // ─── Smart re-render: only re-render a page when its relevant state slice changes ───
  // Catalog manages its own updates via its own subscribe, so we skip it here.
  const routeRelevantKeys = {
    '/':              (s) => `${s.products.length}|${s.isLoading}`,
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
