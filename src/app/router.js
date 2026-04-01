const listeners = new Set()

function normalizePath(path) {
  if (!path) return '/'
  const withSlash = path.startsWith('/') ? path : `/${path}`
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash
}

function getLegacyHashRoute() {
  const hash = window.location.hash || ''
  if (!hash.startsWith('#/')) return null
  const raw = hash.slice(1)
  const [pathPart, queryPart] = raw.split('?')
  const path = normalizePath(pathPart)
  return queryPart ? `${path}?${queryPart}` : path
}

function notify() {
  // Always clear body scroll lock left by modals/overlays from the previous route
  document.body.style.overflow = ''

  // Immediate scroll
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  for (const fn of listeners) fn(getRoute())

  // Scroll after render
  requestAnimationFrame(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    // One more scroll after a tiny delay to catch async content
    setTimeout(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 10)
  })
}

export function getRoute() {
  const path = normalizePath(window.location.pathname || '/')
  const query = window.location.search || ''
  return `${path}${query}`
}

export function navigate(path) {
  const url = new URL(path, window.location.origin)
  const next = `${normalizePath(url.pathname)}${url.search || ''}`
  const current = getRoute()
  if (next === current) return
  window.history.pushState(null, '', next)
  notify()
}

export function onRouteChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function startRouter() {
  // Disable browser's automatic scroll restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }

  const legacyRoute = getLegacyHashRoute()
  if (legacyRoute) {
    window.history.replaceState(null, '', legacyRoute)
  }

  const onPopState = () => notify()

  const onDocumentClick = (event) => {
    if (event.defaultPrevented) return
    if (event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const anchor = event.target.closest('a[href]')
    if (!anchor) return
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

    const href = anchor.getAttribute('href') || ''
    if (!href) return

    if (href.startsWith('#/')) {
      event.preventDefault()
      navigate(href.slice(1))
      return
    }

    if (href.startsWith('#')) return

    const targetUrl = new URL(href, window.location.origin)
    if (targetUrl.origin !== window.location.origin) return
    if (targetUrl.hash && targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) return

    event.preventDefault()
    navigate(`${targetUrl.pathname}${targetUrl.search}`)
  }

  window.addEventListener('popstate', onPopState)
  document.addEventListener('click', onDocumentClick)
  notify()

  return () => {
    window.removeEventListener('popstate', onPopState)
    document.removeEventListener('click', onDocumentClick)
  }
}
