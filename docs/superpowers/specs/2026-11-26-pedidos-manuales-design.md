# Manual orders from the admin: design

Date: 2026-11-26. Store: glboutique.com.mx (Vite + vanilla JS + Supabase + Vercel).

## Why

Many sales close on WhatsApp and never pass through the website. Today those sales don't appear in Admin → Pedidos, in the customers list, or in the reports. The owner wants to record them in the admin with the same rules as a web order, so that everything they sell is in one place and they can generate the shipping label from there.

## The owner's decisions (2026-11-24/25)

- Prices are **the same as on the website**: current price with promotions, and coupons if the owner applies one. No custom prices.
- **No inventory deduction.** The store works as a catalog, and web orders don't deduct stock either. A manual order also isn't blocked by stock.
- The order **counts in reports**, marked as channel **"WhatsApp"**.
- **Same statuses** as web orders. The customer ends up **registered**: the customer list is built from orders by WhatsApp number, so registration happens on its own.
- **Full shipping details** are captured.
  - Outside Colima, the order is quoted with Envia, the same as on the website.
  - **Local delivery** in Colima and Villa de Álvarez is **$60, editable**.
- **No emails.** Not the "new order" email to staff, not the cancellation email, and not the customer confirmation.

## Goals / non-goals

- Goal: in under a minute, record an order already agreed on WhatsApp, and have it look identical to a web order everywhere (list, detail, label, customers, reports), plus a "WhatsApp" tag.
- Non-goals: editing an order after it's created (beyond status and shipping cost, which the admin already does), custom prices, partial payments, deducting stock.
- Anti-goals:
  - A total that differs from what the website would have charged.
  - Sending emails to the customer or staff.
  - Opening a way for anyone who isn't an admin to create orders without the website's limits.

## Approaches considered

1. **(Chosen) Admin wrapper over `place_order`.**
   - A new `admin_place_order` RPC requires `is_admin()`, marks the channel, and calls the same `place_order`.
   - The same function means the same prices, promotions, coupons, validations and address format.
   - `place_order` already has an admin branch that skips the per-IP/phone limits and stock, and accepts any payment method.
2. **Insert into `orders` from the browser (RLS for admin).** Rejected:
   - prices would be calculated in the browser;
   - the coupon and promotion rules would be duplicated;
   - the hardening from Task 4 would be lost.
3. **A separate `manual_orders` table.** Rejected:
   - it would duplicate the list, detail, labels, customers and reports.

## Design

### Database (`supabase/manual-orders.sql`, idempotent)

- **`orders.channel`** is `text not null`, check `in ('web','whatsapp')`.
  - Its default is `coalesce(nullif(current_setting('gl.order_channel', true), ''), 'web')`.
  - Existing rows get `'web'`. The website doesn't change.
- **`admin_place_order(...)`** takes the same 12 arguments as `place_order`, plus:
  - `p_shipping_cost numeric default null`: overrides the shipping cost;
  - `p_status text default null`: the initial status, one of the existing statuses.

  What it does:
  1. Rejects if `not is_admin()`.
  2. Runs `set_config('gl.order_channel','whatsapp', true)`.
  3. Calls `place_order(...)`.
  4. If `p_shipping_cost` is given (≥ 0, ≤ 10000), it overwrites `shipping_cost`.
     - With no quote and delivery to an address, it also records `shipping_tier = 'standard'`, `shipping_carrier = 'local'` and `shipping_service = 'Entrega local'` **only when the admin marks it as local delivery** (`p_local boolean default false`).
  5. If `p_status` is given and differs from `pendientedepago`, it updates the status.
  6. Returns the updated row. It's `SECURITY DEFINER` with `search_path = public, pg_temp`.

  Grants: revoke from public and anon, grant to authenticated (the function checks for admin itself).
- **`notify_staff_on_order`**: when `new.channel = 'whatsapp'` it does nothing (neither new-order nor cancellation emails). The function is rewritten keeping its current body (cap, fallback).
- **Check**: `supabase/checks/manual-orders.sql`, a DO block that ends in `raise exception 'CHECK_OK'`. It covers:
  - non-admin rejected;
  - admin creates with `channel = 'whatsapp'`;
  - the price comes from `products` and promotions;
  - the override and `p_local` work;
  - status is applied;
  - no staff email is queued (`net.http_request_queue` unchanged for that order);
  - a web order still gets `channel = 'web'` and does send the email;
  - stock doesn't block or get deducted.

