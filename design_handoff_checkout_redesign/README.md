# Handoff: G&L Checkout Redesign — "Bold Editorial" v2

## Overview

Redesign of the G&L checkout page (route `/checkout` → `src/pages/checkout.js` + view template `src/pages/checkoutView.js`). It applies the same **Bold Editorial** aesthetic already approved for the home, catalog, and cart pages: large display typography, numbered editorial step headers, mono section labels, custom cursor, underline-only form fields, choice cards for payment/delivery, and a sticky right-rail order summary with a giant display-sized total.

**The bundled file `v2-bold-checkout-reference.html` is a design reference, not production code.** Standalone (Tailwind CDN + vanilla JS + hardcoded order data). The task is to **recreate it inside the existing G&L codebase** (Vite + Vanilla JS modules + Tailwind v4 + Supabase) preserving the existing `pageCheckout(state)` flow — form validation, coupon UI, upsell modal, WhatsApp order submission, success view, persistence, and error handling.

Do **not** copy the HTML wholesale. Adapt to Tailwind v4, the live cart state, the existing whatsapp/order pipeline, and shared brand tokens from the home redesign.

## Fidelity

**High-fidelity.** Final colors, spacing, typography, copy, and interactions are settled. Recreate pixel-perfectly.

---

## Target codebase context

| Concern | Location | Notes |
|---|---|---|
| Checkout page entry | `src/pages/checkout.js` | Replace the **rendered HTML** but keep the orchestration logic intact: validation, coupon attach, upsell modal, WhatsApp submission, persistence in `gl_checkout_success`. Keep the exported `pageCheckout(state)` signature returning `{ title, html, onMount }`. |
| Checkout view template | `src/pages/checkoutView.js` | **Rewrite** `checkoutHTML(...)`, `checkoutSummaryHTML(...)`, `couponAppliedHTML(coupon)`, `couponInputHTML()`, `checkoutSuccessHTML(...)`. Keep the function signatures and what they return (full HTML strings) so `checkout.js` keeps working with no orchestration changes. |
| Form state + validation | `src/pages/checkout.js` | Reuse `WHATSAPP_RE`, `ZIPCODE_RE`, `needsAddress(payment, delivery)`, `setFieldError(field, hasError)`, `clearFieldErrors(root)`, `isInfiniteStock`. |
| Store helpers | `src/app/store.js` | Reuse `cartTotal`, `getCoupon`, `getDiscountAmount`, `applyCoupon`, `removeCoupon`, `saveOrder`, `clearCart`, `addToCart`, `getProductById`. |
| WhatsApp pipeline | `src/app/whatsapp.js` → `buildOrderMessage`, `openWhatsAppWithMessage` | Reuse fully. |
| Sanitizers | `src/app/sanitize.js` → `sanitizeText`, `sanitizeCouponCode` | Reuse on every form value before it goes into the WhatsApp message. |
| Brand constants | `src/app/config.js` → `BRAND.freeShippingMin`, `BRAND.whatsapp` | Reuse. |
| Modal for upsell add-to-cart | `src/pages/catalogModals.js` → `sizeSelectionModal(product)` | Reuse. |
| Router | `src/app/router.js` → `navigate` | Used by success view CTA. |
| Layout shell | `src/components/layout.js` | The checkout uses a **trimmed header** (logo + 3-step indicator + "Sesión segura" badge) — either swap header per route, or render the page with `noLayout: true` style override and embed its own header. The reference embeds its own; recommend that path. |
| Index | `index.html` | No new fonts. |

### Files to read in the existing codebase before starting

1. `src/pages/checkout.js` — full orchestration. The `onMount` is large; read it end-to-end.
2. `src/pages/checkoutView.js` — current HTML template.
3. `src/app/whatsapp.js` — `buildOrderMessage` + `openWhatsAppWithMessage`.
4. `src/app/store.js` — coupon helpers + `saveOrder` + `clearCart`.
5. `src/app/sanitize.js` — `sanitizeText`, `sanitizeCouponCode`.
6. `src/app/config.js` — `BRAND` constants.

---

## Critical existing behaviors that must survive

The current `checkout.js` is large and does real work. The redesign is **purely visual** — every behavior below must transfer unchanged:

