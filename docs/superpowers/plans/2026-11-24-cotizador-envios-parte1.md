# Cotizador de envíos (Parte 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El cliente ve y elige el costo de envío (Estándar / Express, cotizado con Envia.com) en el checkout, y `place_order` lo cobra desde una cotización guardada en el servidor.

**Architecture:** Lógica pura compartida en `supabase/functions/_shared/shipping.js` (la importan el navegador vía Vite, la Edge Function en Deno y las pruebas en Node). Una Edge Function pública `shipping-quote` cotiza en Envia y guarda la cotización en `shipping_quotes`. `place_order` lee esa cotización (nunca el monto del navegador), aplica envío gratis y guarda envío y dirección por partes en `orders`. Ajustes (pesos, paqueterías, medidas, origen) en una página nueva `/admin/envios`.

**Tech Stack:** Vite + JS vanilla, Supabase (Postgres plpgsql, Edge Functions en Deno), Envia.com API, pruebas con `node:assert` vía `npm test`.

**Spec:** `docs/superpowers/specs/2026-11-24-cotizador-envios-design.md`

**Fuera de este plan:** Parte 2 (botón "Generar guía" en admin) va en un plan aparte.

## Global Constraints

- Precio al cliente = tarifa de Envia **redondeada hacia arriba al siguiente múltiplo de $5** ($187.30 → $190; $185.00 → $185; $180.01 → $185). Se redondea en el servidor.
- Estándar = la más barata. Express = la de menos días (empate → la más barata); solo si llega **al menos 1 día antes** que Estándar.
- Envío gratis (subtotal de productos antes de cupón `>= free_shipping_min` (1499) o cupón con `free_shipping`): Estándar = $0; Express = Express redondeado − Estándar redondeado. Misma regla que hoy `cart.js`/`checkout.js` (`coupon?.freeShipping || subtotal >= BRAND.freeShippingMin`).
- Paqueterías iniciales prendidas: `estafeta`, `fedex`, `dhl`, `paquetexpress`, `ups`, `jtexpress`. Disponible apagada: `99minutos`. Nunca Castores. (Nombres exactos de carrier: verificar en la doc de Envia.)
- Pesos semilla (gramos, caja): Playeras 250, Polos 300, Camisas 350, Shorts 350, Pantalones 650, Suéteres 600, Sudaderas 700, Perfumes 600 caja, Perfumes Dama 600 caja, Zapatos 1500 caja, Chamarras 1000 caja, Abrigos 1200 caja. Categoría sin fila: 500 g, caja.
- Sobre por defecto; caja si alguna categoría lo pide o el peso pasa el máximo del sobre. Un solo paquete; si pasa el máximo de la caja → no se cotiza.
- Fallback (Envia falla/tarda >8 s, CP no de 5 dígitos, paquete demasiado grande): texto exacto **"Te confirmamos el costo de envío por WhatsApp."** y el pedido se puede enviar sin envío, como hoy.
- La llave `ENVIA_API_KEY` solo vive como secreto de Supabase; nunca en el navegador ni en el repo.
- `orders.total` sigue siendo solo productos; el envío va en `orders.shipping_cost`.
- Copy: tono aprobado (serio, cercano, tuteo, sin "¡").
- SQL idempotente, como los demás archivos de `supabase/`.

## Review Focus

- La cotización vence (cliente tarda >30 min) entre cotizar y enviar → `place_order` la rechaza con mensaje claro; el checkout recotiza solo, muestra el precio nuevo y no pierde el carrito ni el formulario.
- El carrito cambia después de cotizar (cantidad, quitar producto, upsell en checkout) → se recotiza; si llega a `place_order` con la cotización vieja, se rechaza (no se cobra el envío de otro carrito).
- Se aplica o quita un cupón de envío gratis, o el subtotal cruza $1,499, después de cotizar → el cargo mostrado cambia sin recotizar y coincide con lo que guarda `place_order`.
- Envia responde sin ninguna tarifa de paqueterías permitidas, o una paquetería da error y otras no → se usan las que sí respondieron; si ninguna, fallback.
- Alguien llama `shipping-quote` en bucle → límite por IP corta antes de llamar a Envia.

