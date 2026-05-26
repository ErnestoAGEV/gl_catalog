# Handoff: G&L Product Detail (PDP) Redesign — "Bold Editorial" v2

## Overview

Redesign of the G&L product detail page (route `/producto/:id` → `src/pages/product.js`). It applies the same **Bold Editorial** aesthetic as the home, catalog, cart, and checkout pages: large display typography, mono section labels, custom cursor, editorial gallery with thumbnails + click-to-zoom, pill-style size selector with stock indicators, swatch-pill color picker, accordion specs, and an editorial "Pairs well with" + reviews section.

**The bundled file `v2-bold-product-reference.html` is a design reference, not production code.** Standalone (Tailwind CDN + vanilla JS + hardcoded product data). The task is to **recreate it inside the existing G&L codebase** (Vite + Vanilla JS modules + Tailwind v4 + Supabase) preserving the existing PDP behaviors — view tracking, share, back button, size selection gating add-to-cart, color picker, recommended products, quick-add modal.

Do **not** copy the HTML wholesale into `product.js`. Adapt to Tailwind v4, the live product data from `state.products`, and the shared brand tokens introduced by the home redesign.

## Fidelity

**High-fidelity.** Final colors, spacing, typography, copy, and interactions are settled. Recreate pixel-perfectly.

---

## Target codebase context

| Concern | Location | Notes |
|---|---|---|
| PDP page entry | `src/pages/product.js` | Replace contents but keep the exported `pageProduct(initialState)` signature: `{ title, html, onMount }`. Preserve `noPaddingTop: true` if relevant. The current page sets `hideHeaderOnMobile: true` — the redesign **keeps the header always visible** (drop that flag). |
| Carousel + zoom helpers | `src/pages/catalogCarousels.js` → `initModalCarousel`, `initModalZoom` | The redesign uses a **simpler gallery** (one stage image + thumb rail, no inline modal). Reuse `initModalZoom` for the click-to-zoom transform OR write a small inline implementation matching the reference (CSS class `.zoomed` toggle). The existing `initModalCarousel` is for the modal-style carousel; the new gallery doesn't need it. |
| Recommended products | `src/pages/product.js` → `getRecommendedProducts(currentProduct, allProducts, limit=4)` + `recommendedCard(p)` | Reuse `getRecommendedProducts` as-is (same selection logic). **Replace `recommendedCard`** with the new editorial card (matches catalog card visually; numbered, mono caption, swatch row dropped to keep the row tighter). |
| Quick-add modal | `src/pages/catalogQuickAdd.js` → `handleQuickAdd` + `src/pages/catalogModals.js` → `sizeSelectionModal` | Reuse for the "Pairs well with" cards' quick-add behavior. |
| Badge color helper | `src/pages/catalogCard.js` → `getBadgeColor` | Reuse for badges in the gallery and in recommended cards. |
| Perfume detection | `src/pages/adminProductsData.js` → `isPerfumeCategory` | Reuse so perfume images get `object-contain` on white background instead of `object-cover`. |
| Store helpers | `src/app/store.js` | `getState`, `addToCart`, `trackProductView`, `getProductById`. |
| Toast | `src/app/toast.js` → `showToast` | Reuse for the share-copied message and the "¡Agregado!" feedback. |
| Money format | `src/app/format.js` → `formatMoney` | Reuse. |
| Router | `src/app/router.js` → `navigate` | Used for back fallback (`/catalog`). |
| Brand constants | `src/app/config.js` → `BRAND.whatsapp`, `BRAND.freeShippingMin` | WhatsApp link uses `BRAND.whatsapp`. |
| Layout shell | `src/components/layout.js` | No changes (assumes home redesign already shipped marquee + new header). Drop the `hideHeaderOnMobile: true` flag the current PDP uses — the new design keeps the header always visible. |
| Routing | `src/app/router.js` + `views.js` | No new routes. |
| Index | `index.html` | No new fonts. |

### Files to read in the existing codebase before starting

1. `src/pages/product.js` — current implementation. The orchestration `onMount` block sets up: view tracking, back button, share button, carousel + zoom init, size selection, color dropdown, add-to-cart gated by size, recommended quick-add. **All of these must transfer.**
2. `src/pages/catalogCarousels.js` — `initModalZoom` for click-to-zoom mechanics.
3. `src/pages/catalogCard.js` — `getBadgeColor`.
4. `src/pages/adminProductsData.js` — `isPerfumeCategory`.
5. `src/app/store.js` — `addToCart` payload shape (`{ productId, size, color, qty }`).

---

## Critical existing behaviors that must survive

The current PDP does real work. Preserve:

1. **404 fallback**: when `state.products.find(p => String(p.id) === String(productId))` returns nothing, render a centered "Producto no encontrado" block with CTA `/catalog`. The redesigned 404 should match the catalog's empty-state aesthetic (outline-text headline + CTA pill).
2. **View tracking**: `trackProductView(product.id)` on mount.
3. **Back button**: `window.history.length > 1 ? history.back() : navigate('/catalog')`. The reference replaces this with a **breadcrumb row** that includes `Inicio / Tienda / {Type} / {Name}` — keep the breadcrumb AND a mobile-only back button in the gallery top bar.
4. **Share button**: uses `navigator.share` when available, falls back to `navigator.clipboard.writeText(shareUrl)` + `showToast`.
5. **Add-to-cart gating**: when `product.sizes && product.sizes.length > 0`, the add button is **disabled** until a size is selected. Selecting a size enables it. The redesign keeps this; the disabled label reads `Selecciona una talla`, the enabled label reads `Agregar · talla {size}`.
6. **Add-to-cart payload**: `addToCart({ productId, size, color, qty: 1 })`. Color comes from the active swatch (the redesign changes from `<select>` to swatch pills — value semantics are the same).
7. **Visual feedback on add**: button morphs to checkmark + `¡Agregado!` for ~1.8s, then restores. If sizes are required and none selected after restore, re-disable.
8. **Recommended quick-add**: `[data-quick-add]` buttons in the recommended cards open `sizeSelectionModal` in `#product-modal-container`. Wire via `handleQuickAdd(e, btn, modalContainer)`.
9. **Carousel keyboard nav**: ← / → arrows step through gallery images. Preserve in redesign.
10. **Out-of-stock sizes**: any size with `0` stock (or whatever the data model uses) renders disabled (line-through, opacity .35).
11. **Perfume images**: `isPerfumeCategory(product.type)` → `object-contain` on white bg in the stage; non-perfumes → `object-cover` on fog bg. The reference defaults to `object-cover bg-fog`; add the perfume conditional.

---

## Sections (top → bottom)

1. Marquee announcement bar — inherited from layout shell (home redesign)
2. Header — inherited from layout shell (home redesign)
3. **Breadcrumb strip** — `Inicio / Tienda / {Type} / {Name}` + SKU on the right — **new**
4. **Product grid** (12 cols) — Gallery left (lg:col-span-7) + Info sticky right (lg:col-span-5)
5. **"Combina con" — pairs well with** — 4-up grid of editorial cards (replaces existing recommended grid)
6. **Reviews** — average + 4 quotes — **new**
7. **Mobile sticky CTA** — bottom-fixed bar with price + "Agregar" on `<md` viewports only
8. Footer — inherited from layout shell (home redesign)

---

## §3 — Breadcrumb strip

- `pt-6 pb-2 border-b border-ink/5`
- Inside `max-w-[1440px] mx-auto px-6 lg:px-10`:
- Flex items-center gap-3, font-mono text-[11px] tracking-[0.28em] uppercase
- Trail nodes (separated by `<span class="text-ink/30">/</span>`):
  - `<a href="/">Inicio</a>` — ink/55 hover ink, `ul-link`
  - `<a href="/catalog">Tienda</a>` — same style
  - `<a href="/categoria/{product.type}">{product.type}</a>` — same style
  - `<span>{product.name}</span>` — full ink, no link
- Divider rule: `<span class="h-px flex-1 bg-ink/15 mx-3"></span>`
- Right: SKU mono 11px ink/55 — `SKU · {product.sku || 'GL-' + product.id.slice(0, 8)}`

On mobile (≤ md), the breadcrumb can wrap to 2 lines; that's fine. The SKU stays visible.

---

## §4.A — Gallery (LEFT, lg:col-span-7)

Outer container: `relative`.

### Stage

```css
.gallery-stage {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--color-fog);
  border-radius: 8px;
}
.gallery-stage img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* or contain for perfumes */
  transition: transform .5s cubic-bezier(.22,.61,.36,1);
}
.gallery-stage.zoomed img { transform: scale(1.6); }
```

Overlays inside the stage:

**Top-left badges** (`absolute top-4 left-4 flex gap-2`):
- Map `p.badges` (or compute from `p.badge` / `p.originalPrice`):
  - Sale (`originalPrice > price`): `bg-brand text-paper`, mono 10px tracking-[0.18em] uppercase rounded-full, label `−{Math.round((1 - price/originalPrice) * 100)}%`
  - New (`p.badge === 'Nuevo'`): `bg-paper text-ink` same shape, label `Nuevo`
  - Best/Top (`p.badge === 'Más vendido'`): `bg-ink text-paper` same shape, label `Top`
  - Custom badge (`p.badge` for any other string): use `getBadgeColor(p.badge)` as bg