1. **Conditional address section**: only visible when `deliveryMethod === 'Envío a domicilio'`. In the reference, when "Recoger en tienda" is active, the address section dims to `opacity: 0.45; pointer-events: none`. **Implementation**: keep the existing `addressWrap.classList.add('hidden')` / `remove('hidden')` toggle in `checkout.js`. The dim-in-place is a visual nicety; either swap to `display: none` (matches current behavior) or implement the dim — owner preference. The reference uses dim. Match the reference.
2. **Validation** (`form.addEventListener('submit', …)`):
   - Required: `name` (non-empty after sanitize), `whatsapp` (matches `WHATSAPP_RE`), `paymentMethod`, `deliveryMethod`.
   - If `needsAddress(payment, delivery)`: also require `street`, `numExt`, `neighborhood`, `city`, `zipCode` (matches `ZIPCODE_RE`), `state`.
   - On any failure: scroll to the first errored field, add `!border-red-500 !ring-red-500/30 !ring-1` classes, show `#form-error` with the message. Reference shows the error inline below the relevant section instead of a global `#form-error` — see §10 (errors).
3. **Coupon UI**:
   - `attachCouponHandlers()` is called after every `refreshSummaryView()` because the summary HTML is re-rendered. Keep this pattern.
   - Apply: `applyCoupon(code, silent=true)`. On success → `refreshSummaryView()`. On error → show inline error.
   - Remove: `removeCoupon(silent=true)` → `refreshSummaryView()`.
4. **Upsell modal**:
   - `[data-upsell-id]` buttons on each upsell card. Click → open `sizeSelectionModal(product)` in `#modal-container`.
   - Size button click → `addToCart(product.id, size, color)` → `refreshSummaryView()` → close modal.
5. **Order submission**:
   - Sanitize every text field. Build a normalized payload.
   - `saveOrder(payload)` → store it locally (and optionally async to Supabase).
   - `buildOrderMessage(payload, cart, totals)` → text string.
   - `openWhatsAppWithMessage(message, BRAND.whatsapp)` → opens `https://wa.me/...`.
   - `persistCheckoutSuccess({ name, waUrl })` → sessionStorage.
   - `clearCart()`.
   - `navigate('/checkout/success')` or render `checkoutSuccessHTML(...)` in-place (current code does the latter; pick one).
6. **Success view**:
   - Full-screen overlay with checkmark + "¡Pedido recibido!" + retry-WhatsApp link + back-to-store link.
7. **Persistence + return**:
   - On mount: `clearCheckoutSuccess()` (always) so a returning user starts fresh.
   - If `readCheckoutSuccess()` returns a payload (e.g. user refreshed the success page), render success view instead of the form.

The redesign **adds** these behaviors:
- Choice card UI for payment + delivery (replacing the two `<select>`s)
- Inline section status pill ("En curso →" / "Listo ✓")
- Mobile sticky checkout stripe at the bottom of the viewport

---

## Sections (top → bottom)

1. **Marquee announcement bar** — checkout-specific copy (`Cierre por WhatsApp · sin pago online` etc.) — replaces the global home marquee for this route only
2. **Minimal header** — logo + 3-step nav (01 Bolsa → 02 Checkout → 03 WhatsApp) + "Sesión segura" badge
3. **Hero strip** — breadcrumb back + giant H1 + 3-step description
4. **2-column main**: form left (lg:col-span-7) + sticky order summary right (lg:col-span-5)
   - On mobile, summary is **above** the form (`order-first lg:order-none`)
5. **Mobile sticky stripe** — bottom-fixed bar with total + "Enviar" CTA on `<lg` viewports only
6. **Footer** — inherited from layout shell (home redesign)

---

## §1 — Marquee (route-specific)

Same component as global, **different copy**. Items (separated by `—`):
- `★ Cierre por WhatsApp · sin pago online`
- `Envío gratis +$1,499 MXN`
- `Transferencia o pago al recoger`
- `2 tiendas físicas en Colima`

Duplicate the items for seamless loop. If your layout shell only supports one global marquee, render this route's variant inline at the top of the page body and hide the global one (e.g. add `body.route-checkout .global-marquee { display: none }`).

---

## §2 — Minimal header

