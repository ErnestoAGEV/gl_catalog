import { formatMoney } from '../../utils/format.js'
import { BRAND } from '../../utils/config.js'
import { getState, getProductById } from '../../store/index.js'
import { isPerfumeCategory } from '../admin/adminProductsData.js'
import { escapeHtml } from '../../utils/sanitize.js'

const waIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`

const waIconSmall = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.2s-.8 1-.9 1.2-.3.2-.6.1-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5s0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4s.2-1.3.2-1.4-.3-.2-.6-.4M12 21.8a9.9 9.9 0 01-5-1.4l-.4-.2-3.7 1 1-3.7-.2-.4a9.9 9.9 0 01-1.5-5.3c0-5.5 4.4-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9a9.8 9.8 0 012.9 7c0 5.5-4.4 9.9-9.9 9.9m8.4-18.3A11.8 11.8 0 0012 0C5.5 0 .2 5.3.2 11.9c0 2.1.5 4.1 1.6 6L0 24l6.3-1.7a11.9 11.9 0 005.7 1.5c6.6 0 11.9-5.3 11.9-11.9a11.8 11.8 0 00-3.5-8.4z"/></svg>`

function cartItemsHTML() {
  const state = getState()
  if (!state.cart || !state.cart.length) return ''
  return state.cart.map(item => {
    const p = getProductById(item.productId)
    if (!p) return ''
    const qty = Number(item.qty) || 1
    const isPerfume = isPerfumeCategory(p.type)
    const imgClass = isPerfume ? 'w-full h-full object-contain p-2 bg-white' : 'w-full h-full object-cover'
    const safeName = escapeHtml(p.name)
    const safeImg = escapeHtml(p.images?.[0] || '')
    const safeSize = escapeHtml(item.size || '')
    const safeColor = escapeHtml(item.color || '')
    return `
      <li class="flex gap-4">
        <div class="relative w-16 h-20 flex-shrink-0 rounded bg-fog overflow-visible">
          <img src="${safeImg}" alt="${safeName}" loading="lazy" class="${imgClass} rounded"/>
          ${qty > 1 ? `<span class="absolute -top-1.5 -right-1.5 z-10 min-w-[20px] h-[20px] px-1 rounded-full bg-ink text-paper font-mono text-[10px] font-bold flex items-center justify-center">${qty}</span>` : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-display font-bold text-[15px] leading-tight tracking-[-0.02em]">${safeName}</div>
          <div class="font-mono text-[11px] text-ink/55 mt-1">${safeSize ? `Talla ${safeSize}` : ''}${safeSize && safeColor ? ' · ' : ''}${safeColor}</div>
        </div>
        <div class="text-right">
          <div class="font-mono text-[13px] font-semibold">${formatMoney(p.price * qty)}</div>
        </div>
      </li>`
  }).filter(Boolean).join('')
}