**Top-right controls** (`absolute top-4 right-4 flex items-center gap-1.5`):
- Counter pill: `bg-paper/85 backdrop-blur px-2.5 py-1 rounded-full`, mono 10px tracking-[0.2em] uppercase — `{NN} / {TT}` (current / total)
- Share button: 36×36 circle `bg-paper/85 backdrop-blur`, hover `bg-ink text-paper`. Wire to existing share logic.
- Wishlist button: same shape, heart icon. No real handler for v1 (placeholder for future wishlist).
- **Mobile-only back button**: include a 36×36 circle on the left side `top-4 left-4` ONLY when ≤md AND when there's no breadcrumb visible. Suggestion: keep the breadcrumb always visible (it wraps), drop the mobile back button — but if the breadcrumb wraps awkwardly on mobile, render a `md:hidden` back button at the top-left of the stage and shift the badge cluster down or hide it on mobile.

**Side nav arrows** (`absolute left-3 / right-3 top-1/2 -translate-y-1/2`):
- 44×44 circle `bg-paper/85 backdrop-blur`, hover `bg-ink text-paper`. Chevron icons.

**Bottom caption row** (`absolute left-4 bottom-4 right-4 flex items-end justify-between text-paper`):
- Left pill: `bg-ink/40 backdrop-blur px-2 py-1 rounded`, mono 10px tracking-[0.24em] uppercase — `Vista {NN} · {caption}` where caption is a per-image label. If the data model doesn't have per-image labels, omit the caption text and just show `Vista {NN}` or `Imagen {NN} de {TT}`.
- Right pill (only when zoom is supported): `bg-ink/40 backdrop-blur` — `Click para zoom`.

### Thumb rail

Below the stage, `mt-4 overflow-x-auto pb-1`:

```css
.thumb-rail { display: flex; gap: 10px; }
.thumb-rail .thumb {
  position: relative;
  width: 92px;
  aspect-ratio: 4 / 5;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(10,10,15,0.1);
  transition: border-color .25s, transform .25s;
}
.thumb-rail .thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-rail .thumb.active { border-color: var(--color-ink); }
.thumb-rail .thumb:hover { transform: translateY(-2px); border-color: var(--color-ink); }
.thumb-rail .thumb .idx {
  position: absolute; top: 6px; left: 6px;
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em;
  color: white; background: rgba(10,10,15,0.5);
  backdrop-filter: blur(4px);
  padding: 2px 5px; border-radius: 2px;
}
```

Each thumb shows its `01`, `02`, … index pill in the top-left corner. Click → set as the stage image.

### Gallery JS

- `idx = 0` on mount.
- `go(i)`: clamp via `(i + IMAGES.length) % IMAGES.length`. Swap `stageImg.src`, update counter, caption, thumb active class.
- Prev/Next + keyboard ←/→.
- Click on stage (NOT on a button) → toggle `.zoomed` class on the stage. While zoomed, add `body.cursor-zoom` so the cursor ring inflates and the dot hides. Click again to un-zoom.

```css
body.cursor-zoom .cursor-ring {
  width: 64px; height: 64px; background: transparent;
  mix-blend-mode: difference; border-color: var(--color-paper);
}
body.cursor-zoom .cursor-dot { width: 0; height: 0; }
```

Optional polish (out of scope v1): pan the zoomed image with mouse position.

### Perfume override

When `isPerfumeCategory(product.type)`:
- Stage img class: `object-contain` instead of `object-cover`
- Stage bg: `bg-paper` (or `bg-white`) instead of `bg-fog`
- Apply same to thumb rail

---

## §4.B — Info column (RIGHT, lg:col-span-5)

Outer: `lg:sticky lg:top-[88px]` so the info follows the user as the gallery scrolls (only kicks in if the gallery is taller than the viewport).

### Eyebrow row (flex items-center gap-3 mb-5)
- Left: mono 10px tracking-[0.28em] uppercase ink/55 — `{product.type} · {product.subtitle || material}`
- Divider: `<span class="h-px flex-1 bg-ink/15"></span>`
- Right (stock status): mono 10px tracking-[0.2em] uppercase, dot + label. States:
  - `text-brand` + brand dot → `En stock`
  - `#f59e0b` (amber) + amber dot → `Últimas piezas`
  - `text-ink/40` + ink/40 dot → `Agotado`

Compute from `product.stock` or summed size stocks.

### Name (H1)

- Manrope 800, `clamp(36px, 5vw, 72px)`, leading 0.92, tracking -0.04em
- Format: split on the most important word and put it on its own line with `text-brand`. Suggested rule: if `name` has 3+ words, last word → `text-brand` on new line. If 2 words, last word → `text-brand` on same line. Owner discretion — the reference shows `Camisa Oxford\n<span class="text-brand">Hueso</span>.`.
- Trailing period on the last fragment (matches the home and catalog headlines).

### Tags & reviews row (flex items-center gap-3 flex-wrap mb-7)

Each separated by `<span class="text-ink/30">·</span>`:
- `★ {avg}` — mono 11px tracking-[0.2em] uppercase
- `<a href="#reviews">{count} reseñas</a>` — `ul-link` mono 11px uppercase tracking-[0.2em]
- `SKU {sku}` — mono 11px ink/55