Replaces the standard layout header for the checkout route. Either render with `noLayout: true` and include your own header, or branch in `layoutPublic`. The reference renders its own:

- `border-b border-ink/10`, `h-[72px]`, container `max-w-[1440px] mx-auto px-6 lg:px-10`
- Layout: `flex items-center justify-between`
- Left: logo (`G&L.` typographic mark, same as home redesign — Manrope 800 28px, `&` and final `.` in `text-brand`)
- Center (hidden on mobile): mono 11px tracking-[0.24em] uppercase, 3 nodes separated by `→` (opacity-30):
  - `<a href="/cart">01 — Bolsa</a>` — ink/45 hover ink
  - `<span class="text-brand">02 — Checkout</span>` — active state
  - `<span class="opacity-40">03 — WhatsApp</span>` — pending
- Right: mono 11px tracking-[0.24em] uppercase ink/55, padlock icon (text-brand 4×4) + `Sesión segura`

**Cart link** — back to `/cart`. **Logo link** — back to `/` (home).

---

## §3 — Hero strip

- `pt-12 lg:pt-16 pb-8 border-b border-ink/10`
- Inside `max-w-[1440px] mx-auto px-6 lg:px-10`:

**Top row** (flex items-center gap-3 mb-8):
- Left: `<a href="/cart">← Volver a la bolsa</a>` — chevron + mono 11px tracking-[0.28em] uppercase ink/55, hover → ink
- Middle: `<span class="h-px flex-1 bg-ink/15 mx-3"></span>`
- Right: mono 11px tracking-[0.28em] uppercase ink/55 `Tiempo estimado · 90 segundos`

**Headline** (grid 12 cols gap-6 lg:gap-10 items-end):
- Left col-span-9: H1 (Manrope 800, `clamp(64px, 11vw, 184px)`, leading 0.86, tracking -0.04em):
  ```
  Cierra tu
  <span class="text-brand">pedido</span>.
  ```
- Right col-span-3 lg:text-right: paragraph (15px ink/70 max-w-[340px] lg:ml-auto leading-relaxed):
  > "Llenamos tus datos en **3 pasos**. Te contactamos por WhatsApp para confirmar pago — **cero pago online**."

---

## §4 — Form (LEFT column, lg:col-span-7)

`space-y-14` between steps.

### §4.1 — Step header pattern

Each step uses the same header pattern (`flex items-center gap-5 mb-7`):
- Step number: `<div class="step-num">01<span class="text-brand">.</span></div>` — Manrope 800, 28px, leading 1, tracking -0.03em
- Title block:
  - H2: Manrope 800, 28px, leading-none, tracking -0.03em
  - Subtitle: mono 10px tracking-[0.28em] uppercase ink/55, mt-1.5
- Right (optional): status pill, mono 10px tracking-[0.24em] uppercase. Variants:
  - `text-brand` `En curso →`
  - `ink/40` `Pendiente`
  - `ink` `Listo ✓` (with checkmark)
  Drive from validation state: increment step number color as the user completes each step. For v1, hardcode step 1 as `En curso →` on initial render.

### §4.2 — Step 01: Contacto

Subtitle: `¿Cómo te contactamos?`

Fields (grid grid-cols-1 md:grid-cols-2 gap-x-6):
- `name` — `Nombre completo` — placeholder `"Eduardo Núñez"` — required
- `whatsapp` — `WhatsApp` — inputmode tel — placeholder `"+52 312 123 4567"` — required, matches `WHATSAPP_RE`
- `email` (md:col-span-2) — `Correo electrónico — opcional, para recibo` — placeholder `"tu@correo.com"` — optional; label suffix in ink/35 normal-case tracking-normal

**Field styling (`.field`):**
```css
.field { display: block; margin-bottom: 18px; }
.field label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(10,10,15,0.55);
  margin-bottom: 8px;
}
.field input, .field select, .field textarea {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(10,10,15,0.4);
  border-radius: 0;
  padding: 14px 16px;
  font-size: 15px;
  outline: none;
  transition: border-color .2s;
}
.field input:focus, .field select:focus, .field textarea:focus {
  border-bottom-color: var(--color-brand);
}
.field input::placeholder, .field textarea::placeholder { color: rgba(10,10,15,0.35); }
.field select {
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="%230A0A0F" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>');
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 14px;
  padding-right: 30px;
}
```

