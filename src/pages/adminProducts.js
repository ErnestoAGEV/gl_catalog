import { adminLogout, addProduct, updateProduct, deleteProduct, uploadProductImage } from '../app/store.js'
import { navigate } from '../app/router.js'
import { on, qs } from '../app/dom.js'
import { parseList } from './adminProductsData.js'
import { productCard } from './adminProductCard.js'
import { productFormHTML } from './adminProductForm.js'

export function pageAdminProducts(state) {
  const productCount = state.products.length
  
  // Extract unique colors from all products (passed to form for quick-select badges)
  const allColors = [...new Set(state.products.flatMap(p => p.colors || []).map(c => c.trim()))].sort()

  return {
    title: 'Productos | Admin G&L',
    html: `
      <!-- Header -->
      <section id="admin-top" class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-manrope font-bold text-gray-900 dark:text-white">Productos</h1>
          <p class="text-sm text-gray-500 mt-1">Gestiona tu catálogo (${productCount} en total)</p>
        </div>
      </section>

      <!-- Add Product Button -->
      <button type="button" id="toggle-form-btn" class="w-full mb-6 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-brand text-white font-semibold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        <span id="toggle-form-text">Agregar nuevo producto</span>
      </button>

      ${productFormHTML(allColors)}

      <!-- Products List -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900">Productos</h2>
          <span id="products-count" class="text-sm text-gray-500">${productCount} en total</span>
        </div>
        
        <!-- Search Bar -->
        <div class="relative mb-4">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input id="search-products" type="text" class="w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Buscar por nombre, categoría o badge..." />
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" class="px-6 py-4 font-semibold min-w-[250px]">Producto</th>
                  <th scope="col" class="px-6 py-4 font-semibold min-w-[120px]">Categoría</th>
                  <th scope="col" class="px-6 py-4 font-semibold min-w-[100px]">Precio</th>
                  <th scope="col" class="px-6 py-4 font-semibold min-w-[140px]">Stock</th>
                  <th scope="col" class="px-6 py-4 font-semibold min-w-[140px]">Estado</th>
                  <th scope="col" class="px-6 py-4 font-semibold text-center min-w-[120px]">Acciones</th>
                </tr>
              </thead>
              <tbody id="products-list" class="divide-y divide-gray-100 dark:divide-gray-800">
              </tbody>
            </table>
          </div>
          <!-- Pagination Controls -->
          <div id="pagination-controls" class="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 min-h-[60px]">
          </div>
        </div>
      </section>
    `,
    onMount(root) {
      const list = qs(root, '#products-list')
      const form = qs(root, '#product-form')
      const formSection = qs(root, '#product-form-section')
      const toggleFormBtn = qs(root, '#toggle-form-btn')
      const formTitle = qs(root, '#form-title')
      const submitText = qs(root, '#submit-text')
      const errorBox = qs(root, '#product-error')
      const errorText = qs(root, '#error-text')
      const typeSelect = qs(root, 'select[name="type"]')
      const colorsInput = qs(root, '#colors-input')
      const colorsHelp = root.querySelector('#colors-help')
      const clothingSizesSection = qs(root, '#sizes-clothing')
      const perfumeSizesSection = qs(root, '#sizes-perfume')
      const cancelBtn = qs(root, '#product-cancel')
      const fileInput = qs(root, '#file-input')
      const imageUrlsTextarea = qs(root, 'textarea[name="imageUrls"]')
      const imagePreviewsContainer = qs(root, '#image-previews')
      const dropzone = qs(root, '#dropzone')
      const clearImagesBtn = qs(root, '#clear-images')
      const existingColorsContainer = qs(root, '#existing-colors-container')

      let pendingDeleteId = null
      let isDeleteModalOpen = false
      let selectedColorBadges = new Set()
      let isEditing = false
      let selectedFiles = []

      let currentPage = 1
      const itemsPerPage = 50
      let currentSearchTerm = ''

      // ── Delete Confirm Modal ──
      const ensureDeleteModal = () => {
        let modal = document.getElementById('delete-confirm-modal')
        if (modal) return modal

        modal = document.createElement('div')
        modal.id = 'delete-confirm-modal'
        modal.className = 'fixed inset-0 z-50 hidden items-center justify-center bg-black/50 p-4'
        modal.innerHTML = `
          <div class="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100">
            <div class="p-5">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-base font-semibold text-gray-900">¿Eliminar producto?</h3>
                  <p class="text-sm text-gray-500 mt-1">Esta acción no se puede deshacer.</p>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 px-5 pb-5">
              <button type="button" id="delete-cancel" class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancelar</button>
              <button type="button" id="delete-confirm" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        `
        document.body.appendChild(modal)

        modal.querySelector('#delete-cancel').addEventListener('click', () => {
          pendingDeleteId = null
          isDeleteModalOpen = false
          modal.classList.add('hidden')
        })
        modal.querySelector('#delete-confirm').addEventListener('click', async () => {
          if (!pendingDeleteId) return
          const idToDelete = pendingDeleteId
          pendingDeleteId = null
          isDeleteModalOpen = false
          modal.classList.add('hidden')
          await deleteProduct(idToDelete)
        })
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            pendingDeleteId = null
            isDeleteModalOpen = false
            modal.classList.add('hidden')
          }
        })

        return modal
      }

      // ── Image Previews ──
      const renderPreviews = () => {
        const urlsStr = imageUrlsTextarea?.value.trim()
        const urls = urlsStr ? urlsStr.split(',').map(u => u.trim()).filter(Boolean) : []
        const urlItems = urls.map((url, i) => ({ kind: 'url', idx: i, src: url, label: `URL ${i + 1}` }))
        const fileItems = (selectedFiles || []).map((file, i) => ({ kind: 'file', idx: i, src: URL.createObjectURL(file), label: file.name || `Archivo ${i + 1}` }))
        const items = [...urlItems, ...fileItems].slice(0, 5)

        if (imagePreviewsContainer) {
          imagePreviewsContainer.innerHTML = items.map((item, i) => `
            <div class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
              <img src="${item.src}" alt="Preview ${i + 1}" class="w-full h-full object-cover"/>
              <div class="absolute top-1 right-1 flex gap-1">
                <button type="button" class="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm" data-remove-kind="${item.kind}" data-remove-idx="${item.idx}" title="Eliminar imagen">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div class="absolute bottom-1 left-1 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                ${i === 0 ? '<span class="font-bold">Portada</span>' : `<button type="button" class="underline" data-cover-kind="${item.kind}" data-cover-idx="${item.idx}">Marcar portada</button>`}
              </div>
              <div class="absolute bottom-1 right-1 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded">${item.label}</div>
            </div>
          `).join('')
        }
      }

      if (imageUrlsTextarea) imageUrlsTextarea.addEventListener('input', renderPreviews)

      if (imagePreviewsContainer) {
        on(imagePreviewsContainer, 'click', '[data-remove-kind]', (e, btn) => {
          e.preventDefault()
          const kind = btn.dataset.removeKind
          const idx = Number(btn.dataset.removeIdx)
          if (kind === 'url') {
            const urls = imageUrlsTextarea.value.trim().split(',').map(u => u.trim()).filter(Boolean)
            if (idx >= 0 && idx < urls.length) { urls.splice(idx, 1); imageUrlsTextarea.value = urls.join(', ') }
          } else if (kind === 'file') {
            selectedFiles = selectedFiles.filter((_f, i) => i !== idx)
            fileInput.value = ''
          }
          renderPreviews()
        })

        on(imagePreviewsContainer, 'click', '[data-cover-kind]', (e, btn) => {
          e.preventDefault()
          const kind = btn.dataset.coverKind
          const idx = Number(btn.dataset.coverIdx)
          if (kind === 'url') {
            const urls = imageUrlsTextarea.value.trim().split(',').map(u => u.trim()).filter(Boolean)
            if (idx >= 0 && idx < urls.length) { const [item] = urls.splice(idx, 1); urls.unshift(item); imageUrlsTextarea.value = urls.join(', ') }
          } else if (kind === 'file') {
            if (idx >= 0 && idx < selectedFiles.length) {
              const item = selectedFiles[idx]
              selectedFiles = [item, ...selectedFiles.filter((_f, i) => i !== idx)]
            }
          }
          renderPreviews()
        })
      }

      // ── Color Badges ──
      const updateColorBadges = () => {
        if (!existingColorsContainer) return
        existingColorsContainer.querySelectorAll('[data-color-badge]').forEach(badge => {
          const color = badge.dataset.colorBadge
          badge.classList.toggle('bg-brand', selectedColorBadges.has(color))
          badge.classList.toggle('text-white', selectedColorBadges.has(color))
          badge.classList.toggle('border-brand', selectedColorBadges.has(color))
          badge.classList.toggle('bg-gray-50', !selectedColorBadges.has(color))
          badge.classList.toggle('text-gray-600', !selectedColorBadges.has(color))
          badge.classList.toggle('border-gray-200', !selectedColorBadges.has(color))
        })
      }

      if (existingColorsContainer) {
        on(existingColorsContainer, 'click', '[data-color-badge]', (e, btn) => {
          e.preventDefault()
          const color = btn.dataset.colorBadge
          selectedColorBadges.has(color) ? selectedColorBadges.delete(color) : selectedColorBadges.add(color)
          updateColorBadges()
        })
      }

      // ── Type Change Handler ──
      const handleTypeChange = () => {
        const isPerfume = typeSelect?.value === 'Perfumes'
        if (clothingSizesSection) clothingSizesSection.classList.toggle('hidden', isPerfume)
        if (perfumeSizesSection) perfumeSizesSection.classList.toggle('hidden', !isPerfume)

        const clothingSizeInputs = root.querySelectorAll('input[name="sizes"][data-size-group="clothing"]')
        const perfumeSizeInputs = root.querySelectorAll('input[name="sizes"][data-size-group="perfume"]')
        if (isPerfume) { clothingSizeInputs.forEach(cb => { cb.checked = false }) }
        else { perfumeSizeInputs.forEach(cb => { cb.checked = false }) }

        if (colorsInput) {
          colorsInput.disabled = isPerfume
          colorsInput.placeholder = isPerfume ? 'No requerido para perfumes' : 'Otros colores... (separar por comas)'
          if (isPerfume) { colorsInput.value = ''; selectedColorBadges.clear(); updateColorBadges() }
        }
        if (colorsHelp) {
          colorsHelp.textContent = isPerfume ? 'Para perfumes el color no aplica.' : 'Puedes seleccionar de arriba o escribir nuevos.'
        }
      }

      // ── File Handling ──
      const handleFiles = (fileList) => {
        const urlsStr = imageUrlsTextarea?.value.trim()
        const urls = urlsStr ? urlsStr.split(',').map(u => u.trim()).filter(Boolean) : []
        const remaining = Math.max(0, 5 - urls.length)
        selectedFiles = Array.from(fileList || []).slice(0, remaining)
        if (remaining === 0) fileInput.value = ''
        renderPreviews()
      }

      // ── Error Handling ──
      const setError = (msg) => {
        if (!msg) { errorBox.classList.add('hidden'); errorText.textContent = ''; return }
        errorText.textContent = msg
        errorBox.classList.remove('hidden')
      }

      // ── Product List ──
      const renderList = (searchTerm = null, page = null) => {
        if (searchTerm !== null) currentSearchTerm = searchTerm
        if (page !== null) currentPage = page
        
        const term = currentSearchTerm.toLowerCase()
        const filtered = term
          ? state.products.filter(p =>
              p.name.toLowerCase().includes(term) ||
              p.type.toLowerCase().includes(term) ||
              (p.badge && p.badge.toLowerCase().includes(term))
            )
          : state.products

        const countEl = qs(root, '#products-count')
        if (countEl) {
          countEl.textContent = term
            ? `${filtered.length} de ${state.products.length} (Pág ${currentPage})`
            : `${state.products.length} en total (Pág ${currentPage})`
        }

        const paginationContainer = qs(root, '#pagination-controls')

        if (!filtered.length) {
          list.innerHTML = `
            <tr><td colspan="6">
            <div class="text-center py-16">
              <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">${term ? 'Sin resultados' : 'No hay productos'}</h3>
              <p class="text-sm text-gray-500">${term ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer producto usando el botón de arriba'}</p>
            </div>
            </td></tr>
          `
          if (paginationContainer) paginationContainer.innerHTML = ''
          return
        }

        const totalPages = Math.ceil(filtered.length / itemsPerPage)
        if (currentPage > totalPages) currentPage = totalPages
        if (currentPage < 1) currentPage = 1

        const startIdx = (currentPage - 1) * itemsPerPage
        const paginated = filtered.slice(startIdx, startIdx + itemsPerPage)

        list.innerHTML = paginated.map(productCard).join('')

        if (paginationContainer) {
          if (totalPages > 1) {
            paginationContainer.innerHTML = `
              <div class="text-sm text-gray-500 mb-4 sm:mb-0">
                Mostrando <span class="font-medium text-gray-900 dark:text-gray-100">${startIdx + 1}</span> a <span class="font-medium text-gray-900 dark:text-gray-100">${Math.min(startIdx + itemsPerPage, filtered.length)}</span> de <span class="font-medium text-gray-900 dark:text-gray-100">${filtered.length}</span> resultados
              </div>
              <div class="flex gap-2">
                <button type="button" id="btn-prev-page" class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed shadow-sm" ${currentPage === 1 ? 'disabled' : ''}>
                  Anterior
                </button>
                <button type="button" id="btn-next-page" class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed shadow-sm" ${currentPage === totalPages ? 'disabled' : ''}>
                  Siguiente
                </button>
              </div>
            `
          } else {
            paginationContainer.innerHTML = ''
          }
        }
      }

      // ── Form Show/Hide ──
      const showForm = (editing = false) => {
        isEditing = editing
        formSection.classList.remove('hidden')
        formSection.classList.add('flex')
        document.body.style.overflow = 'hidden'
        formTitle.textContent = editing ? 'Editar producto' : 'Añadir a la Colección'
        submitText.textContent = editing ? 'Guardar cambios' : 'Guardar en Colección'
        setError('')
      }

      const hideForm = (resetPage = false) => {
        isEditing = false
        formSection.classList.add('hidden')
        formSection.classList.remove('flex')
        document.body.style.overflow = ''
        form.reset()
        selectedFiles = []
        fileInput.value = ''
        selectedColorBadges.clear()
        handleTypeChange()
        updateColorBadges()
        renderPreviews()
        renderList(null, resetPage === true ? 1 : null)
      }

      // ── Init ──
      renderList()

      if (typeSelect) { typeSelect.addEventListener('change', handleTypeChange); handleTypeChange() }

      qs(root, '#search-products').addEventListener('input', (e) => renderList(e.target.value.trim(), 1))

      const paginationContainerObj = qs(root, '#pagination-controls')
      if (paginationContainerObj) {
        paginationContainerObj.addEventListener('click', (e) => {
          const btnPrev = e.target.closest('#btn-prev-page')
          const btnNext = e.target.closest('#btn-next-page')
          if (btnPrev && !btnPrev.disabled) {
            renderList(null, currentPage - 1)
          } else if (btnNext && !btnNext.disabled) {
            renderList(null, currentPage + 1)
          }
        })
      }

      fileInput.addEventListener('change', (e) => handleFiles(e.target.files))

      if (dropzone) {
        const setDropActive = (active) => {
          dropzone.classList.toggle('border-brand', active)
          dropzone.classList.toggle('bg-brand/5', active)
          dropzone.classList.toggle('border-gray-300', !active)
        }
        ;['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); setDropActive(true) }))
        ;['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); setDropActive(false) }))
        dropzone.addEventListener('drop', (ev) => { const dt = ev.dataTransfer; if (dt?.files?.length) handleFiles(dt.files) })
      }

      if (clearImagesBtn) {
        clearImagesBtn.addEventListener('click', (ev) => {
          ev.preventDefault()
          imageUrlsTextarea.value = ''
          selectedFiles = []
          fileInput.value = ''
          if (imagePreviewsContainer) imagePreviewsContainer.innerHTML = ''
          renderPreviews()
        })
      }

      toggleFormBtn.addEventListener('click', () => showForm(false))
      cancelBtn.addEventListener('click', hideForm)

      const modalCloseTop = root.querySelector('#modal-close-top')
      if (modalCloseTop) modalCloseTop.addEventListener('click', hideForm)

      formSection.addEventListener('click', (e) => {
        if (e.target === formSection) hideForm()
      })

      // Logout está ahora manejado globalmente por layout.js

      // ── Form Submit ──
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault()
        setError('')

        const idInput = qs(root, 'input[name="id"]')
        const name = qs(root, 'input[name="name"]').value.trim()
        const type = qs(root, 'select[name="type"]').value
        const isPerfume = type === 'Perfumes'
        const price = Number(qs(root, 'input[name="price"]').value || 0)
        const originalPrice = Number(qs(root, 'input[name="originalPrice"]').value || 0) || null
        const stock = Number(qs(root, 'input[name="stock"]').value || 0) || null
        const badge = qs(root, 'select[name="badge"]').value || null
        const sizes = Array.from(root.querySelectorAll('input[name="sizes"]:checked')).map(cb => cb.value)
        const customColorsParts = parseList(qs(root, 'input[name="customColors"]').value)
        const colors = isPerfume ? [] : Array.from(new Set([...selectedColorBadges, ...customColorsParts]))
        const imageUrlsRaw = qs(root, 'textarea[name="imageUrls"]').value.trim()
        let imageUrls = imageUrlsRaw ? imageUrlsRaw.split(',').map(u => u.trim()).filter(Boolean) : []

        if (!name) return setError('Ingresa el nombre del producto.')
        if (!type) return setError('Selecciona la categoría del producto.')
        if (!Number.isFinite(price) || price <= 0) return setError('Ingresa un precio válido mayor a 0.')
        if (!sizes.length) return setError(isPerfume ? 'Selecciona una capacidad para el perfume.' : 'Selecciona al menos una talla.')
        if (!isPerfume && !colors.length) return setError('Ingresa al menos un color.')

        const submitBtn = qs(root, 'button[type="submit"]')
        const originalBtnText = submitBtn.innerHTML
        submitBtn.disabled = true
        submitBtn.innerHTML = '<span class="animate-spin">⌛</span> Subiendo & Guardando...'

        try {
          if (selectedFiles && selectedFiles.length > 0) {
            const existingUrls = imageUrlsTextarea?.value.trim().split(',').map(u => u.trim()).filter(Boolean) || []
            const filesToUpload = selectedFiles.slice(0, Math.max(0, 5 - existingUrls.length))
            for (const file of filesToUpload) {
              const { publicUrl, error: uploadError } = await uploadProductImage(file)
              if (uploadError) throw new Error('Error al subir imagen: ' + uploadError.message)
              imageUrls.push(publicUrl)
            }
          }

          const images = imageUrls.slice(0, 5)
          if (idInput.value) {
            const { error } = await updateProduct(idInput.value, { name, type, price, originalPrice, stock, badge, sizes, colors, images })
            if (error) throw new Error('Error al actualizar: ' + error.message)
          } else {
            const { error } = await addProduct({ name, type, price, originalPrice, stock, badge, sizes, colors, images })
            if (error) throw new Error('Error al crear: ' + error.message)
          }
          hideForm(true)
        } catch (err) {
          console.error(err)
          setError(err.message || 'Error al guardar. Revisa la consola.')
        } finally {
          submitBtn.disabled = false
          submitBtn.innerHTML = originalBtnText
        }
      })

      // ── Edit Product ──
      on(root, 'click', '[data-edit]', (_ev, btn) => {
        const id = btn.closest('[data-product]')?.getAttribute('data-id')
        if (!id) return
        const product = state.products.find(p => p.id === id)
        if (!product) return

        showForm(true)
        qs(root, 'input[name="id"]').value = product.id
        qs(root, 'input[name="name"]').value = product.name
        qs(root, 'select[name="type"]').value = product.type
        handleTypeChange()
        qs(root, 'input[name="price"]').value = product.price
        if (product.originalPrice) qs(root, 'input[name="originalPrice"]').value = product.originalPrice
        if (product.stock) qs(root, 'input[name="stock"]').value = product.stock
        if (product.badge) qs(root, 'select[name="badge"]').value = product.badge

        imageUrlsTextarea.value = product.images?.length ? product.images.join(', ') : ''
        selectedFiles = []
        renderPreviews()

        root.querySelectorAll('input[name="sizes"]').forEach(cb => {
          cb.checked = (product.sizes || []).includes(cb.value)
        })

        selectedColorBadges.clear()
        const customParts = []
        ;(product.colors || []).forEach(c => {
          if (allColors.includes(c)) { selectedColorBadges.add(c) } else { customParts.push(c) }
        })
        updateColorBadges()
        qs(root, 'input[name="customColors"]').value = customParts.join(', ')
      })

      // ── Delete Product ──
      on(root, 'click', '[data-delete]', async (_ev, btn) => {
        const id = btn.closest('[data-product]')?.getAttribute('data-id')
        if (!id || isDeleteModalOpen) return
        isDeleteModalOpen = true
        pendingDeleteId = id
        const modal = ensureDeleteModal()
        modal.classList.remove('hidden')
      })
    },
  }
}
