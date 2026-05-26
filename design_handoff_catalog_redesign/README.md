# Handoff: G&L Catalog Redesign — "Bold Editorial" v2

## Overview

This bundle covers the redesign of the G&L catalog/listing page (route `/catalog` → `src/pages/catalog.js` + sibling helpers under `src/pages/catalog*.js`). It applies the same **Bold Editorial** aesthetic already approved for the home page (`design_handoff_home_redesign`) to the catalog: large display typography, mono "section labels", custom cursor, pill-shaped chip filters, and editorial product cards with a hover-driven secondary image and quick view affordance.

**The bundled file `v2-bold-catalog-reference.html` is a design reference, not production code.** It was built standalone (Tailwind CDN + vanilla JS + hardcoded product data) purely to communicate look, feel, layout, motion, and copy. The task is to **recreate it inside the existing G&L codebase** (Vite + Vanilla JS modules + Tailwind v4 + Supabase) using the project's existing patterns — `pageX()` functions returning `{ title, html, onMount }`, template literals, and helpers from `src/app/` and `src/components/`.

Do **not** copy the HTML wholesale into `catalog.js`. Adapt it to:
- Tailwind v4 (the reference uses Tailwind 3 via CDN — class names mostly transfer, verify v4 deltas)
- The existing module system, state (`getState`, `searchProducts`, `setSearchQuery`, `getSearchQuery`, `cartCount`, `subscribe`, `trackProductView`, `applyFilters`, `uniqueSorted`), and SPA router (`navigate`)
- The light/dark theme system (`state.theme`)
- Brand tokens already defined in `src/style.css` (`--color-brand`, `--font-heading`, `--font-body`) plus the new tokens introduced by the home redesign (`--color-ink`, `--color-paper`, `--color-fog`, `--font-mono`). If the home redesign hasn't shipped yet, ship those tokens first.

## Fidelity

**High-fidelity.** Final colors, spacing, typography, copy, and interactions are settled. Recreate pixel-perfectly. Where Tailwind v4 differs from v3 syntax, prefer the v4 equivalent over verbatim class copying.

---

## Target codebase context

| Concern | Location | Notes |
|---|---|---|
| Catalog page entry | `src/pages/catalog.js` | Replace contents but keep the exported `pageCatalog(initialState)` signature: `{ title, html, onMount }`. Keep `noPaddingTop: true` if relevant. |
| Product card markup | `src/pages/catalogCard.js` → `productCard(p, idx)` + `skeletonGrid(n)` | **Replace `productCard`** with the new editorial card (see §4). `skeletonGrid` should be restyled to match the new card silhouette (aspect 4/5, mono caption row, swatch row). |
| Carousels inside cards | `src/pages/catalogCarousels.js` → `initCarousels` | Drop. The new card uses a single hover-swap to image 2 (no swipe carousel inside the card). Keep the function exported as a no-op or remove all `[data-carousel]` references. |
| Quick add / quick view | `src/pages/catalogQuickAdd.js` → `handleQuickAdd` + `src/pages/catalogModals.js` | Still needed. The "Vista rápida" overlay button replaces the existing `[data-quick-add]` button; wire it to `handleQuickAdd` the same way. The size-pill expansion inside the overlay (§4.5) is new — it can either expand inline on hover or open the existing quick-view modal. |
| Filters logic | `src/pages/catalogFilters.js` → `uniqueSorted`, `getFilterState`, `applyFilters` | Reuse as-is. The new UI is just a different shell around the same `getFilterState(root)` contract. |
| Static data flow | `src/app/store.js` | Reuse `searchProducts`, `setSearchQuery`, `getSearchQuery`, `subscribe`. The `publicProducts` filter (`badge !== 'Borrador'`) stays. |
| Brand constants | `src/app/config.js` | No changes needed for this redesign. |
| Global styles + tokens | `src/style.css` | Add catalog-specific utilities (see §10). Tokens introduced by the home redesign are required dependencies. |
| Layout shell | `src/components/layout.js` | No changes (assumes home redesign already shipped the new header + marquee). The catalog hero pushes the existing sticky header down by 72px; the new sticky toolbar sits at `top-[72px]`. |
| Routing | `src/app/router.js` + `views.js` | No new routes. Existing `/catalog` and `/categoria/:type` are reused. |
| Index | `index.html` | No new fonts (Manrope + Inter + JetBrains Mono already loaded by the home redesign). |

