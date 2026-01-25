import { ensureSeedData } from './seed.js'
import { getRoute, onRouteChange, startRouter, navigate } from './router.js'
import { getState, isAdminAuthed, loadProducts, subscribe, toggleTheme, getTheme, setSearchQuery } from './store.js'
import { renderRoute } from './views.js'

export function startApp(mountEl) {
  // ensureSeedData() // Disabled: Using Supabase
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

  // Only re-render on state changes for pages that need it (cart, wishlist, checkout)
  // Catalog handles its own updates to avoid full page reloads
  const unsub = subscribe((state) => {
    // 1. Global UI Updates (Header/Nav) without full re-render
    const count = state.cart.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
    const cartLinks = document.querySelectorAll('a[href="#/cart"]')
    
    cartLinks.forEach(link => {
      // Find relative container for badge (usually the link itself or a div inside)
      const container = link.querySelector('.relative') || link
      let badge = container.querySelector('.cart-count-badge')
      
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span')
          // Common classes for both desktop and mobile
          badge.className = 'cart-count-badge absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white border-2 border-white dark:border-black'
          // Mobile specific adjustments if needed (handled by logic above usually)
          if (link.closest('nav.md\\:hidden')) {
             // Mobile nav specific positioning if different
             badge.classList.remove('-top-1', '-right-1')
             badge.classList.add('-top-1', '-right-2') 
          }
          container.appendChild(badge)
        }
        badge.textContent = count
        // Add minimal animation
        badge.classList.remove('animate-pop')
        void badge.offsetWidth // Trigger reflow
        badge.classList.add('animate-pop')
      } else {
        if (badge) badge.remove()
      }
    })

    // 2. Route-specific re-renders
    const currentPath = getRoute()
    const shouldRerender = ['/cart', '/wishlist', '/checkout', '/admin/products'].some(p => currentPath.startsWith(p))
    if (shouldRerender) {
      render(currentPath)
    }
  })

  // First render is triggered by router, but store subscribe keeps it synced.
  // Cleanup function in case you ever want to unmount.
  return () => {
    stopRouter()
    stopRouteListener()
    unsub()
  }
}
