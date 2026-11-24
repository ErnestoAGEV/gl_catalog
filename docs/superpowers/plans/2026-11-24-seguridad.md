# Correcciones de la auditoría de seguridad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar todos los hallazgos de la auditoría del 2026-11-24 (A-1, M-1…M-4, B-1…B-10, I-1…I-4, V-1…V-9) sin tirar la tienda en vivo en ningún momento.

**Architecture:** Defensa en capas en Postgres: un límite atómico genérico (`rate_hit`) por IP y global que usan `place_order`, el boletín, los cupones y la Edge Function; RPCs `SECURITY DEFINER` como única puerta de escritura anónima; y al final un archivo de cierre (`security-hardening.sql`) que quita los permisos de tabla de `anon` y las políticas abiertas. En el navegador: escapar todo lo que se pinta con `innerHTML`, CSP sin `'unsafe-inline'` en scripts, CSV seguro y MFA para el admin. El despliegue va por fases (0 → A → B → C → D) para que cada cierre ocurra cuando ya no hay nadie usando la puerta vieja.

**Tech Stack:** Vite 6 + JS vanilla, Supabase (Postgres/plpgsql, RLS, pg_net, pg_cron, Vault, Edge Functions en Deno), Vercel, Resend, pruebas `node:assert` vía `npm test`.

**Spec:** `docs/security/2026-11-24-auditoria-seguridad.md` (léelo entero; los números de línea son del commit `fe9c808` y siguen valiendo en `main` = `343e385` salvo donde se indica).

**Rama:** `fix/seguridad`, creada desde `main` (`343e385`). Nunca hacer stage de `.claude/settings.local.json`.

**Fuera de este plan (no bloquear):** pedidos manuales desde el admin y la Parte 2 de guías de envío. Por eso: los límites de `place_order` se saltan cuando llama un admin (`public.is_admin()`), `authenticated` conserva sus permisos de tabla donde existe una política de admin, y la Edge Function sigue usando service role.

## Global Constraints

- **Quién toca la base:** solo el controlador, con el MCP de Supabase (`apply_migration` / `execute_sql`). El implementador escribe archivos `.sql` y nunca los corre. Cada tarea con SQL trae un paso "El controlador aplica" y un archivo de comprobación en `supabase/checks/`.
- **SQL idempotente**, como los demás archivos de `supabase/`: `create or replace`, `drop … if exists`, `add column if not exists`, `begin; … commit;`.
- **Comprobaciones SQL (`supabase/checks/*.sql`):** un único bloque `do $$ … $$;` que hace asserts (`assert <cond>, '<mensaje>'`) y termina SIEMPRE con `raise exception 'CHECK_OK';`. Ese `raise` deshace todo (filas de prueba, `rate_events`, cola de `pg_net`: pg_net solo manda lo que se confirma). Resultado esperado al correrlo con `execute_sql`: error con el texto `CHECK_OK`. Cualquier otro error = falla. Nunca aplicar estos archivos como migración.
- Para simular una petición en un check: `perform set_config('request.headers', '{"cf-connecting-ip":"203.0.113.7"}', true);` y para simular un usuario: `perform set_config('request.jwt.claims', '{"sub":"<uuid>","aal":"aal2","role":"authenticated"}', true);`.
- **Todas las funciones `SECURITY DEFINER` nuevas:** `set search_path = public, pg_temp` (o `public, extensions, vault, pg_temp` si leen Vault o usan pg_net), `revoke all … from public, anon, authenticated` y `grant execute` solo a quien la llama.
- **Proyecto Supabase:** `https://bcnfbrhcubpysqpyhbvf.supabase.co` (sale de `VITE_SUPABASE_URL` en `.env`).
- **Límites (valores fijos de este plan):**
  - Pedidos (`place_order`): 5 por IP cada 10 min; 5 por `phone_key` cada 10 min; 30 en toda la tienda por hora. Admin (`is_admin()`) no tiene límite.
  - Avisos de pedido al equipo: 40 por 24 h; al pasarse, 1 correo de alerta por 24 h y nada más.
  - Boletín (`newsletter_subscribe`): 3 por IP por hora; 30 correos de confirmación en toda la tienda por 24 h; a un mismo correo, máximo 1 confirmación cada 24 h.
  - Cupones (`validate_coupon`): 30 por IP cada 10 min.
  - Cotizador (`shipping-quote`): 10 por IP por minuto (igual que hoy); 60 en toda la tienda por minuto.
  - Antes de aplicar la Tarea 4, el controlador corre `select date_trunc('hour', created_at) h, count(*) from orders where created_at > now() - interval '90 days' group by 1 order by 2 desc limit 1;`. Si el pico real pasa de 15 pedidos/hora, el tope global de pedidos se sube a 2× ese pico.
- **Copy:** tono de la tienda (serio, cercano, tuteo, sin "¡"). Mensajes de error de la base en claro, como hoy (`errcode = '22023'`).
- **Los pedidos web NO descuentan inventario** (decisión del dueño): la tienda funciona como catálogo.
- **Valores válidos de pedido** (los que manda hoy `src/pages/checkout/checkoutView.js:95-104`): pago `Transferencia` | `Pago al recoger`; entrega `Recoger en tienda` | `Envío a domicilio`.
- Código con la escalera de ponytail (lo mínimo completo), sin dependencias nuevas.
- Cada tarea termina con `npm test` en verde; las que tocan `src/`, `public/`, `index.html` o `vercel.json` también con `npm run build`.
- Commits en español con prefijo convencional (`fix(seguridad): …`), terminando con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **La CSP nueva rompe algo en producción** (una imagen de otro host, el realtime del admin, la impresión de pedidos, la vista previa de correos) → todo sigue funcionando; se comprueba en el preview de Vercel antes de fusionar (Tarea 10, Paso 6).
- **Clientes con el bundle viejo en caché durante la transición** (siguen insertando directo al boletín o leyendo `coupons`) → nada se cierra hasta la Fase C, al menos 24 h después del deploy de la Fase B y con los logs de la API revisados (Tarea 13, Paso 1).
- **El admin se queda fuera al exigir `aal2`** (sesión vieja `aal1`, teléfono perdido) → el login pide el código o el alta del factor; existe un SQL de reversa de una línea (Tarea 14).
- **Clientes reales detrás de la misma IP** (red celular con CGNAT, wifi de la tienda) topan con 5 pedidos/10 min → mensaje claro "Demasiados pedidos seguidos. Espera unos minutos."; el admin no tiene límite (check de la Tarea 4).
- **Alguien que ya se suscribió, o que se dio de baja, vuelve a escribir su correo** → la home responde lo mismo ("Revisa tu correo"), no se manda más de una confirmación cada 24 h, y la baja solo se deshace al abrir el enlace de confirmación (check de la Tarea 6).

---

## Rollout (orden de aplicación)

| Fase | Qué | Cuándo |
|---|---|---|
| 0 | Tarea 1 (SQL): quitar el trigger de stock; triggers de despliegue que no disparan con 0 filas | En cuanto se termine la Tarea 1. No depende del cliente. |
| A | SQL aditivo, compatible con el sitio actual: Tareas 2, 3 (solo SQL), 4, 5, 6 (solo SQL); y desplegar la Edge Function de la Tarea 7 | Al terminar cada tarea, en ese orden. Nada se quita todavía. |
| B | Un solo deploy del frontend: fusionar `fix/seguridad` a `main` con las Tareas 3, 6, 8, 9, 10, 11, 12 | Cuando la Fase A esté aplicada y verificada, y el preview de Vercel pase la Tarea 10 Paso 6. |
| C | Tarea 13 (SQL de cierre): revoke de permisos de `anon`, borrar políticas abiertas, borrador fuera de la lectura pública, Storage, higiene de funciones | ≥ 24 h después del deploy de B, con la Tarea 13 Paso 1 en verde. |
| D | Tarea 14 (SQL): exigir MFA (`aal2`) en todo lo de admin | Cuando el dueño ya entró al admin con su código TOTP (lo pide la Tarea 11 desde la Fase B). |
| — | Checklist del dueño (al final del plan) | En paralelo; MFA antes de D. |

Las Tareas 13 y 14 se pueden programar y commitear antes de fusionar (sus archivos son inertes hasta que el controlador los aplica), pero **no se aplican** antes de su fase.

## File Structure

- Create `supabase/security-base.sql` — `rate_events`, `rate_hit()`, `request_ip()`, `is_admin()`, `security_prune()` + cron. (Tarea 2)
- Create `supabase/coupons.sql` — columnas `expires_at`/`max_uses`, `coupon_open()`, `validate_coupon()`. (Tarea 3)
- Create `supabase/security-hardening.sql` — cierre de la Fase C. Se corre siempre **al final**, después de cualquier otro archivo de `supabase/`. (Tarea 13)
- Create `supabase/admin-mfa.sql` — Fase D. (Tarea 14)
- Create `supabase/checks/*.sql` — comprobaciones (una por tarea con SQL).
- Modify `supabase/deploy-hook.sql`, `place-order.sql`, `order-staff-notify.sql`, `newsletter-correos.sql`, `rls-hardening.sql`, `drop-legacy-policies.sql`, `add_updated_at.sql`, `order-confirmation.sql`.
- Modify `supabase/functions/shipping-quote/index.js`.
- Create `src/utils/csv.js`, `src/utils/coupons.js`, `src/utils/mfa.js`, `public/boot-head.js`, `public/boot-shell.js`, `src/pages/unsubscribe/confirm.js`.
- Modify `src/store/{coupons,newsletter,auth}.js`, `src/core/{startApp,views,routeSeo}.js`, `src/main.js`, `src/utils/toast.js`, páginas de catálogo/home/producto/checkout y de admin listadas en cada tarea, `index.html`, `vercel.json`, `scripts/prerender.mjs`, `scripts/test.mjs`, `scripts/test-admin-escaping.mjs`, `package-lock.json`.
- Create pruebas `scripts/test-csv.mjs`, `scripts/test-coupons.mjs`, `scripts/test-mfa.mjs`, `scripts/test-csp.mjs`, `scripts/test-store-escaping.mjs`.