### Files to read in the existing codebase before starting

1. `src/pages/catalog.js` — current implementation, to know what you are replacing and which behaviors must survive (URL sync for `/categoria/:type`, sessionStorage scroll/filter restore, infinite "Cargar más" pagination, debounced typeahead, mobile bottom sheet, etc.)
2. `src/pages/catalogCard.js` — current `productCard` and `skeletonGrid`
3. `src/pages/catalogFilters.js` — `uniqueSorted`, `getFilterState`, `applyFilters`
4. `src/pages/catalogQuickAdd.js` — `handleQuickAdd` and its expected DOM (`[data-quick-add]`, `[data-quickview]`)
5. `src/app/store.js` — `searchProducts`, `setSearchQuery`, `getSearchQuery`, `cartCount`, `subscribe`
6. `src/app/router.js` + `src/app/dom.js` — `navigate`, `on`, `qs`
7. `src/style.css` — existing tokens + animation utilities (especially `scroll-x` keyframe if home redesign shipped it)

---

## Critical existing behaviors that must survive

These are not visible in the design reference but are in the current `catalog.js` and must be preserved:

1. **URL sync**: Selecting a "Tipo" chip writes `/categoria/<encodedType>` to history via `window.history.replaceState`. Clearing the filter restores `/catalog`. The route param is also read on mount to apply the initial filter.
2. **Multi-type filter via `grid.dataset.multiTypeFilter`**: when arriving from a home category card that maps to multiple `type` values (e.g. "Playeras + Polos"), the catalog applies `filters.type = ''` and instead filters by the comma-separated list. Manual filter changes clear this.
3. **Pagination**: 20 products per page. "Cargar más" button appends, never replaces. Restore `currentPage` from sessionStorage on back-nav.
4. **Scroll + filter restoration**: `sessionStorage` key `gl_catalog_state`. Save on `a[href^="/producto/"]` clicks, restore on mount with a two-pass scroll (immediate + 350ms later for lazy images). Block re-renders during the restoration window via a `restoringState` guard.
5. **Search**: catalog-local search bar with 150ms debounce + as-you-type popup (top 5 results). Enter submits a full search. Esc dismisses. Click-outside dismisses. Suggestions popup `position: absolute` under the search field.
6. **Subscribe to store**: re-render on `subscribe(state => ...)` so admin product edits propagate live. **Block re-renders during scroll restoration.**
7. **Reset filters**: clears all selects + inputs + search query + URL slug, closes mobile sheet.
8. **Backward-compat deep links**: `?p=<id>` redirects to `/producto/<id>` via `navigate()`.
9. **Pending quickview from home**: `sessionStorage.gl_pending_quickview` auto-opens quick view on mount.
10. **Empty state**: with or without active search query. Search query gets a "Limpiar búsqueda" button. Use `escapeHtml` on the search query.

The new design reference shows the **visual** shell. All of the above wiring transfers unchanged.

---

## Sections (top → bottom)

The new catalog has these sections in order. **Bold = new or restructured. Italic = removed from old catalog.**

1. Marquee announcement bar — inherited from layout shell (home redesign)
2. Header — inherited from layout shell (home redesign)
3. **Hero header strip** — breadcrumb + giant H1 + meta line — **new**
4. **Sticky toolbar** — chip filters + sort + view toggle + result count — **restructured (replaces the old `#catalog-control-bar`)**
5. *~~Mobile bottom-sheet filter panel~~* — keep the existing component (`#filter-controls-mobile`) since the chips alone don't cover size/color/price; only restyle to match (see §5.5)
6. **Product grid** — editorial card with hover image swap + Vista rápida overlay
7. **"Cargar más" CTA** + mini pagination caption
8. **Editorial asesoría block** — brand-blue full-bleed paragraph + WhatsApp CTA — **new**
9. Footer — inherited from layout shell (home redesign)
10. *~~Floating "Ver carrito" pill~~* — removed; the header's "Bolsa" pill is enough
11. *~~`#active-chips` row of removable filter chips~~* — removed; the chip toolbar IS the active state

---

## §3 — Hero header strip

- `py-16 lg:py-20`, `border-b border-ink/10`
- Inside `max-w-[1440px] mx-auto px-6 lg:px-10`:

**Top row (mb-8)** — flex items-center gap-3:
- `<a href="/">Inicio</a>` — mono 11px tracking-[0.28em] uppercase ink/55, hover → ink
- `<span class="text-ink/30">/</span>`
- `<span>Catálogo</span>` — mono 11px tracking-[0.28em] uppercase ink (active, no hover)
- `<span class="h-px flex-1 bg-ink/15 mx-3"></span>` — divider rule
- Right meta: mono 11px ink/55, content: `"<edición> · <N> piezas"` where edición is the current season label (e.g. `"O/I '26"`) and N is `publicProducts.length`

**Headline row** — grid 12 cols gap-6 lg:gap-10 items-end:
- Left col-span-9: H1 (Manrope 800, `clamp(64px, 11vw, 184px)`, leading 0.86, tracking -0.04em):
  - `Todo el<br/><span class="text-brand">catálogo</span>.`
  - If a category filter is active on mount, replace with: `Solo<br/><span class="text-brand">{Tipo}</span>.` (e.g. `Solo<br/><span class="text-brand">Camisas</span>.`)
- Right col-span-3 lg:text-right: paragraph (15px ink/70 max-w-[360px] lg:ml-auto leading-relaxed):
  - Default: `"Camisas, denim, polos, knits y fragancias. Curadas en Colima — al mejor precio."`
  - If a category filter is active, swap to a one-liner description for that type. Suggested per-type copy:
    - Camisas: `"Oxford, lino y franela. Cortes slim y regular fit, en hueso, marino y negro."`
    - Pantalones / Jeans: `"Denim crudo, slim y straight. Marcas premium con costura japonesa."`
    - Polos: `"Polos en algodón pima — manga corta, semestre largo. Esenciales del clóset."`
    - Chinos: `"Algodón peinado, corte slim. Beige, oliva y carbón."`
    - Knits: `"Suéteres en punto de algodón. Cuello redondo y half-zip para entretiempos."`
    - Perfumes: `"Eau de parfum amaderado y cítrico. Pour Homme, 50 y 100ml."`

---

## §4 — Sticky toolbar

- `sticky top-[72px]` (sits below the page header which is `h-[72px]`), `z-30`
- `bg-paper/95 backdrop-blur-md border-b border-ink/10`
- Drop shadow on bottom edge: `box-shadow: 0 1px 0 rgba(10,10,15,0.06)` (utility `.toolbar-shadow`)
- Inner: `max-w-[1440px] mx-auto px-6 lg:px-10 py-4`

### §4.1 — Top row (flex items-center gap-3 flex-wrap)

**Category chips group** (`#cat-chips`, flex items-center gap-2 flex-wrap):
- One chip per `Tipo` value, dynamically built from `uniqueSorted(publicProducts.map(p => p.type))`
- First chip is always "Todo · {N}" where N is total product count
- Chip styling (`.chip` utility):
  - inline-flex items-center gap-1.5
  - padding `8px 14px`, height 36px, `rounded-full`
  - border `1px solid rgba(10,10,15,0.12)`, `background: white`
  - font: JetBrains Mono 11px tracking-[0.12em] uppercase
  - transition: all .25s
  - hover: `border-color: var(--ink); background: var(--ink); color: white`
  - `.active`: `background: var(--ink); color: white; border-color: var(--ink)`
  - `.active:hover`: `background: var(--brand); border-color: var(--brand)`
- Reference set (order): `Todo`, `Camisas`, `Jeans` (or `Pantalones` depending on data), `Polos`, `Chinos`, `Knits`, `Perfumes`
- Selecting a chip:
  - Removes `.active` from siblings, adds to clicked
  - Updates `select[name="type"]` (desktop + mobile) to match (preserves the existing `applyFilters` contract)
  - Triggers `renderGrid({ resetPage: true })`
  - Updates URL: `history.replaceState(null, '', val ? '/categoria/' + encodeURIComponent(val) : '/catalog')`
- Vertical divider: `<div class="hidden md:block h-6 w-px bg-ink/15 mx-1"></div>` between chips and sort

