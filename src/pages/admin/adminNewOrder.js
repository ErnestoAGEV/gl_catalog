import { getState, quoteShipping, getShippingSettings, checkCoupon, createManualOrder } from '../../store/index.js'
import { navigate } from '../../core/router.js'
import { showToast } from '../../utils/toast.js'
import { escapeHtml, sanitizeText } from '../../utils/sanitize.js'
import { formatMoney } from '../../utils/format.js'
import { BRAND } from '../../utils/config.js'
import { couponBase } from '../../utils/promotions.js'
import { validateManualOrder, previewTotals, pickQuoteTier } from '../../utils/manualOrder.js'
import { MX_STATES, isMxZip, isFreeShipping } from '../../../supabase/functions/_shared/shipping.js'
import { TIER_NAMES, carrierName } from '../checkout/shippingBlock.js'
import { ICON } from './adminIcons.js'

const esc = (v) => escapeHtml(String(v ?? ''))
const ENVIO = 'Envío a domicilio'
const PAYMENTS = ['Transferencia', 'Efectivo', 'Tarjeta', 'Pago al recoger']
const STATUSES = [['pendientedepago', 'Pendiente de pago'], ['completado', 'Completado'], ['cancelado', 'Cancelado']]
const MAX_RESULTS = 8

const section = (n, title, body) => `
  <section class="bg-paper rounded-3xl border border-line shadow-card p-5 space-y-4">
    <h2 class="font-display font-bold text-ink text-[16px]"><span class="text-faint tnum mr-1.5">${n}</span>${title}</h2>
    ${body}
  </section>`

const field = (id, label, attrs = '', cls = '') => `
  <div class="${cls}"><label class="adm-lbl" for="${id}">${label}</label><input id="${id}" class="adm-fld" ${attrs} /></div>`

