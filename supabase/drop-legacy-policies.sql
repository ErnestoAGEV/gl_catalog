-- Quita las politicas viejas (de la demo) que dejaban escribir a cualquiera.
-- Las politicas de Postgres se suman con OR: mientras una diga "true", las
-- de admin_users no protegen nada. Aplicada el 2026-11-03.

begin;

-- PRODUCTOS: anon podia editar/borrar todo el catalogo
drop policy if exists "Enable all access for demo" on public.products;
drop policy if exists "Permitir modificación completa a usuarios autenticados" on public.products;
drop policy if exists "Enable read access for all users" on public.products;      -- duplicada de products_public_read
drop policy if exists "Permitir lectura pública de productos" on public.products; -- duplicada

-- PEDIDOS: cualquier cuenta registrada leia/editaba/borraba pedidos (datos de clientes),
-- y anon insertaba pedidos con el total que quisiera (y el trigger descontaba stock).
-- Los pedidos entran solo por place_order (security definer).
drop policy if exists "Solo admins pueden ver órdenes" on public.orders;
drop policy if exists "Solo admins pueden actualizar órdenes" on public.orders;
drop policy if exists "Solo admins pueden borrar órdenes" on public.orders;
drop policy if exists "Permitir insertar órdenes anónimas" on public.orders;

-- CUPONES: cualquier cuenta registrada los editaba; anon veia los inactivos
drop policy if exists "Solo admins modifican cupones" on public.coupons;
drop policy if exists "Cualquiera puede ver cupones" on public.coupons;

-- BOLETIN: duplicada de newsletter_public_insert
drop policy if exists "Allow anonymous insert" on public.newsletter_subscribers;

-- FOTOS: anon subia y borraba archivos del bucket products
drop policy if exists "Public Access to Delete" on storage.objects;
drop policy if exists "Public Access to Upload" on storage.objects;
drop policy if exists "Public Access to Read Images" on storage.objects; -- duplicada de products_bucket_public_read

-- Funciones de trigger: nadie las llama por /rpc (los triggers siguen disparando)
revoke execute on function public.deduct_stock_on_order() from public, anon, authenticated;
revoke execute on function public.send_welcome_email() from public, anon, authenticated;
revoke execute on function public.trigger_rebuild() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

alter function public.deduct_stock_on_order() set search_path = public, pg_temp;
alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.phone_key(text) set search_path = public, pg_temp;
alter function public.newsletter_email_json(text, uuid, text, text) set search_path = public, pg_temp;

commit;