### Admin: "Nuevo pedido" screen (`/admin/orders/new`)

- A **"Nuevo pedido"** button in the Pedidos toolbar. Route `/admin/orders/new`, registered in `src/core/views.js` like the other admin pages.
- **Form**, in order:
  1. **Customer:** name (required), WhatsApp (required, same rule as the checkout), email (optional).
  2. **Products:**
     - Search by name or brand over the products already loaded in the admin, excluding `Borrador`.
     - Each line has: product, size (select if the product has sizes), color (select if it has colors), quantity 1–50, and "Quitar".
     - The approximate price uses the same promotion helper as the store (`src/utils/promotions.js`). It says "precio de la tienda".
  3. **Coupon** (optional): validated with the existing `validate_coupon` RPC to show the discount, but the final charge is calculated by the database.
  4. **Payment:** select with Transferencia, Efectivo, Tarjeta and "Pago al recoger".
  5. **Delivery:** "Recoger en tienda" or "Envío a domicilio".
     - With delivery, the address fields are the checkout's (street, ext. no., int. no., neighborhood, city, state, ZIP code, references) plus a **"Cotizar envío"** button, which uses `quoteShipping` from `src/store/shipping.js`.
     - The result shows Standard/Express, or "Entrega local" for local ZIP codes, the same as the checkout (`shippingBlock.js` / `carrierName`). Picking an option fills **"Costo de envío" (editable)**.
     - If the quote fails, or the owner prefers, they type the cost by hand and tick **"Entrega local (Colima / Villa de Álvarez)"**, which suggests $60 (`shipping_settings.local_delivery_price`).
  6. **Status:** select with the existing statuses, default "Pendiente de pago".
  7. **Summary:** products, discount, shipping, and the approximate total. "Guardar pedido" calls `admin_place_order`.
     - On success, a toast and navigation to `/admin/orders`.
     - On error, the database message is shown in an `aria-live` area and the form keeps everything that was captured.
- Validation in the browser mirrors the database (non-empty name, WhatsApp, at least one product, a full address when delivering). The database has the final say.
- **No emails:** the admin's existing flow that sends the confirmation when the status changes to "completado" (`adminOrders.js` ~line 635) **doesn't run for `channel = 'whatsapp'`**.
- Accessibility and copy:
  - labels on every field, visible errors, `aria-live`;
  - tone uses tú, no "¡";
  - escape everything with `escapeHtml`, including product names.

### Pedidos list and reports

- **List and detail:** a discreet "WhatsApp" tag next to the order number when `channel = 'whatsapp'`.
- **Filter:** channel filter in the toolbar: Todos · Web · WhatsApp.
- **Reportes:** a "Por canal" breakdown (orders and revenue, Web vs WhatsApp) for the period. Cancelled orders are excluded, the same as the existing numbers.
- **Clientes:** no change needed. It's built from orders, so the customer appears on its own.
- **Labels:** no change. A manual order with an Envia quote carries carrier, service and `address_parts`, so it can generate a label the same way.

## Constraints

- Phase 0 / security: new functions are born without EXECUTE, so the grant is explicit. Also `SECURITY DEFINER` + `search_path`, and nothing from the site is opened to `anon`.
- The page's CSP: no inline scripts or handlers (`scripts/test-csp.mjs` must pass).
- Don't change `place_order` or its signature (the cached site calls it).
- `npm test` and `node node_modules/vite/bin/vite.js build` must pass.

## Calls I made (the owner handed me the how)

- One wrapper RPC rather than a new table or a browser insert (see Approaches).
- Payment methods offered: Transferencia, Efectivo, Tarjeta, Pago al recoger.
- Editing manual orders after they're created is out of scope; the owner cancels and re-records.
- The owner can override the shipping cost even with an Envia quote. The quote stays in `shipping_quote_id` for the label.
