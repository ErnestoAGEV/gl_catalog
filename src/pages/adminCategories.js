import { getCategories, addCategory, updateCategory, deleteCategory, reorderCategories, getState } from '../app/store.js'
import { showToast } from '../app/toast.js'

function categoryRow(cat, index, total, productCounts) {
  const count = productCounts[cat.name] || 0
  return `
    <div class="flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-gray-100 group hover:border-brand/20 hover:shadow-sm transition-all" data-category-id="${cat.id}" data-category-name="${cat.name}">
      <!-- Drag Handle & Order -->
      <div class="flex flex-col items-center gap-0.5 flex-shrink-0">
        <button type="button" data-move-up="${cat.id}" class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-20 disabled:cursor-not-allowed" ${index === 0 ? 'disabled' : ''} title="Mover arriba">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
        </button>
        <span class="text-[10px] font-bold text-gray-300 tabular-nums w-5 text-center">${index + 1}</span>
        <button type="button" data-move-down="${cat.id}" class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-20 disabled:cursor-not-allowed" ${index === total - 1 ? 'disabled' : ''} title="Mover abajo">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
      </div>

      <!-- Category info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-900 text-sm truncate">${cat.name}</span>
          ${!cat.active ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">Oculta</span>' : ''}
        </div>
        <span class="text-xs text-gray-400">${count} producto${count !== 1 ? 's' : ''}</span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <!-- Toggle Active -->
        <label class="relative inline-flex items-center cursor-pointer" title="${cat.active ? 'Ocultar' : 'Mostrar'} categoría">
          <input type="checkbox" class="sr-only peer" data-toggle-cat="${cat.id}" ${cat.active ? 'checked' : ''}>
          <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
        </label>
        <!-- Edit -->
        <button type="button" data-edit-cat="${cat.id}" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand transition-colors" title="Editar nombre">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <!-- Delete -->
        <button type="button" data-delete-cat="${cat.id}" class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  `
}

