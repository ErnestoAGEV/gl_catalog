# Manual orders from the admin: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Record sales closed over WhatsApp from Admin → Pedidos. They must have the same price, statuses, customer and label as a web order, a "WhatsApp" tag, and no emails.

**Architecture:** An `admin_place_order` RPC (admin only) marks the channel with a transaction-local setting and calls the existing `place_order`. The `orders.channel` column takes its value from that setting. The new-order trigger skips manual orders. The admin gets a `/admin/orders/new` page plus a channel tag, filter and breakdown.

**Tech Stack:** Supabase Postgres (plpgsql), Vite + vanilla JS, Node tests (`scripts/test-*.mjs` registered in `scripts/test.mjs`).

**Spec:** `docs/superpowers/specs/2026-11-26-pedidos-manuales-design.md`

## Global Constraints

- Leave `place_order` and its signature unchanged.
- New functions:
  - grant explicitly: `revoke all ... from public, anon; grant execute ... to authenticated`;
  - use `security definer` with `set search_path = public, pg_temp`.
- Statuses: `pendientedepago` (default), `completado`, `cancelado`.
- Channels: `'web'` (default) and `'whatsapp'`. The visible tag reads "WhatsApp".
- Payment methods offered: `Transferencia`, `Efectivo`, `Tarjeta`, `Pago al recoger`.
- Delivery: `Recoger en tienda` and `Envío a domicilio`, exactly as `place_order` uses them.
- Shipping cost override: from 0 to 10000. Local delivery suggests `shipping_settings.local_delivery_price` (60).
- No emails for `channel = 'whatsapp'`: no staff new-order email, no staff cancellation email, no customer confirmation.
- UI:
  - escape everything with `escapeHtml` (`src/utils/sanitize.js`), using `String()` for numbers;
  - no inline handlers or `javascript:` (`scripts/test-csp.mjs`);
  - labels, `aria-live` for errors;
  - copy uses tú and never uses "¡".
- Implementers do NOT run SQL on production: the controller applies it. `npm test` and `node node_modules/vite/bin/vite.js build` must pass. Commit only the files you changed, never `.claude/settings.local.json`.

## Review Focus

1. If the admin's session expires mid-form, the save fails with the database message and everything captured is kept. The serializer test covers the form state.
2. If a product becomes a draft or is deleted between loading and saving, the database rejects it and the form shows "Uno de los productos ya no esta disponible." without losing data. Covered in Task 3's manual test.
3. A local ZIP code (28000) quoted from the form returns `carrier: 'local'` at $60, and the cost field fills in at 60. Task 2 test `pickQuoteTier`.
4. Changing a WhatsApp order to "completado" must not send the confirmation email, even when it has an email address. Task 4 test `shouldSendConfirmation`.
5. Cancelling a WhatsApp order must not send the cancellation email to staff. Task 1 check.

---

### Task 1: Database: channel, `admin_place_order`, no emails

**Files:**
- Create: `supabase/manual-orders.sql` (idempotent, `begin; ... commit;`).
- Create: `supabase/checks/manual-orders.sql` (DO block ending in `raise exception 'CHECK_OK'`; same style as `supabase/checks/newsletter.sql`).

**Interfaces:**
- Produces:
  - column `public.orders.channel text not null default coalesce(nullif(current_setting('gl.order_channel', true), ''), 'web')` with check `channel in ('web','whatsapp')`, plus index `orders_channel_idx`;
  - the function below.

  ```
  public.admin_place_order(
    p_customer_name text, p_customer_whatsapp text, p_payment_method text, p_delivery_method text,
    p_address text, p_items jsonb, p_coupon_code text default null, p_customer_email text default null,
    p_shipping_quote_id uuid default null, p_shipping_tier text default null, p_address_parts jsonb default null,
    p_shipping_cost numeric default null, p_local boolean default false, p_status text default null
  ) returns public.orders
  ```

