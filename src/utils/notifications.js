const MAX = 50
let items = []
let listeners = []

export function addNotification({ type = 'order', title, body, orderId }) {
  const n = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    type,
    title,
    body,
    orderId: orderId || null,
    time: new Date(),
    read: false,
  }
  items.unshift(n)
  if (items.length > MAX) items = items.slice(0, MAX)
  notify()
  return n
}

export function getNotifications() {
  return items
}

export function getUnreadCount() {
  return items.filter(n => !n.read).length
}

export function markAllRead() {
  items.forEach(n => { n.read = true })
  notify()
}

export function subscribeNotifications(fn) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

function notify() {
  listeners.forEach(fn => fn(items))
}
