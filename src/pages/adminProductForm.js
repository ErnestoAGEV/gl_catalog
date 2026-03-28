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
    <!-- Form Modal (hidden by default) -->
    <section id="product-form-section" class="hidden fixed inset-0 layer-modal items-center justify-center p-2 sm:p-4 lg:p-6 bg-gray-900/60 backdrop-blur-sm transition-opacity overflow-y-auto">
      <div class="relative w-full max-w-6xl my-auto bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <!-- Botón de cerrar (esquina) -->
        <button type="button" id="modal-close-top" class="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors z-[10]" aria-label="Cerrar modal">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <!-- Header -->
        <div class="px-6 pt-6 pb-2 pr-16 bg-white rounded-t-3xl border-b border-gray-100">
          <h2 id="form-title" class="text-xl font-manrope font-bold text-gray-900">Añadir a la Colección</h2>
          <p class="text-xs text-gray-500 mt-1">Completa los detalles de este nuevo integrante del catálogo.</p>
        </div>
        
        <form id="product-form" class="px-6 pb-6 pt-4" novalidate>
          <input type="hidden" name="id" />

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            <!-- Columna Izquierda (7 cols): Datos del Producto -->
            <div class="lg:col-span-7 space-y-4">
              
              <!-- Name -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Título de la pieza *</label>
                <input name="name" class="w-full rounded-xl bg-gray-50 border border-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all outline-none" placeholder="Ej: Americana de Lino Azul" />
              </div>

              <!-- Type & Badge -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Categoría *</label>
                  <div class="relative">
                    <select name="type" class="w-full rounded-xl bg-gray-50 border border-transparent px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all outline-none appearance-none cursor-pointer">
                      <option value="">Selecciona categoría...</option>
                      ${categoryOptions}
                    </select>
                    <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Estado visual</label>
                  <div class="relative">
                    <select name="badge" class="w-full rounded-xl bg-gray-50 border border-transparent px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all outline-none appearance-none cursor-pointer">
                      ${badgeOptions}
                    </select>
                    <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              </div>

              <!-- Pricing & Stock -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Precio *</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800 font-medium">$</span>
                    <input name="price" type="number" min="0" inputmode="numeric" class="w-full rounded-xl bg-gray-50 border border-transparent pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all outline-none" placeholder="349" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Precio orig. <span class="text-gray-400 font-normal md:hidden xl:inline">(opc)</span></label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800 font-medium">$</span>
                    <input name="originalPrice" type="number" min="0" inputmode="numeric" class="w-full rounded-xl bg-gray-50 border border-transparent pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all outline-none" placeholder="450" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Unidades</label>
                  <input name="stock" type="number" min="0" inputmode="numeric" class="w-full rounded-xl bg-gray-50 border border-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all outline-none" placeholder="Ilimitado" />
                </div>
              </div>

              <!-- Variants -->
              <div class="bg-gray-50/60 rounded-2xl p-4 border border-gray-100 mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-900 mb-2">
                    Tallas disponibles *
                  </label>
                  <div id="sizes-clothing">
                    <p class="text-[10px] text-gray-500 mb-2 uppercase tracking-wider font-bold">Ropa Superior</p>
                    <div class="flex flex-wrap gap-1.5" id="sizes-container">
                      ${SIZE_OPTIONS.map(size => `
                        <label class="inline-flex items-center">
                          <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" data-size-group="clothing" />
                          <span class="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 cursor-pointer peer-checked:bg-gray-900 peer-checked:text-white peer-checked:border-gray-900 hover:border-gray-300 transition-all shadow-sm">${size}</span>
                        </label>
                      `).join('')}
                    </div>
                    <div class="h-px bg-gray-200 w-full my-3"></div>
                    <p class="text-[10px] text-gray-500 mb-2 uppercase tracking-wider font-bold">Pantalones</p>
                    <div class="flex flex-wrap gap-1.5">
                      ${PANTS_SIZE_OPTIONS.map(size => `
                        <label class="inline-flex items-center">
                          <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" data-size-group="clothing" />
                          <span class="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 cursor-pointer peer-checked:bg-gray-900 peer-checked:text-white peer-checked:border-gray-900 hover:border-gray-300 transition-all shadow-sm">${size}</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>

                  <div id="sizes-perfume" class="hidden">
                    <p class="text-[10px] text-gray-500 mb-2 uppercase tracking-wider font-bold">Perfumes</p>
                    <div class="flex flex-wrap gap-1.5">
                      ${PERFUME_SIZE_OPTIONS.map(size => `
                        <label class="inline-flex items-center">
                          <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" data-size-group="perfume" />
                          <span class="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 cursor-pointer peer-checked:bg-gray-900 peer-checked:text-white peer-checked:border-gray-900 hover:border-gray-300 transition-all shadow-sm">${size}</span>
                        </label>
                      `).join('')}
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-gray-100">
                  <label class="block text-sm font-semibold text-gray-900 mb-2">
                    Colores *
                  </label>
                  
                  <div id="existing-colors-container" class="mb-3">
                    <p class="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-bold">Paleta guardada</p>
                    <div class="flex flex-wrap gap-1.5">
                      ${allColors.length > 0 ? allColors.map(color => `
                        <button type="button" class="px-2.5 py-1 rounded border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-all shadow-sm" data-color-badge="${color}">
                          ${color}
                        </button>
                      `).join('') : '<span class="text-xs text-gray-400 italic">No hay colores registrados aún</span>'}
                    </div>
                  </div>

                  <div class="relative">
                    <input name="customColors" id="colors-input" class="w-full rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all outline-none" placeholder="Añade nuevos (Ej: Amarillo Mostaza, Cyan...)" />
                  </div>
                </div>
              </div>

            </div>

            <!-- Columna Derecha (5 cols): Media y Acciones -->
            <div class="lg:col-span-5 flex flex-col h-full">
               
               <!-- Galería Drag & Drop -->
               <div class="flex-1 rounded-3xl bg-gray-50 border border-gray-100 p-4 flex flex-col h-full min-h-[16rem]">
                 <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Activos fotográficos</h3>
                    <button type="button" id="clear-images" class="text-[10px] font-bold uppercase text-gray-400 hover:text-red-500 transition-colors">Limpiar</button>
                 </div>
                 
                 <div id="image-previews" class="grid grid-cols-5 gap-2 mb-3"></div>

                 <!-- Dropzone Lujosa -->
                 <div id="dropzone" class="flex-1 relative rounded-xl border-2 border-dashed border-gray-200 bg-white hover:bg-gray-50/50 flex flex-col items-center justify-center p-4 transition-colors cursor-pointer group">
                    <div class="w-10 h-10 rounded-full bg-brand/5 text-brand flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    </div>
                    <span class="text-xs font-bold text-gray-900 text-center block">Sube imágenes aquí</span>
                    <span class="text-[10px] text-gray-500 mt-1 text-center block.">JPG o PNG.</span>
                    <input type="file" id="file-input" accept="image/*" multiple class="absolute inset-0 opacity-0 cursor-pointer" aria-label="Seleccionar imágenes" />
                 </div>

                 <!-- URL Fallback -->
                 <div class="mt-3">
                    <textarea name="imageUrls" rows="2" class="w-full rounded-xl bg-white border border-gray-200 px-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all resize-none outline-none custom-scrollbar" placeholder="O pega URLs separadas por comillas..."></textarea>
                 </div>
               </div>

               <!-- Botones de Acción -->
               <div class="mt-4 flex gap-3">
                 <button type="button" id="product-cancel" class="px-5 py-3 rounded-xl bg-gray-100 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                   Cancelar
                 </button>
                 <button type="submit" class="flex-1 flex items-center justify-between rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 active:scale-[0.98] transition-all group">
                   <span id="submit-text">Guardar en Colección</span>
                   <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                     <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                   </div>
                 </button>
               </div>
               
               <!-- Error -->
               <div id="product-error" class="hidden mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2 border border-red-100">
                 <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 <span id="error-text" class="font-medium"></span>
               </div>

            </div>
          </div>
        </form>
      </div>
    </section>
  `
}