---

## File Structure

- Create `supabase/functions/_shared/shipping.js` — lógica pura (sin APIs de Deno ni del DOM).
- Create `supabase/functions/_shared/envia.js` — cliente HTTP de Envia (solo lo usa Deno).
- Create `supabase/functions/shipping-quote/index.js` — Edge Function.
- Create `supabase/config.toml` (vía `npx supabase init`), `supabase/functions/README.md` (cómo desplegar y poner secretos).
- Create `supabase/shipping.sql` — tablas, semillas, RLS, columnas nuevas de `orders`.
- Modify `supabase/place-order.sql` — firma y lógica de envío.
- Create `scripts/test-shipping.mjs`; Modify `scripts/test.mjs`.
- Create `src/store/shipping.js` — llamadas del navegador (cotizar, leer/guardar ajustes).
- Modify `src/store/orders.js` (`saveOrder`), `src/pages/checkout/checkout.js`, `src/pages/checkout/checkoutView.js`, `src/utils/whatsapp.js` (`buildOrderMessage`).
- Create `src/pages/admin/adminShipping.js`; Modify `src/core/views.js`, `src/components/layout.js` (menú), `src/pages/admin/adminOrders.js` (mostrar tier/paquetería).

---

### Task 1: Lógica pura de envío

**Files:**
- Create: `supabase/functions/_shared/shipping.js`
- Test: `scripts/test-shipping.mjs`; Modify: `scripts/test.mjs` (agregar `import './test-shipping.mjs'`)

**Interfaces:**
- Produces:
  - `roundUp5(n: number) => number`
  - `buildPackage(items: {type: string, qty: number}[], weights: Record<string, {grams: number, needs_box: boolean}>, settings: ShippingSettings) => {kind: 'envelope'|'box', grams: number, length: number, width: number, height: number} | null` (null = no cabe en la caja)
  - `pickTiers(rates: {carrier: string, service: string, price: number, days: number|null}[]) => {standard: Rate, express: Rate|null} | null` — `Rate` incluye `price` (redondeado) y `cost` (original de Envia).
  - `isFreeShipping(subtotal: number, coupon: {freeShipping?: boolean}|null, min: number) => boolean`
  - `chargeFor(tiers: {standard: {price}, express: {price}|null}, tier: 'standard'|'express', free: boolean) => number`
  - `cartKey(items: {productId: string|number, qty: number}[]) => string` — suma qty por `String(productId)`, ordena por texto y por código de carácter (comparar con `<`/`>`, sin `localeCompare` ni resta; igual que `collate "C"` en SQL), `"id:qty|id:qty"`.
  - `isMxZip(zip: string) => boolean` (exactamente 5 dígitos)
  - `MX_STATES: {code: string, name: string}[]` (32 estados; `code` en el formato que pide Envia — verificar en su doc, p. ej. `CL` Colima, `JA` Jalisco)
  - `ShippingSettings = { envelope: {length,width,height,max_grams}, box: {length,width,height,max_grams}, default_grams: number, default_needs_box: boolean, carriers: string[], free_shipping_min: number }`

- [ ] **Step 1: Write the failing test** `scripts/test-shipping.mjs`

