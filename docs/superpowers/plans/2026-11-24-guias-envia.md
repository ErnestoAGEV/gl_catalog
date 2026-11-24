# Guías de Envia desde el admin (Parte 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desde Admin → Pedidos, la tienda genera y paga la guía de Envia de un pedido "Envío a domicilio", sin intermediario y sin poder generarla dos veces.

**Architecture:** Lógica pura nueva en `supabase/functions/_shared/label.js` (paquete, dirección, remitente, opción por defecto) y en `_shared/envia.js` (armar la petición `POST /ship/generate/` y leer su respuesta), probada con `node:assert`. Una Edge Function `shipping-label` (solo admin: JWT + `admin_users` en el servidor) con tres modos: `rates` (recotiza), `generate` (bloquea el pedido con un `update` condicional, llama a Envia, guarda) y `release` (libera un bloqueo dudoso o una guía de prueba). El admin la usa desde un bloque nuevo en el detalle del pedido (`src/pages/admin/orderLabel.js`).

**Tech Stack:** Vite + JS vanilla, Supabase (Postgres, Edge Functions en Deno con `npm:@supabase/supabase-js@2`), Envia.com API, pruebas `node:assert` vía `npm test`.

**Spec:** `docs/superpowers/specs/2026-11-24-cotizador-envios-design.md` (secciones Objetivos/Admin, `shipping-label`, Fallas que no se aceptan, Decisiones tras la revisión). Convenciones: `docs/superpowers/plans/2026-11-24-cotizador-envios-parte1.md`.

**Fuera de este plan:** cancelar guías (se hace en el panel de Envia), rastreo para el cliente, multipaquete, guías fuera de México, poda de `shipping_quotes` (es del plan de seguridad, rama `fix/seguridad`).

## Decisiones (y por qué)

1. **Sandbox por secretos aparte, no "modo prueba" por petición.** `shipping-label` usa `ENVIA_LABEL_BASE_URL` / `ENVIA_LABEL_API_KEY`; si no existen, cae a `ENVIA_BASE_URL` / `ENVIA_API_KEY` (producción hoy). Mientras el dueño no tenga saldo, el controlador pone en los LABEL la llave de sandbox (`https://api-test.envia.com`); para salir a producción se borran los dos secretos. Por qué: un flag que manda el navegador decidiría desde el cliente si se gasta dinero (y un error de UI generaría guías reales); el secreto lo cambia solo quien despliega, y el checkout (`shipping-quote`) sigue cotizando en producción sin tocarse. Recotizar y generar usan el **mismo** par, porque los códigos de servicio del sandbox y de producción pueden no coincidir.
2. **Guías de prueba marcadas.** Si la URL base contiene `api-test`, el pedido guarda `label_sandbox = true`; el admin la muestra como "Guía de prueba" y deja quitarla (`release`), para que una prueba sobre un pedido real no le bloquee la guía real.
3. **PDF: solo la URL de Envia, sin copiar a Storage.** `orders` ya es solo-admin por RLS, así que la URL (larga, no adivinable) solo la ve el admin; Envia ya guarda esos datos del cliente, y copiarlos a un bucket duplica datos personales y agrega código, un bucket y políticas. Si la URL vence (no documentado), la guía se descarga desde el panel de Envia con el número de rastreo o la referencia `GL-<8 primeros del id>`.
4. **Bloqueo contra doble cargo.** `label_status` (`null` → `generating` → `generated`, o `review`). Antes de llamar a Envia, un solo `update ... where id = $1 and label_status is null and label_tracking is null returning id` (atómico en Postgres; si regresa 0 filas, otro ya lo tomó). Al terminar:
   - Envia respondió con error claro (4xx, o cuerpo `meta: "error"`) → no se creó guía → se regresa a `null` (pedido sin cambios) y se muestra el mensaje.
   - Timeout, red caída, 5xx o 2xx sin guía legible → **no se sabe** si se cobró → `review`; el admin ve "Revisa en tu panel de Envia con la referencia GL-xxxx" y solo después de revisar puede liberar. Nunca se reintenta solo.
   - Éxito pero falla guardar → se reintenta el `update` una vez; si vuelve a fallar se queda en `generating` y la respuesta trae el número de rastreo para anotarlo.
   - `shipment.orderReference = 'GL-<8>'` en cada guía, para encontrarla en el panel.