export function pageAdminCategories(state) {
  return {
    title: 'Categorías | Admin G&L',
    html: `
      <div class="animate-fade-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 class="text-3xl font-manrope font-bold text-gray-900">Categorías</h1>
            <p class="text-gray-500 mt-1 text-sm">Gestiona las categorías de tu catálogo</p>
          </div>
          <button id="open-add-category" class="w-full sm:w-auto self-start sm:self-auto flex items-center justify-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Nueva categoría
          </button>
        </div>

        <!-- Info Banner -->
        <div class="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p class="text-sm text-blue-700">El orden de las categorías aquí determina cómo se muestran los productos en el catálogo público. Usa las flechas para reordenar.</p>
        </div>

        <!-- Categories List -->
        <div id="categories-list" class="space-y-2">
          <div class="py-12 text-center text-gray-400">
            <div class="animate-pulse flex flex-col items-center gap-2">
              <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              <span class="text-sm">Cargando categorías...</span>
            </div>
          </div>
        </div>
      </div>
    `,

    async onMount(root) {
      const listEl = root.querySelector('#categories-list')
      let categories = getCategories()

      // Calculate product counts per category
      const getProductCounts = () => {
        const counts = {}
        const products = getState().products || []
        products.forEach(p => {
          const type = p.type || ''
          if (type) counts[type] = (counts[type] || 0) + 1
        })
        return counts
      }

      // ── Render ──
      const renderList = () => {
        categories = getCategories()
        const productCounts = getProductCounts()

        if (!categories.length) {
          listEl.innerHTML = `
            <div class="py-16 text-center text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              <p class="font-medium text-gray-500">No hay categorías</p>
              <p class="text-sm text-gray-400 mt-1">Crea la primera con el botón de arriba</p>
            </div>
          `
          return
        }

        listEl.innerHTML = categories.map((cat, i) =>
          categoryRow(cat, i, categories.length, productCounts)
        ).join('')

        bindEvents()
      }

      // ── Event Bindings ──
      const bindEvents = () => {
        // Move Up
        listEl.querySelectorAll('[data-move-up]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.moveUp
            const idx = categories.findIndex(c => c.id === id)
            if (idx <= 0) return

            const ids = categories.map(c => c.id)
            ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]

            btn.disabled = true
            const { error } = await reorderCategories(ids)
            if (error) {
              showToast('Error al reordenar', 'error')
            }
            renderList()
          })
        })

        // Move Down
        listEl.querySelectorAll('[data-move-down]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.moveDown
            const idx = categories.findIndex(c => c.id === id)
            if (idx === -1 || idx >= categories.length - 1) return

            const ids = categories.map(c => c.id)
            ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]

            btn.disabled = true
            const { error } = await reorderCategories(ids)
            if (error) {
              showToast('Error al reordenar', 'error')
            }
            renderList()
          })
        })

        // Toggle Active
        listEl.querySelectorAll('[data-toggle-cat]').forEach(toggle => {
          toggle.addEventListener('change', async () => {
            const id = toggle.dataset.toggleCat
            const { error } = await updateCategory(id, { active: toggle.checked })
            if (error) {
              showToast('Error al actualizar', 'error')
              toggle.checked = !toggle.checked
              return
            }
            showToast(toggle.checked ? 'Categoría visible' : 'Categoría oculta', 'success')
            renderList()
          })
        })

        // Edit Name
        listEl.querySelectorAll('[data-edit-cat]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.editCat
            const cat = categories.find(c => c.id === id)
            if (!cat) return
            openEditModal(cat)
          })
        })

        // Delete
        listEl.querySelectorAll('[data-delete-cat]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.deleteCat
            const cat = categories.find(c => c.id === id)
            if (!cat) return

            const productCounts = getProductCounts()
            const count = productCounts[cat.name] || 0

            if (count > 0) {
              showToast(`No se puede eliminar "${cat.name}" porque tiene ${count} producto${count !== 1 ? 's' : ''} asignado${count !== 1 ? 's' : ''}. Reasigna los productos primero.`, 'error', 5000)
              return
            }

            if (!confirm(`¿Eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`)) return

            const { error } = await deleteCategory(id)
            if (error) {
              showToast('Error al eliminar', 'error')
              return
            }
            showToast('Categoría eliminada', 'success')
            renderList()
          })
        })
      }

      // ── Edit Modal ──
      const openEditModal = (cat) => {
        root.querySelector('#cat-edit-modal')?.remove()

        const div = document.createElement('div')
        div.innerHTML = `
          <div id="cat-edit-modal" class="fixed inset-0 layer-modal flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in z-50">
            <div class="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div class="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 class="text-lg font-bold font-manrope text-gray-900">Editar categoría</h2>
                <button id="cat-edit-close" class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form id="cat-edit-form" class="p-5 space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre *</label>
                  <input name="name" type="text" required maxlength="50" value="${cat.name}"
                    class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors"
                    placeholder="Ej: Camisas" />
                </div>
                <p id="cat-edit-error" class="hidden text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2"></p>
                <div class="flex gap-3 pt-1">
                  <button type="button" id="cat-edit-cancel" class="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" id="cat-edit-submit" class="flex-1 px-4 py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        `
        root.appendChild(div.firstElementChild)

        const modal = root.querySelector('#cat-edit-modal')
        const form = modal.querySelector('#cat-edit-form')
        const errorEl = modal.querySelector('#cat-edit-error')
        const closeModal = () => modal.remove()

        modal.querySelector('#cat-edit-close').addEventListener('click', closeModal)
        modal.querySelector('#cat-edit-cancel').addEventListener('click', closeModal)
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal() })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')

          const newName = form.querySelector('input[name="name"]').value.trim()
          if (!newName) {
            errorEl.textContent = 'El nombre es requerido.'
            errorEl.classList.remove('hidden')
            return
          }

          if (newName === cat.name) {
            closeModal()
            return
          }

          // Check for duplicates
          if (categories.some(c => c.name.toLowerCase() === newName.toLowerCase() && c.id !== cat.id)) {
            errorEl.textContent = 'Ya existe una categoría con ese nombre.'
            errorEl.classList.remove('hidden')
            return
          }

          const submitBtn = modal.querySelector('#cat-edit-submit')
          submitBtn.disabled = true
          submitBtn.textContent = 'Guardando...'

          const { error } = await updateCategory(cat.id, { name: newName })
          if (error) {
            errorEl.textContent = 'Error al actualizar. Inténtalo de nuevo.'
            errorEl.classList.remove('hidden')
            submitBtn.disabled = false
            submitBtn.textContent = 'Guardar'
            return
          }

          showToast('Categoría actualizada', 'success')
          closeModal()
          renderList()
        })
      }

      // ── Add New Category ──
      const openAddModal = () => {
        root.querySelector('#cat-add-modal')?.remove()

        const div = document.createElement('div')
        div.innerHTML = `
          <div id="cat-add-modal" class="fixed inset-0 layer-modal flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in z-50">
            <div class="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div class="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 class="text-lg font-bold font-manrope text-gray-900">Nueva categoría</h2>
                <button id="cat-add-close" class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form id="cat-add-form" class="p-5 space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre *</label>
                  <input name="name" type="text" required maxlength="50" autofocus
                    class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors"
                    placeholder="Ej: Zapatos" />
                </div>
                <p id="cat-add-error" class="hidden text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2"></p>
                <div class="flex gap-3 pt-1">
                  <button type="button" id="cat-add-cancel" class="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" id="cat-add-submit" class="flex-1 px-4 py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors">Crear</button>
                </div>
              </form>
            </div>
          </div>
        `
        root.appendChild(div.firstElementChild)

        const modal = root.querySelector('#cat-add-modal')
        const form = modal.querySelector('#cat-add-form')
        const errorEl = modal.querySelector('#cat-add-error')
        const closeModal = () => modal.remove()

        modal.querySelector('#cat-add-close').addEventListener('click', closeModal)
        modal.querySelector('#cat-add-cancel').addEventListener('click', closeModal)
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal() })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')

          const name = form.querySelector('input[name="name"]').value.trim()
          if (!name) {
            errorEl.textContent = 'El nombre es requerido.'
            errorEl.classList.remove('hidden')
            return
          }

          // Check for duplicates
          if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            errorEl.textContent = 'Ya existe una categoría con ese nombre.'
            errorEl.classList.remove('hidden')
            return
          }

          const submitBtn = modal.querySelector('#cat-add-submit')
          submitBtn.disabled = true
          submitBtn.textContent = 'Creando...'

          const { error } = await addCategory(name)
          if (error) {
            const msg = error?.message || ''
            errorEl.textContent = msg.includes('duplicate') || msg.includes('unique') ? 'Ya existe una categoría con ese nombre.' : 'Error al crear. Inténtalo de nuevo.'
            errorEl.classList.remove('hidden')
            submitBtn.disabled = false
            submitBtn.textContent = 'Crear'
            return
          }

          showToast(`Categoría "${name}" creada`, 'success')
          closeModal()
          renderList()
        })
      }

      root.querySelector('#open-add-category').addEventListener('click', openAddModal)

      // Initial render
      renderList()
    },
  }
}
