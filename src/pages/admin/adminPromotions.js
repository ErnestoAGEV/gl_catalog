import { getAdminPromotions, createPromotion, updatePromotion, deletePromotion, getState } from '../../store/index.js'
import { showToast } from '../../utils/toast.js'
import { escapeHtml, sanitizeText } from '../../utils/sanitize.js'
import { confirmDelete } from './adminConfirm.js'
import { ICON } from './adminIcons.js'
import { contrastOnWhite, localInputToIso, isoToLocalInput, isRunning } from '../../utils/promotions.js'

const RED = '#D7262B'
const DATE = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Mexico_City' })
const toggle = (name, checked) => `
  <label class="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" name="${name}" class="sr-only peer" ${checked ? 'checked' : ''}>
    <div class="w-10 h-6 bg-line-strong rounded-full peer peer-checked:bg-brand after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-4"></div>
  </label>`

export function promoStatus(p, now = Date.now()) {
  if (!p.active) return { label: 'Pausada', cls: 'bg-canvas text-muted' }
  if (isRunning(p, now)) return { label: 'En curso', cls: 'bg-ok-tint text-ok' }
  if (Date.parse(p.starts_at) > now) return { label: 'Programada', cls: 'bg-brand-tint text-brand' }
  return { label: 'Terminada', cls: 'bg-canvas text-faint' }
}

/** Cuántos productos publicados toca y cuántos rebajados quedan fuera. */
function reach(products, categories, includeOnSale) {
  const pool = products.filter(p => p.badge !== 'Borrador')
    .filter(p => !categories.length || categories.includes(p.type))
  const onSale = (p) => {
    const orig = p.baseOriginalPrice !== undefined ? p.baseOriginalPrice : p.originalPrice
    const price = p.basePrice ?? p.price
    return orig != null && Number(orig) > price
  }
  const excluded = includeOnSale ? 0 : pool.filter(onSale).length
  return { count: pool.length - excluded, excluded }
}

function promoCard(p) {
  const st = promoStatus(p)
  const scope = p.categories?.length ? p.categories.map(escapeHtml).join(', ') : 'Toda la tienda'
  return `
    <div class="bg-paper rounded-3xl border border-line shadow-card overflow-hidden ${!p.active ? 'opacity-60' : ''}">
      ${p.accent_color ? `<div class="h-1.5" style="background:${p.accent_color}"></div>` : ''}
      <div class="p-5 space-y-3">
        <div class="flex items-start justify-between gap-2">
          <span class="inline-flex items-center px-2 h-[20px] rounded-md text-[10.5px] font-semibold ${st.cls}">${st.label}</span>
          <div class="flex items-center gap-1">
            <button data-edit="${p.id}" class="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors" title="Editar" aria-label="Editar ${escapeHtml(p.name)}">${ICON.edit('w-4 h-4')}</button>
            <button data-delete="${p.id}" class="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors" title="Eliminar" aria-label="Eliminar ${escapeHtml(p.name)}">${ICON.trash('w-4 h-4')}</button>
          </div>
        </div>
        <div>
          <p class="font-display font-bold text-ink text-[18px]">${escapeHtml(p.name)} <span class="text-brand tnum">−${p.discount_pct}%</span></p>
          <p class="text-[12.5px] text-muted mt-0.5">${scope}${p.include_on_sale ? ' · incluye rebajados' : ''}</p>
        </div>
        <div class="bg-canvas rounded-xl2 p-3 text-[12.5px] text-body tnum space-y-0.5">
          <p><span class="text-faint">Inicio</span> ${DATE.format(new Date(p.starts_at))}</p>
          <p><span class="text-faint">Fin</span> ${DATE.format(new Date(p.ends_at))}</p>
        </div>
        <div class="flex items-center justify-between pt-1">
          <span class="text-[11.5px] text-faint">${p.show_countdown ? `Cuenta regresiva · aviso ${p.countdown_lead_days} d` : 'Sin cuenta regresiva'}</span>
          <button type="button" data-toggle="${p.id}" class="gl-toggle ${p.active ? 'on' : ''}" title="${p.active ? 'Pausar' : 'Activar'}" aria-label="${p.active ? 'Pausar' : 'Activar'} ${escapeHtml(p.name)}"></button>
        </div>
      </div>
    </div>`
}