---

### Task 1: Pedidos sin inventario y despliegues solo cuando cambian filas (Fase 0)

Cubre V-1, la parte de stock de A-1 y el despliegue por PATCH vacío de `anon`.

**Files:**
- Modify: `supabase/deploy-hook.sql` (pasos 2–4)
- Modify: `supabase/place-order.sql` (al inicio, después de `begin;`; y el comentario de las líneas 192-194)
- Modify: `supabase/drop-legacy-policies.sql:37,41` (quitar las dos líneas de `deduct_stock_on_order`; el archivo es histórico y fallaría al re-correrse)
- Create: `supabase/checks/deploy-hook.sql`

**Interfaces:**
- Produces: `public.request_rebuild() returns void` (DEFINER; hace el `net.http_post` al hook de Vault). `public.trigger_rebuild()` sigue existiendo con la misma firma (la usa `shipping_settings_rebuild`) y ahora solo llama a `request_rebuild()`. `public.products_rebuild() returns trigger`.

- [ ] **Step 1: Escribir el check `supabase/checks/deploy-hook.sql`**

Asserts, en un solo `do $$`:
- `not exists (select 1 from pg_trigger where tgname = 'tr_deduct_stock_on_order')` y `to_regproc('public.deduct_stock_on_order') is null`.
- Cuenta `v0 := (select count(*) from net.http_request_queue)`; `update public.products set name = name where false;` → la cuenta sigue en `v0`.
- `update public.products set name = name where id = (select id from public.products limit 1);` → la cuenta es `v0 + 1`.
- `delete from public.products where false;` → sin cambio.
- `raise exception 'CHECK_OK';`

- [ ] **Step 2: Cambiar `supabase/deploy-hook.sql`**

- Paso 2 (Vault): igual que `newsletter-correos.sql` paso 3 — crear el secreto solo si no existe y actualizarlo solo si el valor nuevo empieza con `https://api.vercel.com/`. Hoy re-correr el archivo pisa la URL real con `PEGA_AQUI_LA_URL` y apaga los despliegues.
- `request_rebuild()`: el cuerpo actual de `trigger_rebuild()` (sin `RETURN NULL`), `security definer`, `set search_path = public, extensions, vault, pg_temp`, `revoke all … from public, anon, authenticated`.
- `trigger_rebuild()`: `perform public.request_rebuild(); return null;` con el mismo `search_path` con `pg_temp`.
- `products_rebuild()` (mismo `search_path`, DEFINER, revoke igual). Las tablas de transición solo existen en su propia operación y plpgsql prepara cada sentencia por separado, así que van en ramas separadas:

```sql
if tg_op = 'DELETE' then
  if exists (select 1 from old_rows) then perform public.request_rebuild(); end if;
else
  if exists (select 1 from new_rows) then perform public.request_rebuild(); end if;
end if;
return null;
```

- Los tres triggers (`drop trigger if exists` antes): `products_rebuild_insert` `after insert … referencing new table as new_rows for each statement execute function public.products_rebuild()`; `products_rebuild_update` igual con `after update`; `products_rebuild_delete` `after delete … referencing old table as old_rows`.
- Actualizar el comentario `ponytail:` del final: ya no hay despliegue por pedido (no hay trigger de stock) ni por sentencias de 0 filas.

- [ ] **Step 3: Cambiar `supabase/place-order.sql`**

Justo después de `begin;`:
```sql
-- Los pedidos web no descuentan inventario: la tienda funciona como catalogo.
drop trigger if exists tr_deduct_stock_on_order on public.orders;
drop function if exists public.deduct_stock_on_order();
```
Comentario de `v_lines` (líneas 192-194): `productId` nulo en stock infinito se conserva por compatibilidad con pedidos viejos y con `order_staff_email` (busca la foto por nombre); ya no hay trigger que lo lea.

- [ ] **Step 4: El controlador aplica (Fase 0)**

Con `execute_sql`, solo estas dos sentencias de `place-order.sql` (el resto de ese archivo se aplica en la Tarea 4): `drop trigger if exists tr_deduct_stock_on_order on public.orders; drop function if exists public.deduct_stock_on_order();`. Luego `supabase/deploy-hook.sql` completo con `apply_migration` (el `PEGA_AQUI_LA_URL` ya no pisa nada). Luego `supabase/checks/deploy-hook.sql` → `CHECK_OK`. Luego `select decrypted_secret like 'https://api.vercel.com/%' from vault.decrypted_secrets where name = 'vercel_deploy_hook';` → `true`.

- [ ] **Step 5: `npm test` → ok. Commit**

```bash
git add supabase/deploy-hook.sql supabase/place-order.sql supabase/drop-legacy-policies.sql supabase/checks/deploy-hook.sql
git commit -m "fix(seguridad): pedidos sin descontar inventario y despliegue solo con filas"
```

---

### Task 2: Límites atómicos, IP de la petición y `is_admin()` (Fase A)

Base para A-1, M-1, M-2, M-4, B-10 y B-9.

**Files:**
- Create: `supabase/security-base.sql`
- Create: `supabase/checks/security-base.sql`

**Interfaces:**
- Produces:
  - `public.rate_hit(p_bucket text, p_key text, p_limit int, p_window interval) returns boolean` — DEFINER, volátil. Toma `pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || v_key, 0))`, cuenta filas de `rate_events` con ese `bucket`/`key` y `at > now() - p_window`; si la cuenta es `>= p_limit` devuelve `false` sin insertar; si no, inserta y devuelve `true`. `v_key` = `'*'` si `p_key = '*'` (tope global); si no, `encode(extensions.digest(coalesce(p_key, '') || <sal>, 'sha256'), 'hex')` con la sal del secreto de Vault `rate_salt`. `grant execute` solo a `service_role`.
  - `public.request_ip() returns text` — `stable`, no DEFINER. Lee `current_setting('request.headers', true)::json` y devuelve la cabecera elegida en el Paso 1; `'unknown'` si falta (todos los que no tienen IP comparten un cubo). Sin `grant` a `anon`.
  - `public.is_admin() returns boolean` — DEFINER, `stable`: `exists (select 1 from public.admin_users where user_id = auth.uid()) and coalesce(auth.jwt()->>'aal', '') = 'aal2'`. `grant execute` a `authenticated`. Exige `aal2` desde ya: antes de la Fase D solo lo usa el bypass de límites de `place_order`.
  - `public.security_prune() returns void` — DEFINER: borra `rate_events` con `at < now() - interval '2 days'`; borra `shipping_quotes` con `created_at < now() - interval '24 hours'` que no estén en `orders.shipping_quote_id`; `update shipping_quotes set ip_hash = null where ip_hash is not null`. Programada: `cron.schedule('security-prune', '17 * * * *', 'select public.security_prune()')`.
  - Tabla `public.rate_events (bucket text not null, key text not null, at timestamptz not null default now())`, índice `(bucket, key, at)`, RLS activado sin políticas, `revoke all … from anon, authenticated`.
  - Secreto de Vault `rate_salt`: se crea solo si no existe, con `encode(extensions.gen_random_bytes(32), 'hex')`.

- [ ] **Step 1: El controlador verifica qué cabecera trae la IP real (V-3, solo PostgREST)**

1. `execute_sql`: crear temporalmente `public._debug_request_ip() returns jsonb language sql stable as $$ select jsonb_build_object('cf', h->>'cf-connecting-ip', 'xff', h->>'x-forwarded-for', 'xri', h->>'x-real-ip') from (select current_setting('request.headers', true)::json h) t $$;` con `grant execute … to anon`.
2. Desde la máquina del controlador: `curl -s https://api.ipify.org` (IP real) y `curl -s -X POST "$URL/rest/v1/rpc/_debug_request_ip" -H "apikey: $ANON" -H "Content-Type: application/json" -H "CF-Connecting-IP: 6.6.6.6" -H "X-Forwarded-For: 7.7.7.7" -H "X-Real-IP: 8.8.8.8" -d '{}'` (`$ANON` = `VITE_SUPABASE_ANON_KEY` de `.env`).
3. Regla: si `cf` es la IP real → `request_ip()` usa `cf-connecting-ip`. Si no, y el último elemento de `xff` es la IP real → usa ese último elemento. Si ninguna es la IP real, parar y avisar al dueño: no hay cabecera confiable.
4. `drop function public._debug_request_ip();`. Anotar el resultado en el commit de esta tarea.

- [ ] **Step 2: Escribir `supabase/checks/security-base.sql`**

