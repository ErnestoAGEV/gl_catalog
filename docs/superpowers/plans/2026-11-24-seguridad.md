# Correcciones de la auditoría de seguridad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar todos los hallazgos de la auditoría del 2026-11-24 (A-1, M-1…M-4, B-1…B-10, I-1…I-4, V-1…V-9) sin tirar la tienda en vivo en ningún momento.

**Architecture:** Defensa en capas en Postgres. Un límite atómico genérico (`rate_check`), con topes editables en una tabla (`security_limits`), lo usan `place_order`, el boletín, los cupones y las Edge Functions. Las RPCs `SECURITY DEFINER` son la única puerta de escritura anónima. Los pedidos pasan por Cloudflare Turnstile y una Edge Function `place-order` (detrás de una aprobación del dueño). Un archivo de cierre (`security-hardening.sql`) quita lo que queda abierto. En el navegador: escapar todo lo que se pinta con `innerHTML`, CSP sin scripts en línea, CSV seguro, fotos solo propias y MFA para el admin. El despliegue va por fases (0 → A → B → C → D) para que cada cierre ocurra cuando ya nadie usa la puerta vieja.

**Tech Stack:** Vite 6 + JS vanilla, Supabase (Postgres/plpgsql, RLS, pg_net, pg_cron, Vault, Edge Functions en Deno), Vercel, Resend, Cloudflare Turnstile, pruebas `node:assert` vía `npm test`.

**Spec:** `docs/security/2026-11-24-auditoria-seguridad.md` (léelo entero; los números de línea son del commit `fe9c808` y siguen valiendo en `main` = `343e385` salvo donde se indica).

**Rama:** `fix/seguridad`, creada desde `main` (`343e385`). Nunca hacer stage de `.claude/settings.local.json`.

**Fuera de este plan (no bloquear):** pedidos manuales desde el admin y la Parte 2 de guías de envío. Por eso: `place_order` no aplica límites, lista de métodos ni existencias cuando llama un admin (`public.is_admin()`); `authenticated` conserva sus permisos de tabla donde existe una política de admin.
**Nota para la rama `feature/guias`:** la función que genere guías debe comprobar que quien llama es admin con `rpc('is_admin')` usando el JWT del que llama (hoy `is_admin()` es solo pertenencia a `admin_users`; la Tarea 16 le agrega `aal2` en la Fase D, así que la guía lo exigirá sin cambios), no leyendo `admin_users` con el service role.

## Hechos de la base en vivo (2026-11-24, solo lectura)

- `anon` y `authenticated` tienen `INSERT/UPDATE/DELETE/TRUNCATE` en todas las tablas de `public` (default de Supabase); RLS es la única guarda. `shipping_*` ya sin escritura de `anon`.
- `orders_public_insert` NO existe. `coupons_public_read_active` y `newsletter_public_insert` sí.
- `newsletter_subscribers`: columnas `id, email, subscribed_at, source, unsub_token, unsubscribed_at` (**no hay `created_at`**).
- 9 pedidos en total; pico 6/hora. 3 correos en `order_notify_emails`. 1 admin.
- 151 de 259 productos publicados usan fotos de 22 hosts ajenos (cdn.shopify.com, liverpool, amazon, pinimg, lee.com, fimgs.net…). El admin tiene "Pegar enlaces de imágenes" (`src/pages/admin/adminProductForm.js:76`). Existe `scripts/rehost-images.mjs --aplicar`.
- Triggers: `orders → tr_deduct_stock_on_order`, `orders → tr_notify_staff_on_order`, `products → products_rebuild_*` (por sentencia, disparan con 0 filas), `newsletter_subscribers → send_welcome_email`.

## Global Constraints

- **Quién toca la base:** solo el controlador, con el MCP de Supabase (`apply_migration` / `execute_sql`) y `deploy_edge_function`. El implementador escribe archivos y nunca los corre contra producción. Cada tarea con SQL trae un paso "El controlador aplica" y un archivo en `supabase/checks/`.
- **SQL idempotente**, como los demás archivos de `supabase/`.
- **Comprobaciones (`supabase/checks/*.sql`):** un único `do $$ … $$;` con `assert <cond>, '<mensaje>'` que termina SIEMPRE con `raise exception 'CHECK_OK';` (deshace todo: filas de prueba, `rate_events`, ediciones de `security_limits` y la cola de `pg_net`, que solo manda lo confirmado). Esperado: error con texto `CHECK_OK`. Nunca aplicarlos como migración. Petición simulada: `set_config('request.headers', '{"cf-connecting-ip":"203.0.113.7"}', true)`; usuario simulado: `set_config('request.jwt.claims', '{"sub":"<uuid>","aal":"aal2","role":"authenticated"}', true)`. Para no depender del tráfico real, los checks bajan el tope que prueban editando su fila de `security_limits` dentro del bloque.
- **Funciones nuevas:** `SECURITY DEFINER` con `set search_path = public, pg_temp` (o `public, extensions, vault, pg_temp` si usan Vault/pg_net). Desde la Fase 0 las funciones nuevas **no** se pueden ejecutar por nadie salvo `grant` explícito (Tarea 1): toda RPC nueva lleva su `grant execute … to anon, authenticated` / `authenticated` / `service_role` según corresponda.
- **IP desconocida:** si `request_ip()` (o la IP que pasa una Edge Function) da `'unknown'`, `rate_check` **omite** ese tope por IP: devuelve `true` con `raise warning` y anota un evento `ip_unknown`; `security_watch` avisa al equipo si `ip_unknown` llega a su tope (5/h). Los topes por teléfono, por correo, los globales y Turnstile siguen aplicando. Los consumidores (Tareas 3, 4, 6, 7 y 12) no hacen nada especial: llaman `rate_check(..., request_ip())` igual.
- **Proyecto Supabase:** `https://bcnfbrhcubpysqpyhbvf.supabase.co` (`VITE_SUPABASE_URL` en `.env`).
- **Topes:** viven en la tabla `security_limits` (Tarea 2), editables desde el Table Editor de Supabase antes de una venta, sin migración. Valores iniciales:

  | name | max_hits | win | Para qué |
  |---|---|---|---|
  | `order_ip` | 5 | 10 min | pedidos por IP |
  | `order_ip_day` | 10 | 24 h | pedidos por IP al día |
  | `order_phone` | 5 | 10 min | pedidos por `phone_key` |
  | `order_global` | 20 | 1 h | pedidos en toda la tienda (pico real 6/h) |
  | `staff_mail` | 10 | 24 h | avisos de pedido al equipo |
  | `staff_alert` | 1 | 1 h | alerta al equipo |
  | `staff_alert_day` | 3 | 24 h | alertas al día |
  | `nl_ip` | 3 | 1 h | suscripciones por IP |
  | `nl_email` | 3 | 30 días | confirmaciones a un mismo correo |
  | `nl_global` | 15 | 24 h | confirmaciones en toda la tienda |
  | `coupon_ip` | 30 | 10 min | consultas de cupón por IP |
  | `quote_ip` | 10 | 1 min | cotizaciones por IP |
  | `quote_global` | 60 | 1 min | cotizaciones en toda la tienda |
  | `ip_unknown` | 5 | 1 h | peticiones sin IP antes de avisar al equipo |

- **Presupuesto de Resend (plan gratis: 100/día):** los correos automáticos no pasan de ~70/día. Peor caso suponiendo que Resend cuenta cada destinatario (3 del equipo): avisos 10×3 = 30, alertas 3×3 = 9, confirmaciones del boletín 15, confirmaciones de pedido a clientes (las manda el admin, una por pedido real) ≤ 10 → 64. **El correo de bienvenida tras confirmar se elimina** (Tarea 6). Los días de campaña no entran en este presupuesto (la cola ya reintenta tras un 429). El controlador confirma en la doc o el panel de Resend si cuenta por correo o por destinatario y lo anota en el commit de la Tarea 5.
- **Residuo aceptado:** un intento rechazado (validación o tope) deshace su transacción, así que no consume cupo; solo cuentan los pedidos/altas que se guardan. Lo que frena a quien prueba en bucle es Turnstile (Tarea 12) y que cada intento no cuesta correos.
- **Copy:** tono de la tienda (serio, cercano, tuteo, sin "¡"). Errores de la base en claro, `errcode = '22023'`.
- **Los pedidos web NO descuentan inventario** (decisión del dueño).
- **Valores válidos de pedido** (los de `src/pages/checkout/checkoutView.js:95-104`): pago `Transferencia` | `Pago al recoger`; entrega `Recoger en tienda` | `Envío a domicilio`.
- Código con la escalera de ponytail, sin dependencias nuevas.
- Cada tarea termina con `npm test` en verde; las que tocan `src/`, `public/`, `index.html` o `vercel.json`, también con `npm run build`.
- Commits en español (`fix(seguridad): …`), terminando con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **La CSP rompe algo en producción** (realtime del admin, impresión, vista previa de correos, Turnstile, el canonical) → todo sigue funcionando; se comprueba en el preview de Vercel (Tarea 10, Paso 6). Las fotos ajenas siguen cargando porque `img-src` queda en `https:` hasta que se re-alojen (Tarea 11).
- **Clientes con el bundle viejo durante la transición** → la Fase A deja el sitio viejo funcionando (las altas directas al boletín pasan por la confirmación vía trigger) y nada se cierra hasta la Fase C, con los logs revisados. Una pestaña abierta varios días después de la Fase C verá "cupón no válido" o un error del boletín: residuo aceptado.
- **El admin se queda fuera al exigir `aal2`** (sesión vieja, teléfono perdido, alta a medias) → el login pide el código o rehace el alta; dos dispositivos dados de alta antes de la Fase D; SQL de recuperación en `admin-mfa.sql` (Tareas 13 y 16).
- **Clientes reales detrás de la misma IP** (CGNAT, wifi de la tienda) o la tienda en un pico de ventas → mensaje claro con botón "Pide por WhatsApp" que abre el pedido armado; topes editables sin migración (Tareas 2 y 4).
- **Alguien ya suscrito, o dado de baja, vuelve a escribir su correo** → la home responde siempre "Revisa tu correo"; máximo una confirmación cada 24 h y 3 por mes; la baja solo se deshace pulsando el botón de confirmar (Tarea 6).

---

## Rollout (orden de aplicación)

