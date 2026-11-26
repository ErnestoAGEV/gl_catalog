# Guías de Envia desde el admin (Parte 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desde Admin → Pedidos, la tienda genera y paga la guía de Envia de un pedido "Envío a domicilio", sin intermediario y sin poder generarla dos veces.

**Architecture:** Lógica pura nueva en `supabase/functions/_shared/label.js` (configuración, paquete, dirección, remitente, opción por defecto y la máquina de estados de `generate`) y en `_shared/envia.js` (armar la petición `POST /ship/generate/` y clasificar su respuesta), probada con `node:assert` y dobles. Una Edge Function `shipping-label` (solo admin: JWT + `admin_users` en el servidor) con tres modos: `rates` (recotiza), `generate` (bloquea el pedido con un `update` condicional, llama a Envia, guarda) y `release` (quita un bloqueo dudoso o una guía). El admin la usa desde un bloque nuevo en el detalle del pedido (`src/pages/admin/orderLabel.js`).

**Tech Stack:** Vite + JS vanilla, Supabase (Postgres, Edge Functions en Deno con `npm:@supabase/supabase-js@2`), Envia.com API, pruebas `node:assert` vía `npm test`.

**Spec:** `docs/superpowers/specs/2026-11-24-cotizador-envios-design.md` (secciones Objetivos/Admin, `shipping-label`, Fallas que no se aceptan, Decisiones tras la revisión). Convenciones: `docs/superpowers/plans/2026-11-24-cotizador-envios-parte1.md`.

**Fuera de este plan:** cancelar guías en Envia (se hace en su panel), rastreo para el cliente, multipaquete, guías fuera de México, poda de `shipping_quotes` (es del plan de seguridad, rama `fix/seguridad`).

## Decisiones (y por qué)

1. **Configuración aparte y cerrada por defecto.** `shipping-label` lee **solo** `ENVIA_LABEL_BASE_URL` y `ENVIA_LABEL_API_KEY`; nunca `ENVIA_BASE_URL`/`ENVIA_API_KEY` (los de `shipping-quote`, hoy de producción). Si falta o está vacío alguno, o el host no es exactamente `api-test.envia.com` (sandbox) o `api.envia.com` (producción) con `https`, responde **"Las guías no están configuradas."** antes de llamar a Envia. Por qué: un error de configuración nunca debe cobrar en producción; un flag de "modo prueba" mandado por el navegador decidiría desde el cliente si se gasta dinero. Recotizar y generar usan el mismo par, porque los códigos de servicio del sandbox y de producción pueden no coincidir. Salir a producción = poner esos dos secretos con los valores de producción.
   La llave de sandbox sale de una **cuenta de sandbox de Envia aparte** (con paqueterías activas y saldo de prueba); el dueño la crea y la pega él en Dashboard → Edge Functions → Secrets. Nunca se escribe en archivos.
2. **Guías de prueba.** Con host sandbox el pedido guarda `label_sandbox = true`. En sandbox no se manda el correo del cliente y el teléfono del destinatario es el de la tienda (`origin.phone`), para que Envia no avise al cliente. El bloque muestra un aviso fijo **"Guía de prueba: no sirve para enviar"**, también junto a "Imprimir guía". El bloque es visible igual en sandbox (hay un solo admin: el dueño).
3. **PDF: solo la URL de Envia, sin copiar a Storage.** `orders` ya es solo-admin por RLS, así que la URL (larga, no adivinable) solo la ve el admin; Envia ya guarda esos datos del cliente, y copiarlos a un bucket duplica datos personales y agrega código, un bucket y políticas. Si la URL vence (no documentado), la guía se descarga del panel de Envia con el rastreo o la referencia `GL-<8 primeros del id>`.
4. **Bloqueo contra doble cargo.** `label_status`: `null` → `generating` → `generated`, o `review`. La secuencia vive en una función pura, `runGenerate` (Task 1), probada con dobles:
   - Antes de llamar a Envia, un solo `update ... where id = $1 and label_status is null and label_tracking is null returning id`. 0 filas → "Este pedido ya tiene guía o se está generando."; error de la base → "No se pudo apartar el pedido. Intenta de nuevo."; en ambos casos no se llama a Envia.
   - Error entre el bloqueo y el envío (armar la petición) → se quita el bloqueo.
   - Envia rechaza con claridad (4xx distinto de 408/429, o cuerpo `meta: "error"` con status < 500) → no hubo guía → se quita el bloqueo (pedido sin cambios) y se muestra el mensaje.
   - Timeout, abort, red caída, 5xx, 408, 429, 2xx sin guía legible, o 2xx con rastreo pero sin URL de PDF → **no se sabe** si se cobró → `review` (guardando el rastreo si vino). Nunca se reintenta solo; el admin revisa el panel de Envia y libera a mano.
   - Éxito pero falla guardar → un reintento; si vuelve a fallar, la respuesta trae `saved: false` y los datos, y el navegador intenta guardarlos por la vía normal de admin (Task 5).
   - `shipment.orderReference = 'GL-<8>'` en cada guía, para encontrarla en el panel.
