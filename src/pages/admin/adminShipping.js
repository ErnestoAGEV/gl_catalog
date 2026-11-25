import { getShippingSettings, saveShippingSettings, saveCategoryWeight, deleteCategoryWeight, getState } from '../../store/index.js'
import { showToast } from '../../utils/toast.js'
import { escapeHtml, sanitizeText } from '../../utils/sanitize.js'
import { MX_STATES } from '../../../supabase/functions/_shared/shipping.js'
import { carrierName } from '../checkout/shippingBlock.js'
import { confirmDelete } from './adminConfirm.js'
import { ICON } from './adminIcons.js'

// Castores no se ofrece (decision del dueño)
const CARRIERS = ['estafeta', 'fedex', 'dhl', 'paquetexpress', 'ups', 'jtexpress', '99minutos']
// escapeHtml devuelve '' si no es string: los numeros de la BD se pasan por String
const esc = (v) => escapeHtml(String(v ?? ''))
// CP separados por coma/espacio/salto -> 5 digitos sin repetir; null si alguno es invalido
export const parseZips = (text) => {
  const list = String(text).split(/[\s,;]+/).filter(Boolean)
  return list.every(z => /^\d{5}$/.test(z)) ? [...new Set(list)] : null
}
const PRINT_SIZES = [['PAPER_LETTER', 'Hoja carta (PDF)'], ['PAPER_4X6', 'Etiqueta 4×6 (PDF)']]
const inRange = (n, min, max) => Number.isInteger(n) && n >= min && n <= max

const boxFields = (key, label, v = {}) => `
  <fieldset class="space-y-2">
    <legend class="adm-lbl">${label}</legend>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      ${[['length', 'Largo (cm)'], ['width', 'Ancho (cm)'], ['height', 'Alto (cm)'], ['max_grams', 'Peso máx. (g)']].map(([f, l]) => `
        <div><label class="text-[11px] text-faint" for="sh-${key}-${f}">${l}</label>
        <input id="sh-${key}-${f}" name="${key}.${f}" type="number" min="1" max="${f === 'max_grams' ? 30000 : 200}" step="1" required value="${esc(v[f])}" class="adm-fld tnum" onwheel="this.blur()" /></div>`).join('')}
    </div>
  </fieldset>`

const textField = (name, label, value, extra = '') => `
  <div><label class="adm-lbl" for="sh-${name}">${label}</label>
  <input id="sh-${name}" name="${name}" type="text" maxlength="${name === 'o-postalCode' ? 5 : 80}" value="${esc(value)}" class="adm-fld" ${extra} /></div>`

