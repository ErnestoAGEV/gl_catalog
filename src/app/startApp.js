import { ensureSeedData } from './seed.js'
import { getRoute, onRouteChange, startRouter, navigate } from './router.js'
import { getState, isAdminAuthed, loadProducts, subscribe, toggleTheme, getTheme, setSearchQuery } from './store.js'
import { renderRoute } from './views.js'

export function startApp(mountEl) {
  ensureSeedData()
  loadProducts()

  // Apply initial theme
  const applyTheme = () => {
    const theme = getTheme()
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.body.classList.toggle('bg-black', theme === 'dark')
    document.body.classList.toggle('bg-white', theme === 'light')
  }
  applyTheme()

  const render = (path) => {
    const authed = isAdminAuthed()

    if (authed && !path.startsWith('/admin')) {
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
    onMount?.(mountEl)

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
  const unsub = subscribe(() => {
    const currentPath = getRoute()
    const shouldRerender = ['/cart', '/wishlist', '/checkout'].some(p => currentPath.startsWith(p))
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
