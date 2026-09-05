import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon, getState } from '../../store/index.js'
import { showToast } from '../../utils/toast.js'
import { sanitizeCouponCode, sanitizeText, sanitizeNumber } from '../../utils/sanitize.js'
import { ICON } from './adminIcons.js'

// ── Helpers ──

function couponCard(c) {
  const discountPct = c.discount ? Math.round(c.discount * 100) : 0
  const catLabel = c.categories && c.categories.length > 0
    ? `<span class="inline-flex items-center px-2 h-[20px] rounded-md text-[10.5px] font-semibold bg-brand-tint text-brand">Solo aplicables</span>`
    : `<span class="inline-flex items-center px-2 h-[20px] rounded-md text-[10.5px] font-semibold bg-canvas text-muted">Toda la tienda</span>`

  return `
    <div class="relative bg-paper rounded-3xl border border-line shadow-card group overflow-hidden ${!c.active ? 'opacity-60' : ''}" data-coupon-code="${c.code}">
      <!-- Notch circles -->
      <div class="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-canvas border border-line"></div>
      <div class="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-canvas border border-line"></div>

      <div class="p-5 space-y-3">
        <!-- Header row -->
        <div class="flex items-start justify-between gap-2">
          ${catLabel}
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button data-edit="${c.code}" class="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors" title="Editar">${ICON.edit('w-4 h-4')}</button>
            <button data-delete="${c.code}" class="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors" title="Eliminar">${ICON.trash('w-4 h-4')}</button>
          </div>
        </div>

        <!-- Code -->
        <div>
          <p class="font-mono font-bold text-[20px] tracking-widest ${c.active ? 'text-ink' : 'text-muted'}">${c.code}</p>
          <p class="text-[12.5px] text-muted mt-0.5 truncate">${c.label || '—'}</p>
        </div>

        <!-- Dashed divider -->
        <div class="border-t border-dashed border-line mx-2"></div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-2.5">
          <div class="bg-canvas rounded-xl2 p-3 text-center">
            <p class="font-display font-bold text-ink text-[18px] tnum">${discountPct ? discountPct + '%' : '—'}</p>
            <p class="eyebrow text-faint mt-1">Descuento</p>
          </div>
          <div class="bg-canvas rounded-xl2 p-3 text-center">
            <p class="font-display font-bold text-[18px] ${c.free_shipping ? 'text-ok' : 'text-faint'}">${c.free_shipping ? 'Sí' : 'No'}</p>
            <p class="eyebrow text-faint mt-1">Envío gratis</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-1">
          <span class="text-[11.5px] text-faint tnum">${new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <button type="button" data-toggle="${c.code}" class="gl-toggle ${c.active ? 'on' : ''}" title="${c.active ? 'Desactivar' : 'Activar'}"></button>
        </div>
      </div>
    </div>`
}

// ── Page ──

