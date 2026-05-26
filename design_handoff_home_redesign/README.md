# Handoff: G&L Home Redesign — "Bold Modern" v2

## Overview

This handoff bundles the approved redesign for the G&L home page (route `/` → `src/pages/home.js`). It replaces the current home layout with a more editorial, type-driven direction that better fits G&L's positioning as a **curated men's boutique in Colima with 31 years of heritage** (1995→present).

**The bundled file `v2-bold-reference.html` is a design reference, not production code.** It was built standalone with Tailwind CDN + vanilla JS purely to communicate look, feel, layout, motion, and copy. Your job is to **recreate this design inside the existing G&L codebase** (Vite + Vanilla JS modules + Tailwind v4 + Supabase) using the project's existing patterns: `pageX()` functions that return `{ title, html, onMount }`, template literals for markup, and existing helpers from `src/app/` and `src/components/`.

Do **not** copy the HTML wholesale into `home.js`. Adapt it to fit:
- Tailwind v4 (the reference uses Tailwind 3 via CDN — class names mostly transfer but verify)
- The existing module system, state (`getState`, `subscribeNewsletter`, `getMostViewedProducts`, etc.), and SPA router (`navigate`)
- The light/dark theme system (`state.theme` from `store.js`)
- The brand tokens already defined in `src/style.css` (`--color-brand`, `--font-heading`, `--font-body`)

## Fidelity

**High-fidelity.** Final colors, spacing, typography, copy, and interactions are settled. Recreate pixel-perfectly. Where Tailwind v4 differs from v3 syntax, prefer the v4 equivalent over verbatim class copying.

---

## Target codebase context

| Concern | Location | Notes |
|---|---|---|
| Home page entry | `src/pages/home.js` | Replace contents but keep the exported `pageHome()` signature: `{ title, html, onMount }` |
| Product cards in home | `src/pages/homeCards.js` | **Replace `featuredProductCard`** with the new list-style row (see §4 — Best Sellers). `homeSkeletonCard` is still useful. Old `testimonialsSection` is no longer used — delete or leave dead-code. |
| Static data | `src/pages/homeData.js` | `testimonials` no longer used. `heroSlides` should be rewritten with the new 3-slide content (see §2). |
| Brand constants | `src/app/config.js` | Update `BRAND.tagline` to: `'Boutique de moda masculina en Colima. Curado desde 1995.'` |
| Global styles + tokens | `src/style.css` | Brand tokens are already there. Add new tokens (see §10 — Design Tokens). Add new fonts (Manrope already there, JetBrains Mono is new). |
| Layout shell | `src/components/layout.js` | **Update header nav**: keep only `Tienda / Sucursales / Contacto`. Add `cursor: none` body class on the home route only (see §6 — Cursor). |
| Routing | `src/app/router.js` + `views.js` | No new routes. |
| Newsletter logic | `src/app/store.js` → `subscribeNewsletter`, `isSubscribedNewsletter` | Reuse as-is. Wire the new newsletter form (see §7) to the same handler with same loading/success/error states. |
| Coupon copy | Hardcoded "WELCOME10" | Keep the same string + clipboard copy behavior. |
| Index | `index.html` | Add Google Fonts link for `JetBrains Mono` weights 400/500. Manrope is already loaded. |

### Files to read in the existing codebase before starting

1. `src/pages/home.js` — current implementation, to know what you are replacing
2. `src/pages/homeCards.js` — for `featuredProductCard` and skeleton patterns
3. `src/app/store.js` — for `getState`, `getMostViewedProducts`, `subscribeNewsletter`, `addToCart`
4. `src/app/router.js` + `src/app/dom.js` — for `navigate`, `on`, `qs`
5. `src/components/layout.js` — header + footer structure (header needs updating per above)
6. `src/style.css` — existing tokens + animation utilities

---

## Sections (top → bottom)

The new home has these sections in order. **Bold = new or restructured. Italic = removed from old home.**