Underline-only style. No box, no rounded corners. Focus changes the underline to brand-blue.

### §4.3 — Step 02: Pago & entrega

Subtitle: `Sin pago online — confirmamos por WhatsApp`

This step replaces the two `<select>`s in the current `checkoutView.js` with **choice cards**.

**Payment** (`#pay-group`):
- Heading: mono 11px tracking-[0.24em] uppercase ink/55 mb-3 `¿Cómo pagas?`
- Grid 1 col md:2 cols gap-3:
  - Choice card A — `data-val="transferencia"` (active by default):
    - Title: `Transferencia`
    - Meta (mono 11px ink/55): `SPEI · BBVA · Confirmación inmediata`
    - Right tag (mono 10px uppercase): `−2%`
  - Choice card B — `data-val="recoger"`:
    - Title: `Pago al recoger`
    - Meta: `Efectivo · TPV en tienda`
    - Right tag: `—`

**Delivery** (`#dlv-group`):
- Heading: mono 11px tracking-[0.24em] uppercase ink/55 mb-3 `¿Cómo lo recibes?`
- Grid 1 col md:2 cols gap-3:
  - Choice card A — `data-val="envio"` (active by default):
    - Title: `Envío a domicilio`
    - Meta: `2—3 días · todo México`
    - Right tag (text-brand): `Gratis` (or compute from `BRAND.freeShippingMin`)
  - Choice card B — `data-val="tienda"`:
    - Title: `Recoger en tienda`
    - Meta: `Centro · Villa de Álvarez`
    - Right tag: `Hoy`

**Choice card styling (`.choice`):**
```css
.choice {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 18px;
  border: 1px solid rgba(10,10,15,0.12);
  border-radius: 6px;
  cursor: none;
  transition: border-color .2s, background-color .2s, color .2s;
}
.choice:hover { border-color: var(--color-ink); }
.choice.active { border-color: var(--color-ink); background: var(--color-ink); color: var(--color-paper); }
.choice.active .meta { color: rgba(255,255,255,0.65); }
.choice .dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.choice .dot::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
  transform: scale(0);
  transition: transform .2s;
}
.choice.active .dot::after { transform: scale(1); }
```

Inner markup:
```html
<button type="button" class="choice [active]" data-val="...">
  <span class="dot"></span>
  <div class="flex-1">
    <div class="font-display font-bold text-[18px] leading-none tracking-[-0.02em]">Title</div>
    <div class="meta mt-2 font-mono text-[11px] text-ink/55">Meta line</div>
  </div>
  <div class="font-mono text-[10px] tracking-wider uppercase">Tag</div>
</button>
```

**Group toggle JS**:
```js
function setupGroup(id) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  wrap.addEventListener('click', (e) => {
    const c = e.target.closest('.choice');
    if (!c) return;
    wrap.querySelectorAll('.choice').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    if (id === 'dlv-group') toggleAddressVisibility(c.dataset.val);
  });
}
```

**Address visibility**: when delivery=`tienda`, dim Step 03 (`opacity: 0.45; pointer-events: none`); when delivery=`envio`, restore (`opacity: 1; pointer-events: auto`). Mirror this to `addressWrap.classList.toggle('hidden')` if you prefer keeping the existing hidden behavior.

Map values to the strings the existing validator expects:
- `transferencia` → `Transferencia`
- `recoger` → `Pago al recoger`
- `envio` → `Envío a domicilio`
- `tienda` → `Recoger en tienda`

Best implementation: keep the existing two hidden `<select>` elements that the validator reads, and update their `.value` from the choice card click handler. That way `needsAddress(payment, delivery)` keeps working unchanged.

### §4.4 — Step 03: Dirección

Subtitle: `¿Dónde lo dejamos?`

