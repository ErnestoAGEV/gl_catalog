const listeners = new Set()

export function getRoute() {
  const hash = window.location.hash || '#/'
  const path = hash.startsWith('#') ? hash.slice(1) : hash
  return path || '/'
}

export function navigate(path) {
  const next = path.startsWith('/') ? path : `/${path}`
  window.location.hash = `#${next}`
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
  
  const notify = () => {
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

  window.addEventListener('hashchange', notify)
  notify()

  return () => {
    window.removeEventListener('hashchange', notify)
  }
}
