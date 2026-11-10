# Promociones de temporada — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** descuentos automáticos por fecha, para toda la tienda o por categoría, configurables en Admin → Promociones, con cuenta regresiva, color de evento, filtro "en promoción" y reporte.

**Architecture:** la regla de precio vive en dos espejos exactos: `public.promo_price()` en SQL, que es lo que cobra `place_order`, y `src/utils/promotions.js` en JS, que es lo que se muestra. Las promociones se leen de una tabla `promotions` y se aplican sobre los precios base al cargar los productos; nunca se reescribe `products.price`.

**Tech Stack:** vanilla JS (ESM) + Tailwind v4 + Supabase (Postgres, RLS). Pruebas: `node scripts/test-*.mjs` con `node:assert`, reunidas en `scripts/test.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-09-promociones-design.md`. La sección "Decisiones tras la revisión" manda sobre el resto.

## Global Constraints

- No se agregan dependencias.
- Precio con promoción = `round(price * (100 - pct) / 100)` en SQL y `Math.round(price * (100 - pct) / 100)` en JS. Los precios son enteros: se verificó en la base que hay 0 con decimales en 257 productos.
- Desempate: `discount_pct desc, starts_at asc, id asc`.
- Cupones: la base del porcentaje excluye las líneas en promoción; el envío gratis sigue aplicando.
- Antes de producción hay que enseñarlo en localhost y esperar el OK del dueño. En la base solo se crea ahora la tabla `promotions` con su RLS (permitido). `promo_price` y `place_order` se prueban dentro de `begin … rollback`.
- Toda la copia visible va en español.

## Review Focus

1. Una promoción que termina con la pestaña abierta: el checkout no debe guardar un pedido con un total distinto al mostrado (Task 4, prueba en SQL con `p_expected_total`).
2. Editar un producto en el admin durante una promoción: debe guardar el precio base (Task 6, prueba en la consola local).
3. Una hora capturada en `datetime-local`: debe empezar a esa hora de Colima, no 6 h antes (Task 6, prueba de `toISOString` en `test-promotions.mjs`).
4. Un carrito mixto con cupón: el porcentaje solo cuenta las líneas sin promoción, tanto en JS como en SQL (Tasks 1 y 4).
5. Medios pesos: 7 % sobre $250 = $233 en los dos lados (Tasks 1 y 3).

---

### Task 1: Regla pura en JS

**Files:** Create `src/utils/promotions.js`, `scripts/test-promotions.mjs`. Modify `scripts/test.mjs` (agregar el import).

**Produces:**
- `isRunning(promo, now: number) -> boolean`
- `promoFor(product, promos, now) -> promo|null`: usa `basePrice` y `baseOriginalPrice` (con respaldo a `price` y `originalPrice`) y el desempate de arriba; devuelve null si el precio redondeado no baja.
- `discounted(price, pct) -> number`
- `applyPromotions(products, promos, now) -> products` (nuevos objetos): cada producto lleva `price`, `originalPrice` y `promo: {id, name, pct}|null`, con base intacta.
- `featuredPromotion(promos, now) -> {promo, phase: 'running'|'upcoming'}|null`: la que está en curso y termina primero; si no hay ninguna en curso, la próxima dentro de `countdown_lead_days`.
- `nextBoundary(promos, now) -> number|null`
- `contrastOnWhite(hex) -> number`
- `localInputToIso(value) -> string` y `isoToLocalInput(iso) -> string`

- [ ] Escribir pruebas:
  - `discounted(250, 7) === 233` y `discounted(1075, 6) === 1011`.
  - Una promoción de toda la tienda rebaja todo; una de categoría solo rebaja ese `type`.
  - Un producto rebajado queda fuera con `include_on_sale:false` y entra con `true` (el precio base es `price`, no `original_price`).
  - Con dos promociones que aplican gana la de mayor `pct`; con el mismo `pct`, la de `starts_at` menor.
  - Antes de `starts_at` y en `ends_at` exacto no aplica; con `active:false` no aplica.
  - Aplicar dos veces da el mismo resultado (idempotente) y un caché viejo sin `basePrice` funciona.
  - `contrastOnWhite('#D7262B') >= 4.5` y `contrastOnWhite('#FFD400') < 4.5`.
  - `isoToLocalInput(localInputToIso('2026-11-13T00:00')) === '2026-11-13T00:00'`.
