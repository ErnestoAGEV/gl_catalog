-- place_order: el pedido se arma en la base, no en el navegador.
--
-- El cliente solo dice QUE quiere comprar (producto, talla, color, cantidad).
-- Esta funcion relee los precios de `products`, revalida el cupon contra
-- `coupons`, calcula subtotal/descuento/total, y recien ahi inserta.
-- Al final se quita la politica de insert publico: la unica puerta es esta.
--
-- Correr en el SQL Editor de Supabase ANTES de desplegar el cliente nuevo.
-- Es idempotente: se puede volver a correr entero cada vez que cambie.

begin;

-- ── Cupones de primera compra (WELCOME10) ───────────────────────────────
-- Un numero de WhatsApp solo puede usarlos en un pedido no cancelado.
alter table public.coupons add column if not exists first_purchase_only boolean not null default false;
update public.coupons set first_purchase_only = true where code = 'WELCOME10';

-- Correo del cliente (se pide en envio a domicilio) y costo de envio que el
-- admin captura despues en el pedido. El total sigue siendo solo productos.
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists shipping_cost numeric;

-- La firma cambio (p_customer_email): la vieja se borra para que no queden
-- dos versiones y PostgREST no sepa cual llamar.
drop function if exists public.place_order(text, text, text, text, text, jsonb, text);
drop function if exists public.coupon_first_purchase_ok(text, text);

