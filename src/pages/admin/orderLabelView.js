// HTML puro del bloque "Guía" del detalle del pedido (sin store ni DOM: lo prueba Node).
// El estado sale solo de las columnas label_* del pedido, nunca de memoria.
import { formatMoney } from '../../utils/format.js'
import { escapeHtml } from '../../utils/sanitize.js'
import { carrierName } from '../checkout/shippingBlock.js'
import { ICON } from './adminIcons.js'
import { MX_STATES } from '../../../supabase/functions/_shared/shipping.js'
import { costNote, orderRef, REVIEW_MSG } from '../../../supabase/functions/_shared/label.js'

// escapeHtml regresa '' con números: el rastreo, el CP o el número pueden venir numéricos
const esc = (v) => escapeHtml(v == null ? '' : String(v))
// Centavos solo cuando los hay: $135.50, pero $150
export const money = (n) => {
  const v = Number(n)
  return Number.isInteger(v) ? formatMoney(v) : v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const SANDBOX_NOTE = 'Guía de prueba: no sirve para enviar'
const STALE_MS = 120_000 // la función libera un 'generating' de más de 2 min
const sandboxNote = `<p class="text-[12.5px] font-semibold text-warn bg-warn-tint rounded-lg px-2.5 py-1.5 mb-2">${SANDBOX_NOTE}</p>`

/** 'none' | 'local' | 'generated' | 'review' | 'generating' | 'cancelled' | 'empty' */
export function labelState(order, now = Date.now()) {
  if (order?.delivery_method !== 'Envío a domicilio') return 'none'
  if (order.shipping_carrier === 'local') return 'local'
  if (order.label_status === 'generated') return 'generated'
  if (order.label_status === 'review') return 'review'
  if (order.label_status === 'generating') {
    const t = Date.parse(order.label_locked_at)
    return Number.isFinite(t) && now - t <= STALE_MS ? 'generating' : 'review'
  }
  if (order.status === 'cancelado') return 'cancelled'
  return 'empty'
}

const trackingRow = (t) => `<div class="flex flex-wrap items-center gap-2">
  <span class="text-[13px] text-body">Rastreo: <span class="font-semibold text-ink tnum select-all">${esc(t)}</span></span>
  <button type="button" data-label="copy" aria-label="Copiar número de rastreo" class="adm-btn adm-btn-ghost h-8 px-2.5 text-[12px]">${ICON.copy('w-4 h-4')} Copiar</button>
</div>`

function bodyHtml(order, s) {
  if (s === 'local') return '<p class="text-[13px] text-body">Entrega local — la llevan ustedes.</p>'
  if (s === 'cancelled') return '<p class="text-[13px] text-muted">El pedido está cancelado.</p>'
  if (s === 'generating') return '<p class="text-[13px] text-body">Generando guía…</p>'
  if (s === 'review') return `<p class="text-[13px] text-warn">${esc(REVIEW_MSG(orderRef(order.id)))}</p>
    ${order.label_tracking ? trackingRow(order.label_tracking) : ''}
    <button type="button" data-label="release-review" class="adm-btn adm-btn-ghost h-10 text-[13px]">Ya revisé en Envia, liberar</button>`
  if (s === 'generated') {
    const url = /^https:\/\//.test(String(order.label_url ?? '')) ? order.label_url : ''
    const sb = order.label_sandbox === true
    return `<p class="text-[13.5px] font-semibold text-ink">${esc(carrierName(order.label_carrier))} · ${esc(order.label_service)}</p>
      ${order.label_tracking ? trackingRow(order.label_tracking) : ''}
      <p class="text-[13px] text-muted">Costo de la guía: <span class="tnum font-semibold text-ink">${money(order.label_cost)}</span></p>
      <div class="flex flex-wrap items-center gap-2">
        ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener" class="adm-btn adm-btn-ink h-10 text-[13px]">${ICON.print('w-[17px] h-[17px]')} Imprimir guía</a>` : ''}
        ${sb ? `<span class="text-[12px] font-semibold text-warn">${SANDBOX_NOTE}</span>` : ''}
      </div>
      ${sb
        ? '<button type="button" data-label="release-generated" class="adm-btn adm-btn-ghost h-10 text-[13px]">Quitar guía de prueba</button>'
        : '<button type="button" data-label="release-generated" class="text-[12px] text-muted underline hover:text-bad">Quitar guía</button>'}`
  }
  return '<button type="button" data-label="start" class="adm-btn adm-btn-ink h-10 text-[13px]">Generar guía</button>'
}

// Cada cuánto releer un 'generating' reciente (p. ej. tras un timeout del cliente); null si no aplica
export function pollDelay(order, now = Date.now()) {
  if (labelState(order, now) !== 'generating') return null
  return Math.max(0, Math.min(10_000, Date.parse(order.label_locked_at) + STALE_MS + 1000 - now))
}

/** Al montar: 'busy' (llamada en curso), 'dirty' (falta releer la fila) o 'ready' */
export const mountMode = (id, inFlight, dirty) => (inFlight.has(id) ? 'busy' : dirty.has(id) ? 'dirty' : 'ready')

export const labelBodyHtml = (order, now) => bodyHtml(order, labelState(order, now))

export function labelBlockHtml(order, now = Date.now()) {
  const s = labelState(order, now)
  if (s === 'none') return ''
  return `<section data-label-block aria-live="polite" aria-labelledby="label-block-title" class="bg-paper rounded-xl2 border border-line p-4">
    <h4 id="label-block-title" class="eyebrow text-faint mb-2">Guía</h4>
    ${s === 'generated' && order.label_sandbox === true ? sandboxNote : ''}
    <div data-label-body class="space-y-2.5">${bodyHtml(order, s)}</div>
    <p data-label-status class="text-[12.5px] text-muted mt-2 empty:hidden"></p>
    <p data-label-error role="alert" class="text-[12.5px] text-bad mt-2 empty:hidden"></p>
  </section>`
}

const days = (d) => (Number(d) > 0 ? ` · ${Number(d)} día${Number(d) === 1 ? '' : 's'}` : '')

export const confirmLabel = (cost, sandbox) =>
  sandbox ? 'Generar guía de prueba' : `Generar guía por ${money(cost)} — se cobra a tu saldo de Envia`

/** Aviso de costo y texto del botón para la opción `sel` de una respuesta de `rates`. */
export function optionExtras(r, sel) {
  const o = r.options[sel]
  return { note: costNote(o.cost, r.paid, r.free, money), confirm: confirmLabel(o.cost, r.sandbox) }
}

export function ratesHtml(r, sel, order) {
  const x = optionExtras(r, sel)
  const kinds = [['envelope', 'Sobre'], ['box', 'Caja']]
  return `<fieldset><legend class="text-[12px] font-medium text-muted mb-1">Empaque</legend>
      <div class="flex gap-4">${kinds.map(([v, l]) => `<label class="inline-flex items-center gap-1.5 text-[13px] text-body cursor-pointer"><input type="radio" name="label-kind" value="${v}" ${r.package?.kind === v ? 'checked' : ''}> ${l}</label>`).join('')}</div>
    </fieldset>
    <div role="radiogroup" aria-label="Opciones de envío" class="space-y-1.5">
      ${r.options.map((o, i) => `<label class="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-line text-[13px] text-body cursor-pointer">
        <input type="radio" name="label-option" value="${i}" ${i === sel ? 'checked' : ''}>
        <span class="flex-1">${esc(carrierName(o.carrier))} · ${esc(o.service)}<span class="text-faint">${days(o.days)}</span></span>
        <span class="font-semibold text-ink tnum">${money(o.cost)}</span>
      </label>`).join('')}
    </div>
    <p data-label-note class="text-[12.5px] text-warn empty:hidden">${esc(x.note ?? '')}</p>
    ${order.status === 'pendientedepago' ? '<p class="text-[12.5px] text-warn">Este pedido aún no está marcado como pagado.</p>' : ''}
    ${r.sandbox ? sandboxNote : ''}
    <button type="button" data-label="confirm" class="adm-btn adm-btn-ink h-10 text-[13px] w-full">${esc(x.confirm)}</button>
    <div class="flex gap-4 text-[12.5px]">
      <button type="button" data-label="edit-address" class="text-brand underline">Editar dirección</button>
      <button type="button" data-label="cancel" class="text-muted underline">Cancelar</button>
    </div>`
}

export const ADDRESS_FIELDS = ['street', 'numExt', 'numInt', 'neighborhood', 'city', 'state', 'zip', 'references']

export function addressFormHtml(a, orderAddress) {
  const v = (k) => esc(a?.[k] ?? '')
  const field = (k, label, attrs = '') => `<div>
    <label for="label-addr-${k}" class="text-[12px] font-medium text-muted block mb-1">${label}</label>
    <input id="label-addr-${k}" name="${k}" value="${v(k)}" class="adm-fld" ${attrs}>
  </div>`
  // novalidate: la función valida y da los mensajes; aquí solo se capturan
  return `<form data-label-form novalidate class="space-y-2.5">
    ${orderAddress ? `<p class="text-[12.5px] text-muted">Dirección del pedido: <span class="text-body">${esc(orderAddress)}</span></p>` : ''}
    ${field('street', 'Calle', 'maxlength="100" autocomplete="off"')}
    <div class="grid grid-cols-2 gap-2">
      ${field('numExt', 'Número exterior', 'maxlength="20"')}
      ${field('numInt', 'Número interior (opcional)', 'maxlength="20"')}
    </div>
    ${field('neighborhood', 'Colonia', 'maxlength="100"')}
    ${field('city', 'Ciudad', 'maxlength="60"')}
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label for="label-addr-state" class="text-[12px] font-medium text-muted block mb-1">Estado</label>
        <select id="label-addr-state" name="state" class="adm-fld">
          <option value="">Elige el estado</option>
          ${MX_STATES.map((s) => `<option value="${s.code}" ${a?.state === s.code ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
        </select>
      </div>
      ${field('zip', 'Código postal', 'inputmode="numeric" maxlength="5"')}
    </div>
    ${field('references', 'Referencias (opcional)', 'maxlength="200"')}
    <div class="flex items-center gap-3">
      <button type="submit" class="adm-btn adm-btn-ink h-10 text-[13px]">Ver opciones</button>
      <button type="button" data-label="cancel" class="text-[12.5px] text-muted underline">Cancelar</button>
    </div>
  </form>`
}