- [ ] `node scripts/test-promotions.mjs` → falla porque el módulo no existe.
- [ ] Implementar.
- [ ] `npm test` → pasa todo.

### Task 2: Tabla y RLS (se aplica en Supabase, aprobado)

**Files:** Create `supabase/promotions.sql`, con la parte de tabla y políticas.

- Columnas: `id uuid pk`, `name text not null check (length(btrim(name)) between 1 and 60)`, `discount_pct int not null check (discount_pct between 1 and 90)`, `categories text[] not null default '{}'`, `include_on_sale bool not null default false`, `starts_at timestamptz not null`, `ends_at timestamptz not null check (ends_at > starts_at)`, `accent_color text null check (accent_color ~ '^#[0-9a-fA-F]{6}$')`, `show_countdown bool not null default true`, `countdown_lead_days int not null default 3 check (countdown_lead_days between 0 and 30)`, `active bool not null default true`, `created_at timestamptz default now()`.
- Políticas:
  - `promotions_admin_all`: copia exacta del `qual` de `coupons_admin_all`.
  - `promotions_public_read`: para anon y authenticated, `active and ends_at > now() and starts_at < now() + make_interval(days => greatest(countdown_lead_days, 1))`.
- [ ] `apply_migration` → `list_tables` muestra `promotions` con RLS activada.
- [ ] Como anon (con `set role anon` en una transacción con rollback), una fila de prueba a 10 días del inicio con `lead 3` no se ve, y una a 2 días sí.

### Task 3: `promo_price` en SQL (en el archivo; en la base solo se prueba con rollback)

**Files:** Modify `supabase/promotions.sql` (segunda sección, después de la tabla).

- `public.promo_info(p public.products) returns table(price numeric, promo_id uuid, promo_name text)`, `stable`, `security definer`, `set search_path = public, pg_temp`. Sigue la misma regla y el mismo desempate que la Task 1, y devuelve `p.price` y nulls si no hay promoción o si el precio no baja.
- [ ] En `begin; <función>; insertar promociones de prueba; select` sobre productos reales `; rollback;`, comparar contra `applyPromotions` en node con los mismos datos. Deben dar 0 diferencias, incluido 7 % y $250 = 233.

### Task 4: `place_order` con promoción, cupón sin acumular y total esperado

**Files:** Modify `supabase/place-order.sql`, `src/store/orders.js`, `src/store/coupons.js`, `src/pages/checkout/checkout.js`.

- **SQL:**
  - Precio de línea = `(promo_info(v_product)).price`.
  - `v_applicable` solo suma las líneas sin promoción y que cumplen las categorías del cupón.
  - La rama sin categorías usa la suma de líneas sin promoción, no `v_subtotal`.
  - Cada línea agrega `promo` y `list_price` cuando hubo promoción.
  - Nuevo `p_expected_total numeric default null`: si no es null y `abs(v_total - p_expected_total) >= 0.5`, lanza `'Los precios cambiaron. Revisa tu bolsa.'` con errcode `22023`.
  - Se borra la firma de 8 argumentos y se actualizan `revoke` y `grant` a la de 9.
- **JS:**
  - `getDiscountAmount` excluye las líneas cuyo producto tiene `promo`.
  - `applyCoupon` devuelve "Los cupones no aplican a productos en promoción" cuando `!coupon.free_shipping` y la base aplicable es 0 porque todo está en promoción.
  - `saveOrder` manda `p_expected_total`.
  - El checkout, al recibir ese mensaje, llama `refreshPromotions()` y vuelve a pintar el resumen con el error visible.
- [ ] Prueba en JS (`test-promotions.mjs`): un carrito de 2 líneas, una en promoción, con cupón del 10 % → descuento = 10 % de la línea sin promoción.
- [ ] Prueba en SQL con rollback (`begin; promociones de prueba; select place_order(...); rollback;`):
  - Las líneas llevan precio de promoción y el cupón solo cuenta la línea sin promoción.
  - Con `p_expected_total` erróneo, la llamada falla.
  - Sin `p_expected_total`, la llamada pasa.
