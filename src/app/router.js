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
  const notify = () => {
    for (const fn of listeners) fn(getRoute())
  }

  window.addEventListener('hashchange', notify)
  notify()

  return () => {
    window.removeEventListener('hashchange', notify)
  }
}