- [ ] **Step 1: Write the check.** It runs as an admin by setting `request.jwt.claims` with a `sub` from `admin_users`, and as anon with `set local role anon`. Assertions:
  - A non-admin (an authenticated claim with a random sub) calling `admin_place_order` → exception `'Solo los administradores pueden crear pedidos manuales.'`.
  - An admin with 1 line (the first non-draft product with numeric stock `0`, if one exists; otherwise any product) gives:
    - `channel = 'whatsapp'`;
    - `status = 'pendientedepago'`;
    - `subtotal` equal to `promo_info(product).price * qty`;
    - no row in `net.http_request_queue` with a body containing the order id (`id > v0`).
  - With `p_delivery_method = 'Envío a domicilio'`, `p_address_parts` complete (zip 28000), no quote, `p_shipping_cost 60` and `p_local true`:
    - `shipping_cost = 60`, `shipping_carrier = 'local'`, `shipping_service = 'Entrega local'`, `shipping_tier = 'standard'`.
  - `p_shipping_cost 10001` → exception `'Costo de envío inválido.'`. `p_status 'xx'` → exception `'Estado inválido.'`.
  - `p_status 'completado'` → `status = 'completado'`.
  - Updating that WhatsApp order to `cancelado` → no email queued.
  - The setting doesn't leak: after `admin_place_order`, a direct `insert into orders (...)` in the same transaction — after resetting `gl.order_channel` to `''` — gets `channel = 'web'`. Equivalently, assert that the function resets it: `current_setting('gl.order_channel', true)` is `''` after the call.
  - A web order (`place_order` as anon, IP `203.0.113.9`) gets `channel = 'web'` and queues 1 staff email. Make sure `staff_mail` has room with `update security_limits set max_hits = 1000 where name = 'staff_mail'`.
  - `has_function_privilege('anon', 'public.admin_place_order(text,text,text,text,text,jsonb,text,text,uuid,text,jsonb,numeric,boolean,text)', 'execute')` is false, and for `authenticated` it is true.
- [ ] **Step 2: Write `supabase/manual-orders.sql`.**
  - The column with `add column if not exists`. Existing rows get `'web'` through the default.
  - `admin_place_order`:
    1. `if not public.is_admin() then raise exception 'Solo los administradores pueden crear pedidos manuales.' using errcode = '42501'`.
    2. Validate `p_shipping_cost is null or p_shipping_cost between 0 and 10000`, otherwise `'Costo de envío inválido.'` (22023). Validate `p_status is null or p_status in (the 3 statuses)`, otherwise `'Estado inválido.'` (22023).
    3. `perform set_config('gl.order_channel', 'whatsapp', true)`, then `v := public.place_order(<the 11 arguments, p_expected_total => null>)`, then `perform set_config('gl.order_channel', '', true)`.
    4. If `p_shipping_cost is not null`: update `shipping_cost`. If, in addition, `p_local and v.delivery_method = 'Envío a domicilio'`: `shipping_tier = 'standard'`, `shipping_carrier = 'local'`, `shipping_service = 'Entrega local'`.
    5. If `p_status is not null and p_status <> v.status`: update the status.
    6. `returning * into v`, then `return v`.
    7. Grants as in Global Constraints.
  - `notify_staff_on_order`: copy its current body from production, given here:

    ```
    if tg_op='INSERT' then begin if public.rate_check('staff_mail','*') then perform public.send_order_staff_email(new.id,'nuevo'); else perform public.send_staff_alert('staff_mail'); end if; exception when others then raise warning 'notify_staff_on_order: %', sqlerrm; perform public.send_order_staff_email(new.id,'nuevo'); end; elsif new.status='cancelado' and coalesce(old.status,'')<>'cancelado' then perform public.send_order_staff_email(new.id,'cancelado'); end if; return null;
    ```

    Add as the first line: `if new.channel = 'whatsapp' then return null; end if;`. Keep the same header (`security definer`, `search_path = public, extensions, vault, pg_temp`). Also update the copy in `supabase/order-staff-notify.sql` if that file defines it, so a re-run doesn't drop the change.
- [ ] **Step 3:** Self-check with `node -e` or by reading. You don't have production access; the controller runs the check.
- [ ] **Step 4: Commit** `feat(pedidos): admin_place_order y canal WhatsApp sin correos`.

### Task 2: Store and pure logic of the form

**Files:**
- Create: `src/utils/manualOrder.js`.
- Modify: `src/store/orders.js`, to add `createManualOrder`.
- Test: `scripts/test-manual-order.mjs`, registered in `scripts/test.mjs`.

