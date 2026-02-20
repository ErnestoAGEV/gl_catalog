import {
  BADGE_OPTIONS,
  CATEGORY_OPTIONS,
  SIZE_OPTIONS,
  PANTS_SIZE_OPTIONS,
  PERFUME_SIZE_OPTIONS,
} from './adminProductsData.js'

/**
 * Returns the full HTML for the product form section.
 * @param {string[]} allColors - All existing colors across products (for quick-select badges)
 */
export function productFormHTML(allColors) {
  const badgeOptions = BADGE_OPTIONS.map(b =>
    `<option value="${b.value}">${b.label}</option>`
  ).join('')
  const categoryOptions = CATEGORY_OPTIONS.map(c =>
    `<option value="${c}">${c}</option>`
  ).join('')

  return `
    <!-- Form (hidden by default) -->
    <section id="product-form-section" class="hidden mb-6">
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="p-5 border-b border-gray-100">
          <h2 id="form-title" class="text-lg font-bold text-gray-900">Nuevo producto</h2>
          <p class="text-sm text-gray-500">Completa la información del producto</p>
        </div>
        
        <form id="product-form" class="p-5 space-y-6" novalidate>
          <input type="hidden" name="id" />

          <!-- Sección: Imágenes -->
          <div class="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Imágenes (máx. 5)
              </div>
              <button type="button" id="clear-images" class="text-xs font-medium text-gray-500 hover:text-red-500">Limpiar</button>
            </div>

            <!-- Image Previews Gallery -->
            <div id="image-previews" class="grid grid-cols-5 gap-2"></div>

            <!-- Dropzone / Inputs -->
            <div id="dropzone" class="relative rounded-xl border border-dashed border-gray-300 bg-white/70 p-4 text-sm text-gray-600 transition-colors">
              <div class="flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
                <div class="px-2 py-1 rounded-full bg-gray-100 text-[11px] text-gray-600">Arrastra y suelta imágenes</div>
                <p class="text-xs text-gray-500">o usa el botón para seleccionar archivos</p>
                <p class="text-[11px] text-gray-400">JPG, PNG. Máximo 5 combinando URLs y archivos.</p>
              </div>
              <input type="file" id="file-input" accept="image/*" multiple class="absolute inset-0 opacity-0 cursor-pointer" aria-label="Seleccionar imágenes" />
            </div>

            <div class="relative">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-gray-200"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="bg-white px-2 text-xs text-gray-400">O pega URLs</span>
              </div>
            </div>

            <!-- URL Fallback -->
            <textarea name="imageUrls" rows="2" class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors resize-none" placeholder="https://..., https://..., https://... (separa con comas)"></textarea>
            <p class="text-xs text-gray-500">La primera imagen es la portada. Puedes reordenar con "Marcar portada".</p>
          </div>

          <!-- Name -->
          <div class="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del producto *
            </label>
            <input name="name" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Ej: Camisa Oxford Premium" />
          </div>

          <!-- Type & Badge -->
          <div class="rounded-xl border border-gray-100 bg-white p-4 grid grid-cols-2 gap-4">
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
          <div class="rounded-xl border border-gray-100 bg-white p-4 grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio *</label>
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
          <div class="rounded-xl border border-gray-100 bg-white p-4 space-y-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Stock disponible <span class="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input name="stock" type="number" min="0" inputmode="numeric" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Ej: 10 (deja vacío para ilimitado)" />
            <p class="text-xs text-gray-500 mt-1.5">Si el stock es 5 o menos, se mostrará "¡Últimas piezas!"</p>
          </div>

          <!-- Sizes & Colors -->
          <div class="rounded-xl border border-gray-100 bg-white p-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tallas disponibles *
              </label>
              <div id="sizes-clothing">
                <p class="text-xs text-gray-500 mb-3">Tallas de ropa</p>
                <div class="flex flex-wrap gap-2" id="sizes-container">
                  ${SIZE_OPTIONS.map(size => `
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" data-size-group="clothing" />
                      <span class="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 cursor-pointer peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand hover:border-gray-300 transition-colors">${size}</span>
                    </label>
                  `).join('')}
                </div>
                <p class="text-xs text-gray-500 mt-3 mb-2">Tallas de pantalones</p>
                <div class="flex flex-wrap gap-2">
                  ${PANTS_SIZE_OPTIONS.map(size => `
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" data-size-group="clothing" />
                      <span class="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 cursor-pointer peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand hover-border-gray-300 transition-colors">${size}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <div id="sizes-perfume" class="hidden">
                <p class="text-xs text-gray-500 mb-3">Capacidad del perfume</p>
                <div class="flex flex-wrap gap-2">
                  ${PERFUME_SIZE_OPTIONS.map(size => `
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" data-size-group="perfume" />
                      <span class="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 cursor-pointer peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand hover-border-gray-300 transition-colors">${size}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Colores disponibles *
              </label>
              
              <!-- Existing colors selection -->
              <div id="existing-colors-container" class="mb-3">
                <p class="text-xs text-gray-500 mb-2">Colores frecuentes (clic para seleccionar)</p>
                <div class="flex flex-wrap gap-2">
                  ${allColors.length > 0 ? allColors.map(color => `
                    <button type="button" class="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors" data-color-badge="${color}">
                      ${color}
                    </button>
                  `).join('') : '<span class="text-xs text-gray-400 italic">No hay colores registrados aún</span>'}
                </div>
              </div>

              <div class="relative">
                <input name="customColors" id="colors-input" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Otros colores... (separar por comas)" />
                <p class="text-xs text-gray-500 mt-2" id="colors-help">Puedes seleccionar de arriba o escribir nuevos.</p>
              </div>
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
  `
}