export function checkoutHTML({ subtotal, discount, total, freeShipping, itemCount, coupon, upsellProducts = [] }) {
  return `
  <div class="w-full">

    <!-- Hero Strip -->
    <section class="pt-12 lg:pt-16 pb-8 border-b border-ink/10">
      <div class="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div class="flex items-center gap-3 mb-8 reveal in">
          <a href="/cart" class="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase text-ink/55 hover:text-ink transition-colors">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Volver a la bolsa
          </a>
          <span class="h-px flex-1 bg-ink/15 mx-3"></span>
          <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/55">Tiempo estimado &middot; 90 segundos</span>
        </div>
        <div class="grid grid-cols-12 gap-6 lg:gap-10 items-end">
          <div class="col-span-12 lg:col-span-9">
            <h1 class="font-display font-extrabold text-[clamp(64px,11vw,184px)] leading-[0.86] tracking-[-0.04em]">
              Cierra tu<br/><span class="text-brand">pedido</span>.
            </h1>
          </div>
          <div class="col-span-12 lg:col-span-3 lg:text-right">
            <p class="text-[15px] text-ink/70 max-w-[340px] lg:ml-auto leading-relaxed">
              Llenamos tus datos en <strong>3 pasos</strong>. Te contactamos por WhatsApp para confirmar pago &mdash; <strong>cero pago online</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Main 2-column -->
    <section class="py-12 lg:py-16">
      <div class="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div class="grid grid-cols-12 gap-8 lg:gap-12">

          <!-- LEFT: Form -->
          <form id="checkout-form" class="col-span-12 lg:col-span-7 space-y-14" novalidate>

            <!-- Hidden selects for validator compatibility -->
            <select name="paymentMethod" class="hidden">
              <option value="">Seleccionar...</option>
              <option value="Transferencia" selected>Transferencia</option>
              <option value="Pago al recoger">Pago al recoger</option>
            </select>
            <select name="deliveryMethod" class="hidden">
              <option value="">Seleccionar...</option>
              <option value="Recoger en tienda">Recoger en tienda</option>
              <option value="Envío a domicilio" selected>Env&iacute;o a domicilio</option>
            </select>

            <!-- STEP 1: Contacto -->
            <section class="reveal in">
              <div class="flex items-center gap-5 mb-7">
                <div class="step-num">01<span class="text-brand">.</span></div>
                <div>
                  <h2 class="font-display font-extrabold text-[28px] leading-none tracking-[-0.03em]">Contacto</h2>
                  <p class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55 mt-1.5">&iquest;C&oacute;mo te contactamos?</p>
                </div>
                <span class="ml-auto font-mono text-[10px] tracking-[0.24em] uppercase text-brand">En curso &rarr;</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <div class="field">
                  <label>Nombre completo</label>
                  <input name="name" placeholder="Eduardo N&uacute;&ntilde;ez" required/>
                </div>
                <div class="field">
                  <label>WhatsApp</label>
                  <input name="whatsapp" inputmode="tel" placeholder="+52 312 123 4567" required/>
                </div>
              </div>
            </section>

            <!-- STEP 2: Pago & entrega -->
            <section class="reveal">
              <div class="flex items-center gap-5 mb-7">
                <div class="step-num">02<span class="text-brand">.</span></div>
                <div>
                  <h2 class="font-display font-extrabold text-[28px] leading-none tracking-[-0.03em]">Pago &amp; entrega</h2>
                  <p class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55 mt-1.5">Sin pago online &mdash; confirmamos por WhatsApp</p>
                </div>
              </div>

              <div class="font-mono text-[11px] tracking-[0.24em] uppercase text-ink/55 mb-3">&iquest;C&oacute;mo pagas?</div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8" id="pay-group">
                <button type="button" class="choice active" data-val="transferencia">
                  <span class="dot"></span>
                  <div class="flex-1">
                    <div class="font-display font-bold text-[18px] leading-none tracking-[-0.02em]">Transferencia</div>
                    <div class="meta mt-2 font-mono text-[11px] text-ink/55">SPEI &middot; BBVA &middot; Confirmaci&oacute;n inmediata</div>
                  </div>
                  <div class="font-mono text-[10px] tracking-wider uppercase"></div>
                </button>
                <button type="button" class="choice" data-val="recoger">
                  <span class="dot"></span>
                  <div class="flex-1">
                    <div class="font-display font-bold text-[18px] leading-none tracking-[-0.02em]">Pago al recoger</div>
                    <div class="meta mt-2 font-mono text-[11px] text-ink/55">Efectivo &middot; TPV en tienda</div>
                  </div>
                  <div class="font-mono text-[10px] tracking-wider uppercase">&mdash;</div>
                </button>
              </div>

              <div class="font-mono text-[11px] tracking-[0.24em] uppercase text-ink/55 mb-3">&iquest;C&oacute;mo lo recibes?</div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="dlv-group">
                <button type="button" class="choice active" data-val="envio">
                  <span class="dot"></span>
                  <div class="flex-1">
                    <div class="font-display font-bold text-[18px] leading-none tracking-[-0.02em]">Env&iacute;o a domicilio</div>
                    <div class="meta mt-2 font-mono text-[11px] text-ink/55">2&mdash;3 d&iacute;as &middot; todo M&eacute;xico</div>
                  </div>
                  <div class="font-mono text-[10px] tracking-wider uppercase text-brand">${freeShipping ? 'Gratis' : `+$${BRAND.freeShippingMin.toLocaleString()}`}</div>
                </button>
                <button type="button" class="choice" data-val="tienda">
                  <span class="dot"></span>
                  <div class="flex-1">
                    <div class="font-display font-bold text-[18px] leading-none tracking-[-0.02em]">Recoger en tienda</div>
                    <div class="meta mt-2 font-mono text-[11px] text-ink/55">Centro &middot; Villa de &Aacute;lvarez</div>
                  </div>
                  <div class="font-mono text-[10px] tracking-wider uppercase">Hoy</div>
                </button>
              </div>
            </section>

            <!-- STEP 3: Dirección -->
            <section id="address-wrap" class="reveal">
              <div class="flex items-center gap-5 mb-7">
                <div class="step-num">03<span class="text-brand">.</span></div>
                <div>
                  <h2 class="font-display font-extrabold text-[28px] leading-none tracking-[-0.03em]">Direcci&oacute;n</h2>
                  <p class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55 mt-1.5">&iquest;D&oacute;nde lo dejamos?</p>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-12 gap-x-6">
                <div class="field md:col-span-8">
                  <label>Calle</label>
                  <input name="street" placeholder="Av. Constituci&oacute;n"/>
                </div>
                <div class="field md:col-span-2">
                  <label>N&uacute;m. ext.</label>
                  <input name="numExt" placeholder="140"/>
                </div>
                <div class="field md:col-span-2">
                  <label>N&uacute;m. int.</label>
                  <input name="numInt" placeholder="&mdash;"/>
                </div>
                <div class="field md:col-span-6">
                  <label>Colonia</label>
                  <input name="neighborhood" placeholder="Centro"/>
                </div>
                <div class="field md:col-span-3">
                  <label>Ciudad</label>
                  <input name="city" placeholder="Colima"/>
                </div>
                <div class="field md:col-span-3">
                  <label>C&oacute;digo postal</label>
                  <input name="zipCode" inputmode="numeric" placeholder="28000"/>
                </div>
                <div class="field md:col-span-6">
                  <label>Estado</label>
                  <input name="state" placeholder="Colima"/>
                </div>
                <div class="field md:col-span-6">
                  <label>Referencias</label>
                  <textarea name="references" rows="2" placeholder="Casa azul, entre Hidalgo y Aldama"></textarea>
                </div>
              </div>
            </section>

            <!-- Form error -->
            <div id="form-error" class="hidden font-mono text-[10px] tracking-[0.24em] uppercase text-red-500 mt-4"></div>

            <!-- Submit -->
            <section class="reveal">
              <!-- Desktop: large pill -->
              <button type="submit" class="hidden lg:flex group items-center justify-between gap-3 bg-[#25D366] text-paper pl-7 pr-3 h-20 w-full rounded-full text-[17px] font-semibold hover:bg-[#1ebc59] transition-colors">
                <span class="flex items-center gap-3">
                  ${waIcon}
                  Enviar pedido por WhatsApp
                </span>
                <span class="w-14 h-14 rounded-full bg-paper text-[#25D366] flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
                </span>
              </button>
              <!-- Mobile: compact pill -->
              <button type="submit" class="lg:hidden flex items-center justify-center gap-2 bg-[#25D366] text-paper w-full h-14 rounded-full text-[15px] font-semibold hover:bg-[#1ebc59] transition-colors">
                ${waIconSmall}
                Enviar pedido por WhatsApp
              </button>
              <p class="mt-4 font-mono text-[10px] tracking-[0.24em] uppercase text-ink/55 text-center">
                Al continuar aceptas nuestros t&eacute;rminos &middot; cero pago online &middot; todo se confirma por WhatsApp
              </p>
            </section>
          </form>

          <!-- RIGHT: Order Summary -->
          <aside class="col-span-12 lg:col-span-5 order-first lg:order-none">
            <div id="checkout-summary-column">
              ${checkoutSummaryHTML({ subtotal, discount, total, freeShipping, itemCount, coupon, upsellProducts })}
            </div>
          </aside>

        </div>
      </div>
    </section>

  </div>`
}