```js
import assert from 'node:assert/strict'
import { roundUp5, buildPackage, pickTiers, isFreeShipping, chargeFor, cartKey, isMxZip, MX_STATES } from '../supabase/functions/_shared/shipping.js'

assert.equal(roundUp5(187.30), 190); assert.equal(roundUp5(185), 185); assert.equal(roundUp5(180.01), 185); assert.equal(roundUp5(0.1 + 0.2 + 184.7), 185)

const S = { envelope: { length: 35, width: 25, height: 5, max_grams: 2000 }, box: { length: 40, width: 30, height: 20, max_grams: 10000 }, default_grams: 500, default_needs_box: true, carriers: ['estafeta'], free_shipping_min: 1499 }
const W = { Playeras: { grams: 250, needs_box: false }, Pantalones: { grams: 650, needs_box: false }, Zapatos: { grams: 1500, needs_box: true } }
assert.deepEqual(buildPackage([{ type: 'Playeras', qty: 2 }], W, S), { kind: 'envelope', grams: 500, length: 35, width: 25, height: 5 })
assert.equal(buildPackage([{ type: 'Playeras', qty: 1 }, { type: 'Zapatos', qty: 1 }], W, S).kind, 'box')
assert.equal(buildPackage([{ type: 'Pantalones', qty: 4 }], W, S).kind, 'box')          // 2600 g > sobre
assert.equal(buildPackage([{ type: 'Desconocida', qty: 1 }], W, S).kind, 'box')         // default caja 500 g
assert.equal(buildPackage([{ type: 'Zapatos', qty: 7 }], W, S), null)                  // 10.5 kg > caja

const r = (carrier, price, days) => ({ carrier, service: 'x', price, days })
let t = pickTiers([r('estafeta', 187.3, 4), r('fedex', 240, 2), r('dhl', 230, 2)])
assert.equal(t.standard.carrier, 'estafeta'); assert.equal(t.standard.price, 190); assert.equal(t.standard.cost, 187.3)
assert.equal(t.express.carrier, 'dhl'); assert.equal(t.express.price, 230)
assert.equal(pickTiers([r('estafeta', 150, 3), r('fedex', 200, 3)]).express, null)      // no llega antes
assert.equal(pickTiers([r('estafeta', 150, 2), r('fedex', 200, null)]).express, null)   // días desconocidos no son Express
assert.equal(pickTiers([]), null)

assert.equal(isFreeShipping(1499, null, 1499), true); assert.equal(isFreeShipping(1498.99, null, 1499), false); assert.equal(isFreeShipping(10, { freeShipping: true }, 1499), true)
assert.equal(chargeFor(t, 'standard', false), 190); assert.equal(chargeFor(t, 'express', false), 230)
assert.equal(chargeFor(t, 'standard', true), 0); assert.equal(chargeFor(t, 'express', true), 40)

assert.equal(cartKey([{ productId: 2, qty: 1 }, { productId: 1, qty: 1 }, { productId: 2, qty: 2 }]), '1:1|2:3')
assert.equal(cartKey([{ productId: 10, qty: 1 }, { productId: 9, qty: 1 }]), '10:1|9:1')   // orden de texto, igual que SQL collate "C"
assert.equal(isMxZip('28000'), true); assert.equal(isMxZip('2800'), false); assert.equal(isMxZip('280000'), false)
assert.equal(MX_STATES.length, 32)
console.log('test-shipping ok')
```

- [ ] **Step 2: Run `node scripts/test-shipping.mjs`** — Expected: FAIL (module not found).
- [ ] **Step 3: Implement the module** with the signatures above. `roundUp5`: `Math.ceil(Math.round(n * 100) / 500) * 5` (centavos enteros antes de dividir, para que 185.0000001 no suba a 190). `pickTiers` redondea cada `price` con `roundUp5` y guarda el original en `cost`; elige sobre los precios redondeados.
- [ ] **Step 4: Run `npm test`** — Expected: todas las pruebas pasan, incluida `test-shipping ok`.
- [ ] **Step 5: Commit** `feat(envios): lógica pura de paquete, tarifas y redondeo`

---

### Task 2: Base de datos de envíos y `place_order`

**Files:**
- Create: `supabase/shipping.sql`
- Modify: `supabase/place-order.sql`