Asserts:
- `rate_hit('t_ip', '203.0.113.7', 2, '10 minutes')` → `true`, `true`, y la tercera vez `false`; con otra IP (`'198.51.100.1'`) → `true`.
- `rate_hit('t_glob', '*', 1, '1 minute')` → `true` y luego `false`.
- `select key from rate_events where bucket = 't_ip' limit 1` no es `'203.0.113.7'` y mide 64 caracteres (va con hash).
- Con `set_config('request.headers', '{"cf-connecting-ip":"203.0.113.7"}', true)` (o la cabecera elegida en el Paso 1) → `request_ip() = '203.0.113.7'`; con `'{}'` → `'unknown'`.
- Sin `request.jwt.claims` → `is_admin()` es `false`. Con `sub` = el `user_id` de `admin_users` y `"aal":"aal1"` → `false`; con `"aal":"aal2"` → `true`.
- `has_function_privilege('anon', 'public.rate_hit(text,text,int,interval)', 'execute')` es `false`.
- `exists (select 1 from cron.job where jobname = 'security-prune')`.
- `raise exception 'CHECK_OK';`

- [ ] **Step 3: Escribir `supabase/security-base.sql`** con lo de **Interfaces**, entre `begin;` y `commit;` (el `cron.schedule` va después del `commit`, como en `newsletter-correos.sql`).

- [ ] **Step 4: El controlador aplica** `supabase/security-base.sql` y corre `supabase/checks/security-base.sql` → `CHECK_OK`. Antes, `list_extensions` confirma `pgcrypto` (para `extensions.digest`/`gen_random_bytes`) y `pg_cron`.

- [ ] **Step 5: Commit**

```bash
git add supabase/security-base.sql supabase/checks/security-base.sql
git commit -m "feat(seguridad): limites atomicos por IP y globales, is_admin y poda"
```

---

### Task 3: Cupones por RPC, con vigencia y tope de usos (SQL en Fase A, cliente en Fase B)

Cubre M-2, I-4 y la parte de cupones de B-3.

**Files:**
- Create: `supabase/coupons.sql`, `supabase/checks/coupons.sql`
- Create: `src/utils/coupons.js`, `scripts/test-coupons.mjs`; Modify: `scripts/test.mjs`
- Modify: `src/store/coupons.js` (`applyCoupon`; borrar `isFirstPurchaseCouponAvailable`), `src/store/index.js:5` (quitar ese export)
- Modify: `src/pages/checkout/checkout.js` (borrar `checkFirstPurchaseCoupon`, sus listeners y el import; dejar `dropFirstPurchaseCoupon`, que usa el manejo del error de `place_order`)
- Modify: `src/pages/admin/adminCoupons.js` (form y tarjeta)

**Interfaces:**
- Consumes: `rate_hit`, `request_ip` (Tarea 2).
- Produces:
  - Columnas `coupons.expires_at timestamptz` y `coupons.max_uses int check (max_uses is null or max_uses > 0)`.
  - `public.coupon_open(c public.coupons) returns boolean` — `stable`, `set search_path = public, pg_temp`, sin acceso de `anon`: `c.active and (c.expires_at is null or c.expires_at > now()) and (c.max_uses is null or (select count(*) from public.orders o where o.coupon_code = c.code and coalesce(o.status, '') <> 'cancelado') < c.max_uses)`. La usa la Tarea 4.
  - `public.validate_coupon(p_code text) returns table (code text, discount numeric, free_shipping boolean, label text, categories jsonb, first_purchase_only boolean)` — plpgsql DEFINER, volátil. Primero `rate_hit('coupon_ip', request_ip(), 30, '10 minutes')`; si es `false`, `raise exception 'Demasiados intentos. Espera unos minutos.' using errcode = '22023'`. Luego normaliza el código como `place_order` (`upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))`) y devuelve la fila solo si `coupon_open(c)`; `categories` como `coalesce(to_jsonb(c.categories), '[]'::jsonb)`. `grant execute` a `anon, authenticated`.
  - `src/utils/coupons.js`: `couponExpiryIso(dateStr: string) -> string|null` (`'2026-12-31'` → `'2026-12-31T23:59:59-06:00'`; `''` → `null`) y `couponExpiryDate(iso: string|null) -> string` (inversa en hora de Ciudad de México, `'YYYY-MM-DD'`; `null` → `''`). México no tiene horario de verano desde 2022: UTC-6 fijo.

- [ ] **Step 1: Escribir `scripts/test-coupons.mjs`** y agregar `import './test-coupons.mjs'` a `scripts/test.mjs`

```js
assert.equal(couponExpiryIso('2026-12-31'), '2026-12-31T23:59:59-06:00')
assert.equal(couponExpiryIso(''), null)
assert.equal(couponExpiryDate('2026-12-31T23:59:59-06:00'), '2026-12-31')
assert.equal(couponExpiryDate('2027-01-01T05:59:59Z'), '2026-12-31')  // UTC -> dia en Mexico
assert.equal(couponExpiryDate(null), '')
```

- [ ] **Step 2: `npm test` → FAIL** (no existe `src/utils/coupons.js`).

- [ ] **Step 3: Implementar `src/utils/coupons.js`. `npm test` → PASS.**

- [ ] **Step 4: Escribir `supabase/coupons.sql` y `supabase/checks/coupons.sql`**

`coupons.sql` también incluye `alter table public.coupons add column if not exists first_purchase_only …` (hoy vive en `place-order.sql`; se queda en los dos, es idempotente). El check crea cupones de prueba dentro del bloque (`'ZZTEST1'` activo, `'ZZTEST2'` con `expires_at = now() - interval '1 day'`, `'ZZTEST3'` con `max_uses = 1` y un pedido no cancelado con ese `coupon_code` insertado a mano) y comprueba: `validate_coupon('zz-test1')` devuelve 1 fila con `code = 'ZZTEST1'`; `ZZTEST2` y `ZZTEST3` devuelven 0 filas; un código inexistente, 0 filas; con la misma IP, la llamada 31 dentro del bloque lanza `Demasiados intentos`; `has_function_privilege('anon', 'public.coupon_open(public.coupons)', 'execute')` es `false`. Termina con `CHECK_OK`.

- [ ] **Step 5: El controlador aplica `supabase/coupons.sql` (Fase A) y corre el check → `CHECK_OK`.** La política `coupons_public_read_active` sigue viva: el sitio actual la usa hasta la Fase C.

- [ ] **Step 6: Cliente**

- `applyCoupon`: `const { data, error } = await supabase.rpc('validate_coupon', { p_code: normalizedCode })`; `coupon = data?.[0]`. Si `error` y el mensaje contiene `Demasiados`, devolver ese mensaje; si no hay cupón, `'Cupón no válido o expirado'` como hoy. El resto de `applyCoupon` no cambia (los nombres de campo son los mismos).
- Borrar `isFirstPurchaseCouponAvailable` y su uso en el checkout (B-3): la regla de primera compra la avisa `place_order` al enviar, y el checkout ya quita el cupón con `dropFirstPurchaseCoupon` cuando el mensaje dice "primera compra".
- Admin: dos campos nuevos en el form, `expires_at` (`<input type="date">`, vacío = sin vencimiento; se guarda con `couponExpiryIso`, se precarga con `couponExpiryDate`) y `max_uses` (`type="number" min="1" step="1"`, vacío = sin tope → `null`). Ambos van en `payload`. La tarjeta muestra "Vence dd/mm/aaaa" y "Máx. N usos" cuando existen. Valores escapados con `esc()`.

- [ ] **Step 7: `npm test` y `npm run build` → ok. Prueba manual en `npm run dev`:** `WELCOME10` se aplica en la bolsa; un código inventado dice "Cupón no válido o expirado"; en el admin se crea un cupón con vencimiento de ayer y no se puede aplicar.

- [ ] **Step 8: Commit**

```bash
git add supabase/coupons.sql supabase/checks/coupons.sql src/utils/coupons.js scripts/test-coupons.mjs scripts/test.mjs src/store/coupons.js src/store/index.js src/pages/checkout/checkout.js src/pages/admin/adminCoupons.js
git commit -m "fix(seguridad): cupones por RPC con vigencia y tope de usos"
```

---

### Task 4: `place_order` endurecido (Fase A)

Cubre A-1 (puntos 2 y 4 + límites por IP y global), B-2, la parte de pedidos de B-8 y B-3 (`coupon_first_purchase_ok`).

**Files:**
- Modify: `supabase/place-order.sql`
- Create: `supabase/checks/place-order.sql`

**Interfaces:**
- Consumes: `rate_hit`, `request_ip`, `is_admin` (Tarea 2); `coupon_open` (Tarea 3).
- Produces: misma firma de 12 argumentos de `place_order`, mismo `returns public.orders`. `coupon_first_purchase_ok` deja de existir.

- [ ] **Step 1: Escribir `supabase/checks/place-order.sql`**

