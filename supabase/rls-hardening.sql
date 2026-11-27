-- Historico. El estado vigente lo fija security-hardening.sql: correlo despues de este archivo.
-- RLS hardening for G&L
-- Run this in Supabase SQL Editor with a privileged role.

begin;

-- Admin registry tied to auth.users
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table if exists public.admin_users enable row level security;

drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read"
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() = user_id);

-- PRODUCTS
alter table if exists public.products enable row level security;

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

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
  on public.products
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
  on public.products
  for update
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
  on public.products
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- ORDERS
alter table if exists public.orders enable row level security;

drop policy if exists "orders_public_insert" on public.orders;

drop policy if exists "orders_admin_read" on public.orders;
create policy "orders_admin_read"
  on public.orders
  for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
  on public.orders
  for update
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- COUPONS
alter table if exists public.coupons enable row level security;

drop policy if exists "coupons_public_read_active" on public.coupons;

drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all"
  on public.coupons
  for all
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- NEWSLETTER
alter table if exists public.newsletter_subscribers enable row level security;

drop policy if exists "newsletter_public_insert" on public.newsletter_subscribers;

drop policy if exists "newsletter_admin_read" on public.newsletter_subscribers;
create policy "newsletter_admin_read"
  on public.newsletter_subscribers
  for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- STORAGE: bucket products (admin write; el bucket es publico, las fotos se
-- sirven por /object/public sin politica; el listado solo para admins)
-- Requires bucket named exactly: products

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

drop policy if exists "products_bucket_admin_insert" on storage.objects;
create policy "products_bucket_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'products'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );

drop policy if exists "products_bucket_admin_update" on storage.objects;
create policy "products_bucket_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'products'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  )
  with check (
    bucket_id = 'products'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );

drop policy if exists "products_bucket_admin_delete" on storage.objects;
create policy "products_bucket_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'products'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );

commit;
