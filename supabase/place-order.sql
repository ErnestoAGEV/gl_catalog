-- place_order: el pedido se arma en la base, no en el navegador.
--
-- El cliente solo dice QUE quiere comprar (producto, talla, color, cantidad).
-- Esta funcion relee los precios de `products`, revalida el cupon contra
-- `coupons`, calcula subtotal/descuento/total, y recien ahi inserta.
-- Al final se quita la politica de insert publico: la unica puerta es esta.
--
-- Correr en el SQL Editor de Supabase ANTES de desplegar el cliente nuevo.

begin;

create or replace function public.place_order(
  p_customer_name     text,
  p_customer_whatsapp text,
  p_payment_method    text,
  p_delivery_method   text,
  p_address           text,
  p_items             jsonb,          -- [{ "productId": ..., "size": ..., "color": ..., "qty": 1 }]
  p_coupon_code       text default null
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
  v_recent     int;
  v_order      public.orders;
begin
  -- ── Contacto ──────────────────────────────────────────────────────────
  -- translate() quita < y >, igual que sanitizeText en el cliente
  v_name     := left(btrim(translate(coalesce(p_customer_name, ''), '<>', '')), 200);
  v_whatsapp := btrim(coalesce(p_customer_whatsapp, ''));
  v_address  := nullif(left(btrim(translate(coalesce(p_address, ''), '<>', '')), 500), '');

  if length(v_name) < 3 then
    raise exception 'Ingresa tu nombre completo.' using errcode = '22023';
  end if;
  if v_whatsapp !~ '^[+]?[0-9 \-().]{7,20}$' then
    raise exception 'El numero de WhatsApp no parece valido.' using errcode = '22023';
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
    customer_name, customer_whatsapp, payment_method, delivery_method,
    address, cart_items, subtotal, discount, coupon_code, total, status
  ) values (
    v_name,
    v_whatsapp,
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
revoke all on function public.place_order(text, text, text, text, text, jsonb, text) from public;
grant execute on function public.place_order(text, text, text, text, text, jsonb, text) to anon, authenticated;

-- Se cierra la puerta vieja: ya no se puede insertar un pedido a mano.
drop policy if exists "orders_public_insert" on public.orders;

commit;