Dentro del bloque: elegir un producto publicado con stock infinito (`badge is distinct from 'Borrador' and (stock is null or btrim(stock::text) in ('', '∞'))`), uno con `badge = 'Borrador'` (si no hay, crearlo dentro del bloque) y poner un producto a `stock = '1'` dentro del bloque. Fijar `request.headers` con la IP `203.0.113.7`. Un `p_items` válido = `[{"productId": <id>, "size": "", "color": "", "qty": 1}]` (si el producto tiene `sizes`/`colors`, usar su primer valor). Cada caso que debe fallar va en un sub-bloque `begin … exception when others then v_msg := sqlerrm; end;` y se compara el mensaje.
- Pedido válido (`'Transferencia'`, `'Recoger en tienda'`) → devuelve fila con `status = 'pendientedepago'`.
- Producto borrador → `'Uno de los productos ya no esta disponible.'`
- `qty = 2` del producto con `stock = '1'` → `'Uno de los productos esta agotado o no tiene suficientes piezas.'`; con `stock = '0'` y `qty = 1`, el mismo mensaje.
- `size = 'XXL-NO-EXISTE'` en un producto con `sizes` no vacío → `'Revisa la talla o el color de tus productos.'`
- `p_payment_method = 'PAGADO - transferencia confirmada'` → `'Metodo de pago o de entrega invalido.'`; `p_delivery_method = 'Envío a domicilio '` (con espacio) → el mismo.
- `p_customer_email = 'a<b@x.com'` → `'El correo no parece valido.'`
- `'Envío a domicilio'` con `p_address = 'OTRA DIRECCION'` y `p_address_parts = {"street":"Zaragoza","numExt":"140","numInt":"","neighborhood":"Centro","city":"Colima","state":"COL","stateName":"Colima","zip":"28000","references":"","evil":"x"}` → `address = 'Zaragoza #140, Col. Centro, Colima, Colima, C.P. 28000'` y `address_parts` sin la clave `evil`.
- Límites: con el mismo WhatsApp en formatos distintos (`'312 123 4567'`, `'3121234567'`, `'(312)1234567'`, `'+52 312 123 4567'`, `'044 312 123 4567'`) y una IP distinta por llamada, el 6.º pedido lanza `'Demasiados pedidos seguidos. Espera unos minutos.'`. Con 5 números distintos y la misma IP, el 6.º también.
- Con `request.jwt.claims` del admin y `"aal":"aal2"`, 6 pedidos seguidos con la misma IP pasan.
- `to_regprocedure('public.coupon_first_purchase_ok(text,text,text)') is null`.
- `CHECK_OK`.

- [ ] **Step 2: Cambiar `place_order` en `supabase/place-order.sql`**

En este orden dentro de la función:
1. **Contacto:** el correo además se rechaza si `v_email ~ '[<>"'']'`.
2. **Métodos:** `if p_payment_method not in ('Transferencia', 'Pago al recoger') or p_delivery_method not in ('Recoger en tienda', 'Envío a domicilio') then raise exception 'Metodo de pago o de entrega invalido.' using errcode = '22023';` Se guardan tal cual (ya no hace falta `left(…, 80)`).
3. **Límites** (reemplazan el `select count(*) … customer_whatsapp = v_whatsapp`), solo `if not public.is_admin()`: `rate_hit('order_ip', request_ip(), 5, '10 minutes')`, `rate_hit('order_phone', phone_key(v_whatsapp), 5, '10 minutes')` y `rate_hit('order_global', '*', 30, '1 hour')`; si cualquiera da `false` → el mismo mensaje de hoy. Como un `raise` posterior deshace la transacción, solo cuentan los pedidos que de verdad se guardan.
4. **Cupón:** el `select` usa `… and public.coupon_open(c)` en vez de `and active = true` (alias `c`). Si `v_coupon.max_uses is not null`, `perform pg_advisory_xact_lock(hashtext('coupon:' || v_coupon.code))` antes de contar, para que dos pedidos simultáneos no pasen el tope.
5. **Por línea:** si `v_product.badge = 'Borrador'` → mismo mensaje que "no encontrado". Talla/color: `v_size := left(translate(coalesce(v_item->>'size', ''), '<>', ''), 40)` (igual `v_color`); si `v_size <> ''` y `jsonb_array_length(coalesce(to_jsonb(v_product.sizes), '[]')) > 0` y `not (to_jsonb(v_product.sizes) ? v_size)` → `'Revisa la talla o el color de tus productos.'`; igual con `colors`. `v_lines` usa `v_size`/`v_color`.
6. **Existencias**, después del bucle (la cantidad se suma por producto): para cada `productId` con stock numérico (`btrim(stock::text) ~ '^-?[0-9]+$'`), si `stock::int <= 0` o la suma de `qty` > `stock::int` → `'Uno de los productos esta agotado o no tiene suficientes piezas.'`. No se descuenta nada.
7. **Dirección por partes:** `v_parts` solo conserva las claves `street, numExt, numInt, neighborhood, city, state, stateName, zip, references`. Si `p_delivery_method = 'Envío a domicilio'` y `v_parts` es objeto, `v_address` se arma desde `v_parts` con el mismo formato que `src/pages/checkout/checkout.js:605`: `street || ' #' || numExt || [' Int. ' || numInt si no vacío] || ', Col. ' || neighborhood || ', ' || city || ', ' || stateName || ', C.P. ' || zip || [' | Ref: ' || references si no vacío]`; si falta alguna de `street, numExt, neighborhood, city, stateName, zip` → `'Completa tu direccion de envio.'`. Sin partes se usa `p_address` saneado como hoy (sitios viejos en caché).
8. **No se exige cotización** en envío a domicilio: el checkout tiene un modo sin cotización (Envia caído) y el pedido debe poder entrar; con métodos exactos ya no se puede evitar el cobro mandando `'Envío a domicilio '`.

Fuera de la función: borrar `coupon_first_purchase_ok` (creación, revoke y grant) y agregar `drop function if exists public.coupon_first_purchase_ok(text, text, text);`. El sitio actual la llama, pero si falla no bloquea nada (`if (error) return true`). En `phone_key` agregar `set search_path = public, pg_temp` dentro del propio `create or replace` (I-1).

- [ ] **Step 3: El controlador aplica (Fase A)** — consulta del pico de pedidos (Global Constraints), luego `supabase/coupons.sql` ya aplicado, luego `supabase/place-order.sql` completo, luego `supabase/checks/place-order.sql` → `CHECK_OK`. Después, Q-7 de la auditoría → una sola fila de 12 argumentos.

- [ ] **Step 4: Prueba manual en el sitio de producción (sin tocar código):** un pedido real de prueba con `Recoger en tienda` entra; el admin lo cancela.

- [ ] **Step 5: Commit**

```bash
git add supabase/place-order.sql supabase/checks/place-order.sql
git commit -m "fix(seguridad): place_order con limites por IP, borradores, existencias y metodos validos"
```

---

### Task 5: Tope de avisos de pedido al equipo (Fase A)

Cubre A-1 punto 3 (cuota de Resend).

**Files:**
- Modify: `supabase/order-staff-notify.sql`
- Create: `supabase/checks/order-staff-notify.sql`

**Interfaces:**
- Consumes: `rate_hit` (Tarea 2); `resend_post` (`newsletter-correos.sql`).
- Produces: `public.send_staff_alert() returns bigint` — DEFINER, `set search_path = public, extensions, vault, pg_temp`, revoke a todos; manda a toda `order_notify_emails` desde `'G&L Pedidos <hola@glboutique.com.mx>'` el asunto `Alerta G&L: se pausaron los avisos de pedidos` y este HTML: `<p>Entraron más de 40 pedidos en 24 horas. Para no agotar la cuota de correos, dejamos de mandar un aviso por pedido durante las próximas horas.</p><p>Revisa los pedidos en <a href="https://glboutique.com.mx/admin/orders">el admin</a>. Si no los reconoces, puede ser un ataque: avisa a quien mantiene la tienda.</p>`. Nunca lanza error (como `send_order_staff_email`).

- [ ] **Step 1: Escribir el check.** Dentro del bloque: llamar `rate_hit('staff_mail', '*', 40, '24 hours')` 40 veces; contar `net.http_request_queue`; insertar un pedido con `place_order` (como en la Tarea 4) → la cola sube 1 y ese cuerpo contiene `Alerta G&L`; otro pedido → la cola no sube. `CHECK_OK`. (Requiere al menos un correo en `order_notify_emails` y la clave de Resend: si falta, el check debe fallar con un mensaje claro, no dar `CHECK_OK`.)

- [ ] **Step 2: Cambiar `notify_staff_on_order()`:** en `INSERT`, `if public.rate_hit('staff_mail', '*', 40, '24 hours') then perform public.send_order_staff_email(new.id, 'nuevo'); elsif public.rate_hit('staff_alert', '*', 1, '24 hours') then perform public.send_staff_alert(); end if;`. Las cancelaciones no cambian. Agregar `pg_temp` a los `search_path` de las funciones DEFINER de este archivo.

- [ ] **Step 3: El controlador aplica** `supabase/order-staff-notify.sql` y corre el check → `CHECK_OK`. Luego "Mandar prueba" en Admin → Pedidos sigue llegando.

- [ ] **Step 4: Commit**

```bash
git add supabase/order-staff-notify.sql supabase/checks/order-staff-notify.sql
git commit -m "fix(seguridad): tope diario de avisos de pedido y alerta unica"
```

---

### Task 6: Boletín con doble confirmación (SQL en Fase A, cliente en Fase B)

Cubre M-1, la parte de boletín de B-3 y V-8.

**Files:**
- Modify: `supabase/newsletter-correos.sql`
- Create: `supabase/checks/newsletter.sql`
- Modify: `src/store/newsletter.js` (`subscribeNewsletter`; nueva `confirmNewsletter`), `src/store/index.js:8`
- Modify: `src/pages/home/home.js:428-445` (texto de éxito)
- Create: `src/pages/unsubscribe/confirm.js`; Modify: `src/core/views.js` (ruta `/confirmar`), `src/core/routeSeo.js` (junto a `/baja`, `noindex`), `scripts/prerender.mjs:237` (mapear `/confirmar` como `/baja`)
- Modify: `src/pages/admin/adminNewsletter.js` (`isActive`, estado "Pendiente")