5. **Formato de impresión.** El dueño imprime en impresora normal: por defecto **PDF tamaño carta** (`printFormat: 'PDF'`, `printSize: 'PAPER_LETTER'`). Ajuste en Admin → Envíos con una segunda opción **PDF 4×6** (`PAPER_4X6`), que también sale en impresora normal. Envia acepta `printFormat` `PDF|PNG|ZPL|ZPLII|EPL` y `printSize` `PAPER_4X6|PAPER_7X4.75|STOCK_4X6|PAPER_LETTER` ([docs](https://docs.envia.com/reference/create-shipping-label)), pero cada paquetería tiene sus propias opciones ([carrier-print-option](https://docs.envia.com/reference/carrier-print-options.md)); el ejemplo de FedEx no lista `PAPER_LETTER`. Se verifica en el despliegue (Task 3, Step 4); si una paquetería rechaza el tamaño, el mensaje pide cambiar el formato en Admin → Envíos.
6. **Nunca se confía en precios del navegador.** `generate` recibe solo `carrier` + `serviceCode` + empaque; el servidor recotiza esa paquetería y exige que el servicio exista. Lo que se guarda como `label_cost` es el `totalPrice` que regresa `/ship/generate/`.
7. **Código de servicio.** Hoy `parseRates` guarda en `service` la descripción ("Terrestre"); `/ship/generate/` pide el código (`service` de la tarifa, p. ej. `ground`). `parseRates` agrega `serviceCode` (campo extra; `shipping-quote` no cambia de comportamiento y no hace falta redesplegarla).

## Global Constraints

- Solo pedidos `delivery_method = 'Envío a domicilio'`, `shipping_carrier` distinto de `'local'`, `status <> 'cancelado'`, sin guía (`label_status is null and label_tracking is null`).
- `shipping_carrier = 'local'` → sin botón; texto exacto **"Entrega local — la llevan ustedes."**
- Remitente = `shipping_settings.origin`; si `origin.phone` está vacío → **"Falta el teléfono del remitente. Llénalo en Admin → Envíos."**
- Destinatario: `customer_name`, teléfono = `customer_whatsapp` a 10 dígitos (misma regla que `phoneKey` de `src/utils/phone.js`), `customer_email` si hay, `address_parts`. `address_parts.state` null (fuera de México) → **"Este pedido es fuera de México. Genera la guía en el panel de Envia."**
- Saldo insuficiente → **"No hay saldo suficiente en Envia. Recarga tu saldo y vuelve a intentar."**; cualquier otro rechazo → **"Envia no pudo generar la guía: <mensaje de Envia>"** (sin mensaje: **"Envia no pudo generar la guía. Intenta de nuevo en unos minutos."**). En ambos casos el pedido queda sin cambios.
- Aviso de costo (spec): cost > pagado y pagado > 0 → **"Esta guía cuesta $X más de lo que pagó el cliente."**; pagado = 0 → **"El cliente tuvo envío gratis: la guía la paga la tienda ($X)."**; `shipping_cost` null → **"Este pedido no tiene costo de envío registrado."**
- Copy: serio, cercano, tuteo, sin "¡". Todo dato del cliente pintado con `esc()` (lo revisa `scripts/test-admin-escaping.mjs`).
- La llave de Envia nunca sale de la función; los logs no llevan nombre, teléfono, correo ni dirección (solo id corto del pedido, paquetería y código de error).
- SQL idempotente; compatible con el plan de seguridad (no depende de escrituras `anon`; la función escribe con service role).
- Edge Functions se despliegan con el MCP de Supabase (`deploy_edge_function`), SQL con `apply_migration`. No hay CLI.

## Review Focus

- Doble clic en "Generar guía" o dos admins a la vez → solo una llamada a Envia; la otra recibe "Este pedido ya tiene guía o se está generando." (Task 3, Step 4: dos `curl` en paralelo).
- Envia tarda más de 30 s o la red se cae después de enviar la petición → `review`, nunca `null`; no se puede volver a generar sin liberar a mano (Task 1: `classifyGenerate`; Task 3: host que no responde).
- El servicio que eligió el admin ya no aparece al recotizar (cambió el precio o la paquetería) → error "Esa opción ya no está disponible. Vuelve a ver las opciones." y no se genera (Task 3, Step 4).
- Pedido viejo sin `address_parts`, o con CP de 4 dígitos/estado vacío capturado a mano → formulario; la validación del servidor rechaza con mensaje por campo (Task 1: `validateAddress`).
- Admin elige "sobre" para un pedido que pesa más que el máximo del sobre → mensaje "Pesa X g: no cabe en sobre. Usa caja." (Task 1: `packageFor`).

---

## File Structure

- Create `supabase/functions/_shared/label.js` — lógica pura del pedido → guía.
- Modify `supabase/functions/_shared/envia.js` — `serviceCode` en `parseRates`; `buildLabelRequest`, `parseLabel`, `classifyGenerate`, `generateLabel`.
- Create `supabase/functions/shipping-label/index.js` — Edge Function.
- Modify `supabase/functions/README.md` — función nueva y secretos LABEL.
- Create `supabase/shipping-labels.sql` — columnas `label_*` y `shipping_settings.label_print_size`.
- Create `scripts/test-labels.mjs`; Modify `scripts/test-envia.mjs`, `scripts/test.mjs`.
- Modify `src/store/shipping.js` (llamadas a `shipping-label`), `src/pages/admin/adminShipping.js` (formato de impresión).
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
  - `AddressParts = { street, numExt, numInt, neighborhood, city, state, stateName, zip, references }` (mismo objeto que guarda `place_order`).
  - `labelEligibility(order) => null | string` — `null` si se puede generar; si no, el mensaje (orden de chequeo: no domicilio → "Este pedido no es envío a domicilio."; `shipping_carrier === 'local'` → texto de entrega local; `status === 'cancelado'` → "El pedido está cancelado."; `label_status === 'generating'` → "Se está generando la guía de este pedido."; `label_status === 'review'` → "Revisa en tu panel de Envia si ya se creó la guía de este pedido antes de volver a intentar."; `label_tracking` o `label_status === 'generated'` → "Este pedido ya tiene guía.").
  - `validateAddress(parts) => { ok: true, address: AddressParts } | { ok: false, error: string }` — trim y quita `<>`; `street` 1–100, `numExt` 1–20, `numInt` 0–20, `neighborhood` 1–100, `city` 1–60, `zip` `/^\d{5}$/`, `references` 0–200; `state` debe ser un `code` de `MX_STATES` (`null`/vacío → mensaje de fuera de México; otro valor → "Elige el estado."). `stateName` se rellena desde `MX_STATES`. Error por campo: "Revisa la calle.", "Revisa el número exterior.", "Revisa la colonia.", "Revisa la ciudad.", "El código postal debe tener 5 dígitos.".
  - `receiverPhone(whatsapp) => string | null` — 10 dígitos mexicanos con la regla de `phoneKey`; otro largo → `null`.
  - `senderError(origin) => null | string` — teléfono vacío → mensaje de Global Constraints; falta `street`/`city`/`postalCode` → "Completa la dirección del remitente en Admin → Envíos."
  - `packageFor(items, weights, settings, kind?) => { pkg } | { error }` — `items` = `orders.cart_items` (`{type, qty}`; `type` faltante usa el valor por defecto). Sin `kind`: `buildPackage`. Con `kind`: mismos gramos, medidas del sobre o la caja; `envelope` y gramos > `envelope.max_grams` → `"Pesa ${g} g: no cabe en sobre. Usa caja."`; cualquier caso > `box.max_grams` → "Pesa más de lo que aguanta la caja. Genera esta guía en el panel de Envia."
  - `defaultOption(options, { carrier, tier }) => number` — índice: aplica `pickTiers` a las opciones de `carrier` y toma `tier`; si no hay, `pickTiers` sobre todas y toma `tier`; si no, la más barata (`0` si vienen ordenadas por costo). `-1` si `options` está vacío. (`options` usan `cost` como precio de Envia; pasar `{...o, price: o.cost, i}` a `pickTiers` y leer el índice `i` del resultado: `pickTiers` regresa copias, no las mismas referencias.)
  - `costNote(cost, paid, fmt) => string | null` — copy exacto de Global Constraints; `fmt` = formateador de dinero que pasa quien llama.
  - `orderRef(orderId) => 'GL-' + primeros 8 caracteres`.
- Produces (`envia.js`):
  - `parseRates` agrega `serviceCode: r.service` a cada tarifa (el resto igual).
  - `buildLabelRequest({ origin, destination, pkg, carrier, serviceCode, printSize, orderRef }) => object` — cuerpo de `/ship/generate/`: `origin`/`destination` pasan por el mismo `addr()` que tarifas (estado → código de Envia, `country: 'MX'`); `packages` igual que `rateCarrier`; `shipment: { type: 1, carrier, service: serviceCode, orderReference }`; `settings: { printFormat: 'PDF', printSize, currency: 'MXN' }`.
  - `parseLabel(json) => { trackingNumber, trackUrl, labelUrl, cost, carrier, service } | null` — de `json.data[0]` (`trackingNumber`, `trackUrl`, `label`, `totalPrice`, `carrier`, `service`); `null` si falta `trackingNumber` o `label`.
  - `enviaErrorMessage(json) => string` — texto de `json.error.message ?? json.error.description ?? json.message` (string, recortado a 200); si coincide `/saldo|balance|fondos|insufficient|insuficiente/i` → mensaje de saldo; con texto → "Envia no pudo generar la guía: …"; sin texto → genérico.
  - `classifyGenerate(status, json) => { kind: 'ok', label } | { kind: 'rejected', message } | { kind: 'unknown' }` — `parseLabel` válido y 2xx → `ok`; `status >= 500` → `unknown`; 4xx, o `json.meta === 'error'`, o `json.error` → `rejected`; cualquier otro (2xx sin guía, JSON ilegible = `json` null) → `unknown`.
  - `generateLabel({ baseUrl, apiKey, body }) => Promise<classifyGenerate result>` — `POST ${baseUrl}/ship/generate/`, Bearer, timeout 30 s con `AbortController`; excepción de red o abort → `{ kind: 'unknown' }`; respuesta no-JSON → `classifyGenerate(status, null)`.

- [ ] **Step 1: Write the failing tests.** `scripts/test-labels.mjs`:

```js
import assert from 'node:assert/strict'
import { labelEligibility, validateAddress, receiverPhone, senderError, packageFor, defaultOption, costNote, orderRef } from '../supabase/functions/_shared/label.js'

const base = { delivery_method: 'Envío a domicilio', shipping_carrier: 'estafeta', status: 'pendientedepago', label_status: null, label_tracking: null }
assert.equal(labelEligibility(base), null)
assert.equal(labelEligibility({ ...base, delivery_method: 'Recoger en tienda' }), 'Este pedido no es envío a domicilio.')
assert.equal(labelEligibility({ ...base, shipping_carrier: 'local' }), 'Entrega local — la llevan ustedes.')
assert.equal(labelEligibility({ ...base, status: 'cancelado' }), 'El pedido está cancelado.')
assert.equal(labelEligibility({ ...base, label_tracking: '123' }), 'Este pedido ya tiene guía.')
assert.match(labelEligibility({ ...base, label_status: 'review' }), /panel de Envia/)
assert.equal(labelEligibility({ ...base, shipping_carrier: null }), null)            // pedido viejo sin cotización

const A = { street: ' Av. México <b>', numExt: '12', numInt: '', neighborhood: 'Centro', city: 'Guadalajara', state: 'JAL', zip: '44100', references: '' }
const ok = validateAddress(A)
assert.equal(ok.ok, true); assert.equal(ok.address.street, 'Av. México b'); assert.equal(ok.address.stateName, 'Jalisco')
assert.equal(validateAddress({ ...A, zip: '4410' }).error, 'El código postal debe tener 5 dígitos.')
assert.equal(validateAddress({ ...A, state: null }).error, 'Este pedido es fuera de México. Genera la guía en el panel de Envia.')
assert.equal(validateAddress({ ...A, state: 'XX' }).error, 'Elige el estado.')
assert.equal(validateAddress({ ...A, street: '' }).error, 'Revisa la calle.')
assert.equal(validateAddress(null).ok, false)

assert.equal(receiverPhone('+52 1 312 123 4567'), '3121234567'); assert.equal(receiverPhone('312 123 4567'), '3121234567')
assert.equal(receiverPhone('+1 619 555 1234'), null); assert.equal(receiverPhone(''), null)

const origin = { name: 'G&L', phone: '3121234567', street: 'Zaragoza', number: '140', city: 'Colima', state: 'COL', postalCode: '28000' }
assert.equal(senderError(origin), null)
assert.equal(senderError({ ...origin, phone: ' ' }), 'Falta el teléfono del remitente. Llénalo en Admin → Envíos.')

const S = { envelope: { length: 35, width: 25, height: 5, max_grams: 2000 }, box: { length: 40, width: 30, height: 20, max_grams: 10000 }, default_grams: 500, default_needs_box: true }
const W = { Playeras: { grams: 250, needs_box: false } }
assert.equal(packageFor([{ type: 'Playeras', qty: 2 }], W, S).pkg.kind, 'envelope')
assert.deepEqual(packageFor([{ type: 'Playeras', qty: 2 }], W, S, 'box').pkg, { kind: 'box', grams: 500, length: 40, width: 30, height: 20 })
assert.equal(packageFor([{ type: 'Playeras', qty: 9 }], W, S, 'envelope').error, 'Pesa 2250 g: no cabe en sobre. Usa caja.')
assert.equal(packageFor([{ qty: 1 }], W, S).pkg.grams, 500)                          // línea vieja sin type
assert.match(packageFor([{ type: 'Playeras', qty: 41 }], W, S, 'box').error, /panel de Envia/)

const o = (carrier, cost, days) => ({ carrier, service: 's', serviceCode: 's', cost, days })
const opts = [o('estafeta', 150, 4), o('dhl', 180, 2), o('fedex', 200, 1), o('dhl', 260, 1)]
assert.equal(defaultOption(opts, { carrier: 'dhl', tier: 'standard' }), 1)
assert.equal(defaultOption(opts, { carrier: 'dhl', tier: 'express' }), 3)
assert.equal(defaultOption(opts, { carrier: 'ups', tier: 'standard' }), 0)             // ya no está su paquetería
assert.equal(defaultOption(opts, { carrier: null, tier: null }), 0)
assert.equal(defaultOption([], { carrier: 'dhl', tier: 'standard' }), -1)

const fmt = (n) => `$${n.toFixed(2)}`
assert.equal(costNote(210, 190, fmt), 'Esta guía cuesta $20.00 más de lo que pagó el cliente.')
assert.equal(costNote(150, 190, fmt), null)
assert.equal(costNote(150, 0, fmt), 'El cliente tuvo envío gratis: la guía la paga la tienda ($150.00).')
assert.equal(costNote(150, null, fmt), 'Este pedido no tiene costo de envío registrado.')
assert.equal(orderRef('0a1b2c3d-1111-2222-3333-444455556666'), 'GL-0a1b2c3d')
console.log('test-labels ok')
```

Append to `scripts/test-envia.mjs` (the success fixture follows the documented `data[]` shape; the error fixture's shape is **not documented** — Task 3, Step 4 replaces it with a real sandbox error):

```js
import { buildLabelRequest, parseLabel, classifyGenerate, enviaErrorMessage } from '../supabase/functions/_shared/envia.js'
assert.equal(parseRates(fixture, 'estafeta')[0].serviceCode, 'terrestre')

const req = buildLabelRequest({ origin: { name: 'G&L', phone: '3121234567', street: 'Zaragoza', number: '140', city: 'Colima', state: 'COL', postalCode: '28000' },
  destination: { name: 'Ana', phone: '3331234567', street: 'Av. México', number: '12', district: 'Centro', city: 'Guadalajara', state: 'JAL', postalCode: '44100' },
  pkg: { kind: 'envelope', grams: 500, length: 35, width: 25, height: 5 }, carrier: 'dhl', serviceCode: 'express', printSize: 'PAPER_LETTER', orderRef: 'GL-0a1b2c3d' })
assert.equal(req.origin.state, 'CL'); assert.equal(req.destination.state, 'JA'); assert.equal(req.destination.country, 'MX')
assert.deepEqual(req.shipment, { type: 1, carrier: 'dhl', service: 'express', orderReference: 'GL-0a1b2c3d' })
assert.deepEqual(req.settings, { printFormat: 'PDF', printSize: 'PAPER_LETTER', currency: 'MXN' })
assert.equal(req.packages[0].type, 'envelope'); assert.equal(req.packages[0].weight, 0.5)

// Forma documentada de /ship/generate/ (docs.envia.com/reference/create-shipping-label)
const gen = { meta: 'generate', data: [{ carrier: 'dhl', service: 'express', shipmentId: 1, trackingNumber: '7700', trackUrl: 'https://t/7700', label: 'https://l/7700.pdf', additionalFiles: [], totalPrice: 210.5, currentBalance: 0, currency: 'MXN' }] }
assert.deepEqual(parseLabel(gen), { trackingNumber: '7700', trackUrl: 'https://t/7700', labelUrl: 'https://l/7700.pdf', cost: 210.5, carrier: 'dhl', service: 'express' })
assert.equal(parseLabel({ data: [{ label: 'x' }] }), null)
assert.equal(classifyGenerate(200, gen).kind, 'ok')
assert.equal(classifyGenerate(200, { meta: 'generate', data: [] }).kind, 'unknown')
assert.equal(classifyGenerate(502, null).kind, 'unknown')
assert.equal(classifyGenerate(200, null).kind, 'unknown')
const err = { meta: 'error', error: { code: 1129, description: 'Error', message: 'Insufficient balance' } }   // forma supuesta
assert.deepEqual(classifyGenerate(400, err), { kind: 'rejected', message: 'No hay saldo suficiente en Envia. Recarga tu saldo y vuelve a intentar.' })
assert.equal(classifyGenerate(200, err).kind, 'rejected')
assert.equal(enviaErrorMessage({ meta: 'error', error: { message: 'Invalid service' } }), 'Envia no pudo generar la guía: Invalid service')
assert.equal(enviaErrorMessage({}), 'Envia no pudo generar la guía. Intenta de nuevo en unos minutos.')
```

- [ ] **Step 2: Run `npm test`** — Expected: FAIL (`label.js` no existe / exports faltantes).
- [ ] **Step 3: Implement** `label.js` y los cambios de `envia.js` con las firmas de arriba. Sin APIs de Deno/Node/DOM (lo importan Node y Deno).
- [ ] **Step 4: Run `npm test`** — Expected: todo pasa, incluidos `test-labels ok` y las pruebas viejas de `test-envia.mjs`/`test-shipping.mjs`.
- [ ] **Step 5: Commit** `feat(guias): lógica pura de guías y petición a Envia`

---

### Task 2: Columnas de guía en la base

**Files:**
- Create: `supabase/shipping-labels.sql`

**Interfaces:**
- Produces:
  - `orders`: `label_status text` (check `label_status in ('generating','generated','review')`, nombrado `orders_label_status_check`, agregado con `drop constraint if exists` + `add constraint`), `label_locked_at timestamptz`, `label_tracking text`, `label_track_url text`, `label_url text`, `label_carrier text`, `label_service text`, `label_cost numeric`, `label_created_at timestamptz`, `label_sandbox boolean not null default false`.
  - `shipping_settings.label_print_size text not null default 'PAPER_LETTER' check (label_print_size in ('PAPER_LETTER','PAPER_4X6'))`.
  - Sin políticas nuevas: `orders` ya es lectura/edición solo admin (`rls-hardening.sql`); la función escribe con service role. Sin triggers.

- [ ] **Step 1: Escribir `supabase/shipping-labels.sql`** (`begin; ... commit;`, `add column if not exists`), con comentario de cabecera: "Correr después de `shipping.sql`. Idempotente. Solo agrega columnas nulas: el sitio actual no cambia."
- [ ] **Step 2: Aplicar** con `apply_migration` (nombre `shipping_labels`). Verificar con `execute_sql`:
  - `select label_status, label_sandbox from orders limit 1;` → corre (null / false).
  - `select label_print_size from shipping_settings where id = 1;` → `PAPER_LETTER`.
  - `update orders set label_status = 'x' where false;` no prueba el check; usar `select conname from pg_constraint where conname = 'orders_label_status_check';` → 1 fila.
  - Volver a aplicar el archivo entero → sin error.
- [ ] **Step 3: Commit** `feat(guias): columnas de guía en orders y formato de impresión`

---

### Task 3: Edge Function `shipping-label`

**Files:**
- Create: `supabase/functions/shipping-label/index.js`
- Modify: `supabase/functions/README.md`

**Interfaces:**
- Consumes: Task 1 (`label.js`, `envia.js`: `rateCarrier`, `buildLabelRequest`, `generateLabel`), Task 2 (columnas), `buildPackage` y tablas de envío de la Parte 1.
- Produces: `POST /functions/v1/shipping-label`, `verify_jwt` activo, `Authorization: Bearer <sesión del admin>` (la que manda `supabase.functions.invoke`).
  - Body: `{ mode: 'rates'|'generate'|'release', orderId: uuid, kind?: 'envelope'|'box', address?: AddressParts, carrier?: string, serviceCode?: string }`.
  - `401 { error: 'auth' }` si `db.auth.getUser(token)` falla (la anon key también da 401); `403 { error: 'forbidden' }` si el usuario no está en `admin_users`; `400 { error: 'body' }` si `mode` no es de la lista, `orderId` no es UUID, `kind` no es `envelope|box|undefined`, `carrier` no está en `settings.carriers`, `serviceCode` no cumple `/^[\w.-]{1,60}$/`, o `address` no es objeto. Todo lo demás `200`.
  - `rates` → `{ options: [{ carrier, service, serviceCode, cost, days }], defaultIndex, package: { kind, grams }, paid: number|null, sandbox: boolean, address: AddressParts|null }` (ordenadas por `cost`; `paid` = `orders.shipping_cost`), o `{ error }`. Aquí sí va `cost`: es lo que paga la tienda y solo lo ve el admin.
  - `generate` → `{ label: { tracking, trackUrl, url, carrier, service, cost, sandbox }, saved: boolean }`, o `{ error, review?: true, ref }`.
  - `release` → `{ ok: true }` o `{ error }`. Permitido solo si `label_status = 'review'`, o `label_status = 'generating'` con `label_locked_at < now() - 2 min`, o `label_sandbox = true`; limpia todas las columnas `label_*` (`label_sandbox = false`). Si no → "No hay nada que liberar en este pedido."
- Flujo `rates`/`generate` (con service role `db`): leer el pedido (`id, status, delivery_method, shipping_carrier, shipping_tier, shipping_cost, customer_name, customer_whatsapp, customer_email, address_parts, cart_items, label_status, label_tracking`) → `labelEligibility` → ajustes + pesos → `senderError(settings.origin)` → `validateAddress(body.address ?? order.address_parts)` (sin ninguno: "Captura la dirección del cliente.") → `receiverPhone` (null: "El WhatsApp del cliente no es un número de México de 10 dígitos. Genera esta guía en el panel de Envia.") → `packageFor(cart_items, weights, settings, body.kind)` → credenciales: `ENVIA_LABEL_BASE_URL ?? ENVIA_BASE_URL`, `ENVIA_LABEL_API_KEY ?? ENVIA_API_KEY`; `sandbox = baseUrl.includes('api-test')`.
  - `rates`: `rateCarrier` por cada `settings.carriers` (`Promise.allSettled`), aplanar, `defaultOption(options, { carrier: order.shipping_carrier, tier: order.shipping_tier })`. Sin opciones → "Envia no regresó opciones para este paquete. Intenta de nuevo o usa el panel de Envia."
  - `generate`: `rateCarrier` solo de `body.carrier`; buscar `serviceCode === body.serviceCode` → si no: "Esa opción ya no está disponible. Vuelve a ver las opciones." → bloqueo (`update { label_status: 'generating', label_locked_at: now } .eq('id').is('label_status', null).is('label_tracking', null).select('id')`; 0 filas → "Este pedido ya tiene guía o se está generando.") → `generateLabel` con `printSize: settings.label_print_size`, `orderRef(order.id)`, destino `{ name: customer_name.slice(0, 60), phone, email?, street, number: numExt + (numInt ? ' Int. ' + numInt : ''), district: neighborhood, city, state, postalCode: zip, reference: references }` → según `kind`: `ok` → `update` con `label_status 'generated'`, `label_tracking`, `label_track_url`, `label_url`, `label_carrier`, `label_service` (descripción de la opción), `label_cost` (`label.cost`), `label_created_at`, `label_sandbox`, y `address_parts` = dirección validada (guarda la capturada a mano); reintento único si falla; `rejected` → `update { label_status: null, label_locked_at: null } .eq('id').eq('label_status', 'generating')` y `{ error: message }`; `unknown` → `update { label_status: 'review' }` y `{ error: 'No supimos si Envia creó la guía. Búscala en tu panel de Envia con la referencia GL-xxxx antes de volver a intentar.', review: true, ref }`.
  - CORS igual que `shipping-quote` (mismos orígenes y headers). Logs: `console.error('shipping-label', orderRef, carrier, mensaje)` sin datos personales ni cuerpos de Envia.

- [ ] **Step 1: Implementar `index.js`** con el flujo de arriba. Reusar el patrón de `shipping-quote/index.js` (cliente service role a nivel de módulo, `corsFor`, `json()`).
- [ ] **Step 2: README:** sección `shipping-label` (archivos: `shipping-label/index.js` + `_shared/shipping.js` + `_shared/envia.js` + `_shared/label.js`; solo admin; secretos opcionales `ENVIA_LABEL_BASE_URL`/`ENVIA_LABEL_API_KEY` para sandbox y cómo volver a producción borrándolos).
- [ ] **Step 3: Desplegar** con `deploy_edge_function` (nombre `shipping-label`, entrypoint `index.js`, `verify_jwt: true`, los 4 archivos). El dueño pone en Dashboard → Edge Functions → Secrets `ENVIA_LABEL_BASE_URL=https://api-test.envia.com` y `ENVIA_LABEL_API_KEY=<sandbox>` **antes** de cualquier `generate` (sin ellos se usaría producción).
- [ ] **Step 4: Verificar** (pedido de prueba creado con `place_order` hacia CP 44100 con una playera; borrarlo al final). Con el JWT de un admin (de la sesión del admin en el navegador) salvo donde se indica:
  - Con la anon key → `401`. Con un usuario autenticado que no está en `admin_users` (si no hay, saltar y anotarlo) → `403`. `orderId: 'x'` → `400`.
  - `rates` → opciones con `cost`, `defaultIndex` apunta a la paquetería del pedido, `sandbox: true`.
  - `generate` con un `serviceCode` inventado → "Esa opción ya no está disponible…", pedido sin cambios.
  - Forzar un rechazo de Envia (p. ej. `ENVIA_LABEL_API_KEY` inválida un momento) → mensaje en español, `label_status` vuelve a null. **Copiar el cuerpo real del error** al fixture de `test-envia.mjs` y ajustar `enviaErrorMessage` si la forma no coincide.
  - `generate` válido → `label.url` abre un PDF tamaño carta; la fila tiene `label_status 'generated'`, `label_sandbox true`, `label_cost`.
  - Dos `generate` en paralelo sobre otro pedido de prueba → uno con guía, el otro "ya tiene guía o se está generando"; en el panel sandbox de Envia hay **una** guía con referencia `GL-…`.
  - `ENVIA_LABEL_BASE_URL` a un host que no responde → tras ~30 s `review: true`; `generate` de nuevo → bloqueado; `release` → libera.
  - Formatos: `GET https://queries.test.envia.com/carrier-print-option?carrier_id=<id>` (Bearer sandbox) por cada paquetería activa; anotar en el README cuáles aceptan `PDF`+`PAPER_LETTER` y `PDF`+`PAPER_4X6`. Si alguna activa no acepta carta, avisar al dueño (no cambiar código).
  - `release` en las guías de prueba; borrar los pedidos de prueba.
- [ ] **Step 5: Commit** `feat(guias): Edge Function shipping-label (solo admin, con bloqueo)`

---

### Task 4: Admin — formato de impresión en Envíos

**Files:**
- Modify: `src/pages/admin/adminShipping.js`

**Interfaces:**
- Consumes: `shipping_settings.label_print_size` (Task 2), `saveShippingSettings` existente.

- [ ] **Step 1:** En el formulario, sección nueva "Guías" con `<select name="label_print_size">`: `PAPER_LETTER` → "Hoja carta (PDF)" (por defecto), `PAPER_4X6` → "Etiqueta 4×6 (PDF)"; nota: "Las dos se imprimen en impresora normal." Bajo el teléfono del remitente: "Lo pide la paquetería para generar guías." Guardar el valor con el resto (validar que sea uno de los dos).
- [ ] **Step 2: Verificación manual** (`npm run dev`, admin): cambiar a 4×6, guardar, recargar → queda 4×6; volver a carta. `npm test` y `npm run build` pasan.
- [ ] **Step 3: Commit** `feat(guias): formato de impresión de guías en ajustes de envío`

---

### Task 5: Admin — bloque "Guía" en el detalle del pedido

**Files:**
- Create: `src/pages/admin/orderLabel.js`
- Modify: `src/store/shipping.js`, `src/pages/admin/adminOrders.js` (detalle, junto al formulario "Costo de envío")

**Interfaces:**
- Consumes: `shipping-label` (Task 3); `costNote`, `MX_STATES` (Task 1 / Parte 1); `carrierName` de `../checkout/shippingBlock.js`; `formatMoney`, `showToast`, `escapeHtml`, `ICON`.
- Produces:
  - `src/store/shipping.js`: `labelAction(body) => Promise<data | { error: string }>` — `ensureAdminAccess`, `supabase.functions.invoke('shipping-label', { body, timeout: 45000 })`; `error` de invoke o excepción → `{ error: 'No se pudo conectar con el servidor de guías. Intenta de nuevo.' }` (401/403 → `{ error: 'Tu sesión no tiene permiso para generar guías. Vuelve a entrar.' }`, leyendo `error.context?.status`).
  - `orderLabel.js`: `labelBlockHtml(order) => string` y `mountLabelBlock(rootEl, order, onChange: (order) => void)`. `adminOrders.js` pinta `labelBlockHtml(order)` bajo el formulario de costo y llama `mountLabelBlock(content.querySelector('[data-label-block]'), order, () => openOrderDetails(order.id))` después de pintar.

- [ ] **Step 1: Estados del bloque** (`<section data-label-block aria-live="polite">`, estilo `bg-paper rounded-xl2 border border-line p-4` como el resto del detalle):
  - No es envío a domicilio → `''`.
  - `shipping_carrier === 'local'` → "Entrega local — la llevan ustedes."
  - `generated` → `carrierName(label_carrier) · label_service`, número de rastreo con botón "Copiar" (`navigator.clipboard`), "Imprimir guía" (`<a href=label_url target="_blank" rel="noopener">`; la URL se valida con `/^https:\/\//` antes de pintarla), costo `formatMoney(label_cost)`. Si `label_sandbox`: etiqueta "Guía de prueba" y botón "Quitar guía de prueba" (`release`, con `confirmDelete`).
  - `review` → texto de Global Constraints con `GL-xxxx` + botón "Ya revisé en Envia, liberar" (`release`, con `confirmDelete`: "Si la guía sí se creó, no la vuelvas a generar: cópiala del panel de Envia.").
  - `generating` → "Generando guía…"; si `label_locked_at` tiene más de 2 min, el mismo botón de liberar.
  - Sin guía → botón "Generar guía".
- [ ] **Step 2: Flujo "Generar guía".** Si `address_parts` es null: formulario (calle, número, int., colonia, ciudad, estado `<select>` con `MX_STATES`, CP, referencias) con `order.address` mostrado arriba como referencia, todos con `<label>`. Botón "Ver opciones" → `labelAction({ mode: 'rates', orderId, address? , kind? })` → lista de radios (`role="radiogroup"`): `carrierName(carrier) · service`, "N días" si hay, `formatMoney(cost)`; preseleccionada `defaultIndex`. Selector "Sobre / Caja" (preseleccionado `package.kind`; al cambiar vuelve a pedir `rates`). Debajo, `costNote(costElegido, paid, formatMoney)` en tono de aviso, y si `status === 'pendientedepago'`: "Este pedido aún no está marcado como pagado." Si `sandbox`: "Modo prueba: la guía no es real." Botón "Generar guía por $X" → deshabilitado al primer clic → `labelAction({ mode: 'generate', orderId, carrier, serviceCode, kind, address? })`. `{ error }` → mensaje en `role="alert"` y botón de nuevo activo (si `review`, repintar en estado `review`); éxito → copiar los campos devueltos al objeto `order` (`label_status 'generated'`, etc.), toast "Guía generada", `onChange(order)`. Si `saved: false`: toast de error "La guía se creó pero no se guardó. Anota el rastreo: <n>" y no cerrar el bloque.
- [ ] **Step 3: Escapado.** Todo valor del pedido o de Envia pasa por `esc()`; `npm test` (incluye `test-admin-escaping.mjs`) pasa.
- [ ] **Step 4: Verificación manual** (`npm run dev` contra la función en sandbox, pedidos de prueba): pedido con `address_parts` → opciones con la paquetería del cliente preseleccionada; cambiar a caja → recotiza; con `shipping_cost` menor que la guía → aviso de diferencia; generar → aparece rastreo copiable e "Imprimir guía" abre el PDF; doble clic rápido → una sola guía; pedido viejo sin `address_parts` → formulario, CP de 4 dígitos → "El código postal debe tener 5 dígitos."; pedido de entrega local → texto sin botón; pedido "Recoger en tienda" → sin bloque; borrar teléfono del remitente → mensaje de Global Constraints. Quitar las guías de prueba y borrar los pedidos de prueba. `npm test` y `npm run build` pasan.
- [ ] **Step 5: Commit** `feat(guias): generar e imprimir guías desde el detalle del pedido`

---

## Despliegue (orden; el sitio viejo funciona en cada paso)

1. **SQL** (Task 2): solo columnas nulas y un ajuste con default; el sitio actual las ignora.
2. **Función** (Task 3): primero los secretos `ENVIA_LABEL_*` de sandbox, luego `deploy_edge_function`. Nadie la llama todavía. `shipping-quote` no se redespliega (el `serviceCode` extra no cambia su respuesta; si se redespliega después, sigue igual).
3. **Frontend** (Tasks 4–5): merge a `main` → Vercel. En sandbox el admin ve "Modo prueba".
4. **Producción** (cuando el dueño tenga saldo): en cada pedido real con "Guía de prueba", "Quitar guía de prueba"; borrar los secretos `ENVIA_LABEL_BASE_URL` y `ENVIA_LABEL_API_KEY` (cae a la llave de producción de `shipping-quote`); primera guía real con un pedido pagado y comparar el cargo con el panel de Envia.
5. Limpieza Docker no aplica (no se usa Docker).