5. **Liberar (`release`)** es un solo `update` condicional que limpia todas las columnas `label_*`. Se permite en `review`, en `generating` con más de 2 min, y en `generated` (prueba o real). Una guía real solo se quita tras una confirmación fuerte: **"Solo si ya cancelaste esta guía en el panel de Envia."** (decisión del controlador).
6. **Formato de impresión.** El dueño imprime en impresora normal: por defecto **PDF tamaño carta** (`printFormat: 'PDF'`, `printSize: 'PAPER_LETTER'`). Ajuste en Admin → Envíos con una segunda opción **PDF 4×6** (`PAPER_4X6`), que también sale en impresora normal. Envia acepta `printFormat` `PDF|PNG|ZPL|ZPLII|EPL` y `printSize` `PAPER_4X6|PAPER_7X4.75|STOCK_4X6|PAPER_LETTER` ([create-shipping-label](https://docs.envia.com/reference/create-shipping-label)), pero cada paquetería tiene sus propias opciones ([carrier-print-option](https://docs.envia.com/reference/carrier-print-options.md)); el ejemplo de FedEx no lista `PAPER_LETTER`. Se verifica en el despliegue (Task 3); si una paquetería rechaza el tamaño, el mensaje de Envia lo dice y el dueño cambia el formato.
7. **Nunca se confía en precios del navegador.** `generate` recibe `carrier`, `serviceCode`, empaque y `expectedCost` (el costo que vio el admin). El servidor recotiza esa paquetería, exige que el servicio exista y rechaza **antes del bloqueo** si el costo nuevo es mayor que `expectedCost + 1`. Lo que se guarda como `label_cost` es `Number(totalPrice)` de `/ship/generate/`.
8. **Código de servicio.** Hoy `parseRates` guarda en `service` la descripción ("Terrestre"); `/ship/generate/` pide el código (`service` de la tarifa, p. ej. `ground`). `parseRates` agrega `serviceCode`. `shipping-quote` no cambia su respuesta (`pub()` no lo copia); si se redespliega, el campo extra queda guardado en el jsonb de `shipping_quotes` sin efecto en `place_order`.
9. **Pedido sin pagar** (`pendientedepago`): se permite generar, con aviso (decisión del dueño).

## Global Constraints

- Solo pedidos `delivery_method = 'Envío a domicilio'`, `shipping_carrier` distinto de `'local'`, `status <> 'cancelado'`, sin guía (`label_status is null and label_tracking is null`).
- `shipping_carrier = 'local'` → sin botón; texto exacto **"Entrega local — la llevan ustedes."**
- Remitente = `shipping_settings.origin`; teléfono = solo dígitos, 10. Vacío o distinto → **"Falta el teléfono del remitente. Llénalo en Admin → Envíos."**
- Destinatario: `customer_name`, teléfono = `customer_whatsapp` a 10 dígitos (regla de `phoneKey` de `src/utils/phone.js`), `customer_email` si hay (en producción), `address_parts`. `address_parts.state` null → **"Este pedido es fuera de México. Genera la guía en el panel de Envia."**
- Mensajes de Envia: saldo insuficiente → **"No hay saldo suficiente en Envia. Recarga tu saldo y vuelve a intentar."**; otro rechazo → **"Envia no pudo generar la guía: <mensaje de Envia>"** (sin mensaje: **"Envia no pudo generar la guía. Intenta de nuevo en unos minutos."**). Recotizar falla → **"No se pudo recotizar con Envia. Intenta de nuevo."** (sin bloqueo). Costo subió → **"El precio cambió a $Y. Vuelve a ver las opciones."** En todos, el pedido queda sin cambios.
- Duda (review) → **"No supimos si Envia creó la guía. Revisa en tu panel de Envia con la referencia GL-xxxx antes de volver a intentar."**
- Aviso de costo (`costNote`): sin envío gratis y costo > pagado → **"Esta guía cuesta $X más de lo que pagó el cliente."**; envío gratis y pagado 0 → **"El cliente tuvo envío gratis: la guía la paga la tienda ($X)."**; envío gratis y pagado > 0 (Express) → **"Envío gratis con Express: el cliente pagó $P de diferencia y la tienda pone $X."**; `shipping_cost` null → **"Este pedido no tiene costo de envío registrado."**
- Botón de confirmar: sandbox → **"Generar guía de prueba"**; producción → **"Generar guía por $X — se cobra a tu saldo de Envia"**.
- Copy: serio, cercano, tuteo, sin "¡". Todo dato del cliente o de Envia pintado con `esc()` (lo revisa `scripts/test-admin-escaping.mjs`).
- La llave de Envia nunca sale de la función. Logs sin nombre, teléfono, correo ni dirección: solo `GL-xxxx`, paquetería, status HTTP, `meta`, `error.code` y el mensaje de Envia recortado a 120 caracteres.
- SQL idempotente; compatible con el plan de seguridad (no depende de escrituras `anon`; la función escribe con service role; no agrega triggers).
- Edge Functions con el MCP de Supabase (`deploy_edge_function`), SQL con `apply_migration`. Sin CLI.

## Review Focus

- Doble clic en "Generar guía" o dos pestañas a la vez → una sola llamada a Envia (Task 1: `runGenerate` con bloqueo de 0 filas; Task 3: dos `curl` en paralelo).
- Envia tarda o la red se cae después de mandar la petición → `review`, nunca `null` (Task 1: `generateLabel` con `fetch` que lanza/aborta y `runGenerate` con `send` que lanza o da `unknown`).
- El precio sube entre ver opciones y confirmar → se rechaza antes del bloqueo con el precio nuevo (Task 1: `checkRequote`).
- Pedido viejo sin `address_parts`, o dirección que el servidor rechaza → formulario prellenado y "Editar dirección" (Task 1: `validateAddress`; Task 5).
- Secretos LABEL faltantes o con otro host → "Las guías no están configuradas." sin llamar a Envia (Task 1: `labelConfig`).

---

## File Structure

- Create `supabase/functions/_shared/label.js` — lógica pura del pedido → guía y `runGenerate`.
- Modify `supabase/functions/_shared/envia.js` — `serviceCode` en `parseRates`; `buildLabelRequest`, `parseLabel`, `classifyGenerate`, `enviaErrorMessage`, `rejectLog`, `generateLabel`.
- Create `supabase/functions/shipping-label/index.js` — Edge Function.
- Modify `supabase/functions/README.md` — función nueva y secretos LABEL.
- Create `supabase/shipping-labels.sql` — columnas `label_*` y `shipping_settings.label_print_size`.
- Create `scripts/test-labels.mjs`; Modify `scripts/test-envia.mjs`, `scripts/test.mjs`.
- Modify `src/store/shipping.js` (llamadas a `shipping-label`), `src/store/orders.js` (leer un pedido, guardar campos de guía), `src/pages/admin/adminShipping.js` (formato, teléfono).
- Create `src/pages/admin/orderLabel.js` — bloque de guía; Modify `src/pages/admin/adminOrders.js` (lo monta en el detalle).

---

### Task 1: Lógica pura de la guía

**Files:**
- Create: `supabase/functions/_shared/label.js`
- Modify: `supabase/functions/_shared/envia.js`
- Test: Create `scripts/test-labels.mjs`; Modify `scripts/test-envia.mjs`, `scripts/test.mjs` (agregar `import './test-labels.mjs'`)

**Interfaces:**
- Consumes: `buildPackage`, `pickTiers`, `MX_STATES` de `_shared/shipping.js`; `enviaState` de `envia.js`.
- Produces (`label.js`):
  - `AddressParts = { street, numExt, numInt, neighborhood, city, state, stateName, zip, references }` (el objeto que guarda `place_order`).
  - `labelConfig(env: {ENVIA_LABEL_BASE_URL?, ENVIA_LABEL_API_KEY?}) => { baseUrl, apiKey, sandbox: boolean } | { error: 'Las guías no están configuradas.' }` — trim; `new URL()`; `protocol === 'https:'` y `host` exactamente `api-test.envia.com` (sandbox) o `api.envia.com`; `baseUrl` = `origin` sin `/` final.
  - `labelEligibility(order) => null | string` — en este orden: no domicilio → "Este pedido no es envío a domicilio."; `shipping_carrier === 'local'` → texto de entrega local; `status === 'cancelado'` → "El pedido está cancelado."; `label_status` `generating`/`review` → texto de duda (Global Constraints, con `orderRef`); `label_tracking` o `generated` → "Este pedido ya tiene guía.". `pendientedepago` no bloquea.
  - `validateAddress(parts) => { ok: true, address } | { ok: false, error }` — trim y quita `<>`; `street` 1–100, `numExt` 1–20, `numInt` 0–20, `neighborhood` 1–100, `city` 1–60, `zip` `/^\d{5}$/`, `references` 0–200; `state` en `MX_STATES` (`null`/vacío → fuera de México; otro → "Elige el estado."); `stateName` desde `MX_STATES`. Mensajes: "Revisa la calle.", "Revisa el número exterior.", "Revisa la colonia.", "Revisa la ciudad.", "El código postal debe tener 5 dígitos.", y "Captura la dirección del cliente." si `parts` no es objeto.
  - `receiverPhone(whatsapp) => string | null` — regla de `phoneKey`; solo 10 dígitos.
  - `senderError(origin) => null | string` — `origin.phone` solo dígitos de largo 10, si no el mensaje de Global Constraints; falta `street`/`city`/`postalCode` → "Completa la dirección del remitente en Admin → Envíos."
  - `packageFor(items, weights, settings, kind?) => { pkg } | { error }` — `items` = `orders.cart_items` (`{type, qty}`; sin `type` usa el valor por defecto). Sin `kind`: `buildPackage`. Con `kind`: mismos gramos, medidas de sobre o caja; sobre con gramos > `envelope.max_grams` → `"Pesa ${g} g: no cabe en sobre. Usa caja."`; > `box.max_grams` → "Pesa más de lo que aguanta la caja. Genera esta guía en el panel de Envia."
  - `defaultOption(options, { carrier, tier }) => number` — `pickTiers` sobre las opciones de `carrier` y toma `tier`; si no hay, sobre todas; si no, la más barata. `-1` si vacío. Pasar `{ ...o, price: o.cost, i }` a `pickTiers` y leer `i` del resultado (regresa copias).
  - `checkRequote(options, { serviceCode, expectedCost }, fmt) => { option } | { error }` — sin coincidencia de `serviceCode` → "Esa opción ya no está disponible. Vuelve a ver las opciones."; `option.cost > expectedCost + 1` → `"El precio cambió a ${fmt(cost)}. Vuelve a ver las opciones."`.
  - `costNote(cost, paid, free, fmt) => string | null` — copy de Global Constraints.
  - `orderRef(orderId) => 'GL-' + 8 primeros caracteres`.
  - `REVIEW_MSG(ref)`, el texto de duda.
  - `runGenerate({ ref, lock, build, send, save, unlock, markReview }) => Promise<{ label, saved: boolean } | { error, review?: true }>` — `lock(): Promise<boolean>`, `build(): body`, `send(body): Promise<{kind,…}>`, `save(label): Promise<void>` (lanza si falla), `unlock(): Promise<void>`, `markReview(trackingNumber|null): Promise<void>`. Secuencia de la Decisión 4: `lock` lanza → error de apartar, sin `send`; `false` → ya tiene guía, sin `send`; `build` lanza → `unlock`, "No se pudo preparar la guía. Intenta de nuevo."; `send` lanza o `unknown` → `markReview(tracking ?? null)` y `{ error: REVIEW_MSG(ref), review: true }`; `rejected` → `unlock`, `{ error: message }`; `ok` → `save` (un reintento) → `{ label, saved }`. Si `unlock`/`markReview` lanzan, se registra y se regresa el mismo error (el pedido queda en `generating` y vence en 2 min como duda).
- Produces (`envia.js`):
  - `parseRates` agrega `serviceCode: r.service`.
  - `buildLabelRequest({ origin, destination, pkg, carrier, serviceCode, printSize, orderRef }) => object` — `origin`/`destination` pasan por el `addr()` de tarifas (estado → código de Envia, `country: 'MX'`); `packages` igual que `rateCarrier`; `shipment: { type: 1, carrier, service: serviceCode, orderReference }`; `settings: { printFormat: 'PDF', printSize, currency: 'MXN' }`.
  - `parseLabel(json) => { trackingNumber, trackUrl, labelUrl, cost, carrier, service } | null` — de `json.data[0]`; `cost = Number(totalPrice)`; `null` si no hay `trackingNumber`. `labelUrl` puede ser null.
  - `classifyGenerate(status, json) => { kind: 'ok', label } | { kind: 'rejected', message } | { kind: 'unknown', trackingNumber? }` — `status` 2xx y `parseLabel` con `labelUrl` → `ok`; 2xx con rastreo sin URL → `unknown` con `trackingNumber`; `status >= 500`, `408`, `429` → `unknown`; otro 4xx, o `json.meta === 'error'`/`json.error` con status < 500 → `rejected`; lo demás (2xx sin guía, `json` null) → `unknown`.
  - `enviaErrorMessage(json) => string` — texto de `json.error.message ?? json.error.description ?? json.message` (string, recortado a 200); `/saldo|balance|fondos|insufficient|insuficiente/i` → saldo; con texto → "Envia no pudo generar la guía: …"; sin texto → genérico.
  - `rejectLog(status, json) => string` — `"status=400 meta=error code=1129 msg=<120 chars>"`, sin otros campos.
  - `generateLabel({ baseUrl, apiKey, body, fetchFn = fetch, timeoutMs = 30000 }) => Promise<classifyGenerate result>` — `POST ${baseUrl}/ship/generate/`, Bearer, `AbortController`; cualquier excepción (red, abort) → `{ kind: 'unknown' }`; cuerpo no-JSON → `classifyGenerate(status, null)`. Nunca lanza.

- [ ] **Step 1: Write the failing tests.** `scripts/test-labels.mjs`:

```js
import assert from 'node:assert/strict'
import { labelConfig, labelEligibility, validateAddress, receiverPhone, senderError, packageFor, defaultOption, checkRequote, costNote, orderRef, runGenerate } from '../supabase/functions/_shared/label.js'

const NC = { error: 'Las guías no están configuradas.' }
assert.deepEqual(labelConfig({ ENVIA_LABEL_BASE_URL: 'https://api-test.envia.com/', ENVIA_LABEL_API_KEY: 'k' }), { baseUrl: 'https://api-test.envia.com', apiKey: 'k', sandbox: true })
assert.equal(labelConfig({ ENVIA_LABEL_BASE_URL: 'https://api.envia.com', ENVIA_LABEL_API_KEY: 'k' }).sandbox, false)
assert.deepEqual(labelConfig({ ENVIA_LABEL_BASE_URL: 'https://api.envia.com', ENVIA_LABEL_API_KEY: ' ' }), NC)
assert.deepEqual(labelConfig({ ENVIA_LABEL_API_KEY: 'k' }), NC)
assert.deepEqual(labelConfig({ ENVIA_LABEL_BASE_URL: 'https://evil.com', ENVIA_LABEL_API_KEY: 'k' }), NC)
assert.deepEqual(labelConfig({ ENVIA_LABEL_BASE_URL: 'http://api.envia.com', ENVIA_LABEL_API_KEY: 'k' }), NC)
assert.deepEqual(labelConfig({ ENVIA_BASE_URL: 'https://api.envia.com', ENVIA_API_KEY: 'k' }), NC)   // nunca cae a los de cotizar

const ID = '0a1b2c3d-1111-2222-3333-444455556666'
const base = { id: ID, delivery_method: 'Envío a domicilio', shipping_carrier: 'estafeta', status: 'pendientedepago', label_status: null, label_tracking: null }
assert.equal(labelEligibility(base), null)                                            // sin pagar: se permite
assert.equal(labelEligibility({ ...base, delivery_method: 'Recoger en tienda' }), 'Este pedido no es envío a domicilio.')
assert.equal(labelEligibility({ ...base, shipping_carrier: 'local' }), 'Entrega local — la llevan ustedes.')
assert.equal(labelEligibility({ ...base, status: 'cancelado' }), 'El pedido está cancelado.')
assert.equal(labelEligibility({ ...base, label_tracking: '123' }), 'Este pedido ya tiene guía.')
assert.match(labelEligibility({ ...base, label_status: 'review' }), /GL-0a1b2c3d/)
assert.equal(labelEligibility({ ...base, shipping_carrier: null }), null)            // pedido viejo sin cotización

const A = { street: ' Av. México <b>', numExt: '12', numInt: '', neighborhood: 'Centro', city: 'Guadalajara', state: 'JAL', zip: '44100', references: '' }
const ok = validateAddress(A)
assert.equal(ok.ok, true); assert.equal(ok.address.street, 'Av. México b'); assert.equal(ok.address.stateName, 'Jalisco')
assert.equal(validateAddress({ ...A, zip: '4410' }).error, 'El código postal debe tener 5 dígitos.')
assert.equal(validateAddress({ ...A, state: null }).error, 'Este pedido es fuera de México. Genera la guía en el panel de Envia.')
assert.equal(validateAddress({ ...A, state: 'XX' }).error, 'Elige el estado.')
assert.equal(validateAddress({ ...A, street: '' }).error, 'Revisa la calle.')
assert.equal(validateAddress(null).error, 'Captura la dirección del cliente.')

assert.equal(receiverPhone('+52 1 312 123 4567'), '3121234567'); assert.equal(receiverPhone('312 123 4567'), '3121234567')
assert.equal(receiverPhone('+1 619 555 1234'), null); assert.equal(receiverPhone(''), null)

const origin = { name: 'G&L', phone: '3121234567', street: 'Zaragoza', number: '140', city: 'Colima', state: 'COL', postalCode: '28000' }
const NOPHONE = 'Falta el teléfono del remitente. Llénalo en Admin → Envíos.'
assert.equal(senderError(origin), null)
assert.equal(senderError({ ...origin, phone: ' ' }), NOPHONE)
assert.equal(senderError({ ...origin, phone: '312 123 4567' }), NOPHONE)                // solo dígitos

const S = { envelope: { length: 35, width: 25, height: 5, max_grams: 2000 }, box: { length: 40, width: 30, height: 20, max_grams: 10000 }, default_grams: 500, default_needs_box: true }
const W = { Playeras: { grams: 250, needs_box: false } }
assert.equal(packageFor([{ type: 'Playeras', qty: 2 }], W, S).pkg.kind, 'envelope')
assert.deepEqual(packageFor([{ type: 'Playeras', qty: 2 }], W, S, 'box').pkg, { kind: 'box', grams: 500, length: 40, width: 30, height: 20 })
assert.equal(packageFor([{ type: 'Playeras', qty: 9 }], W, S, 'envelope').error, 'Pesa 2250 g: no cabe en sobre. Usa caja.')
assert.equal(packageFor([{ qty: 1 }], W, S).pkg.grams, 500)                          // línea vieja sin type
assert.match(packageFor([{ type: 'Playeras', qty: 41 }], W, S, 'box').error, /panel de Envia/)

const o = (carrier, cost, days, serviceCode = 's') => ({ carrier, service: 'S', serviceCode, cost, days })
const opts = [o('estafeta', 150, 4), o('dhl', 180, 2), o('fedex', 200, 1), o('dhl', 260, 1, 'exp')]
assert.equal(defaultOption(opts, { carrier: 'dhl', tier: 'standard' }), 1)
assert.equal(defaultOption(opts, { carrier: 'dhl', tier: 'express' }), 3)
assert.equal(defaultOption(opts, { carrier: 'ups', tier: 'standard' }), 0)
assert.equal(defaultOption(opts, { carrier: null, tier: null }), 0)
assert.equal(defaultOption([], { carrier: 'dhl', tier: 'standard' }), -1)

const fmt = (n) => `$${n.toFixed(2)}`
assert.equal(checkRequote(opts, { serviceCode: 'exp', expectedCost: 260 }, fmt).option.cost, 260)
assert.equal(checkRequote(opts, { serviceCode: 'exp', expectedCost: 259.5 }, fmt).option.cost, 260)   // tolerancia de $1
assert.equal(checkRequote(opts, { serviceCode: 'exp', expectedCost: 250 }, fmt).error, 'El precio cambió a $260.00. Vuelve a ver las opciones.')
assert.equal(checkRequote(opts, { serviceCode: 'nope', expectedCost: 999 }, fmt).error, 'Esa opción ya no está disponible. Vuelve a ver las opciones.')

assert.equal(costNote(210, 190, false, fmt), 'Esta guía cuesta $20.00 más de lo que pagó el cliente.')
assert.equal(costNote(150, 190, false, fmt), null)
assert.equal(costNote(150, 0, true, fmt), 'El cliente tuvo envío gratis: la guía la paga la tienda ($150.00).')
assert.equal(costNote(230, 40, true, fmt), 'Envío gratis con Express: el cliente pagó $40.00 de diferencia y la tienda pone $190.00.')
assert.equal(costNote(150, null, false, fmt), 'Este pedido no tiene costo de envío registrado.')
assert.equal(orderRef(ID), 'GL-0a1b2c3d')

// runGenerate con dobles: registra qué se llamó
const LABEL = { trackingNumber: '7700', labelUrl: 'https://l/7700.pdf', cost: 210.5 }
const fake = (over = {}) => {
  const calls = []
  const f = { calls, ref: 'GL-0a1b2c3d',
    lock: async () => (calls.push('lock'), true), build: () => (calls.push('build'), {}),
    send: async () => (calls.push('send'), { kind: 'ok', label: LABEL }),
    save: async () => { calls.push('save') }, unlock: async () => { calls.push('unlock') },
    markReview: async (t) => { calls.push(`review:${t}`) }, ...over }
  return f
}
let f = fake({ lock: async () => false })
assert.equal((await runGenerate(f)).error, 'Este pedido ya tiene guía o se está generando.'); assert.ok(!f.calls.includes('send'))
f = fake({ lock: async () => { throw new Error('db') } })
assert.equal((await runGenerate(f)).error, 'No se pudo apartar el pedido. Intenta de nuevo.'); assert.ok(!f.calls.includes('send'))
f = fake({ build: () => { throw new Error('x') } })
assert.equal((await runGenerate(f)).error, 'No se pudo preparar la guía. Intenta de nuevo.'); assert.deepEqual(f.calls, ['lock', 'unlock'])
f = fake({ send: async () => ({ kind: 'rejected', message: 'No hay saldo suficiente en Envia. Recarga tu saldo y vuelve a intentar.' }) })
assert.match((await runGenerate(f)).error, /saldo/); assert.ok(f.calls.includes('unlock')); assert.ok(!f.calls.some(c => c.startsWith('review')))
f = fake({ send: async () => ({ kind: 'unknown', trackingNumber: '7700' }) })
let r = await runGenerate(f); assert.equal(r.review, true); assert.match(r.error, /GL-0a1b2c3d/); assert.ok(f.calls.includes('review:7700')); assert.ok(!f.calls.includes('unlock'))
f = fake({ send: async () => { throw new Error('boom') } })
assert.equal((await runGenerate(f)).review, true); assert.ok(f.calls.includes('review:null'))
f = fake()
assert.deepEqual(await runGenerate(f), { label: LABEL, saved: true })
let n = 0; f = fake({ save: async () => { if (n++ === 0) throw new Error('x') } })
assert.equal((await runGenerate(f)).saved, true)                                    // reintento único funciona
f = fake({ save: async () => { throw new Error('x') } })
r = await runGenerate(f); assert.equal(r.saved, false); assert.equal(r.label.trackingNumber, '7700')
console.log('test-labels ok')
```

In `scripts/test-envia.mjs`: update the existing `parseRates` `deepEqual` so each expected rate includes `serviceCode` (`'terrestre'`, `'dia_sig'`, `'raro'`), and append (the success fixture follows the documented `data[]` shape; the error fixture's shape is **not documented** — Task 3 replaces it with a real sandbox body):

```js
import { buildLabelRequest, parseLabel, classifyGenerate, enviaErrorMessage, rejectLog, generateLabel } from '../supabase/functions/_shared/envia.js'

const req = buildLabelRequest({ origin: { name: 'G&L', phone: '3121234567', street: 'Zaragoza', number: '140', city: 'Colima', state: 'COL', postalCode: '28000' },
  destination: { name: 'Ana', phone: '3331234567', street: 'Av. México', number: '12', district: 'Centro', city: 'Guadalajara', state: 'JAL', postalCode: '44100' },
  pkg: { kind: 'envelope', grams: 500, length: 35, width: 25, height: 5 }, carrier: 'dhl', serviceCode: 'express', printSize: 'PAPER_LETTER', orderRef: 'GL-0a1b2c3d' })
assert.equal(req.origin.state, 'CL'); assert.equal(req.destination.state, 'JA'); assert.equal(req.destination.country, 'MX')
assert.deepEqual(req.shipment, { type: 1, carrier: 'dhl', service: 'express', orderReference: 'GL-0a1b2c3d' })
assert.deepEqual(req.settings, { printFormat: 'PDF', printSize: 'PAPER_LETTER', currency: 'MXN' })
assert.equal(req.packages[0].type, 'envelope'); assert.equal(req.packages[0].weight, 0.5)

// Forma documentada de /ship/generate/ (docs.envia.com/reference/create-shipping-label)
const gen = { meta: 'generate', data: [{ carrier: 'dhl', service: 'express', shipmentId: 1, trackingNumber: '7700', trackUrl: 'https://t/7700', label: 'https://l/7700.pdf', additionalFiles: [], totalPrice: '210.50', currentBalance: 0, currency: 'MXN' }] }
assert.deepEqual(parseLabel(gen), { trackingNumber: '7700', trackUrl: 'https://t/7700', labelUrl: 'https://l/7700.pdf', cost: 210.5, carrier: 'dhl', service: 'express' })
assert.equal(classifyGenerate(200, gen).kind, 'ok')
assert.deepEqual(classifyGenerate(200, { data: [{ trackingNumber: '7701' }] }), { kind: 'unknown', trackingNumber: '7701' })
assert.equal(classifyGenerate(200, { meta: 'generate', data: [] }).kind, 'unknown')
for (const s of [502, 408, 429]) assert.equal(classifyGenerate(s, null).kind, 'unknown')
assert.equal(classifyGenerate(200, null).kind, 'unknown')
const err = { meta: 'error', error: { code: 1129, description: 'Error', message: 'Insufficient balance' } }   // forma supuesta
assert.deepEqual(classifyGenerate(400, err), { kind: 'rejected', message: 'No hay saldo suficiente en Envia. Recarga tu saldo y vuelve a intentar.' })
assert.equal(classifyGenerate(200, err).kind, 'rejected')
assert.equal(classifyGenerate(429, err).kind, 'unknown')
assert.equal(enviaErrorMessage({ meta: 'error', error: { message: 'Invalid service' } }), 'Envia no pudo generar la guía: Invalid service')
assert.equal(enviaErrorMessage({}), 'Envia no pudo generar la guía. Intenta de nuevo en unos minutos.')
assert.equal(rejectLog(400, err), 'status=400 meta=error code=1129 msg=Insufficient balance')

const args = { baseUrl: 'https://api-test.envia.com', apiKey: 'k', body: {} }
assert.deepEqual(await generateLabel({ ...args, fetchFn: async () => { throw new TypeError('network') } }), { kind: 'unknown' })
assert.deepEqual(await generateLabel({ ...args, timeoutMs: 10, fetchFn: (_u, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('abort')))) }), { kind: 'unknown' })
assert.equal((await generateLabel({ ...args, fetchFn: async () => new Response(JSON.stringify(gen), { status: 200 }) })).kind, 'ok')
assert.equal((await generateLabel({ ...args, fetchFn: async () => new Response('<html>', { status: 200 }) })).kind, 'unknown')
```

- [ ] **Step 2: Run `npm test`** — Expected: FAIL (`label.js` no existe / exports faltantes).
- [ ] **Step 3: Implement** `label.js` y los cambios de `envia.js` con las firmas de arriba. Sin APIs de Deno/Node/DOM a nivel de módulo (lo importan Node y Deno).
- [ ] **Step 4: Run `npm test`** — Expected: todo pasa, incluidos `test-labels ok`, `test-envia.mjs` y `test-shipping.mjs`.
- [ ] **Step 5: Commit** `feat(guias): lógica pura de guías y petición a Envia`

---

### Task 2: Columnas de guía en la base

**Files:**
- Create: `supabase/shipping-labels.sql`

**Interfaces:**
- Produces:
  - `orders`: `label_status text` (check `label_status in ('generating','generated','review')`, nombrado `orders_label_status_check`, con `drop constraint if exists` + `add constraint`), `label_locked_at timestamptz`, `label_tracking text`, `label_track_url text`, `label_url text`, `label_carrier text`, `label_service text`, `label_cost numeric`, `label_created_at timestamptz`, `label_sandbox boolean not null default false`.
  - `shipping_settings.label_print_size text not null default 'PAPER_LETTER' check (label_print_size in ('PAPER_LETTER','PAPER_4X6'))`.
  - Sin políticas ni triggers nuevos: `orders` ya es lectura/edición solo admin (`rls-hardening.sql`); la función escribe con service role.

- [ ] **Step 1: Escribir `supabase/shipping-labels.sql`** (`begin; ... commit;`, `add column if not exists`), cabecera: "Correr después de `shipping.sql`. Idempotente. Solo agrega columnas nulas: el sitio actual no cambia."
- [ ] **Step 2: Aplicar** con `apply_migration` (nombre `shipping_labels`). Verificar con `execute_sql`:
  - `select label_status, label_sandbox from orders limit 1;` → corre (null / false).
  - `select label_print_size from shipping_settings where id = 1;` → `PAPER_LETTER`.
  - `select conname from pg_constraint where conname = 'orders_label_status_check';` → 1 fila.
  - Volver a aplicar el archivo entero → sin error.
- [ ] **Step 3: Triggers de `orders`.** `select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.orders'::regclass and not tgisinternal;` Hoy existe `tr_notify_staff_on_order` (`after insert or update of status`): un `update` solo de `label_*` no lo dispara. Anotar la lista en el commit. Probar en una transacción que se deshace: `begin; update orders set label_status = 'generating', label_locked_at = now() where id = (select id from orders order by created_at desc limit 1); update orders set label_status = null, label_locked_at = null where id = (select id from orders order by created_at desc limit 1); rollback;` → sin error. **Repetir este paso cuando `fix/seguridad` se mezcle a `main`** (cambia triggers): si algún trigger nuevo se dispara en `update` de `orders` sin columna específica, confirmar que no bloquea al service role ni manda correos.
- [ ] **Step 4: Commit** `feat(guias): columnas de guía en orders y formato de impresión`

---

### Task 3: Edge Function `shipping-label`

**Files:**
- Create: `supabase/functions/shipping-label/index.js`
- Modify: `supabase/functions/README.md`

**Interfaces:**
- Consumes: Task 1 (`label.js`; `envia.js`: `rateCarrier`, `buildLabelRequest`, `generateLabel`, `rejectLog`), Task 2 (columnas), tablas de envío de la Parte 1, `coupons.free_shipping`.
- Produces: `POST /functions/v1/shipping-label`, `verify_jwt: true`, `Authorization: Bearer <sesión del admin>` (la manda `supabase.functions.invoke`).
  - Orden: `OPTIONS` → 204 con CORS (antes de cualquier chequeo); método ≠ POST → 405; token = `Authorization` sin el prefijo `Bearer `; `db.auth.getUser(token)` falla o sin usuario → `401 { error: 'auth' }` (la anon key cae aquí); `db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()` con el cliente service role, sin fila → `403 { error: 'forbidden' }`; luego validar body → `400 { error: 'body' }`. Todo lo demás `200`.
  - Body: `{ mode: 'rates'|'generate'|'release', orderId: uuid, kind?: 'envelope'|'box', address?: AddressParts, carrier?: string, serviceCode?: string, expectedCost?: number }`. `400` si `mode` no es de la lista, `orderId` no es UUID, `kind` no es `envelope|box|undefined`, `address` está y no es objeto; en `generate` además si `carrier` no está en `settings.carriers`, `serviceCode` no cumple `/^[\w.-]{1,60}$/` o `expectedCost` no es número finito ≥ 0.
  - `rates` → `{ options: [{ carrier, service, serviceCode, cost, days }], defaultIndex, package: { kind, grams }, paid: number|null, free: boolean, sandbox: boolean, address: AddressParts }` (ordenadas por `cost`; `paid = orders.shipping_cost`; `free = subtotal >= settings.free_shipping_min || coupons.free_shipping` del `coupon_code`), o `{ error, addressError?: true }`. Aquí sí va `cost`: lo paga la tienda y solo lo ve el admin.
  - `generate` → `{ label: { tracking, trackUrl, url, carrier, service, cost, sandbox }, saved: boolean }` o `{ error, review?: true, addressError?: true }`.
  - `release` → `{ ok: true }` o `{ error: 'No hay nada que liberar en este pedido.' }`. Un solo `update` con todas las columnas `label_*` a null (`label_sandbox = false`), `.eq('id', orderId).or('label_status.eq.review,label_status.eq.generated,and(label_status.eq.generating,label_locked_at.lt.<ISO de hace 2 min>)').select('id')`; 0 filas → el error.
- Flujo común de `rates`/`generate` (cliente service role `db`): `labelConfig(Deno.env.toObject())` → error, sin más → leer el pedido (`id, status, delivery_method, shipping_carrier, shipping_tier, shipping_cost, subtotal, coupon_code, customer_name, customer_whatsapp, customer_email, address_parts, cart_items, label_status, label_tracking`; no existe → "No encontramos el pedido.") → `labelEligibility` → ajustes + pesos → `senderError(settings.origin)` → `validateAddress(body.address ?? order.address_parts)` (error → `{ error, addressError: true }`) → teléfono: en sandbox `settings.origin.phone`, en producción `receiverPhone(customer_whatsapp)` (null → "El WhatsApp del cliente no es un número de México de 10 dígitos. Genera esta guía en el panel de Envia.") → `packageFor(cart_items, weights, settings, body.kind)`.
  - `rates`: `rateCarrier` por cada `settings.carriers` (`Promise.allSettled`), aplanar, ordenar, `defaultOption(options, { carrier: order.shipping_carrier, tier: order.shipping_tier })`. Sin opciones → "Envia no regresó opciones para este paquete. Intenta de nuevo o usa el panel de Envia."
  - `generate`: `rateCarrier` solo de `body.carrier`; si lanza → "No se pudo recotizar con Envia. Intenta de nuevo." (sin bloqueo) → `checkRequote(options, body, fmtMXN)` → `runGenerate` con:
    - `lock`: `update { label_status: 'generating', label_locked_at: now }` `.eq('id').is('label_status', null).is('label_tracking', null).select('id')` → lanza si `error`, regresa `data.length === 1`.
    - `build`: `buildLabelRequest` con `printSize: settings.label_print_size`, `orderRef`, destino `{ name: customer_name.slice(0, 60), phone, email (solo producción y si hay), street, number: numExt + (numInt ? ' Int. ' + numInt : ''), district: neighborhood, city, state, postalCode: zip, reference: references }`.
    - `send`: `generateLabel`; si `rejected`, `console.error('shipping-label', ref, carrier, rejectLog(status, json))` (exponer `status`/`json` en el resultado de `generateLabel` o registrar dentro; nunca el body enviado).
    - `save`: `update` con `label_status 'generated'`, `label_tracking`, `label_track_url`, `label_url`, `label_carrier` (carrier), `label_service` (descripción de la opción), `label_cost`, `label_created_at`, `label_sandbox`, y `address_parts` = dirección validada; `.eq('label_status', 'generating')`; lanza si `error`.
    - `unlock`: `update { label_status: null, label_locked_at: null }` `.eq('id').eq('label_status', 'generating')`.
    - `markReview(t)`: `update { label_status: 'review', label_tracking: t }` `.eq('id')`.
  - CORS: mismos orígenes y headers que `shipping-quote`. Logs: solo lo de Global Constraints.

- [ ] **Step 1: Implementar `index.js`** con el flujo de arriba, siguiendo el patrón de `shipping-quote/index.js` (cliente service role a nivel de módulo, `corsFor`, `json()`).
- [ ] **Step 2: README:** sección `shipping-label` (archivos: `shipping-label/index.js` + `_shared/shipping.js` + `_shared/envia.js` + `_shared/label.js`; solo admin; secretos obligatorios `ENVIA_LABEL_BASE_URL`/`ENVIA_LABEL_API_KEY`, sin ellos responde "Las guías no están configuradas."; sandbox = cuenta de sandbox de Envia aparte con paqueterías y saldo de prueba; producción = esos dos secretos con `https://api.envia.com` y la llave real).
- [ ] **Step 3: Desplegar** con `deploy_edge_function` (`shipping-label`, entrypoint `index.js`, `verify_jwt: true`, los 4 archivos). Sin secretos LABEL todavía: un `rates` debe responder "Las guías no están configuradas." Luego el dueño pone `ENVIA_LABEL_BASE_URL=https://api-test.envia.com` y `ENVIA_LABEL_API_KEY=<sandbox>`.
- [ ] **Step 4: Pedidos de prueba.** Crearlos con `place_order` usando un producto con **stock ilimitado** (`stock_unlimited`; en `cart_items` queda `productId: null`, así borrar el pedido no deja stock descontado; el plan de seguridad quita el trigger de stock, así que no hay que contar con él para regresarlo) y los **datos del dueño** (su nombre, su WhatsApp, sin correo), CP 44100, una playera. **Avisar al dueño antes:** cada pedido nuevo manda el correo "nuevo pedido" a la lista de `order_notify_emails`. Limpieza al final: `release` de cada guía, `delete from orders where id in (...)`, y borrar las filas de `shipping_quotes` que se usaron.
- [ ] **Step 5: Verificar** con el JWT de un admin (de su sesión en el navegador), salvo donde se indica:
  - `OPTIONS` sin `Authorization` → 204 con CORS. Con la anon key → `401` en los 3 modos.
  - **403 obligatorio:** crear un usuario de auth desechable (Dashboard → Authentication → Add user), iniciar sesión con él para tener su JWT, llamar `rates`, `generate` y `release` → `403` en los tres; borrar el usuario.
  - `orderId: 'x'` → `400`.
  - `rates` → opciones con `cost`, `defaultIndex` en la paquetería del pedido, `sandbox: true`.
  - `generate` con `serviceCode` inventado → "Esa opción ya no está disponible…"; con `expectedCost` 10 pesos debajo del costo → "El precio cambió a $Y…"; en ambos el pedido sigue sin `label_status`.
  - **Error real de Envia:** una petición que pase la recotización pero falle al generar (p. ej. `address.street` de 300 caracteres o `numExt` vacío saltándose la validación en una prueba temporal, o un `printSize` que la paquetería no acepte) → mensaje en español y `label_status` vuelve a null. Copiar del log (`rejectLog`) y de la respuesta cruda el cuerpo real al fixture de `test-envia.mjs`; ajustar `enviaErrorMessage`/`classifyGenerate` si la forma no coincide.
  - `generate` válido → `label.url` abre un PDF tamaño carta; la fila tiene `generated`, `label_sandbox true`, `label_cost`.
  - Dos `generate` en paralelo sobre otro pedido de prueba → uno con guía, el otro "ya tiene guía o se está generando"; en el panel sandbox de Envia hay **una** guía con referencia `GL-…`.
  - `ENVIA_LABEL_BASE_URL=https://evil.com` → "Las guías no están configuradas." sin llamada.
  - Host que no responde: no se puede con la validación de host; probar el camino `review` con la prueba unitaria de Task 1 y, en vivo, forzando `timeoutMs` bajo en un despliegue temporal **solo si** el controlador lo considera necesario.
  - `release` de `review` y de `generated` → limpia; `release` de un pedido sin guía → "No hay nada que liberar…".
  - Formatos: confirmar primero el host (`https://queries.test.envia.com` según la doc; si no resuelve, probar `https://queries-test.envia.com`) y llamar `GET /carrier-print-option?carrier_id=<id>` (Bearer sandbox) por cada paquetería activa; anotar en el README cuáles aceptan `PDF`+`PAPER_LETTER` y `PDF`+`PAPER_4X6`. Si alguna activa no acepta carta, avisar al dueño (no cambiar código).
  - Limpieza del Step 4.
- [ ] **Step 6: Commit** `feat(guias): Edge Function shipping-label (solo admin, con bloqueo)`

---

### Task 4: Admin — formato de impresión y teléfono en Envíos

**Files:**
- Modify: `src/pages/admin/adminShipping.js`

**Interfaces:**
- Consumes: `shipping_settings.label_print_size` (Task 2), `saveShippingSettings` existente.

- [ ] **Step 1:** Sección nueva "Guías" con `<select name="label_print_size">`: `PAPER_LETTER` → "Hoja carta (PDF)" (por defecto), `PAPER_4X6` → "Etiqueta 4×6 (PDF)"; nota: "Las dos se imprimen en impresora normal." Bajo el teléfono del remitente: "10 dígitos. Lo pide la paquetería para generar guías." Al guardar: teléfono = solo dígitos (`replace(/\D/g, '')`), debe tener 10 → si no, "El teléfono del remitente debe tener 10 dígitos."; `label_print_size` debe ser uno de los dos.
- [ ] **Step 2: Verificación manual** (`npm run dev`, admin): cambiar a 4×6, guardar, recargar → queda; volver a carta; teléfono "312 123 4567" se guarda como `3121234567`. `npm test` y `npm run build` pasan.
- [ ] **Step 3: Commit** `feat(guias): formato de impresión y teléfono del remitente en ajustes`

---

### Task 5: Admin — bloque "Guía" en el detalle del pedido

**Files:**
- Create: `src/pages/admin/orderLabel.js`
- Modify: `src/store/shipping.js`, `src/store/orders.js`, `src/pages/admin/adminOrders.js` (detalle, bajo el formulario "Costo de envío")

**Interfaces:**
- Consumes: `shipping-label` (Task 3); `costNote`, `orderRef`, `REVIEW_MSG` (Task 1); `MX_STATES`; `carrierName` de `../checkout/shippingBlock.js`; `formatMoney`, `showToast`, `escapeHtml`, `ICON`, `confirmDelete`.
- Produces:
  - `src/store/shipping.js`: `labelAction(body) => Promise<data | { error: string }>` — `ensureAdminAccess`, `supabase.functions.invoke('shipping-label', { body, timeout: 70000 })`; `error.context?.status` 401/403 → `{ error: 'Tu sesión no tiene permiso para generar guías. Vuelve a entrar.' }`; cualquier otro error o excepción → `{ error: 'No se pudo conectar con el servidor de guías. Revisa el pedido antes de volver a intentar.' }`.
  - `src/store/orders.js`: `getAdminOrder(id) => Promise<order | null>` (un `select('*').eq('id', id).single()`), `saveOrderLabelFields(id, fields)` (usa `updateAdminOrder`).
  - `orderLabel.js`: `labelBlockHtml(order) => string`, `mountLabelBlock(rootEl, order, onChange: (order) => void)`. `adminOrders.js` pinta `labelBlockHtml(order)` y llama `mountLabelBlock(content.querySelector('[data-label-block]'), order, (o) => { ordersById.set(String(o.id), o); openOrderDetails(o.id) })`.

- [ ] **Step 1: Estados del bloque** (`<section data-label-block aria-live="polite">`, estilo `bg-paper rounded-xl2 border border-line p-4`), calculados **solo** de las columnas del pedido:
  - No es envío a domicilio → `''`. `shipping_carrier === 'local'` → "Entrega local — la llevan ustedes."
  - `generated` → `carrierName(label_carrier) · label_service`, rastreo con "Copiar" (`navigator.clipboard`), "Imprimir guía" (`<a target="_blank" rel="noopener">`, solo si `label_url` cumple `/^https:\/\//`), `formatMoney(label_cost)`. Si `label_sandbox`: aviso fijo "Guía de prueba: no sirve para enviar" arriba del bloque y junto a "Imprimir guía", y botón "Quitar guía de prueba" (`release`). Si no: enlace discreto "Quitar guía" → `confirmDelete` con "Solo si ya cancelaste esta guía en el panel de Envia." → `release`.
  - `review`, o `generating` con `label_locked_at` de hace más de 2 min → `REVIEW_MSG(orderRef(id))` (+ rastreo si hay) y botón "Ya revisé en Envia, liberar" (`confirmDelete`: "Si la guía sí se creó, no la vuelvas a generar: cópiala del panel de Envia.").
  - `generating` reciente → "Generando guía…" sin botones.
  - Sin guía → botón "Generar guía".
- [ ] **Step 2: Flujo "Generar guía".**
  - Formulario de dirección (calle, número, int., colonia, ciudad, estado `<select>` con `MX_STATES`, CP, referencias; todos con `<label>`; `order.address` arriba como referencia) cuando `address_parts` es null **o** la respuesta trae `addressError`; prellenado con `address_parts` o con lo último capturado. En la vista de opciones, enlace "Editar dirección" que lo abre.
  - "Ver opciones" → `labelAction({ mode: 'rates', orderId, address?, kind? })` → radios (`role="radiogroup"`): `carrierName(carrier) · service`, "N días" si hay, `formatMoney(cost)`; preseleccionado `defaultIndex`. "Sobre / Caja" preseleccionado con `package.kind`; al cambiar vuelve a pedir `rates`. Debajo: `costNote(cost, paid, free, formatMoney)`; si `status === 'pendientedepago'`, "Este pedido aún no está marcado como pagado."; si `sandbox`, "Guía de prueba: no sirve para enviar".
  - Botón de confirmar con el copy de Global Constraints (sandbox / producción) → deshabilitado al primer clic → `labelAction({ mode: 'generate', orderId, carrier, serviceCode, kind, expectedCost: cost, address? })`.
  - Éxito con `saved: true` → `getAdminOrder(id)` → `onChange(fila)`; toast "Guía generada".
  - Éxito con `saved: false` → `saveOrderLabelFields(id, { label_status: 'generated', label_tracking, label_track_url, label_url, label_carrier, label_service, label_cost, label_created_at, label_sandbox })` una vez; si falla, toast de error "La guía se creó pero no se guardó. Anota el rastreo: <n>" y dejar el rastreo visible; luego `getAdminOrder` → `onChange`.
  - Cualquier `{ error }` → mensaje en `role="alert"`; **siempre** `getAdminOrder(id)` y repintar desde su `label_status` (nunca desde memoria): si sigue sin guía, el botón vuelve a estar activo; si quedó en `review`, se ve el estado de duda. `addressError` abre el formulario.
- [ ] **Step 3: Escapado.** Todo valor del pedido o de Envia pasa por `esc()`; `npm test` (incluye `test-admin-escaping.mjs`) pasa.
- [ ] **Step 4: Verificación manual** (`npm run dev` contra la función en sandbox, pedidos de prueba de Task 3 Step 4 y su limpieza): paquetería del cliente preseleccionada; caja → recotiza; `shipping_cost` menor que la guía → aviso; pedido con cupón de envío gratis y Express → copy de "Envío gratis con Express"; generar → rastreo copiable, aviso de prueba junto a "Imprimir guía", el PDF abre; doble clic → una guía; pedido sin `address_parts` → formulario, CP de 4 dígitos → "El código postal debe tener 5 dígitos." y el formulario queda prellenado; entrega local → texto sin botón; "Recoger en tienda" → sin bloque; teléfono del remitente vacío → mensaje; "Quitar guía de prueba" → vuelve a "Generar guía". `npm test` y `npm run build` pasan.
- [ ] **Step 5: Commit** `feat(guias): generar e imprimir guías desde el detalle del pedido`

---

## Despliegue (orden; el sitio viejo funciona en cada paso)

1. **SQL** (Task 2): solo columnas nulas y un ajuste con default; el sitio actual las ignora.
2. **Función** (Task 3): `deploy_edge_function` sin secretos LABEL (responde "no configuradas"); luego el dueño pone los de sandbox. Nadie la llama todavía. `shipping-quote` no se redespliega.
3. **Frontend** (Tasks 4–5): merge a `main` → Vercel. En sandbox el admin ve "Guía de prueba".
4. **Producción** (cuando el dueño tenga saldo): quitar las guías de prueba de pedidos reales ("Quitar guía de prueba"); el dueño cambia los secretos a `ENVIA_LABEL_BASE_URL=https://api.envia.com` y `ENVIA_LABEL_API_KEY=<producción>`; primera guía real con un pedido pagado y comparar el cargo con el panel de Envia.
5. Después de que `fix/seguridad` se mezcle: repetir Task 2 Step 3.
