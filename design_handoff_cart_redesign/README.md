# Handoff: G&L Cart Redesign — "Bold Editorial" v2

## Overview

Redesign of the G&L cart page (route `/cart` → `src/pages/cart.js`). It applies the same **Bold Editorial** aesthetic already approved for the home + catalog pages: large display typography, mono section labels, custom cursor, editorial line rows with thumbnails, and a sticky pricing rail on the right with a giant display-sized total.

**The bundled file `v2-bold-cart-reference.html` is a design reference, not production code.** Standalone (Tailwind CDN + vanilla JS + hardcoded cart data) purely to communicate look, feel, layout, motion, and copy. The task is to **recreate it inside the existing G&L codebase** (Vite + Vanilla JS modules + Tailwind v4 + Supabase) using the project's existing patterns — a `pageCart(state)` function returning `{ title, html, onMount }`, template literals, and helpers from `src/app/`.

Do **not** copy the HTML wholesale into `cart.js`. Adapt it to Tailwind v4, the existing module system, the live `getState()` cart, and the shared brand tokens from the home redesign.

## Fidelity

**High-fidelity.** Final colors, spacing, typography, copy, and interactions are settled. Recreate pixel-perfectly.

---

## Target codebase context

| Concern | Location | Notes |
|---|---|---|
| Cart page entry | `src/pages/cart.js` | Replace contents but keep the exported `pageCart(state)` signature: `{ title, html, onMount }`. |
| Store helpers | `src/app/store.js` | Reuse `getProductById`, `removeCartItem`, `setCartItemQty`, `cartTotal`, `getState`, `getCoupon`, `getDiscountAmount`, `applyCoupon`, `removeCoupon`, `addToCart`. |
| Coupon logic | `src/app/store.js` → `applyCoupon`, `getCoupon`, `getDiscountAmount`, `removeCoupon` | Reuse fully. Cart shows the same applied-coupon state that checkout uses. |
| Money format | `src/app/format.js` → `formatMoney` | Reuse. The reference uses `'$' + n.toLocaleString('es-MX')` — call `formatMoney` instead. |
| Brand constants | `src/app/config.js` → `BRAND.freeShippingMin`, `BRAND.whatsapp` | Use `freeShippingMin` for the progress bar threshold and target. |
| Layout shell | `src/components/layout.js` | No changes (assumes home redesign already shipped marquee + new header). Cart inherits both. |
| Routing | `src/app/router.js` | No new routes. |
| Index | `index.html` | No new fonts (loaded by home redesign). |

### Files to read in the existing codebase before starting

1. `src/pages/cart.js` — current implementation. Note the `lineRow(item)`, `render()`, `getKey()` helpers, the `data-cart-item`/`data-key`/`data-qty`/`data-remove`/`data-qty-minus`/`data-qty-plus` attributes, and the empty-state render path.
2. `src/app/store.js` — cart state shape (`state.cart` is an array of `{ key, productId, qty, size, color }`), and the helpers above.
3. `src/app/format.js` — `formatMoney`
4. `src/app/config.js` — `BRAND.freeShippingMin`
5. `src/app/dom.js` — `on`, `qs` event-delegation helpers
6. `src/style.css` — existing tokens + utilities

---

## Critical existing behaviors that must survive

The current `cart.js` is intentionally light. Preserve:

1. **Live cart**: `render()` always reads from `getState().cart` (not a captured local snapshot). After any mutation, call `render()` again.
2. **Qty stepper**: `[data-qty-minus]`, `[data-qty-plus]`, and `[data-qty]` (input) all funnel through `setCartItemQty(key, n)` with `Math.max(1, …)` clamping. Keep `min=1` and a maximum (suggested: 99).
3. **Remove**: `[data-remove]` → `removeCartItem(key)` → `render()`.
4. **Empty state**: when `getState().cart.length === 0`, swap the items list for a centered block with CTA `/catalog`.
5. **Find product**: every item lookup is `getProductById(item.productId)`. If the product is gone (e.g. removed by an admin), `lineRow` currently returns `''`. Keep that defensive return.
6. **Continue-shopping link**: header link back to `/catalog`.
7. **Checkout CTA**: `/checkout`.
8. **No coupon UI today**: the redesign **adds** a coupon section (see §6.5). Wire it to `applyCoupon` / `removeCoupon` from `store.js` — the same calls checkout uses.