| Fase | Qué | Cuándo |
|---|---|---|
| 0 | Tarea 1: quitar el trigger de stock; triggers de despliegue que no disparan con 0 filas; quitar a `anon` la escritura de todas las tablas salvo `INSERT` en `newsletter_subscribers`; default privileges; consultas Q-11, Q-12, Q-13 | En cuanto se termine la Tarea 1. |
| A | SQL que solo agrega y es compatible con el sitio actual: Tareas 2, 3 (SQL), 4, 5, 6 (SQL); despliegue de la Edge Function de la Tarea 7 y, si el dueño ya dio las llaves, la de la Tarea 12 | Al terminar cada tarea, en ese orden. |
| B | Un solo deploy del frontend: fusionar `fix/seguridad` a `main` con las Tareas 3, 6, 8, 9, 10, 11 (código), 12 (si hay llaves), 13, 14 | Fase A aplicada y verificada; preview de Vercel pasa la Tarea 10 Paso 6. |
| B' | Tarea 11 Pasos 6-8: re-alojar fotos ajenas (aprobación del dueño) y luego cerrar `img-src` | Cuando el dueño apruebe; independiente de C. |
| C | Tarea 15: cierre (políticas abiertas, `INSERT` del boletín, borradores, Storage, funciones, permisos de `authenticated`); y, si se hizo la Tarea 12, quitar `EXECUTE` de `place_order` a `anon` | ≥ 24 h después del deploy de B, con la Tarea 15 Paso 1 en verde. **Desde aquí, revertir el frontend en Vercel a un deploy anterior a B rompe cupones y boletín:** antes de C es seguro, después no. |
| D | Tarea 16: exigir MFA (`aal2`) en todo lo de admin | Cuando el dueño tenga dos dispositivos dados de alta y haya entrado con código. |
| — | Checklist del dueño y del controlador (al final) | En paralelo; MFA antes de D. |

Las tareas de fases posteriores se pueden commitear antes (sus archivos son inertes), pero **no se aplican** antes de su fase.

## File Structure

- Create `supabase/security-base.sql` — `security_limits`, `rate_events`, `rate_hit`, `rate_check`, `rate_check_ip`, `ip_key`, `request_ip`, `is_admin`, `send_staff_alert`, `security_prune`, `security_watch` + cron. (Tarea 2)
- Create `supabase/anon-writes.sql` (Fase 0), `supabase/coupons.sql`, `supabase/security-hardening.sql` (Fase C, se corre siempre al final), `supabase/admin-mfa.sql` (Fase D), `supabase/checks/*.sql`.
- Create Edge Function `supabase/functions/place-order/index.js` (Tarea 12).
- Modify `supabase/deploy-hook.sql`, `place-order.sql`, `order-staff-notify.sql`, `newsletter-correos.sql`, `rls-hardening.sql`, `drop-legacy-policies.sql`, `add_updated_at.sql`, `order-confirmation.sql`, `supabase/functions/shipping-quote/index.js`.
- Create `src/utils/{csv,coupons,mfa,images}.js`, `src/pages/unsubscribe/confirm.js`.
- Modify `src/store/{coupons,newsletter,auth,orders,products}.js`, `src/core/{startApp,views,routeSeo}.js`, `src/main.js`, `src/utils/toast.js`, páginas listadas en cada tarea, `index.html`, `vercel.json`, `scripts/prerender.mjs`, `scripts/test.mjs`, `scripts/test-admin-escaping.mjs`, `package-lock.json`.
- Create pruebas `scripts/test-{csv,coupons,mfa,csp,images,store-escaping}.mjs`.

---

### Task 1: Inventario fuera, despliegues solo con filas y escritura anónima cerrada (Fase 0)

Cubre V-1, la parte de stock de A-1, el despliegue por PATCH vacío y casi todo V-7 (defensa en capas desde ya).

**Files:**
- Modify: `supabase/deploy-hook.sql` (pasos 2–4)
- Modify: `supabase/place-order.sql` (al inicio, después de `begin;`; comentario de las líneas 192-194)
- Modify: `supabase/drop-legacy-policies.sql:37,41` (quitar las dos líneas de `deduct_stock_on_order`; fallarían al re-correr)
- Create: `supabase/anon-writes.sql`, `supabase/checks/fase0.sql`

**Interfaces:**
- Produces: `public.request_rebuild() returns void` (DEFINER; el `net.http_post` al hook de Vault). `public.trigger_rebuild()` conserva su firma (la usa `shipping_settings_rebuild`) y solo llama a `request_rebuild()`. `public.products_rebuild() returns trigger`.

- [ ] **Step 1: El controlador corre Q-11, Q-12 y Q-13 de la auditoría** (admins, pedidos viejos con HTML, señales de abuso) y anota el resultado en el commit. Si Q-12 devuelve filas, avisar al dueño antes de seguir.

- [ ] **Step 2: Escribir `supabase/checks/fase0.sql`**
- `not exists (select 1 from pg_trigger where tgname = 'tr_deduct_stock_on_order')` y `to_regproc('public.deduct_stock_on_order') is null`.
- `v0 := (select count(*) from net.http_request_queue)`; `update public.products set name = name where false;` → sigue en `v0`; `update … where id = (select id from public.products limit 1);` → `v0 + 1`; `delete from public.products where false;` → sin cambio.
- Ninguna tabla de `public` da `INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER` a `anon`, salvo `INSERT` en `newsletter_subscribers`; ninguna da `TRUNCATE/REFERENCES/TRIGGER` a `authenticated`.
- Default privileges: `create table public._zz_acl_probe(id int); create function public._zz_acl_fn() returns int language sql as 'select 1';` → `not has_table_privilege('anon', 'public._zz_acl_probe', 'insert')` y `not has_function_privilege('anon', 'public._zz_acl_fn()', 'execute')` y `not has_function_privilege('public._zz_acl_fn()', …)` para `authenticated` también.
- `CHECK_OK`.

- [ ] **Step 3: `supabase/deploy-hook.sql`**
- Paso 2 (Vault): crear el secreto solo si no existe; actualizarlo solo si el valor nuevo empieza con `https://api.vercel.com/` (como `newsletter-correos.sql` paso 3). Hoy re-correr el archivo pisa la URL real con `PEGA_AQUI_LA_URL`.
- `request_rebuild()`: cuerpo actual de `trigger_rebuild()` sin `RETURN NULL`; `search_path = public, extensions, vault, pg_temp`; revoke a todos.
- `trigger_rebuild()`: `perform public.request_rebuild(); return null;`.
- `products_rebuild()` — las tablas de transición solo existen en su operación y plpgsql prepara cada sentencia por separado:

```sql
if tg_op = 'DELETE' then
  if exists (select 1 from old_rows) then perform public.request_rebuild(); end if;
else
  if exists (select 1 from new_rows) then perform public.request_rebuild(); end if;
end if;
return null;
```

- Triggers: `products_rebuild_insert` / `products_rebuild_update` `… referencing new table as new_rows for each statement execute function public.products_rebuild()`; `products_rebuild_delete` `… referencing old table as old_rows …`.
- `shipping_settings_rebuild` no cambia: es `FOR EACH ROW` con `WHEN (old.free_shipping_min is distinct from new.free_shipping_min)`, y un trigger por fila nunca dispara con 0 filas. Dejarlo dicho en un comentario.
- Actualizar el comentario `ponytail:` del final.

- [ ] **Step 4: `supabase/place-order.sql`** — justo después de `begin;`: `drop trigger if exists tr_deduct_stock_on_order on public.orders; drop function if exists public.deduct_stock_on_order();` con el comentario "Los pedidos web no descuentan inventario: la tienda funciona como catalogo". Comentario de `v_lines`: `productId` nulo en stock infinito se conserva por compatibilidad (pedidos viejos y la foto en `order_staff_email`).

- [ ] **Step 5: `supabase/anon-writes.sql`**
```sql
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
grant insert on public.newsletter_subscribers to anon;  -- el sitio actual; se quita en la Fase C
revoke truncate, references, trigger on all tables in schema public from authenticated;
alter default privileges for role postgres in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon;
alter default privileges for role postgres in schema public revoke truncate, references, trigger on tables from authenticated;
alter default privileges for role postgres revoke execute on functions from public;  -- global: el EXECUTE a PUBLIC no se quita por esquema
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
```
Comentario arriba: "Desde aquí toda función nueva necesita su `grant execute` explícito."

- [ ] **Step 6: El controlador aplica (Fase 0)**
1. Confirma `select current_user;` = `postgres` (los default privileges son del rol que crea los objetos).
2. Revisa el diff del bloque de Vault de `deploy-hook.sql` contra `main` y confirma que no puede escribir nada mientras diga `PEGA_AQUI_LA_URL`.
3. `execute_sql` con las dos sentencias del Paso 4; `apply_migration` de `deploy-hook.sql` y `anon-writes.sql`; `supabase/checks/fase0.sql` → `CHECK_OK`; `select decrypted_secret like 'https://api.vercel.com/%' from vault.decrypted_secrets where name = 'vercel_deploy_hook';` → `true`.
4. Humo: la home, una ficha, aplicar `WELCOME10` y suscribirse con un alias siguen funcionando.

- [ ] **Step 7: `npm test` → ok. Commit**

```bash
git add supabase/deploy-hook.sql supabase/place-order.sql supabase/drop-legacy-policies.sql supabase/anon-writes.sql supabase/checks/fase0.sql
git commit -m "fix(seguridad): sin descuento de inventario, despliegue solo con filas y sin escritura anonima"
```

---

### Task 2: Topes editables, IP de la petición, `is_admin()` y alertas (Fase A)

Base para A-1, M-1, M-2, M-4, B-10 y B-9.

**Files:**
- Create: `supabase/security-base.sql`, `supabase/checks/security-base.sql`

