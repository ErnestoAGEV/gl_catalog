import { getRoute, onRouteChange, startRouter, navigate } from './router.js'
import { getState, isAdminAuthed, loadProducts, subscribe, toggleTheme, getTheme, setSearchQuery, initAdminSession } from './store.js'
import { renderRoute } from './views.js'
import { showToast } from './toast.js'

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

  let currentCleanup = null

  const render = (path) => {
    // Cleanup previous route if applicable
    if (currentCleanup) {
      currentCleanup()
      currentCleanup = null
    }

    const authed = isAdminAuthed()

    if (authed && path === '/admin/login') {
      navigate('/admin/products')
      return
    }

    if (!authed && path.startsWith('/admin') && path !== '/admin/login') {
      navigate('/admin/login')
      return
    }

    const { title, html, onMount } = renderRoute(path, getState())
    document.title = title
    mountEl.innerHTML = html
    
    // Execute onMount and capture cleanup function
    const cleanup = onMount?.(mountEl)
    if (typeof cleanup === 'function') {
      currentCleanup = cleanup
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
    window.addEventListener('navigate', () => render(getRoute()), { once: true })
  }

  const stopRouteListener = onRouteChange(render)
  const stopRouter = startRouter()

  // Ensure first paint even if hash doesn't change.
  render(getRoute())

  // ─── Smart re-render: only re-render a page when its relevant state slice changes ───
  // Catalog manages its own updates via its own subscribe, so we skip it here.
  const routeRelevantKeys = {
    '/':              (s) => `${s.products.length}|${s.isLoading}`,
    '/cart':          (s) => `${JSON.stringify(s.cart)}|${JSON.stringify(s.coupon)}|${s.products.length}`,
    '/wishlist':      (s) => JSON.stringify(s.wishlist),
    '/checkout':      (s) => `${JSON.stringify(s.cart)}|${JSON.stringify(s.coupon)}|${s.products.length}`,
    '/admin/products':(s) => JSON.stringify(s.products),
  }

  let prevSignatures = {}

  const unsub = subscribe((state) => {
    // 1. Global badge update — always runs, no full re-render
    const count = state.cart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
    document.querySelectorAll('a[href="#/cart"]').forEach(link => {
      const container = link.querySelector('.relative') || link
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
    const keyFn = routeRelevantKeys[currentPath]
    if (!keyFn) return  // catalog and other self-managed pages → skip

    const sig = keyFn(state)
    if (prevSignatures[currentPath] === sig) return  // nothing relevant changed
    prevSignatures[currentPath] = sig
    render(currentPath)
  })


  // First render is triggered by router, but store subscribe keeps it synced.
  // Cleanup function in case you ever want to unmount.
  return () => {
    stopRouter()
    stopRouteListener()
    unsub()
  }
}