export function checkoutSummaryHTML({ subtotal, discount, total, freeShipping, itemCount, coupon }) {
  const items = cartItemsHTML()

  return `
    <div class="lg:sticky lg:top-[24px] space-y-4">

      <!-- Items card -->
      <div class="bg-fog rounded-lg p-6">
        <div class="flex items-center justify-between mb-5">
          <div class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/55">Tu pedido</div>
          <a href="/cart" class="ul-link text-[11px] font-mono uppercase tracking-wider">Editar &rarr;</a>
        </div>
        <ul class="space-y-4">
          ${items}
        </ul>

        <!-- Totals -->
        <div class="mt-6 pt-5 border-t border-ink/10 space-y-3 font-mono text-[13px] digit-tabular">
          <div class="flex justify-between">
            <span class="text-ink/65">Subtotal &middot; ${itemCount} pzs</span>
            <span>${formatMoney(subtotal)}</span>
          </div>
          <div id="discount-row" class="${coupon ? 'flex' : 'hidden'} justify-between text-brand">
            <span>Descuento &middot; <span id="discount-code">${coupon?.code || ''}</span></span>
            <span id="discount-amount">&minus;${formatMoney(discount)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink/65">Env&iacute;o</span>
            <span class="${freeShipping ? 'text-brand' : 'text-ink/65'}">${freeShipping ? '&iexcl;Gratis!' : 'Por calcular'}</span>
          </div>
        </div>

        <!-- Grand total -->
        <div class="mt-5 pt-5 border-t border-ink/10 flex items-baseline justify-between">
          <div class="font-mono text-[11px] tracking-[0.28em] uppercase">Total</div>
          <div id="total-amount" class="font-display font-extrabold text-[48px] leading-none tracking-[-0.04em] digit-tabular">${formatMoney(total)}</div>
        </div>
        <div class="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase text-ink/45 text-right">MXN &middot; IVA incluido</div>
      </div>

      <!-- Trust strip -->
      <div class="grid grid-cols-3 gap-px bg-ink/10 rounded-lg overflow-hidden">
        <div class="bg-paper p-5 text-center">
          <svg class="w-5 h-5 mx-auto mb-2 text-brand" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.6-4A11.96 11.96 0 0112 2.9 11.96 11.96 0 013.4 6 12 12 0 003 9c0 5.6 3.8 10.3 9 11.6 5.2-1.3 9-6 9-11.6 0-1-.1-2-.4-3z"/></svg>
          <div class="font-mono text-[9px] tracking-[0.2em] uppercase">Seguro</div>
        </div>
        <div class="bg-paper p-5 text-center">
          <svg class="w-5 h-5 mx-auto mb-2 text-brand" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/></svg>
          <div class="font-mono text-[9px] tracking-[0.2em] uppercase">Cierre en 90s</div>
        </div>
        <div class="bg-paper p-5 text-center">
          <svg class="w-5 h-5 mx-auto mb-2 text-brand" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          <div class="font-mono text-[9px] tracking-[0.2em] uppercase">Sin pago online</div>
        </div>
      </div>

      <!-- Manifesto micro -->
      <div class="border border-ink/10 rounded-lg p-5">
        <div class="font-display font-medium text-[15px] leading-snug tracking-[-0.01em]">
          &ldquo;Confirmamos cada pedido por WhatsApp con un humano &mdash;no un bot&mdash; para asegurar que <strong>todo te llegue bien</strong>.&rdquo;
        </div>
        <div class="mt-3 font-mono text-[10px] tracking-[0.24em] uppercase text-ink/55">&mdash; Equipo G&amp;L &middot; Colima</div>
      </div>

    </div>`
}

