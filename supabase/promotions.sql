-- Promociones de temporada (Buen Fin, etc.): descuento automatico por fechas,
-- a toda la tienda o por categoria (products.type). No toca products.price:
-- el precio con promo lo calcula promo_info() y lo cobra place_order.
-- Espejo en JS: src/utils/promotions.js. Idempotente.

begin;

-- ── 1. Tabla y RLS ──────────────────────────────────────────────────────
create table if not exists public.promotions (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (length(btrim(name)) between 1 and 60),
  discount_pct        int  not null check (discount_pct between 1 and 90),
  categories          text[] not null default '{}',
  include_on_sale     boolean not null default false,
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  accent_color        text check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  show_countdown      boolean not null default true,
  countdown_lead_days int not null default 3 check (countdown_lead_days between 0 and 30),
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  constraint promotions_dates check (ends_at > starts_at)
);

alter table public.promotions enable row level security;

drop policy if exists promotions_admin_all on public.promotions;
create policy promotions_admin_all on public.promotions
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- La tienda solo ve lo que ya corre o lo que esta dentro de su aviso: una
-- promo programada no se puede leer por REST antes de tiempo.
drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read on public.promotions
  for select to anon, authenticated
  using (
    active
    and ends_at > now()
    and starts_at < now() + make_interval(days => greatest(countdown_lead_days, 1))
  );

commit;