1. Marquee announcement bar (replaces single-line free-shipping banner) — **new**
2. Header — **trimmed to 3 nav items** (Tienda, Sucursales, Contacto)
3. **Hero — split editorial carousel** (3 slides, big type left + image right)
4. **Stats band** (4 big numbers on black) — **new**
5. **Categories — asymmetric 12-col grid** (replaces the symmetrical 2×2)
6. **Best Sellers — editorial list view** (replaces the 4-up product grid)
7. **Manifesto block** (full-bleed brand-blue, big editorial paragraph) — **new**
8. **Newsletter** — restyled on solid black
9. **Sucursales** — restyled as 2 cards with restored real hours
10. **Footer** with marquee — restyled
11. *~~Trust icons (4 circles)~~* — removed (info merged into stats band + marquee)
12. *~~Testimonials section~~* — removed (4.9★ stat covers it)
13. *~~Recent arrivals separate section~~* — removed (best sellers is the only product carousel)
14. *~~Promo banner with WELCOME10~~* — removed (offer is now slide 3 of hero)

---

## §1 — Marquee announcement bar

- Full width, `bg-ink` (#0A0A0F), text `paper` (#FFFFFF)
- Single line, horizontally scrolling left→right via CSS keyframe `scroll-x` (38s duration)
- Font: `JetBrains Mono`, 11px, `letter-spacing: 0.22em`, uppercase
- Border-bottom: `1px solid rgba(255,255,255,0.10)`
- Items (separated by `—`):
  - `★ Envío gratis +$1,499 MXN`
  - `Nueva temporada 2026`
  - `Cierre por WhatsApp en minutos`
  - `2 tiendas físicas en Colima`
  - `Use WELCOME10 · 10% off 1ª compra`
- Duplicate the items so the seamless loop works (`translateX(0)` → `translateX(-50%)`)
- Replaces the existing `<div class="bg-brand text-white text-center py-2 px-4">…</div>` shipping banner in `layout.js`. Keep `BRAND.freeShippingMin` interpolation.

## §2 — Header

Update `layout.js` `layoutPublic` nav:

- Logo: `font-family: Manrope`, `font-weight: 800`, `font-size: 28px`, `letter-spacing: -0.02em`. Render as text `G&L.` with the `&` and the final `.` colored `var(--color-brand)`. **Do not use the `/logo.png` image** for this redesign — the typographic mark is the new identity. (Keep the file for favicon / OG / PWA.)
- Nav items (3, hidden on mobile, `gap-8`, 14px medium):
  - `Tienda` → `/catalog`
  - `Sucursales` → `#sucursales` (anchor link to section)
  - `Contacto` → `https://wa.me/${BRAND.whatsapp}`
- Right side:
  - Search button: pill, `bg-fog` (#F2F1ED), 40px tall, icon + label "Buscar". On hover → `bg-ink text-paper`.
  - Bolsa pill: `bg-ink text-paper`, 40px tall, with a small brand-blue badge for `cartCount`. On hover → `bg-brand`.
- Free-shipping single-line banner is gone (replaced by marquee §1).
- Mobile bottom nav (`md:hidden`): keep current structure.

## §3 — Hero (split editorial carousel)

**Layout** (12-col grid, `max-w-[1440px] mx-auto`, padding `px-6 lg:px-10`, `pt-10 lg:pt-14 pb-16 lg:pb-20`):

- Left: `col-span-12 lg:col-span-7`
- Right: `col-span-12 lg:col-span-5`

**Left column — headline carousel** (3 slides, fades crossfade-style):

Top eyebrow row, before headline:
```
<span class="font-mono text-[11px] tracking-[0.28em] uppercase">Vol.03 — O/I '26</span>
<span class="h-px flex-1 bg-ink/15"></span>
<span class="font-mono text-[11px] tracking-[0.28em] uppercase">Colima · Mx</span>
```

Slide content uses absolute-positioned divs over a `min-height: 540px` container, only `.active` is opacity:1. 1.2s opacity transition.

**Slide 1 — Brand**
- H1 (font-family Manrope, weight 800, size `clamp(72px, 11vw, 184px)`, leading 0.86, letter-spacing -0.04em):
  - `Tu fit,`
  - `<span class="text-brand">perfecto.</span>` (on new line)
- Body (17px, ink/70, max-width 460px):
  - "Para el hombre que sabe lo que se pone. Las mejores marcas en camisas, denim y fragancias — curadas a mano, al mejor precio."
- CTAs:
  - Primary: rounded-full pill (h-14, px-7), `bg-ink text-paper`, hover `bg-brand`, label "Comprar colección" + arrow icon (`arrow-walk` animates on hover) → links to `/catalog`
  - Secondary: text link with `ul-link` underline animation, "Ver lookbook" (links to `/catalog` for now — they don't have a lookbook page yet)

**Slide 2 — Denim**
- H1:
  - `Denim`
  - `<span class="outline-text">honesto.</span>` (outline text = `-webkit-text-stroke: 1px currentColor; color: transparent`)
- Body:
  - "Jeans crudos y lavados que se mejoran con el uso. Denims premium para todo tipo de ocasiones — cortes slim, straight y relaxed."
- CTAs: "Ver denim" → `/categoria/Pantalones`, "Guía de tallas" (modal trigger, can be no-op for now)

**Slide 3 — Promo**
- H1:
  - `−10<span class="text-brand">%</span>`
  - `1ª compra.`
- Body:
  - 'Aplica `WELCOME10` en checkout. Válido para clientes nuevos en cualquier categoría.' — the `WELCOME10` is a `<span>` with `bg-fog`, `font-mono`, `rounded-md`, `px-2 py-1`.
- CTAs:
  - Primary: "Copiar código" — on click, `navigator.clipboard.writeText('WELCOME10')`, swap label to "¡Copiado!" + checkmark for 1.8s. `bg-brand text-paper`, hover `bg-ink`.
  - Secondary: "Términos" (no-op modal for now)

**Slide ticker (below carousel)**:
- Left: `01 ▬▬▬▬▬ 03` — current slide number (tabular nums) + 160px progress bar + total. Progress bar fills via `transform: scaleX(0) → scaleX(1)` over 6 seconds, resets on slide change.
- Right: prev / next round buttons (44px, border `ink/15`, hover `bg-ink text-paper`)
- Autorotate every 6 seconds. Pause on hover over hero (optional polish).

**Right column — image carousel** (synced to left):

- Aspect `4/5`, `bg-fog`, `rounded-md`, `overflow-hidden`
- 3 images, same crossfade timing as left:
  1. Look 01 — camisa hueso (use a real product photo from `homeData.heroSlides[0].image` or a placeholder from `/public/heroeGL.jpg`)
  2. Look 02 — jean crudo (use a denim photo, can be `/public/heroeGL.jpg`)
  3. Oferta WELCOME10 (use `/public/bannergl.webp`)
- Each slide has a small caption pill at bottom-left:
  - Slide 1: `bg-ink/40 backdrop-blur` → "Look 01 — Camisa hueso"
  - Slide 2: same → "Look 02 — Jean crudo"
  - Slide 3: `bg-brand` solid → "Oferta · WELCOME10"

**Floating "Más vendido" card** (decorative, only `lg+`):
- Absolute, `-bottom-8 -left-8`, white card `220px` wide, border `ink/10`, `shadow-xl`, `rounded-lg`, padding 4
- Pull the actual #1 most-viewed product from `getMostViewedProducts(1)[0]` and render name + price + rating
- Layout: mono eyebrow "Más vendido" + brand-blue dot · then product name (Manrope 18px bold) · then row with price (mono, 13px) and rating "★ 4.9 (124)"

## §4 — Stats band

- `bg-ink text-paper`, `py-12`
- Grid 4 cols (2 on mobile), gap 6/8
- Each stat:
  - Big number: `font-family: Manrope`, weight 700, `font-size: 64px`, leading-none, `letter-spacing: -0.04em`, tabular nums
  - Caption below: `font-mono`, 11px, `letter-spacing: 0.24em`, uppercase, `opacity-60`
- Numbers (left → right):
  1. `31.` (with `.` in `text-brand`) — "Años curando · desde 1995"
  2. `2.4k` (the `k` is `text-brand`) — "Clientes activos"
  3. `4.9/5` (the `/5` is 36px, `opacity-40`) — "+500 reseñas"
  4. `02` — "Tiendas en Colima"

## §5 — Categories (asymmetric grid)

- `py-24 lg:py-32`, `max-w-[1440px] mx-auto`
- Heading row (flex items-end justify-between, `mb-14`):
  - Left:
    - Eyebrow: `§ 01 — Categorías` (mono 11px tracking-[0.28em] uppercase, ink/60)
    - H2: `Explora<br/>por <span class="text-brand">categoría</span>.` (Manrope 800, `clamp(56px, 8vw, 128px)`, leading 0.88, tracking -0.045em)
  - Right (hidden mobile): "Catálogo completo →" link with `ul-link` underline

- Grid: 12 cols, `grid-template-rows: 280px 280px` (inline style — Tailwind `grid-rows-2` collapses without explicit height), gap 4

- **4 tiles only** (don't add a 5th — it overflows the 2-row grid):
  1. **Camisas** (large, image): `col-span-8 row-span-2`. Photo bg, gradient overlay `from-ink/40 via-ink/0 to-ink/0` (top-right ish), text paper.
     - Top: pill `bg-paper text-ink rounded-full px-3 py-1.5` "01 · Esenciales" + mono "42 piezas" right-aligned
     - Bottom: eyebrow "Oxford · lino · franela" + H3 "Camisas →" (Manrope 800, `clamp(56px, 7vw, 120px)`)
  2. **Jeans** (medium, image): `col-span-4 row-span-1`. Photo bg, gradient `from-ink/35`, text paper.
     - Eyebrow "02 · Denim", H3 "Jeans" (40px), arrow "36 →"
  3. **Polos** (small, brand-blue solid): `col-span-2 row-span-1`. `bg-brand text-paper`, no image.
     - Eyebrow "03 · Pima", H3 "Polos" (34px), "28 piezas →"
  4. **Perfumes** (small, ink solid with bottle img): `col-span-2 row-span-1`. `bg-ink text-paper`. Image absolute right-bottom, width/height 3/4, `mix-blend-luminosity` `opacity-50`. `overflow-hidden` on the tile.
     - Eyebrow "04 · Fragancia", H3 "Perfumes" (28px), "18 →"

- All tiles link to `/categoria/<Name>` (Spanish names, matching existing routes: `Camisas`, `Pantalones`, `Polos`, `Perfumes`).
- Hover behavior (`.ct` class):
  - Image scales 1.08 over 1.1s
  - Label group translates `8px, -8px` over 0.5s

## §6 — Best Sellers (editorial list)

This is the most distinctive section — **the product grid becomes an editorial list**, with thumbnails that float in on hover.

- `bg-fog` (#F2F1ED), `py-24 lg:py-32`, `relative overflow-hidden`
- Ambient background: 2 marquee rows of giant text (`font-display 180px` Manrope 800, opacity 0.04), one scrolling reverse. Content: `BEST · SELLERS · FAVORITOS · 2026`
- Header row (grid 12 cols, items-end):
  - Left col-span-7: eyebrow "§ 02 — Favoritos" + H2 `Lo que más se <span class="text-brand italic">llevan</span>.` (Manrope 800, `clamp(56px, 8vw, 128px)`)
  - Right col-span-5 (md:text-right): paragraph "Productos elegidos por nuestros clientes esta temporada. Pasa el cursor sobre cada uno."

- List (`<ul>`), populated from `getMostViewedProducts(6)`. Each `<li class="ls-row relative">`:
  - Grid 12 cols, items-center, gap 4, `py-6 px-3`
  - Border-bottom 1px `#EAE9E4`
  - Hover: `bg-color: #FAFAF7`
  - Cells:
    - `col-span-1`: rank `01`–`06` (mono 12px, ink/50)
    - `col-span-10 md:col-span-6`: product name (Manrope 700, `clamp(24px, 2.5vw, 40px)`, tracking -0.03em, leading-tight). On row hover → color: `var(--color-brand)` + `transform: translateX(8px)` (transition .35s).
    - `hidden md:block col-span-3`: category description (mono 12px ink/55 uppercase tracking-wider). Use `p.type` + a short descriptor — e.g. "Camisas · Lino italiano".
    - `col-span-1 md:col-span-2 text-right`: price (mono 15px semibold). If `p.originalPrice`, prepend `<span class="text-ink/40 line-through font-normal text-[12px] mr-1">$X</span>`.
  - Floating thumb (`<img class="thumb ...">`): absolute, `width: 220px`, `height: 280px`, `object-fit: cover`, `rounded-md`, `shadow-2xl`, positioned `right: 18%; top: -120px`. Initially `opacity: 0; transform: translateY(20px) scale(0.95)`. On row hover → `opacity: 1; transform: translateY(0) scale(1)`. Transition opacity .4s, transform .55s `cubic-bezier(.22,.61,.36,1)`. **Important: row needs `position: relative` and `z-index` so the thumb can spill outside.** Use the first image from `p.images`.

- Bottom row: link "Ver los 124 productos →" + mono caption "06 productos · vista lista" (use actual list length).

## §7 — Manifesto

- `bg-brand text-paper` (solid #214fc7), `py-28 lg:py-40`
- Grid 12 cols
  - Left col-span-3: two mono lines, `tracking-[0.32em] uppercase opacity-70`:
    - "§ 03 — Manifiesto"
    - "G&L / 2026"
  - Right col-span-9: paragraph (Manrope 500, `clamp(28px, 3.6vw, 52px)`, leading 1.1, tracking -0.03em):
    > "No llenamos el clóset. Curamos. Cada temporada elegimos a mano las mejores marcas — la camisa que se pone una y otra vez, los jeans que solo se ven mejor con el tiempo, la fragancia que la gente te pregunta. **[opacity-70:]** Marcas seleccionadas, al mejor precio. En Colima desde 1995."
  - Below: text-link "Cómo escogemos cada pieza →" (`ul-link` style)

## §8 — Newsletter

- `bg-ink text-paper`, `py-24 lg:py-32`
- Grid 12 cols items-end gap-10
  - Left col-span-7:
    - Eyebrow: "§ 04 — Club G&L"
    - H2 multi-line (Manrope 800, `clamp(56px, 8vw, 124px)`, leading 0.86):
      - `Un correo`
      - `al mes.`
      - `<span class="outline-text">10% off</span>` (outline text)
      - `<span class="text-brand">de bienvenida.</span>`
  - Right col-span-5:
    - Body: "Drops antes que nadie. Rebajas privadas. Cero spam. Pausar o cancelar con un click — siempre."
    - Form: `flex border-b border-paper/30` (focus-within → `border-paper`):
      - Input email, `bg-transparent`, 17px, padding 5/2, placeholder "tu@correo.com"
      - Submit button, font 13px bold, "Suscribirme →"
    - Below form: row with "+2,400 suscriptores" left, "WELCOME10 al instante" right (mono 11px tracking-[0.2em] uppercase opacity-60)
- Wire to existing `subscribeNewsletter(email)` from `store.js`. Reuse the existing success state UI pattern from current `home.js` lines 410-419 (translate to dark theme: green checkmark, "¡Suscripción exitosa!", "Gracias por unirte al Club G&L.").
- If `isSubscribedNewsletter()` returns true on mount, replace the form with the success state directly.

## §9 — Sucursales

- `py-24 lg:py-32`, light bg
- Heading: eyebrow "§ 05 — Visítanos" + H2 `Dos puntos<br/>en <span class="text-brand">Colima</span>.` (Manrope 800, `clamp(56px, 7vw, 112px)`, leading 0.88)
- Grid 2 cols gap-4
- Each store card:
  - `bg-fog`, `p-10`, `rounded-md`, `min-h-[340px]`, flex column justify-between
  - Hover: `bg-ink text-paper` (transition .35s on background-color + color)
  - Top row: eyebrow "Sucursal — 01" left, mono coords "19.2424 N · 103.7254 W" right (10px tracking-[0.24em] uppercase opacity-50)
  - H3 (Manrope 800, 56px, tracking -0.04em): `Centro` / `Villa`
  - Subtitle (mono 13px opacity-60 mb-6): `G&L Colima Centro` / `G&L Villa de Álvarez`
  - Address paragraph (15px max-w-sm opacity-90):
    - Centro: "Zaragoza #140, Col. Centro, Colima. A media cuadra del Jardín Libertad."
    - Villa: "María Ahumada de Gómez #30, Local #6. Sobre la avenida principal."
  - Bottom row: hours block left + "Cómo llegar →" link right (`ul-link`)
- **Real hours (from owner)**:
  - **Centro**: `Lun—Sáb · 10:30—14:00 · 16:30—20:00` and `Dom · 10:30—14:00`
  - **Villa**: `Lun—Sáb · 09:00—20:00` and `Dom · 10:30—14:00`
- Map links: reuse the existing Google Maps URLs from current `home.js` (lines 339 and 357).

Anchor: this section needs `id="sucursales"` for the header nav link.

## §10 — Footer

- `bg-ink text-paper`, relative overflow-hidden
- Top: scrolling marquee (`py-6`, border-bottom `paper/10`):
  - Big text (Manrope 800, 80px, leading-none, tracking -0.04em): `G&L → TU FIT, PERFECTO  ·  SHOP · LOOKBOOK · WHATSAPP` (duplicated for seamless loop)
  - The `·` separators in `text-brand`
  - Same `scroll-x` keyframe, 38s duration
- Below marquee, padding `pt-44 pb-12`:
  - Grid 12 cols gap-8
    - col-span-6: mono tagline "Tu fit, perfecto. Desde 1995." + paragraph: "Boutique de moda masculina en Colima, México. Las mejores marcas, curadas a mano, al mejor precio. Envío a todo el país y atención por WhatsApp."
    - col-span-2: "Tienda" list — Camisas, Polos, Jeans, Perfumes (4 `ul-link` items)
    - col-span-2: "Soporte" list — Envíos, Cambios, WhatsApp, FAQ
    - col-span-2: "Síguenos" — Instagram + WhatsApp circle icons (40px, border `paper/20`, hover white-fill / brand-fill respectively)
  - Bottom row (`mt-16 pt-8 border-t border-paper/10`): mono 12px opacity-60
    - Left: "© 2026 G&L · Colima, México"
    - Right: "Curado en Colima desde 1995"

---

## Cursor (new — applies to home page only)

Custom cursor with two elements: a small `8px` dot (instant follow) and a `36px` ring (eased follow, lerp factor 0.18 per frame).

```css
body.home { cursor: none; }
.cursor-dot { position: fixed; width: 8px; height: 8px; background: var(--ink); border-radius: 50%; mix-blend-mode: difference; pointer-events: none; z-index: 9999; transform: translate(-50%,-50%); }
.cursor-ring { position: fixed; width: 36px; height: 36px; border: 1px solid var(--ink); border-radius: 50%; mix-blend-mode: difference; pointer-events: none; z-index: 9998; transform: translate(-50%,-50%); transition: width .35s, height .35s; }
body.home.cursor-hover .cursor-dot { width: 0; height: 0; }
body.home.cursor-hover .cursor-ring { width: 80px; height: 80px; background: white; mix-blend-mode: normal; border-color: white; }
body.home.cursor-text .cursor-dot { width: 0; height: 0; }
body.home.cursor-text .cursor-ring { width: 4px; height: 28px; border-radius: 2px; }
```

JS in `onMount`:
1. Add the two cursor elements to the DOM (inside the page root).
2. `mousemove` updates dot position immediately and stores target for ring; `requestAnimationFrame` loop lerps ring toward target.
3. Add `cursor-hover` body class on `mouseenter` for every `a, button, [data-cursor-hover]` inside the page root, remove on `mouseleave`. Same for `cursor-text` on `input, textarea`.
4. On `pageHome` teardown (route change), remove the cursor elements and body classes, restore `cursor: auto`. **The SPA keep-alive may re-mount this page from cache** — make sure your init is idempotent (check if cursor already exists before adding).
5. Disable cursor entirely on touch devices: `if (window.matchMedia('(pointer: coarse)').matches) return;`

---

## Interactions & Behavior

### Hero carousel
- Autorotate every **6 seconds**.
- Crossfade slides via opacity (1.2s ease).
- Prev/next buttons: instant slide change, resets autorotate timer.
- Progress bar: `transform: scaleX(0)` → `scaleX(1)` over 6s linear, resets on every slide change.
- Pause on hover (recommended polish).

### Marquee
- Pure CSS keyframes, infinite. Pause on hover (recommended polish, `animation-play-state: paused`).

### Category tiles `.ct`
- Background image scales 1.0 → 1.08 over 1.1s `cubic-bezier(.22,.61,.36,1)` on hover.
- Label group translates 8px right + 8px up on hover (transition .5s same easing).

### Best sellers row `.ls-row`
- Background color transition .35s on hover.
- Product name color → brand-blue + `translateX(8px)` (transition .35s).
- Thumbnail fades + scales in (opacity .4s, transform .55s).

### Reveal on scroll
- All major sections wrapped in `.reveal` start `opacity: 0; transform: translateY(28px)`.
- `IntersectionObserver` threshold 0.1 → adds `.in` class → `opacity: 1; transform: translateY(0)`.
- Transition: opacity .9s ease, transform 1s `cubic-bezier(.22,.61,.36,1)`.

### Arrow walk
- Hovering CTA buttons → inner arrow `<span class="arrow-walk">` translates `translateX(4px)` (transition .35s).

### Newsletter form
- Empty → underlined input. Focus-within: border color jumps from `paper/30` to `paper`.
- Submit: reuse existing `subscribeNewsletter` async flow from current `home.js` (loading spinner, success state, error state). Translate to dark theme.

### Coupon copy (hero slide 3)
- Click → `navigator.clipboard.writeText('WELCOME10')`, label swap to "¡Copiado!" + checkmark, revert after 1.8s.

### Header anchor scroll
- Click "Sucursales" in header → smooth scroll to `#sucursales`. Use `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`. **The system instructions say never use scrollIntoView from the host page — but inside the home page it's fine because it doesn't affect SPA navigation.** If you prefer, use `window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' })`.

---

## Design Tokens

Add these to `src/style.css` `@theme` block:

```css
@theme {
  /* existing */
  --color-brand: #214fc7;
  --color-brand-light: #4169e1;
  --color-brand-dark: #003baf;

  /* new */
  --color-ink: #0A0A0F;
  --color-paper: #FFFFFF;
  --color-fog: #F2F1ED;
  --color-brand-tint: #E8EDF9;

  --font-display: 'Manrope', system-ui, sans-serif;  /* already there as font-heading */
  --font-body: 'Inter', system-ui, sans-serif;        /* already there */
  --font-mono: 'JetBrains Mono', ui-monospace, monospace; /* NEW */
}
```

### Colors used

| Token | Hex | Where |
|---|---|---|
| `--color-ink` | `#0A0A0F` | Body text, stats band, newsletter bg, footer bg, perfumes tile bg |
| `--color-paper` | `#FFFFFF` | Page bg, text on dark surfaces |
| `--color-fog` | `#F2F1ED` | Best sellers bg, sucursal cards, search pill |
| `--color-brand` | `#214fc7` | Polos tile, manifesto bg, accents, CTA hover |
| `--color-brand-tint` | `#E8EDF9` | Subtle blue tinted backgrounds (unused at the moment, available for future) |

### Type scale

| Use | Family | Weight | Size | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Hero H1 | Manrope | 800 | clamp(72px, 11vw, 184px) | -0.04em | 0.86 |
| Section H2 | Manrope | 800 | clamp(56px, 8vw, 128px) | -0.045em | 0.88 |
| Category big H3 | Manrope | 800 | clamp(56px, 7vw, 120px) | -0.04em | 1 |
| Best seller name | Manrope | 700 | clamp(24px, 2.5vw, 40px) | -0.03em | tight |
| Manifesto body | Manrope | 500 | clamp(28px, 3.6vw, 52px) | -0.03em | 1.1 |
| Stat number | Manrope | 700 | 64px | -0.04em | 1 |
| Body paragraph | Inter | 400 | 15–17px | 0 | 1.5 |
| Eyebrow / meta | JetBrains Mono | 400–500 | 10–11px | 0.22–0.32em uppercase | 1 |
| Footer marquee | Manrope | 800 | 80px | -0.04em | 1 |

### Spacing

- Container max-width: `1440px`
- Container padding: `px-6 lg:px-10`
- Section vertical: `py-24 lg:py-32` (default), `py-28 lg:py-40` (manifesto), `py-12` (stats), `py-20 lg:py-32` (hero)

### Border radius

- Pills: `rounded-full`
- Cards / tiles: `rounded-md` (~6px)
- Floating "Más vendido" card: `rounded-lg` (~8px)

### Shadows

- Floating card: `shadow-xl` (~tailwind default)
- Best seller thumbnail: `shadow-2xl`

### Animations (add to `style.css` if not present)

```css
@keyframes scroll-x { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.marquee-track { animation: scroll-x 38s linear infinite; }
.marquee-track-rev { animation: scroll-x 56s linear infinite reverse; }
```

The existing `animate-fade-in` and stagger keyframes can stay.

---

## Copy / content (final, approved by owner)

**Critical brand framing**: G&L is a **curator/boutique**, not a maker. In business since **1995** (31 years). Sells the best brands at the best prices.

- Tagline: "Tu fit, perfecto."
- Description: "Boutique de moda masculina en Colima. Las mejores marcas, curadas a mano, al mejor precio."
- Heritage: "Desde 1995" / "31 años curando"
- Hero subtitle (slide 1): "Para el hombre que sabe lo que se pone. Las mejores marcas en camisas, denim y fragancias — curadas a mano, al mejor precio."
- Denim subtitle (slide 2): "Jeans crudos y lavados que se mejoran con el uso. Denims premium para todo tipo de ocasiones — cortes slim, straight y relaxed."
- Manifesto: "No llenamos el clóset. Curamos. Cada temporada elegimos a mano las mejores marcas — la camisa que se pone una y otra vez, los jeans que solo se ven mejor con el tiempo, la fragancia que la gente te pregunta. Marcas seleccionadas, al mejor precio. En Colima desde 1995."

Update `BRAND.tagline` in `src/app/config.js` accordingly.

---

## Assets

The reference HTML uses Unsplash URLs for category and hero photography. **Before shipping**, replace with G&L's own photography:

- Hero slide 1 (right image): use `/heroeGL.jpg` or a new lifestyle photo
- Hero slide 2 (right image): denim photo (replace placeholder)
- Hero slide 3 (right image): promo / banner — `/bannergl.webp`
- Categories grid:
  - Camisas (big tile): a wardrobe / camisa lifestyle photo
  - Jeans: denim-rack photo (currently using `/heroeGL.jpg`-style photography)
  - Polos: no image (brand-blue solid tile, decorative)
  - Perfumes: a single perfume bottle photo (currently using Unsplash placeholder)
- Best sellers thumbnails: pulled from `p.images[0]` on each product

The store has photos in `public/`: `bannergl.webp`, `heroeGL.jpg`, `heroe_men.png`, `heroeGL_highres.png`. Use these for slides where possible; commission new photos for the rest.

The favicon, OG image, and PWA icons (`icon-192.png`, `icon-512.png`, `logo.png`) stay as-is. They are referenced from `index.html` and `manifest.json`.

---

## Implementation order (suggested)

1. **Tokens + fonts**: update `style.css` (add `--color-ink`, `--color-paper`, `--color-fog`, `--font-mono`) and `index.html` (add JetBrains Mono `<link>`). Verify Tailwind v4 picks up the new tokens.
2. **Layout shell**: update `src/components/layout.js` — replace shipping banner with marquee, trim header nav to 3, update logo to typographic mark.
3. **Hero**: rewrite `pageHome` start, build the split carousel with vanilla JS interval. Crossfade + progress bar + arrow nav + clipboard copy. Pull `getMostViewedProducts(1)[0]` for the floating card.
4. **Stats band** and **Categories**: static markup, no data wiring beyond category routes.
5. **Best Sellers list view**: replace `featuredProductCard` with a new `bestSellerRow(p, i)` in `homeCards.js`. Wire to `getMostViewedProducts(6)`. Add the floating thumbnail behavior.
6. **Manifesto + Newsletter**: static markup, wire newsletter form to `subscribeNewsletter` reusing existing async flow.
7. **Sucursales**: hardcode addresses + new hours from this doc, reuse map URLs.
8. **Footer**: rewrite with marquee top + 12-col bottom grid.
9. **Cursor follower**: add cursor elements + JS in `onMount`. Test on a touch device — should be disabled.
10. **Reveal on scroll**: add `.reveal` class + IntersectionObserver in `onMount`.
11. **Mobile**: verify all sections collapse cleanly to `col-span-12` and that big typography uses `clamp()` for fluid scaling. The reference is desktop-first; on mobile the big numbers should drop to ~64–72px naturally via clamp.

---

## Files

- `v2-bold-reference.html` — the full standalone design reference. Inspect to confirm any detail not covered above.
- This `README.md` — the implementation brief.

Open `v2-bold-reference.html` in a browser and walk through it section by section while building — that's the single source of truth for visual decisions.