export function couponAppliedHTML(coupon) {
  return ''
}

export function couponInputHTML() {
  return ''
}

export function checkoutSuccessHTML({ name, waUrl }) {
  const safeName = escapeHtml(name || 'Cliente')
  const safeWaUrl = escapeHtml(waUrl || '')
  return `
    <div class="fixed inset-0 z-50 bg-paper flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-md bg-paper rounded-lg p-10 text-center border border-ink/10">

        <div class="w-24 h-24 mx-auto mb-6 bg-brand/10 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-brand animate-[bounce_1s_ease-in-out_1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <h2 class="font-display font-extrabold text-[clamp(36px,6vw,64px)] tracking-[-0.04em] leading-none mb-4">&iexcl;Pedido recibido!</h2>
        <p class="text-[15px] text-ink/70 max-w-sm mx-auto mb-8 leading-relaxed">
          Gracias <strong>${safeName}</strong>, registramos tu pedido con &eacute;xito. Te escribimos por WhatsApp en los pr&oacute;ximos minutos.
        </p>

        <a
          href="${safeWaUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-between gap-3 bg-[#25D366] text-paper pl-7 pr-3 h-16 w-full rounded-full text-[17px] font-semibold hover:bg-[#1ebc59] transition-colors"
        >
          <span class="flex items-center gap-3">
            ${waIcon}
            Abrir WhatsApp
          </span>
          <span class="w-12 h-12 rounded-full bg-paper text-[#25D366] flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
          </span>
        </a>

        <a href="/catalog" class="ul-link text-[14px] font-semibold mt-6 inline-block">Volver a la tienda</a>
      </div>
    </div>`
}
