import {
  BADGE_OPTIONS,
  CATEGORY_OPTIONS,
  SIZE_OPTIONS,
  PANTS_SIZE_OPTIONS,
  PERFUME_SIZE_OPTIONS,
} from './adminProductsData.js'
import { ICON } from './adminIcons.js'

/**
 * Returns the full HTML for the product form section (right-side drawer).
 * @param {string[]} allColors - All existing colors across products (for quick-select badges)
 * @param {string[]} [dynamicCategories] - Categories loaded from DB (falls back to CATEGORY_OPTIONS)
 */
export function productFormHTML(allColors, dynamicCategories) {
  const badgeOptions = BADGE_OPTIONS.map(b =>
    `<option value="${b.value}">${b.label}</option>`
  ).join('')
  const categories = dynamicCategories && dynamicCategories.length > 0 ? dynamicCategories : CATEGORY_OPTIONS
  const categoryOptions = categories.map(c =>
    `<option value="${c}">${c}</option>`
  ).join('')

  return `
    <section id="product-form-section" class="hidden fixed inset-0 layer-modal bg-ink/50 backdrop-blur-sm adm-anim-fade">
      <!-- Right-side drawer -->
      <div class="absolute top-0 right-0 bottom-0 w-full max-w-[520px] bg-canvas flex flex-col adm-anim-drawer shadow-pop">

        <!-- Sticky header -->
        <div class="bg-paper border-b border-line px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p class="eyebrow text-faint">Catálogo</p>
            <h2 id="form-title" class="font-display font-bold text-ink text-[18px] mt-0.5">Nuevo Producto</h2>
          </div>
          <button type="button" id="modal-close-top" class="w-9 h-9 rounded-[10px] border border-line bg-paper flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">
            ${ICON.close('w-[18px] h-[18px]')}
          </button>
        </div>

        <!-- Scrollable form -->
        <form id="product-form" class="flex-1 flex flex-col overflow-hidden" novalidate>
          <input type="hidden" name="id" />

          <div class="flex-1 overflow-y-auto adm-scroll-thin p-5 space-y-5">

            <!-- ── Images ── -->
            <div>
              <p class="eyebrow text-faint mb-2">Imágenes</p>
              <div id="image-previews" class="grid grid-cols-5 gap-2 mb-2"></div>

              <div id="dropzone" class="relative rounded-xl2 border-2 border-dashed border-line-strong bg-paper hover:bg-canvas flex flex-col items-center justify-center p-5 transition-colors cursor-pointer group">
                <div class="w-10 h-10 rounded-full bg-brand-tint-2 text-brand flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                  ${ICON.plus('w-5 h-5')}
                </div>
                <span class="text-[12px] font-semibold text-ink text-center">Sube imágenes aquí</span>
                <span class="text-[11px] text-faint mt-0.5 text-center">PNG, JPG o WEBP · máx. 5 · la primera es portada</span>
                <input type="file" id="file-input" accept="image/*" multiple class="absolute inset-0 opacity-0 cursor-pointer" aria-label="Seleccionar imágenes" />
              </div>

              <div class="flex items-start gap-2 mt-2">
                <textarea name="imageUrls" rows="2" class="adm-fld text-[12px] resize-none flex-1" placeholder="O pega URLs separadas por comas..."></textarea>
                <button type="button" id="clear-images" class="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-bad transition-colors shrink-0 whitespace-nowrap">Limpiar</button>
              </div>
            </div>

            <!-- ── Name ── -->
            <div>
              <label class="adm-lbl">Nombre del producto *</label>
              <input name="name" class="adm-fld" placeholder="Ej: Camisa Oxford Slim" />
            </div>

            <!-- ── Category + Badge ── -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="adm-lbl">Categoría *</label>
                <select name="type" class="adm-fld">${'<option value="">Selecciona...</option>' + categoryOptions}</select>
              </div>
              <div>
                <label class="adm-lbl">Etiqueta</label>
                <select name="badge" class="adm-fld">${badgeOptions}</select>
              </div>
            </div>

            <!-- ── Pricing ── -->
            <div class="bg-paper rounded-xl2 border border-line p-4">
              <p class="eyebrow text-muted mb-3">Precio e inventario</p>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="adm-lbl">Precio *</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-[14px] pointer-events-none">$</span>
                    <input name="price" type="number" min="0" inputmode="numeric" class="adm-fld pl-7 tnum" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label class="adm-lbl">Precio antes</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-[14px] pointer-events-none">$</span>
                    <input name="originalPrice" type="number" min="0" inputmode="numeric" class="adm-fld pl-7 tnum" placeholder="—" />
                  </div>
                </div>
                <div>
                  <label class="adm-lbl">Stock</label>
                  <input name="stock" type="number" min="0" inputmode="numeric" class="adm-fld tnum" placeholder="∞" />
                </div>
              </div>
            </div>

            <!-- ── Sizes ── -->
            <div>
              <label class="text-[13px] font-semibold text-ink mb-2 block">Tallas disponibles *</label>
              <div id="sizes-clothing">
                <p class="eyebrow text-faint mb-2">Ropa superior</p>
                <div class="flex flex-wrap gap-1.5" id="sizes-container">
                  ${SIZE_OPTIONS.map(size => `
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" data-size-group="clothing" />
                      <span class="px-3.5 h-9 rounded-[10px] border border-line bg-paper text-[13px] font-semibold text-body cursor-pointer peer-checked:bg-ink peer-checked:text-white peer-checked:border-ink hover:border-line-strong transition-all inline-flex items-center tnum">${size}</span>
                    </label>
                  `).join('')}
                </div>
                <div class="h-px bg-line w-full my-3"></div>
                <p class="eyebrow text-faint mb-2">Pantalones</p>
                <div class="flex flex-wrap gap-1.5">
                  ${PANTS_SIZE_OPTIONS.map(size => `
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" data-size-group="clothing" />
                      <span class="px-3.5 h-9 rounded-[10px] border border-line bg-paper text-[13px] font-semibold text-body cursor-pointer peer-checked:bg-ink peer-checked:text-white peer-checked:border-ink hover:border-line-strong transition-all inline-flex items-center tnum">${size}</span>
                    </label>
                  `).join('')}
                </div>
              </div>

              <div id="sizes-perfume" class="hidden">
                <p class="eyebrow text-faint mb-2">Perfumes</p>
                <div class="flex flex-wrap gap-1.5">
                  ${PERFUME_SIZE_OPTIONS.map(size => `
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${size}" class="sr-only peer" data-size-group="perfume" />
                      <span class="px-3.5 h-9 rounded-[10px] border border-line bg-paper text-[13px] font-semibold text-body cursor-pointer peer-checked:bg-ink peer-checked:text-white peer-checked:border-ink hover:border-line-strong transition-all inline-flex items-center tnum">${size}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- ── Colors ── -->
            <div>
              <label class="text-[13px] font-semibold text-ink mb-2 block">Colores *</label>

              <div id="existing-colors-container" class="mb-3">
                <p class="eyebrow text-faint mb-1.5">Paleta guardada</p>
                <div class="flex flex-wrap gap-1.5">
                  ${allColors.length > 0 ? allColors.map(color => `
                    <button type="button" class="px-2.5 py-1 rounded-lg border border-line bg-canvas text-[12px] font-medium text-body hover:border-line-strong transition-colors" data-color-badge="${color}">
                      ${color}
                    </button>
                  `).join('') : '<span class="text-[12px] text-faint italic">No hay colores registrados</span>'}
                </div>
              </div>

              <input name="customColors" id="colors-input" class="adm-fld" placeholder="Nuevos colores (separar por comas)" />
              <p id="colors-help" class="text-[11.5px] text-faint mt-1">Puedes seleccionar de arriba o escribir nuevos.</p>
            </div>

          </div>

          <!-- Sticky footer -->
          <div class="bg-paper border-t border-line px-5 py-3.5 shrink-0 space-y-2.5">
            <div id="product-error" class="hidden rounded-xl2 bg-bad-tint border border-bad/20 p-3 text-[12px] text-bad flex items-center gap-2">
              ${ICON.info('w-4 h-4 shrink-0')}
              <span id="error-text" class="font-medium"></span>
            </div>
            <div class="flex items-center gap-3">
              <button type="button" id="product-cancel" class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
              <button type="submit" class="adm-btn adm-btn-primary flex-1 disabled:opacity-70 disabled:cursor-not-allowed">
                <span id="submit-text">Guardar</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  `
}
