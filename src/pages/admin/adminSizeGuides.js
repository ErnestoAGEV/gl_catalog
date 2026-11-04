import { getSizeGuides, addSizeGuide, updateSizeGuide, deleteSizeGuide, getCategories, getState } from '../../store/index.js'
import { showToast } from '../../utils/toast.js'
import { escapeHtml as esc } from '../../utils/sanitize.js'
import { productBrand } from '../../utils/productCopy.js'
import { findSizeGuide, defaultColumns, guideLabel, sameGuideDraft } from '../../utils/sizeGuides.js'
import { confirmDelete } from './adminConfirm.js'
import { isPerfumeCategory } from './adminProductsData.js'
import { ICON } from './adminIcons.js'

// Productos a los que les toca la guia, con la misma regla que la ficha
const productsFor = (guide, guides) =>
  (getState().products || []).filter(p => findSizeGuide(p, guides)?.id === guide.id)

export function pageAdminSizeGuides() {
  return {
    title: 'Guías de tallas | Admin G&L',
    html: `
      <div class="admin-view-in max-w-3xl mx-auto space-y-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="eyebrow text-faint">Catálogo</p>
            <h1 class="font-display font-extrabold text-ink text-[24px] tracking-tight mt-0.5">Guías de tallas</h1>
          </div>
          <button id="open-add-guide" class="adm-btn adm-btn-primary">${ICON.plus('w-[18px] h-[18px]')} Nueva guía</button>
        </div>

        <div class="flex items-start gap-3 bg-brand-tint-2 border border-brand-tint rounded-xl2 px-4 py-3">
          ${ICON.info('w-5 h-5 text-brand shrink-0 mt-0.5')}
          <p class="text-[13px] text-brand-ink leading-relaxed">Una guía se captura una vez por marca, tipo de prenda y corte, y aparece sola en todos los productos cuyo nombre empieza así (por ejemplo, "Oggi · Vaxter" sale en cualquier "Oggi - Vaxter …"). Las medidas van en centímetros.</p>
        </div>

        <div id="guides-list" class="space-y-2"></div>
      </div>
    `,

    async onMount(root) {
      const listEl = root.querySelector('#guides-list')

      const renderList = () => {
        const guides = getSizeGuides()
        if (!guides.length) {
          listEl.innerHTML = `
            <div class="py-16 text-center">
              ${ICON.tag('w-12 h-12 mx-auto mb-4 text-line-strong')}
              <p class="font-semibold text-body">Todavía no hay guías</p>
              <p class="text-[13px] text-muted mt-1">Crea una con el botón de arriba: el cliente verá las medidas de cada talla en la ficha.</p>
            </div>`
          return
        }
        listEl.innerHTML = guides.map(g => {
          const count = productsFor(g, guides).length
          return `
          <div class="flex items-center gap-3 bg-paper rounded-xl2 border border-line px-3.5 py-3">
            <div class="flex-1 min-w-0">
              <span class="block text-[14px] font-semibold text-ink truncate">${esc(guideLabel(g))}</span>
              <span class="block text-[12px] text-faint">${esc(g.type)} · ${g.rows.length} talla${g.rows.length !== 1 ? 's' : ''} · aplica a ${count} producto${count !== 1 ? 's' : ''}</span>
            </div>
            <button type="button" data-edit="${esc(g.id)}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors" title="Editar" aria-label="Editar ${esc(guideLabel(g))}">${ICON.edit('w-[17px] h-[17px]')}</button>
            <button type="button" data-delete="${esc(g.id)}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors" title="Eliminar" aria-label="Eliminar ${esc(guideLabel(g))}">${ICON.trash('w-[17px] h-[17px]')}</button>
          </div>`
        }).join('')

        listEl.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
          const g = getSizeGuides().find(x => x.id === btn.dataset.edit)
          if (g) openForm(g)
        }))
        listEl.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', async () => {
          const g = getSizeGuides().find(x => x.id === btn.dataset.delete)
          if (!g) return
          if (!await confirmDelete({ title: '¿Eliminar guía de tallas?', highlight: guideLabel(g), message: 'Los productos dejarán de mostrar estas medidas.' })) return
          const { error } = await deleteSizeGuide(g.id)
          showToast(error ? 'No se pudo eliminar' : 'Guía eliminada', error ? 'error' : 'success')
          renderList()
        }))
      }

      const openForm = (guide = null) => {
        const isEdit = !!guide
        root.querySelector('#guide-modal')?.remove()
        const types = getCategories().map(c => c.name).filter(n => !isPerfumeCategory(n))
        const brands = [...new Set((getState().products || []).map(p => productBrand(p.name)))].filter(b => b !== 'G&L').sort()
        const firstType = guide?.type || types[0] || ''
        // Borrador editable: los inputs escriben aqui y la tabla se repinta desde aqui
        const draft = guide
          ? { brand: guide.brand, type: guide.type, cut: guide.cut, note: guide.note || '', columns: [...guide.columns], rows: guide.rows.map(r => ({ size: r.size, values: [...r.values] })) }
          : { brand: '', type: firstType, cut: '', note: '', columns: defaultColumns(firstType), rows: [{ size: '', values: [] }] }

        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="guide-modal" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade">
            <div class="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop" role="dialog" aria-modal="true" aria-labelledby="guide-modal-title">
              <div class="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 id="guide-modal-title" class="font-display font-bold text-ink text-[17px]">${isEdit ? 'Editar guía de tallas' : 'Nueva guía de tallas'}</h2>
                <button type="button" data-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors" aria-label="Cerrar">${ICON.close('w-[18px] h-[18px]')}</button>
              </div>
              <form data-form class="px-5 pb-5 space-y-4" novalidate>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="adm-lbl" for="guide-brand">Marca *</label>
                    <input id="guide-brand" name="brand" class="adm-fld" list="guide-brand-list" autocomplete="off" placeholder="Ej: Oggi" value="${esc(draft.brand)}" />
                    <datalist id="guide-brand-list">${brands.map(b => `<option value="${esc(b)}"></option>`).join('')}</datalist>
                  </div>
                  <div>
                    <label class="adm-lbl" for="guide-type">Tipo de prenda *</label>
                    <select id="guide-type" name="type" class="adm-fld">${types.map(t => `<option value="${esc(t)}"${t === draft.type ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>
                  </div>
                  <div>
                    <label class="adm-lbl" for="guide-cut">Corte</label>
                    <input id="guide-cut" name="cut" class="adm-fld" autocomplete="off" placeholder="Ej: Vaxter" value="${esc(draft.cut)}" />
                  </div>
                </div>
                <p class="text-[12px] text-faint -mt-2">Corte: como empieza el nombre después de la marca. Vacío = toda la marca en ese tipo de prenda.</p>
                <p data-preview class="text-[13px] text-body bg-canvas rounded-xl2 px-4 py-2.5"></p>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="adm-lbl mb-0">Medidas (cm) *</span>
                    <div class="flex gap-2">
                      <button type="button" data-add-col class="adm-btn adm-btn-ghost !py-1.5 !px-3 !text-[13px]">${ICON.plus('w-4 h-4')} Columna</button>
                      <button type="button" data-add-row class="adm-btn adm-btn-ghost !py-1.5 !px-3 !text-[13px]">${ICON.plus('w-4 h-4')} Talla</button>
                    </div>
                  </div>
                  <div data-grid class="overflow-x-auto"></div>
                </div>

                <div>
                  <label class="adm-lbl" for="guide-note">Nota para el cliente</label>
                  <input id="guide-note" name="note" class="adm-fld" maxlength="200" placeholder="Ej: Medido con la prenda acostada. Si estás entre dos tallas, pide la mayor." value="${esc(draft.note)}" />
                </div>

                <p data-error class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2" role="alert"></p>
                <div class="flex gap-2.5 pt-1">
                  <button type="button" data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                  <button type="submit" data-submit class="adm-btn adm-btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear guía'}</button>
                </div>
              </form>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)

        const modal = root.querySelector('#guide-modal')
        const form = modal.querySelector('[data-form]')
        const gridEl = modal.querySelector('[data-grid]')
        const previewEl = modal.querySelector('[data-preview]')
        const errorEl = modal.querySelector('[data-error]')
        const submitBtn = modal.querySelector('[data-submit]')
        const close = () => modal.remove()
        // Igual que el formulario de producto: cerrar con algo capturado pregunta antes de perderlo
        const initial = JSON.parse(JSON.stringify(draft))
        let asking = false
        const requestClose = async () => {
          if (asking || submitBtn.disabled) return
          if (!sameGuideDraft(draft, initial)) {
            asking = true
            const ok = await confirmDelete({
              title: '¿Descartar cambios?',
              message: 'Lo que capturaste en esta guía no se ha guardado y se va a perder.',
              confirmLabel: 'Descartar',
            })
            asking = false
            if (!ok) return
          }
          close()
        }

        const paintPreview = () => {
          const probe = { id: '__draft__', ...draft }
          const others = getSizeGuides().filter(g => g.id !== guide?.id)
          const list = draft.brand.trim() ? productsFor(probe, [...others, probe]) : []
          previewEl.textContent = list.length
            ? `Esta guía aplica a ${list.length} producto${list.length !== 1 ? 's' : ''}: ${list.slice(0, 5).map(p => p.name).join(', ')}${list.length > 5 ? '…' : ''}`
            : 'Todavía no aplica a ningún producto. Revisa la marca, el tipo de prenda y el corte.'
        }

        const cell = 'adm-fld !py-1.5 !px-2 !text-[13px] min-w-[72px]'
        const removeBtn = (attr, i, label) => `<button type="button" ${attr}="${i}" class="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint" aria-label="${label}">${ICON.close('w-4 h-4')}</button>`
        const paintGrid = () => {
          gridEl.innerHTML = `
            <table class="w-full border-separate border-spacing-1">
              <thead><tr>
                <th scope="col" class="text-left text-[12px] text-faint font-semibold">Talla</th>
                ${draft.columns.map((c, i) => `<th scope="col"><div class="flex items-center gap-1"><input data-col="${i}" class="${cell}" value="${esc(c)}" aria-label="Nombre de la columna ${i + 1}" />${removeBtn('data-del-col', i, `Quitar columna ${esc(c)}`)}</div></th>`).join('')}
                <th></th>
              </tr></thead>
              <tbody>
                ${draft.rows.map((r, ri) => `<tr>
                  <td><input data-size="${ri}" class="${cell}" value="${esc(r.size)}" placeholder="32" aria-label="Talla de la fila ${ri + 1}" /></td>
                  ${draft.columns.map((c, ci) => `<td><input data-val="${ri}:${ci}" class="${cell}" inputmode="decimal" value="${esc(r.values[ci] ?? '')}" aria-label="${esc(c)} talla ${esc(r.size || String(ri + 1))}" /></td>`).join('')}
                  <td>${removeBtn('data-del-row', ri, `Quitar talla ${esc(r.size || String(ri + 1))}`)}</td>
                </tr>`).join('')}
              </tbody>
            </table>`
        }

        gridEl.addEventListener('input', (e) => {
          const t = e.target
          if (t.dataset.col !== undefined) draft.columns[+t.dataset.col] = t.value
          if (t.dataset.size !== undefined) draft.rows[+t.dataset.size].size = t.value
          if (t.dataset.val !== undefined) {
            const [ri, ci] = t.dataset.val.split(':').map(Number)
            draft.rows[ri].values[ci] = t.value
          }
        })
        gridEl.addEventListener('click', (e) => {
          const col = e.target.closest('[data-del-col]')
          const row = e.target.closest('[data-del-row]')
          if (col) {
            const i = +col.dataset.delCol
            draft.columns.splice(i, 1)
            draft.rows.forEach(r => r.values.splice(i, 1))
            paintGrid()
          }
          if (row) {
            draft.rows.splice(+row.dataset.delRow, 1)
            paintGrid()
          }
        })
        modal.querySelector('[data-add-col]').addEventListener('click', () => { draft.columns.push(''); paintGrid() })
        modal.querySelector('[data-add-row]').addEventListener('click', () => {
          draft.rows.push({ size: '', values: [] })
          paintGrid()
          gridEl.querySelector(`[data-size="${draft.rows.length - 1}"]`)?.focus()
        })

        form.querySelector('[name="brand"]').addEventListener('input', (e) => { draft.brand = e.target.value; paintPreview() })
        form.querySelector('[name="cut"]').addEventListener('input', (e) => { draft.cut = e.target.value; paintPreview() })
        form.querySelector('[name="note"]').addEventListener('input', (e) => { draft.note = e.target.value })
        form.querySelector('[name="type"]').addEventListener('change', (e) => {
          draft.type = e.target.value
          // En una guia nueva sin medidas capturadas, las columnas siguen al tipo de prenda
          const untouched = draft.rows.every(r => !r.values.some(v => String(v || '').trim()))
          if (!isEdit && untouched) { draft.columns = defaultColumns(draft.type); paintGrid() }
          paintPreview()
        })

        modal.querySelector('[data-close]').addEventListener('click', requestClose)
        modal.querySelector('[data-cancel]').addEventListener('click', requestClose)
        modal.addEventListener('click', (e) => { if (e.target === modal) requestClose() })
        modal.addEventListener('keydown', (e) => {
          if (e.key !== 'Escape') return
          // Sin esto, la misma tecla llega al dialogo de confirmacion recien abierto y lo cierra
          e.stopPropagation()
          requestClose()
        })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')
          const fail = (msg) => { errorEl.textContent = msg; errorEl.classList.remove('hidden') }

          const columns = draft.columns.map(c => c.trim())
          const keep = columns.map(c => Boolean(c))
          const payload = {
            brand: draft.brand.trim(),
            type: draft.type,
            cut: draft.cut.trim(),
            note: draft.note.trim(),
            columns: columns.filter(Boolean),
            rows: draft.rows
              .map(r => ({ size: r.size.trim(), values: columns.map((_, i) => String(r.values[i] ?? '').trim()).filter((_, i) => keep[i]) }))
              .filter(r => r.size),
          }
          if (!payload.brand) return fail('Escribe la marca.')
          if (!payload.type) return fail('Elige el tipo de prenda.')
          if (!payload.columns.length) return fail('Agrega al menos una medida (columna).')
          if (!payload.rows.length) return fail('Agrega al menos una talla.')
          const sizes = payload.rows.map(r => r.size.toUpperCase())
          if (new Set(sizes).size !== sizes.length) return fail('Hay una talla repetida.')

          submitBtn.disabled = true
          const result = isEdit ? await updateSizeGuide(guide.id, payload) : await addSizeGuide(payload)
          submitBtn.disabled = false
          if (result.error) {
            return fail(result.error.code === '23505' ? 'Ya existe una guía para esa marca, tipo y corte.' : 'No se pudo guardar. Inténtalo de nuevo.')
          }
          showToast(isEdit ? 'Guía actualizada' : 'Guía creada', 'success')
          close()
          renderList()
        })

        paintGrid()
        paintPreview()
        form.querySelector('[name="brand"]').focus()
      }

      root.querySelector('#open-add-guide').addEventListener('click', () => openForm())
      renderList()
    },
  }
}