**Interfaces:**
- Consumes: `rate_hit`, `request_ip` (Tarea 2).
- Produces:
  - Columnas `newsletter_subscribers.confirmed_at timestamptz`, `confirm_token uuid`, `confirm_sent_at timestamptz`.
  - Relleno (idempotente): `update … set confirmed_at = coalesce(created_at, now()) where confirmed_at is null and confirm_token is null;` — solo filas viejas o de altas directas; las pendientes siempre tienen `confirm_token`.
  - `public.newsletter_subscribe(p_email text) returns void` — DEFINER. (1) Normaliza `lower(btrim(p_email))`; si mide > 254, no cumple `^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$` o contiene `[<>"']` → `'El correo no parece valido.'` (22023). (2) `rate_hit('nl_ip', request_ip(), 3, '1 hour')` o → `'Demasiados intentos. Intenta mas tarde.'`. (3) `pg_advisory_xact_lock(hashtext('nl:' || email))` y busca la fila por `lower(email)`. (4) Si existe, confirmada y sin baja → `return`. Si `confirm_sent_at > now() - interval '24 hours'` → `return`. (5) Si `not rate_hit('nl_global', '*', 30, '24 hours')` → el mismo mensaje del paso 2. (6) Inserta (`source = 'home_page'`) o actualiza con `confirm_token = gen_random_uuid(), confirm_sent_at = now()` sin tocar `unsubscribed_at` ni `confirmed_at`, y llama `send_confirm_to(email, confirm_token)`. Siempre responde lo mismo, exista o no el correo. `grant` a `anon, authenticated`.
  - `public.newsletter_confirm(p_token uuid) returns boolean` — DEFINER. Actualiza la fila con ese `confirm_token` y `confirm_sent_at > now() - interval '7 days'`: `confirmed_at = now(), unsubscribed_at = null, unsub_token = gen_random_uuid(), confirm_token = null`; luego `send_welcome_to(email, unsub_token)`; devuelve si encontró fila. `grant` a `anon, authenticated`.
  - `public.send_confirm_to(p_email text, p_token uuid) returns void` — DEFINER, revoke a todos, nunca lanza. `from`/`reply_to` como `newsletter_email_json`; asunto `Confirma tu suscripción a G&L`; HTML: `<p>Hola:</p><p>Para recibir las novedades de G&amp;L, confirma tu correo:</p><p><a href="https://www.glboutique.com.mx/confirmar?t=<token>">Confirmar suscripción</a></p><p>Si no fuiste tú, ignora este correo. No te volveremos a escribir.</p>`.
  - `send_welcome_email()` (trigger): solo manda si `NEW.confirm_token is null` (alta directa del sitio viejo durante la transición). El trigger y `newsletter_resubscribe` se quitan en la Tarea 13.
  - `send_newsletter()`: el conteo y la cola usan `unsubscribed_at is null and confirmed_at is not null`.
  - Cliente: `subscribeNewsletter(email) -> { ok, error? }` llama `supabase.rpc('newsletter_subscribe', { p_email })`; error con `Demasiados` → ese texto; otro error → `'No se pudo guardar tu suscripción. Intenta de nuevo.'`. `confirmNewsletter(token) -> true|false|null` igual que `unsubscribeNewsletter`.

- [ ] **Step 1: El controlador corre Q-9 de la auditoría** y `select lower(email), count(*) from newsletter_subscribers group by 1 having count(*) > 1;`. Si hay duplicados por mayúsculas, avisar antes de seguir (la función busca por `lower(email)`).

- [ ] **Step 2: Escribir `supabase/checks/newsletter.sql`.** Con la IP `203.0.113.7` y el correo `zz+test@example.com`: contar la cola de pg_net; `newsletter_subscribe('ZZ+Test@Example.com ')` → la cola sube 1 y hay una fila pendiente (`confirmed_at is null`, `confirm_token` no nulo); repetir → la cola no sube; `newsletter_confirm(<token>)` → `true`, `confirmed_at` no nulo, `confirm_token` nulo; `newsletter_confirm(gen_random_uuid())` → `false`; `newsletter_subscribe('no-es-correo')` → `'El correo no parece valido.'`; desde la misma IP, la 4.ª suscripción nueva (otro correo) → `'Demasiados intentos. Intenta mas tarde.'`. Un suscriptor dado de baja (crearlo en el bloque) que vuelve a suscribirse sigue con `unsubscribed_at` puesto hasta confirmar. `CHECK_OK`.

- [ ] **Step 3: Escribir los cambios SQL** en `supabase/newsletter-correos.sql` (lo de **Interfaces**; `newsletter_resubscribe` y el trigger se quedan por ahora; `pg_temp` en todos los `search_path` del archivo).

- [ ] **Step 4: El controlador aplica `newsletter-correos.sql` (Fase A) y corre el check → `CHECK_OK`.** Luego `select count(*) filter (where confirmed_at is null) from newsletter_subscribers;` → 0.

- [ ] **Step 5: Cliente.** `subscribeNewsletter` sin `insert` ni `newsletter_resubscribe`. Home, éxito: título `Revisa tu correo.` y texto `Te mandamos un enlace para confirmar tu suscripción al Club G&L.`. Página `/confirmar?t=` igual que `unsubscribe.js`, con estos textos: cargando `Un momento…` / `Estamos confirmando tu suscripción.`; listo `Listo, ya eres parte del Club G&L.` / `Te mandamos un correo de bienvenida.`; inválido `Este enlace no es válido o ya venció.` / `Vuelve a suscribirte desde la página principal y te mandamos uno nuevo.`; error `No pudimos confirmar tu suscripción.` / `Revisa tu conexión e inténtalo de nuevo en un momento.`. Admin: `isActive = s => Boolean(s.confirmed_at) && !s.unsubscribed_at`; estado de cada fila `Activo` | `Pendiente` (sin `confirmed_at`, sin baja) | `Dado de baja`, en la tabla y en el CSV.

- [ ] **Step 6: `npm test` y `npm run build` → ok** (el build genera `dist/confirmar…` igual que `/baja`). Commit.

```bash
git add supabase/newsletter-correos.sql supabase/checks/newsletter.sql src/store/newsletter.js src/store/index.js src/pages/home/home.js src/pages/unsubscribe/confirm.js src/core/views.js src/core/routeSeo.js scripts/prerender.mjs src/pages/admin/adminNewsletter.js
git commit -m "fix(seguridad): boletin con doble confirmacion y limites"
```

---

### Task 7: Edge Function `shipping-quote` con límite atómico, tope global y caché (Fase A)

Cubre M-4, B-10 y V-3 de la función.

**Files:**
- Modify: `supabase/functions/shipping-quote/index.js`

**Interfaces:**
- Consumes: `rate_hit` (Tarea 2) vía `db.rpc` con service role.
- Produces: misma respuesta JSON que hoy (`{ quoteId, standard, express, freeShippingMin }` | `{ fallback: true }` | `{ error }`).

- [ ] **Step 1: Cambiar `index.js`**
- IP: solo la cabecera que eligió la Tarea 2 Paso 1 (`req.headers.get('cf-connecting-ip')` si fue esa); si falta, `'unknown'`. Borrar el uso de `x-real-ip` y el `sha256`.
- Después de validar el cuerpo: `rate_hit` con `{ p_bucket: 'quote_ip', p_key: ip, p_limit: 10, p_window: '1 minute' }` y luego `{ p_bucket: 'quote_global', p_key: '*', p_limit: 60, p_window: '1 minute' }`; si hay `error` o alguna da `false` → `429 { error: 'rate_limited' }`. Se borra el conteo previo (`select … count`).
- Caché: después de validar CP/estado/ciudad y leer `shipping_settings`, buscar en `shipping_quotes` la fila más reciente con el mismo `zip` y `cart_key`, `standard` no nulo, `created_at > now() - 10 min` y `expires_at > now() + 20 min`; si existe, responder con su `id` y sus tarifas (mismo `pub()`) sin llamar a Envia ni insertar.
- El insert del intento ya no lleva `ip_hash`.

- [ ] **Step 2: `npm test` → ok** (la lógica compartida no cambia).

