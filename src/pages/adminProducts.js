import { adminLogout, saveProducts } from '../app/store.js'
import { navigate } from '../app/router.js'
import { formatMoney } from '../app/format.js'
import { on, qs } from '../app/dom.js'

function parseList(value) {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function productItem(p) {
  return `
    <div class="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0" data-product data-id="${p.id}">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">${p.type}</span>
          <span class="text-xs text-green-400">${formatMoney(p.price)}</span>
        </div>
        <div class="text-sm font-medium text-white truncate">${p.name}</div>
        <div class="flex gap-1 mt-1 text-xs text-gray-500">
          <span>${p.sizes.join(', ')}</span>
          <span>·</span>
          <span>${p.colors.join(', ')}</span>
        </div>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button type="button" class="p-2 text-gray-400 hover:text-white transition-colors" data-edit>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button type="button" class="p-2 text-gray-400 hover:text-red-400 transition-colors" data-delete>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>
  `
}

export function pageAdminProducts(state) {
  const productCount = state.products.length
  
  return {
    title: 'Productos | Admin',
    html: `
      <!-- Header -->
      <section class="mb-5">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-white">Productos</h1>
          <button type="button" id="admin-logout-btn" class="text-xs text-gray-400 hover:text-white transition-colors">
            Cerrar sesión
          </button>
        </div>
        <p class="text-sm text-gray-500">${productCount} productos</p>
      </section>

      <!-- Form -->
      <section class="rounded-xl bg-gray-900 p-5 mb-6">
        <div class="text-xs text-gray-500 mb-4">Agregar producto</div>
        
        <form id="product-form" class="space-y-3" novalidate>
          <input type="hidden" name="id" />

          <input name="name" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Nombre del producto" />

          <div class="grid grid-cols-2 gap-3">
            <input name="type" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Tipo (ej: Camisas)" />
            <input name="price" type="number" min="0" inputmode="numeric" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Precio" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <input name="sizes" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Tallas: S, M, L" />
            <input name="colors" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Colores: Negro, Blanco" />
          </div>

          <div id="product-error" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"></div>

          <div class="flex gap-2">
            <button type="submit" class="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-gray-100 transition-colors">
              Guardar
            </button>
            <button type="button" id="product-reset" class="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <!-- List -->
      <section class="rounded-xl bg-gray-900 p-4">
        <div class="text-xs text-gray-500 mb-3">Lista de productos</div>
        <div id="products-list"></div>
      </section>
    `,
    onMount(root) {
      const list = qs(root, '#products-list')
      const form = qs(root, '#product-form')
      const errorBox = qs(root, '#product-error')
      const resetBtn = qs(root, '#product-reset')

      const setError = (msg) => {
        if (!msg) {
          errorBox.classList.add('hidden')
          errorBox.textContent = ''
          return
        }
        errorBox.textContent = msg
        errorBox.classList.remove('hidden')
      }

      const renderList = () => {
        if (!state.products.length) {
          list.innerHTML = `
            <div class="text-center py-8 text-gray-500 text-sm">
              No hay productos. Agrega el primero arriba.
            </div>
          `
          return
        }

        list.innerHTML = state.products.map(productItem).join('')
      }

      const resetForm = () => {
        form.reset()
        qs(root, 'input[name="id"]').value = ''
        setError('')
      }

      renderList()

      // Logout button
      const logoutBtn = qs(root, '#admin-logout-btn')
      logoutBtn.addEventListener('click', () => {
        adminLogout()
        navigate('/admin')
      })

      resetBtn.addEventListener('click', () => resetForm())

      form.addEventListener('submit', (ev) => {
        ev.preventDefault()
        setError('')

        const idInput = qs(root, 'input[name="id"]')
        const name = qs(root, 'input[name="name"]').value.trim()
        const type = qs(root, 'input[name="type"]').value.trim()
        const price = Number(qs(root, 'input[name="price"]').value || 0)
        const sizes = parseList(qs(root, 'input[name="sizes"]').value)
        const colors = parseList(qs(root, 'input[name="colors"]').value)

        if (!name) return setError('Ingresá el nombre del producto.')
        if (!type) return setError('Ingresá el tipo de prenda.')
        if (!Number.isFinite(price) || price <= 0) return setError('Ingresá un precio válido mayor a 0.')
        if (!sizes.length) return setError('Ingresá al menos una talla.')
        if (!colors.length) return setError('Ingresá al menos un color.')

        const next = [...state.products]

        if (idInput.value) {
          const idx = next.findIndex((p) => p.id === idInput.value)
          if (idx === -1) return setError('No se encontró el producto a editar.')
          next[idx] = { ...next[idx], name, type, price, sizes, colors }
        } else {
          const id = `p-${crypto.randomUUID()}`
          next.unshift({ id, name, type, price, sizes, colors })
        }

        saveProducts(next)
        resetForm()
        navigate('/admin/products')
      })

      on(root, 'click', '[data-edit]', (_ev, btn) => {
        const wrap = btn.closest('[data-product]')
        const id = wrap?.getAttribute('data-id')
        const p = state.products.find((x) => x.id === id)
        if (!p) return

        qs(root, 'input[name="id"]').value = p.id
        qs(root, 'input[name="name"]').value = p.name
        qs(root, 'input[name="type"]').value = p.type
        qs(root, 'input[name="price"]').value = String(p.price)
        qs(root, 'input[name="sizes"]').value = p.sizes.join(', ')
        qs(root, 'input[name="colors"]').value = p.colors.join(', ')
      })

      on(root, 'click', '[data-delete]', (_ev, btn) => {
        const wrap = btn.closest('[data-product]')
        const id = wrap?.getAttribute('data-id')
        if (!id) return
        const next = state.products.filter((p) => p.id !== id)
        saveProducts(next)
      })

      on(root, 'click', '#admin-logout', () => {
        adminLogout()
        navigate('/admin/login')
      })
    },
  }
}