**Interfaces:**
- Produces:
  - Tabla `public.security_limits (name text primary key, max_hits int not null check (max_hits > 0), win interval not null)`, sembrada con la tabla de Global Constraints (`on conflict (name) do nothing`, para no pisar lo que el dueño ajuste). RLS: `security_limits_admin_all` `for all to authenticated using/with check (exists … admin_users …)`.
  - Tabla `public.rate_events (bucket text not null, key text not null, at timestamptz not null default now())`, índice `(bucket, key, at)`, RLS sin políticas, revoke a `anon, authenticated`.
  - `public.rate_hit(p_bucket text, p_key text, p_limit int, p_window interval) returns boolean` — DEFINER, volátil. `pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || v_key, 0))`; cuenta `rate_events` con ese `bucket`/`key` y `at > now() - p_window`; si `>= p_limit` → `false` sin insertar; si no, inserta y `true`. `v_key` = `'*'` si `p_key = '*'`; si no, `encode(extensions.digest(coalesce(p_key, '') || <sal>, 'sha256'), 'hex')` con el secreto de Vault `rate_salt` (se crea si falta con `encode(extensions.gen_random_bytes(32), 'hex')`). Sin `grant`.
  - `public.rate_check(p_name text, p_key text) returns boolean` — DEFINER: lee la fila de `security_limits`; si no existe, `raise exception 'Limite % no configurado', p_name`; con `p_key = 'unknown'` → `raise warning`, inserta `('ip_unknown', '*')` en `rate_events` y devuelve `true` (ver **IP desconocida**); si no, devuelve `rate_hit(p_name, p_key, max_hits, win)`. `grant execute` solo a `service_role` (topes globales de las Edge Functions, con `p_key = '*'`).
  - `public.ip_key(p_ip text) returns text` — `immutable`: IPv4 tal cual; IPv6 → su red `/64` (`host(network(set_masklen(p_ip::inet, 64)))`); vacío o inválido → `'unknown'`. Sin `grant`.
  - `public.request_ip() returns text` — `stable`. Si el rol del JWT (`current_setting('request.jwt.claims', true)::json->>'role'`) es `service_role` y viene la cabecera `x-gl-client-ip` → `ip_key` de esa cabecera (la manda la Edge Function `place-order`, Tarea 12). Si no → `ip_key` de la cabecera verificada en el Paso 1. Sin `grant`.
  - `public.rate_check_ip(p_name text, p_ip text) returns boolean` = `rate_check(p_name, ip_key(p_ip))`. `grant execute` solo a `service_role` (Edge Functions).
  - `public.is_admin() returns boolean` — DEFINER, `stable`: `exists (select 1 from public.admin_users where user_id = auth.uid())` (solo pertenencia; la Tarea 16 le agrega `and coalesce(auth.jwt()->>'aal', '') = 'aal2'`). `grant execute` a `authenticated`.
  - `public.send_staff_alert(p_reason text) returns bigint` — DEFINER (`public, extensions, vault, pg_temp`), nunca lanza. Solo manda si `rate_check('staff_alert', '*') and rate_check('staff_alert_day', '*')`. A toda `order_notify_emails`, desde `G&L Pedidos <hola@glboutique.com.mx>`. `p_reason = 'orders'`: asunto `Alerta G&L: demasiados pedidos en la última hora`, HTML `<p>La tienda llegó al tope de pedidos por hora y está pidiendo a los clientes que escriban por WhatsApp.</p><p>Si es una venta real, sube el tope <code>order_global</code> en la tabla <code>security_limits</code> de Supabase. Si no reconoces los pedidos, puede ser un ataque: revisa <a href="https://glboutique.com.mx/admin/orders">el admin</a> y avisa a quien mantiene la tienda.</p>`. `'staff_mail'`: asunto `Alerta G&L: se pausaron los avisos de pedidos`, HTML `<p>Se llegó al tope diario de avisos de pedido. Para no agotar la cuota de correos, los siguientes pedidos de hoy no mandarán aviso.</p><p>Revisa los pedidos en <a href="https://glboutique.com.mx/admin/orders">el admin</a>.</p>`. `'newsletter'`: asunto `Alerta G&L: muchas suscripciones al boletín`, HTML `<p>Se llegó al tope diario de correos de confirmación del boletín. Si no es una campaña tuya, puede ser abuso.</p>`.
  - `public.security_watch() returns void` — DEFINER. Las alertas no pueden salir dentro de la transacción que se rechaza (el `raise` las deshace), por eso las manda un cron: si los `rate_events` de `order_global` en su ventana ya llegan a su `max_hits` → `send_staff_alert('orders')`; igual con `nl_global` → `send_staff_alert('newsletter')`. Programada cada 5 min: `cron.schedule('security-watch', '*/5 * * * *', 'select public.security_watch()')`.
  - `public.security_prune() returns void` — DEFINER: borra `rate_events` con `at < now() - interval '31 days'` (lo más largo es `nl_email`); borra `shipping_quotes` con `created_at < now() - interval '24 hours'` que no estén en `orders.shipping_quote_id`; `update shipping_quotes set ip_hash = null where ip_hash is not null`; borra de `newsletter_subscribers` las filas sin confirmar nunca (`confirmed_at is null`) con `confirm_sent_at < now() - interval '7 days'` (la columna la agrega la Tarea 6; envolver en `if exists (… columna …)`). Programada: `cron.schedule('security-prune', '17 * * * *', 'select public.security_prune()')`.

- [ ] **Step 1: El controlador verifica la cabecera de IP en PostgREST (V-3)**
1. `execute_sql`: función temporal `public._debug_request_ip() returns jsonb language sql stable as $$ select jsonb_build_object('cf', h->>'cf-connecting-ip', 'xff', h->>'x-forwarded-for', 'xri', h->>'x-real-ip') from (select current_setting('request.headers', true)::json h) t $$;` con `grant execute … to anon`.
2. IP real: `curl -4 -s https://api.ipify.org` y `curl -s https://api64.ipify.org`. Llamada: `curl -4 -s -X POST "$URL/rest/v1/rpc/_debug_request_ip" -H "apikey: $ANON" -H "Content-Type: application/json" -H "CF-Connecting-IP: 6.6.6.6" -H "X-Forwarded-For: 7.7.7.7" -H "X-Real-IP: 8.8.8.8" -d '{}'` (`$ANON` = `VITE_SUPABASE_ANON_KEY`); repetir con `-6` si hay IPv6.
3. Regla: si `cf` es la IP real → usar `cf-connecting-ip`. Si no, y el último elemento de `xff` es la IP real → ese. Si ninguna, parar y avisar: no hay cabecera confiable.
4. `drop function public._debug_request_ip();`. Anotar el resultado en el commit.

- [ ] **Step 2: Escribir `supabase/checks/security-base.sql`**
- Con `update security_limits set max_hits = 2 where name = 'order_ip'` dentro del bloque: `rate_check('order_ip', '203.0.113.7')` → `true`, `true`, `false`; otra IP → `true`.
- `rate_check('no_existe', 'x')` lanza `Limite no_existe no configurado`.
- Las claves guardadas no son la IP y miden 64.
- `ip_key('2001:db8:abcd:12:1::5') = '2001:db8:abcd:12::'`; `ip_key('2001:db8:abcd:12:ffff::9') = '2001:db8:abcd:12::'`; `ip_key('203.0.113.7') = '203.0.113.7'`; `ip_key('basura') = 'unknown'`; `ip_key(null) = 'unknown'`.
- `request_ip()`: con la cabecera elegida = `'203.0.113.7'`; sin cabeceras = `'unknown'`; con rol `anon` y `x-gl-client-ip: 1.1.1.1` → ignora `x-gl-client-ip`; con rol `service_role` y `x-gl-client-ip: 1.1.1.1` → `'1.1.1.1'`.
- `is_admin()`: sin claims → `false`; admin con `aal1` → `true` (el `aal1` → `false` lo prueba `checks/admin-mfa.sql`, Tarea 16); con `aal2` → `true`.
- `anon` no ejecuta `rate_hit`, `rate_check`, `rate_check_ip`, `ip_key`, `request_ip`, `send_staff_alert`; `service_role` sí ejecuta `rate_check_ip` y `rate_check`.
- `send_staff_alert('orders')` dos veces → la cola de pg_net sube 1 sola vez.
- Existen los jobs `security-prune` y `security-watch`.
- `CHECK_OK`.

- [ ] **Step 3: Escribir `supabase/security-base.sql`** (lo de **Interfaces**; sin `begin`/`commit`, porque `apply_migration` ya usa una transacción; `cron.schedule` al final). Comentario en la tabla: "Editar estos topes en Supabase → Table Editor → security_limits; aplica al instante."

- [ ] **Step 4: El controlador aplica** (antes, `list_extensions` confirma `pgcrypto` y `pg_cron`) y corre el check → `CHECK_OK`.

- [ ] **Step 5: Commit** `feat(seguridad): topes editables por IP y globales, is_admin y alertas`.

---

### Task 3: Cupones por RPC, con vigencia y tope de usos (SQL en A, cliente en B)

Cubre M-2, I-4 y la parte de cupones de B-3.

**Files:**
- Create: `supabase/coupons.sql`, `supabase/checks/coupons.sql`, `src/utils/coupons.js`, `scripts/test-coupons.mjs`; Modify: `scripts/test.mjs`
- Modify: `src/store/coupons.js`, `src/store/index.js:5`, `src/pages/checkout/checkout.js` (líneas ~220 y ~725, y borrar `checkFirstPurchaseCoupon` con sus listeners e import), `src/pages/cart/cart.js:442`, `src/pages/admin/adminCoupons.js`

**Interfaces:**
- Consumes: `rate_check`, `request_ip` (Tarea 2).
- Produces:
  - Columnas `coupons.expires_at timestamptz`, `coupons.max_uses int check (max_uses is null or max_uses > 0)`.
  - `public.coupon_open(c public.coupons) returns boolean` — `stable`, sin `grant`: `c.active and (c.expires_at is null or c.expires_at > now()) and (c.max_uses is null or (select count(*) from public.orders o where o.coupon_code = c.code and coalesce(o.status, '') <> 'cancelado') < c.max_uses)`.
  - `public.validate_coupon(p_code text) returns table (code text, discount numeric, free_shipping boolean, label text, categories jsonb, first_purchase_only boolean)` — plpgsql DEFINER volátil. `if not rate_check('coupon_ip', request_ip()) then raise exception 'Demasiados intentos. Espera unos minutos.' using errcode = '22023', hint = 'rate';`. Normaliza el código como `place_order`; devuelve la fila solo si `coupon_open(c)`; `categories` = `coalesce(to_jsonb(c.categories), '[]'::jsonb)`. `grant execute` a `anon, authenticated`.
  - `src/utils/coupons.js`: `couponExpiryIso(dateStr) -> string|null` (`'2026-12-31'` → `'2026-12-31T23:59:59-06:00'`; `''` → `null`); `couponExpiryDate(iso) -> string` (inversa en hora de Ciudad de México, UTC-6 fijo; `null` → `''`).
  - `applyCoupon(code, silent) -> { success, coupon?, error?, rateLimited? }`: `rateLimited: true` cuando el error trae `hint = 'rate'`.

- [ ] **Step 1: `scripts/test-coupons.mjs`** (y su `import` en `scripts/test.mjs`)

```js
assert.equal(couponExpiryIso('2026-12-31'), '2026-12-31T23:59:59-06:00')
assert.equal(couponExpiryIso(''), null)
assert.equal(couponExpiryDate('2026-12-31T23:59:59-06:00'), '2026-12-31')
assert.equal(couponExpiryDate('2027-01-01T05:59:59Z'), '2026-12-31')
assert.equal(couponExpiryDate(null), '')
```

- [ ] **Step 2: `npm test` → FAIL. Step 3: implementar `src/utils/coupons.js` → PASS.**

- [ ] **Step 4: `supabase/coupons.sql` y su check.** El archivo también repite `add column if not exists first_purchase_only` (idempotente). Check: cupones de prueba en el bloque (`ZZTEST1` activo; `ZZTEST2` vencido ayer; `ZZTEST3` con `max_uses = 1` y un pedido no cancelado insertado a mano) → `validate_coupon('zz-test1')` 1 fila con `code = 'ZZTEST1'`; `ZZTEST2`, `ZZTEST3` e inexistente → 0 filas; con `coupon_ip` bajado a 2, la 3.ª llamada lanza `Demasiados intentos` con `hint = 'rate'` (capturar con `get stacked diagnostics`); `anon` no ejecuta `coupon_open`. `CHECK_OK`.

- [ ] **Step 5: El controlador aplica `coupons.sql` (Fase A) y corre el check.** `coupons_public_read_active` sigue viva hasta la Fase C.