Fields (grid grid-cols-1 md:grid-cols-12 gap-x-6, all `.field` style):
- `street` md:col-span-8 — `Calle` — placeholder `"Av. Constitución"` — required when address is shown
- `numExt` md:col-span-2 — `Núm. ext.` — placeholder `"140"` — required
- `numInt` md:col-span-2 — `Núm. int.` — placeholder `"—"` — optional
- `colonia` md:col-span-6 — `Colonia` — required
- `city` md:col-span-3 — `Ciudad` — required
- `zip` md:col-span-3 — `Código postal` — inputmode numeric — required, matches `ZIPCODE_RE`
- `state` md:col-span-6 — `Estado` — required
- `refs` md:col-span-6 — `Referencias` — placeholder `"Casa azul, entre Hidalgo y Aldama"` — optional
- `notes` md:col-span-12 — `Notas para el pedido — opcional` — `<textarea rows="2">` — optional. Reuse `references` field name from the current code (or rename — owner choice).

Match field names to what the existing validator expects: `street`, `numExt`, `numInt`, `neighborhood`, `city`, `zipCode`, `state`, `references`. Keep these names on the new inputs.

### §4.5 — Submit button (desktop, hidden on mobile)

```html
<button type="submit" class="hidden lg:flex group items-center justify-between gap-3 bg-[#25D366] text-paper pl-7 pr-3 h-20 w-full rounded-full text-[17px] font-semibold hover:bg-[#1ebc59] transition-colors">
  <span class="flex items-center gap-3">
    <svg class="w-6 h-6">{whatsapp icon}</svg>
    Enviar pedido por WhatsApp
  </span>
  <span class="w-14 h-14 rounded-full bg-paper text-[#25D366] inline-flex items-center justify-center arrow-walk">
    {right arrow}
  </span>
</button>
<p class="hidden lg:block mt-4 font-mono text-[10px] tracking-[0.24em] uppercase text-ink/55 text-center">
  Al continuar aceptas nuestros términos · cero pago online · todo se confirma por WhatsApp
</p>
```

WhatsApp green hex: `#25D366` (hover `#1ebc59`). The arrow circle is paper with text-green.

---

## §5 — Order summary (RIGHT column, lg:col-span-5)

`lg:sticky lg:top-[24px] space-y-4`. Aside class: `col-span-12 lg:col-span-5 order-first lg:order-none`.

### §5.1 — Items card

`bg-fog rounded-lg p-6`.

Top row (`mb-5`):
- Left: mono 10px tracking-[0.28em] uppercase ink/55 `Tu pedido`
- Right: `<a href="/cart">Editar →</a>` — `ul-link` style, mono 11px uppercase tracking-wider

Items list (`<ul class="space-y-4">`). Each `<li class="flex gap-4">`:
- Relative wrapper (w-16 h-20 flex-shrink-0 rounded overflow-hidden): `<img>` thumb + absolute qty badge `-top-1 -right-1 w-5 h-5 rounded-full bg-ink text-paper font-mono text-[10px]` with `item.qty`
- Body (flex-1 min-w-0): name (Manrope 700 15px leading-tight) + spec (mono 11px ink/55 mt-1) `Talla {size} · {color}`
- Right (text-right): if `originalPrice`, small line-through mono 11px ink/40; then mono 13px font-semibold. If discounted, text-brand on the active price.

### §5.2 — Coupon (inline `<details>` inside the items card)

`mt-5 pt-5 border-t border-ink/10`:
- `<summary>` — mono 11px tracking-[0.22em] uppercase ink/65 hover ink, with tag icon: `Tengo un cupón`
- Open state: flex gap-2:
  - `<input type="text" placeholder="WELCOME10" id="coupon-input">` — flex-1 bg-paper border ink/15 rounded-full px-4 h-11 mono 12px tracking-wider uppercase placeholder ink/35, focus border-ink
  - `<button id="apply-coupon">Aplicar</button>` — px-5 h-11 rounded-full bg-ink text-paper text-12px font-semibold hover bg-brand
- If a coupon is **already applied** on mount, show the applied state instead (use the same `couponAppliedHTML(coupon)` function — just with new internal markup):
  - `bg-brand/10 border border-brand/30 rounded-full px-4 h-12` row with code (mono 12px font-semibold text-brand) + label (mono 10px text-brand/75 uppercase tracking-[0.2em]) + `Quitar` button (mono 11px uppercase tracking-wider ink/55 hover text-brand)
- Error state: `<p id="coupon-error" class="hidden mt-2 font-mono text-[10px] uppercase tracking-wider text-red-500">` — shown inline below input

### §5.3 — Totals

