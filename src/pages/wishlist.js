import { formatMoney } from '../app/format.js'
import { getWishlistProducts, toggleWishlist, addToCart } from '../app/store.js'
import { on, qs } from '../app/dom.js'

function wishlistItem(p) {
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop'
  const sizeOpts = (p.sizes || []).map(s => `<option value="${s}">${s}</option>`).join('')
  const colorOpts = (p.colors || []).map(c => `<option value="${c}">${c}</option>`).join('')

  return `
    <div class="flex gap-4 py-4 border-b border-gray-200 dark:border-gray-800" data-wishlist-item data-id="${p.id}">
      <div class="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
        <img src="${img}" alt="${p.name}" class="w-full h-full object-cover"/>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">${p.name}</h3>
            <p class="text-xs text-gray-500">${p.type}</p>
          </div>
          <button data-remove="${p.id}" class="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-base font-bold text-gray-900 dark:text-white">${formatMoney(p.price)}</span>
          ${p.originalPrice ? `<span class="text-xs text-gray-500 line-through">${formatMoney(p.originalPrice)}</span>` : ''}
        </div>
        <div class="flex gap-2 mt-3">
          <select class="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white" name="size">${sizeOpts}</select>
          <select class="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white" name="color">${colorOpts}</select>
          <button data-add-cart="${p.id}" class="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
            Agregar
          </button>
        </div>
      </div>
    </div>
  `
}

export function pageWishlist(state) {
  const products = getWishlistProducts()

  return {
    title: 'Favoritos | G&L',
    html: `
      <section class="mb-4">
        <a href="#/catalog" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Catálogo
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Favoritos</h1>
        <p class="text-sm text-gray-500 mt-1">${products.length} productos guardados</p>
      </section>

      <section id="wishlist-container">
        ${products.length === 0 ? `
          <div class="text-center py-16">
            <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg class="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sin favoritos aún</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Guarda productos que te gusten para verlos después</p>
            <a href="#/catalog" class="inline-flex items-center gap-2 rounded-full bg-black dark:bg-white px-6 py-3 text-sm font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
              Explorar catálogo
            </a>
          </div>
        ` : products.map(wishlistItem).join('')}
      </section>

      <div id="toast-container" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"></div>
    `,
    onMount(root) {
      const container = qs(root, '#wishlist-container')
      const toastContainer = qs(root, '#toast-container')

      const showToast = (message) => {
        const toast = document.createElement('div')
        toast.className = 'toast-enter bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2'
        toast.innerHTML = `<svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>${message}`
        toastContainer.appendChild(toast)
        setTimeout(() => { toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 300) }, 2000)
      }

      on(root, 'click', '[data-remove]', (ev, btn) => {
        const id = btn.dataset.remove
        toggleWishlist(id)
        const item = container.querySelector(`[data-id="${id}"]`)
        if (item) {
          item.style.opacity = '0'
          item.style.transform = 'translateX(-20px)'
          setTimeout(() => item.remove(), 200)
        }
        showToast('Eliminado de favoritos')
      })

      on(root, 'click', '[data-add-cart]', (ev, btn) => {
        const id = btn.dataset.addCart
        const item = container.querySelector(`[data-id="${id}"]`)
        const size = item?.querySelector('select[name="size"]')?.value || ''
        const color = item?.querySelector('select[name="color"]')?.value || ''
        addToCart({ productId: id, size, color, qty: 1 })
        btn.textContent = '✓ Agregado'
        btn.disabled = true
        showToast('Producto agregado al carrito')
        setTimeout(() => { btn.textContent = 'Agregar'; btn.disabled = false }, 1500)
      })
    }
  }
}