The redesign adds these new behaviors:
- Free-shipping progress bar (computed from `cartTotal()` / `BRAND.freeShippingMin`)
- Recommended products row (uses any 3 products not in the cart; reuse the same selection logic checkout uses for upsell — see `src/pages/checkout.js`, the `eligibleUpsell` block)
- Coupon section (apply + remove)
- Trust strip (static)

---

## Sections (top → bottom)

1. Marquee announcement bar — inherited from layout shell (home redesign)
2. Header — inherited from layout shell (home redesign). The **Bolsa pill in the header is `bg-brand text-paper`** when on `/cart` (active-route style) — flip from `bg-ink` to `bg-brand` via a route check in `layoutPublic`, or via a `body.route-cart` class.
3. **Hero header strip** — breadcrumb steps + giant H1 with item count + free-ship progress bar — **new**
4. **Body grid** — items list (lg:col-span-8) + sticky pricing rail (lg:col-span-4)
   - Pricing rail moves to the **top** on mobile (`order-first lg:order-none`)
5. **"Completa tu look"** — 3 recommended products — **new**
6. Footer — inherited from layout shell (home redesign)

---

## §3 — Hero header strip

- `pt-14 lg:pt-20 pb-10 border-b border-ink/10`
- Inside `max-w-[1440px] mx-auto px-6 lg:px-10`:

**Top row (flex items-center gap-3 mb-8)** — funnel-style step indicator + back link:
- Left: `<a href="/catalog">← Seguir comprando</a>` — chevron + mono 11px tracking-[0.28em] uppercase ink/55, hover → ink
- `<span class="h-px flex-1 bg-ink/15 mx-3"></span>`
- Step labels (each mono 11px tracking-[0.28em] uppercase, separated by `·` opacity-30):
  - `Paso 01 — Bolsa` (active, full ink)
  - `02 — Datos` (ink/40)
  - `03 — WhatsApp` (ink/40)

**Headline row** — grid 12 cols gap-6 lg:gap-10 items-end:
- Left col-span-9: H1 (Manrope 800, `clamp(64px, 11vw, 184px)`, leading 0.86, tracking -0.04em):
  ```
  Tu <span class="text-brand">bolsa</span>
  <span class="outline-text">{NN} piezas.</span>
  ```
  where `{NN}` is the 2-digit padded item count. When count is 0 or 1, use the correct singular ("01 pieza."). `outline-text` = `-webkit-text-stroke: 1px currentColor; color: transparent`.
- Right col-span-3 lg:text-right: paragraph (15px ink/70 max-w-[320px] lg:ml-auto leading-relaxed):
  > "Reserva sin pagar online. Cerramos cada pedido por WhatsApp — pago en transferencia o al recoger."

**Free-shipping progress** (mt-12):
- Caption row: mono `Envío gratis a {formatMoney(freeShippingMin)}` left + mono `{formatMoney(subtotal)} / {formatMoney(freeShippingMin)} · ` + green/brand status right. Status copy:
  - If `subtotal >= freeShippingMin`: `¡Activo!` in `text-brand`
  - Else: `Faltan ${formatMoney(freeShippingMin - subtotal)}` in ink/60
- Bar: 6px tall, `bg-fog rounded-full overflow-hidden`. Inner fill `bg-ink rounded-full` with width `min(100%, (subtotal/freeShippingMin)*100%)`. When activo, overlay a moving sheen: an absolute `inset-0` div with a `linear-gradient(90deg, transparent, rgba(33,79,199,.55), transparent)` background, animated via the existing `scroll-x` keyframe (2.4s linear infinite).

---

## §4 — Items list (LEFT column, lg:col-span-8)