-- Clave para comparar telefonos: solo digitos, sin el 00 internacional, y los
-- de Mexico sin 52 / 521 / 044 / 045, para que "+52 1 312...", "00 52 312...",
-- "044 312..." y "312..." cuenten como el mismo numero.
-- Misma regla que phoneKey() en src/utils/phone.js.
create or replace function public.phone_key(p text)
returns text
language sql
immutable
as $fn$
  select case
    when d ~ '^04[45][0-9]{10}$' then right(d, 10)
    when d ~ '^521[0-9]{10}$'    then right(d, 10)
    when d ~ '^52[0-9]{10}$'     then right(d, 10)
    else d
  end
  from (select regexp_replace(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g'), '^00', '') as d) t
$fn$;

create or replace function public.place_order(
  p_customer_name     text,
  p_customer_whatsapp text,
  p_payment_method    text,
  p_delivery_method   text,
  p_address           text,
  p_items             jsonb,          -- [{ "productId": ..., "size": ..., "color": ..., "qty": 1 }]
  p_coupon_code       text default null,
  p_customer_email    text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item       jsonb;
  v_product    public.products%rowtype;
  v_coupon     public.coupons%rowtype;
  v_cats       jsonb   := '[]'::jsonb;
  v_lines      jsonb   := '[]'::jsonb;
  v_qty        int;
  v_unlimited  boolean;
  v_subtotal   numeric := 0;
  v_applicable numeric := 0;   -- subtotal solo de las categorias del cupon
  v_discount   numeric := 0;
  v_total      numeric := 0;
  v_name       text;
  v_whatsapp   text;
  v_address    text;
  v_email      text;
  v_recent     int;
  v_order      public.orders;
begin
  -- ── Contacto ──────────────────────────────────────────────────────────
  -- translate() quita < y >, igual que sanitizeText en el cliente
  v_name     := left(btrim(translate(coalesce(p_customer_name, ''), '<>', '')), 200);
  v_whatsapp := btrim(coalesce(p_customer_whatsapp, ''));
  v_address  := nullif(left(btrim(translate(coalesce(p_address, ''), '<>', '')), 500), '');
  v_email    := nullif(lower(btrim(coalesce(p_customer_email, ''))), '');

  if length(v_name) < 3 then
    raise exception 'Ingresa tu nombre completo.' using errcode = '22023';
  end if;
  -- Mexico a 10 digitos o cualquier pais con lada (Estados Unidos, Guatemala...)
  if v_whatsapp !~ '^[+]?[0-9 \-().]+$'
     or length(regexp_replace(v_whatsapp, '[^0-9]', '', 'g')) not between 8 and 15 then
    raise exception 'El numero de WhatsApp no parece valido.' using errcode = '22023';
  end if;
  -- Opcional en la base (sitios viejos en cache no lo mandan); el checkout lo
  -- exige en envio a domicilio. Misma regla que EMAIL_RE en sanitize.js.
  if v_email is not null and (length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then
    raise exception 'El correo no parece valido.' using errcode = '22023';
  end if;

  -- ── Limite anti-inundacion: 5 pedidos por numero cada 10 minutos ──────
  select count(*) into v_recent
    from public.orders
   where customer_whatsapp = v_whatsapp
     and created_at > now() - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'Demasiados pedidos seguidos. Espera unos minutos.' using errcode = '22023';
  end if;

  -- ── Carrito ───────────────────────────────────────────────────────────
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Tu carrito esta vacio.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Demasiados articulos en el pedido.' using errcode = '22023';
  end if;

  -- El cupon se busca antes del bucle: hace falta para saber que lineas suman
  -- al descuento cuando aplica solo a ciertas categorias.
  if coalesce(btrim(p_coupon_code), '') <> '' then
    select * into v_coupon
      from public.coupons
     where code = upper(regexp_replace(p_coupon_code, '[^A-Za-z0-9]', '', 'g'))
       and active = true;
    if found then
      -- Dos pedidos simultaneos del mismo numero se forman en fila: sin esto
      -- los dos pasarian la revision antes de que cualquiera inserte
      if v_coupon.first_purchase_only then
        perform pg_advisory_xact_lock(hashtext('first_purchase:' || public.phone_key(v_whatsapp)));
        if v_email is not null then
          perform pg_advisory_xact_lock(hashtext('first_purchase_email:' || v_email));
        end if;
      end if;
      -- Cuenta el mismo WhatsApp o el mismo correo: cambiar de numero no basta
      if v_coupon.first_purchase_only and exists (
        select 1 from public.orders o
         where o.coupon_code = v_coupon.code
           and coalesce(o.status, '') <> 'cancelado'
           and (public.phone_key(o.customer_whatsapp) = public.phone_key(v_whatsapp)
                or (v_email is not null and o.customer_email = v_email))
      ) then
        -- El sitio reconoce "primera compra" en el mensaje y quita el cupon solo
        raise exception '% es solo para la primera compra y este WhatsApp o correo ya lo uso.', v_coupon.code
          using errcode = '22023';
      end if;
      -- categories puede ser text[] o jsonb segun como se creo la tabla;
      -- to_jsonb() normaliza los dos casos.
      v_cats := coalesce(to_jsonb(v_coupon.categories), '[]'::jsonb);
      if jsonb_typeof(v_cats) <> 'array' then
        v_cats := '[]'::jsonb;
      end if;
    end if;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce(nullif(v_item->>'qty', '')::int, 0);
    if v_qty < 1 or v_qty > 50 then
      raise exception 'Cantidad invalida en el pedido.' using errcode = '22023';
    end if;

    -- id::text compara igual si la columna es uuid o entero
    select * into v_product
      from public.products
     where id::text = v_item->>'productId';
    if not found then
      raise exception 'Uno de los productos ya no esta disponible.' using errcode = '22023';
    end if;

    v_unlimited := v_product.stock is null or btrim(v_product.stock::text) in ('', E'\u221E');

    v_subtotal := v_subtotal + v_product.price * v_qty;
    if v_cats ? v_product.type then
      v_applicable := v_applicable + v_product.price * v_qty;
    end if;

    -- Misma forma que armaba el navegador, incluido productId nulo cuando el
    -- stock es infinito: el trigger de stock depende de eso para no descontar.
    v_lines := v_lines || jsonb_build_object(
      'productId',       case when v_unlimited then null else v_product.id end,
      'stock_unlimited', v_unlimited,
      'name',            v_product.name,
      'type',            v_product.type,
      'size',            left(coalesce(v_item->>'size', ''), 40),
      'color',           left(coalesce(v_item->>'color', ''), 40),
      'qty',             v_qty,
      'price',           v_product.price,
      'subtotal',        round(v_product.price * v_qty, 2)
    );
  end loop;

  -- ── Descuento ─────────────────────────────────────────────────────────
  if v_coupon.code is not null then
    if jsonb_array_length(v_cats) = 0 then
      v_discount := v_subtotal * coalesce(v_coupon.discount, 0);
    else
      v_discount := v_applicable * coalesce(v_coupon.discount, 0);
    end if;
  end if;
  v_discount := least(greatest(round(v_discount, 2), 0), round(v_subtotal, 2));
  v_total    := round(v_subtotal, 2) - v_discount;

  insert into public.orders (
    customer_name, customer_whatsapp, customer_email, payment_method, delivery_method,
    address, cart_items, subtotal, discount, coupon_code, total, status
  ) values (
    v_name,
    v_whatsapp,
    v_email,
    left(coalesce(p_payment_method, ''), 80),
    left(coalesce(p_delivery_method, ''), 80),
    v_address,
    v_lines,
    round(v_subtotal, 2),
    v_discount,
    case when v_discount > 0 then v_coupon.code else null end,
    v_total,
    'pendientedepago'
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- Solo se ejecuta desde el sitio; nadie mas hereda el permiso.
revoke all on function public.place_order(text, text, text, text, text, jsonb, text, text) from public;
grant execute on function public.place_order(text, text, text, text, text, jsonb, text, text) to anon, authenticated;

-- Aviso temprano para el checkout: ¿este WhatsApp o correo todavia puede usar
-- el cupon? Solo devuelve si/no; no expone pedidos ni datos del cliente.
create or replace function public.coupon_first_purchase_ok(p_code text, p_whatsapp text, p_email text default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select not exists (
    select 1
      from public.coupons c
      join public.orders o on o.coupon_code = c.code
     where c.code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
       and c.first_purchase_only
       and coalesce(o.status, '') <> 'cancelado'
       and (
         (public.phone_key(o.customer_whatsapp) = public.phone_key(p_whatsapp)
          and length(public.phone_key(p_whatsapp)) >= 8)
         or (nullif(btrim(p_email), '') is not null and o.customer_email = lower(btrim(p_email)))
       )
  )
$fn$;

revoke all on function public.coupon_first_purchase_ok(text, text, text) from public;
grant execute on function public.coupon_first_purchase_ok(text, text, text) to anon, authenticated;

-- Se cierra la puerta vieja: ya no se puede insertar un pedido a mano.
drop policy if exists "orders_public_insert" on public.orders;

commit;