export function pageAdminShipping() {
  return {
    title: 'Envíos | G&L Admin',
    html: `
      <div class="admin-view-in space-y-6 max-w-3xl">
        <div>
          <p class="eyebrow text-faint">Tienda</p>
          <h1 class="font-display font-extrabold text-ink text-[24px] tracking-tight mt-0.5">Envíos</h1>
          <p class="text-[13px] text-muted mt-1">Los cambios se aplican en la siguiente cotización del checkout.</p>
        </div>
        <div id="shipping-body"><div class="py-12 text-center text-faint animate-pulse text-[13px]">Cargando ajustes...</div></div>
      </div>`,

    async onMount(root) {
      const body = root.querySelector('#shipping-body')
      const loadFail = () => { body.innerHTML = '<p class="text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-3">No se pudieron cargar los ajustes de envío.</p>' }
      let s, weights
      try { ({ settings: s, weights } = await getShippingSettings()) } catch (_e) { return loadFail() }
      if (!s) { body.innerHTML = '<p class="text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-3">No se pudieron cargar los ajustes de envío.</p>'; return }

      const rowsByCat = new Map(weights.map(w => [w.category, w]))
      const categories = [...new Set([...rowsByCat.keys(), ...getState().products.map(p => p.type).filter(Boolean)])].sort()
      const o = s.origin || {}

      const weightRow = (cat) => {
        const w = rowsByCat.get(cat)
        return `
          <div class="flex flex-wrap items-center gap-2.5 py-2.5 border-t border-line first:border-t-0" data-row="${esc(cat)}">
            <div class="flex-1 min-w-[140px]">
              <p class="text-[13.5px] font-semibold text-ink">${esc(cat)}</p>
              ${w ? '' : `<p class="text-[11px] text-faint">Usa el valor por defecto (${esc(s.default_grams)} g)</p>`}
            </div>
            <input data-grams type="number" min="1" max="30000" step="1" value="${esc(w?.grams)}" placeholder="gramos" aria-label="Gramos de ${esc(cat)}" class="adm-fld tnum w-28" onwheel="this.blur()" />
            <label class="flex items-center gap-1.5 text-[13px] text-body"><input data-box type="checkbox" class="w-4 h-4 accent-brand" ${w?.needs_box ? 'checked' : ''}> Va en caja</label>
            <button type="button" data-save class="adm-btn adm-btn-ink h-9 px-3 text-[13px]">Guardar</button>
            ${w ? `<button type="button" data-del class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors" title="Quitar (usará el valor por defecto)" aria-label="Quitar ${esc(cat)}">${ICON.trash('w-4 h-4')}</button>` : ''}
          </div>`
      }

      body.innerHTML = `
        <div class="space-y-6">
          <section class="bg-paper rounded-3xl border border-line shadow-card p-5">
            <h2 class="font-display font-bold text-ink text-[16px] mb-1">Peso por categoría</h2>
            <p class="text-[12px] text-faint mb-3">Gramos por pieza. Las categorías sin fila usan el valor por defecto.</p>
            <div id="weights">${categories.map(weightRow).join('') || '<p class="text-[13px] text-muted">Sin categorías.</p>'}</div>
          </section>

          <form id="settings-form" class="bg-paper rounded-3xl border border-line shadow-card p-5 space-y-5" novalidate>
            <fieldset>
              <legend class="font-display font-bold text-ink text-[16px] mb-2">Paqueterías</legend>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                ${CARRIERS.map(c => `<label class="flex items-center gap-2 text-[13.5px] text-body bg-canvas rounded-xl2 px-3 py-2 cursor-pointer"><input type="checkbox" name="carriers" value="${c}" class="w-4 h-4 accent-brand" ${(s.carriers || []).includes(c) ? 'checked' : ''}> ${esc(carrierName(c))}</label>`).join('')}
              </div>
            </fieldset>

            <div class="space-y-4">
              <h2 class="font-display font-bold text-ink text-[16px]">Empaque</h2>
              ${boxFields('envelope', 'Sobre', s.envelope)}
              ${boxFields('box', 'Caja', s.box)}
            </div>

            <div class="space-y-3">
              <h2 class="font-display font-bold text-ink text-[16px]">Remitente</h2>
              <div class="grid sm:grid-cols-2 gap-3">
                ${textField('o-name', 'Nombre *', o.name, 'required')}
                <div>${textField('o-phone', 'Teléfono *', o.phone, 'required inputmode="tel" aria-describedby="sh-o-phone-hint"')}
                  <p id="sh-o-phone-hint" class="text-[11px] text-faint mt-1">10 dígitos. Lo pide la paquetería para generar guías.</p></div>
                ${textField('o-street', 'Calle *', o.street, 'required')}
                ${textField('o-number', 'Número', o.number)}
                ${textField('o-district', 'Colonia', o.district)}
                ${textField('o-city', 'Ciudad *', o.city, 'required')}
                <div><label class="adm-lbl" for="sh-o-state">Estado *</label>
                  <select id="sh-o-state" name="o-state" class="adm-fld" required>
                    ${(MX_STATES.some(st => st.code === o.state) || !o.state ? MX_STATES : [{ code: o.state, name: o.state }, ...MX_STATES]).map(st => `<option value="${esc(st.code)}" ${st.code === o.state ? 'selected' : ''}>${esc(st.name)}</option>`).join('')}
                  </select></div>
                ${textField('o-postalCode', 'Código postal *', o.postalCode, 'required inputmode="numeric"')}
              </div>
            </div>

            <div class="space-y-1">
              <h2 class="font-display font-bold text-ink text-[16px]">Guías</h2>
              <label class="text-[11px] text-faint" for="sh-print-size">Formato de impresión</label>
              <select id="sh-print-size" name="label_print_size" class="adm-fld w-56">
                ${PRINT_SIZES.map(([v, l]) => `<option value="${v}" ${(s.label_print_size || 'PAPER_LETTER') === v ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
              <p class="text-[12px] text-faint">Las dos se imprimen en impresora normal.</p>
            </div>

            <div class="space-y-3">
              <h2 class="font-display font-bold text-ink text-[16px]">Valor por defecto</h2>
              <p class="text-[12px] text-faint">Para productos de una categoría sin peso configurado.</p>
              <div class="flex flex-wrap items-center gap-4">
                <div><label class="text-[11px] text-faint" for="sh-default-grams">Gramos por pieza</label>
                  <input id="sh-default-grams" name="default_grams" type="number" min="1" max="30000" step="1" required value="${esc(s.default_grams)}" class="adm-fld tnum w-32" onwheel="this.blur()" /></div>
                <label class="flex items-center gap-1.5 text-[13px] text-body pt-4"><input type="checkbox" name="default_needs_box" class="w-4 h-4 accent-brand" ${s.default_needs_box ? 'checked' : ''}> Va en caja</label>
              </div>
            </div>

            <div class="space-y-1">
              <h2 class="font-display font-bold text-ink text-[16px]">Envío gratis</h2>
              <label class="text-[11px] text-faint" for="sh-free-min">Monto mínimo de compra (MXN)</label>
              <input id="sh-free-min" name="free_shipping_min" type="number" min="1" max="100000" step="1" required value="${esc(s.free_shipping_min)}" class="adm-fld tnum w-36" onwheel="this.blur()" />
              <p class="text-[12px] text-faint">Al guardarlo, la tienda se vuelve a publicar con el nuevo monto en unos minutos.</p>
            </div>

            <div class="space-y-2">
              <h2 class="font-display font-bold text-ink text-[16px]">Entrega local (Colima y Villa de Álvarez)</h2>
              <p class="text-[12px] text-faint">Los códigos postales de la lista no se cotizan con paquetería: se cobra este precio fijo.</p>
              <div><label class="text-[11px] text-faint" for="sh-local-price">Precio (MXN)</label>
                <input id="sh-local-price" name="local_delivery_price" type="number" min="0" max="10000" step="1" required value="${esc(s.local_delivery_price)}" class="adm-fld tnum w-32" onwheel="this.blur()" /></div>
              <div><label class="text-[11px] text-faint" for="sh-local-zips">Códigos postales (separados por coma, espacio o salto de línea)</label>
                <textarea id="sh-local-zips" name="local_delivery_zips" rows="4" class="adm-fld tnum">${esc((s.local_delivery_zips || []).join(', '))}</textarea></div>
            </div>

            <p data-error class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2" role="alert"></p>
            <button type="submit" data-submit class="adm-btn adm-btn-primary">Guardar ajustes</button>
          </form>
        </div>`

      // ── Pesos por categoria ──
      body.querySelector('#weights').addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-save], [data-del]')
        if (!btn) return
        const row = btn.closest('[data-row]')
        const category = row.dataset.row
        if (btn.matches('[data-del]')) {
          if (!await confirmDelete({ title: '¿Quitar peso?', highlight: category, message: 'La categoría usará el valor por defecto.' })) return
          const { error } = await deleteCategoryWeight(category).catch(e => ({ error: e }))
          if (error) { showToast('No se pudo quitar', 'error'); return }
          rowsByCat.delete(category)
        } else {
          const grams = Number(row.querySelector('[data-grams]').value)
          if (!inRange(grams, 1, 30000)) { showToast('Los gramos deben estar entre 1 y 30000', 'error'); return }
          const needs_box = row.querySelector('[data-box]').checked
          const { error } = await saveCategoryWeight({ category, grams, needs_box }).catch(e => ({ error: e }))
          if (error) { showToast('No se pudo guardar', 'error'); return }
          rowsByCat.set(category, { category, grams, needs_box })
        }
        showToast('Guardado', 'success')
        row.outerHTML = weightRow(category)
      })

      // ── Ajustes generales ──
      const form = body.querySelector('#settings-form')
      const errorEl = form.querySelector('[data-error]')
      const submitBtn = form.querySelector('[data-submit]')
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const fail = (msg) => { errorEl.textContent = msg; errorEl.classList.remove('hidden') }
        errorEl.classList.add('hidden')
        const num = (name) => Number(form.elements[name].value)
        const txt = (name) => sanitizeText(form.elements[name].value)

        const carriers = [...form.querySelectorAll('input[name="carriers"]:checked')].map(i => i.value)
        if (!carriers.length) return fail('Activa al menos una paquetería.')

        const pack = (key) => ({ length: num(`${key}.length`), width: num(`${key}.width`), height: num(`${key}.height`), max_grams: num(`${key}.max_grams`) })
        const envelope = pack('envelope'), box = pack('box')
        for (const [label, p] of [['el sobre', envelope], ['la caja', box]]) {
          if (![p.length, p.width, p.height].every(n => inRange(n, 1, 200))) return fail(`Las medidas de ${label} deben estar entre 1 y 200 cm.`)
          if (!inRange(p.max_grams, 1, 30000)) return fail(`El peso máximo de ${label} debe estar entre 1 y 30000 g.`)
        }

        const origin = { name: txt('o-name'), phone: form.elements['o-phone'].value.replace(/\D/g, ''), street: txt('o-street'), number: txt('o-number'), district: txt('o-district'), city: txt('o-city'), state: form.elements['o-state'].value, postalCode: form.elements['o-postalCode'].value.trim() }
        if (!/^\d{5}$/.test(origin.postalCode)) return fail('El código postal del remitente debe tener 5 dígitos.')
        if (!origin.name || !origin.phone || !origin.street || !origin.city) return fail('Completa nombre, teléfono, calle y ciudad del remitente.')

        if (origin.phone.length !== 10) return fail('El teléfono del remitente debe tener 10 dígitos.')
        const label_print_size = form.elements.label_print_size.value
        if (!PRINT_SIZES.some(([v]) => v === label_print_size)) return fail('Elige un formato de impresión válido.')

        const default_grams = num('default_grams')
        if (!inRange(default_grams, 1, 30000)) return fail('El peso por defecto debe estar entre 1 y 30000 g.')

        const free_shipping_min = num('free_shipping_min')
        if (!form.elements.free_shipping_min.value.trim() || !inRange(free_shipping_min, 1, 100000)) return fail('El envío gratis debe ser un monto entero entre 1 y 100000.')

        const local_delivery_price = num('local_delivery_price')
        if (!form.elements.local_delivery_price.value.trim() || !inRange(local_delivery_price, 0, 10000)) return fail('El precio de entrega local debe ser un monto entero entre 0 y 10000.')
        const local_delivery_zips = parseZips(form.elements.local_delivery_zips.value)
        if (!local_delivery_zips) return fail('Los códigos postales de entrega local deben tener 5 dígitos cada uno.')

        submitBtn.disabled = true
        let error
        try { ({ error } = await saveShippingSettings({ carriers, envelope, box, origin, default_grams, free_shipping_min, local_delivery_price, local_delivery_zips, label_print_size, default_needs_box: form.elements.default_needs_box.checked })) } catch (e) { error = e } finally { submitBtn.disabled = false }
        if (error) return fail('No se pudieron guardar los ajustes.')
        showToast('Ajustes guardados', 'success')
      })
    },
  }
}