`mt-6 pt-5 border-t border-ink/10 space-y-3 font-mono text-[13px] digit-tabular`. Each `flex justify-between`:
- `Subtotal · {N} pzs` (ink/65) — `formatMoney(subtotal)`
- (if coupon) `Descuento · {coupon.code}` (text-brand) — `−{formatMoney(discount)}`
- `Envío` (ink/65) — `¡Gratis!` (text-brand) or `Por calcular` (ink/65)
- (if `paymentMethod === 'Transferencia'`) `Pronto pago · 2%` (text-brand) — `−{formatMoney(round(subtotalAfterDiscount * 0.02))}` — **owner decision**: if you don't want this discount in production, drop the row. Reference shows it because the choice card says "−2%". If kept, add the calculation to `cartTotal`/`getDiscountAmount` or compute inline in the view.

### §5.4 — Grand total

`mt-5 pt-5 border-t border-ink/10 flex items-baseline justify-between`:
- Left: mono 11px tracking-[0.28em] uppercase `Total`
- Right: Manrope 800, 48px, leading-none, tracking -0.04em, tabular-nums — `formatMoney(total)`

Below (mt-1 text-right): mono 10px tracking-[0.2em] uppercase ink/45 `MXN · IVA incluido`.

### §5.5 — Trust strip (3 cells)

Same as cart's trust strip but with check/clock/shield iconography. Each cell `bg-paper p-5 text-center`. Icons text-brand (1.6 stroke), captions mono 9px tracking-[0.2em] uppercase:
- 🛡 `Seguro`
- 🕐 `Cierre en 90s`
- ✓ `Sin pago online`

### §5.6 — Manifesto micro

`border border-ink/10 rounded-lg p-5`:
- Quote (Manrope 500 15px leading-snug tracking -0.01em):
  > "Confirmamos cada pedido por WhatsApp con un humano — no un bot — para asegurar que **todo te llegue bien**."
- Attribution (mt-3): mono 10px tracking-[0.24em] uppercase ink/55 `— Equipo G&L · Colima`

---

## §6 — Mobile sticky stripe

Only visible `<lg`. `position: sticky; bottom: 0; z-index: 30; background: var(--color-ink); color: var(--color-paper); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px`.

Left (`flex flex-col`):
- Mono 10px tracking-[0.22em] uppercase opacity-60: `Total · {N} pzs`
- Manrope 800 24px leading-none tracking -0.03em digit-tabular: `formatMoney(total)`

Right: WhatsApp pill button (`flex-1 ml-2 bg-[#25D366] rounded-full h-14`), icon + `Enviar`. `type="submit" form="checkout-form"` so it triggers the same submit handler as the desktop button.

---

## Success view (`checkoutSuccessHTML`)

Rewrite to match aesthetic. Full-screen overlay (`fixed inset-0 z-50 bg-paper flex flex-col items-center justify-center p-4`):