**Sort + view group** (`ml-auto flex items-center gap-2`):
- Eyebrow `"Orden"` — hidden on mobile, mono 11px tracking-[0.24em] uppercase ink/55
- `<select id="sortSelect" class="chip pr-9 bare cursor-pointer">` — uses the same `.chip` styling but with a chevron background-image. Options:
  - `featured` → "Destacados" (default)
  - `price-asc` → "Precio ↑"
  - `price-desc` → "Precio ↓"
  - `newest` → "Nuevos"
- `#viewToggle` — chip with grid icon + label "Grid". Toggles between grid (2/3/4 cols) and list view. **Note**: the reference only ships the grid view; the toggle is decorative. If you implement list view, it should mirror the home page's best-sellers row layout (rank + name + price), but it's **out of scope for v1** — keep the button for visual completeness.

### §4.2 — Secondary meta row (mt-3, flex items-center gap-3 flex-wrap)

Font: JetBrains Mono 11px tracking-[0.22em] uppercase ink/55. Content (separated by `<span class="opacity-40">·</span>`):
- `{N} resultados` (live count, append ` · {Tipo}` if filter active)
- `Tallas S → XXL` (or compute from active product set)
- `${min} — ${max}` (computed from active product set, prefixed `$`)
- Right-aligned: `<a href="#" class="ul-link text-ink hover:text-brand">Filtros avanzados →</a>` — opens the mobile bottom sheet on click (which already exists in `catalog.js`). On desktop, it can open a new bottom-sheet styled to match dark/editorial (not in scope for v1; keep the link but route it to the existing `#filter-controls-mobile` sheet which works on any breakpoint if not gated by `md:hidden`).

---

## §5 — Product grid

- `py-12 lg:py-16`
- Inner: `max-w-[1440px] mx-auto px-6 lg:px-10`
- Grid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-y-16`

**Important**: the new grid uses **larger vertical gap** (12/16) than the current (`gap-2 md:gap-4`). This is because each card has more vertical chrome (mono caption, name, price, swatches/sizes row) and needs room to breathe.

### §5.5 — Mobile bottom-sheet filter panel (`#filter-controls-mobile`)

Keep the existing `<select>` + `<input>` shell. Restyle to match:
- Backdrop: `rgba(10,10,15,0.6)` with `backdrop-blur-md`
- Sheet: `bg-paper`, `rounded-t-2xl`, top padding `pt-6`, inner padding `px-6 pb-8`
- Title: `font-display font-extrabold text-[28px] tracking-[-0.03em]` — `"Filtros"`
- Each select/input adopts the catalog field style (see §6.5 below — same pattern as the checkout fields if home/checkout redesign shipped: underline-only, mono labels above).
- Buttons at the bottom (`sheet-actions`):
  - Cerrar — secondary pill (`bg-fog hover:bg-ink hover:text-paper`, h-12, rounded-full, text 13px font-semibold)
  - Limpiar — primary pill (`bg-ink text-paper hover:bg-brand`, same dimensions)

---

## §4-card — Editorial product card

Replaces `productCard(p, idx)` in `src/pages/catalogCard.js`. Render as `<a href="/producto/${p.id}" class="pcard group block">` so the whole card navigates, but inner buttons (`[data-quick-add]`, `[data-quickview]`) use `event.stopPropagation()` to avoid the parent link click.

**Container** (`.pcard`): position relative, group.

**Image wrap** (`.pimg-wrap`):
- `position: relative; overflow: hidden; background: var(--fog); border-radius: 6px; aspect-ratio: 4 / 5`
- Two `<img>` children stacked:
  - `.pimg` — primary image (`p.images[0]`), `width: 100%; height: 100%; object-fit: cover; transition: transform 1.1s cubic-bezier(.22,.61,.36,1), opacity .5s`
  - `.pimg.alt` — secondary image (`p.images[1] || p.images[0]`), `position: absolute; inset: 0; opacity: 0`
- On `.pcard:hover` (group hover):
  - `.pimg` → `transform: scale(1.04)`
  - `.pimg.alt` → `opacity: 1`

**Top-left badge wrap** (`.badge-wrap`, `position: absolute; top: 12px; left: 12px; display: flex; gap: 6px`):
- One `.badge-dot` per `p.badges` entry. Pill styling: padding `4px 9px`, font JetBrains Mono 10px tracking-[0.18em] uppercase, `rounded-full`.
  - `type: 'sale'` → `bg-brand text-paper`, label e.g. `−14%`
  - `type: 'new'` → `bg-paper text-ink`, label `Nuevo`
  - `type: 'best'` → `bg-ink text-paper`, label `Top`