export function pageAdminPromotions() {
  return {
    title: 'Promociones | G&L Admin',
    html: `
      <div class="admin-view-in space-y-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="eyebrow text-faint">Catálogo</p>
            <h1 class="font-display font-extrabold text-ink text-[24px] tracking-tight mt-0.5">Promociones</h1>
            <p class="text-[13px] text-muted mt-1">Descuentos automáticos por fecha, sin cupón. Los cupones no se suman a un producto en promoción.</p>
          </div>
          <button id="open-create-modal" class="adm-btn adm-btn-primary">${ICON.plus('w-[18px] h-[18px]')} Crear promoción</button>
        </div>
        <div id="promos-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 admin-stagger">
          <div class="col-span-full py-12 text-center text-faint animate-pulse"><span class="text-[13px] block">Cargando promociones...</span></div>
        </div>
      </div>
    `,

    async onMount(root) {
      const listEl = root.querySelector('#promos-list')
      let promos = []

      const renderList = () => {
        listEl.innerHTML = promos.length ? promos.map(promoCard).join('') : `
          <div class="col-span-full py-16 text-center">
            ${ICON.coupon('w-12 h-12 mx-auto mb-4 text-line-strong')}
            <p class="font-semibold text-body">No hay promociones</p>
            <p class="text-[13px] text-muted mt-1">Crea la primera, por ejemplo el Buen Fin</p>
          </div>`
      }
      const reload = async () => { promos = await getAdminPromotions(); renderList() }
      await reload()

      const openModal = (promo = null) => {
        const isEdit = !!promo
        root.querySelector('#promo-modal')?.remove()
        const types = [...new Set(getState().products.map(p => p.type).filter(Boolean))].sort()
        const cats = promo?.categories || []
        const color = promo?.accent_color || ''
        // Por defecto: mañana 00:00 a 4 días después, en hora de Colima
        const mxDay = (days) => {
          const d = new Date(`${isoToLocalInput(new Date().toISOString()).slice(0, 10)}T12:00:00Z`)
          d.setUTCDate(d.getUTCDate() + days)
          return localInputToIso(`${d.toISOString().slice(0, 10)}T00:00`)
        }
        const defStart = mxDay(1)
        const defEnd = mxDay(5)

        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="promo-modal" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade" role="dialog" aria-modal="true" aria-labelledby="promo-modal-title">
            <div class="w-full max-w-lg bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden max-h-[92vh] flex flex-col">
              <div class="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <h2 id="promo-modal-title" class="font-display font-bold text-ink text-[17px]">${isEdit ? 'Editar promoción' : 'Nueva promoción'}</h2>
                <button type="button" data-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors" aria-label="Cerrar">${ICON.close('w-[18px] h-[18px]')}</button>
              </div>
              <form data-form class="px-5 pb-5 space-y-4 overflow-y-auto adm-scroll-thin flex-1" novalidate>
                <div class="grid grid-cols-3 gap-3">
                  <div class="col-span-2">
                    <label class="adm-lbl" for="pr-name">Nombre *</label>
                    <input id="pr-name" name="name" type="text" required maxlength="60" value="${escapeHtml(promo?.name || '')}" class="adm-fld" placeholder="Buen Fin 2026" />
                  </div>
                  <div>
                    <label class="adm-lbl" for="pr-pct">Descuento %</label>
                    <input id="pr-pct" name="pct" type="number" min="1" max="90" step="1" required value="${promo?.discount_pct ?? ''}" class="adm-fld tnum" placeholder="20" onwheel="this.blur()" />
                  </div>
                </div>

                <fieldset>
                  <legend class="adm-lbl">Aplica a</legend>
                  <div class="flex gap-2 mb-2">
                    <label class="chip cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-ink"><input type="radio" name="scope" value="all" class="sr-only" ${cats.length ? '' : 'checked'}> Toda la tienda</label>
                    <label class="chip cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-ink"><input type="radio" name="scope" value="cats" class="sr-only" ${cats.length ? 'checked' : ''}> Categorías</label>
                  </div>
                  <div data-cats class="${cats.length ? '' : 'hidden'} grid grid-cols-2 gap-2 bg-canvas p-3 rounded-xl2 border border-line max-h-36 overflow-y-auto adm-scroll-thin">
                    ${types.map(t => `
                      <label class="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-line/50 p-1.5 rounded-lg text-body">
                        <input type="checkbox" name="categories" value="${escapeHtml(t)}" class="w-4 h-4 accent-brand" ${cats.includes(t) ? 'checked' : ''}> ${escapeHtml(t)}
                      </label>`).join('')}
                  </div>
                </fieldset>

                <div class="flex items-center justify-between bg-canvas rounded-xl2 px-4 py-3">
                  <div><p class="text-[13.5px] font-semibold text-ink">Incluir productos ya rebajados</p><p class="text-[11.5px] text-faint">Si está apagado, los que ya tienen precio tachado se quedan como están</p></div>
                  ${toggle('include_on_sale', promo?.include_on_sale)}
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="adm-lbl" for="pr-start">Inicio *</label>
                    <input id="pr-start" name="starts_at" type="datetime-local" required value="${isoToLocalInput(promo?.starts_at || defStart)}" class="adm-fld tnum" />
                  </div>
                  <div>
                    <label class="adm-lbl" for="pr-end">Fin *</label>
                    <input id="pr-end" name="ends_at" type="datetime-local" required value="${isoToLocalInput(promo?.ends_at || defEnd)}" class="adm-fld tnum" />
                  </div>
                </div>
                <p class="text-[10.5px] text-faint -mt-2">Hora de Colima (centro de México), aunque este equipo tenga otra zona. El fin es exclusivo: "00:00 del martes" termina al acabar el lunes.</p>

                <fieldset>
                  <legend class="adm-lbl">Color de la promoción</legend>
                  <div class="flex flex-wrap items-center gap-2">
                    <label class="chip cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-ink"><input type="radio" name="color_mode" value="" class="sr-only" ${!color ? 'checked' : ''}> Sin cambio</label>
                    <label class="chip cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-ink"><input type="radio" name="color_mode" value="red" class="sr-only" ${color.toUpperCase() === RED ? 'checked' : ''}> <span class="inline-block w-3 h-3 rounded-full" style="background:${RED}"></span> Rojo Buen Fin</label>
                    <label class="chip cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-ink"><input type="radio" name="color_mode" value="custom" class="sr-only" ${color && color.toUpperCase() !== RED ? 'checked' : ''}> Otro
                      <input type="color" name="custom_color" value="${color && color.toUpperCase() !== RED ? color : '#0F7A3D'}" class="w-6 h-6 rounded border-0 p-0 bg-transparent cursor-pointer" aria-label="Elegir color" /></label>
                  </div>
                  <p class="text-[10.5px] text-faint mt-1">Pinta la franja, las etiquetas y los precios con descuento; el resto de la tienda no cambia. Debe ser oscuro para que el texto blanco se lea.</p>
                </fieldset>

                <div class="flex items-center justify-between bg-canvas rounded-xl2 px-4 py-3 gap-3">
                  <div><p class="text-[13.5px] font-semibold text-ink">Cuenta regresiva</p><p class="text-[11.5px] text-faint">Franja arriba de la tienda: "empieza en…" y "termina en…"</p></div>
                  <div class="flex items-center gap-2">
                    <label class="text-[11.5px] text-faint whitespace-nowrap" for="pr-lead">Aviso (días)</label>
                    <input id="pr-lead" name="lead" type="number" min="0" max="30" value="${promo?.countdown_lead_days ?? 3}" class="adm-fld tnum !w-16" onwheel="this.blur()" />
                    ${toggle('show_countdown', promo ? promo.show_countdown : true)}
                  </div>
                </div>

                <div class="flex items-center justify-between bg-canvas rounded-xl2 px-4 py-3">
                  <div><p class="text-[13.5px] font-semibold text-ink">Activa</p><p class="text-[11.5px] text-faint">Apágala para pausarla sin borrarla</p></div>
                  ${toggle('active', promo ? promo.active : true)}
                </div>

                <p data-preview class="text-[12.5px] text-body bg-brand-tint rounded-xl2 px-4 py-2"></p>
                <p data-warn class="hidden text-[12.5px] text-warn bg-warn-tint rounded-xl2 px-4 py-2"></p>
                <p data-error role="alert" class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2"></p>

                <div class="flex gap-2.5 pt-1">
                  <button type="button" data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                  <button type="submit" data-submit class="adm-btn adm-btn-primary flex-1">${isEdit ? 'Guardar cambios' : 'Crear promoción'}</button>
                </div>
              </form>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)

        const modal = root.querySelector('#promo-modal')
        const form = modal.querySelector('[data-form]')
        const $ = (sel) => form.querySelector(sel)
        const errorEl = modal.querySelector('[data-error]')
        const close = () => modal.remove()
        modal.querySelector('[data-close]').addEventListener('click', close)
        modal.querySelector('[data-cancel]').addEventListener('click', close)
        modal.addEventListener('click', (e) => { if (e.target === modal) close() })
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
        $('#pr-name').focus()

        const read = () => {
          const scopeCats = $('input[name="scope"]:checked').value === 'cats'
          const categories = scopeCats ? [...form.querySelectorAll('input[name="categories"]:checked')].map(i => i.value) : []
          const mode = $('input[name="color_mode"]:checked').value
          const startV = $('input[name="starts_at"]').value
          const endV = $('input[name="ends_at"]').value
          return {
            scopeCats,
            payload: {
              name: sanitizeText($('input[name="name"]').value).trim(),
              discount_pct: Math.round(Number($('input[name="pct"]').value)),
              categories,
              include_on_sale: $('input[name="include_on_sale"]').checked,
              starts_at: startV ? localInputToIso(startV) : null,
              ends_at: endV ? localInputToIso(endV) : null,
              accent_color: mode === 'red' ? RED : mode === 'custom' ? $('input[name="custom_color"]').value.toUpperCase() : null,
              show_countdown: $('input[name="show_countdown"]').checked,
              countdown_lead_days: Math.max(0, Math.min(30, Math.round(Number($('input[name="lead"]').value) || 0))),
              active: $('input[name="active"]').checked,
            },
          }
        }

        const refresh = () => {
          const { scopeCats, payload: p } = read()
          modal.querySelector('[data-cats]').classList.toggle('hidden', !scopeCats)
          const r = reach(getState().products, p.categories, p.include_on_sale)
          modal.querySelector('[data-preview]').textContent = scopeCats && !p.categories.length
            ? 'Elige al menos una categoría.'
            : `Aplica a ${r.count} producto${r.count === 1 ? '' : 's'}${r.excluded ? ` (${r.excluded} ya rebajado${r.excluded === 1 ? '' : 's'} se quedan fuera)` : ''}.`
          // Aviso, no bloqueo: si se enciman gana la de mayor descuento
          const s = Date.parse(p.starts_at), e = Date.parse(p.ends_at)
          const clash = promos.find(o => o.active && o.id !== promo?.id
            && Date.parse(o.starts_at) < e && s < Date.parse(o.ends_at)
            && (!o.categories?.length || !p.categories.length || o.categories.some(c => p.categories.includes(c))))
          const warn = modal.querySelector('[data-warn]')
          warn.classList.toggle('hidden', !clash || !p.active)
          if (clash) warn.textContent = `Se encima con «${clash.name}». En los productos que comparten, gana la de mayor descuento; no se suman.`
        }
        form.addEventListener('input', refresh)
        form.addEventListener('change', refresh)
        refresh()

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          const { scopeCats, payload } = read()
          const fail = (msg) => { errorEl.textContent = msg; errorEl.classList.remove('hidden') }
          errorEl.classList.add('hidden')
          if (!payload.name) return fail('Ponle un nombre (se muestra en la etiqueta del producto).')
          if (!(payload.discount_pct >= 1 && payload.discount_pct <= 90)) return fail('El descuento va de 1% a 90%.')
          if (scopeCats && !payload.categories.length) return fail('Elige al menos una categoría o cambia a "Toda la tienda".')
          if (!payload.starts_at || !payload.ends_at) return fail('Pon la fecha y hora de inicio y de fin.')
          if (Date.parse(payload.ends_at) <= Date.parse(payload.starts_at)) return fail('El fin debe ser después del inicio.')
          if (payload.accent_color && contrastOnWhite(payload.accent_color) < 4.5) {
            return fail('Ese color es muy claro: el texto blanco encima no se leería. Elige uno más oscuro.')
          }

          const btn = modal.querySelector('[data-submit]')
          btn.disabled = true
          btn.textContent = 'Guardando...'
          const result = isEdit ? await updatePromotion(promo.id, payload) : await createPromotion(payload)
          if (result.error) {
            fail('No se pudo guardar la promoción. Intenta de nuevo.')
            btn.disabled = false
            btn.textContent = isEdit ? 'Guardar cambios' : 'Crear promoción'
            return
          }
          showToast(isEdit ? 'Promoción actualizada' : 'Promoción creada', 'success')
          close()
          await reload()
        })
      }

      listEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-edit],[data-delete],[data-toggle]')
        if (!btn) return
        const id = btn.dataset.edit || btn.dataset.delete || btn.dataset.toggle
        const promo = promos.find(p => p.id === id)
        if (!promo) return
        if (btn.dataset.edit) return openModal(promo)
        if (btn.dataset.delete) {
          if (!await confirmDelete({ title: '¿Eliminar promoción?', highlight: promo.name, message: 'No se puede deshacer. Los pedidos ya hechos conservan su precio.' })) return
          const { error } = await deletePromotion(id)
          if (error) return showToast('Error al eliminar', 'error')
          showToast('Promoción eliminada', 'success')
          return reload()
        }
        const { error } = await updatePromotion(id, { active: !promo.active })
        if (error) return showToast('Error al actualizar', 'error')
        showToast(promo.active ? 'Promoción pausada' : 'Promoción activada', 'success')
        reload()
      })
      root.querySelector('#open-create-modal').addEventListener('click', () => openModal())
    },
  }
}
