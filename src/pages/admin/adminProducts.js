import { adminLogout, addProduct, updateProduct, deleteProduct, uploadProductImage, getCategoryNames } from '../../store/index.js'
import { navigate } from '../../core/router.js'
import { on, qs } from '../../utils/dom.js'
import { showToast } from '../../utils/toast.js'
import { parseList, isPerfumeCategory } from './adminProductsData.js'
import { productCard, productCardMobile } from './adminProductCard.js'
import { productFormHTML } from './adminProductForm.js'
import { ICON } from './adminIcons.js'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE_MB   = 5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

const TOGGLE_PUBLISH_HANDLER_KEY = '__glAdminTogglePublishHandler'
const ADMIN_PRODUCTS_STATE_KEY = 'gl_admin_products_state'

function readAdminProductsState(allTypes) {
  try {
    const raw = sessionStorage.getItem(ADMIN_PRODUCTS_STATE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const allowedStatus = new Set(['all', 'published', 'draft'])
    const allowedStock = new Set(['all', 'in-stock', 'low', 'out', 'infinite'])
    const savedFilters = parsed?.filters || {}

    return {
      searchTerm: typeof parsed?.searchTerm === 'string' ? parsed.searchTerm : '',
      currentPage: Number.isFinite(parsed?.currentPage) && parsed.currentPage > 0 ? parsed.currentPage : 1,
      filters: {
        type: typeof savedFilters.type === 'string' && (savedFilters.type === 'all' || allTypes.includes(savedFilters.type)) ? savedFilters.type : 'all',
        status: typeof savedFilters.status === 'string' && allowedStatus.has(savedFilters.status) ? savedFilters.status : 'all',
        stock: typeof savedFilters.stock === 'string' && allowedStock.has(savedFilters.stock) ? savedFilters.stock : 'all',
      },
    }
  } catch {
    return null
  }
}

function saveAdminProductsState(state) {
  try {
    sessionStorage.setItem(ADMIN_PRODUCTS_STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

export function pageAdminProducts(state) {
  const productCount = state.products.length
  const allTypes = [...new Set(state.products.map(p => (p.type || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
  
  // Extract unique colors from all products (passed to form for quick-select badges)
  const allColors = [...new Set(state.products.flatMap(p => p.colors || []).map(c => c.trim()))].sort()

  // Get dynamic categories from DB (falls back to hardcoded in the form)
  const dynamicCategories = getCategoryNames()

  const isInfStock = (s) => s === undefined || s === null || s === '' || s === '∞'
  const lowStockCount = state.products.filter(p => !isInfStock(p.stock) && Number(p.stock) > 0 && Number(p.stock) <= 10).length
  const outStockCount = state.products.filter(p => !isInfStock(p.stock) && Number(p.stock) <= 0).length

  return {
    title: 'Productos | Admin G&L',
    html: `
      <div class="admin-view-in space-y-5">
        <!-- Header: KPIs + Add button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="grid grid-cols-3 gap-2.5 flex-1 max-w-2xl">
            <div class="bg-paper rounded-xl2 border border-line px-4 py-3">
              <p class="eyebrow text-faint">Catálogo</p>
              <p class="font-display font-bold text-ink text-[20px] tnum mt-0.5">${productCount}</p>
            </div>
            <div class="bg-paper rounded-xl2 border border-line px-4 py-3">
              <p class="eyebrow text-faint">Bajo stock</p>
              <p class="font-display font-bold text-warn text-[20px] tnum mt-0.5">${lowStockCount}</p>
            </div>
            <div class="bg-paper rounded-xl2 border border-line px-4 py-3">
              <p class="eyebrow text-faint">Agotados</p>
              <p class="font-display font-bold text-bad text-[20px] tnum mt-0.5">${outStockCount}</p>
            </div>
          </div>
          <button type="button" id="toggle-form-btn" class="adm-btn adm-btn-primary shrink-0">
            ${ICON.plus('w-[18px] h-[18px]')}
            <span id="toggle-form-text">Agregar producto</span>
          </button>
        </div>

        <!-- Table card -->
        <section class="bg-paper rounded-3xl border border-line shadow-card">
          <!-- Toolbar -->
          <div class="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-line">
            <div class="relative flex-1 min-w-0">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none">${ICON.search('w-[18px] h-[18px]')}</span>
              <input id="search-products" type="text" class="adm-fld pl-10" placeholder="Buscar producto..." />
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <select id="filter-type" class="adm-fld w-auto min-w-[120px]">
                <option value="all">Categoría</option>
                ${allTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
              </select>
              <select id="filter-status" class="adm-fld w-auto min-w-[110px]">
                <option value="all">Estado</option>
                <option value="published">Publicados</option>
                <option value="draft">Borradores</option>
              </select>
              <select id="filter-stock" class="adm-fld w-auto min-w-[110px]">
                <option value="all">Stock</option>
                <option value="in-stock">Con stock</option>
                <option value="low">Bajo stock</option>
                <option value="out">Agotados</option>
                <option value="infinite">Infinito</option>
              </select>
              <button type="button" id="clear-filters" class="w-9 h-9 rounded-[10px] border border-line bg-paper flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors shrink-0" title="Limpiar filtros">
                ${ICON.close('w-4 h-4')}
              </button>
            </div>
          </div>

          <!-- Desktop Table -->
          <div class="hidden md:block overflow-x-auto adm-scroll-thin">
            <table class="w-full min-w-[680px]">
              <thead>
                <tr class="text-left">
                  <th class="eyebrow text-faint font-medium px-5 py-3">Producto</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3">Categoría</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3 text-right">Precio</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3">Stock</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3">Estado</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody id="products-list"></tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div id="products-mobile" class="md:hidden divide-y divide-line"></div>

          <!-- Pagination -->
          <div class="px-5 py-3 border-t border-line flex items-center justify-between text-[12.5px] text-muted min-h-[48px]">
            <span id="products-count" class="tnum">${productCount} en total</span>
            <div id="pagination-controls" class="flex gap-2"></div>
          </div>
        </section>
      </div>

      ${productFormHTML(allColors, dynamicCategories)}
    `,
    onMount(root) {
      const list = qs(root, '#products-list')
      const mobileContainer = qs(root, '#products-mobile')
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
      let savedScrollPos = 0

      const savedState = readAdminProductsState(allTypes)

      let currentPage = savedState?.currentPage || 1
      const itemsPerPage = 50
      let currentSearchTerm = savedState?.searchTerm || ''
      let currentFilters = savedState?.filters || {
        type: 'all',
        status: 'all',
        stock: 'all',
      }

      const searchInput = qs(root, '#search-products')
      const filterTypeEl = qs(root, '#filter-type')
      const filterStatusEl = qs(root, '#filter-status')
      const filterStockEl = qs(root, '#filter-stock')
      const clearFiltersBtn = qs(root, '#clear-filters')

      const persistViewState = () => {
        saveAdminProductsState({
          searchTerm: currentSearchTerm,
          currentPage,
          filters: currentFilters,
        })
      }

      const isInfiniteStock = (stock) => stock === undefined || stock === null || stock === '' || stock === '∞'
      const stockAsNumber = (stock) => {
        const n = Number(stock)
        return Number.isFinite(n) ? n : 0
      }

      // ── Delete Confirm Modal ──
      const ensureDeleteModal = () => {
        let modal = document.getElementById('delete-confirm-modal')
        if (modal) return modal

        modal = document.createElement('div')
        modal.id = 'delete-confirm-modal'
        modal.className = 'fixed inset-0 layer-modal hidden items-center justify-center bg-ink/50 backdrop-blur-sm p-4'
        modal.innerHTML = `
          <div class="w-full max-w-sm bg-paper rounded-3xl border border-line shadow-pop overflow-hidden adm-anim-pop">
            <div class="p-5">
              <div class="w-11 h-11 rounded-xl2 bg-bad-tint text-bad flex items-center justify-center mb-3">${ICON.trash('w-5 h-5')}</div>
              <h3 class="font-display font-bold text-ink text-[17px]">¿Eliminar producto?</h3>
              <p class="text-[13.5px] text-muted mt-1">Esta acción no se puede deshacer.</p>
            </div>
            <div class="px-5 pb-5 flex gap-2.5">
              <button type="button" id="delete-cancel" class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
              <button type="button" id="delete-confirm" class="adm-btn flex-1" style="background:#D6453E;color:#fff">Eliminar</button>
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
            <div class="relative aspect-square rounded-[10px] overflow-hidden bg-canvas border border-line group">
              <img src="${item.src}" alt="Preview ${i + 1}" class="w-full h-full object-cover"/>
              <div class="absolute top-1 right-1 z-10">
                <button type="button" class="w-6 h-6 rounded-full bg-bad text-white flex items-center justify-center hover:bg-bad/80 transition-colors shadow-sm" data-remove-kind="${item.kind}" data-remove-idx="${item.idx}" title="Eliminar">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div class="absolute top-1 left-1 bg-ink/60 text-white text-[9px] px-1.5 py-0.5 rounded max-w-[calc(100%-2rem)] truncate backdrop-blur-sm">${item.label}</div>
              <div class="absolute bottom-0 left-0 right-0 bg-ink/60 text-white text-[10px] px-1.5 py-1 text-center backdrop-blur-sm">
                ${i === 0 ? '<span class="font-bold">Portada</span>' : `<button type="button" class="underline hover:text-brand-tint w-full" data-cover-kind="${item.kind}" data-cover-idx="${item.idx}">Marcar portada</button>`}
              </div>
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
          badge.classList.toggle('bg-canvas', !selectedColorBadges.has(color))
          badge.classList.toggle('text-body', !selectedColorBadges.has(color))
          badge.classList.toggle('border-line', !selectedColorBadges.has(color))
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
        const isPerfume = isPerfumeCategory(typeSelect?.value)
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

      // ── Image Compression Helper ──
      const compressImage = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.8) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          const url = URL.createObjectURL(file)
          img.onload = () => {
            URL.revokeObjectURL(url)
            let { width, height } = img

            // Scale down if larger than max dimensions
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height)
              width = Math.round(width * ratio)
              height = Math.round(height * ratio)
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error('Compression failed'))
                // Create a new File from the blob, preserving a clean name
                const ext = '.webp'
                const baseName = file.name.replace(/\.[^.]+$/, '')
                const compressedFile = new File([blob], baseName + ext, { type: 'image/webp' })
                resolve(compressedFile)
              },
              'image/webp',
              quality
            )
          }
          img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')) }
          img.src = url
        })
      }

      // ── File Handling ──
      const handleFiles = async (fileList) => {
        const urlsStr = imageUrlsTextarea?.value.trim()
        const urls = urlsStr ? urlsStr.split(',').map(u => u.trim()).filter(Boolean) : []

        const validFiles = []
        const invalid = []
        const toCompress = []

        Array.from(fileList || []).forEach(file => {
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            invalid.push(`${file.name}: tipo no permitido`)
          } else if (file.size > MAX_IMAGE_SIZE_BYTES) {
            toCompress.push(file) // Will auto-compress instead of rejecting
          } else {
            validFiles.push(file)
          }
        })

        if (invalid.length) {
          showToast(invalid.join(' | '), 'error')
        }

        // Auto-compress oversized images
        if (toCompress.length) {
          showToast(`Comprimiendo ${toCompress.length} imagen(es) grande(s)...`, 'info')
          for (const file of toCompress) {
            try {
              const compressed = await compressImage(file)
              if (compressed.size > MAX_IMAGE_SIZE_BYTES) {
                // Try again with lower quality
                const recompressed = await compressImage(file, 800, 800, 0.6)
                if (recompressed.size > MAX_IMAGE_SIZE_BYTES) {
                  invalid.push(`${file.name}: sigue siendo muy grande después de comprimir`)
                  continue
                }
                validFiles.push(recompressed)
              } else {
                validFiles.push(compressed)
              }
            } catch (err) {
              invalid.push(`${file.name}: error al comprimir`)
            }
          }
          if (invalid.length) showToast(invalid.join(' | '), 'error')
        }

        const remaining = Math.max(0, 5 - (urls.length + selectedFiles.length))
        selectedFiles = [...selectedFiles, ...validFiles.slice(0, remaining)]
        fileInput.value = ''
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
        const filtered = state.products.filter(p => {
          const matchesTerm = !term
            || p.name.toLowerCase().includes(term)
            || p.type.toLowerCase().includes(term)
            || (p.badge && p.badge.toLowerCase().includes(term))

          const matchesType = currentFilters.type === 'all' || p.type === currentFilters.type

          const isPublished = p.badge !== 'Borrador'
          const matchesStatus = currentFilters.status === 'all'
            || (currentFilters.status === 'published' && isPublished)
            || (currentFilters.status === 'draft' && !isPublished)

          const infinite = isInfiniteStock(p.stock)
          const qty = stockAsNumber(p.stock)
          const matchesStock = currentFilters.stock === 'all'
            || (currentFilters.stock === 'infinite' && infinite)
            || (currentFilters.stock === 'in-stock' && (infinite || qty > 0))
            || (currentFilters.stock === 'low' && (!infinite && qty > 0 && qty <= 10))
            || (currentFilters.stock === 'out' && (!infinite && qty <= 0))

          return matchesTerm && matchesType && matchesStatus && matchesStock
        })

        const hasActiveFilters = Boolean(term)
          || currentFilters.type !== 'all'
          || currentFilters.status !== 'all'
          || currentFilters.stock !== 'all'

        const countEl = qs(root, '#products-count')
        if (countEl) {
          countEl.textContent = hasActiveFilters
            ? `${filtered.length} de ${state.products.length} (Pág ${currentPage})`
            : `${state.products.length} en total (Pág ${currentPage})`
        }

        const paginationContainer = qs(root, '#pagination-controls')

        if (!filtered.length) {
          const emptyState = `
            <div class="py-16 text-center">
              ${ICON.products('w-12 h-12 mx-auto mb-4 text-line-strong')}
              <p class="font-semibold text-body">${hasActiveFilters ? 'Sin resultados' : 'No hay productos'}</p>
              <p class="text-[13px] text-muted mt-1">${hasActiveFilters ? 'Ajusta los filtros o la búsqueda' : 'Agrega tu primer producto con el botón de arriba'}</p>
            </div>
          `
          list.innerHTML = `<tr><td colspan="6" class="px-0 py-0">${emptyState}</td></tr>`
          mobileContainer.innerHTML = emptyState
          if (paginationContainer) paginationContainer.innerHTML = ''
          persistViewState()
          return
        }

        const totalPages = Math.ceil(filtered.length / itemsPerPage)
        if (currentPage > totalPages) currentPage = totalPages
        if (currentPage < 1) currentPage = 1

        const startIdx = (currentPage - 1) * itemsPerPage
        const paginated = filtered.slice(startIdx, startIdx + itemsPerPage)

        list.innerHTML = paginated.map(productCard).join('')
        mobileContainer.innerHTML = paginated.map(productCardMobile).join('')

        if (paginationContainer) {
          if (totalPages > 1) {
            paginationContainer.innerHTML = `
              <button type="button" id="btn-prev-page" class="adm-btn adm-btn-ghost py-1.5 px-3 text-[12px] disabled:opacity-40 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}>
                Anterior
              </button>
              <button type="button" id="btn-next-page" class="adm-btn adm-btn-ghost py-1.5 px-3 text-[12px] disabled:opacity-40 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}>
                Siguiente
              </button>
            `
          } else {
            paginationContainer.innerHTML = ''
          }
        }

        persistViewState()
      }

      // ── Form Show/Hide ──
      const showForm = (editing = false) => {
        savedScrollPos = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
        isEditing = editing
        formSection.classList.remove('hidden')
        formSection.classList.add('flex')
        document.body.style.overflow = 'hidden'
        formTitle.textContent = editing ? 'Editar producto' : 'Nuevo Producto'
        const freshSubmitText = qs(root, '#submit-text')
        if (freshSubmitText) freshSubmitText.textContent = editing ? 'Guardar cambios' : 'Guardar'
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
        
        // Restore scroll position
        const restore = () => {
          window.scrollTo({ top: savedScrollPos, behavior: 'instant' })
          document.documentElement.scrollTop = savedScrollPos
          document.body.scrollTop = savedScrollPos
        }
        requestAnimationFrame(restore)
        setTimeout(restore, 10)
        setTimeout(restore, 50)
        setTimeout(restore, 150)
      }

      // ── Init ──
      if (searchInput) searchInput.value = currentSearchTerm
      if (filterTypeEl) filterTypeEl.value = currentFilters.type
      if (filterStatusEl) filterStatusEl.value = currentFilters.status
      if (filterStockEl) filterStockEl.value = currentFilters.stock

      renderList()

      if (typeSelect) { typeSelect.addEventListener('change', handleTypeChange); handleTypeChange() }

      searchInput.addEventListener('input', (e) => renderList(e.target.value.trim(), 1))

      const applyFilters = () => {
        currentFilters = {
          type: filterTypeEl?.value || 'all',
          status: filterStatusEl?.value || 'all',
          stock: filterStockEl?.value || 'all',
        }
        renderList(null, 1)
      }

      filterTypeEl?.addEventListener('change', applyFilters)
      filterStatusEl?.addEventListener('change', applyFilters)
      filterStockEl?.addEventListener('change', applyFilters)

      clearFiltersBtn?.addEventListener('click', () => {
        currentFilters = { type: 'all', status: 'all', stock: 'all' }
        if (filterTypeEl) filterTypeEl.value = 'all'
        if (filterStatusEl) filterStatusEl.value = 'all'
        if (filterStockEl) filterStockEl.value = 'all'

        const searchInput = qs(root, '#search-products')
        if (searchInput) searchInput.value = ''

        renderList('', 1)
      })

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
          dropzone.classList.toggle('bg-brand-tint-2', active)
          dropzone.classList.toggle('border-line-strong', !active)
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
        const isPerfume = isPerfumeCategory(type)
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
            hideForm(false) // Do not reset pagination for updates
          } else {
            // Clear persisted filters/search BEFORE addProduct, because addProduct
            // calls emit() which re-renders the page. The re-render reads
            // sessionStorage to restore filters — if stale filters are present,
            // the new product may be filtered out and appear "not created".
            sessionStorage.removeItem(ADMIN_PRODUCTS_STATE_KEY)
            currentSearchTerm = ''
            currentFilters = { type: 'all', status: 'all', stock: 'all' }
            currentPage = 1

            const { error } = await addProduct({ name, type, price, originalPrice, stock, badge, sizes, colors, images })
            if (error) throw new Error('Error al crear: ' + error.message)
            hideForm(true) // Reset pagination to view the newly added product
          }

        } catch (err) {
          console.error(err)
          const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted')
          setError(isAbort ? 'La conexión se interrumpió brevemente. Intenta hacer clic en Guardar de nuevo.' : (err?.message || 'Error al guardar. Revisa la consola.'))
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

      // ── Toggle Status (single listener, avoids duplicate toasts) ──
      const prevToggleHandler = root[TOGGLE_PUBLISH_HANDLER_KEY]
      if (typeof prevToggleHandler === 'function') {
        root.removeEventListener('change', prevToggleHandler)
      }

      const togglePublishHandler = async (e) => {
        const target = e.target
        if (!(target instanceof Element)) return
        const input = target.closest('input[data-toggle-publish]')
        if (!input) return

        const container = input.closest('[data-product]')
        const id = container?.getAttribute('data-id')
        if (!id) return

        const isPublished = input.checked
        const badge = isPublished ? '' : 'Borrador'

        // Update visual immediately
        const toggleEl = container?.querySelector('.gl-toggle')
        const statusLabel = container?.querySelector('[data-status-label]')
        if (toggleEl) toggleEl.classList.toggle('on', isPublished)
        if (statusLabel) {
          statusLabel.textContent = isPublished ? 'Publicado' : 'Borrador'
          statusLabel.className = `text-[12.5px] font-medium ${isPublished ? 'text-ink' : 'text-muted'}`
        }

        try {
          const { error } = await updateProduct(id, { badge })
          if (error) throw new Error(error.message)
          showToast('Estado actualizado', 'success')
        } catch (_err) {
          // Revert on error
          input.checked = !isPublished
          if (toggleEl) toggleEl.classList.toggle('on', !isPublished)
          if (statusLabel) {
            statusLabel.textContent = !isPublished ? 'Publicado' : 'Borrador'
            statusLabel.className = `text-[12.5px] font-medium ${!isPublished ? 'text-ink' : 'text-muted'}`
          }
          showToast('Error al actualizar estado', 'error')
        }
      }

      root[TOGGLE_PUBLISH_HANDLER_KEY] = togglePublishHandler
      root.addEventListener('change', togglePublishHandler)
    },
  }
}