- Map from the existing `p.badge` field (a single string in the data model):
  - `"Oferta"` or items with `originalPrice > price` → `sale`
  - `"Nuevo"` → `new`
  - `"Más vendido"` → `best`

**Top-right rank pill**:
- Absolute, `top-3 right-3`, font JetBrains Mono 10px tracking-[0.2em] uppercase ink/60
- `bg-paper/80 backdrop-blur px-2 py-1 rounded-full`
- Content: 2-digit ordinal `01`, `02`, … based on the card index within the current rendered page.

**Hover quick-add overlay** (`.quick-add`):
- Absolute, `left: 12px; right: 12px; bottom: 12px`
- Initial: `opacity: 0; transform: translateY(6px)`
- On `.pcard:hover`: `opacity: 1; transform: translateY(0)` (transitions: opacity .3s, transform .35s)
- Inner `.qa-btn`:
  - Full width, height 46px, `background: white; color: var(--ink); border-radius: 999px`
  - Font 13px font-semibold, inline-flex items-center justify-center gap-2
  - Label "Vista rápida" + arrow icon
  - Hover: `background: var(--ink); color: white`
- **Wire**: `data-quickview="${p.id}"` (the same attribute the current catalog uses). The existing `on(root, 'click', '[data-quickview]', …)` saves state and navigates to `/producto/${p.id}`. If you want to keep the quick-add modal behavior (size picker overlay), make the button `data-quick-add="${p.id}"` and route to `handleQuickAdd` — but the reference design uses the navigation path (quick view = open product page).

**Below image — text block** (`mt-4`):

Row 1 (`flex items-start justify-between gap-2`):
- Left:
  - Mono eyebrow (10px tracking-[0.22em] uppercase ink/55, mb-1.5): `"{type} · {short tag}"` where short tag is a curated descriptor of the product (e.g. `"Oxford · Lino italiano"`, `"Denim · Costura japonesa"`). For v1, derive from `p.subtitle` or `p.materials[0]` or just use `p.type`.
  - Product name: Manrope 700, 18px, leading-tight, tracking -0.02em, `truncate`
- Right (text-right whitespace-nowrap):
  - If `p.originalPrice && p.originalPrice > p.price`: small line-through `formatMoney(p.originalPrice)` (mono 11px ink/40)
  - Current price: mono 14px font-semibold. If discounted, `text-brand`.

Row 2 (`mt-2 flex items-center gap-1.5`):
- One `.swatch` per `p.colors` entry — `width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(10,10,15,0.15); background: {colorHex}`. Color values come from `p.colors` (the data already has hex values or named colors mapped to hex in the existing catalog).
- Right-aligned size summary (mono 10px ink/45 ml-auto): `p.sizes.join(' · ')`.

### Card hover summary

- Image: cross-fade to secondary + 1.04 scale on primary
- Quick-add overlay: rises + fades in
- Cursor (when on top of card): expands to white-filled 80px ring (existing cursor-hover behavior from home redesign)

### Skeleton card (`skeletonGrid(n)`)

Same silhouette: 4/5 aspect bg-fog block + 2 stacked grey lines below + a 3rd shorter line. Use `animate-pulse` (already in style.css).

---

## §6 — "Cargar más" CTA

- `mt-16 flex items-center justify-between gap-6 flex-wrap`
- Three nodes, left → right:
  1. Mono caption (`text-[11px] tracking-[0.24em] uppercase ink/55`): `"Página {currentPage} · {visible} de {total}"`
  2. Button (centered when wraps): pill h-14, px-8, `rounded-full`, `bg-ink text-paper text-[14px] font-semibold`, hover `bg-brand`. Label `"Cargar más"` + down-arrow icon inside `<span class="arrow-walk">`.
  3. Mono caption right: `"{remaining} piezas más"`
- Hidden when `hasMore === false`.
- The button calls the existing `loadMoreBtn` handler: increment `currentPage`, append next 20 to grid, no full re-render.

---

## §7 — Editorial asesoría block

Full-bleed brand-blue editorial strip. Sits between the grid and the footer.