**Column header** (hidden on mobile):
- Grid 12 cols gap-4 pb-4. Each cell: mono 10px tracking-[0.28em] uppercase ink/45
  - col-span-6: `Producto`
  - col-span-3 text-center: `Cantidad`
  - col-span-3 text-right: `Total`

**Line rows** (`.cart-row`): each item maps to one `<div class="cart-row grid grid-cols-12 gap-4 items-center py-6" data-cart-item data-key="${item.key}">`

Visual borders: 1px top border (`#EAE9E4`). Last row gets 1px bottom border too. (Or use `divide-y` on the parent — same outcome.)

Cells:

**`col-span-12 md:col-span-6` — thumb + text** (flex gap-5):
- Thumb: `w-24 md:w-28 flex-shrink-0 rounded-md overflow-hidden bg-fog`, aspect 4/5. `<img>` `object-cover`.
- Body (`flex-1 min-w-0`):
  - Meta row (mb-1): mono 10px tracking-[0.22em] uppercase. Left ink/45: ordinal `01`, `02`, … (the item index in the rendered list, NOT the array position). Right ink/55: `p.type` (the category from the product).
  - Name: Manrope 800, `clamp(22px, 2vw, 28px)`, leading 1, tracking -0.03em, mb-2. Content: `p.name`.
  - Spec row (font-mono text-[11px] text-ink/55, flex items-center gap-3):
    - Color swatch + name: `<span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-full border border-ink/15" style="background:{colorHex}"></span>{item.color}</span>`
    - Separator `<span class="opacity-40">·</span>`
    - `Talla {item.size}`
    - Separator
    - `{p.sku || `GL-${item.productId}`}`
  - Actions row (mt-3, flex items-center gap-4 text-[12px]):
    - `♡ Guardar` button — `data-action="save"` (no-op for v1; future: wishlist). `ul-link` style, ink/65 hover ink.
    - `Eliminar` button — `data-action="remove"`. `ul-link` style, ink/65 hover text-brand.

**`col-span-6 md:col-span-3` — qty stepper** (flex md:justify-center):
- `.qty-stepper`: inline-flex border `1px solid rgba(10,10,15,0.15)`, `rounded-full`, height 44px
  - `-` button: 44×44, rounded-full, hover `bg-ink text-paper`. `data-action="dec"`.
  - input: width 44, text-center, background transparent, outline none, mono 14px. `data-qty value="${item.qty}"`.
  - `+` button: same as `-`. `data-action="inc"`.

**`col-span-6 md:col-span-3` — price** (text-right):
- If `p.originalPrice && p.originalPrice > p.price`: small mono 12px ink/40 line-through `formatMoney(p.originalPrice * item.qty)`.
- Total: Manrope 800, `clamp(22px, 2vw, 28px)`, leading-none, tracking -0.03em, tabular-nums. If discounted, `text-brand`. Content: `formatMoney(p.price * item.qty)`.
- Unit price: mono 10px tracking-[0.2em] uppercase ink/45 (mt-1). Content: `{formatMoney(p.price)} c/u`.

**Empty state** (when `cart.length === 0`):
- Hide the list, show centered block (`py-20 text-center`):
  - Outline-text: `<div class="font-display text-[80px] outline-text leading-none">Bolsa vacía</div>`
  - Subtitle: `<p class="mt-4 text-ink/60">Aún no has agregado nada.</p>`
  - Primary CTA pill: `<a href="/catalog" class="… bg-ink text-paper hover:bg-brand">Explorar catálogo →</a>` with `arrow-walk` span.

**Utility row** (below the list, mt-8):
- Left: button `♡ Guardar para después` (mono 11px tracking-[0.24em] uppercase, no real handler for v1)
- Right: `<a href="/catalog" class="ul-link text-[13px] font-semibold">← Seguir comprando</a>`

---

## §5 — Recommended ("Completa tu look")

