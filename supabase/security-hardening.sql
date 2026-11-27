-- Se corre siempre al final, después de cualquier otro archivo de supabase/.
--
-- Fase C del plan de seguridad (docs/superpowers/plans/2026-11-24-seguridad.md,
-- Tarea 15): cierra las puertas viejas que el sitio en caché usaba (alta
-- directa al boletín, lectura de cupones, insert directo de pedidos), oculta
-- los borradores a los visitantes, cierra la lectura/listado del bucket
-- products y quita a authenticated toda escritura sin política que la use.
--
-- Idempotente. Va en una sola transacción (apply_migration ya la abre: sin
-- begin/commit). Políticas primero, revokes después, para que el ciclo del
-- paso 7 vea las políticas definitivas.
-- Comprobación: supabase/checks/security-hardening.sql (termina en CHECK_OK).
-- Si algo falla en producción, la reversa es el grant puntual que falte, no
-- deshacer este archivo.

-- 1. Puertas viejas
drop policy if exists "newsletter_public_insert" on public.newsletter_subscribers;
drop policy if exists "coupons_public_read_active" on public.coupons;
drop policy if exists "orders_public_insert" on public.orders;

-- 2. Boletín: solo por newsletter_subscribe / newsletter_confirm. La RPC no
--    depende de estos triggers: inserta confirm_token, confirm_sent_at y source
--    ella misma, y confirmed_at/unsubscribed_at nacen null por defecto.
drop trigger if exists newsletter_welcome_email on public.newsletter_subscribers;
drop trigger if exists newsletter_direct_insert on public.newsletter_subscribers;
drop function if exists public.send_welcome_email();
drop function if exists public.newsletter_direct_insert();
drop function if exists public.newsletter_resubscribe(text);
-- Relleno de la Tarea 6: los de antes de la doble confirmación cuentan como confirmados
update public.newsletter_subscribers
set confirmed_at = coalesce(subscribed_at, now())
where confirmed_at is null and confirm_token is null;

-- 3. Productos: los borradores solo los ve el admin
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (badge is distinct from 'Borrador');

drop policy if exists "products_admin_read" on public.products;
create policy "products_admin_read"
  on public.products
  for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- 4. categories y site_content: lectura pública, escritura solo admin
--    (las vivas eran "to public": cualquier rol, también anon)
drop policy if exists "categories_select_public" on public.categories;
drop policy if exists "categories_insert_admin" on public.categories;
drop policy if exists "categories_update_admin" on public.categories;
drop policy if exists "categories_delete_admin" on public.categories;
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories
  for select
  to anon, authenticated
  using (true);
drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
  on public.categories
  for all
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Public read" on public.site_content;
drop policy if exists "Admin full access" on public.site_content;
drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read"
  on public.site_content
  for select
  to anon, authenticated
  using (true);
drop policy if exists "site_content_admin_all" on public.site_content;
create policy "site_content_admin_all"
  on public.site_content
  for all
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- 5. Storage. Los buckets son públicos: las fotos se sirven por
--    /object/public sin RLS. La política de select solo abría el listado.
--    El admin sube con upsert:false (solo necesita insert); site-content no
--    tiene select/update/delete porque el admin nunca los usa ahí.
drop policy if exists "products_bucket_public_read" on storage.objects;
drop policy if exists "products_bucket_admin_read" on storage.objects;
create policy "products_bucket_admin_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'products'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );
-- 5 MB = el tope del admin (adminProducts.js). image/gif va porque el admin
-- de productos lo acepta y no lo convierte (resizeImage.js lo deja pasar).
-- Paso 1: lo más grande que hay es un JPEG de 958 KB; no hay otros tipos.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'image/gif']
where id in ('products', 'site-content');

-- 6. anon: ninguna escritura directa (ahora sin excepción) ni secuencias
revoke insert on public.newsletter_subscribers from anon;
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
revoke usage, update on all sequences in schema public from anon;
alter default privileges for role postgres in schema public revoke usage, update on sequences from anon;
revoke truncate on all tables in schema public from authenticated;

-- 7. authenticated conserva insert/update/delete solo donde una política de ese
--    comando (o ALL) para authenticated o public lo usa. Así orders pierde
--    INSERT/DELETE (el admin crea pedidos con admin_place_order, SECURITY
--    DEFINER) y conserva UPDATE; las tablas sin políticas (rate_events,
--    shipping_quotes, newsletter_outbox, newsletter_campaigns, admin_users...)
--    quedan sin escritura. Una tabla nueva que necesite escritura del admin
--    suma su política y su grant después.
do $$
declare
  t record;
  c text;
begin
  for t in
    select cl.oid, cl.oid::regclass as rel
    from pg_class cl
    where cl.relnamespace = 'public'::regnamespace and cl.relkind in ('r', 'p')
  loop
    foreach c in array array['INSERT', 'UPDATE', 'DELETE'] loop
      if not exists (
        select 1 from pg_policy p
        where p.polrelid = t.oid
          and p.polcmd::text in (case c when 'INSERT' then 'a' when 'UPDATE' then 'w' else 'd' end, '*')
          and p.polroles && array['authenticated'::regrole::oid, 0::oid]
      ) then
        execute format('revoke %s on %s from authenticated', c, t.rel);
      end if;
    end loop;
  end loop;
end;
$$;

-- 8. Ayudantes internos: solo los usan funciones SECURITY DEFINER
revoke execute on function
  public.html_esc(text),
  public.money_mx(numeric),
  public.newsletter_email_json(text, uuid, text, text),
  public.order_staff_email(public.orders, text),
  public.phone_key(text)
from public, anon, authenticated;

-- 9. place_order: la Tarea 12 (Turnstile) no se hizo; anon la sigue ejecutando.

-- 10. Toda función SECURITY DEFINER de public con pg_temp al final del
--     search_path (sin él, un objeto temporal podría tapar uno de public).
do $$
declare
  f record;
  sp text;
begin
  for f in
    select p.oid::regprocedure as sig, p.proconfig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prosecdef
      and not exists (select 1 from pg_depend d
                      where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
  loop
    sp := (select substr(x, 13) from unnest(f.proconfig) x where x like 'search_path=%' limit 1);
    if coalesce(btrim(sp, '" '), '') = '' then
      execute format('alter routine %s set search_path = public, pg_temp', f.sig);
    elsif position('pg_temp' in sp) = 0 then
      execute format('alter routine %s set search_path = %s, pg_temp', f.sig, sp);
    end if;
  end loop;
end;
$$;
