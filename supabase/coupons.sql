-- Cupones por RPC (Tarea 3, Fase A): vigencia, tope de usos y validacion con
-- tope por IP. El sitio deja de leer la tabla coupons y llama validate_coupon;
-- la politica coupons_public_read_active se borra en la Fase C, cuando el
-- cliente nuevo ya este desplegado.
--
-- Requiere supabase/security-base.sql (rate_check, request_ip, fila coupon_ip).
-- Desde la Fase 0 las funciones nuevas nacen sin EXECUTE: cada grant es explicito.
--
-- Aplicar con apply_migration (ya corre en una transaccion). Idempotente.
-- Check: supabase/checks/coupons.sql.

alter table public.coupons add column if not exists first_purchase_only boolean not null default false;
alter table public.coupons add column if not exists expires_at timestamptz;
alter table public.coupons add column if not exists max_uses int;

alter table public.coupons drop constraint if exists coupons_max_uses_check;
alter table public.coupons add constraint coupons_max_uses_check check (max_uses is null or max_uses > 0);

-- Un cupon se puede usar: activo, sin vencer y con usos libres (los pedidos
-- cancelados no cuentan). Task 4 lo usa tambien en place_order.
create or replace function public.coupon_open(c public.coupons)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select c.active
     and (c.expires_at is null or c.expires_at > now())
     and (c.max_uses is null
          or (select count(*) from public.orders o
               where o.coupon_code = c.code
                 and coalesce(o.status, '') <> 'cancelado') < c.max_uses)
$$;
-- Sin grant: PostgREST la expondria como columna calculada de coupons
revoke all on function public.coupon_open(public.coupons) from public, anon, authenticated;

-- Volatil (rate_check inserta): PostgREST solo la acepta por POST. Un codigo
-- malo devuelve vacio, no error, para que el intento quede contado.
create or replace function public.validate_coupon(p_code text)
returns table (code text, discount numeric, free_shipping boolean, label text,
               categories jsonb, first_purchase_only boolean)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.rate_check('coupon_ip', public.request_ip()) then
    raise exception 'Demasiados intentos. Espera unos minutos.' using errcode = '22023', hint = 'rate';
  end if;

  -- Misma normalizacion que place_order
  return query
    select c.code, c.discount, c.free_shipping, c.label,
           coalesce(to_jsonb(c.categories), '[]'::jsonb), c.first_purchase_only
      from public.coupons c
     where c.code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
       and public.coupon_open(c);
end;
$$;
revoke all on function public.validate_coupon(text) from public;
grant execute on function public.validate_coupon(text) to anon, authenticated;