- Container: `mt-20`.
- Heading row (`mb-6`):
  - Left: eyebrow `§ — Completa tu look` (mono 11px tracking-[0.28em] uppercase ink/55, mb-3) + H2 (Manrope 800, `clamp(36px, 5vw, 64px)`, leading 0.9, tracking -0.04em):
    > También va con<br/>lo de tu bolsa.
  - Right (desktop only): `<a href="/catalog" class="ul-link text-[13px] font-semibold">Ver más →</a>`
- Grid: 2 cols (mobile) / 3 cols (md+), gap-4. Each card:
  - Aspect 4/5 `bg-fog rounded-md overflow-hidden`, img with `group-hover:scale-105 transition-transform duration-700`
  - Below (mt-3): flex items-start justify-between gap-2
    - Eyebrow (mono 10px tracking-[0.22em] uppercase ink/55) — `p.type`
    - Name (Manrope 700, 15px leading-tight)
  - Right: mono 13px font-semibold `formatMoney(p.price)`
- **Data**: pull 3 products from `state.products` excluding those already in cart, filtered to `p.badge !== 'Borrador'` and in-stock. Reuse the upsell selection pattern from `src/pages/checkout.js` (`eligibleUpsell.sort(() => 0.5 - Math.random()).slice(0, 3)`).
- Each card links to `/producto/${p.id}` — full card is the link.

---

## §6 — Sticky pricing rail (RIGHT column, lg:col-span-4)

Outer: `lg:sticky lg:top-[96px] space-y-4`. Wrapped in `aside class="col-span-12 lg:col-span-4 order-first lg:order-none"` so it appears **above** the items on mobile.

### §6.1 — Pricing card (`.rail`)

`bg-fog rounded-lg p-7`.

Top row (`flex items-center justify-between mb-6`):
- Left: mono 10px tracking-[0.28em] uppercase ink/55 `Resumen`
- Right: mono 10px tracking-[0.18em] uppercase ink/55 `{itemCount} piezas`

Body (`space-y-3 font-mono text-[13px] digit-tabular`), each row `flex justify-between items-baseline`:
- `Subtotal` — `formatMoney(subtotal)`
- (if coupon active) `Descuento [pill: WELCOME10]` left, `−{formatMoney(discount)}` right — `text-brand`. Pill: `bg-brand/10 px-1.5 py-0.5 rounded text-[10px] tracking-wider`.
- `Envío` — `¡Gratis!` (`text-brand` if `freeShipping`) or `Por calcular` (ink/65 if not)
- `Impuestos` — `Incluidos`

Divider: `my-6 h-px bg-ink/10`.

Total row (`flex items-baseline justify-between`):
- Left: mono 11px tracking-[0.28em] uppercase `Total`
- Right: Manrope 800, 44px, tracking -0.04em, tabular-nums — `formatMoney(total)`

Subline (mt-2 text-right): mono 10px tracking-[0.2em] uppercase ink/45 `MXN · IVA incluido`.

**CTA** (mt-7):
- `<a href="/checkout" class="group flex items-center justify-between gap-3 bg-ink text-paper pl-7 pr-3 h-16 rounded-full text-[15px] font-semibold hover:bg-brand transition-colors">`
  - Left: `<span>Continuar al checkout</span>`
  - Right circle: `w-12 h-12 rounded-full bg-paper text-ink inline-flex items-center justify-center arrow-walk` with right-arrow icon

Trust line (mt-4 flex items-center justify-center gap-2): mono 10px tracking-[0.2em] uppercase ink/55, padlock icon (text-brand) + `Cierre seguro · sin pago online`.

### §6.2 — Coupon card

`border border-ink/10 rounded-lg p-5`.

- Label (mb-3): mono 10px tracking-[0.28em] uppercase ink/55 `Cupón`
- If coupon active:
  - `flex items-center justify-between bg-brand/[0.07] border border-brand/30 rounded-full px-4 h-12`
    - Left (flex items-center gap-3): mono 12px font-semibold text-brand `{coupon.code}` + mono 10px tracking-[0.2em] uppercase text-brand/75 `−10% aplicado` (use `coupon.label` if available)
    - Right: `<button data-remove-coupon>Quitar</button>` — mono 11px uppercase tracking-wider ink/55, hover text-brand. Wire to `removeCoupon(true)` + re-render.
