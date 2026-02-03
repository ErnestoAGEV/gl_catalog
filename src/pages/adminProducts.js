import { adminLogout, addProduct, updateProduct, deleteProduct, uploadProductImage } from '../app/store.js'
import { navigate } from '../app/router.js'
import { formatMoney } from '../app/format.js'
import { on, qs } from '../app/dom.js'

function parseList(value) {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

const BADGE_OPTIONS = [
  { value: '', label: 'Sin badge', color: 'bg-gray-500' },
  { value: 'Nuevo', label: 'Nuevo', color: 'bg-blue-500' },
  { value: 'Oferta', label: 'Oferta', color: 'bg-red-500' },
  { value: 'Popular', label: 'Popular', color: 'bg-amber-500' },
  { value: 'Premium', label: 'Premium', color: 'bg-purple-500' },
]

const CATEGORY_OPTIONS = [
  'Camisas',
  'Playeras',
  'Polos',
  'Pantalones',
  'Shorts',
  'Sudaderas',
  'Suéteres',
  'Chamarras',
  'Abrigos',
  'Perfumes',
]

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const PANTS_SIZE_OPTIONS = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52']

function getBadgeColor(badge) {
  const found = BADGE_OPTIONS.find(b => b.value === badge)
  return found?.color || 'bg-gray-500'
}

function productCard(p) {
  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop'
  
  return `
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all" data-product data-id="${p.id}">
      <div class="flex gap-4 p-4">
        <!-- Image -->
        <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img src="${img}" alt="${p.name}" class="w-full h-full object-cover"/>
        </div>
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">${p.name}</h3>
              <p class="text-sm text-gray-500">${p.type}</p>
            </div>
            <div class="flex items-center gap-1">
              ${p.badge ? `<span class="px-2 py-0.5 text-[10px] font-bold ${getBadgeColor(p.badge)} text-white rounded-md">${p.badge}</span>` : ''}
            </div>
          </div>
          
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-bold text-gray-900">${formatMoney(p.price)}</span>
              ${p.originalPrice ? `<span class="text-sm text-gray-400 line-through">${formatMoney(p.originalPrice)}</span>` : ''}
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs text-gray-500">Stock: ${p.stock || '∞'}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>${(p.sizes || []).join(', ')}</span>
            <span>•</span>
            <span>${(p.colors || []).join(', ')}</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex border-t border-gray-100">
        <button type="button" class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-brand hover:bg-gray-50 transition-colors" data-edit>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Editar
        </button>
        <button type="button" class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors border-l border-gray-100" data-delete>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>
    </div>
  `
}

export function pageAdminProducts(state) {
  const productCount = state.products.length
  const badgeOptions = BADGE_OPTIONS.map(b => 
    `<option value="${b.value}">${b.label}</option>`
  ).join('')
  const categoryOptions = CATEGORY_OPTIONS.map(c => 
    `<option value="${c}">${c}</option>`
  ).join('')
  
  return {
    title: 'Productos | Admin G&L',
    html: `
      <!-- Header -->
      <section class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p class="text-sm text-gray-500 mt-1">${productCount} productos en catálogo</p>
          </div>
          <button type="button" id="admin-logout-btn" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </section>

      <!-- Add Product Button -->
      <button type="button" id="toggle-form-btn" class="w-full mb-6 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-brand text-white font-semibold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        <span id="toggle-form-text">Agregar nuevo producto</span>
      </button>

      <!-- Form (hidden by default) -->
      <section id="product-form-section" class="hidden mb-6">
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="p-5 border-b border-gray-100">
            <h2 id="form-title" class="text-lg font-bold text-gray-900">Nuevo producto</h2>
            <p class="text-sm text-gray-500">Completa la información del producto</p>
          </div>
          
          <form id="product-form" class="p-5 space-y-5" novalidate>
            <input type="hidden" name="id" />

            <!-- Image Upload (Multiple) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Imágenes del producto (máx. 5)
              </label>
              
              <!-- Image Previews Gallery -->
              <div id="image-previews" class="grid grid-cols-5 gap-2 mb-3"></div>
              
              <div class="space-y-3">
                <!-- File Input (Multiple) -->
                <div>
                  <input type="file" id="file-input" accept="image/*" multiple class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-brand/10 file:text-brand
                    hover:file:bg-brand/20
                  "/>
                  <p class="text-xs text-gray-500 mt-1">Sube hasta 5 imágenes desde tu dispositivo (JPG, PNG)</p>
                </div>
                
                <div class="relative">
                  <div class="absolute inset-0 flex items-center" aria-hidden="true">
                    <div class="w-full border-t border-gray-200"></div>
                  </div>
                  <div class="relative flex justify-center">
                    <span class="bg-white px-2 text-xs text-gray-400">O pega URLs</span>
                  </div>
                </div>

                <!-- URL Fallback (Multiple URLs separated by commas) -->
                <textarea name="imageUrls" rows="2" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors resize-none" placeholder="https://..., https://..., https://... (separa con comas)"></textarea>
                <p class="text-xs text-gray-500">Pega múltiples URLs separadas por comas. La primera imagen será la portada.</p>
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del producto *
              </label>
              <input name="name" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Ej: Camisa Oxford Premium" />
            </div>

            <!-- Type & Badge -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <div class="relative">
                  <select name="type" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors appearance-none">
                    <option value="">Selecciona categoría...</option>
                    ${categoryOptions}
                  </select>
                  <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Badge / Etiqueta
                </label>
                <div class="relative">
                  <select name="badge" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors appearance-none">
                    ${badgeOptions}
                  </select>
                  <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>

            <!-- Price & Original Price -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Precio *
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input name="price" type="number" min="0" inputmode="numeric" class="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="849" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Precio original <span class="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input name="originalPrice" type="number" min="0" inputmode="numeric" class="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="999 (para mostrar descuento)" />
                </div>
              </div>
            </div>

            <!-- Stock -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Stock disponible <span class="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input name="stock" type="number" min="0" inputmode="numeric" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Ej: 10 (deja vacío para ilimitado)" />
              <p class="text-xs text-gray-500 mt-1.5">Si el stock es 5 o menos, se mostrará "¡Últimas piezas!"</p>
            </div>

            <!-- Sizes & Colors -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tallas disponibles *
                </label>
                <p class="text-xs text-gray-500 mb-3">Tallas de ropa</p>
                <div class="flex flex-wrap gap-2" id="sizes-container">
                  ${SIZE_OPTIONS.map(size => `
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" />
                      <span class="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 cursor-pointer peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand hover:border-gray-300 transition-colors">${size}</span>
                    </label>
                  `).join('')}
                </div>
                <p class="text-xs text-gray-500 mt-3 mb-2">Tallas de pantalones</p>
                <div class="flex flex-wrap gap-2">
                  ${PANTS_SIZE_OPTIONS.map(size => `
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" />
                      <span class="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 cursor-pointer peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand hover:border-gray-300 transition-colors">${size}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Colores disponibles *
                </label>
                <input name="colors" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Negro, Blanco, Azul" />
              </div>
            </div>

            <!-- Error -->
            <div id="product-error" class="hidden rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 flex items-center gap-2">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span id="error-text"></span>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button type="submit" class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-dark active:scale-[0.98] transition-all shadow-lg shadow-brand/25">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span id="submit-text">Guardar producto</span>
              </button>
              <button type="button" id="product-cancel" class="px-6 py-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>

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
        
        <div id="products-list" class="grid gap-4 md:grid-cols-2"></div>
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
      const cancelBtn = qs(root, '#product-cancel')
      const fileInput = qs(root, '#file-input')
      const imageUrlsTextarea = qs(root, 'textarea[name="imageUrls"]')
      const imagePreviewsContainer = qs(root, '#image-previews')

      // Image Preview Logic (combines URLs + archivos locales, permite mover portada y eliminar)
      const renderPreviews = () => {
        const urlsStr = imageUrlsTextarea?.value.trim()
        const urls = urlsStr ? urlsStr.split(',').map(u => u.trim()).filter(Boolean) : []

        const urlItems = urls.map((url, i) => ({ kind: 'url', idx: i, src: url, label: `URL ${i + 1}` }))
        const fileItems = (selectedFiles || []).map((file, i) => ({ kind: 'file', idx: i, src: URL.createObjectURL(file), label: file.name || `Archivo ${i + 1}` }))

        // Mostrar máximo 5 combinando ambos
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

      // Initial listeners
      if (imageUrlsTextarea) imageUrlsTextarea.addEventListener('input', renderPreviews)
      
      if (imagePreviewsContainer) {
        // Eliminar imagen (URL o archivo local)
        on(imagePreviewsContainer, 'click', '[data-remove-kind]', (e, btn) => {
          e.preventDefault()
          const kind = btn.dataset.removeKind
          const idx = Number(btn.dataset.removeIdx)

          if (kind === 'url') {
            const urlsStr = imageUrlsTextarea.value.trim()
            const urls = urlsStr ? urlsStr.split(',').map(u => u.trim()).filter(Boolean) : []
            if (idx >= 0 && idx < urls.length) {
              urls.splice(idx, 1)
              imageUrlsTextarea.value = urls.join(', ')
            }
          } else if (kind === 'file') {
            selectedFiles = selectedFiles.filter((_f, i) => i !== idx)
            fileInput.value = '' // permite volver a seleccionar el mismo archivo si se desea
          }
          renderPreviews()
        })

        // Marcar como portada (mover al inicio de la lista)
        on(imagePreviewsContainer, 'click', '[data-cover-kind]', (e, btn) => {
          e.preventDefault()
          const kind = btn.dataset.coverKind
          const idx = Number(btn.dataset.coverIdx)

          if (kind === 'url') {
            const urlsStr = imageUrlsTextarea.value.trim()
            const urls = urlsStr ? urlsStr.split(',').map(u => u.trim()).filter(Boolean) : []
            if (idx >= 0 && idx < urls.length) {
              const [item] = urls.splice(idx, 1)
              urls.unshift(item)
              imageUrlsTextarea.value = urls.join(', ')
            }
          } else if (kind === 'file') {
            if (idx >= 0 && idx < selectedFiles.length) {
              const item = selectedFiles[idx]
              selectedFiles = [item, ...selectedFiles.filter((_f, i) => i !== idx)]
            }
          }
          renderPreviews()
        })
      }

      let isEditing = false
      let selectedFiles = [] // Multiple archivos locales

      const setError = (msg) => {
        if (!msg) {
          errorBox.classList.add('hidden')
          errorText.textContent = ''
          return
        }
        errorText.textContent = msg
        errorBox.classList.remove('hidden')
      }

      const renderList = (searchTerm = '') => {
        const filtered = searchTerm 
          ? state.products.filter(p => 
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (p.badge && p.badge.toLowerCase().includes(searchTerm.toLowerCase()))
            )
          : state.products

        // Update count
        const countEl = qs(root, '#products-count')
        if (countEl) {
          countEl.textContent = searchTerm 
            ? `${filtered.length} de ${state.products.length} productos`
            : `${state.products.length} en total`
        }

        if (!filtered.length) {
          list.innerHTML = `
            <div class="col-span-full text-center py-16">
              <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">${searchTerm ? 'Sin resultados' : 'No hay productos'}</h3>
              <p class="text-sm text-gray-500">${searchTerm ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer producto usando el botón de arriba'}</p>
            </div>
          `
          return
        }

        list.innerHTML = filtered.map(productCard).join('')
      }

      const showForm = (editing = false) => {
        isEditing = editing
        formSection.classList.remove('hidden')
        toggleFormBtn.classList.add('hidden')
        formTitle.textContent = editing ? 'Editar producto' : 'Nuevo producto'
        submitText.textContent = editing ? 'Guardar cambios' : 'Guardar producto'
        setError('')
      }

      const hideForm = () => {
        isEditing = false
        formSection.classList.add('hidden')
        toggleFormBtn.classList.remove('hidden')
        form.reset()
        selectedFiles = []
        fileInput.value = ''

        renderPreviews()
        renderList()
      }

      const updateImagePreview = (url) => {
        if (url) {
          imagePreview.innerHTML = `<img src="${url}" alt="Preview" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<svg class=\\'w-8 h-8 text-red-400\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M6 18L18 6M6 6l12 12\\'/></svg>'" />`
        } else {
          imagePreview.innerHTML = `<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
        }
      }

      renderList()

      // Search functionality
      const searchInput = qs(root, '#search-products')
      searchInput.addEventListener('input', (e) => {
        renderList(e.target.value.trim())
      })

      // File input handle (multiple files)
      fileInput.addEventListener('change', (e) => {
        const urlsStr = imageUrlsTextarea?.value.trim()
        const urls = urlsStr ? urlsStr.split(',').map(u => u.trim()).filter(Boolean) : []
        const remaining = Math.max(0, 5 - urls.length)
        selectedFiles = Array.from(e.target.files).slice(0, remaining)

        // Si no hay espacio, limpiar selección para evitar confusión
        if (remaining === 0) {
          fileInput.value = ''
        }

        renderPreviews()
      })

      // Toggle form
      toggleFormBtn.addEventListener('click', () => showForm(false))
      cancelBtn.addEventListener('click', hideForm)

      // Logout button
      const logoutBtn = qs(root, '#admin-logout-btn')
      logoutBtn.addEventListener('click', () => {
        adminLogout()
        navigate('/admin/login')
      })

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault()
        setError('')

        const idInput = qs(root, 'input[name="id"]')
        const name = qs(root, 'input[name="name"]').value.trim()
        const type = qs(root, 'select[name="type"]').value
        const price = Number(qs(root, 'input[name="price"]').value || 0)
        const originalPrice = Number(qs(root, 'input[name="originalPrice"]').value || 0) || null
        const stock = Number(qs(root, 'input[name="stock"]').value || 0) || null
        const badge = qs(root, 'select[name="badge"]').value || null
        // Get checked sizes from checkboxes
        const sizeCheckboxes = root.querySelectorAll('input[name="sizes"]:checked')
        const sizes = Array.from(sizeCheckboxes).map(cb => cb.value)
        const colors = parseList(qs(root, 'input[name="colors"]').value)
        
        // Get multiple image URLs from textarea (comma-separated)
        const imageUrlsRaw = qs(root, 'textarea[name="imageUrls"]').value.trim()
        let imageUrls = imageUrlsRaw 
          ? imageUrlsRaw.split(',').map(url => url.trim()).filter(Boolean) 
          : []

        if (!name) return setError('Ingresa el nombre del producto.')
        if (!type) return setError('Selecciona la categoría del producto.')
        if (!Number.isFinite(price) || price <= 0) return setError('Ingresa un precio válido mayor a 0.')
        if (!sizes.length) return setError('Selecciona al menos una talla.')
        if (!colors.length) return setError('Ingresa al menos un color.')

        // Disable button while saving to prevent double clicks (simple UI UX)
        const submitBtn = qs(root, 'button[type="submit"]')
        const originalBtnText = submitBtn.innerHTML
        submitBtn.disabled = true
        submitBtn.innerHTML = '<span class="animate-spin">⌛</span> Subiendo & Guardando...'

        try {
          // Upload multiple files if selected (respeta máximo total de 5)
          if (selectedFiles && selectedFiles.length > 0) {
            const urlsStr = imageUrlsTextarea?.value.trim()
            const existingUrls = urlsStr ? urlsStr.split(',').map(u => u.trim()).filter(Boolean) : []
            const remainingSlots = Math.max(0, 5 - existingUrls.length)
            const filesToUpload = selectedFiles.slice(0, remainingSlots)

            for (const file of filesToUpload) {
              const { publicUrl, error: uploadError } = await uploadProductImage(file)
              if (uploadError) throw new Error('Error al subir imagen: ' + uploadError.message)
              imageUrls.push(publicUrl)
            }
          }

          // Limit to 5 images max (portada = primer elemento)
          const images = imageUrls.slice(0, 5)
            
            if (idInput.value) {
               // Update
               const { error } = await updateProduct(idInput.value, { name, type, price, originalPrice, stock, badge, sizes, colors, images })
               if (error) throw new Error('Error al actualizar: ' + error.message)
            } else {
               // Create
               const { error } = await addProduct({ name, type, price, originalPrice, stock, badge, sizes, colors, images })
               if (error) throw new Error('Error al crear: ' + error.message)
            }
            hideForm()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Error al guardar. Revisa la consola.')
        } finally {
            submitBtn.disabled = false
            submitBtn.innerHTML = originalBtnText
        }
      })

      on(root, 'click', '[data-edit]', (_ev, btn) => {
        const wrap = btn.closest('[data-product]')
        const id = wrap?.getAttribute('data-id')
        if (!id) return

        const product = state.products.find(p => p.id === id)
        if (!product) return

        showForm(true)
        
        // Populate form fields
        qs(root, 'input[name="id"]').value = product.id
        qs(root, 'input[name="name"]').value = product.name
        qs(root, 'select[name="type"]').value = product.type
        qs(root, 'input[name="price"]').value = product.price
        if (product.originalPrice) qs(root, 'input[name="originalPrice"]').value = product.originalPrice
        if (product.stock) qs(root, 'input[name="stock"]').value = product.stock
        if (product.badge) qs(root, 'select[name="badge"]').value = product.badge
        
        // Populate imagenes existentes (URLs) y refrescar previews
        if (product.images && product.images.length > 0) {
          imageUrlsTextarea.value = product.images.join(', ')
        } else {
          imageUrlsTextarea.value = ''
        }
        selectedFiles = []
        renderPreviews()
        
        // Populate sizes (checkboxes)
        const sizeCheckboxes = root.querySelectorAll('input[name="sizes"]')
        sizeCheckboxes.forEach(cb => {
          cb.checked = (product.sizes || []).includes(cb.value)
        })
        
        // Populate colors
        qs(root, 'input[name="colors"]').value = (product.colors || []).join(', ')

        // Scroll to form
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })

      on(root, 'click', '[data-delete]', async (_ev, btn) => {
        const wrap = btn.closest('[data-product]')
        const id = wrap?.getAttribute('data-id')
        if (!id) return
        
        if (confirm('¿Estás seguro de eliminar este producto?')) {
          await deleteProduct(id)
        }
      })
    },
  }
}