- [ ] **No se aplica a producción** hasta el OK del dueño.

### Task 5: Store y tienda pública

**Files:** Create `src/store/promotions.js`. Modify `src/store/products.js`, `src/store/state.js`, `src/store/index.js`, `src/pages/catalog/catalogCard.js`, `src/pages/product/product.js`, `src/pages/catalog/catalogFilters.js`, `src/pages/catalog/catalog.js`, `src/components/layout.js` (franja), `src/style.css`, `src/pages/cart/cart.js:334`, `src/core/startApp.js`.

- **Interfaces:**
  - `loadPromotions()`: lee de Supabase y, si falla, usa el caché `gl_promotions_cache`.
  - `refreshPromotions()`.
  - `getPromotions()`.
  - `reapplyPromotions()`: recalcula `state.products`, hace emit y programa un `setTimeout` a `nextBoundary` (si es menor a 24 h).
- **`products.js`:**
  - `mapRowToProduct` agrega `basePrice` y `baseOriginalPrice`.
  - Después de cargar, `state.products = applyPromotions(...)` y la comparación de cambios va después.
  - `addProduct` y `updateProduct` fijan `basePrice` y `baseOriginalPrice` con lo guardado y reaplican.
- **Etiqueta:** con `p.promo`, el texto es `${promo.name} −${pct}%`.
- **Filtro `?promo=1`:** `applyFilters` acepta `filters.promo`; el chip "En promoción" lo quita. Sin promoción en curso, el parámetro se ignora.
- **Franja:**
  - Se pinta según `featuredPromotion`, con `show_countdown`, fuera de `/admin`.
  - Lleva un botón "Ver promociones" a `/catalogo?promo=1`.
  - Se actualiza con un solo `setInterval(1000)`.
  - Lleva `aria-live="off"` y una etiqueta con la fecha legible.
- **Color:** solo en tema claro, con `--color-brand*` derivados con `color-mix`; se quita al terminar o al entrar a `/admin`.
- [ ] `npm test` y `npm run build` pasan.

### Task 6: Admin Promociones y precio base

**Files:** Create `src/pages/admin/adminPromotions.js` y las funciones CRUD en `src/store/promotions.js`. Modify `src/core/views.js`, `src/components/layout.js` (nav "Promociones", grupo Tienda, título), `src/pages/admin/adminProducts.js:810-811` (`basePrice`/`baseOriginalPrice`), `src/pages/admin/adminProductCard.js:51-52,97`, `src/store/categories.js` (al renombrar, actualizar `promotions.categories` con `array_replace` vía update del cliente).

- La estructura copia `adminCoupons.js`.
- Campos según el spec, con fechas que pasan por `localInputToIso` e `isoToLocalInput`.
- Al guardar, rechaza colores con `contrastOnWhite < 4.5`.
- Avisa si se encima con otra promoción activa que comparte categorías.
- Muestra la vista previa "Aplica a N productos (M rebajados quedan fuera)".
- Estado de cada promoción: Programada, En curso, Terminada o Pausada.
- [ ] Probar en localhost: crear una promoción, editarla, pausarla y borrarla. Editar un producto durante la promoción y comprobar en la base que guardó el precio base.

### Task 7: Reporte por promoción

**Files:** Modify `src/pages/admin/adminReportes.js`. Agregar `promoReport(orders, promo) -> {orders, sales, avg, prev:{orders, sales, avg}}` en `src/utils/promotions.js`, con su prueba.

- [ ] Prueba: con pedidos ficticios dentro y fuera de la ventana, y uno cancelado, los conteos y las sumas son exactos.
- [ ] La tarjeta se muestra en Reportes cuando hay promociones en curso o terminadas.

### Task 8: Verificación y revisión

- [ ] Localhost con una promoción de prueba en curso: revisar catálogo, ficha, carrito, checkout (sin enviar), franja, color, `?promo=1` y admin. Al pausarla, todo vuelve a como estaba.
- [ ] Revisión de código con Fable sobre el diff completo y este plan.
- [ ] Enseñarlo al dueño y, con su OK, aplicar `place_order` y desplegar.