- Below (`<details class="mt-3">`):
  - `<summary>+ Otro código</summary>` — mono 11px tracking-[0.2em] uppercase ink/55 cursor-pointer
  - Form (mt-3, flex gap-2):
    - `<input type="text" placeholder="CÓDIGO">` — flex-1, mono 12px tracking-wider uppercase, `border border-ink/15 rounded-full px-4 h-11`, focus border-ink, placeholder ink/35
    - `<button>Aplicar</button>` — px-5 h-11 rounded-full `bg-ink text-paper text-[12px] font-semibold hover:bg-brand`
  - On apply: `applyCoupon(code, true)` (the `true` is the `silent` flag — same as checkout). On success: re-render. On error: show an inline mono 10px text-red error below the input.

### §6.3 — Trust strip

`grid grid-cols-3 gap-px bg-ink/10 rounded-lg overflow-hidden`. Each cell `bg-paper p-4 text-center`:
1. `31.` (Manrope 800, 22px, leading-none; the `.` in `text-brand`) — `Años en Colima`
2. `4.9/5` (the `/5` is opacity-40 14px) — `+500 reseñas`
3. `02` — `Sucursales`
Captions: mono 9px tracking-[0.18em] uppercase ink/55.

---

## Interactions & Behavior

### Live qty + remove
- `[data-action="inc"]` → `setCartItemQty(key, Math.min(99, qty+1))` → re-render
- `[data-action="dec"]` → `setCartItemQty(key, Math.max(1, qty-1))` → re-render
- `[data-action="remove"]` → `removeCartItem(key)` → re-render
- `[data-qty]` change → `setCartItemQty(key, clamp(value))` → re-render

After every mutation: recompute subtotal/discount/total/itemCount, update header H1 outline-text, progress bar width, and the rail values **without re-rendering the whole row list if not necessary**. Easiest implementation: re-render the entire body on every mutation (the existing pattern).

### Coupon
- Apply → `applyCoupon(code, true)`. On success: refresh totals + rail markup, expose the applied-state UI.
- Remove → `removeCoupon(true)` + refresh.

### Empty state / non-empty toggle
- The view toggles between line-rows-list and the centered empty block based on `getState().cart.length`.

### Progress bar
- Width: `min(100%, (subtotal / freeShippingMin) * 100%)`.
- When `subtotal >= freeShippingMin`, the sheen overlay is visible (uses `scroll-x` keyframe at 2.4s).

### Reveal on scroll
- Wrap the items section + the recommended section in `.reveal`. Same IntersectionObserver pattern as the home redesign.

### Cursor follower
- Inherited from home redesign. Re-bind `cursor-hover` listeners after every re-render of the items list and recommended row (new buttons/links).

### Sticky pricing rail
- `lg:sticky lg:top-[96px]` — 72 (header) + 24 padding.
- On mobile, the rail is above the items; no sticky behavior on mobile.

---

## Design Tokens

All tokens are inherited from the home redesign. No new tokens.

### Cart-specific utilities (add to `src/style.css` if not present from other handoffs)

```css
.qty-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(10,10,15,0.15);
  border-radius: 9999px;
  height: 44px;
}
.qty-stepper button {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: background-color .2s, color .2s;
}
.qty-stepper button:hover { background: var(--color-ink); color: white; }
.qty-stepper input {
  width: 44px;
  text-align: center;
  background: transparent;
  outline: none;
  font-family: var(--font-mono);
  font-size: 14px;
}

.cart-row { border-top: 1px solid #EAE9E4; }
.cart-row:last-child { border-bottom: 1px solid #EAE9E4; }

.rail { background: var(--color-fog); border-radius: 8px; }
.rail .row { display: flex; justify-content: space-between; align-items: baseline; }
.strike { text-decoration: line-through; }
```

### Type scale (cart-specific applications)