- [ ] **Step 3: El controlador despliega** con `deploy_edge_function` (`shipping-quote`, importando `../_shared/*`) y hace la prueba P-1 de la auditoría: 12 POST válidos seguidos, cada uno con `CF-Connecting-IP`, `X-Real-IP` y `X-Forwarded-For` distintos → el 11.º y el 12.º devuelven `429`. Luego, dos cotizaciones iguales seguidas desde el checkout → la segunda responde el mismo `quoteId` (caché).

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/shipping-quote/index.js
git commit -m "fix(seguridad): cotizador con limite atomico por IP, tope global y cache"
```

---

### Task 8: Escapar lo que se pinta con `innerHTML` (Fase B)

Cubre B-1 y B-4 (y la parte de XSS de M-3).

**Files:**
- Modify: `src/utils/toast.js:39` — el mensaje va con `textContent` en un `<span>` creado con DOM, nunca dentro de `innerHTML` (ningún llamador manda HTML a `showToast`; esto cubre también `adminCategories.js:129`).
- Modify: `src/core/startApp.js:614,617` — `escapeHtml(n.title)` y `escapeHtml(n.body)` en la campana. (`:58`/`:63` arman texto que ahora va por `textContent`/`Notification`; no hace falta escapar ahí.)
- Modify con `escapeHtml` (de `src/utils/sanitize.js`) o el `esc()` local del archivo: `src/pages/catalog/catalogCard.js:86,101`; `src/pages/home/homeCards.js:32,40`; `src/pages/product/product.js:232` (`data-color` y el nombre), `:507` (`r.quote`); `src/pages/catalog/catalog.js:38,570,575,580` (valor y texto de cada `<option>`); `src/pages/admin/adminCategories.js:72,163`.
- Create: `scripts/test-store-escaping.mjs`; Modify: `scripts/test-admin-escaping.mjs`, `scripts/test.mjs`

**Interfaces:**
- Consumes: `escapeHtml(str) -> string` (ya existe).

- [ ] **Step 1: Escribir `scripts/test-store-escaping.mjs`** y agregarlo junto con `./test-admin-escaping.mjs` (hoy no está) a `scripts/test.mjs`

```js
const evil = '<img src=x onerror=alert(1)>'
const p = { id: 'x', name: evil, type: evil, price: 100, images: ['https://bcnfbrhcubpysqpyhbvf.supabase.co/a.webp'], sizes: [], colors: [evil], stock: '' }
assert.ok(!productCard(p, 0).includes('<img src=x'))
assert.ok(!bestSellerRow(p, 0).includes('<img src=x'))
```
Si importar `catalogCard.js`/`homeCards.js` en Node falla por dependencias del DOM, en su lugar extender el chequeo por texto del siguiente paso con esos archivos.

- [ ] **Step 2: Extender `scripts/test-admin-escaping.mjs`:** además de `src/pages/admin`, revisar `src/core/startApp.js`, `src/pages/catalog/catalog.js`, `src/pages/catalog/catalogCard.js`, `src/pages/home/homeCards.js`, `src/pages/product/product.js` con un segundo patrón que marque `${p.name}`, `${cat.name}`, `${r.quote}`, `${n.title}`, `${n.body}`, `${x}` y `${c}` sin `esc(`/`escapeHtml(` (misma regla de `// not-html:` y de ternarios que ya tiene).

- [ ] **Step 3: `npm test` → FAIL** con la lista de fugas.

- [ ] **Step 4: Escapar en las líneas listadas. `npm test` → PASS. `npm run build` → ok.**

- [ ] **Step 5: Prueba manual:** en `npm run dev` con sesión de admin, crear una categoría `<b>x</b>` → se ve el texto literal en el admin y en el filtro del catálogo; borrarla.

- [ ] **Step 6: Commit**

```bash
git add src/utils/toast.js src/core/startApp.js src/pages/catalog src/pages/home/homeCards.js src/pages/product/product.js src/pages/admin/adminCategories.js scripts/test-store-escaping.mjs scripts/test-admin-escaping.mjs scripts/test.mjs
git commit -m "fix(seguridad): escapar nombres de cliente, producto y categoria en el HTML"
```

---

### Task 9: CSV sin fórmulas (Fase B)

Cubre B-6.

**Files:**
- Create: `src/utils/csv.js`, `scripts/test-csv.mjs`; Modify: `scripts/test.mjs`
- Modify: `src/pages/admin/adminClientes.js:275`, `src/pages/admin/adminNewsletter.js:200`

**Interfaces:**
- Produces: `csvCell(value: unknown) -> string` — `String(value ?? '')`; si empieza con `=`, `+`, `-`, `@`, tabulador o `\r`/`\n`, se antepone `'`; se duplican las comillas y se envuelve en comillas. `csvRow(values: unknown[]) -> string` = celdas unidas con `,`.

- [ ] **Step 1: Escribir `scripts/test-csv.mjs`**

```js
assert.equal(csvCell('=HYPERLINK("http://x","Ver")'), `"'=HYPERLINK(""http://x"",""Ver"")"`)
assert.equal(csvCell('Juan "J" Pérez'), '"Juan ""J"" Pérez"')
assert.equal(csvCell('+52 312 123 4567'), `"'+52 312 123 4567"`)
assert.equal(csvCell('@a'), `"'@a"`)
assert.equal(csvCell('\tx'), `"'\tx"`)
assert.equal(csvCell(null), '""')
assert.equal(csvCell(12.5), '"12.5"')
assert.equal(csvRow(['a', 'b,c']), '"a","b,c"')
```

- [ ] **Step 2: `npm test` → FAIL. Step 3: implementar `src/utils/csv.js` → PASS.**

- [ ] **Step 4: Usar `csvRow` en cada fila (encabezados incluidos) de los dos exportes. `npm test`, `npm run build` → ok. Commit.**

```bash
git add src/utils/csv.js scripts/test-csv.mjs scripts/test.mjs src/pages/admin/adminClientes.js src/pages/admin/adminNewsletter.js
git commit -m "fix(seguridad): CSV de clientes y boletin sin formulas"
```

---

### Task 10: CSP sin scripts en línea (Fase B)

Cubre B-5.

**Files:**
- Create: `public/boot-head.js` (el cuerpo del `<script>` de `index.html:65-75`, canonical) y `public/boot-shell.js` (el de `index.html:675-680`, ocultar el shell fuera de `/`).
- Modify: `index.html` — `<script src="/boot-head.js"></script>` **conservando justo antes el comentario `<!-- Inline script: set canonical dynamically BEFORE app loads (for crawlers) -->`** (`scripts/prerender.mjs:194` lo busca con ese texto y reemplaza hasta el primer `</script>`); `<script src="/boot-shell.js"></script>` en el lugar del segundo; borrar el tercero (registro del service worker) y moverlo a `src/main.js`.
- Modify: `src/main.js` — registro del SW y tres listeners delegados en `document`: `click` en `[data-reload]` → `location.reload()`; `error` en captura (`true`) para `img[data-fallback]` → `img.src = img.dataset.fallback` si aún no lo es; `wheel` (`{ passive: true }`) sobre `input[type=number]` enfocado → `blur()`.
- Modify: quitar `onclick=`/`onerror=`/`onwheel=` de `src/core/startApp.js:340`, `src/main.js:25`, `src/utils/toast.js:36` (→ `data-reload`), `src/pages/home/homeCards.js:40`, `src/pages/product/product.js:49` (→ `data-fallback="/placeholder.webp"`), `src/pages/admin/adminCoupons.js`, `adminPromotions.js` (2), `adminShipping.js` (5) (→ sin atributo; lo cubre el listener de `wheel`).
- Modify: `src/pages/admin/adminOrders.js:138-142,332-335` — `printOrderHtml` ya no lleva `<script>` (la ventana `about:blank` hereda la CSP); tras `pw.document.close()`, el que abre la ventana espera la primera imagen (`complete` / `onload` / `onerror`) y llama `pw.focus(); pw.print()`.
- Modify: `vercel.json` — CSP y HSTS.
- Create: `scripts/test-csp.mjs`; Modify: `scripts/test.mjs`

**Interfaces:**
- Produces: CSP exacta:
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https://bcnfbrhcubpysqpyhbvf.supabase.co https://images.unsplash.com https://www.glboutique.com.mx; connect-src 'self' https://bcnfbrhcubpysqpyhbvf.supabase.co wss://bcnfbrhcubpysqpyhbvf.supabase.co; worker-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`
  y un header nuevo `Strict-Transport-Security: max-age=63072000; includeSubDomains` (sin `preload`: es irreversible a corto plazo, decisión del dueño). `style-src 'unsafe-inline'` se queda: hay cientos de `style=` y no permite ejecutar código.

- [ ] **Step 1: El controlador confirma los hosts de imágenes** (solo lectura): `select distinct substring(u from '^https?://[^/]+') from (select unnest(images) u from products union all select image_url from products) t where u is not null;` y `select distinct (regexp_matches(t::text, 'https?://[^/"\\]+', 'g'))[1] from site_content t;`. Cada host que salga y no esté en `img-src` se agrega a la CSP de arriba (y al test) antes de seguir.

- [ ] **Step 2: Escribir `scripts/test-csp.mjs`**
- La CSP de `vercel.json` es exactamente la de **Interfaces**; existe el header HSTS con `includeSubDomains`.
- Ningún archivo `.js` bajo `src/` contiene `/\son[a-z]+="/`.
- En `index.html`, todo `<script` tiene `src=` o `type="application/ld+json"`/`type="application/json"`.
- Si existe `dist/`, lo mismo para cada `dist/**/*.html`.

- [ ] **Step 3: `npm test` → FAIL. Step 4: hacer los cambios de **Files**. `npm run build` y luego `npm test` → PASS** (con `dist/` ya generado, el test revisa también las 250+ páginas).

- [ ] **Step 5: Commit**

```bash
git add public/boot-head.js public/boot-shell.js index.html src vercel.json scripts/test-csp.mjs scripts/test.mjs
git commit -m "fix(seguridad): CSP sin scripts en linea, hosts exactos y HSTS con subdominios"
```

- [ ] **Step 6: Verificación en el preview de Vercel** (push de la rama; nada de esto en producción todavía), con la consola abierta buscando `Content Security Policy`: home sin JS (shell visible solo en `/`), `/catalog`, una ficha `/producto/…` (fotos y una con imagen rota → placeholder), bolsa con cupón, checkout hasta la cotización (sin enviar), `/baja?t=x`, `/confirmar?t=x`; en el admin: login, realtime (un pedido de prueba hace sonar la campana), subir una foto a un producto y a Contenido, "Imprimir" un pedido, vista previa de correos. Cero violaciones de CSP. El canonical sigue en el HTML de cada página (ver fuente de una ficha).

---

### Task 11: Admin — MFA en el login, contraseña sin `.trim()`, borradores tras entrar (Fase B)

Cubre la parte de código de B-9 y la parte de admin de B-8.

**Files:**
- Create: `src/utils/mfa.js`, `scripts/test-mfa.mjs`; Modify: `scripts/test.mjs`
- Modify: `src/store/auth.js` (`adminLogin`, funciones MFA nuevas), `src/store/index.js`, `src/pages/admin/adminLogin.js`

**Interfaces:**
- Produces:
  - `mfaStep({ currentLevel, nextLevel }) -> 'none' | 'challenge' | 'enroll'` en `src/utils/mfa.js`: `currentLevel === 'aal2'` → `'none'`; `nextLevel === 'aal2'` → `'challenge'`; si no → `'enroll'`.
  - En `src/store/auth.js`: `getMfaStep() -> Promise<'none'|'challenge'|'enroll'>` (usa `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`); `startMfaEnroll() -> Promise<{ factorId, qr, secret } | { error }>` (`mfa.enroll({ factorType: 'totp', friendlyName: 'G&L admin' })`; `qr` es el `data:` SVG que devuelve Supabase, permitido por `img-src data:`); `verifyMfa(code: string, factorId?: string) -> Promise<{ error? }>` (`mfa.challengeAndVerify`; sin `factorId` usa el primer factor TOTP verificado de `mfa.listFactors()`).
  - `adminLogin(email, pass)`: después de `signInWithPassword` no da por hecho el acceso; la página pregunta `getMfaStep()`. Tras `'none'` (o tras verificar el código): `refreshProducts()` (con sesión de admin, la lectura trae borradores; ver Tarea 13) y luego la comprobación de `admin_users` de siempre.

- [ ] **Step 1: Escribir `scripts/test-mfa.mjs`**

```js
assert.equal(mfaStep({ currentLevel: 'aal2', nextLevel: 'aal2' }), 'none')
assert.equal(mfaStep({ currentLevel: 'aal1', nextLevel: 'aal2' }), 'challenge')
assert.equal(mfaStep({ currentLevel: 'aal1', nextLevel: 'aal1' }), 'enroll')
```

- [ ] **Step 2: `npm test` → FAIL. Step 3: implementar `src/utils/mfa.js` → PASS.**

- [ ] **Step 4: Login en dos pasos en `adminLogin.js`**
- Quitar `.trim()` de la contraseña (`:130`).
- Tras la contraseña: `'challenge'` → campo de 6 dígitos (`inputmode="numeric" autocomplete="one-time-code" maxlength="6"`, etiqueta `Código de tu app de autenticación`); `'enroll'` → texto `Para entrar al admin necesitas un segundo paso. Escanea este código con Google Authenticator, 1Password o Authy y escribe el código de 6 dígitos.`, el QR (`<img>` con `qr`), el secreto como texto para copiar y el mismo campo. Código incorrecto → `Código incorrecto. Revisa la hora de tu teléfono e inténtalo de nuevo.` y cuenta para el bloqueo progresivo que ya existe.
- Al montar la página: si ya hay sesión con `getMfaStep() === 'challenge'`, mostrar directo el paso del código (sesiones viejas `aal1` después de la Fase D).
- Todo lo que venga de Supabase se pinta con `textContent` o `esc()`.

- [ ] **Step 5: `npm test`, `npm run build` → ok.** Prueba manual en `npm run dev` con una cuenta de prueba que NO sea la del dueño (crearla y darla de alta en `admin_users` la hace el controlador; borrarla al terminar): alta del factor, salir, entrar con código, código incorrecto. Avisar al dueño: después del deploy, su siguiente entrada le pedirá dar de alta el factor.

- [ ] **Step 6: Commit**

```bash
git add src/utils/mfa.js scripts/test-mfa.mjs scripts/test.mjs src/store/auth.js src/store/index.js src/pages/admin/adminLogin.js
git commit -m "feat(seguridad): segundo factor TOTP en el login del admin"
```

---

### Task 12: Dependencias (Fase B)

Cubre B-7.

**Files:**
- Modify: `package.json` (solo si `npm audit fix` cambia rangos), `package-lock.json`

- [ ] **Step 1:** `npm audit fix` (sin `--force`).
- [ ] **Step 2:** `npm audit` → 0 avisos altos. Si queda alguno que solo se arregla con `--force` (cambio de mayor), no forzarlo: anotarlo en el mensaje del commit con el paquete y la razón.
- [ ] **Step 3:** `npm test` y `npm run build` → ok; `npm run dev` abre la home.
- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(seguridad): npm audit fix en herramientas de build"
```

---

### Task 13: Cierre — permisos, políticas, Storage e higiene del repo (Fase C)

Cubre M-3, I-1, I-2, la política de B-8, V-2, V-4, V-6, V-7 y el cierre de M-1/M-2/B-3. **Se aplica ≥ 24 h después del deploy de la Fase B.**

**Files:**
- Create: `supabase/security-hardening.sql`, `supabase/checks/security-hardening.sql`
- Modify: `supabase/rls-hardening.sql` (higiene, ver Paso 4), `supabase/newsletter-correos.sql` (quitar `newsletter_resubscribe` y el trigger `newsletter_welcome_email`, con su `REVOKE/GRANT`), `supabase/add_updated_at.sql` (`set_updated_at` con `SET search_path = public, pg_temp` en el propio `CREATE`), `supabase/order-confirmation.sql` (`pg_temp`)

**Interfaces:**
- Consumes: todo lo anterior aplicado y el frontend nuevo en producción.

- [ ] **Step 1: El controlador comprueba que ya nadie usa las puertas viejas** (`query_logs`, servicio `api`, últimas 24 h): 0 peticiones a `POST /rest/v1/newsletter_subscribers`, `GET /rest/v1/coupons`, `/rpc/newsletter_resubscribe`, `/rpc/coupon_first_purchase_ok`. Si hay, esperar otras 24 h. También corre Q-1, Q-2, Q-5, Q-6, Q-8 y `select polname from pg_policy where polrelid in ('public.categories'::regclass, 'public.site_content'::regclass);` y le pasa los nombres exactos al implementador.

- [ ] **Step 2: Escribir `supabase/checks/security-hardening.sql`**, con asserts sobre el estado final:
- Ninguna tabla de `public` da `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` ni `TRIGGER` a `anon` (`information_schema.role_table_grants`); ninguna da `TRUNCATE` a `authenticated`.
- Para cada tabla de `public` y cada comando `INSERT`/`UPDATE`/`DELETE` que `authenticated` todavía tiene, existe una política de ese comando (o `ALL`) para `authenticated` o `public`.
- No existen las políticas `newsletter_public_insert`, `coupons_public_read_active`, `orders_public_insert`, `products_bucket_public_read`; existen `products_public_read` (con `badge`), `products_admin_read`, `products_bucket_admin_read`.
- Como `anon` (`set local role anon` dentro del bloque): `select count(*) from products where badge = 'Borrador'` = 0; `select count(*) from coupons` = 0; un `insert into newsletter_subscribers` lanza `permission denied`. Volver con `reset role`.
- No existen `newsletter_resubscribe(text)` ni el trigger `newsletter_welcome_email`.
- `anon` no ejecuta `html_esc(text)`, `money_mx(numeric)`, `newsletter_email_json(text,uuid,text,text)`, `order_staff_email(orders,text)`, `phone_key(text)`; sí ejecuta `place_order(…12…)`, `validate_coupon(text)`, `newsletter_subscribe(text)`, `newsletter_confirm(uuid)`, `newsletter_unsubscribe(uuid)`, `free_shipping_min()`.
- Toda función `SECURITY DEFINER` de `public` tiene `pg_temp` en su `search_path` (`proconfig`).
- `pg_default_acl` del rol dueño de las tablas (`postgres`) en `public` ya no da a `anon` escritura en tablas ni `EXECUTE` en funciones.
- `CHECK_OK`.

- [ ] **Step 3: Escribir `supabase/security-hardening.sql`** (encabezado: "Se corre siempre al final, después de cualquier otro archivo de supabase/"), en este orden:
1. `revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;` `revoke truncate, references, trigger on all tables in schema public from authenticated;` `revoke usage, update on all sequences in schema public from anon;`
2. Un `do $$` que recorre cada tabla de `public` y cada comando `INSERT`/`UPDATE`/`DELETE` y hace `revoke <cmd> on <tabla> from authenticated` si no hay política de ese comando (o `ALL`) cuyo `polroles` incluya `authenticated` o `public` (`0`). Así `orders` conserva `UPDATE` (admin) y pierde `INSERT`/`DELETE`; `admin_users`, `rate_events`, `shipping_quotes`, `newsletter_outbox` y `newsletter_campaigns` quedan sin escritura para `authenticated`. Las políticas que ya existen no cambian, así que los pedidos manuales del admin podrán agregar su política o RPC sin que esto estorbe.
3. `alter default privileges for role postgres in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon;` lo mismo con `truncate, references, trigger` para `authenticated`; `revoke usage, update on sequences from anon`; `revoke execute on functions from public, anon`. (Cada RPC pública del repo ya hace su `grant` explícito.)
4. `drop policy if exists "newsletter_public_insert" …; drop policy if exists "coupons_public_read_active" …; drop policy if exists "orders_public_insert" …;` `drop trigger if exists newsletter_welcome_email on public.newsletter_subscribers; drop function if exists public.newsletter_resubscribe(text);` y repetir el relleno de `confirmed_at` de la Tarea 6 (altas directas durante la transición).
5. Productos: `drop policy if exists "products_public_read"`; crear `products_public_read` `for select to anon, authenticated using (badge is distinct from 'Borrador')` y `products_admin_read` `for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))`.
6. `categories` y `site_content`: borrar las políticas vivas por los nombres del Paso 1 y crear `categories_public_read` / `site_content_public_read` (`for select to anon, authenticated using (true)`) y `categories_admin_all` / `site_content_admin_all` (`for all to authenticated using (<admin>) with check (<admin>)`, con `<admin>` = el mismo `exists` de arriba).
7. Storage: `drop policy if exists "products_bucket_public_read" on storage.objects;` y crear `products_bucket_admin_read` (`for select to authenticated using (bucket_id = 'products' and <admin>)`). Límites de buckets: `update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/webp','image/jpeg','image/png','image/avif'] where id in ('products', 'site-content');` — si en el Paso 1 aparecen otros tipos o archivos de más de 5 MB, el controlador da los valores y se usan esos.
8. `revoke execute on function public.html_esc(text), public.money_mx(numeric), public.newsletter_email_json(text, uuid, text, text), public.order_staff_email(public.orders, text), public.phone_key(text) from public, anon, authenticated;`
9. Un `do $$` que, para cada función `prosecdef` de `public` cuyo `proconfig` no tenga `pg_temp`, ejecuta `alter function <firma> set search_path = <su search_path actual>, pg_temp` (o `public, pg_temp` si no tenía).