- `bg-brand text-paper py-20 lg:py-28`
- Grid 12 cols gap-6
  - Left col-span-3: mono `"§ — Asesoría"` (tracking-[0.32em] uppercase opacity-70)
  - Right col-span-9: paragraph (Manrope 500, `clamp(28px, 3.4vw, 48px)`, leading 1.1, tracking -0.03em):
    > "¿No estás seguro de la talla? **[opacity-70:]** Mándanos un WhatsApp con tu medida de pecho y cintura — te decimos en minutos qué te queda."
  - Below paragraph: link `"Hablar por WhatsApp →"` with `ul-link` underline. `href="https://wa.me/${BRAND.whatsapp}"` from `config.js`.

---

## §8 — Empty state

When `allFilteredProducts.length === 0`:

- Hide the grid; show a centered block (`py-24 text-center`):
  - Outline-text H2: `<div class="font-display text-[64px] outline-text leading-none">Sin resultados</div>`
  - Subtitle: `<p class="mt-4 text-ink/60">Intenta con otra categoría.</p>`
  - If a search query is active, swap to: `<p>No hay resultados para "${escapeHtml(query)}". Intenta con otros filtros</p>` and append a `<button>Limpiar búsqueda</button>` (pill, `bg-ink text-paper hover:bg-brand`).

---

## Interactions & Behavior

### Chip filter
- Click → toggle active. The `data-cat=""` chip ("Todo") clears the type filter.
- Synced to the existing hidden/desktop `select[name="type"]` so `getFilterState(root)` + `applyFilters` keep working.
- Synced to URL: `/categoria/<Type>` or `/catalog`.

### Sort dropdown
- Change → `renderGrid({ resetPage: true })`. Same options + same semantics as today.