- [ ] **Step 6: Cliente**
- `applyCoupon`: `supabase.rpc('validate_coupon', { p_code })`, `coupon = data?.[0]`. Error con `hint === 'rate'` → `{ success: false, rateLimited: true, error: error.message }`. Sin fila → `'Cupón no válido o expirado'`.
- Los llamadores que hoy quitan el cupón si `!result.success` (`checkout.js` ~220 y ~725, `cart.js:442`) solo lo quitan si además `!result.rateLimited`; con `rateLimited` muestran el mensaje y conservan el cupón.
- Borrar `isFirstPurchaseCouponAvailable` y su uso (B-3): `place_order` avisa al enviar y el checkout ya quita el cupón con `dropFirstPurchaseCoupon`.
- Admin: campos `expires_at` (`type="date"`, vacío = sin vencimiento; `couponExpiryIso` al guardar, `couponExpiryDate` al editar) y `max_uses` (`type="number" min="1" step="1"`, vacío = `null`). La tarjeta muestra "Vence dd/mm/aaaa" y "Máx. N usos". Todo con `esc()`.

- [ ] **Step 7: `npm test`, `npm run build` → ok. Manual en `npm run dev`:** `WELCOME10` se aplica; código inventado → "Cupón no válido o expirado"; cupón vencido creado en el admin no se aplica.

- [ ] **Step 8: Commit** `fix(seguridad): cupones por RPC con vigencia y tope de usos`.

---

### Task 4: `place_order` endurecido (Fase A)

Cubre A-1 (puntos 2 y 4, topes por IP y global), B-2, B-8 (pedidos) y B-3 (`coupon_first_purchase_ok`).

**Files:**
- Modify: `supabase/place-order.sql`
- Create: `supabase/checks/place-order.sql`
- Modify: `src/pages/checkout/checkout.js` (manejo del error de tope), `src/store/orders.js` (devolver `hint`)

**Interfaces:**
- Consumes: `rate_check`, `request_ip`, `is_admin` (Tarea 2); `coupon_open` (Tarea 3).
- Produces: misma firma de 12 argumentos y mismo `returns public.orders`. Errores de tope con `hint = 'whatsapp'`. `saveOrder(...) -> { error: { message, details, hint } | null }`. `coupon_first_purchase_ok` deja de existir.

- [ ] **Step 1: Escribir `supabase/checks/place-order.sql`**

En el bloque: un producto publicado con stock infinito, uno `Borrador` (crearlo si no hay) y uno puesto a `stock = 1`. IP `203.0.113.7`. `p_items` válido = `[{"productId": <id>, "size": <primer valor de sizes o "">, "color": <primer valor de colors o "">, "qty": 1}]`. Cada caso que debe fallar va en un sub-bloque `begin … exception when others then get stacked diagnostics v_msg = message_text, v_hint = pg_exception_hint; end;`.
- Válido (`'Transferencia'`, `'Recoger en tienda'`) → fila con `status = 'pendientedepago'`.
- Borrador → `'Uno de los productos ya no esta disponible.'`
- `qty = 2` con `stock = 1`, y `qty = 1` con `stock = 0` → `'Uno de los productos esta agotado o no tiene suficientes piezas.'`
- Talla que no existe en `sizes` no vacío → `'Revisa la talla o el color de tus productos.'`
- `'PAGADO - transferencia confirmada'` como pago, y `'Envío a domicilio '` (con espacio) como entrega → `'Metodo de pago o de entrega invalido.'`
- Correo `'a<b@x.com'` → `'El correo no parece valido.'`
- `'Envío a domicilio'` con `p_address = 'OTRA DIRECCION'` y `p_address_parts = {"street":"Zaragoza","numExt":"140","numInt":"","neighborhood":"Centro","city":"Colima","state":"COL","stateName":"Colima","zip":"28000","references":"","evil":"x"}` → `address = 'Zaragoza #140, Col. Centro, Colima, Colima, C.P. 28000'` y `address_parts` sin `evil`.
- Topes (bajando cada fila de `security_limits` a 2 dentro del bloque): mismo WhatsApp en formatos distintos (`'312 123 4567'`, `'+52 312 123 4567'`, `'044 312 123 4567'`) con IPs distintas → el 3.º lanza `'Demasiados pedidos seguidos. Espera unos minutos o pídenos por WhatsApp.'` con `hint = 'whatsapp'`; números distintos y misma IP → igual (`order_ip`); `order_ip_day` igual; `order_global` → `'La tienda está recibiendo muchos pedidos en este momento. Pídenos por WhatsApp y te atendemos.'` con `hint = 'whatsapp'`. Dos IPv6 de la misma `/64` cuentan como la misma IP.
- Con claims del admin y `aal2`: pasa los topes, acepta `p_payment_method = 'Efectivo en tienda'` y `qty = 5` con `stock = 1`; el borrador sigue rechazado.
- `to_regprocedure('public.coupon_first_purchase_ok(text,text,text)') is null`.
- `CHECK_OK`.

- [ ] **Step 2: Cambiar `place_order`**, en este orden:
1. **Contacto:** el correo además se rechaza si `v_email ~ '[<>"'']'`.
2. **Métodos** (solo si `not is_admin()`): pago en `('Transferencia', 'Pago al recoger')` y entrega en `('Recoger en tienda', 'Envío a domicilio')`, si no `'Metodo de pago o de entrega invalido.'`. Admin: texto libre saneado (`left(translate(…, '<>', ''), 80)`).
3. **Topes** (solo si `not is_admin()`), reemplazan el conteo por `customer_whatsapp`: `rate_check('order_ip', request_ip())`, `rate_check('order_ip_day', request_ip())`, `rate_check('order_phone', phone_key(v_whatsapp))` → si alguno es `false`, el primer mensaje del check con `hint = 'whatsapp'`; luego `rate_check('order_global', '*')` → el segundo mensaje con `hint = 'whatsapp'`.
4. **Cupón:** `… and public.coupon_open(c)` en vez de `and active = true`; si `max_uses is not null`, `pg_advisory_xact_lock(hashtext('coupon:' || code))` antes.
5. **Por línea:** `badge = 'Borrador'` → mismo mensaje que "no encontrado" (también para admin). Talla/color: `left(translate(coalesce(v_item->>'size', ''), '<>', ''), 40)`; si no vacío y `to_jsonb(v_product.sizes)` es arreglo no vacío y no lo contiene (`?`) → `'Revisa la talla o el color de tus productos.'`; igual `colors`.
6. **Existencias** (solo si `not is_admin()`), después del bucle con `qty` sumada por producto: stock numérico (`btrim(stock::text) ~ '^-?[0-9]+$'`) con `stock <= 0` o suma > stock → `'Uno de los productos esta agotado o no tiene suficientes piezas.'`. Nunca se descuenta.
7. **Dirección por partes:** `v_parts` solo con `street, numExt, numInt, neighborhood, city, state, stateName, zip, references`. Con `'Envío a domicilio'` y `v_parts` objeto, `v_address` se arma con el formato de `src/pages/checkout/checkout.js:605`: `street || ' #' || numExt || [' Int. ' || numInt] || ', Col. ' || neighborhood || ', ' || city || ', ' || stateName || ', C.P. ' || zip || [' | Ref: ' || references]`; si falta `street, numExt, neighborhood, city, stateName` o `zip` → `'Completa tu direccion de envio.'`. Sin partes: `p_address` saneado como hoy.
8. **No se exige cotización** en envío a domicilio (modo sin cotización cuando Envia falla).

Fuera de la función: borrar `coupon_first_purchase_ok` y agregar `drop function if exists public.coupon_first_purchase_ok(text, text, text);` (el sitio actual, si falla, no bloquea: `if (error) return true`). `phone_key` con `set search_path = public, pg_temp` en su propio `create or replace`. El `grant execute` de `place_order` queda a `anon, authenticated, service_role`.

- [ ] **Step 3: Cliente.** `saveOrder` devuelve `error` con `message`, `details` y `hint`. En el checkout, si `error.hint === 'whatsapp'`: mostrar el mensaje y un botón `Pedir por WhatsApp` que llama `openWhatsAppWithMessage(buildOrderMessage(...))` (`src/utils/whatsapp.js`) con los mismos datos que ya arma el checkout; el carrito no se vacía.

- [ ] **Step 4: El controlador aplica** `place-order.sql` completo (después de `coupons.sql`), corre el check → `CHECK_OK`, y Q-7 → una sola versión de 12 argumentos. Humo: un pedido de prueba en producción entra y se cancela.

- [ ] **Step 5: `npm test`, `npm run build` → ok. Commit** `fix(seguridad): place_order con topes por IP, borradores, existencias y metodos validos`.

---

### Task 5: Tope de avisos de pedido al equipo (Fase A)

Cubre A-1 punto 3.

**Files:**
- Modify: `supabase/order-staff-notify.sql`
- Create: `supabase/checks/order-staff-notify.sql`

**Interfaces:**
- Consumes: `rate_check`, `send_staff_alert` (Tarea 2).

- [ ] **Step 1: Check.** Con `update security_limits set max_hits = 1 where name = 'staff_mail'` en el bloque: contar la cola de pg_net; `place_order` (como en la Tarea 4) → sube 1 (aviso normal); otro → sube 1 y ese cuerpo contiene `se pausaron los avisos`; otro → no sube. Si `order_notify_emails` está vacía o falta la clave de Resend, fallar con mensaje claro (no `CHECK_OK`). `CHECK_OK`.

- [ ] **Step 2:** En `notify_staff_on_order()`, rama `INSERT`: `if public.rate_check('staff_mail', '*') then perform public.send_order_staff_email(new.id, 'nuevo'); else perform public.send_staff_alert('staff_mail'); end if;`. Las cancelaciones no cambian. `pg_temp` en los `search_path` DEFINER del archivo.

- [ ] **Step 3: El controlador aplica**, corre el check, comprueba "Mandar prueba" en Admin → Pedidos, y anota si Resend cuenta por destinatario (Global Constraints).

- [ ] **Step 4: Commit** `fix(seguridad): tope diario de avisos de pedido`.

---

### Task 6: Boletín con doble confirmación (SQL en A, cliente en B)

Cubre M-1, B-3 (boletín) y V-8.

**Files:**
- Modify: `supabase/newsletter-correos.sql`; Create: `supabase/checks/newsletter.sql`
- Modify: `src/store/newsletter.js`, `src/store/index.js:8`, `src/pages/home/home.js:428-445`
- Create: `src/pages/unsubscribe/confirm.js`; Modify: `src/core/views.js`, `src/core/routeSeo.js`, `scripts/prerender.mjs` (`:237` mapa de módulo, `:1012` rutas con HTML propio, `:1259` lista "No citar" de `llms.txt`: agregar `/confirmar` junto a `/baja`. `public/robots.txt` y `vercel.json` no listan `/baja`; no se tocan.)
- Modify: `src/pages/admin/adminNewsletter.js` (estado "Pendiente"; quitar el editor del correo de bienvenida, `:215-226`)

