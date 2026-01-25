export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container')
  
  // Ensure container exists
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    // High z-index to overlay everything (nav, modal, etc.)
    container.className = 'fixed bottom-28 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none'
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  const isDark = document.documentElement.classList.contains('dark')
  
  // Base classes
  const baseClasses = 'pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full shadow-xl shadow-black/20 text-sm font-medium transform transition-all duration-300 translate-y-8 opacity-0'
  
  // Color classes
  const colors = type === 'error' 
    ? (isDark ? 'bg-red-900/90 text-red-100 border border-red-800' : 'bg-red-500 text-white')
    : (isDark ? 'bg-gray-800/95 text-white border border-gray-700' : 'bg-gray-900/95 text-white')

  toast.className = `${baseClasses} ${colors}`
  
  // Icon
  const icon = type === 'error'
    ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    : `<svg class="w-4 h-4 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`

  toast.innerHTML = `${icon}<span>${message}</span>`

  container.appendChild(toast)

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-8', 'opacity-0')
  })

  // Remove after delay
  setTimeout(() => {
    toast.classList.add('translate-y-8', 'opacity-0')
    setTimeout(() => toast.remove(), 300)
  }, 2500)
}
