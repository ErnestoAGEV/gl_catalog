-- Guias de tallas por marca + tipo de prenda + corte (2026-11-03).
-- Lectura publica; escribir solo admin. Ninguna politica de escritura con
-- true: las politicas se suman con OR (ver drop-legacy-policies.sql).

create table if not exists public.size_guides (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  type text not null,
  cut text not null default '',
  columns jsonb not null default '[]'::jsonb,
  rows jsonb not null default '[]'::jsonb,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists size_guides_brand_type_cut_key
  on public.size_guides (lower(brand), type, lower(cut));

drop trigger if exists size_guides_set_updated_at on public.size_guides;
create trigger size_guides_set_updated_at
  before update on public.size_guides
  for each row execute function public.set_updated_at();

alter table public.size_guides enable row level security;

drop policy if exists size_guides_public_read on public.size_guides;
create policy size_guides_public_read on public.size_guides
  for select to anon, authenticated using (true);

drop policy if exists size_guides_admin_insert on public.size_guides;
create policy size_guides_admin_insert on public.size_guides
  for insert to authenticated
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists size_guides_admin_update on public.size_guides;
create policy size_guides_admin_update on public.size_guides
  for update to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists size_guides_admin_delete on public.size_guides;
create policy size_guides_admin_delete on public.size_guides
  for delete to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Guia inicial: la foto "guia-de-tallas-white-peack.jpeg" de los 10 polos.
-- CH -> S y G -> L para que coincida con los botones de talla.
insert into public.size_guides (brand, type, cut, columns, rows, note) values (
  'White Peak', 'Polos', '',
  '["Largo","Ancho"]'::jsonb,
  '[{"size":"S","values":["67","50"]},{"size":"M","values":["68","55"]},{"size":"L","values":["72","58"]},{"size":"XL","values":["75","60"]},{"size":"XXL","values":["77","64"]},{"size":"XXXL","values":["80","65"]},{"size":"XXXXL","values":["82","67"]}]'::jsonb,
  null -- la ficha ya dice "Medidas en centímetros."
) on conflict do nothing;