export function pageAdminCoupons() {
  return {
    title: 'Cupones | G&L Admin',
    html: `
      <div class="admin-view-in space-y-6">
        <!-- Header -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="eyebrow text-faint">Catálogo</p>
            <h1 class="font-display font-extrabold text-ink text-[24px] tracking-tight mt-0.5">Cupones</h1>
          </div>
          <button id="open-create-modal" class="adm-btn adm-btn-primary">${ICON.plus('w-[18px] h-[18px]')} Crear cupón</button>
        </div>

        <!-- List -->
        <div id="coupons-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 admin-stagger">
          <div class="col-span-full py-12 text-center text-faint animate-pulse">
            ${ICON.coupon('w-8 h-8 mx-auto mb-2 text-line-strong')}
            <span class="text-[13px] block">Cargando cupones...</span>
          </div>
        </div>
      </div>
    `,

    async onMount(root) {
      const listEl = root.querySelector('#coupons-list')
      let coupons = []

      const renderList = () => {
        if (!coupons.length) {
          listEl.innerHTML = `
            <div class="col-span-full py-16 text-center">
              ${ICON.coupon('w-12 h-12 mx-auto mb-4 text-line-strong')}
              <p class="font-semibold text-body">No hay cupones</p>
              <p class="text-[13px] text-muted mt-1">Crea el primero con el botón de arriba</p>
            </div>`
          return
        }
        listEl.innerHTML = coupons.map(couponCard).join('')
      }

      coupons = await getAdminCoupons()
      renderList()

      // ── Modal ──
      const openModal = (coupon = null) => {
        const isEdit = !!coupon
        root.querySelector('#coupon-modal')?.remove()

        const availableTypes = [...new Set(getState().products.map(p => p.type).filter(Boolean))].sort()
        const selectedTypes = isEdit && coupon.categories ? coupon.categories : []

        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="coupon-modal" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade">
            <div class="w-full max-w-md bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden max-h-[90vh] flex flex-col">
              <div class="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <h2 class="font-display font-bold text-ink text-[17px]">${isEdit ? 'Editar cupón' : 'Crear nuevo cupón'}</h2>
                <button data-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">${ICON.close('w-[18px] h-[18px]')}</button>
              </div>
              <form data-form class="px-5 pb-5 space-y-4 overflow-y-auto adm-scroll-thin flex-1">
                ${isEdit ? `<input type="hidden" name="id" value="${coupon.id}">` : ''}
                <div>
                  <label class="adm-lbl">Código *</label>
                  <input name="code" type="text" required maxlength="20" value="${isEdit ? coupon.code : ''}" class="adm-fld font-mono uppercase" placeholder="VERANO25" ${isEdit ? 'readonly style="background:#F5F6F8;cursor:not-allowed"' : ''} />
                  <p class="text-[10.5px] text-faint mt-1">Solo letras y números, máx. 20 caracteres</p>
                </div>
                <div>
                  <label class="adm-lbl">Descripción</label>
                  <input name="label" type="text" maxlength="100" value="${isEdit ? (coupon.label || '') : ''}" class="adm-fld" placeholder="Descuento de verano 25%" />
                </div>
                <div>
                  <label class="adm-lbl">Descuento (%)</label>
                  <input name="discount" type="number" min="0" max="100" step="1" value="${isEdit ? Math.round((coupon.discount || 0) * 100) : ''}" class="adm-fld tnum" placeholder="25" onwheel="this.blur()" />
                </div>

                <!-- Categories -->
                <div>
                  <label class="adm-lbl">Aplicar solo a categorías (opcional)</label>
                  <p class="text-[10.5px] text-faint mb-2">Si no seleccionas ninguna, aplica a toda la tienda.</p>
                  <div class="grid grid-cols-2 gap-2 bg-canvas p-3 rounded-xl2 border border-line max-h-36 overflow-y-auto adm-scroll-thin">
                    ${availableTypes.map(type => `
                      <label class="flex items-center gap-2 text-[13px] cursor-pointer hover:bg-line/50 p-1.5 rounded-lg transition-colors text-body">
                        <input type="checkbox" name="categories" value="${type}" class="rounded text-brand focus:ring-brand w-4 h-4 accent-brand" ${selectedTypes.includes(type) ? 'checked' : ''}>
                        ${type}
                      </label>
                    `).join('')}
                  </div>
                </div>

                <!-- Toggles -->
                <div class="flex items-center justify-between bg-canvas rounded-xl2 px-4 py-3">
                  <div><p class="text-[13.5px] font-semibold text-ink">Envío gratis</p><p class="text-[11.5px] text-faint">Incluye envío gratuito</p></div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="free_shipping" class="sr-only peer" ${isEdit && coupon.free_shipping ? 'checked' : ''}>
                    <div class="w-10 h-6 bg-line-strong rounded-full peer peer-checked:bg-brand after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between bg-canvas rounded-xl2 px-4 py-3">
                  <div><p class="text-[13.5px] font-semibold text-ink">Cupón activo</p><p class="text-[11.5px] text-faint">Los clientes pueden usarlo</p></div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="active" class="sr-only peer" ${!isEdit || coupon.active ? 'checked' : ''}>
                    <div class="w-10 h-6 bg-line-strong rounded-full peer peer-checked:bg-brand after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                </div>

                <p data-error class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2"></p>

                <div class="flex gap-2.5 pt-2">
                  <button type="button" data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                  <button type="submit" data-submit class="adm-btn adm-btn-primary flex-1">${isEdit ? 'Guardar cambios' : 'Crear cupón'}</button>
                </div>
              </form>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)

        const modal = root.querySelector('#coupon-modal')
        const form = modal.querySelector('[data-form]')
        const errorEl = modal.querySelector('[data-error]')
        const submitBtn = modal.querySelector('[data-submit]')
        const close = () => modal.remove()

        modal.querySelector('[data-close]').addEventListener('click', close)
        modal.querySelector('[data-cancel]').addEventListener('click', close)
        modal.addEventListener('click', (e) => { if (e.target === modal) close() })

        const codeInput = form.querySelector('input[name="code"]')
        if (!isEdit) codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase() })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')

          const code = sanitizeCouponCode(codeInput.value)
          const label = sanitizeText(form.querySelector('input[name="label"]').value)
          const discountPct = sanitizeNumber(form.querySelector('input[name="discount"]').value, 0)
          const discount = Math.round(discountPct) / 100
          const freeShipping = form.querySelector('input[name="free_shipping"]').checked
          const active = form.querySelector('input[name="active"]').checked
          const categories = Array.from(form.querySelectorAll('input[name="categories"]:checked')).map(i => i.value)

          if (!code) { errorEl.textContent = 'El código es requerido y solo puede tener letras y números.'; errorEl.classList.remove('hidden'); return }

          submitBtn.disabled = true
          submitBtn.textContent = 'Guardando...'

          const originalCode = form.querySelector('input[name="id"]')?.value
          const payload = { label, discount, free_shipping: freeShipping, active, categories }
          if (!originalCode) payload.code = code

          let result
          if (originalCode) {
            result = await updateCoupon(originalCode, payload)
          } else {
            result = await createCoupon({ ...payload, code })
          }

          if (result.error) {
            const errMsg = result.error?.message || JSON.stringify(result.error)
            errorEl.textContent = errMsg.includes('duplicate') || errMsg.includes('unique') ? 'Ya existe un cupón con ese código.' : 'Error al guardar el cupón.'
            errorEl.classList.remove('hidden')
            submitBtn.disabled = false
            submitBtn.textContent = originalCode ? 'Guardar cambios' : 'Crear cupón'
            return
          }

          showToast(originalCode ? 'Cupón actualizado' : 'Cupón creado', 'success')
          coupons = await getAdminCoupons()
          renderList()
          bindListEvents()
          close()
        })
      }

      // ── List events ──
      const bindListEvents = () => {
        listEl.querySelectorAll('[data-edit]').forEach(btn => {
          btn.addEventListener('click', () => {
            const coupon = coupons.find(c => c.code === btn.dataset.edit)
            if (coupon) openModal(coupon)
          })
        })

        listEl.querySelectorAll('[data-delete]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const code = btn.dataset.delete
            const coupon = coupons.find(c => c.code === code)
            if (!coupon) return
            openDeleteConfirm(coupon)
          })
        })

        listEl.querySelectorAll('[data-toggle]').forEach(toggle => {
          toggle.addEventListener('click', async () => {
            const code = toggle.dataset.toggle
            const coupon = coupons.find(c => c.code === code)
            if (!coupon) return
            const newActive = !coupon.active
            const { error } = await updateCoupon(code, { active: newActive })
            if (error) { showToast('Error al actualizar', 'error'); return }
            coupon.active = newActive
            showToast(newActive ? 'Cupón activado' : 'Cupón desactivado', 'success')
            renderList()
            bindListEvents()
          })
        })
      }

      const openDeleteConfirm = (coupon) => {
        root.querySelector('#coupon-delete-modal')?.remove()
        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="coupon-delete-modal" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade">
            <div class="w-full max-w-sm bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden">
              <div class="p-5 text-center">
                <div class="w-11 h-11 rounded-xl2 bg-bad-tint text-bad flex items-center justify-center mx-auto mb-3">${ICON.trash('w-5 h-5')}</div>
                <h3 class="font-display font-bold text-ink text-[17px]">¿Eliminar cupón?</h3>
                <p class="text-[13.5px] text-muted mt-1">Vas a eliminar <span class="font-mono font-semibold text-body">"${coupon.code}"</span>. No se puede deshacer.</p>
              </div>
              <div class="px-5 pb-5 flex gap-2.5">
                <button data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                <button data-confirm class="adm-btn flex-1" style="background:#D6453E;color:#fff">Eliminar</button>
              </div>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)
        const modal = root.querySelector('#coupon-delete-modal')
        const close = () => modal.remove()
        modal.querySelector('[data-cancel]').addEventListener('click', close)
        modal.addEventListener('click', (e) => { if (e.target === modal) close() })
        modal.querySelector('[data-confirm]').addEventListener('click', async () => {
          const { error } = await deleteCoupon(coupon.code)
          if (error) { showToast('Error al eliminar', 'error'); close(); return }
          showToast('Cupón eliminado', 'success')
          coupons = coupons.filter(c => c.code !== coupon.code)
          renderList()
          bindListEvents()
          close()
        })
      }

      bindListEvents()
      root.querySelector('#open-create-modal').addEventListener('click', () => openModal())
    }
  }
}