- [ ] **Step 4: Higiene de los archivos viejos** (para que re-correrlos no deshaga el cierre):
- `supabase/rls-hardening.sql`: dejar solo los `drop policy if exists` de `orders_public_insert`, `coupons_public_read_active` y `newsletter_public_insert` (sin sus `create`); la lectura pública de productos y del bucket como en el punto 5 y 7 de arriba; encabezado: `-- Historico. El estado vigente lo fija security-hardening.sql: correlo despues de este archivo.`
- `supabase/newsletter-correos.sql`: sin `newsletter_resubscribe` ni el trigger; misma nota en el encabezado.
- `add_updated_at.sql`, `order-confirmation.sql`: `pg_temp` en el `search_path` del propio `create`.
- `grep -rn "with check (true)" supabase/` → solo puede quedar dentro de comentarios.

- [ ] **Step 5: El controlador aplica `supabase/security-hardening.sql` (Fase C)** y corre el check → `CHECK_OK`; luego `get_advisors` (`security`) sin avisos nuevos.

- [ ] **Step 6: Humo en producción** inmediatamente después: catálogo y fichas cargan con fotos (también una foto de Contenido); cupón `WELCOME10` se aplica; suscribirse con un alias (`tucorreo+fasec@gmail.com`) → llega la confirmación; un pedido de prueba entra y se cancela; en el admin, los borradores aparecen en Productos y se puede subir una foto. Si algo falla: la reversa es volver a otorgar el permiso puntual que falte (`grant <cmd> on <tabla> to <rol>`), no deshacer todo el archivo.