**Interfaces:**
- Consumes: `rate_check`, `request_ip` (Tarea 2).
- Produces:
  - Columnas `confirmed_at timestamptz`, `confirm_token uuid`, `confirm_sent_at timestamptz`.
  - Relleno idempotente: `update public.newsletter_subscribers set confirmed_at = coalesce(subscribed_at, now()) where confirmed_at is null and confirm_token is null;`
  - `public.newsletter_subscribe(p_email text) returns void` — DEFINER. (1) `lower(btrim(p_email))`; > 254, sin forma `^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$` o con `[<>"']` → `'El correo no parece valido.'`. (2) `rate_check('nl_ip', request_ip())` o → `'Demasiados intentos. Intenta mas tarde.'`. (3) `pg_advisory_xact_lock(hashtext('nl:' || email))`; busca por `lower(email)`. (4) Confirmada y sin baja → `return`. `confirm_sent_at > now() - interval '24 hours'` → `return`. (5) `rate_check('nl_email', email)` falso → `return` (en silencio). `rate_check('nl_global', '*')` falso → el mensaje de (2). (6) `perform set_config('gl.nl_rpc', '1', true)`; inserta (`source = 'home_page'`) o actualiza con `confirm_token = gen_random_uuid(), confirm_sent_at = now()` sin tocar `unsubscribed_at` ni `confirmed_at`; `send_confirm_to(email, confirm_token)`. Misma respuesta exista o no el correo. `grant` a `anon, authenticated`.
  - `public.newsletter_confirm(p_token uuid) returns boolean` — DEFINER. Si hay fila con ese `confirm_token` y ya está confirmada y sin baja → `true` (segundo clic). Si `confirm_sent_at > now() - interval '7 days'` → `confirmed_at = now(), unsubscribed_at = null, unsub_token = gen_random_uuid()` (el `confirm_token` se conserva para que el segundo clic diga "listo") → `true`. Si no → `false`. **No manda correo de bienvenida.** `grant` a `anon, authenticated`.
  - `public.send_confirm_to(p_email text, p_token uuid) returns void` — DEFINER, sin `grant`, nunca lanza. `from`/`reply_to` como `newsletter_email_json`; asunto `Confirma tu suscripción a G&L`; HTML `<p>Hola:</p><p>Para recibir las novedades de G&amp;L, confirma tu correo:</p><p><a href="https://www.glboutique.com.mx/confirmar?t=<token>">Confirmar suscripción</a></p><p>Si no fuiste tú, ignora este correo. No te volveremos a escribir.</p>`.
  - **Puerta vieja en la Fase A** (sitio en caché): trigger `BEFORE INSERT` `newsletter_direct_insert` (DEFINER): si `current_setting('gl.nl_rpc', true) is distinct from '1'` (insert directo por la API) → aplica los mismos topes `nl_ip`/`nl_global` (rechaza con el mismo mensaje), normaliza `email`, fuerza `source = 'home_page'`, `subscribed_at = now()`, `unsub_token = gen_random_uuid()`, `unsubscribed_at = null`, `confirmed_at = null`, `confirm_token = gen_random_uuid()`, `confirm_sent_at = now()`. `send_welcome_email()` (el `AFTER INSERT` existente) ahora llama `send_confirm_to(NEW.email, NEW.confirm_token)` si `NEW.confirmed_at is null`, nunca la bienvenida. `newsletter_resubscribe(p_email)` pasa a ser `perform public.newsletter_subscribe(p_email);` (manda confirmación, ya no reactiva).
  - `send_newsletter()`: conteo y cola con `unsubscribed_at is null and confirmed_at is not null`.
  - Cliente: `subscribeNewsletter(email) -> { ok, error? }` con `rpc('newsletter_subscribe', { p_email })`; error con `Demasiados` → ese texto; otro → `'No se pudo guardar tu suscripción. Intenta de nuevo.'`. `confirmNewsletter(token) -> true|false|null` como `unsubscribeNewsletter`.

- [ ] **Step 1: El controlador corre Q-9** y `select lower(email), count(*) from newsletter_subscribers group by 1 having count(*) > 1;`. Duplicados por mayúsculas → avisar antes de seguir.

- [ ] **Step 2: Check `supabase/checks/newsletter.sql`** (IP `203.0.113.7`, correo `zz+test@example.com`):
- `newsletter_subscribe('ZZ+Test@Example.com ')` → cola +1, fila pendiente; repetir → cola igual.
- `newsletter_confirm(<token>)` → `true` y `confirmed_at` puesto; otra vez → `true`; `newsletter_confirm(gen_random_uuid())` → `false`; token de hace 8 días (ajustar `confirm_sent_at` en el bloque) sin confirmar → `false`.
- Confirmar no agrega nada a la cola (sin bienvenida).
- `'no-es-correo'` → `'El correo no parece valido.'`; con `nl_ip` en 1, la 2.ª alta nueva desde la misma IP → `'Demasiados intentos. Intenta mas tarde.'`.
- Con `nl_email` en 1 y `confirm_sent_at` movido a hace 2 días, una 2.ª petición no manda correo.
- Insert directo como `anon` (`set local role anon`) con `confirmed_at = now()`, `unsubscribed_at = null`, `source = 'x'` → la fila queda pendiente, `source = 'home_page'`, y la cola sube 1 con el asunto de confirmación. `reset role`.
- `newsletter_resubscribe` de un dado de baja → sigue con `unsubscribed_at` puesto y la cola sube 1.
- `CHECK_OK`.

- [ ] **Step 3: Escribir los cambios** en `newsletter-correos.sql` (lo de **Interfaces**; `pg_temp` en todos sus `search_path`).

- [ ] **Step 4: El controlador aplica (Fase A)**, corre el check, y `select count(*) from newsletter_subscribers where confirmed_at is null;` → 0. Humo con el sitio actual: suscribirse con un alias → llega la confirmación, no la bienvenida.

- [ ] **Step 5: Cliente.**
- Home, éxito: `Revisa tu correo.` / `Te mandamos un enlace para confirmar tu suscripción al Club G&L.`
- `/confirmar?t=`: no confirma al cargar (los antivirus de correo abren los enlaces). Muestra `Confirma tu suscripción` / `Pulsa el botón para recibir las novedades de G&L.` y un botón `Confirmar mi suscripción`; al pulsar: cargando `Un momento…`; listo `Listo, ya eres parte del Club G&L.` / `Usa WELCOME10 para tener 10% de descuento en tu primera compra.`; inválido `Este enlace no es válido o ya venció.` / `Vuelve a suscribirte desde la página principal y te mandamos uno nuevo.`; error `No pudimos confirmar tu suscripción.` / `Revisa tu conexión e inténtalo de nuevo en un momento.`
- Admin: `isActive = s => Boolean(s.confirmed_at) && !s.unsubscribed_at`; estados `Activo` | `Pendiente` | `Dado de baja` en tabla y CSV; quitar el editor de bienvenida (la fila `welcome` de `email_templates` queda sin uso).

- [ ] **Step 6: `npm test`, `npm run build` → ok** (existe `dist/confirmar…`). **Commit** `fix(seguridad): boletin con doble confirmacion y topes`.

---

### Task 7: Edge Function `shipping-quote` con tope atómico, global y caché (Fase A)

Cubre M-4, B-10 y V-3 de las funciones.

**Files:**
- Modify: `supabase/functions/shipping-quote/index.js`

**Interfaces:**
- Consumes: `rate_check_ip` (Tarea 2) vía `db.rpc` con service role.
- Produces: misma respuesta JSON que hoy.

- [ ] **Step 1: El controlador verifica la cabecera de IP dentro del runtime de Edge.** Despliega una función temporal `ip-probe` que devuelve `{ cf, xff, xri }` de `req.headers`. Desde su máquina: `curl -4 -s https://api.ipify.org`, `curl -s https://api64.ipify.org`, y `curl -s -X POST "$URL/functions/v1/ip-probe" -H "Authorization: Bearer $ANON" -H "CF-Connecting-IP: 6.6.6.6" -H "X-Forwarded-For: 7.7.7.7" -H "X-Real-IP: 8.8.8.8"`. Misma regla que la Tarea 2 Paso 1. Si se puede, repetir desde otra red (hotspot del teléfono) y confirmar que la IP cambia. Borrar `ip-probe`. Anotar la cabecera en el commit.

- [ ] **Step 2: Cambiar `index.js`**
- IP: solo la cabecera del Paso 1; si falta, `''` (SQL la convierte en `'unknown'`). Borrar `x-real-ip`, el `sha256` y el conteo previo.
- Tras validar el cuerpo: `db.rpc('rate_check_ip', { p_name: 'quote_ip', p_ip: ip })` y luego `db.rpc('rate_check', { p_name: 'quote_global', p_key: '*' })`. Error o `false` → `429 { error: 'rate_limited' }`.
- Validar CP/estado/ciudad y leer `shipping_settings` **antes** de cualquier insert.
- Caché: fila más reciente de `shipping_quotes` con el mismo `zip` y `cart_key`, `standard` no nulo, `created_at > now() - 10 min` y `expires_at > now() + 20 min` → responder con su `id` y tarifas (`pub()`), sin llamar a Envia ni insertar.
- Solo con caché fallida se inserta la fila (sin `ip_hash`) y se cotiza.

- [ ] **Step 3: `npm test` → ok.**

- [ ] **Step 4: El controlador despliega** (`deploy_edge_function`, con `../_shared/*`) y hace P-1: 12 POST válidos seguidos con `CF-Connecting-IP`, `X-Real-IP` y `X-Forwarded-For` distintos en cada uno → el 11.º y el 12.º dan `429`. Dos cotizaciones iguales seguidas desde el checkout → mismo `quoteId`.

- [ ] **Step 5: Commit** `fix(seguridad): cotizador con tope atomico, tope global y cache`.

---

### Task 8: Escapar lo que se pinta con `innerHTML` (Fase B)

Cubre B-1, B-4 y la parte de XSS de M-3.

**Files:**
- Modify: `src/utils/toast.js:39` — el mensaje va con `textContent` en un `<span>` creado con DOM (ningún llamador manda HTML; cubre también `adminCategories.js:129`).
- Modify: `src/core/startApp.js:614,617` — `escapeHtml(n.title)` y `escapeHtml(n.body)`.
- Modify con `escapeHtml`/`esc()`: `src/pages/catalog/catalogCard.js:86,101`; `src/pages/home/homeCards.js:32,40`; `src/pages/product/product.js:232` (`data-color` y nombre), `:507`; `src/pages/catalog/catalog.js:38,570,575,580` (valor y texto de `<option>`); `src/pages/admin/adminCategories.js:72,163`.
- Create: `scripts/test-store-escaping.mjs`; Modify: `scripts/test-admin-escaping.mjs`, `scripts/test.mjs` (agregar también `./test-admin-escaping.mjs`, que hoy no corre)

- [ ] **Step 1: `scripts/test-store-escaping.mjs`**

```js
const evil = '<img src=x onerror=alert(1)>'
const p = { id: 'x', name: evil, type: evil, price: 100, images: ['https://bcnfbrhcubpysqpyhbvf.supabase.co/a.webp'], sizes: [], colors: [evil], stock: '' }
assert.ok(!productCard(p, 0).includes('<img src=x'))
assert.ok(!bestSellerRow(p, 0).includes('<img src=x'))
```
Si importarlos en Node falla por el DOM, cubrir esos archivos con el chequeo por texto del Paso 2.

- [ ] **Step 2: Extender `scripts/test-admin-escaping.mjs`** a `src/core/startApp.js`, `src/pages/catalog/catalog.js`, `catalogCard.js`, `src/pages/home/homeCards.js`, `src/pages/product/product.js`, con un segundo patrón que marque `${p.name}`, `${cat.name}`, `${r.quote}`, `${n.title}`, `${n.body}`, `${x}`, `${c}` sin `esc(`/`escapeHtml(` (mismas reglas de `// not-html:` y ternarios).