### Price block

Row (flex items-baseline gap-4 mb-2):
- Current price: Manrope 800, 56px, leading-none, tracking -0.04em, tabular-nums. **If discounted, `text-brand`**.
- Original price (only if discount): mono 16px ink/40 line-through tabular-nums

Below (flex items-center gap-3 mb-8):
- Savings: mono 10px tracking-[0.22em] uppercase text-brand — `Ahorras {formatMoney(diff)} · {pct}%`
- Separator
- MSI note: mono 10px ink/55 — `3 meses sin intereses · MSI` (only show if `price >= 1500` — owner decision, configurable)

### Color picker (mb-6)

Header (flex items-center justify-between mb-3):
- Left: mono 10px tracking-[0.28em] uppercase ink/55 — `Color · <span class="text-ink">{currentColor}</span>`
- Right: mono 10px tracking-[0.18em] uppercase ink/45 — `{count} disponibles`

Swatches grid (flex items-center gap-2.5 flex-wrap):

Each swatch is a **pill button** containing a circular chip + color name:

```css
.swatch-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 6px 14px 6px 6px;
  border-radius: 9999px;
  border: 1px solid rgba(10,10,15,0.15);
  background: white;
  transition: all .2s;
}
.swatch-btn:hover { border-color: var(--color-ink); }
.swatch-btn.active { border-color: var(--color-ink); background: var(--color-ink); color: var(--color-paper); }
.swatch-btn .swatch-chip {
  width: 28px; height: 28px;
  border-radius: 9999px;
  border: 2px solid rgba(255,255,255,0.85);
  box-shadow: 0 0 0 1px rgba(10,10,15,0.15);
}
.swatch-btn.active .swatch-chip {
  box-shadow: 0 0 0 1px rgba(255,255,255,0.3);
}
.swatch-btn .name {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
```

**Important**: the current data model stores `p.colors` as an array of strings. The redesign needs hex values for the chip background. Either:
- Extend the data model (add `p.colorSwatches: [{ name, hex }]`), OR
- Maintain a name→hex map in `product.js` (e.g. `Hueso → #F4EFE3`, `Marino → #19355c`, etc.), OR
- Fall back to a `bg-fog` neutral chip with just the color name in the pill if no hex is known.

Selecting a swatch updates the visible `Color · {currentColor}` and the `addToCart` payload. If the color also has a hero image variant, swap the gallery to it (out of scope v1).

### Size picker (mb-7)

Header (flex items-center justify-between mb-3):
- Left: mono 10px tracking-[0.28em] uppercase ink/55 — `Talla · <span class="text-ink">{selectedSize || 'Selecciona'}</span>` — if selected, also append ` · quedan {stock}` in ink/55
- Right: button `Guía de tallas` — `ul-link` mono 10px tracking-[0.22em] uppercase ink/65 hover ink, with menu icon. Click → open size guide modal (out of scope; can be no-op or open existing modal if one exists).

Size pills grid (flex items-center gap-2 flex-wrap):

```css
.size-pill {
  min-width: 56px; height: 44px;
  padding: 0 14px;
  border-radius: 9999px;
  border: 1px solid rgba(10,10,15,0.15);
  background: white;
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.04em;
  transition: all .2s;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.size-pill:hover { border-color: var(--color-ink); }
.size-pill.active { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
.size-pill.disabled { opacity: 0.35; text-decoration: line-through; cursor: not-allowed; }
.size-pill .stock-dot { width: 5px; height: 5px; border-radius: 50%; }
```

Each pill: size label + tiny stock dot. Dot color:
- `bg-brand` (blue) → ≥ 3 in stock
- `#f59e0b` (amber) → 1-2 in stock ("quedan pocas")
- omitted → 0 (pill is `.disabled` — line-through)

Below the pills (mt-3, font-mono text-[10px] tracking-[0.18em] uppercase ink/55):
- Legend row: `● Disponible · ● Quedan pocas · ● Agotado` (each with the matching dot color)

### CTAs (space-y-2.5 mb-7)

**Primary** — `Agregar a la bolsa`:
- `<button id="addBtn" disabled>` — group, flex items-center justify-between w-full, `bg-ink text-paper pl-6 pr-2 h-16 rounded-full text-[15px] font-semibold`, hover `bg-brand`, disabled `opacity-40 cursor-not-allowed`.
- Left: cart icon + label (default `Selecciona una talla`, after selection `Agregar · talla {size}`)
- Right: `w-12 h-12 rounded-full bg-paper text-ink arrow-walk` with right-arrow icon
- Wire: enabled only when selectedSize is set (or when product has no sizes). On click: `addToCart({ productId, size, color, qty: 1 })` + showToast + 1.8s checkmark feedback (matches current behavior).

