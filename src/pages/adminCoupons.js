import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from '../app/store.js'
import { showToast } from '../app/toast.js'
import { sanitizeCouponCode, sanitizeText, sanitizeNumber } from '../app/sanitize.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function couponCard(c) {
  const discountPct = c.discount ? Math.round(c.discount * 100) : 0
  return `
    <div class="bg-white border ${c.active ? 'border-brand/30' : 'border-gray-200 opacity-60'} rounded-2xl p-5 relative group flex flex-col gap-3" data-coupon-code="${c.code}">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}">${c.active ? 'Activo' : 'Inactivo'}</span>
        </div>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button data-edit="${c.code}" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand transition-colors" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button data-delete="${c.code}" class="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>

      <!-- Code -->
      <div>
        <p class="text-2xl font-bold font-manrope tracking-wider ${c.active ? 'text-brand' : 'text-gray-700'}">${c.code}</p>
        <p class="text-sm text-gray-500 mt-0.5">${c.label || '—'}</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
        <div class="bg-gray-50 rounded-xl p-3 text-center">
          <p class="text-lg font-bold text-gray-900">${discountPct ? discountPct + '%' : '—'}</p>
          <p class="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Descuento</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-3 text-center">
          <p class="text-lg font-bold ${c.free_shipping ? 'text-green-600' : 'text-gray-400'}">${c.free_shipping ? '✓' : '✗'}</p>
          <p class="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Envío gratis</p>
        </div>
      </div>

      <!-- Toggle activo -->
      <div class="flex items-center justify-between pt-1">
        <span class="text-xs text-gray-400">${new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer" data-toggle="${c.code}" ${c.active ? 'checked' : ''}>
          <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
        </label>
      </div>
    </div>
  `
}