- Card `w-full max-w-md bg-paper rounded-lg p-10 text-center border border-ink/10`
- Big check icon in a circle (`w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mb-6`), checkmark in text-brand
- H2: Manrope 800 `clamp(48px, 6vw, 80px)` tracking -0.04em — `¡Pedido recibido!`
- Body (15px ink/70 max-w-sm mx-auto mb-8): `Gracias <strong>${name}</strong>, registramos tu pedido con éxito. Te escribimos por WhatsApp en los próximos minutos.`
- Retry-WhatsApp CTA: green button identical to the form CTA (h-16 rounded-full bg-[#25D366]) — `Abrir WhatsApp` + arrow circle
- Back link below: `<a href="/catalog" class="ul-link text-[14px] font-semibold mt-4">Volver a la tienda</a>`

---

## Interactions & Behavior

### Choice card groups
- Click → swap `.active`. Mirror into the hidden `<select>` so the existing validator reads the new value.
- Delivery group additionally toggles the address section between `opacity: 1; pointer-events: auto` and `opacity: 0.45; pointer-events: none`.

### Form submit
- `e.preventDefault()` → `clearFieldErrors(root)` → validate every required field per current logic.
- On failure: set `!border-red-500` etc. on each broken `.field input/select/textarea`, scroll the first one into view, show inline error caption under the broken section (instead of the global `#form-error`). Suggested DOM: `<p id="form-error" class="hidden mt-4 font-mono text-[10px] tracking-[0.24em] uppercase text-red-500">…</p>` placed in the form footer.
- On success: build payload + sanitize + `saveOrder` + `buildOrderMessage` + `openWhatsAppWithMessage` + `persistCheckoutSuccess` + `clearCart` + render success view.

### Coupon
- Apply → `applyCoupon(code, true)` → on success, call `refreshSummaryView()` which re-renders **only the summary column** (the existing pattern). After re-render, re-attach handlers via `attachCouponHandlers()` and `attachUpsellHandlers()`. Re-bind cursor classes after every re-render.

### Upsell modal
- Same as current `attachUpsellHandlers()`. The modal markup (`sizeSelectionModal`) is unchanged. Restyle the modal in a future pass if needed; out of scope here.

### Reveal on scroll
- Wrap each step section + summary column in `.reveal`. Same IntersectionObserver pattern as home.

### Cursor follower
- Inherited. Bind `cursor-hover` to: `a, button, .choice, summary, [data-cursor-hover]`. Bind `cursor-text` to `input, textarea, select`. Re-bind after every `refreshSummaryView()`.

---

## Design Tokens

All tokens are inherited from home redesign. No new tokens.

### Checkout-specific utilities

```css
.field { display: block; margin-bottom: 18px; }
.field label { display: block; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: rgba(10,10,15,0.55); margin-bottom: 8px; }
.field input, .field select, .field textarea { width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(10,10,15,0.4); border-radius: 0; padding: 14px 16px; font-size: 15px; outline: none; transition: border-color .2s; }
.field input:focus, .field select:focus, .field textarea:focus { border-bottom-color: var(--color-brand); }
.field input::placeholder, .field textarea::placeholder { color: rgba(10,10,15,0.35); }
.field select { appearance: none; background-repeat: no-repeat; background-position: right 6px center; background-size: 14px; padding-right: 30px; }

.choice { display: flex; gap: 14px; align-items: flex-start; padding: 18px; border: 1px solid rgba(10,10,15,0.12); border-radius: 6px; transition: border-color .2s, background-color .2s, color .2s; }
.choice:hover { border-color: var(--color-ink); }
.choice.active { border-color: var(--color-ink); background: var(--color-ink); color: var(--color-paper); }
.choice.active .meta { color: rgba(255,255,255,0.65); }
.choice .dot { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid currentColor; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.choice .dot::after { content: ''; width: 10px; height: 10px; border-radius: 50%; background: currentColor; transform: scale(0); transition: transform .2s; }
.choice.active .dot::after { transform: scale(1); }

.step-num { font-family: var(--font-display); font-weight: 800; font-size: 28px; line-height: 1; letter-spacing: -0.03em; }

.summary-stripe { display: none; }
@media (max-width: 1023px) {
  .summary-stripe { display: flex; position: sticky; bottom: 0; z-index: 30; background: var(--color-ink); color: var(--color-paper); padding: 14px 20px; align-items: center; justify-content: space-between; gap: 12px; }
}
```

### Type scale (checkout-specific applications)

| Use | Family | Weight | Size | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Hero H1 | Manrope | 800 | clamp(64px, 11vw, 184px) | -0.04em | 0.86 |
| Step number | Manrope | 800 | 28px | -0.03em | 1 |
| Step title | Manrope | 800 | 28px | -0.03em | 1 |
| Step subtitle | JetBrains Mono | 400 | 10px | 0.28em uppercase | 1 |
| Field label | JetBrains Mono | 400 | 10px | 0.24em uppercase | 1 |
| Field input | Inter | 400 | 15px | 0 | 1.4 |
| Choice title | Manrope | 700 | 18px | -0.02em | 1 |
| Choice meta | JetBrains Mono | 400 | 11px | 0 | 1.4 |
| Summary item name | Manrope | 700 | 15px | -0.02em | tight |
| Grand total | Manrope | 800 | 48px | -0.04em | 1 |
| Mobile stripe total | Manrope | 800 | 24px | -0.03em | 1 |
| WhatsApp CTA | Inter | 600 | 17px | 0 | 1 |

### Spacing

- Container max-width: `1440px`
- Container padding: `px-6 lg:px-10`
- Hero strip vertical: `pt-12 lg:pt-16 pb-8`
- Main grid vertical: `py-12 lg:py-16`
- Main grid column gap: `gap-8 lg:gap-12`
- Between steps: `space-y-14`
- Inter-field bottom margin: `18px`

### Border radius

- Cards: `rounded-lg` (8px)
- Choice cards: `rounded` / `rounded-md` (6px)
- Pills / CTAs: `rounded-full`
- Field inputs: **no rounding** (underline-only)

### Colors

| Use | Hex |
|---|---|
| WhatsApp green | `#25D366` |
| WhatsApp green hover | `#1ebc59` |
| Error red | `#ef4444` (Tailwind red-500) |

---

## State management

Reuse all existing checkout state from `checkout.js`. The redesign adds:
- `activePayment` — derived from `.choice.active` in `#pay-group`. Read on submit; also written to `select[name="paymentMethod"]` for validator compat.
- `activeDelivery` — derived from `.choice.active` in `#dlv-group`. Read on submit; also written to `select[name="deliveryMethod"]`.

Suggestion: keep the hidden `<select>` elements in the form (with `class="hidden"`) so `form.elements.paymentMethod.value` keeps working. The choice cards are the visible UI; the selects are the canonical source of truth for submit.

---

## Assets

The reference uses Unsplash placeholder URLs for thumbnails. In production, every thumb uses `getProductById(item.productId).images[0]`. WhatsApp icon is inlined SVG (no asset).

---

## Implementation order (suggested)

1. **Verify dependencies**: home redesign tokens/utilities + cart redesign are in place. If cart isn't shipped, ship the shared `.qty-stepper` / `.rail` utilities first since the order-summary visual vocabulary overlaps.
2. **Checkout-specific utilities**: add `.field`, `.choice`, `.step-num`, `.summary-stripe` to `src/style.css`.
3. **Header swap**: render the minimal checkout header (logo + 3-step + sesión segura). Either via `noLayout: true` + inline header in the view, or a route check in `layoutPublic`.
4. **`checkoutHTML(...)` rewrite**: hero strip + main 2-col grid skeleton. Keep `id="checkout-form"`, `id="address-wrap"`, `id="form-error"`, `id="checkout-summary-column"` so `checkout.js` orchestration keeps working.
5. **Form fields**: rewrite each `.field` with the underline-only style. Keep `name` attributes identical to current.
6. **Choice card UI**: build `#pay-group` and `#dlv-group`. Add the click handler that toggles `.active` + mirrors into hidden `<select>` elements. Verify `needsAddress(payment, delivery)` still returns correctly.
7. **`checkoutSummaryHTML(...)` rewrite**: items card with inline coupon `<details>` + totals + grand total + trust strip + manifesto micro.
8. **`couponAppliedHTML` + `couponInputHTML` rewrite**: applied = brand-tinted pill; input = mono uppercase pill input + apply button.
9. **Mobile sticky stripe**: render at the bottom of the body (outside the main grid), `type="submit" form="checkout-form"`.
10. **`checkoutSuccessHTML` rewrite**: full-screen brand-tinted success view.
11. **Cursor binding + reveal**: same as home. Re-bind after every `refreshSummaryView()`.
12. **Mobile test**: choice cards stack to 1 col, sticky stripe shows, summary column appears above form (order-first), every field stacks 1 col, headline scales via clamp.
13. **Validation pass**: submit empty form → first invalid field gets red underline + ring, error caption appears below the first broken section. Fix and resubmit → flows to WhatsApp.

---

## Files

- `v2-bold-checkout-reference.html` — full standalone reference. Open in browser and inspect element-by-element while building.
- This `README.md` — the implementation brief.

### Companion handoffs

- **Dependency**: `design_handoff_home_redesign/` — provides tokens, fonts, layout shell (marquee, cursor) — but the checkout swaps the header for a minimal route-specific one.
- **Companion**: `design_handoff_cart_redesign/` — checkout receives traffic from cart's "Continuar al checkout" CTA. The pricing rail in cart shares vocabulary with the summary column here.
- **Companion**: `design_handoff_catalog_redesign/` — success view's "Volver a la tienda" link goes here.