export function pageAdminNewOrder() {
  return {
    title: 'Nuevo pedido | G&L Admin',
    html: `
      <div class="admin-view-in space-y-6 max-w-3xl">
        <div>
          <a href="/admin/orders" class="text-[13px] text-muted hover:text-ink">← Pedidos</a>
          <h1 class="font-display font-extrabold text-ink text-[24px] tracking-tight mt-1">Nuevo pedido</h1>
          <p class="text-[13px] text-muted mt-1">Para ventas cerradas por WhatsApp. No se manda ningún correo.</p>
        </div>
        <form id="new-order" class="space-y-6" novalidate>
          ${section(1, 'Cliente', `
            <div class="grid sm:grid-cols-2 gap-3">
              ${field('no-name', 'Nombre *', 'name="name" type="text" maxlength="80" autocomplete="off" required')}
              ${field('no-whatsapp', 'WhatsApp *', 'name="whatsapp" type="tel" inputmode="tel" maxlength="20" autocomplete="off" required')}
              ${field('no-email', 'Correo (opcional)', 'name="email" type="email" maxlength="120" autocomplete="off"', 'sm:col-span-2')}
            </div>`)}

          ${section(2, 'Productos', `
            <div>
              <label class="adm-lbl" for="no-search">Buscar producto</label>
              <input id="no-search" type="search" class="adm-fld" placeholder="Nombre o marca" autocomplete="off" aria-controls="no-results" />
              <ul id="no-results" class="mt-2 space-y-1"></ul>
            </div>
            <div id="no-items"></div>`)}

          ${section(3, 'Entrega y pago', `
            <div class="grid sm:grid-cols-2 gap-3">
              <div><label class="adm-lbl" for="no-payment">Método de pago</label>
                <select id="no-payment" name="paymentMethod" class="adm-fld">${PAYMENTS.map(p => `<option>${esc(p)}</option>`).join('')}</select></div>
              <div><label class="adm-lbl" for="no-delivery">Entrega</label>
                <select id="no-delivery" name="deliveryMethod" class="adm-fld"><option>Recoger en tienda</option><option>${ENVIO}</option></select></div>
            </div>
            <div id="no-address" class="hidden space-y-3" data-addr>
              <div class="grid sm:grid-cols-2 gap-3">
                ${field('no-street', 'Calle *', 'name="street" type="text" maxlength="80"')}
                <div class="grid grid-cols-2 gap-3">
                  ${field('no-numExt', 'Núm. ext. *', 'name="numExt" type="text" maxlength="12"')}
                  ${field('no-numInt', 'Núm. int.', 'name="numInt" type="text" maxlength="12"')}
                </div>
                ${field('no-neighborhood', 'Colonia *', 'name="neighborhood" type="text" maxlength="80"')}
                ${field('no-city', 'Ciudad *', 'name="city" type="text" maxlength="80"')}
                <div><label class="adm-lbl" for="no-state">Estado *</label>
                  <select id="no-state" name="state" class="adm-fld"><option value="">Elige</option>${MX_STATES.map(s => `<option value="${esc(s.code)}">${esc(s.name)}</option>`).join('')}</select></div>
                ${field('no-zip', 'Código postal *', 'name="zip" type="text" inputmode="numeric" maxlength="5"')}
                ${field('no-references', 'Referencias', 'name="references" type="text" maxlength="120"', 'sm:col-span-2')}
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <button type="button" id="no-quote-btn" class="adm-btn adm-btn-ghost">Cotizar envío</button>
                <label class="flex items-center gap-1.5 text-[13px] text-body"><input id="no-local" type="checkbox" class="w-4 h-4 accent-brand"> Entrega local (Colima / Villa de Álvarez)</label>
              </div>
              <div id="no-quote" aria-live="polite" class="text-[13px]"></div>
              <div><label class="adm-lbl" for="no-shipping">Costo de envío (MXN)</label>
                <input id="no-shipping" name="shippingCost" type="number" inputmode="decimal" min="0" max="10000" step="0.01" class="adm-fld tnum w-36" />
                <p class="text-[11.5px] text-faint mt-1">Vacío con cotización: lo calcula el sistema.</p></div>
            </div>`)}

          ${section(4, 'Cupón', `
            <div class="flex gap-2">
              <div class="flex-1"><label class="adm-lbl" for="no-coupon">Código (opcional)</label>
                <input id="no-coupon" name="couponCode" type="text" maxlength="30" autocomplete="off" class="adm-fld uppercase" /></div>
              <button type="button" id="no-coupon-btn" class="adm-btn adm-btn-ghost self-end">Validar</button>
            </div>
            <p id="no-coupon-msg" class="text-[13px]" aria-live="polite"></p>`)}

          ${section(5, 'Estado del pedido', `
            <div><label class="adm-lbl" for="no-status">Estado</label>
              <select id="no-status" name="status" class="adm-fld sm:w-64">${STATUSES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>`)}

          ${section(6, 'Resumen', `
            <div id="no-summary" aria-live="polite"></div>
            <p id="new-order-errors" role="alert" aria-live="assertive" class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2"></p>
            <button type="submit" id="no-save" class="adm-btn adm-btn-primary">Guardar pedido</button>`)}
        </form>
      </div>`,

    onMount(root) {
      const $ = (sel) => root.querySelector(sel)
      const form = {
        name: '', whatsapp: '', email: '', items: [], couponCode: '', paymentMethod: PAYMENTS[0],
        deliveryMethod: 'Recoger en tienda', address: { street: '', numExt: '', numInt: '', neighborhood: '', city: '', state: '', stateName: '', zip: '', references: '' },
        quote: null, tier: null, shippingCost: null, costEdited: false, local: false, status: 'pendientedepago',
      }
      let coupon = null
      let localPrice = null
      let saving = false
      let quoteSeq = 0
      const products = () => getState().products.filter(p => p.badge !== 'Borrador')
      const product = (id) => getState().products.find(p => String(p.id) === String(id))
      const isHome = () => form.deliveryMethod === ENVIO

      // ── Productos ──
      const renderResults = () => {
        const term = $('#no-search').value.trim().toLowerCase()
        const list = term ? products().filter(p => [p.name, p.brand].join(' ').toLowerCase().includes(term)).slice(0, MAX_RESULTS) : []
        $('#no-results').innerHTML = !term ? '' : list.length
          ? list.map(p => `<li><button type="button" data-add="${esc(p.id)}" class="w-full flex items-center justify-between gap-3 text-left px-3 h-10 rounded-xl2 bg-canvas hover:bg-line/60 text-[13.5px]"><span class="truncate text-ink">${esc(p.name)}${p.brand ? ` <span class="text-faint">· ${esc(p.brand)}</span>` : ''}</span><span class="tnum text-muted shrink-0">${formatMoney(p.price)}</span></button></li>`).join('')
          : '<li class="text-[13px] text-muted">Sin resultados.</li>'
      }
      const selectHtml = (label, key, idx, opts, value) => opts?.length
        ? `<label class="text-[11px] text-faint block">${label}<select data-key="${key}" data-idx="${idx}" class="adm-fld mt-0.5 py-2">${opts.map(o => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>` : ''
      const renderItems = () => {
        $('#no-items').innerHTML = form.items.length ? form.items.map((it, i) => {
          const p = product(it.productId)
          return `<div class="flex flex-wrap items-end gap-3 py-3 border-t border-line first:border-t-0">
            <div class="flex-1 min-w-[160px]"><p class="text-[13.5px] font-semibold text-ink">${esc(p?.name || 'Producto')}</p><p class="text-[12px] text-muted tnum">${formatMoney(p?.price || 0)} c/u</p></div>
            ${selectHtml('Talla', 'size', i, p?.sizes, it.size)}
            ${selectHtml('Color', 'color', i, p?.colors, it.color)}
            <label class="text-[11px] text-faint block">Cant.<input data-key="qty" data-idx="${i}" type="number" min="1" max="99" step="1" value="${esc(it.qty)}" class="adm-fld tnum mt-0.5 py-2 w-20" /></label>
            <button type="button" data-remove="${i}" class="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint" aria-label="Quitar ${esc(p?.name || 'producto')}">${ICON.trash('w-4 h-4')}</button>
          </div>`
        }).join('') : '<p class="text-[13px] text-muted">Todavía no agregas productos.</p>'
      }
      const addItem = (id) => {
        const p = product(id)
        if (!p) return
        const size = p.sizes?.[0] || ''
        const color = p.colors?.[0] || ''
        const same = form.items.find(i => String(i.productId) === String(p.id) && i.size === size && i.color === color)
        if (same) same.qty = Math.min(99, same.qty + 1)
        else form.items.push({ productId: p.id, size, color, qty: 1 })
        $('#no-search').value = ''
        renderResults(); renderItems(); itemsChanged()
      }

      // ── Cupón ──
      const couponDiscount = () => coupon
        ? couponBase(form.items.map(i => ({ product: product(i.productId), qty: Number(i.qty) || 0 })), coupon.categories || []) * (coupon.discount || 0)
        : 0

      // ── Envío ──
      const quoteMsg = (html, cls = 'text-muted') => { $('#no-quote').innerHTML = `<p class="${cls}">${html}</p>` }
      const subtotalNow = () => previewTotals(form, products()).subtotal
      const freeNow = () => form.quote ? isFreeShipping(subtotalNow(), coupon, form.quote.freeShippingMin ?? BRAND.freeShippingMin) : false
      const setCost = (v) => { form.shippingCost = v; $('#no-shipping').value = v == null ? '' : String(v) }
      const applyTier = () => {
        const r = form.quote && form.tier ? pickQuoteTier(form.quote, form.tier, freeNow()) : null
        if (!r) return
        form.local = r.local
        $('#no-local').checked = r.local
        if (!form.costEdited) setCost(r.cost)
      }
      const renderQuote = () => {
        const q = form.quote
        if (!q) { $('#no-quote').innerHTML = ''; return }
        const rows = ['standard', 'express'].filter(t => q[t]).map(t => {
          const cost = pickQuoteTier(q, t, freeNow()).cost
          return `<label class="flex items-center gap-2 bg-canvas rounded-xl2 px-3 py-2 cursor-pointer"><input type="radio" name="tier" value="${t}" class="accent-brand" ${form.tier === t ? 'checked' : ''}> <span class="text-ink">${esc(TIER_NAMES[t])} · ${esc(carrierName(q[t].carrier))}</span><span class="ml-auto tnum text-body">${cost > 0 ? formatMoney(cost) : 'Gratis'}</span></label>`
        }).join('')
        $('#no-quote').innerHTML = `<div class="space-y-2" role="radiogroup" aria-label="Servicio de envío">${rows}</div>`
      }
      // Cualquier cambio de destino o carrito deja la cotizacion vieja sin valor
      const dropQuote = () => {
        quoteSeq++
        if (!form.quote) return
        form.quote = null; form.tier = null
        if (!form.costEdited) setCost(null)
        renderQuote()
      }
      const itemsChanged = () => { dropQuote(); renderSummary() }

      const runQuote = async () => {
        const a = form.address
        if (!isMxZip(a.zip) || !a.state || !sanitizeText(a.city) || !form.items.length) {
          quoteMsg('Completa código postal, estado, ciudad y al menos un producto para cotizar.', 'text-bad'); return
        }
        const seq = ++quoteSeq
        const btn = $('#no-quote-btn')
        btn.disabled = true
        quoteMsg('Cotizando…')
        const res = await quoteShipping({ zipCode: a.zip, state: a.state, city: sanitizeText(a.city), items: form.items.map(i => ({ productId: i.productId, qty: Number(i.qty) || 0 })) })
        btn.disabled = false
        if (seq !== quoteSeq) return
        if (res.fallback) { form.quote = null; quoteMsg('No se pudo cotizar. Escribe el costo de envío a mano.', 'text-bad'); return }
        form.quote = res
        form.tier = 'standard'
        form.costEdited = false
        renderQuote(); applyTier(); renderSummary()
      }

      // ── Resumen ──
      function renderSummary() {
        const { subtotal, shipping } = previewTotals(form, products())
        const disc = couponDiscount()
        const row = (l, v, cls = 'text-muted') => `<div class="flex justify-between text-[13px] ${cls}"><span>${l}</span><span class="tnum">${v}</span></div>`
        $('#no-summary').innerHTML = `<div class="space-y-1">
          ${row('Subtotal', formatMoney(subtotal))}
          ${disc > 0 ? row(`Descuento (${esc(coupon.code)})`, `−${formatMoney(disc)}`, 'text-ok') : ''}
          ${isHome() ? row('Envío', formatMoney(shipping)) : ''}
          <div class="flex justify-between pt-1"><span class="font-display font-bold text-ink text-[16px]">Total</span><span class="font-display font-extrabold text-ink text-[20px] tnum">${formatMoney(Math.max(0, subtotal - disc) + shipping)}</span></div>
          <p class="text-[11.5px] text-faint">Aproximado. El total final lo calcula el sistema al guardar.</p></div>`
      }

      // ── Eventos ──
      const errBox = $('#new-order-errors')
      const showErrors = (list) => { errBox.innerHTML = list.map(e => `<span class="block">${esc(e)}</span>`).join(''); errBox.classList.toggle('hidden', !list.length) }

      $('#no-search').addEventListener('input', renderResults)
      $('#no-search').addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return
        e.preventDefault()
        $('#no-results [data-add]')?.click()
      })
      $('#no-results').addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (b) addItem(b.dataset.add) })
      $('#no-items').addEventListener('click', (e) => {
        const b = e.target.closest('[data-remove]')
        if (!b) return
        form.items.splice(Number(b.dataset.remove), 1)
        renderItems(); itemsChanged()
      })
      $('#no-items').addEventListener('change', (e) => {
        const t = e.target
        const it = form.items[Number(t.dataset.idx)]
        if (!it || !t.dataset.key) return
        it[t.dataset.key] = t.dataset.key === 'qty' ? Math.min(99, Math.max(1, Math.floor(Number(t.value)) || 1)) : t.value
        if (t.dataset.key === 'qty') t.value = it.qty
        itemsChanged()
      })

      $('#new-order').addEventListener('input', (e) => {
        const t = e.target
        const n = t.name
        if (n in form.address) {
          form.address[n] = t.value
          if (n === 'state') form.address.stateName = MX_STATES.find(s => s.code === t.value)?.name || ''
          if (['zip', 'state', 'city'].includes(n)) dropQuote()
        } else if (n === 'shippingCost') {
          form.shippingCost = t.value === '' ? null : Number(t.value)
          form.costEdited = t.value !== ''
          renderSummary()
        } else if (n === 'couponCode') {
          form.couponCode = t.value
          coupon = null; $('#no-coupon-msg').textContent = ''
          renderSummary()
        } else if (n === 'paymentMethod' || n === 'status' || n === 'name' || n === 'whatsapp' || n === 'email') {
          form[n] = t.value
        } else if (n === 'deliveryMethod') {
          form.deliveryMethod = t.value
          $('#no-address').classList.toggle('hidden', !isHome())
          renderSummary()
        }
      })
      $('#no-quote').addEventListener('change', (e) => {
        if (e.target.name !== 'tier') return
        form.tier = e.target.value
        applyTier(); renderQuote(); renderSummary()
      })
      $('#no-quote-btn').addEventListener('click', runQuote)
      $('#no-local').addEventListener('change', async (e) => {
        form.local = e.target.checked
        if (form.local && form.shippingCost == null) {
          if (localPrice == null) { try { localPrice = Number((await getShippingSettings()).settings?.local_delivery_price) } catch (_e) { localPrice = NaN } }
          if (Number.isFinite(localPrice)) { setCost(localPrice); form.costEdited = true; renderSummary() }
        }
      })
      $('#no-coupon-btn').addEventListener('click', async () => {
        const msg = $('#no-coupon-msg')
        const { coupon: c, error } = await checkCoupon(form.couponCode)
        coupon = c || null
        msg.className = `text-[13px] ${c ? 'text-ok' : 'text-bad'}`
        msg.textContent = c ? `Cupón válido: ${c.label || c.code}` : error
        if (form.quote) { applyTier(); renderQuote() }
        renderSummary()
      })

      $('#new-order').addEventListener('submit', async (e) => {
        e.preventDefault()
        if (saving) return
        const errors = validateManualOrder(form)
        showErrors(errors)
        if (errors.length) return
        saving = true
        const btn = $('#no-save')
        btn.disabled = true
        const { error } = await createManualOrder(form)
        saving = false
        btn.disabled = false
        if (error) {
          const m = String(error.message || '')
          showErrors([/no est[aá] disponible|stock|agotad|disponible/i.test(m) ? 'Uno de los productos ya no esta disponible.' : m || 'No se pudo guardar el pedido.'])
          return
        }
        showToast('Pedido guardado', 'success')
        navigate('/admin/orders')
      })

      renderItems()
      renderSummary()
    },
  }
}