- [ ] **Step 7: Commit**

```bash
git add supabase/security-hardening.sql supabase/checks/security-hardening.sql supabase/rls-hardening.sql supabase/newsletter-correos.sql supabase/add_updated_at.sql supabase/order-confirmation.sql
git commit -m "fix(seguridad): cierre de permisos anonimos, politicas abiertas y Storage"
```

---

### Task 14: Exigir MFA (`aal2`) en todo lo de admin (Fase D)

Cubre B-9 (lado servidor). **Solo después de que el dueño entró al admin con su código TOTP.**

**Files:**
- Create: `supabase/admin-mfa.sql`, `supabase/checks/admin-mfa.sql`
- Modify: `supabase/rls-hardening.sql` (política `admin_users_self_read` igual que abajo), `supabase/newsletter-correos.sql`, `supabase/order-staff-notify.sql`, `supabase/order-confirmation.sql` (los `if not exists (… admin_users …)` → `if not public.is_admin()`)

**Interfaces:**
- Consumes: `is_admin()` (Tarea 2).

- [ ] **Step 1: El controlador confirma** `select count(*) from auth.mfa_factors f join public.admin_users a on a.user_id = f.user_id where f.status = 'verified';` = número de admins (hoy 1), y lista las funciones a cambiar: `select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef and pg_get_functiondef(p.oid) ilike '%admin_users%' and p.proname <> 'is_admin';`

- [ ] **Step 2: Escribir el check:** con `request.jwt.claims` del admin y `aal1`, `set local role authenticated`: `select count(*) from orders` = 0, `select count(*) from admin_users` = 0, `send_newsletter('x','x','a@b.co')` lanza `Solo los administradores…`; con `aal2`: `select count(*) from admin_users` = 1. `CHECK_OK`.

- [ ] **Step 3: Escribir `supabase/admin-mfa.sql`:** recrear `admin_users_self_read` con `using (auth.uid() = user_id and coalesce(auth.jwt()->>'aal', '') = 'aal2')` — todas las políticas de admin hacen un `exists` sobre `admin_users` que pasa por esta política, así que todas quedan exigiendo `aal2` sin tocarlas una por una. Las funciones DEFINER del Paso 1 se saltan RLS: recrearlas (en sus archivos de origen) usando `if not public.is_admin() then raise exception …`. Incluir al final, comentada, la reversa: `-- Reversa: create policy … using (auth.uid() = user_id);` y cómo quitar un factor perdido (Supabase → Authentication → Users → el usuario → MFA factors → borrar).

- [ ] **Step 4: El controlador aplica** `supabase/admin-mfa.sql` y los archivos de origen tocados, corre el check → `CHECK_OK`, y el dueño entra al admin con su código y ve pedidos.

- [ ] **Step 5: Commit**

```bash
git add supabase/admin-mfa.sql supabase/checks/admin-mfa.sql supabase/rls-hardening.sql supabase/newsletter-correos.sql supabase/order-staff-notify.sql supabase/order-confirmation.sql
git commit -m "fix(seguridad): el admin exige segundo factor en la base"
```

---

## Checklist del dueño (paneles, no código)

- [ ] Entrar al admin después del deploy de la Fase B y dar de alta el segundo factor (Tarea 11). Guardar el secreto en un lugar seguro.
- [ ] Contraseña del admin larga (16+ caracteres) y única.
- [ ] Supabase → Authentication → Policies/Passwords: activar la protección de contraseñas filtradas (si el plan lo permite) y longitud mínima 12.
- [ ] Supabase → Authentication → Rate Limits: revisar que el límite de inicios de sesión siga en los valores por defecto (es la protección real contra fuerza bruta; el bloqueo del navegador es solo ayuda).
- [ ] Resend → API Keys: la clave guardada en Vault tiene solo "Sending access" (V-9).
- [ ] Supabase → Edge Functions → Secrets: `ENVIA_BASE_URL` apunta a producción, no a sandbox (V-9).
- [ ] Supabase → API → Exposed schemas: solo `public` (y `graphql_public` si se usa) (V-9).
- [ ] El equipo cobra siempre el total del panel o del correo de aviso, nunca el que dice el mensaje de WhatsApp del cliente (I-3).
- [ ] Cupones privados con códigos difíciles de adivinar, y con vencimiento o tope de usos (I-4). La regla de "primera compra" se puede evadir con otro número y otro correo: es un límite de identificar por teléfono.

## Decisiones tomadas (y lo que queda fuera)

- **Sin CAPTCHA ni Edge Function de pedidos** (A-1 punto 1): los límites por IP + por teléfono + tope global + tope de correos cierran la inundación sin agregar Turnstile al checkout. Si aun así llegan pedidos falsos, el siguiente paso es Turnstile.
- **Doble confirmación del boletín** en lugar de solo límites: es lo único que evita mandar correos a terceros y suscribir a alguien sin su permiso.
- **Se borra `deduct_stock_on_order`** (función y trigger): los pedidos web no tocan inventario. Los pedidos manuales del admin decidirán su propia regla.
- **`place_order` no exige cotización** en envío a domicilio, para no romper el modo sin cotización cuando Envia falla.
- **`coupon_first_purchase_ok` se elimina**: el aviso temprano de "primera compra" desaparece; el aviso llega al enviar el pedido, como ya maneja el checkout.
- **`style-src 'unsafe-inline'` se queda**; **HSTS sin `preload`**.
- **Sesión del admin en `localStorage`** se queda (lo normal en supabase-js); la mitigan la CSP, el escapado y el MFA. **Admin en subdominio propio:** fuera de este plan (es un proyecto aparte de Vercel y de dominio).
- **Envío de HTML del admin a clientes/boletín** es una función del negocio; queda protegido por el MFA.

## Cobertura de hallazgos

| Hallazgo | Tarea(s) |
|---|---|
| A-1 | 1, 2, 4, 5 |
| M-1 | 6, 13 |
| M-2 | 3, 13 |
| M-3 | 8, 13 |
| M-4 | 2, 7 |
| B-1 | 8 |
| B-2 | 4 |
| B-3 | 3, 4, 6, 13 |
| B-4 | 8 |
| B-5 | 10 |
| B-6 | 9 |
| B-7 | 12 |
| B-8 | 4, 11, 13 |
| B-9 | 11, 14, checklist |
| B-10 | 2, 7 |
| I-1 | 4, 5, 6, 13 |
| I-2 | 13 |
| I-3 | Ya integrado en `main`; checklist (WhatsApp) |
| I-4 | 3, checklist |
| V-1 | 1 |
| V-2 | 13 |
| V-3 | 2 (PostgREST), 7 (Edge Function) |
| V-4 | 4 (Q-7), 13 |
| V-5 | 13 (verificado: hoy no existe; el repo deja de crearla) |
| V-6 | 13 |
| V-7 | 13 |
| V-8 | 6 |
| V-9 | checklist |

## Revisión final

- [ ] Revisión de toda la rama con un modelo distinto al que escribió (Fable), contra este plan y la auditoría, antes de fusionar la Fase B y otra vez antes de aplicar la Fase C.
- [ ] Al terminar, borrar la cuenta de admin de prueba de la Tarea 11 (`auth.users` y `admin_users`).
