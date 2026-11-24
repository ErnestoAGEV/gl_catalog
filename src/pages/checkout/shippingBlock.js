import { formatMoney } from '../../utils/format.js'
import { escapeHtml } from '../../utils/sanitize.js'

const CARRIERS = { fedex: 'FedEx', dhl: 'DHL', ups: 'UPS', estafeta: 'Estafeta', paquetexpress: 'Paquetexpress', jtexpress: 'J&T Express' }
export const carrierName = (slug) => CARRIERS[String(slug || '').toLowerCase()] || (slug ? String(slug).charAt(0).toUpperCase() + String(slug).slice(1) : '')
export const TIER_NAMES = { standard: 'Estándar', express: 'Express' }

// Bloque de envio bajo la direccion: calculando, opciones o aviso de WhatsApp.
// prices = lo que se cobra por opcion (ya con envio gratis aplicado)
export function shippingBlockHTML({ status, quote, tier, prices }) {
  // Sin cotizacion vigente (p. ej. el carrito cambio) no hay opciones que pintar
  if (status === 'ready' && !quote) return ''
  const note = (text) => `<p class="font-mono text-[12px] tracking-[0.08em] text-ink/65">${text}</p>`
  if (status === 'quoting') return note('Calculando envío…')
  if (status === 'fallback') return note('Te confirmamos el costo de envío por WhatsApp.')
  if (status !== 'ready') return ''
  const option = (key) => {
    const q = quote[key]
    const days = q.days ? `Recíbelo en ${q.days} ${q.days === 1 ? 'día hábil' : 'días hábiles'}` : ''
    const label = `${TIER_NAMES[key]} · ${escapeHtml(carrierName(q.carrier))}`
    const price = prices[key] > 0 ? formatMoney(prices[key]) : 'Gratis'
    const body = `<span class="flex-1"><span class="block font-display font-bold text-[16px] leading-tight">${label}</span>${days ? `<span class="block mt-1 font-mono text-[11px] text-ink/55">${days}</span>` : ''}</span>
      <span class="font-mono text-[13px] digit-tabular">${price}</span>`
    const cls = 'flex items-center gap-3 border border-ink/15 rounded-lg px-4 min-h-14 py-2'
    return quote.express
      ? `<label class="${cls} cursor-pointer has-[:checked]:border-ink"><input type="radio" name="shipTier" value="${key}" ${tier === key ? 'checked' : ''} class="accent-current">${body}</label>`
      : `<div class="${cls}">${body}</div>`
  }
  return `<div id="ship-label" class="font-mono text-[11px] tracking-[0.24em] uppercase text-ink/55 mb-3">Env&iacute;o</div>
    <div ${quote.express ? 'role="radiogroup" aria-labelledby="ship-label"' : ''} class="space-y-3">${option('standard')}${quote.express ? option('express') : ''}</div>`
}