function modalHTML(c = null) {
  const isEdit = !!c
  return `
    <div id="coupon-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 class="text-lg font-bold font-manrope text-gray-900">${isEdit ? 'Editar cupón' : 'Crear nuevo cupón'}</h2>
          <button id="modal-close" class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form -->
        <form id="coupon-form" class="p-6 space-y-4">
          ${isEdit ? `<input type="hidden" name="id" value="${c.id}">` : ''}

          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Código *</label>
            <input name="code" type="text" required maxlength="20" value="${isEdit ? c.code : ''}"
              class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono uppercase focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors"
              placeholder="VERANO25" ${isEdit ? 'readonly class="bg-gray-50 cursor-not-allowed"' : ''}/>
            <p class="text-[10px] text-gray-400 mt-1">Solo letras y números, máx. 20 caracteres</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descripción</label>
            <input name="label" type="text" maxlength="100" value="${isEdit ? (c.label || '') : ''}"
              class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors"
              placeholder="Descuento de verano 25%"/>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descuento (%)</label>
            <input name="discount" type="number" min="0" max="100" step="1" value="${isEdit ? Math.round((c.discount || 0) * 100) : ''}"
              class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors"
              placeholder="25"/>
          </div>

          <div class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
              <p class="text-sm font-medium text-gray-900">Envío gratis</p>
              <p class="text-xs text-gray-400">El cupón incluye envío gratuito</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="free_shipping" class="sr-only peer" ${isEdit && c.free_shipping ? 'checked' : ''}>
              <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
            </label>
          </div>

          <div class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
              <p class="text-sm font-medium text-gray-900">Cupón activo</p>
              <p class="text-xs text-gray-400">Los clientes pueden usar este cupón</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="active" class="sr-only peer" ${!isEdit || c.active ? 'checked' : ''}>
              <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
            </label>
          </div>

          <!-- Error -->
          <p id="coupon-form-error" class="hidden text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2"></p>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button type="button" id="modal-cancel" class="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" id="coupon-submit" class="flex-1 px-4 py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors">
              ${isEdit ? 'Guardar cambios' : 'Crear cupón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function pageAdminCoupons() {
  return {
    title: 'Cupones | G&L Admin',
    html: `
      <div class="animate-fade-in space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-manrope font-bold text-gray-900">Cupones</h1>
            <p class="text-gray-500 mt-1 text-sm">Crea y gestiona códigos de descuento</p>
          </div>
          <button id="open-create-modal" class="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Crear cupón
          </button>
        </div>

        <!-- List -->
        <div id="coupons-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <div class="col-span-full py-12 text-center text-gray-400">
            <div class="animate-pulse flex flex-col items-center gap-2">
              <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              <span class="text-sm">Cargando cupones...</span>
            </div>
          </div>
        </div>
      </div>
    `,

    async onMount(root) {
      const listEl = root.querySelector('#coupons-list')
      let coupons = []

      // ── Render list ──
      const renderList = () => {
        if (coupons.length === 0) {
          listEl.innerHTML = `
            <div class="col-span-full py-16 text-center text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              <p class="font-medium text-gray-500">No hay cupones todavía</p>
              <p class="text-sm text-gray-400 mt-1">Crea el primero con el botón de arriba</p>
            </div>
          `
          return
        }
        listEl.innerHTML = coupons.map(couponCard).join('')
      }

      // ── Load ──
      coupons = await getAdminCoupons()
      renderList()

      // ── Modal helpers ──
      let activeModal = null

      const openModal = (coupon = null) => {
        // Eliminar modal previo si existe
        root.querySelector('#coupon-modal')?.remove()

        const div = document.createElement('div')
        div.innerHTML = modalHTML(coupon)
        root.appendChild(div.firstElementChild)

        const modal = root.querySelector('#coupon-modal')
        const form = modal.querySelector('#coupon-form')
        const errorEl = modal.querySelector('#coupon-form-error')
        const submitBtn = modal.querySelector('#coupon-submit')

        const closeModal = () => modal.remove()

        modal.querySelector('#modal-close').addEventListener('click', closeModal)
        modal.querySelector('#modal-cancel').addEventListener('click', closeModal)
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal() })

        // Auto-uppercase code
        const codeInput = form.querySelector('input[name="code"]')
        codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase() })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')

          const code = sanitizeCouponCode(codeInput.value)
          const label = sanitizeText(form.querySelector('input[name="label"]').value)
          const discountPct = sanitizeNumber(form.querySelector('input[name="discount"]').value, 0)
          const discount = Math.round(discountPct) / 100  // guardar como decimal en DB
          const freeShipping = form.querySelector('input[name="free_shipping"]').checked
          const active = form.querySelector('input[name="active"]').checked

          if (!code) {
            errorEl.textContent = 'El código es requerido y solo puede tener letras y números.'
            errorEl.classList.remove('hidden')
            return
          }

          submitBtn.disabled = true
          submitBtn.textContent = 'Guardando...'

          const originalCode = form.querySelector('input[name="id"]')?.value
          const payload = { label, discount, free_shipping: freeShipping, active }
          // Solo añadir code al payload si es creación (en edición el code es PK, no se puede cambiar)
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
          closeModal()
        })
      }

      // ── List event delegation ──
      const bindListEvents = () => {
        // Edit
        listEl.querySelectorAll('[data-edit]').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = btn.dataset.edit
            const coupon = coupons.find(c => c.code === code)
            if (coupon) openModal(coupon)
          })
        })

        // Delete
        listEl.querySelectorAll('[data-delete]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const code = btn.dataset.delete
            const coupon = coupons.find(c => c.code === code)
            if (!coupon) return
            if (!confirm(`¿Eliminar el cupón "${coupon.code}"? Esta acción no se puede deshacer.`)) return
            const { error } = await deleteCoupon(code)
            if (error) { showToast('Error al eliminar el cupón', 'error'); return }
            showToast('Cupón eliminado', 'success')
            coupons = coupons.filter(c => c.code !== code)
            renderList()
            bindListEvents()
          })
        })

        // Toggle active
        listEl.querySelectorAll('[data-toggle]').forEach(toggle => {
          toggle.addEventListener('change', async () => {
            const code = toggle.dataset.toggle
            const { error } = await updateCoupon(code, { active: toggle.checked })
            if (error) {
              showToast('Error al actualizar el estado', 'error')
              toggle.checked = !toggle.checked
              return
            }
            const coupon = coupons.find(c => c.code === code)
            if (coupon) coupon.active = toggle.checked
            showToast(toggle.checked ? 'Cupón activado' : 'Cupón desactivado', 'success')
            renderList()
            bindListEvents()
          })
        })
      }

      bindListEvents()

      // ── Open create modal ──
      root.querySelector('#open-create-modal').addEventListener('click', () => openModal())
    }
  }
}