**Secondary** — `Pregunta por WhatsApp`:
- `<a href="https://wa.me/{BRAND.whatsapp}?text=Hola%2C+me+interesa+{encodeURIComponent(product.name)}" target="_blank">`
- Pill `bg-paper text-ink border border-ink/15 hover:border-ink h-14 rounded-full text-[14px] font-semibold`
- WhatsApp icon (text-[#25D366]) + label

### Trust strip (mb-7)

3-cell strip, identical visual vocabulary to cart/checkout but with PDP-specific copy:
- 🚚 `Envío 2-3 días`
- 🔄 `Cambios 15 días`
- 🛡 `Compra segura`

Each cell `bg-paper p-4 text-center`, icon text-brand 1.6 stroke, caption mono 10px tracking-[0.18em] uppercase. Outer `grid grid-cols-3 gap-px bg-ink/10 rounded-lg overflow-hidden`.

### Accordions (specs / shipping / returns)

```css
details.acc summary {
  list-style: none;
  padding: 18px 0;
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid rgba(10,10,15,0.1);
  cursor: none;
}
details.acc summary::-webkit-details-marker { display: none; }
details.acc[open] summary .chev { transform: rotate(180deg); }
details.acc .chev { transition: transform .25s; }
details.acc:last-of-type { border-bottom: 1px solid rgba(10,10,15,0.1); }
details.acc .body {
  padding-bottom: 18px;
  font-size: 14px; color: rgba(10,10,15,0.7); line-height: 1.65;
}
```

Three accordions in this order:

1. **Detalles del producto** — open by default. Inside: a 2-column `.specs` table:
   ```css
   .specs { width: 100%; border-collapse: collapse; }
   .specs tr { border-top: 1px solid rgba(10,10,15,0.1); }
   .specs tr:last-child { border-bottom: 1px solid rgba(10,10,15,0.1); }
   .specs td { padding: 14px 0; vertical-align: top; font-size: 14px; }
   .specs td.k {
     font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em;
     text-transform: uppercase; color: rgba(10,10,15,0.55);
     width: 38%; padding-right: 16px;
   }
   ```
   Rows pulled from `product`:
   - `Tela` → `product.material || product.composition || '—'`
   - `Corte` → `product.fit || '—'`
   - `Lavado` → `product.care || '—'`
   - `Hecho en` → `product.origin || '—'`
   - `Incluye` → `product.includes || product.name`

   Owner may need to extend the data model with these fields. For products that don't have them, render only the rows with values.

2. **Envío y entrega** — copy: `Envío gratis en compras +$1,499 MXN — todo México. Entrega en 2-3 días hábiles vía Estafeta/DHL. Recoger en tienda sin costo: lo apartamos por 48 horas en Colima Centro o Villa de Álvarez.`

3. **Cambios y devoluciones** — copy: `Cambios sin preguntas dentro de los primeros 15 días — con etiqueta y sin uso. Si no te quedó la talla, te la cambiamos por tu cuenta o pasas por la tienda. Escríbenos por WhatsApp.`

### Curator note (mt-8)

Bordered card `border border-ink/10 rounded-lg p-5`:
- Eyebrow: mono 10px tracking-[0.28em] uppercase ink/55 — `Nota del curador`
- Quote (Manrope 500 16px leading-snug tracking -0.01em) — content per-product, from `product.curatorNote`. Fallback: skip the entire card if no note.
- Attribution: mono 10px tracking-[0.24em] uppercase ink/55 — `— Equipo G&L`

---

## §5 — Pairs well with (recommended)

Replaces the existing recommended section. Identical visual vocabulary to the catalog grid.

- Container: `bg-fog py-20 lg:py-28`
- Heading row (`flex items-end justify-between mb-10`):
  - Left:
    - Eyebrow: mono 11px tracking-[0.28em] uppercase ink/60 mb-4 — `§ — Combina con`
    - H2 (Manrope 800, `clamp(40px, 6vw, 80px)`, leading 0.88, tracking -0.04em):
      > Va perfecta<br/>con <span class="text-brand">esto</span>.
  - Right (desktop only): `<a href="/catalog" class="ul-link text-[13px] font-semibold pb-2">Ver catálogo →</a>`
- Grid: 2 cols mobile / 4 cols desktop, `gap-x-4 gap-y-12`

Card (`recommendedCard` rewrite):
- `<a href="/producto/${p.id}" class="group block">`
- Image: aspect 4/5 rounded-md overflow-hidden bg-paper (or bg-paper + object-contain for perfumes via existing `imageFitClass` logic). On group-hover, `scale-105` 700ms.
- Top-right ordinal pill: `position: absolute top-3 right-3`, mono 10px tracking-[0.2em] uppercase, `bg-paper/85 backdrop-blur px-2 py-1 rounded-full`, content `01`, `02`, …
- Below (mt-4 flex items-start justify-between gap-2):
  - Left:
    - Eyebrow (mono 10px tracking-[0.22em] uppercase ink/55 mb-1) — `p.type`
    - Name (Manrope 700, 16px, leading-tight, tracking -0.02em, truncate)
  - Right (text-right whitespace-nowrap):
    - If discounted: small line-through mono 11px ink/40
    - Price mono 14px font-semibold (text-brand if discounted)
- Quick-add: optional. The current `recommendedCard` has a `[data-quick-add]` button — drop it in the new card or move it as a hover overlay (matches the catalog editorial card). For v1, drop it from the recommended row and rely on the card click → PDP nav.

---

## §6 — Reviews

- `py-20 lg:py-28`
- Inside `max-w-[1440px] mx-auto px-6 lg:px-10`:
- Grid 12 cols gap-8

**Left col-span-4** (summary):
- Eyebrow: mono 11px tracking-[0.28em] uppercase ink/60 mb-4 — `§ — Reseñas`
- Big number: Manrope 800, `clamp(40px, 6vw, 80px)`, tracking -0.04em — `<span class="text-brand">{avg}</span><span class="text-ink/30">/5</span>`
- Star row: 5 stars at 20px, filled per `Math.round(avg)`, rest ink/30
- Summary paragraph (14px ink/65 max-w-sm): `Promedio de {count} reseñas verificadas. Lo que más mencionan: <strong class="text-ink">{topic1}</strong>, <strong class="text-ink">{topic2}</strong> y <strong class="text-ink">{topic3}</strong>.`
- CTA button (mt-7): pill `bg-ink text-paper px-6 h-12 rounded-full text-[13px] font-semibold hover:bg-brand`, label `Escribir reseña →`. Either open a review modal or scroll to a form. Out of scope for v1; the button can be a placeholder.

**Right col-span-8** (quotes):
- Grid 1 col mobile / 2 cols desktop, `gap-x-8 gap-y-10`
- Each quote:
  - Star row (text-[14px], 5 spans; filled stars solid, unfilled `text-ink/30`)
  - Quote (Manrope 500 20px leading-snug tracking -0.02em) — wrapped in `"…"`
  - Attribution (mono 10px tracking-[0.22em] uppercase ink/55) — `{name}. · {location} · {date}`
- Show 4 quotes max. Pull from product reviews if the data model has them; otherwise the section is hidden (don't fake reviews).

---

## §7 — Mobile sticky CTA

Only on `<md`. Pinned to the bottom of the viewport:

```css
.mobile-cta { display: none; }
@media (max-width: 767px) {
  .mobile-cta {
    display: flex;
    position: sticky; bottom: 0; z-index: 30;
    background: var(--color-paper);
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom)) 16px;
    border-top: 1px solid rgba(10,10,15,0.08);
    gap: 10px;
    align-items: center;
    box-shadow: 0 -8px 24px rgba(10,10,15,0.06);
  }
}
```

Layout:
- Left (flex-1):
  - Mono 10px tracking-[0.2em] uppercase ink/55 — `Total · talla {size || '—'}`
  - Manrope 800 22px leading-none tracking -0.03em digit-tabular text-brand — `formatMoney(price)`
- Right: pill `bg-ink text-paper h-14 px-7 rounded-full text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-40` — label `Agregar →`. Wire to the same handler as the desktop add button. Disabled until a size is selected.

---

## Interactions & Behavior

### Gallery
- Click stage (not on a button) → toggle `.zoomed` class on `.gallery-stage`. Cursor swaps to zoom mode.
- Prev/Next buttons + ←/→ keys.
- Click thumb → `go(idx)`.
- Counter updates immediately. Optional polish: preload next/previous image on `idx` change.

### Color
- Click swatch-btn → set active, update `Color · {name}`, update payload.

### Size
- Click size-pill (skip if `.disabled`) → set active, update `Talla · {size} · quedan {n}`, enable add button, update mobile-cta size.

### Add to cart
- Disabled when sizes exist but none selected. Click → `addToCart({ productId, size, color, qty: 1 })` + 1.8s checkmark feedback + restore. If sizes are required and none selected after restore, re-disable.

### Share
- `navigator.share` if available → fallback to clipboard write + showToast `'Enlace copiado al portapapeles'`.

### Quick-add from recommended
- `[data-quick-add]` if you keep it on the recommended cards. Otherwise omit and rely on full-card nav.

### Accordions
- Use `<details>` semantics; `[open]` rotates the chevron.

### Reveal on scroll
- Gallery, info column, "Combina con", reviews — all wrapped in `.reveal`. Same IntersectionObserver pattern as home.

### Cursor follower
- Inherited. After every dynamic re-render (gallery thumbs, swatch click), call `bindCursor()` to re-bind cursor-hover. Cursor-zoom toggle handled by the stage click.

---

## Design Tokens

All tokens inherited from home redesign. No new tokens.

### PDP-specific utilities (add to `src/style.css`)

```css
.gallery-stage { position: relative; aspect-ratio: 4 / 5; overflow: hidden; background: var(--color-fog); border-radius: 8px; }
.gallery-stage img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s cubic-bezier(.22,.61,.36,1); }
.gallery-stage.zoomed img { transform: scale(1.6); }

.thumb-rail { display: flex; gap: 10px; }
.thumb-rail .thumb { position: relative; width: 92px; aspect-ratio: 4/5; border-radius: 6px; overflow: hidden; flex-shrink: 0; border: 1px solid rgba(10,10,15,0.1); transition: border-color .25s, transform .25s; }
.thumb-rail .thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-rail .thumb.active { border-color: var(--color-ink); }
.thumb-rail .thumb:hover { transform: translateY(-2px); border-color: var(--color-ink); }
.thumb-rail .thumb .idx { position: absolute; top: 6px; left: 6px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; color: white; background: rgba(10,10,15,0.5); backdrop-filter: blur(4px); padding: 2px 5px; border-radius: 2px; }

.size-pill { min-width: 56px; height: 44px; padding: 0 14px; border-radius: 9999px; border: 1px solid rgba(10,10,15,0.15); background: white; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.04em; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.size-pill:hover { border-color: var(--color-ink); }
.size-pill.active { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
.size-pill.disabled { opacity: 0.35; text-decoration: line-through; cursor: not-allowed; }
.size-pill .stock-dot { width: 5px; height: 5px; border-radius: 50%; }

.swatch-btn { display: inline-flex; align-items: center; gap: 10px; padding: 6px 14px 6px 6px; border-radius: 9999px; border: 1px solid rgba(10,10,15,0.15); background: white; transition: all .2s; }
.swatch-btn:hover { border-color: var(--color-ink); }
.swatch-btn.active { border-color: var(--color-ink); background: var(--color-ink); color: var(--color-paper); }
.swatch-btn .swatch-chip { width: 28px; height: 28px; border-radius: 9999px; border: 2px solid rgba(255,255,255,0.85); box-shadow: 0 0 0 1px rgba(10,10,15,0.15); }
.swatch-btn.active .swatch-chip { box-shadow: 0 0 0 1px rgba(255,255,255,0.3); }
.swatch-btn .name { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }

.specs { width: 100%; border-collapse: collapse; }
.specs tr { border-top: 1px solid rgba(10,10,15,0.1); }
.specs tr:last-child { border-bottom: 1px solid rgba(10,10,15,0.1); }
.specs td { padding: 14px 0; vertical-align: top; font-size: 14px; }
.specs td.k { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(10,10,15,0.55); width: 38%; padding-right: 16px; }

details.acc summary { list-style: none; padding: 18px 0; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(10,10,15,0.1); }
details.acc summary::-webkit-details-marker { display: none; }
details.acc[open] summary .chev { transform: rotate(180deg); }
details.acc .chev { transition: transform .25s; }
details.acc:last-of-type { border-bottom: 1px solid rgba(10,10,15,0.1); }
details.acc .body { padding-bottom: 18px; font-size: 14px; color: rgba(10,10,15,0.7); line-height: 1.65; }

.mobile-cta { display: none; }
@media (max-width: 767px) {
  .mobile-cta { display: flex; position: sticky; bottom: 0; z-index: 30; background: var(--color-paper); padding: 12px 16px calc(12px + env(safe-area-inset-bottom)) 16px; border-top: 1px solid rgba(10,10,15,0.08); gap: 10px; align-items: center; box-shadow: 0 -8px 24px rgba(10,10,15,0.06); }
}

body.cursor-zoom .cursor-ring { width: 64px; height: 64px; background: transparent; mix-blend-mode: difference; border-color: var(--color-paper); }
body.cursor-zoom .cursor-dot { width: 0; height: 0; }
```

### Type scale (PDP-specific applications)

| Use | Family | Weight | Size | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| H1 (product name) | Manrope | 800 | clamp(36px, 5vw, 72px) | -0.04em | 0.92 |
| Price | Manrope | 800 | 56px | -0.04em | 1 |
| Original price | JetBrains Mono | 400 | 16px | 0 | 1 |
| Eyebrow | JetBrains Mono | 400 | 10–11px | 0.20–0.28em uppercase | 1 |
| Section H2 ("Combina con", reviews) | Manrope | 800 | clamp(40px, 6vw, 80px) | -0.04em | 0.88 |
| Review average | Manrope | 800 | clamp(40px, 6vw, 80px) | -0.04em | 1 |
| Review quote | Manrope | 500 | 20px | -0.02em | snug |
| Accordion title | Manrope | 700 | 15px | -0.02em | 1 |
| Specs key | JetBrains Mono | 400 | 11px | 0.22em uppercase | 1 |
| Specs value | Inter | 400 | 14px | 0 | 1.5 |
| Size pill | JetBrains Mono | 400 | 12px | 0.04em | 1 |
| Swatch name | JetBrains Mono | 400 | 11px | 0.12em uppercase | 1 |
| Curator note quote | Manrope | 500 | 16px | -0.01em | snug |
| Mobile-cta price | Manrope | 800 | 22px | -0.03em | 1 |

### Spacing

- Container max-width: `1440px`
- Container padding: `px-6 lg:px-10`
- Breadcrumb strip: `pt-6 pb-2`
- Product grid vertical: `py-8 lg:py-14`
- Grid column gap: `gap-8 lg:gap-14`
- "Combina con" vertical: `py-20 lg:py-28`
- Reviews vertical: `py-20 lg:py-28`
- Inter-block spacing inside info column: 6–8 (mb-5/mb-6/mb-7/mb-8)

### Border radius

- Gallery stage, info accordion cards: `rounded-lg` (8px)
- Thumbs, recommended cards: `rounded-md` (6px)
- Pills, swatches, CTAs: `rounded-full`
- Trust strip outer: `rounded-lg`

### Shadows

- No card shadows. Mobile-cta uses `0 -8px 24px rgba(10,10,15,0.06)` to lift off the page.

---

## State management

No new state. Reuse:
- `state.products` from `getState()` (passed in as `initialState`)
- `product` derived from path param
- `trackProductView(product.id)`, `addToCart({ productId, size, color, qty })`, `getProductById(id)` for related lookups
- `getRecommendedProducts(product, state.products, 4)` — existing
- `isPerfumeCategory(product.type)` — existing

Local component state:
- `idx` — current gallery image index
- `selectedSize` — string or null
- `selectedColor` — string (defaults to `product.colors[0]`)
- `zoomed` — bool (driven via `.zoomed` class on stage)

---

## Assets

The reference uses Unsplash placeholder URLs. In production:
- Gallery: `product.images` (an array). Each entry can be a string URL or an object `{ url, caption }` if the data model supports captions.
- Recommended thumbs: `p.images[0]` per product.
- Color chip hex: from `product.colorSwatches` if extended, or from a name→hex map.

The owner may want to extend the product data model to include:
- `caption` per gallery image (for the bottom-left pill in the stage)
- `colorSwatches: [{ name, hex }]` instead of plain `colors: [string]`
- `material`, `fit`, `care`, `origin`, `includes` for the specs table
- `curatorNote` for the bordered card
- `reviews: [{ name, location, date, stars, quote }]` for the reviews section

If any of these are missing, render the section/row only when data is available — never fake content.

---

## Implementation order (suggested)

1. **Verify dependencies**: home + catalog redesigns are merged. Tokens, fonts, marquee, header, cursor, and shared utilities (`outline-text`, `ul-link`, `arrow-walk`) are present.
2. **PDP-specific utilities**: add `.gallery-stage`, `.thumb-rail`, `.size-pill`, `.swatch-btn`, `.specs`, `details.acc`, `.mobile-cta`, `body.cursor-zoom` to `src/style.css`.
3. **Drop `hideHeaderOnMobile: true`** in the returned object — the new design keeps the header always visible.
4. **Breadcrumb strip**: new section above the grid.
5. **Gallery**: build the stage + thumb rail. Wire `idx` state, prev/next/keyboard, thumb click, click-to-zoom toggle (`.zoomed` + `body.cursor-zoom`).
6. **Info column**: name + price + tags + color picker + size picker + CTAs + trust strip + accordions + curator note. Keep all existing `data-*` hooks intact (`#qv-add-to-cart`, etc.) so the addToCart handler runs the same way.
7. **Replace `recommendedCard`**: editorial card matching catalog. Same `getRecommendedProducts` logic. Drop or move quick-add hover overlay.
8. **Reviews section**: hardcoded fallback or wire to `product.reviews` if data model supports.
9. **Mobile sticky CTA**: bottom pill stripe, shares state with the desktop add button.
10. **Cursor binding**: re-bind after every dynamic re-render (thumb click, swatch click, size click).
11. **Mobile**: verify breadcrumb wraps cleanly, gallery resizes, info column stacks below, accordions remain functional, sticky CTA appears.
12. **Perfume override**: test with a perfume product — stage should be `object-contain` on white, recommended cards should also use `object-contain`.
13. **404**: redesigned not-found state with outline-text + CTA.

---

## Files

- `v2-bold-product-reference.html` — full standalone reference. Open in browser and inspect element-by-element while building.
- This `README.md` — the implementation brief.

### Companion handoffs

- **Dependency**: `design_handoff_home_redesign/` — provides tokens, fonts, layout shell, marquee, cursor.
- **Companion**: `design_handoff_catalog_redesign/` — visual vocabulary for the editorial card. The PDP recommended row mirrors that card pattern.
- **Companion**: `design_handoff_cart_redesign/` — "Agregar a la bolsa" CTA from PDP lands on `/cart`. Trust strip vocabulary is shared.
- **Companion**: `design_handoff_checkout_redesign/` — choice-card patterns are similar to size pills/swatch pills but distinct components.