**Interfaces:**
- Consumes: the `admin_place_order` RPC from Task 1; `discounted`, `promoFor` from `src/utils/promotions.js`; `isValidWhatsapp` from `src/utils/` (wherever it is defined).
- Produces:
  - `validateManualOrder(form) -> string[]`: list of errors in Spanish; empty means it's valid.
  - `toRpcArgs(form) -> object`: the `p_*` arguments for `admin_place_order`.
  - `previewTotals(form, products, promos, now) -> { subtotal, shipping, total }`: approximate total, before any coupon.
  - `pickQuoteTier(quote, tier) -> { cost: number, local: boolean } | null`.
  - `createManualOrder(form) -> Promise<{ order?, error?: { message } }>`.
- The `form` shape:

  ```
  { name, whatsapp, email, items: [{ productId, size, color, qty }], couponCode, paymentMethod,
    deliveryMethod, address: { street, numExt, numInt, neighborhood, city, state, stateName, zip, references },
    quote: { quoteId, standard, express } | null, tier: 'standard'|'express'|null, shippingCost: number|null, local: boolean, status }
  ```

- [ ] **Step 1: Tests.**
  - `validateManualOrder`:
    - name `'Al'` → includes `'Escribe el nombre del cliente.'`;
    - WhatsApp `'123'` → `'El WhatsApp no parece válido.'`;
    - `items: []` → `'Agrega al menos un producto.'`;
    - home delivery without `street` → `'Completa la dirección de envío.'`;
    - `shippingCost: -1` → `'El costo de envío debe estar entre 0 y 10,000.'`;
    - a complete form → `[]`.
  - `toRpcArgs`:
    - pickup → `p_address_parts: null`, `p_shipping_cost: null`, `p_shipping_quote_id: null`;
    - home delivery with quote `q1`, tier `express`, cost 180 → `p_shipping_quote_id: 'q1'`, `p_shipping_tier: 'express'`, `p_shipping_cost: 180`, and `p_address_parts.zip` equals the form's;
    - email `''` → `null`; `couponCode` `' welcome10 '` → `'welcome10'` (trimmed; the database normalizes it).
  - `pickQuoteTier`:
    - `{ standard: { carrier: 'local', price: 60 } }`, `'standard'` → `{ cost: 60, local: true }`;
    - `{ standard: { carrier: 'fedex', price: 165 }, express: null }`, `'express'` → `null`.
  - `previewTotals`: one product at 500 with a running 20% promotion and qty 2, shipping 60 → `{ subtotal: 800, shipping: 60, total: 860 }`.
- [ ] **Step 2:** Run `node scripts/test-manual-order.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `src/utils/manualOrder.js` and `createManualOrder`.
  - `createManualOrder` calls `ensureAdminAccess()` the same way the store's other admin functions do, then `supabase.rpc('admin_place_order', toRpcArgs(form))`.
  - It returns `{ order: data }` or `{ error: { message } }`.
  - After success it calls the existing admin orders cache refresh, if there is one in `src/store/orders.js`; otherwise nothing.
- [ ] **Step 4:** Run `npm test`. Expected: exit 0.
- [ ] **Step 5: Commit** `feat(pedidos): logica y store de pedidos manuales`.

### Task 3: "Nuevo pedido" page

**Files:**
- Create: `src/pages/admin/adminNewOrder.js`, exporting `pageAdminNewOrder(state)` with the same shape as `pageAdminOrders` (`{ title, html, onMount }`). Check `src/core/views.js` for the exact contract.
- Modify:
  - `src/core/views.js`: route `'/admin/orders/new'`, plus title and guard the same as `/admin/orders`; register it before any `/admin/orders` prefix match if one exists.
  - `src/pages/admin/adminOrders.js`: a **"Nuevo pedido"** link/button (`adm-btn adm-btn-primary` with `ICON.plus`) in the toolbar, `href="/admin/orders/new"`, using the router's existing navigation.
- Test: extend `scripts/test-admin-escaping.mjs` to include `adminNewOrder.js` in the scan, and render the products' `<option>` with a name `<img src=x onerror=alert(1)>`, asserting it comes out escaped.

**Interfaces:** consumes all of Task 2, `quoteShipping` and `getShippingSettings` from `src/store/shipping.js`, `carrierName` and `TIER_NAMES` from `src/pages/checkout/shippingBlock.js`, the admin's product list (the same source `adminProducts.js` uses, excluding `badge === 'Borrador'`), and `validate_coupon` the same way the checkout calls it.

- [ ] **Step 1:** The page, laid out as in the spec "Admin: Nuevo pedido" section, in sections 1–7:
  - Product search filters as you type (name + brand), at most 8 results, each one added to the list with a click or Enter.
  - Size and color as `<select>` only when the product has a list.
  - "Cotizar envío" sends `items` as `[{ productId, qty }]`, the same as the checkout (check its call in `src/pages/checkout/`).
  - Choosing a tier fills "Costo de envío" with `pickQuoteTier`.
  - The "Entrega local (Colima / Villa de Álvarez)" checkbox sets `local: true` and, if the cost is empty, fills it with `local_delivery_price`.
  - Summary built with `previewTotals`, which says "Aproximado. El total final lo calcula el sistema al guardar."
  - Save: `validateManualOrder` → errors in `#new-order-errors` (`role="alert"`) → `createManualOrder` → `showToast('Pedido guardado', 'success')` and navigation to `/admin/orders`. On error: show `error.message` and keep the form.
  - The save button is disabled while saving, so no double click gets through.