| Use | Family | Weight | Size | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Hero H1 | Manrope | 800 | clamp(64px, 11vw, 184px) | -0.04em | 0.86 |
| Item name | Manrope | 800 | clamp(22px, 2vw, 28px) | -0.03em | 1 |
| Item total | Manrope | 800 | clamp(22px, 2vw, 28px) | -0.03em | 1 |
| Grand total | Manrope | 800 | 44px | -0.04em | 1 |
| Spec meta | JetBrains Mono | 400 | 11px | 0 | 1 |
| Eyebrow | JetBrains Mono | 400 | 10–11px | 0.22–0.28em uppercase | 1 |
| Recommended name | Manrope | 700 | 15px | -0.02em | tight |

### Spacing

- Container max-width: `1440px`
- Container padding: `px-6 lg:px-10`
- Hero strip vertical: `pt-14 lg:pt-20 pb-10`
- Body grid vertical: `py-14 lg:py-20`
- Body grid column gap: `gap-8 lg:gap-12`
- Items list inter-row padding: `py-6`
- Rail card padding: `p-7`
- Coupon card padding: `p-5`
- Trust strip cell padding: `p-4`

### Border radius

- Cards (rail, coupon, trust): `rounded-lg` (8px)
- Pills / CTAs / qty-stepper: `rounded-full`
- Thumbs: `rounded-md` (6px)

### Shadows

- No shadows on items list. The rail is on a `bg-fog` card with no shadow.

---

## State management

No new state. Reuse:
- `getState()` — full app state
- `state.cart` — array of `{ key, productId, qty, size, color }`
- `cartTotal()`, `getCoupon()`, `getDiscountAmount()` — totals
- `applyCoupon(code, silent)`, `removeCoupon(silent)` — coupons
- `getProductById(id)` — product lookup
- `removeCartItem(key)`, `setCartItemQty(key, n)` — mutations
- `subscribe(cb)` (optional) — if you want live updates from background events (admin product edits while user has cart open); the current cart doesn't subscribe and that's fine.

Local component state: none.

---

## Assets

The reference uses Unsplash placeholder URLs. In production, every thumb uses `getProductById(item.productId).images[0]`. The 3 recommended products use `p.images[0]`.

---

## Implementation order (suggested)

1. **Verify dependencies**: home redesign tokens/fonts/utilities (marquee, cursor, `ul-link`, `arrow-walk`, `outline-text`) are present. If not, port them first.
2. **Cart-specific utilities**: add `.qty-stepper`, `.cart-row`, `.rail`, `.strike` to `src/style.css`.
3. **Page shell**: replace `pageCart()` HTML with the hero strip + 12-col body grid skeleton.
4. **Items list `lineRow(item, idx)`**: rewrite with the new grid layout. Preserve all `data-*` hooks (`data-cart-item`, `data-key`, `data-qty`, `data-qty-minus`, `data-qty-plus`, `data-remove`). Add `data-action="save"` as a no-op for the wishlist button.
5. **Empty state**: outline-text headline + CTA.
6. **Recommended row**: pull from `state.products` minus cart items minus drafts minus out-of-stock; shuffle; slice 3.
7. **Pricing rail**: subtotal/discount/total + coupon section. Wire `applyCoupon`/`removeCoupon`.
8. **Trust strip + free-shipping progress**: static markup + computed width.
9. **Reveal + cursor rebinding**: after every `render()`, call the cursor `bindCursor()` helper from the layout shell.
10. **Mobile**: verify the rail appears **above** the list via `order-first lg:order-none`. Headline scales down via `clamp()`. Step indicator wraps cleanly.

---

## Files

- `v2-bold-cart-reference.html` — full standalone reference. Inspect element-by-element while building.
- This `README.md` — the implementation brief.

### Companion handoffs

- **Dependency**: `design_handoff_home_redesign/` — provides tokens, fonts, layout shell, marquee, cursor.
- **Companion**: `design_handoff_catalog_redesign/` — same aesthetic; the cart's "Continuar al checkout" CTA and the empty-state CTA both link into routes the catalog already covers.
- **Next step**: `design_handoff_checkout_redesign/` — cart's CTA hands off to checkout, which uses the same pricing rail vocabulary.