- [ ] **Step 3: `npm test` → FAIL. Step 4: escapar → PASS; `npm run build` → ok.**

- [ ] **Step 5: Manual:** categoría `<b>x</b>` se ve literal en admin y en el filtro del catálogo; borrarla.

- [ ] **Step 6: Commit** `fix(seguridad): escapar nombres de cliente, producto y categoria en el HTML`.

---

### Task 9: CSV sin fórmulas (Fase B)

Cubre B-6.

**Files:**
- Create: `src/utils/csv.js`, `scripts/test-csv.mjs`; Modify: `scripts/test.mjs`, `src/pages/admin/adminClientes.js:275`, `src/pages/admin/adminNewsletter.js:200`

**Interfaces:**
- Produces: `csvCell(value) -> string` (`String(value ?? '')`; prefijo `'` si empieza con `=`, `+`, `-`, `@`, tab, `\r` o `\n`; comillas duplicadas; envuelto en comillas). `csvRow(values) -> string` (unidas con `,`).

- [ ] **Step 1: `scripts/test-csv.mjs`**

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

- [ ] **Step 2: FAIL. Step 3: implementar → PASS. Step 4: usar `csvRow` en todas las filas (encabezados incluidos) de los dos exportes; `npm test`, `npm run build` → ok. Commit** `fix(seguridad): CSV de clientes y boletin sin formulas`.

---

### Task 10: CSP sin scripts en línea (Fase B)

Cubre B-5 (la parte de `img-src` se cierra en la Tarea 11).

**Files:**
- Modify: `index.html` — los dos `<script>` de arranque (`:65-75` canonical y `:675-680` ocultar el shell) **se quedan en línea** y se autorizan por hash en la CSP (no bloquean el pintado con una petición extra; `prerender.mjs:194` sigue encontrando y reemplazando el del canonical). El registro del service worker (`:691-701`) se mueve a `src/main.js`.
- Modify: `src/main.js` — registro del SW y listeners delegados en `document`: `click` en `[data-reload]` → `location.reload()`; `error` en captura para `img[data-fallback]` → `img.src = img.dataset.fallback` si aún no lo es; `wheel` (`{ passive: true }`) sobre `input[type=number]` enfocado → `blur()`.
- Modify: quitar `onclick=`/`onerror=`/`onwheel=` de `src/core/startApp.js:340`, `src/main.js:25`, `src/utils/toast.js:36` (→ `data-reload`), `src/pages/home/homeCards.js:40`, `src/pages/product/product.js:49` (→ `data-fallback="/placeholder.webp"`), `adminCoupons.js`, `adminPromotions.js` (2), `adminShipping.js` (5).
- Modify: `src/pages/admin/adminOrders.js:138-142,332-335` — `printOrderHtml` sin `<script>` (la ventana `about:blank` hereda la CSP); tras `pw.document.close()`, quien abre espera la primera imagen (`complete`/`onload`/`onerror`) y llama `pw.focus(); pw.print()`.
- Modify: `vercel.json`. Create: `scripts/test-csp.mjs`; Modify: `scripts/test.mjs`.

**Interfaces:**
- Produces: CSP:
  `default-src 'self'; script-src 'self' 'sha256-<canonical>' 'sha256-<shell>'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' https://bcnfbrhcubpysqpyhbvf.supabase.co wss://bcnfbrhcubpysqpyhbvf.supabase.co; worker-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`
  (los dos hashes = SHA-256 en base64 del contenido exacto entre `<script>` y `</script>`). `img-src https:` se queda hasta la Tarea 11 (151 productos usan fotos ajenas). `style-src 'unsafe-inline'` se queda (cientos de `style=`; no ejecuta código).
  HSTS: `Strict-Transport-Security: max-age=63072000; includeSubDomains` (sin `preload`), **solo si** el Paso 1 lo confirma.

- [ ] **Step 1: El controlador revisa los subdominios** de `glboutique.com.mx` en el DNS (panel del dominio o `nslookup`): todo subdominio que se abra en un navegador debe servir HTTPS. Los registros de Resend (MX/TXT) no cuentan. Si alguno no tiene HTTPS, el header va sin `includeSubDomains` y se anota.

- [ ] **Step 2: `scripts/test-csp.mjs`**
- La CSP de `vercel.json` es la de **Interfaces**, y los dos hashes coinciden con los `<script>` en línea de `index.html` (calcularlos en el test con `node:crypto`).
- Ningún `.js` bajo `src/` contiene `/\son[a-z]+="/`.
- Todo `<script` de `index.html` tiene `src=`, `type="application/ld+json"`/`"application/json"`, o su hash está en la CSP.
- Si existe `dist/`, lo mismo para cada `dist/**/*.html`.

- [ ] **Step 3: FAIL. Step 4: hacer los cambios; `npm run build` y `npm test` → PASS** (con `dist/` revisa las 250+ páginas).

- [ ] **Step 5: Commit** `fix(seguridad): CSP sin scripts en linea y hosts exactos`.

- [ ] **Step 6: Verificación en el preview de Vercel**, con la consola buscando `Content Security Policy`: home sin JS (shell solo en `/`), `/catalog`, una ficha (fotos; una rota → placeholder), bolsa con cupón, checkout sin enviar, `/baja?t=x`, `/confirmar?t=x`; admin: login, realtime (un pedido de prueba hace sonar la campana), subir foto a producto y a Contenido, "Imprimir", vista previa de correos. Cero violaciones de CSP; el canonical sigue en la fuente de cada ficha. **Esperado en el preview:** la cotización de envío cae en "Te confirmamos el costo por WhatsApp" porque el CORS de `shipping-quote` solo acepta el dominio de producción y `localhost`; eso no es la CSP.

---

### Task 11: Fotos solo propias y `img-src` cerrado (código en B, re-alojo y cierre en B')

Cubre la parte de `img-src` de B-5.

**Files:**
- Create: `src/utils/images.js`, `scripts/test-images.mjs`; Modify: `scripts/test.mjs`
- Modify: `src/pages/admin/adminProductForm.js` (validación al guardar; texto de "Pegar enlaces de imágenes")
- Modify (Paso 8): `vercel.json`, `scripts/test-csp.mjs`

**Interfaces:**
- Produces: `isOwnImageUrl(url: string) -> boolean` — `true` solo si empieza con `https://bcnfbrhcubpysqpyhbvf.supabase.co/storage/v1/object/public/` o es ruta propia (`/…`).

- [ ] **Step 1: `scripts/test-images.mjs`**

```js
assert.ok(isOwnImageUrl('https://bcnfbrhcubpysqpyhbvf.supabase.co/storage/v1/object/public/products/a.webp'))
assert.ok(isOwnImageUrl('/placeholder.webp'))
assert.ok(!isOwnImageUrl('https://cdn.shopify.com/x.jpg'))
assert.ok(!isOwnImageUrl('https://bcnfbrhcubpysqpyhbvf.supabase.co.evil.com/x.jpg'))
assert.ok(!isOwnImageUrl('javascript:alert(1)'))
```

- [ ] **Step 2: FAIL. Step 3: implementar → PASS.**

- [ ] **Step 4: Admin.** El textarea `imageUrls` se queda (ahí viven las fotos subidas), pero al guardar, si algún enlace no pasa `isOwnImageUrl`, no se guarda y se muestra `Solo se aceptan fotos subidas aquí. Descarga la imagen y súbela con el botón de arriba.`. La etiqueta del `<summary>` pasa a `Enlaces de las fotos`. Las fotos ajenas que ya tenga un producto no bloquean guardar otros cambios hasta que se re-alojen: la validación solo aplica a enlaces **nuevos** (los que no estaban al abrir el form).

- [ ] **Step 5: `npm test`, `npm run build` → ok. Commit** `fix(seguridad): el admin solo acepta fotos propias`.

- [ ] **Step 6 (requiere OK del dueño): re-alojar.** El controlador pide al dueño aprobación para copiar a Storage propio las fotos de 151 productos (cambia `image_url`/`images` en la base y dispara un despliegue). Con el OK: `node scripts/rehost-images.mjs` (simulacro: lista fotos vivas/muertas), revisa la salida con el dueño, y `SUPABASE_SERVICE_KEY=… node scripts/rehost-images.mjs --aplicar` (la clave solo en el entorno de esa corrida). Sin OK, la tarea se queda aquí y `img-src` sigue en `https:`.

- [ ] **Step 7: El controlador confirma que no quedan hosts ajenos:** `select distinct substring(u from '^https?://[^/]+') from (select unnest(images) u from products union all select image_url from products) t where u is not null;` más `select distinct (regexp_matches(t::text, 'https?://[^/"\\]+', 'g'))[1] from site_content t;` más `select distinct (regexp_matches(html, 'src="(https?://[^/"]+)', 'g'))[1] from email_templates;`. Solo deben salir el host de Supabase, `www.glboutique.com.mx` y hosts que se decida conservar (anotar cuáles y por qué).

- [ ] **Step 8: Cerrar `img-src`** a `'self' data: blob: https://bcnfbrhcubpysqpyhbvf.supabase.co https://images.unsplash.com https://www.glboutique.com.mx` más los conservados del Paso 7; actualizar `scripts/test-csp.mjs`; `npm test`, `npm run build`; repetir la Tarea 10 Paso 6 en el preview. Commit `fix(seguridad): img-src solo hosts propios`.

---

### Task 12: Turnstile y Edge Function `place-order` (requiere llaves del dueño; deploy en A, cliente en B, cierre en C)

Cubre A-1 punto 1.

**Files:**
- Create: `supabase/functions/place-order/index.js`
- Modify: `src/store/orders.js` (`saveOrder`), `src/pages/checkout/checkout.js`, `src/pages/checkout/checkoutView.js` (contenedor del widget), `vercel.json` y `scripts/test-csp.mjs` (CSP), `supabase/functions/README.md`
- Modify (Fase C): `supabase/security-hardening.sql` (revoke de `place_order` a `anon`)

**Interfaces:**
- Consumes: `place_order` (Tarea 4); `request_ip()` acepta `x-gl-client-ip` con service role (Tarea 2).
- Produces: `POST /functions/v1/place-order` con `{ token: string, order: { p_customer_name, …, p_address_parts } }` (los 12 argumentos de `place_order`). Respuestas: `200 { ok: true }`; `400 { error: { message, details, hint } }` (lo que lanzó `place_order`); `403 { error: { message: 'No pudimos verificar que eres una persona. Recarga la página e intenta de nuevo.' } }` si Turnstile falla. `saveOrder` conserva su firma y devuelve `{ error }` con la misma forma que hoy.

- [ ] **Step 0 (dueño):** crear en Cloudflare → Turnstile un widget "Managed" para `glboutique.com.mx` y `www.glboutique.com.mx`, y pasar al controlador la site key y la secret key. **Si el dueño no da las llaves, saltar esta tarea completa** (el resto del plan no depende de ella) y dejarlo anotado.