### Sticky toolbar shadow
- The toolbar sticks below the 72px page header. When the page scrolls and the toolbar leaves its initial flush position, the `.toolbar-shadow` 1px shadow appears (it's always-on in the reference; if you want, you can drive it from `IntersectionObserver` watching a sentinel above the toolbar).

### Card hover
- Image scale + alt-image fade.
- Quick-add overlay rises.
- Cursor expands to white ring (inherited from home redesign cursor).

### Card click vs. Vista rápida button
- Whole card is a link → `/producto/${p.id}` (call `saveCatalogStateWithScroll()` first).
- Vista rápida button → same destination, but explicitly through `navigate()` so the click handler runs.
- Both must `saveCatalogStateWithScroll()` first so back-nav restores filters + scroll + currentPage.

### Reveal on scroll
- All major sections wrapped in `.reveal` start `opacity: 0; transform: translateY(20px)`.
- `IntersectionObserver` threshold 0.1 → `.in` class → reset.
- Transition: opacity .8s ease, transform .9s cubic-bezier(.22,.61,.36,1).

### Cursor follower
- Inherited from home redesign. Catalog adds `cursor-hover` binding to: every `a`, `button`, `.chip`, `.choice`, the `Vista rápida` overlay, and chip-style controls. `cursor-text` binding for any `input, textarea, select`.
- Re-bind cursor classes after every `renderGrid()` (cards are re-created).
- **Touch device**: same guard as home — `if (window.matchMedia('(pointer: coarse)').matches) return;` skip cursor init.

### Marquee
- Inherited from layout shell (home redesign).

### Search typeahead popup
- Keep the existing implementation. Restyle the popup:
  - Container: `bg-paper border border-ink/10 rounded-md shadow-2xl`
  - Each row: `flex items-center gap-3 p-3 hover:bg-fog`
  - Image: 48×60, `object-cover rounded`
  - Name: Manrope 600 14px
  - Price: mono 12px text-brand
- Empty-result row: mono 12px ink/55 padding-4 centered.

### Reset filters
- Same behavior as current code. Visually, when no filters are active the chip "Todo" is the active state; no extra "Limpiar" button is shown next to the chips. If you want to expose "Limpiar" as a quick affordance, render it as the rightmost chip in `#cat-chips` only when `activeCount > 0`, styled as `.chip` with an "×" prefix.

### Pagination state restore
- Same as current code. After back-nav from `/producto/:id`:
  1. Read `gl_catalog_state` from sessionStorage and immediately delete the key.
  2. Restore filters by writing to the existing selects/inputs **and** by also setting `.active` on the matching chip.
  3. Restore `currentPage`.
  4. Render. Then scroll-restore in two passes (350ms apart) to account for lazy images.

---

## Design Tokens

All tokens are inherited from the home redesign. The catalog adds **no new tokens**. If the home redesign hasn't shipped, ship these first in `src/style.css`:

```css
@theme {
  /* existing */
  --color-brand: #214fc7;
  --color-brand-light: #4169e1;
  --color-brand-dark: #003baf;

  /* required by catalog redesign */
  --color-ink: #0A0A0F;
  --color-paper: #FFFFFF;
  --color-fog: #F2F1ED;
  --color-brand-tint: #E8EDF9;

  --font-display: 'Manrope', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

### Catalog-specific utilities (add to `src/style.css`)

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  height: 36px;
  border-radius: 9999px;
  border: 1px solid rgba(10,10,15,0.12);
  background: white;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: background-color .25s, color .25s, border-color .25s;
  cursor: none; /* if home cursor is active */
}
.chip:hover { border-color: var(--color-ink); background: var(--color-ink); color: white; }
.chip.active { background: var(--color-ink); color: white; border-color: var(--color-ink); }
.chip.active:hover { background: var(--color-brand); border-color: var(--color-brand); }

.pcard .pimg-wrap { position: relative; overflow: hidden; background: var(--color-fog); border-radius: 6px; aspect-ratio: 4 / 5; }
.pcard .pimg { width: 100%; height: 100%; object-fit: cover; transition: transform 1.1s cubic-bezier(.22,.61,.36,1), opacity .5s; }
.pcard .pimg.alt { position: absolute; inset: 0; opacity: 0; }
.pcard:hover .pimg { transform: scale(1.04); }
.pcard:hover .pimg.alt { opacity: 1; }
.pcard .badge-wrap { position: absolute; top: 12px; left: 12px; display: flex; gap: 6px; }
.pcard .badge-dot { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; border-radius: 9999px; }
.pcard .quick-add { position: absolute; left: 12px; right: 12px; bottom: 12px; opacity: 0; transform: translateY(6px); transition: opacity .3s, transform .35s; }
.pcard:hover .quick-add { opacity: 1; transform: translateY(0); }
.pcard .qa-btn { width: 100%; height: 46px; background: white; color: var(--color-ink); border-radius: 9999px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: background-color .25s, color .25s; }
.pcard .qa-btn:hover { background: var(--color-ink); color: white; }
.pcard .swatch { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(10,10,15,0.15); }

.outline-text { -webkit-text-stroke: 1px currentColor; color: transparent; }
.toolbar-shadow { box-shadow: 0 1px 0 rgba(10,10,15,0.06); }
.ul-link { position: relative; }
.ul-link::after { content: ''; position: absolute; left: 0; right: 0; bottom: -3px; height: 1px; background: currentColor; transform-origin: right; transform: scaleX(0); transition: transform .45s cubic-bezier(.22,.61,.36,1); }
.ul-link:hover::after { transform-origin: left; transform: scaleX(1); }
.arrow-walk { transition: transform .35s; }
.arrow-walk:hover { transform: translateX(4px); }
```

If the home redesign shipped, `outline-text`, `ul-link`, `arrow-walk`, and the cursor utilities are already there — just add the catalog-specific ones (`chip`, `pcard`, `toolbar-shadow`).

### Type scale (catalog-specific applications)

| Use | Family | Weight | Size | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Hero H1 | Manrope | 800 | clamp(64px, 11vw, 184px) | -0.04em | 0.86 |
| Card name | Manrope | 700 | 18px | -0.02em | tight |
| Card eyebrow / meta | JetBrains Mono | 400 | 10–11px | 0.22–0.28em uppercase | 1 |
| Card price | JetBrains Mono | 600 | 14px | 0 | 1 |
| Chip label | JetBrains Mono | 400 | 11px | 0.12em uppercase | 1 |
| Toolbar meta row | JetBrains Mono | 400 | 11px | 0.22em uppercase | 1 |
| Empty-state outline | Manrope | 800 | 64px | -0.04em | 1 |
| Asesoría paragraph | Manrope | 500 | clamp(28px, 3.4vw, 48px) | -0.03em | 1.1 |

### Spacing

- Container max-width: `1440px`
- Container padding: `px-6 lg:px-10`
- Hero vertical: `py-16 lg:py-20`
- Toolbar vertical: `py-4`
- Grid vertical: `py-12 lg:py-16`, grid gap-x `4` / gap-y `12 lg:16`
- Asesoría vertical: `py-20 lg:py-28`

### Border radius

- Chips, pills, qa-btn: `rounded-full` (9999px)
- Card image wrap, badges: `rounded` / `rounded-md` (6px)
- Modals / sheets: `rounded-md` top corners

### Shadows

- Toolbar bottom edge: `0 1px 0 rgba(10,10,15,0.06)`
- Search popup: `shadow-2xl`
- Card itself: no shadow (flat editorial)

---

## State management

No new state. Reuse:
- `getState()` — full app state
- `state.products` — source array, filtered to `publicProducts` (badge !== 'Borrador')
- `searchProducts(query)` — store helper
- `setSearchQuery(q)`, `getSearchQuery()` — store helpers
- `subscribe(cb)` — store subscription, must unsubscribe in cleanup
- `applyFilters(list, filters)` — from `catalogFilters.js`
- `uniqueSorted(items)` — from `catalogFilters.js`
- `getFilterState(root)` — from `catalogFilters.js`

Local component state (carry forward from current code):
- `state` — most recent app state
- `publicProducts` — derived list
- `currentPage` — 1-indexed, controls slice size
- `allFilteredProducts` — last computed list (used by Cargar más)
- `lastFilters` — JSON-stringified filter snapshot (used to detect changes, currently unused but harmless)
- `savedCatalogState` — read once from sessionStorage on mount
- `restoringState` — bool guard against subscribe re-renders during scroll restore

UI-only state:
- `activeCat` — derived from active chip (mirrors `select[name="type"]`)
- `sortBy` — mirrors `#sortSelect.value`

---

## Assets

The reference uses Unsplash placeholder URLs for product photography. **In production, every card uses `p.images[0]` and `p.images[1]` from the live product data.** No new image files needed.

The `.thumb-wrap` of the bottom-sheet filter / search popup keeps using `p.images[0]`.

---

## Implementation order (suggested)

1. **Verify tokens + utilities**: confirm the home redesign's tokens + utility classes (`outline-text`, `ul-link`, `arrow-walk`, cursor utilities, marquee keyframe) ship before this. If not, port them first.
2. **Catalog-specific utilities**: add `.chip`, `.pcard` family, `.toolbar-shadow` to `src/style.css`.
3. **Hero strip + sticky toolbar shell**: replace the existing `#catalog-control-bar` markup. Wire chips → `select[name="type"]` sync → URL sync → `renderGrid({ resetPage: true })`. Sort select reuses existing handler. Verify the toolbar sticks correctly at `top-[72px]`.
4. **`productCard` rewrite**: in `catalogCard.js`, replace the function. Output an `<a class="pcard">` with image wrap + badges + rank + quick-add + text block. Update `skeletonGrid` to match.
5. **Empty state**: outline-text headline + clear-search button.
6. **Asesoría block**: static markup before the footer slot.
7. **Mobile bottom-sheet restyle**: keep the existing `<select>`/`<input>` shell, swap classes.
8. **Search popup restyle**: change inner row classes.
9. **State restore**: make sure chip `.active` syncs after `restoreFilters(saved.filters)`.
10. **Cursor**: confirm `bindCursor()` runs after every `renderGrid()` and after pagination append.
11. **Mobile**: verify all sections collapse cleanly. Chips wrap to two rows when needed. The toolbar's `meta` row stacks if it overflows.

---

## Files

- `v2-bold-catalog-reference.html` — the full standalone design reference. Open in a browser and inspect element-by-element while building.
- This `README.md` — the implementation brief.

### Companion handoff

The home redesign (`design_handoff_home_redesign/`) is a **dependency** for this work. It introduces the tokens, fonts, layout shell, marquee, and cursor that the catalog page relies on. If the home redesign hasn't been merged yet, either ship them together or hoist the shared utilities into a single shared PR first.

The cart and checkout redesigns (`v2-bold-cart.html`, `v2-bold-checkout.html`) exist in the design project as well; they share the same aesthetic and link to the catalog via the header's "Tienda" nav. Treat them as future companion work, not blockers for the catalog.
