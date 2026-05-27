export function qs(root, selector) {
  const el = root.querySelector(selector)
  if (!el) throw new Error(`Missing element: ${selector}`)
  return el
}

export function on(root, eventName, selector, handler) {
  root.addEventListener(eventName, (ev) => {
    const target = ev.target
    if (!(target instanceof Element)) return
    const match = target.closest(selector)
    if (!match || !root.contains(match)) return
    handler(ev, match)
  })
}