- [ ] **Step 2:** Run `npm test`, the vite build, `node scripts/prerender.mjs` and `node scripts/test-csp.mjs`. Expected: all ok.
- [ ] **Step 3: Commit** `feat(pedidos): pantalla Nuevo pedido en el admin`.

### Task 4: Tag, filter, reports and no confirmation email

**Files:**
- Modify: `src/pages/admin/adminOrders.js` (tag in the list, mobile and detail views; channel filter; confirmation guard around line 635), `src/pages/admin/adminReportes.js` ("Por canal" section).
- Create/Modify: `src/utils/manualOrder.js`, to add `shouldSendConfirmation(order, newStatus) -> boolean` and `channelBreakdown(orders) -> { web: { count, revenue }, whatsapp: { count, revenue } }`.
- Test: `scripts/test-manual-order.mjs`.

- [ ] **Step 1: Tests.**
  - `shouldSendConfirmation`:
    - `({ channel: 'whatsapp', customer_email: 'a@b.mx' }, 'completado')` → false;
    - `({ channel: 'web', customer_email: 'a@b.mx', confirmation_sent_at: null }, 'completado')` → true;
    - with no email → false;
    - already sent → false.
  - `channelBreakdown`: 3 orders (web 100 completado, whatsapp 200 pendientedepago, whatsapp 50 cancelado) → `web { count: 1, revenue: 100 }`, `whatsapp { count: 1, revenue: 200 }`.
    - Revenue = `total + coalesce(shipping_cost, 0)`, the same as the "Ingresos" figure in `adminReportes.js`. If that figure adds products only, use `total` and adjust the test so both match.
    - An order with no `channel` counts as web.
- [ ] **Step 2: Implement.**
  - "WhatsApp" tag: a small pill next to the order number, in the list, mobile cards and detail.
  - Filter Todos/Web/WhatsApp next to the status filters, combined with them and with the search.
  - The confirmation in `adminOrders.js` uses `shouldSendConfirmation`.
  - "Por canal" in Reportes uses `channelBreakdown` over the orders for the selected period.
- [ ] **Step 3:** Run `npm test` and the vite build. Expected: ok.
- [ ] **Step 4: Commit** `feat(pedidos): etiqueta y filtro WhatsApp, reporte por canal, sin correo de confirmacion`.

### After the tasks (controller)

1. Apply `supabase/manual-orders.sql` with `apply_migration`.
2. Run the check and expect `CHECK_OK`.
3. Publish: fast-forward `main`.
4. Live test:
   - create an order "PRUEBA Claude" (local pickup, 1 product) and check that no email went out, that it appears with the WhatsApp tag, and that it appears in Clientes;
   - cancel it.

---

## Corrections from Fable's review (mandatory; they override the text above)

**Task 1**
- Call `place_order` with named notation (`p_customer_name => ..., p_expected_total => null, ...`).
- Steps 4–6 become one statement: `update public.orders set shipping_cost = case when delivery_method = 'Envío a domicilio' then coalesce(p_shipping_cost, shipping_cost) else shipping_cost end, shipping_tier/carrier/service = (local only if p_local and home delivery and p_shipping_cost is not null), status = coalesce(p_status, status) where id = v.id returning * into v`.
- Trigger: update `supabase/order-staff-notify.sql` (it defines the function at line ~182). Use `if to_jsonb(new)->>'channel' = 'whatsapp' then return null; end if;`, so it doesn't break if run before the column exists. `manual-orders.sql` also recreates it with the same body.
- **Customer confirmation on the server:** recreate `send_order_confirmation` in `manual-orders.sql` from `supabase/order-confirmation.sql` (same body), adding after the `already_sent` line: `if v_order.channel = 'whatsapp' then return 'manual'; end if;`. Check: on a WhatsApp order the RPC returns `'manual'` and queues nothing.
- Do not create `orders_channel_idx`.
- Check setup:
  - copy lines 16–40 of `supabase/checks/order-staff-notify.sql` (limits, `rate_events` cleanup, IP header);
  - admin claims: `{"role":"authenticated","sub":"<admin user_id>","aal":"aal2"}`;
  - deterministic stock: `update products set stock = '0'` on the test product, then assert that the order is saved and stock is still `'0'`.

