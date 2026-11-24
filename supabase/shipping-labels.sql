-- Guias de Envia desde el admin: columnas de guia en orders y formato de
-- impresion en shipping_settings.
--
-- Correr después de `shipping.sql`. Idempotente. Solo agrega columnas nulas:
-- el sitio actual no cambia.
--
-- Sin politicas ni triggers nuevos: orders ya es lectura/edicion solo admin
-- (rls-hardening.sql) y la Edge Function shipping-label escribe con service role.

begin;

-- ── 1. Guia en orders ──────────────────────────────────────────────────
-- label_status: generating = candado tomado; generated = guia guardada;
-- review = Envia respondio pero no se pudo guardar (revisar a mano).
alter table public.orders
  add column if not exists label_status     text,
  add column if not exists label_locked_at  timestamptz,
  add column if not exists label_tracking   text,
  add column if not exists label_track_url  text,
  add column if not exists label_url        text,
  add column if not exists label_carrier    text,
  add column if not exists label_service    text,
  add column if not exists label_cost       numeric,
  add column if not exists label_created_at timestamptz,
  add column if not exists label_sandbox    boolean not null default false;

alter table public.orders drop constraint if exists orders_label_status_check;
alter table public.orders add constraint orders_label_status_check
  check (label_status in ('generating', 'generated', 'review'));

-- ── 2. Tamano de impresion ─────────────────────────────────────────────
alter table public.shipping_settings
  add column if not exists label_print_size text not null default 'PAPER_LETTER'
    check (label_print_size in ('PAPER_LETTER', 'PAPER_4X6'));

commit;