**Interfaces:**
- Consumes: reglas de Task 1 (la versión SQL debe dar lo mismo que `chargeFor`/`isFreeShipping`/`cartKey`).
- Produces:
  - `shipping_settings` (una fila, `id int primary key default 1 check (id = 1)`): `origin jsonb` (nombre, teléfono, calle, número, colonia, ciudad, estado `code`, CP; semilla: Calle Ignacio Zaragoza #140, Col. Centro, Colima, CL, 28000, nombre "G&L Boutique", teléfono vacío), `envelope jsonb`, `box jsonb` (semilla sobre 35×25×5 cm máx 2000 g; caja 40×30×20 cm máx 10000 g — el dueño los ajusta), `default_grams int default 500`, `default_needs_box bool default true`, `carriers text[]` (semilla de Global Constraints), `free_shipping_min numeric default 1499`.
  - `shipping_category_weights (category text primary key, grams int not null check (grams > 0), needs_box bool not null default false)` con la semilla de Global Constraints. Antes de sembrar, confirmar los nombres exactos con `select distinct type from products;` (p. ej. "Perfumes Dama").
  - `shipping_quotes (id uuid pk default gen_random_uuid(), zip text, cart_key text, package jsonb, standard jsonb, express jsonb, ip_hash text, created_at timestamptz default now(), expires_at timestamptz default now() + interval '30 minutes')`. `standard`/`express` = `{carrier, service, price, cost, days}`.
  - `orders` columnas nuevas: `shipping_tier text`, `shipping_carrier text`, `shipping_service text`, `shipping_quote_id uuid`, `address_parts jsonb`.
  - `place_order(..., p_expected_total, p_shipping_quote_id uuid default null, p_shipping_tier text default null, p_address_parts jsonb default null)`. Borrar la firma de 9 argumentos (`drop function if exists public.place_order(text, text, text, text, text, jsonb, text, text, numeric)`) y actualizar `revoke`/`grant` a la nueva.
- RLS: las tres tablas con RLS. `shipping_settings` y `shipping_category_weights`: lectura y escritura solo admin (mismo patrón `exists (select 1 from admin_users a where a.user_id = auth.uid())` de `rls-hardening.sql`). `shipping_quotes`: sin políticas (solo service role y `place_order` security definer).

- [ ] **Step 1: Escribir `supabase/shipping.sql`** con tablas, semillas (`insert ... on conflict do nothing`), RLS y columnas de `orders`.
- [ ] **Step 2: Modificar `place_order`**. Después de calcular `v_total`:
  - Si `p_delivery_method <> 'Envío a domicilio'`, ignorar la cotización (`v_ship` null).
  - Si `p_shipping_quote_id` viene (y es envío a domicilio): exigir `p_address_parts` no null; buscar la cotización; errores `22023` con estos textos exactos: no existe o `expires_at < now()` → `'La cotizacion de envio vencio. Vuelve a cotizar.'`; `p_shipping_tier` no es `'standard'`/`'express'` o ese tier es null → `'Opcion de envio invalida.'`; `cart_key` distinto al de `p_items` (misma regla que `cartKey`: sumar qty por `v_item->>'productId'`, `string_agg(id || ':' || qty, '|' order by id collate "C")`) o `q.zip is distinct from (p_address_parts->>'zip')` → `'Tu carrito cambio. Vuelve a cotizar el envio.'`.
  - Envío gratis: `v_subtotal >= settings.free_shipping_min or coalesce(v_coupon.free_shipping, false)`. Cargo: igual que `chargeFor`.
  - `p_expected_total` se compara contra `v_total + coalesce(v_ship, 0)`; el `detail` del error "Los precios cambiaron" pasa a ser `(v_total + coalesce(v_ship, 0))::text` (sin coalesce, un `v_ship` null apaga la revisión).
  - Insertar `shipping_cost = v_ship` (null si no hubo cotización), `shipping_tier`, `shipping_carrier`, `shipping_service`, `shipping_quote_id`, `address_parts` (sanear: cada valor texto `left(translate(...,'<>',''), 200)`).
- [ ] **Step 3: Correr ambos archivos en el SQL Editor de Supabase** (primero `shipping.sql`, luego `place-order.sql`). Verificación:
  - `select count(*) from shipping_category_weights;` → 12 (o los que existan tras confirmar nombres).
  - Insertar a mano una cotización de prueba (`standard = {"price":190,...}`, `express = {"price":230,...}`, `cart_key` de un producto real) y llamar `place_order` con ella: con subtotal < 1499 y `standard` → `shipping_cost = 190`; con un cupón `free_shipping` y `express` → `shipping_cost = 40`; con `expires_at` en el pasado → error "vencio"; con otro carrito → error "carrito cambio". Borrar los pedidos de prueba al terminar.
  - Llamar `place_order` sin cotización (como el sitio de hoy) → funciona y `shipping_cost` es null.
  - Sin cotización y con `p_expected_total` equivocado → error "Los precios cambiaron".
  - Cotización de un carrito de **2 productos** (ids que ordenen distinto como número y como texto si los hay) → se acepta.
  - Con cotización pero `p_address_parts` null o con otro `zip` → error "carrito cambio"; con `p_delivery_method = 'Recoger en tienda'` → `shipping_cost` null.
- [ ] **Step 4: Commit** `feat(envios): tablas de envío y place_order cobra desde la cotización`

---

### Task 3: Edge Function `shipping-quote`

**Files:**
- Create: `supabase/config.toml` (`npx supabase init`), `supabase/functions/_shared/envia.js`, `supabase/functions/shipping-quote/index.js`, `supabase/functions/README.md`
- En `config.toml`: `[functions.shipping-quote]` con `entrypoint = './functions/shipping-quote/index.js'` (el CLI busca `index.ts` por defecto; confirmar en el primer deploy). Desplegar con `npx supabase functions deploy shipping-quote --use-api` (sin Docker).

**Interfaces:**
- Consumes: `buildPackage`, `pickTiers`, `cartKey`, `isMxZip` (Task 1); tablas de Task 2.
- Produces:
  - `envia.js`: `rateCarrier({ baseUrl, apiKey, carrier, origin, destination, pkg }) => Promise<{carrier, service, price, days}[]>` — una llamada al endpoint de tarifas por paquetería (verificar en la doc de Envia si hay que mandar `carrier` por llamada y el formato de `deliveryEstimate`/días; normalizar a `days: number|null`). Timeout 8 s con `AbortController`.
  - Función HTTP `POST` con body `{ zipCode, state, city, items: [{productId, qty}] }` → `200 { quoteId, standard: {carrier, service, price, days}, express: {...}|null, freeShippingMin }`, o `200 { fallback: true }` cuando no se puede cotizar (CP no MX, paquete null, ninguna tarifa, Envia caído). `400` si el body es inválido (items no arreglo, más de 50, qty fuera de 1–50). `429` si la IP pasó el límite. **No** devolver `cost` al navegador.
  - Secretos: `ENVIA_API_KEY`, `ENVIA_BASE_URL` (sandbox `https://api-test.envia.com` hasta que el dueño dé la llave de producción). `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase.
- Comportamiento: leer `products` (`type` por id), `shipping_settings`, `shipping_category_weights` con service role; `buildPackage`; `Promise.allSettled` de `rateCarrier` para cada `settings.carriers`; `pickTiers`; insertar en `shipping_quotes` (`ip_hash` = SHA-256 de la IP de `x-forwarded-for` + `SUPABASE_URL` como sal). Límite: se cuentan **intentos**, no solo cotizaciones guardadas (insertar fila en cada intento, también en fallback, con `standard` null); si ese `ip_hash` ya tiene `>= 10` en el último minuto → 429 antes de llamar a Envia. CORS: permitir los orígenes `https://www.glboutique.com.mx`, `https://glboutique.com.mx` y `http://localhost:5173`; `Access-Control-Allow-Headers: authorization, apikey, x-client-info, content-type`; responder `OPTIONS`. La respuesta incluye `freeShippingMin` (de `shipping_settings`) para que el checkout use el mismo mínimo que el servidor.

- [ ] **Step 1: `npx supabase init`** y `npx supabase link --project-ref <ref>` (el ref está en la URL de `src/core/supabase.js`). Escribir `README.md` con los comandos de deploy y `secrets set` (sin valores).
- [ ] **Step 2: Implementar `envia.js` e `index.js`.**
- [ ] **Step 3: Desplegar** `npx supabase functions deploy shipping-quote` y poner secretos de sandbox con `npx supabase secrets set ENVIA_BASE_URL=https://api-test.envia.com ENVIA_API_KEY=...` (el dueño pega su llave de sandbox; no se escribe en ningún archivo).
- [ ] **Step 4: Verificar con curl** (anon key en `Authorization: Bearer`):
  - CP `44100` (Guadalajara) + una playera real → `200` con `quoteId` y `standard.price % 5 === 0`; la fila existe en `shipping_quotes` con `cost` sin redondear.
  - CP `2800` → `{ fallback: true }`.
  - 11 llamadas seguidas (también con CP que da fallback) → la 11ª da `429`.
  - Preflight `OPTIONS` desde `http://localhost:5173` con los 4 headers → 200 con `Access-Control-Allow-Headers`.
  - `ENVIA_BASE_URL` apuntando a un host inválido → `{ fallback: true }` en ≤ 9 s.
- [ ] **Step 5: Commit** `feat(envios): Edge Function shipping-quote con Envia`

---

### Task 4: Checkout cotiza y cobra el envío

**Files:**
- Create: `src/store/shipping.js`
- Modify: `src/store/orders.js`, `src/pages/checkout/checkout.js`, `src/pages/checkout/checkoutView.js`, `src/utils/whatsapp.js`

**Interfaces:**
- Consumes: `shipping-quote` (Task 3); `chargeFor`, `isFreeShipping`, `isMxZip`, `cartKey`, `MX_STATES` (Task 1); nueva firma de `place_order` (Task 2).
- Produces:
  - `quoteShipping({ zipCode, state, city, items }) => Promise<{quoteId, standard, express} | {fallback: true}>` en `src/store/shipping.js` (`supabase.functions.invoke('shipping-quote', ...)`; `invoke` no lanza con 429/500, regresa `{ error }`: cualquier `error`, excepción, o `data` sin `quoteId` → `{fallback: true}`).
  - `saveOrder({ ...igual que hoy, shippingQuoteId, shippingTier, addressParts })` pasa `p_shipping_quote_id`, `p_shipping_tier`, `p_address_parts`.
  - `addressParts = { street, numExt, numInt, neighborhood, city, state: <code>, stateName, zip, references }`.

- [ ] **Step 1: Estado como lista.** En `checkoutView.js`, el campo `state` pasa a `<select>` con `MX_STATES` (valor = `code`, texto = `name`, opción vacía "Selecciona tu estado") más la opción final **"Otro / fuera de México"** (valor `otro`), que muestra un campo de texto libre `stateOther`. En `checkout.js` (hoy lee `input[name="state"]`, ~línea 477) leer el `select` y, si es `otro`, el texto libre. Con `otro`: fallback sin llamar a la función y `addressParts.state = null`. `fullAddress` usa el nombre o el texto libre.
- [ ] **Step 2: Bloque de envío** debajo de la dirección (solo con "Envío a domicilio"): estados *cotizando* ("Calculando envío…"), *opciones* (radios Estándar / Express con precio y "Llega en N días hábiles"; si `express` es null, solo Estándar sin radio), *fallback* (texto exacto de Global Constraints). Accesible: `role="radiogroup"`, los radios con `<label>`, mensaje en `aria-live="polite"`.
- [ ] **Step 3: Disparadores.** Cotizar (debounce 400 ms) cuando `isMxZip(zip)` y hay estado, y cuando cambia el carrito (`cartKey` distinto al cotizado). Ignorar respuestas viejas (guardar un contador de petición). CP no MX con dirección completa → fallback sin llamar.
- [ ] **Step 3b: Envío mientras cotiza y cambio de entrega.** Estándar queda preseleccionado. Si el cliente envía mientras dice "Calculando envío…", se espera la respuesta con tope de 8 s; si no llega, el pedido va sin cotización (fallback). Si cambia a "Pago al recoger", deja de sumar el cargo y no manda `shippingQuoteId`.
- [ ] **Step 4: Totales.** El cargo mostrado = `chargeFor(tiers, tierElegido, isFreeShipping(subtotal, coupon, freeShippingMin))`, con `freeShippingMin` el que regresó la cotización (si no hay, `BRAND.freeShippingMin`); se recalcula al cambiar cupón o subtotal, sin recotizar. `shownTotal` = productos − descuento + cargo; `expectedTotal` lo incluye; el resumen lateral muestra la línea "Envío" ("Gratis" si es 0). `buildOrderMessage` agrega `Envío (Estándar · Estafeta): $190` antes del total cuando hay cargo; total con envío.
- [ ] **Step 5: Errores de `place_order`.** "vencio" o "carrito cambio" → recotizar sola, mostrar el precio nuevo y pedir que confirme de nuevo (no se pierde el formulario). El `detail` de "Los precios cambiaron" ya incluye envío.
- [ ] **Step 6: Verificación manual en `npm run dev`** (con la función en sandbox): CP 44100 + playera → aparecen opciones y el total suma el envío; elegir Express cambia el total; aplicar un cupón `free_shipping` → Estándar "Gratis" y Express solo la diferencia; cambiar cantidad → recotiza; CP 2800 → fallback; enviar pedido → en Supabase el pedido tiene `shipping_cost`, `shipping_tier`, `shipping_carrier` y `address_parts`. `npm test` y `npm run build` pasan.
- [ ] **Step 7: Commit** `feat(envios): el checkout cotiza Estándar/Express y cobra el envío`

---

### Task 5: Admin — Ajustes de envío y detalle del pedido

**Files:**
- Create: `src/pages/admin/adminShipping.js`
- Modify: `src/store/shipping.js`, `src/core/views.js`, `src/components/layout.js`, `src/pages/admin/adminOrders.js`

**Interfaces:**
- Consumes: tablas de Task 2 (RLS admin).
- Produces:
  - `getShippingSettings() => Promise<{settings, weights}>`, `saveShippingSettings(settings)`, `saveCategoryWeight({category, grams, needs_box})`, `deleteCategoryWeight(category)` en `src/store/shipping.js` (patrón `ensureAdminAccess` de `store/orders.js`).
  - Ruta `/admin/envios` (`pageAdminShipping`), menú grupo "Tienda", icono existente de `adminIcons.js`, título "Envíos".

- [ ] **Step 1: Página** siguiendo el estilo de `adminPromotions.js`/`adminCoupons.js`: (a) tabla de pesos por categoría (gramos + casilla "Va en caja"), con las categorías de la tienda sin fila listadas como "usa el valor por defecto"; (b) paqueterías: casillas para `estafeta, fedex, dhl, paquetexpress, ups, jtexpress, 99minutos`; (c) medidas y peso máximo de sobre y caja; (d) remitente (nombre, teléfono, dirección con estado de `MX_STATES`); (e) valor por defecto. Validar: gramos 1–30000, medidas 1–200 cm, al menos una paquetería, CP origen de 5 dígitos. Escapar todo lo que se pinta (ver `scripts/test-admin-escaping.mjs`).
- [ ] **Step 2: Detalle del pedido** en `adminOrders.js`: si el pedido tiene `shipping_tier`, mostrar debajo de "Costo de envío" la línea `Estándar · Estafeta` (o Express), también en la hoja impresa y en el resumen copiado.
- [ ] **Step 3: Verificación manual:** cambiar el peso de Playeras y la caja → nueva cotización en el checkout lo refleja; apagar todas menos una paquetería → solo esa aparece; un usuario no admin no puede leer `shipping_settings` (probar con la anon key: `select` devuelve 0 filas). `npm test` y `npm run build` pasan.
- [ ] **Step 4: Commit** `feat(envios): ajustes de envío en admin y tier en el pedido`

---

## Despliegue (después de Task 5)

1. Merge a `main` → Vercel publica. El SQL y la función ya están arriba desde Tasks 2–3 (compatibles con el sitio viejo: `place_order` acepta llamadas sin cotización).
2. El dueño pone su llave de **producción**: `npx supabase secrets set ENVIA_BASE_URL=https://api.envia.com ENVIA_API_KEY=...`.
3. Prueba real: un pedido a un CP de otro estado; comparar el precio cotizado con el panel de Envia.
