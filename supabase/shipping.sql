-- Cotizador de envios (Envia.com): ajustes, pesos por categoria, cotizaciones
-- y columnas de envio en orders.
--
-- Correr en el SQL Editor de Supabase ANTES de supabase/place-order.sql.
-- Es idempotente: se puede volver a correr entero.

begin;

-- ── 1. Ajustes (una sola fila) ──────────────────────────────────────────
-- envelope/box: { length, width, height } en cm y max_grams; los lee
-- buildPackage() en supabase/functions/_shared/shipping.js.
create table if not exists public.shipping_settings (
  id                int primary key default 1 check (id = 1),
  origin            jsonb   not null,
  envelope          jsonb   not null,
  box               jsonb   not null,
  default_grams     int     not null default 500 check (default_grams > 0),
  default_needs_box boolean not null default true,
  carriers          text[]  not null default '{}',
  free_shipping_min numeric not null default 1499
);

insert into public.shipping_settings (id, origin, envelope, box, carriers)
values (
  1,
  jsonb_build_object(
    'name', 'G&L Boutique', 'phone', '',
    'street', 'Calle Ignacio Zaragoza', 'number', '140', 'district', 'Centro',
    'city', 'Colima', 'state', 'COL', 'postalCode', '28000'
  ),
  '{"length": 35, "width": 25, "height": 5, "max_grams": 2000}',
  '{"length": 40, "width": 30, "height": 20, "max_grams": 10000}',
  -- 99minutos disponible pero apagada; nunca Castores
  array['estafeta', 'fedex', 'dhl', 'paquetexpress', 'ups', 'jtexpress']
)
on conflict (id) do nothing;

-- ── 2. Peso por categoria (products.type) ───────────────────────────────
-- Categoria sin fila: default_grams / default_needs_box de los ajustes.
create table if not exists public.shipping_category_weights (
  category  text primary key,
  grams     int not null check (grams > 0),
  needs_box boolean not null default false
);

insert into public.shipping_category_weights (category, grams, needs_box) values
  ('Playeras',       250, false),
  ('Polos',          300, false),
  ('Camisas',        350, false),
  ('Shorts',         350, false),
  ('Pantalones',     650, false),
  ('Suéteres',       600, false),
  ('Sudaderas',      700, false),
  ('Perfumes',       600, true),
  ('Perfumes Dama',  600, true),
  ('Zapatos',       1500, true),
  ('Chamarras',     1000, true),
  ('Abrigos',       1200, true)
on conflict (category) do nothing;

-- ── 3. Cotizaciones ─────────────────────────────────────────────────────
-- standard/express: { carrier, service, price, cost, days }; price ya viene
-- redondeado a multiplo de 5. place_order cobra desde aqui, no del navegador.
create table if not exists public.shipping_quotes (
  id         uuid primary key default gen_random_uuid(),
  zip        text,
  cart_key   text,
  package    jsonb,
  standard   jsonb,
  express    jsonb,
  ip_hash    text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes'
);

-- Limite por IP de la Edge Function: cuenta intentos del ultimo minuto
create index if not exists shipping_quotes_ip_created_idx
  on public.shipping_quotes (ip_hash, created_at);

-- ── 4. RLS ──────────────────────────────────────────────────────────────
alter table public.shipping_settings         enable row level security;
alter table public.shipping_category_weights enable row level security;
-- Sin politicas: solo service role (Edge Function) y place_order (security definer)
alter table public.shipping_quotes           enable row level security;

drop policy if exists shipping_settings_admin_all on public.shipping_settings;
create policy shipping_settings_admin_all on public.shipping_settings
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists shipping_category_weights_admin_all on public.shipping_category_weights;
create policy shipping_category_weights_admin_all on public.shipping_category_weights
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- ── 5. Columnas de envio en orders ──────────────────────────────────────
-- shipping_cost ya existe (place-order.sql); se repite por si este archivo corre antes.
alter table public.orders add column if not exists shipping_cost     numeric;
alter table public.orders add column if not exists shipping_tier     text;
alter table public.orders add column if not exists shipping_carrier  text;
alter table public.orders add column if not exists shipping_service  text;
alter table public.orders add column if not exists shipping_quote_id uuid;
alter table public.orders add column if not exists address_parts     jsonb;

commit;

-- Minimo de envio gratis, legible por el build del sitio (vite.config.js / prerender)
create or replace function public.free_shipping_min()
returns numeric language sql stable security definer set search_path = public, pg_temp as $$
  select free_shipping_min from public.shipping_settings where id = 1
$$;
revoke all on function public.free_shipping_min() from public;
grant execute on function public.free_shipping_min() to anon, authenticated;

-- Al cambiar el minimo, se republica la tienda (usa trigger_rebuild de deploy-hook.sql)
drop trigger if exists shipping_settings_rebuild on public.shipping_settings;
create trigger shipping_settings_rebuild after update of free_shipping_min on public.shipping_settings
  for each row when (old.free_shipping_min is distinct from new.free_shipping_min)
  execute function public.trigger_rebuild();

-- Los ajustes de envio los escriben admins (authenticated) y el service role; anon solo lee.
revoke insert, update, delete, truncate on public.shipping_settings, public.shipping_category_weights, public.shipping_quotes from anon;