- [ ] **Step 1: Edge Function `place-order`:** mismo CORS que `shipping-quote`. IP con la cabecera verificada en la Tarea 7 Paso 1. Verifica con `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` (`secret` = `TURNSTILE_SECRET`, `response` = token, `remoteip` = IP); exige `success === true` y `hostname` en `['glboutique.com.mx', 'www.glboutique.com.mx']`. Luego crea un cliente con service role y `global: { headers: { 'x-gl-client-ip': ip } }` (para que `place_order` cuente la IP del cliente) y llama `rpc('place_order', order)`; reenvía `message`, `details` y `hint` del error.

- [ ] **Step 2: Cliente.** En el checkout, cargar `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` solo en esa página, renderizar el widget con `import.meta.env.VITE_TURNSTILE_SITE_KEY` y mandar el token con el pedido; tras un error, `turnstile.reset()`. `saveOrder` llama `supabase.functions.invoke('place-order', { body: { token, order } })` y, si hay error, lee el JSON del cuerpo (`error.context.json()`) para devolver `{ message, details, hint }`. CSP: agregar `https://challenges.cloudflare.com` a `script-src` y `frame-src https://challenges.cloudflare.com` (y al test).

- [ ] **Step 3: El controlador** guarda `TURNSTILE_SECRET` con `create_edge_function_secret`, despliega la función, agrega `VITE_TURNSTILE_SITE_KEY` en Vercel (Production y Preview). Prueba: `curl` a la función sin token → `403`; un pedido real desde el preview de Vercel (agregar temporalmente el origen del preview al CORS, o probar tras el deploy) entra; con `curl` directo a `/rest/v1/rpc/place_order` todavía funciona (se cierra en la Fase C).

- [ ] **Step 4: `npm test`, `npm run build` → ok. Commit** `feat(seguridad): pedidos con Turnstile por Edge Function`.

- [ ] **Step 5 (Fase C):** en `security-hardening.sql`, `revoke execute on function public.place_order(text, text, text, text, text, jsonb, text, text, numeric, uuid, text, jsonb) from anon;` (quedan `authenticated` y `service_role`). Va con el resto de la Tarea 15.

---

### Task 13: Admin — MFA en el login, contraseña sin `.trim()`, borradores al entrar (Fase B)

Cubre la parte de código de B-9 y la de admin de B-8.

**Files:**
- Create: `src/utils/mfa.js`, `scripts/test-mfa.mjs`; Modify: `scripts/test.mjs`
- Modify: `src/store/auth.js`, `src/store/index.js`, `src/pages/admin/adminLogin.js`, menú del admin (`src/components/layout.js`: enlace `Seguridad` a `/admin/login`)

**Interfaces:**
- Produces:
  - `mfaStep({ currentLevel, nextLevel }) -> 'none' | 'challenge' | 'enroll'`: `currentLevel === 'aal2'` → `'none'`; `nextLevel === 'aal2'` → `'challenge'`; si no → `'enroll'`.
  - En `src/store/auth.js`: `getMfaStep()` (`mfa.getAuthenticatorAssuranceLevel()`); `startMfaEnroll(name) -> { factorId, qr, secret } | { error }` — **antes** de `mfa.enroll({ factorType: 'totp', friendlyName: name })`, borra con `mfa.unenroll` todo factor de `mfa.listFactors().data.all` con `status === 'unverified'` (un alta a medias bloquea la siguiente); `verifyMfa(code, factorId?) -> { error? }` (`mfa.challengeAndVerify`; sin `factorId`, el primer TOTP verificado de `listFactors().data.totp`); `listMfaFactors() -> [{ id, friendly_name, created_at }]` (solo verificados).
  - Tras `'none'` o tras verificar: `refreshProducts()` (con sesión de admin trae borradores; ver Tarea 15) y la comprobación de `admin_users` de siempre.

- [ ] **Step 1: `scripts/test-mfa.mjs`**

```js
assert.equal(mfaStep({ currentLevel: 'aal2', nextLevel: 'aal2' }), 'none')
assert.equal(mfaStep({ currentLevel: 'aal1', nextLevel: 'aal2' }), 'challenge')
assert.equal(mfaStep({ currentLevel: 'aal1', nextLevel: 'aal1' }), 'enroll')
```

- [ ] **Step 2: FAIL. Step 3: implementar `src/utils/mfa.js` → PASS.**

- [ ] **Step 4: Login en dos pasos**
- Sin `.trim()` en la contraseña (`:130`).
- `'challenge'` → campo de 6 dígitos (`inputmode="numeric" autocomplete="one-time-code" maxlength="6"`, etiqueta `Código de tu app de autenticación`). `'enroll'` → `Para entrar al admin necesitas un segundo paso. Escanea este código con Google Authenticator, 1Password o Authy y escribe el código de 6 dígitos.`, el QR (`<img src>` con el `data:` que da Supabase), el secreto para copiar y el campo. Código incorrecto → `Código incorrecto. Revisa la hora de tu teléfono e inténtalo de nuevo.`, cuenta para el bloqueo progresivo existente.
- Al montar: con sesión y `'challenge'` → directo al código (sesiones `aal1` tras la Fase D). Con sesión `aal2` → la página muestra `Seguridad`: lista de dispositivos (`listMfaFactors`) y botón `Agregar otro dispositivo` (mismo flujo de alta, nombre `G&L admin 2`, `3`…), y un enlace `Ir al panel`.
- Todo lo que venga de Supabase con `textContent` o `esc()`.

- [ ] **Step 5: `npm test`, `npm run build` → ok. Manual** en `npm run dev` con una cuenta de prueba (la crea y la da de alta en `admin_users` el controlador; se borra al final): alta del factor; **empezar el alta, recargar la página y volver a darla de alta** (debe funcionar); salir y entrar con código; código incorrecto; agregar un segundo dispositivo estando en `aal2`.

- [ ] **Step 6: Commit** `feat(seguridad): segundo factor TOTP en el admin`. Avisar al dueño: tras el deploy, su siguiente entrada le pedirá dar de alta el factor, y debe agregar un segundo dispositivo antes de la Fase D.

---

### Task 14: Dependencias (Fase B)

Cubre B-7.

- [ ] **Step 1:** `npm audit fix` (sin `--force`). **Step 2:** `npm audit` → 0 altos; lo que solo se arregle con `--force` no se fuerza y se anota en el commit. **Step 3:** `npm test`, `npm run build`, `npm run dev` abre la home. **Step 4: Commit** `chore(seguridad): npm audit fix en herramientas de build` (`package.json` solo si cambió, `package-lock.json`).

---

### Task 15: Cierre — políticas, boletín, borradores, Storage y funciones (Fase C)

Cubre M-3, I-1, I-2, B-8 (política), V-2, V-4, V-5, V-6, el resto de V-7 y el cierre de M-1/M-2/B-3. **≥ 24 h después del deploy de B.**

**Files:**
- Create: `supabase/security-hardening.sql`, `supabase/checks/security-hardening.sql`
- Modify: `supabase/rls-hardening.sql`, `supabase/newsletter-correos.sql`, `supabase/add_updated_at.sql`, `supabase/order-confirmation.sql`

- [ ] **Step 1: El controlador comprueba que nadie usa las puertas viejas** (`query_logs`, servicio `api`, últimas 24 h): 0 peticiones `POST /rest/v1/newsletter_subscribers`, 0 `GET /rest/v1/coupons?select=*&code=eq.…&active=eq.true` (la forma exacta de `src/store/coupons.js:17-22` del sitio viejo; las del admin van sin `active=eq.true`), 0 `/rpc/newsletter_resubscribe`, 0 `/rpc/coupon_first_purchase_ok` y, si se hizo la Tarea 12, 0 `/rpc/place_order` con la clave anónima. Si hay, esperar otras 24 h. Luego corre Q-1, Q-2, Q-5, Q-6, Q-8, `select polname from pg_policy where polrelid in ('public.categories'::regclass, 'public.site_content'::regclass);` y `select distinct metadata->>'mimetype', max((metadata->>'size')::bigint) from storage.objects where bucket_id in ('products','site-content') group by 1;`, y le pasa los resultados al implementador.

- [ ] **Step 2: Check `supabase/checks/security-hardening.sql`:**
- `anon` sin `INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER` en ninguna tabla de `public` (ahora sin excepción) ni `USAGE/UPDATE` en secuencias; `authenticated` sin `TRUNCATE`.
- Cada `INSERT/UPDATE/DELETE` que `authenticated` conserva tiene política de ese comando (o `ALL`) para `authenticated` o `public`.
- No existen `newsletter_public_insert`, `coupons_public_read_active`, `orders_public_insert`, `products_bucket_public_read`; existen `products_public_read` (con `badge`), `products_admin_read`, `products_bucket_admin_read`, `categories_*` y `site_content_*` nuevas.
- Como `anon` (`set local role anon` … `reset role`): 0 borradores en `products`; 0 filas en `coupons`; `insert into newsletter_subscribers` → `permission denied`.
- No existen `newsletter_resubscribe(text)`, el trigger `newsletter_welcome_email` ni `newsletter_direct_insert`.
- `anon` no ejecuta `html_esc`, `money_mx`, `newsletter_email_json`, `order_staff_email`, `phone_key`; sí ejecuta `validate_coupon`, `newsletter_subscribe`, `newsletter_confirm`, `newsletter_unsubscribe`, `free_shipping_min` y `place_order` (salvo si se hizo la Tarea 12: entonces `false`).
- Toda función `SECURITY DEFINER` de `public` tiene `pg_temp` en `proconfig`.
- `CHECK_OK`.

- [ ] **Step 3: `supabase/security-hardening.sql`** (encabezado: "Se corre siempre al final, después de cualquier otro archivo de supabase/"). En este orden — **políticas primero, revokes después**, para que el ciclo del punto 7 vea las políticas definitivas:
1. `drop policy if exists` de `newsletter_public_insert`, `coupons_public_read_active`, `orders_public_insert`.
2. Boletín: `drop trigger if exists newsletter_welcome_email …; drop trigger if exists newsletter_direct_insert …; drop function if exists public.newsletter_resubscribe(text);` y el relleno de `confirmed_at` de la Tarea 6 (con `subscribed_at`).
3. Productos: recrear `products_public_read` `for select to anon, authenticated using (badge is distinct from 'Borrador')` y crear `products_admin_read` `for select to authenticated using (<admin>)`, con `<admin>` = `exists (select 1 from public.admin_users a where a.user_id = auth.uid())`.
4. `categories` y `site_content`: borrar las políticas vivas por los nombres del Paso 1; crear `categories_public_read` / `site_content_public_read` (`for select to anon, authenticated using (true)`) y `categories_admin_all` / `site_content_admin_all` (`for all to authenticated using (<admin>) with check (<admin>)`).
5. Storage: `drop policy if exists "products_bucket_public_read" on storage.objects;` y crear `products_bucket_admin_read` (`for select to authenticated using (bucket_id = 'products' and <admin>)`). `update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/webp','image/jpeg','image/png','image/avif'] where id in ('products', 'site-content');` — con los valores del Paso 1 si difieren.
6. `revoke insert on public.newsletter_subscribers from anon; revoke usage, update on all sequences in schema public from anon; alter default privileges for role postgres in schema public revoke usage, update on sequences from anon;`
7. Un `do $$` que recorre cada tabla de `public` y cada comando `INSERT/UPDATE/DELETE` y hace `revoke <cmd> on <tabla> from authenticated` si no hay política de ese comando (o `ALL`) con `polroles` que incluya `authenticated` o `0` (`public`). Así `orders` conserva `UPDATE` y pierde `INSERT/DELETE`; `admin_users`, `rate_events`, `shipping_quotes`, `newsletter_outbox`, `newsletter_campaigns` quedan sin escritura para `authenticated`; los pedidos manuales podrán sumar su política o RPC después.
8. `revoke execute on function public.html_esc(text), public.money_mx(numeric), public.newsletter_email_json(text, uuid, text, text), public.order_staff_email(public.orders, text), public.phone_key(text) from public, anon, authenticated;`
9. Si se hizo la Tarea 12: el revoke de `place_order` a `anon` (Tarea 12 Paso 5).
10. Un `do $$` que, para cada función `prosecdef` de `public` sin `pg_temp` en `proconfig`, hace `alter function <firma> set search_path = <su search_path actual>, pg_temp` (o `public, pg_temp`).

