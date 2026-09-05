import { getCategories, addCategory, updateCategory, deleteCategory, reorderCategories, getState } from '../../store/index.js'
import { showToast } from '../../utils/toast.js'
import { ICON } from './adminIcons.js'

export function pageAdminCategories(state) {
  return {
    title: 'Categorías | Admin G&L',
    html: `
      <div class="admin-view-in max-w-2xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="eyebrow text-faint">Catálogo</p>
            <h1 class="font-display font-extrabold text-ink text-[24px] tracking-tight mt-0.5">Categorías</h1>
          </div>
          <button id="open-add-category" class="adm-btn adm-btn-primary">${ICON.plus('w-[18px] h-[18px]')} Nueva categoría</button>
        </div>

        <!-- Info banner -->
        <div class="flex items-start gap-3 bg-brand-tint-2 border border-brand-tint rounded-xl2 px-4 py-3">
          ${ICON.info('w-5 h-5 text-brand shrink-0 mt-0.5')}
          <p class="text-[13px] text-brand-ink leading-relaxed">El orden aquí determina cómo se muestran en el catálogo público. Usa las flechas para reordenar.</p>
        </div>

        <!-- List -->
        <div id="categories-list" class="space-y-2 admin-stagger">
          <div class="py-12 text-center text-faint animate-pulse">
            ${ICON.tag('w-8 h-8 mx-auto mb-2 text-line-strong')}
            <span class="text-[13px] block">Cargando categorías...</span>
          </div>
        </div>
      </div>
    `,

    async onMount(root) {
      const listEl = root.querySelector('#categories-list')
      let categories = getCategories()

      const getProductCounts = () => {
        const counts = {}
        ;(getState().products || []).forEach(p => {
          const type = p.type || ''
          if (type) counts[type] = (counts[type] || 0) + 1
        })
        return counts
      }

      const renderList = () => {
        categories = getCategories()
        const productCounts = getProductCounts()

        if (!categories.length) {
          listEl.innerHTML = `
            <div class="py-16 text-center">
              ${ICON.tag('w-12 h-12 mx-auto mb-4 text-line-strong')}
              <p class="font-semibold text-body">No hay categorías</p>
              <p class="text-[13px] text-muted mt-1">Crea la primera con el botón de arriba</p>
            </div>`
          return
        }

        listEl.innerHTML = categories.map((cat, i) => {
          const count = productCounts[cat.name] || 0
          return `
          <div class="group flex items-center gap-3 bg-paper rounded-xl2 border border-line hover:border-line-strong hover:shadow-card px-3.5 py-3 transition-all" data-category-id="${cat.id}" data-category-name="${cat.name}">
            <div class="flex flex-col items-center gap-0.5 shrink-0">
              <button type="button" data-move-up="${cat.id}" class="w-6 h-6 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-canvas transition-colors disabled:opacity-25 disabled:pointer-events-none" ${i === 0 ? 'disabled' : ''} title="Mover arriba">${ICON.chevUp('w-4 h-4')}</button>
              <button type="button" data-move-down="${cat.id}" class="w-6 h-6 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-canvas transition-colors disabled:opacity-25 disabled:pointer-events-none" ${i === categories.length - 1 ? 'disabled' : ''} title="Mover abajo">${ICON.chevDown('w-4 h-4')}</button>
            </div>
            <div class="w-8 h-8 rounded-lg bg-canvas border border-line flex items-center justify-center eyebrow text-muted tnum shrink-0">${String(i + 1).padStart(2, '0')}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[14px] font-semibold text-ink truncate">${cat.name}</span>
                ${!cat.active ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-line text-muted font-medium">Oculta</span>' : ''}
              </div>
              <span class="text-[12px] text-faint">${count} producto${count !== 1 ? 's' : ''}</span>
            </div>
            <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity shrink-0">
              <button type="button" data-toggle-cat="${cat.id}" class="gl-toggle ${cat.active ? 'on' : ''}" title="${cat.active ? 'Ocultar' : 'Mostrar'}"></button>
              <button type="button" data-edit-cat="${cat.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors" title="Editar">${ICON.edit('w-[17px] h-[17px]')}</button>
              <button type="button" data-delete-cat="${cat.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors" title="Eliminar">${ICON.trash('w-[17px] h-[17px]')}</button>
            </div>
          </div>`
        }).join('')

        bindEvents()
      }

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
            if (error) showToast('Error al reordenar', 'error')
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
            if (error) showToast('Error al reordenar', 'error')
            renderList()
          })
        })

        // Toggle Active (gl-toggle click)
        listEl.querySelectorAll('[data-toggle-cat]').forEach(toggle => {
          toggle.addEventListener('click', async () => {
            const id = toggle.dataset.toggleCat
            const cat = categories.find(c => c.id === id)
            if (!cat) return
            const newActive = !cat.active
            const { error } = await updateCategory(id, { active: newActive })
            if (error) {
              showToast('Error al actualizar', 'error')
              return
            }
            showToast(newActive ? 'Categoría visible' : 'Categoría oculta', 'success')
            renderList()
          })
        })

        // Edit
        listEl.querySelectorAll('[data-edit-cat]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.editCat
            const cat = categories.find(c => c.id === id)
            if (cat) openNameModal(cat)
          })
        })

        // Delete
        listEl.querySelectorAll('[data-delete-cat]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.deleteCat
            const cat = categories.find(c => c.id === id)
            if (!cat) return
            const count = (getProductCounts()[cat.name]) || 0
            if (count > 0) {
              showToast(`No se puede eliminar "${cat.name}" porque tiene ${count} producto${count !== 1 ? 's' : ''}. Reasigna primero.`, 'error', 5000)
              return
            }
            openDeleteConfirm(cat)
          })
        })
      }

      // ── Delete Confirm Modal ──
      const openDeleteConfirm = (cat) => {
        root.querySelector('#cat-delete-modal')?.remove()
        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="cat-delete-modal" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade">
            <div class="w-full max-w-sm bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden">
              <div class="p-5 text-center">
                <div class="w-11 h-11 rounded-xl2 bg-bad-tint text-bad flex items-center justify-center mx-auto mb-3">${ICON.trash('w-5 h-5')}</div>
                <h3 class="font-display font-bold text-ink text-[17px]">¿Eliminar categoría?</h3>
                <p class="text-[13.5px] text-muted mt-1">Vas a eliminar <span class="font-semibold text-body">"${cat.name}"</span>. Esta acción no se puede deshacer.</p>
              </div>
              <div class="px-5 pb-5 flex gap-2.5">
                <button data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                <button data-confirm class="adm-btn flex-1" style="background:#D6453E;color:#fff">Eliminar</button>
              </div>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)
        const modal = root.querySelector('#cat-delete-modal')
        const close = () => modal.remove()
        modal.querySelector('[data-cancel]').addEventListener('click', close)
        modal.addEventListener('click', (e) => { if (e.target === modal) close() })
        modal.querySelector('[data-confirm]').addEventListener('click', async () => {
          const { error } = await deleteCategory(cat.id)
          if (error) { showToast('Error al eliminar', 'error'); close(); return }
          showToast('Categoría eliminada', 'success')
          close()
          renderList()
        })
      }

      // ── Name Modal (add/edit) ──
      const openNameModal = (cat = null) => {
        const isEdit = !!cat
        const modalId = isEdit ? 'cat-edit-modal' : 'cat-add-modal'
        root.querySelector(`#${modalId}`)?.remove()

        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="${modalId}" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade">
            <div class="w-full max-w-sm bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden">
              <div class="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 class="font-display font-bold text-ink text-[17px]">${isEdit ? 'Editar categoría' : 'Nueva categoría'}</h2>
                <button data-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">${ICON.close('w-[18px] h-[18px]')}</button>
              </div>
              <form data-form class="px-5 pb-5 space-y-4">
                <div>
                  <label class="adm-lbl">Nombre *</label>
                  <input name="name" type="text" required maxlength="50" value="${isEdit ? cat.name : ''}" class="adm-fld" placeholder="Ej: Camisas" autofocus />
                </div>
                <p data-error class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2"></p>
                <div class="flex gap-2.5 pt-1">
                  <button type="button" data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                  <button type="submit" data-submit class="adm-btn adm-btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)

        const modal = root.querySelector(`#${modalId}`)
        const form = modal.querySelector('[data-form]')
        const errorEl = modal.querySelector('[data-error]')
        const submitBtn = modal.querySelector('[data-submit]')
        const close = () => modal.remove()

        modal.querySelector('[data-close]').addEventListener('click', close)
        modal.querySelector('[data-cancel]').addEventListener('click', close)
        modal.addEventListener('click', (e) => { if (e.target === modal) close() })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')
          const name = form.querySelector('input[name="name"]').value.trim()

          if (!name) { errorEl.textContent = 'El nombre es requerido.'; errorEl.classList.remove('hidden'); return }
          if (isEdit && name === cat.name) { close(); return }
          if (categories.some(c => c.name.toLowerCase() === name.toLowerCase() && (!isEdit || c.id !== cat.id))) {
            errorEl.textContent = 'Ya existe una categoría con ese nombre.'
            errorEl.classList.remove('hidden')
            return
          }

          submitBtn.disabled = true
          submitBtn.textContent = isEdit ? 'Guardando...' : 'Creando...'

          let result
          if (isEdit) {
            result = await updateCategory(cat.id, { name })
          } else {
            result = await addCategory(name)
          }

          if (result.error) {
            const msg = (result.error?.message || '').includes('duplicate') ? 'Ya existe una categoría con ese nombre.' : 'Error. Inténtalo de nuevo.'
            errorEl.textContent = msg
            errorEl.classList.remove('hidden')
            submitBtn.disabled = false
            submitBtn.textContent = isEdit ? 'Guardar' : 'Crear'
            return
          }

          showToast(isEdit ? 'Categoría actualizada' : `Categoría "${name}" creada`, 'success')
          close()
          renderList()
        })
      }

      root.querySelector('#open-add-category').addEventListener('click', () => openNameModal())

      renderList()
    },
  }
}
