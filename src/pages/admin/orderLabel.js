// Bloque "Guía" del detalle del pedido: cotiza, genera (compra real) y libera guías de Envia.
// Después de cualquier llamada que pueda cambiar el pedido se relee la fila y se repinta desde ella.
import { labelAction } from '../../store/shipping.js'
import { getAdminOrder, saveOrderLabelFields } from '../../store/orders.js'
import { showToast } from '../../utils/toast.js'
import { escapeHtml as esc } from '../../utils/sanitize.js'
import { confirmDelete } from './adminConfirm.js'
import { labelState, labelBodyHtml, ratesHtml, optionExtras, addressFormHtml, ADDRESS_FIELDS } from './orderLabelView.js'

export { labelBlockHtml } from './orderLabelView.js'

// Sobreviven al repintado del detalle (onChange vuelve a montar el bloque)
const carry = new Map() // orderId -> { error, addressError, address }
const inFlight = new Set() // pedidos con generate/release en curso: un repintado no reactiva botones

export function mountLabelBlock(root, order, onChange) {
  if (!root) return
  const id = String(order.id)
  const body = root.querySelector('[data-label-body]')
  const statusEl = root.querySelector('[data-label-status]')
  const errorEl = root.querySelector('[data-label-error]')
  const pending = carry.get(id)
  carry.delete(id)
  let busy = false
  let rates = null
  let sel = 0
  let address = pending?.address ?? null // la que capturó el admin en el formulario

  const setStatus = (t) => { statusEl.textContent = t || '' }
  const setError = (t) => { errorEl.textContent = t || '' }
  const lock = (on) => root.querySelectorAll('button, input, select').forEach((el) => { el.disabled = on })

  if (inFlight.has(id)) {
    lock(true)
    setStatus('Procesando…')
    return
  }

  // Relee la fila y repinta desde label_status; `note` se muestra en el bloque nuevo.
  const refresh = async (note) => {
    const fresh = await getAdminOrder(id)
    inFlight.delete(id)
    busy = false
    if (!fresh) {
      setStatus('')
      setError(`${note?.error ? note.error + ' ' : ''}No se pudo volver a leer el pedido. Cierra y vuelve a abrir el detalle.`)
      return // queda bloqueado: no se repinta desde memoria
    }
    if (note) carry.set(id, note)
    onChange(fresh)
  }

  const paint = () => {
    rates = null
    body.innerHTML = labelBodyHtml(order)
    setError('')
  }

  const showForm = (err) => {
    body.innerHTML = addressFormHtml(address ?? order.address_parts, order.address)
    setError(err)
    body.querySelector('input')?.focus()
  }

  const loadRates = async (kind) => {
    if (busy) return
    busy = true
    lock(true)
    setError('')
    setStatus('Buscando opciones…')
    const r = await labelAction({ mode: 'rates', orderId: id, ...(address && { address }), ...(kind && { kind }) })
    busy = false
    setStatus('')
    if (!root.isConnected) return
    if (r.error || !Array.isArray(r.options) || !r.options.length) {
      if (r.addressError) return showForm(r.error)
      lock(false)
      return setError(r.error || 'Envia no regresó opciones para este paquete. Intenta de nuevo o usa el panel de Envia.')
    }
    rates = r
    sel = r.defaultIndex >= 0 && r.defaultIndex < r.options.length ? r.defaultIndex : 0
    body.innerHTML = ratesHtml(rates, sel, order)
    body.querySelector(kind ? '[name="label-kind"]:checked' : '[name="label-option"]:checked')?.focus()
  }

  const generate = async () => {
    const o = rates?.options[sel]
    if (!o || busy) return
    busy = true
    inFlight.add(id)
    lock(true)
    setError('')
    setStatus('Generando guía…')
    const r = await labelAction({
      mode: 'generate', orderId: id, carrier: o.carrier, serviceCode: o.serviceCode,
      kind: rates.package?.kind, expectedCost: o.cost, ...(address && { address }),
    })
    if (!r.label) return refresh({ error: r.error || 'Algo falló. Intenta de nuevo.', addressError: r.addressError, address })
    const l = r.label
    if (!r.saved) {
      const { error } = await saveOrderLabelFields(id, {
        label_status: 'generated', label_tracking: l.tracking, label_track_url: l.trackUrl, label_url: l.url,
        label_carrier: l.carrier, label_service: l.service, label_cost: l.cost,
        label_created_at: new Date().toISOString(), label_sandbox: l.sandbox === true,
      })
      if (error) {
        const msg = `La guía se creó pero no se guardó. Anota el rastreo: ${l.tracking}`
        showToast(esc(msg), 'error', 15000)
        return refresh({ error: msg })
      }
    }
    showToast('Guía generada', 'success')
    return refresh()
  }

  const release = async (confirmGenerated) => {
    if (busy) return
    busy = true
    inFlight.add(id)
    lock(true)
    setError('')
    const r = await labelAction({ mode: 'release', orderId: id, ...(confirmGenerated && { confirmGenerated: true }) })
    if (r.ok) showToast('Guía quitada', 'success')
    return refresh(r.ok ? null : { error: r.error || 'Algo falló. Intenta de nuevo.' })
  }

  const actions = {
    start: () => (order.address_parts ? loadRates() : showForm()),
    cancel: paint,
    'edit-address': () => showForm(),
    confirm: generate,
    copy: async () => {
      try { await navigator.clipboard.writeText(String(order.label_tracking)); showToast('Rastreo copiado', 'success') } catch { showToast('No se pudo copiar', 'error') }
    },
    'release-generated': async () => {
      if (!order.label_sandbox && !(await confirmDelete({ title: 'Quitar guía', message: 'Solo si ya cancelaste esta guía en el panel de Envia.', confirmLabel: 'Quitar guía' }))) return
      release(true)
    },
    'release-review': async () => {
      if (!(await confirmDelete({ title: 'Liberar pedido', message: 'Si la guía sí se creó, no la vuelvas a generar: cópiala del panel de Envia.', confirmLabel: 'Liberar' }))) return
      release(false)
    },
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-label]')
    if (!btn || btn.disabled || busy) return
    actions[btn.dataset.label]?.()
  })
  root.addEventListener('change', (e) => {
    if (busy || !rates) return
    if (e.target.name === 'label-kind') loadRates(e.target.value)
    if (e.target.name === 'label-option') {
      sel = Number(e.target.value)
      const x = optionExtras(rates, sel)
      root.querySelector('[data-label-note]').textContent = x.note ?? ''
      root.querySelector('[data-label="confirm"]').textContent = x.confirm
    }
  })
  root.addEventListener('submit', (e) => {
    e.preventDefault()
    if (busy) return
    const form = e.target
    address = Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, String(form.elements[k]?.value ?? '').trim()]))
    if (!address.state) return setError('Elige el estado.')
    loadRates(rates?.package?.kind)
  })

  const state = labelState(order)
  if (pending?.error) setError(pending.error)
  if (pending?.addressError && state === 'empty') showForm(pending.error)
  // Un 'generating' reciente pasa a duda a los 2 min: releer entonces
  if (state === 'generating') {
    const wait = Math.max(0, Date.parse(order.label_locked_at) + 121_000 - Date.now())
    setTimeout(async () => {
      if (!root.isConnected || busy) return
      const fresh = await getAdminOrder(id)
      if (fresh && root.isConnected) onChange(fresh)
    }, wait)
  }
}