- [ ] **Step 4: Higiene de archivos viejos** (re-correrlos no debe deshacer el cierre):
- `rls-hardening.sql`: solo los `drop policy if exists` de `orders_public_insert`, `coupons_public_read_active`, `newsletter_public_insert` (sin sus `create`); productos y bucket como los puntos 3 y 5; encabezado `-- Historico. El estado vigente lo fija security-hardening.sql: correlo despues de este archivo.`
- `newsletter-correos.sql`: sin `newsletter_resubscribe`, `newsletter_welcome_email` ni `newsletter_direct_insert`; misma nota.
- `add_updated_at.sql`, `order-confirmation.sql`: `pg_temp` en el `search_path` del propio `create`.
- `grep -rn "with check (true)" supabase/` → solo en comentarios.

- [ ] **Step 5: El controlador aplica** y corre el check → `CHECK_OK`; `get_advisors` (`security`) sin avisos nuevos.

- [ ] **Step 6: Humo en producción** de inmediato: catálogo y fichas con fotos (también una de Contenido); `WELCOME10`; suscribirse con un alias → llega la confirmación; pedido de prueba entra y se cancela; en el admin aparecen los borradores y se sube una foto. Si algo falla, la reversa es el `grant` puntual que falte, no deshacer el archivo.

- [ ] **Step 7: Commit** `fix(seguridad): cierre de politicas abiertas, boletin, borradores y Storage`.

---

### Task 16: Exigir MFA (`aal2`) en todo lo de admin (Fase D)

Cubre B-9 (servidor). **Solo con dos dispositivos dados de alta y el dueño ya entrando con código.**

**Files:**
- Create: `supabase/admin-mfa.sql`, `supabase/checks/admin-mfa.sql`
- Modify: `supabase/rls-hardening.sql` (`admin_users_self_read`), `supabase/newsletter-correos.sql`, `supabase/order-staff-notify.sql`, `supabase/order-confirmation.sql` (`if not exists (… admin_users …)` → `if not public.is_admin()`)

- [ ] **Step 1: El controlador confirma** `select a.user_id, count(f.*) from public.admin_users a left join auth.mfa_factors f on f.user_id = a.user_id and f.status = 'verified' group by 1;` → cada admin con **≥ 2** factores; y lista las funciones a cambiar: `select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef and pg_get_functiondef(p.oid) ilike '%admin_users%' and p.proname <> 'is_admin';`

- [ ] **Step 2: Check:** `is_admin()` con claims del admin y `aal1` → `false`, con `aal2` → `true`; con claims del admin y `aal1`, `set local role authenticated`: `orders` = 0 filas, `admin_users` = 0, `send_newsletter('x','x','a@b.co')` lanza `Solo los administradores…`, `security_limits` = 0 filas; con `aal2`: `admin_users` = 1. `CHECK_OK`.

- [ ] **Step 3: `supabase/admin-mfa.sql`:** `create or replace function public.is_admin()` igual que en `security-base.sql` más `and coalesce(auth.jwt()->>'aal', '') = 'aal2'` (mismo `grant` a `authenticated`); recrear `admin_users_self_read` con `using (auth.uid() = user_id and coalesce(auth.jwt()->>'aal', '') = 'aal2')` — todas las políticas de admin hacen un `exists` sobre `admin_users` que pasa por esta política, así que todas exigen `aal2` sin tocarlas. Las funciones DEFINER del Paso 1 se saltan RLS: recrearlas en sus archivos con `if not public.is_admin() then raise exception …`. Al final, comentado:
  - **Reversa** (si el admin queda fuera): `drop policy "admin_users_self_read" on public.admin_users; create policy "admin_users_self_read" on public.admin_users for select to authenticated using (auth.uid() = user_id);` — devuelve el acceso con solo contraseña; para que las funciones DEFINER dejen de pedir `aal2`, re-aplicar `is_admin()` de `security-base.sql` (solo pertenencia), lo que deja fuera solo enviar correos.
  - **Recuperación de un teléfono perdido** (la corre el controlador): `delete from auth.mfa_factors where user_id = '<uuid>' and id = '<factor>';` (o todos los del usuario); el admin entra con contraseña y da de alta un factor nuevo. También desde Supabase → Authentication → Users → el usuario.

- [ ] **Step 3b: Quitar la salida blanda del login** (Tarea 13): en `src/pages/admin/adminLogin.js`, borrar el botón `#mfa-skip` ("Entrar sin segundo paso por ahora") y su manejador; `#mfa-retry` queda solo con `Reintentar`. Con `aal2` exigido, ese camino daría "no autorizado" y cerraría la sesión. `npm test` y build.

- [ ] **Step 4: El controlador aplica** `admin-mfa.sql` y los archivos tocados, corre el check → `CHECK_OK`, y con el dueño: entra con código y ve pedidos; **la campana suena con un pedido de prueba** (realtime con token `aal2`); una sesión vieja `aal1` (otro navegador abierto desde antes) lleva al paso del código y no muestra datos; subir una foto a un producto funciona.

- [ ] **Step 5: Commit** `fix(seguridad): el admin exige segundo factor en la base`.

---

## Checklist del dueño (paneles)

- [ ] Tras el deploy de la Fase B, entrar al admin, dar de alta el segundo factor y **agregar un segundo dispositivo** (Admin → Seguridad). Guardar los secretos en lugar seguro.
- [ ] Contraseña del admin larga (16+ caracteres) y única.
- [ ] Supabase → Authentication: protección de contraseñas filtradas (si el plan lo permite) y longitud mínima 12; revisar que los Rate Limits de inicio de sesión sigan en sus valores por defecto.
- [ ] Resend → API Keys: la clave en Vault solo con "Sending access" (V-9).
- [ ] Aprobar o no el re-alojo de fotos (Tarea 11 Paso 6).
- [ ] Crear el widget de Turnstile y pasar las llaves (Tarea 12 Paso 0), o decidir no hacerlo.
- [ ] Antes de una venta grande, subir `order_global` (y si hace falta `order_ip`) en Supabase → Table Editor → `security_limits`.
- [ ] Cobrar siempre el total del panel o del correo de aviso, nunca el del mensaje de WhatsApp (I-3).
- [ ] Cupones privados con códigos difíciles de adivinar y con vencimiento o tope (I-4). La "primera compra" se evade con otro número y otro correo: es un límite de identificar por teléfono.

## Checklist del controlador (solo lectura)

- [ ] Supabase → Edge Functions → Secrets: `ENVIA_BASE_URL` apunta a producción (V-9).
- [ ] Supabase → API → Exposed schemas: solo `public` (y `graphql_public` si se usa) (V-9).
- [ ] Borrar la cuenta de admin de prueba de la Tarea 13 al terminar (`auth.users` y `admin_users`).

## Decisiones tomadas

- **Turnstile + Edge Function `place-order`** (A-1 punto 1), detrás de la aprobación del dueño; los topes por IP (con IPv6 por `/64`), por teléfono, diarios y globales valen con o sin Turnstile.
- **Topes en una tabla** (`security_limits`), no en el código: se ajustan antes de una venta sin migración.
- **Alertas por cron** (`security_watch`, cada 5 min): un `raise` deshace cualquier correo que se intente mandar dentro del pedido rechazado.
- **Doble confirmación del boletín, sin correo de bienvenida**: es lo único que evita escribir a terceros y suscribir a alguien sin permiso, y deja el uso de Resend en ~64/día en el peor caso. El editor de bienvenida del admin se quita; el código `WELCOME10` se muestra en `/confirmar`.
- **Se borra `deduct_stock_on_order`** (función y trigger).
- **`place_order` no exige cotización** en envío a domicilio (modo sin cotización cuando Envia falla). El admin no tiene topes, ni lista de métodos, ni chequeo de existencias (pedidos manuales); los borradores se rechazan para todos.
- **`coupon_first_purchase_ok` se elimina**: el aviso de "primera compra" llega al enviar el pedido.
- **Fotos ajenas:** el admin ya no acepta enlaces nuevos de otros sitios; `img-src` se cierra solo después de re-alojarlas con el OK del dueño.
- **`style-src 'unsafe-inline'` se queda; HSTS sin `preload`**, con `includeSubDomains` solo si todos los subdominios web tienen HTTPS.
- **Sesión del admin en `localStorage`** se queda; la mitigan CSP, escapado y MFA. **Admin en subdominio propio:** fuera de este plan.
- **Residuo aceptado:** los intentos rechazados no consumen cupo (Global Constraints); pestañas abiertas desde antes de la Fase C ven errores en cupones/boletín.

## Cobertura de hallazgos

| Hallazgo | Tarea(s) |
|---|---|
| A-1 | 1, 2, 4, 5, 12 |
| M-1 | 6, 15 |
| M-2 | 3, 15 |
| M-3 | 8, 15 |
| M-4 | 2, 7 |
| B-1 | 8 |
| B-2 | 4 |
| B-3 | 3, 4, 6, 15 |
| B-4 | 8 |
| B-5 | 10, 11 |
| B-6 | 9 |
| B-7 | 14 |
| B-8 | 4, 13, 15 |
| B-9 | 13, 16, checklists |
| B-10 | 2, 7 |
| I-1 | 4, 5, 6, 15 |
| I-2 | 15 |
| I-3 | Ya integrado en `main`; checklist (WhatsApp) |
| I-4 | 3, checklist |
| V-1 | 1 |
| V-2 | 15 |
| V-3 | 2 (PostgREST), 7 (Edge) |
| V-4 | 4 (Q-7), 15 |
| V-5 | Verificado: no existe; 15 deja de crearla en el repo |
| V-6 | 15 |
| V-7 | 1, 15 |
| V-8 | 6 |
| V-9 | checklists |

## Revisión final

- [ ] Revisión de toda la rama con Fable contra este plan y la auditoría antes de fusionar la Fase B, y otra vez antes de aplicar la Fase C.