**Task 2**
- Shipping without breaking free shipping:
  - `pickQuoteTier(quote, tier, free)` returns `{ cost: chargeFor(quote, tier, free), local }`, using `chargeFor` and `isFreeShipping` exactly as `src/pages/checkout/checkout.js:~262` uses them (they come from `supabase/functions/_shared/shipping.js` or wherever the checkout imports them).
  - The form carries `costEdited: boolean`. `toRpcArgs` sends `p_shipping_cost` only if `costEdited` is true or there is no quote; otherwise `null`, and the database charges.
  - Tests: quote `q1` without editing → `p_shipping_cost: null`; edited to 180 → `180`.
- `previewTotals(form, products)`:
  - uses `product.price` as is, which already includes the promotion (`store/products.js`), with no `promoFor`/`discounted` and no `promos`/`now` parameters;
  - test: `{ price: 400, basePrice: 500 }` with qty 2 and shipping 60 → `{ subtotal: 800, shipping: 60, total: 860 }`;
  - product source: `getState().products.filter(p => p.badge !== 'Borrador')`.
- Coupon:
  - add `checkCoupon(code)` to `src/store/coupons.js`: `sanitizeCouponCode`, then `supabase.rpc('validate_coupon', { p_code })`, returning `{ coupon }` or `{ error }` **without touching `state`**;
  - preview discount = `couponBase(lines, coupon.categories) * coupon.discount`;
  - **never** call `applyCoupon`.
- `isValidWhatsapp` lives in `src/utils/phone.js`.
- Export `createManualOrder` and `checkCoupon` from `src/store/index.js`.
- There is no orders cache to refresh.
- `validateManualOrder` requires `street`, `numExt`, `neighborhood`, `city`, `stateName` and `zip` for home delivery. `stateName` comes from the same state list the checkout uses.

**Task 3**
- `src/pages/admin/layout.js`:
  - add `'/admin/orders/new': 'Nuevo pedido'` to `TITLES`;
  - the side menu marks Pedidos with `currentPath === n.path || currentPath.startsWith(n.path + '/')`.
- Optional: don't play the new-order toast or sound when `incoming.channel === 'whatsapp'` (`startApp.js:~190`, `adminOrders.js:~743`). Do it; it's one line each.

**Task 4**
- `channelBreakdown`:
  - `count` = non-cancelled orders;
  - `revenue` = sum of `Number(o.total)` over `isSuccessful(o.status)`, the same definition as the "Ventas del periodo" card in `adminReportes.js:~62`. Move `isSuccessful` to `manualOrder.js` and import it from both places.
  - Web + WhatsApp must add up to that card.
  - Test: web 100 completado, whatsapp 200 pendientedepago, whatsapp 50 cancelado → `web { count: 1, revenue: 100 }`, `whatsapp { count: 1, revenue: 0 }`.
- Controller ruling: this follows the existing definition, so the report adds up. It doesn't change what the owner asked for.

**After the tasks (controller), instead of the live test with a session:**
1. Run three checks; all must give `CHECK_OK`: the new one, plus a re-run of `supabase/checks/order-staff-notify.sql` and `supabase/checks/place-order.sql`.
2. Read-only `execute_sql`:
   - the column default;
   - `has_function_privilege` for anon and authenticated;
   - `pg_get_functiondef` of `notify_staff_on_order` and `send_order_confirmation`;
   - `select channel, count(*) from orders group by 1` → all web.
3. Playwright without a session: `/admin/orders/new` shows the login.
4. A checklist for the owner:
   - create "PRUEBA" (pickup, 1 product);
   - confirm there's no email, the order has the tag, and the customer appears in Clientes;
   - mark it completado with an email address and confirm there's no email;
   - cancel it;
   - a product turned into a draft before saving shows the error and keeps the form.
