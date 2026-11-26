-- Pedidos manuales: ventas cerradas por WhatsApp que el admin captura en
-- Admin -> Pedidos -> Nuevo pedido. Mismo precio, estados y cliente que un
-- pedido web, con etiqueta "WhatsApp" y sin correos (ni al equipo ni al cliente).
--
-- Correr despues de place-order.sql, order-staff-notify.sql y
-- order-confirmation.sql. Idempotente: se puede volver a correr entero.

begin;

-- Canal del pedido. El default lee un ajuste local a la transaccion que solo
-- admin_place_order pone; cualquier otro insert queda como 'web'.
alter table public.orders
  add column if not exists channel text not null
  default coalesce(nullif(current_setting('gl.order_channel', true), ''), 'web');

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_channel_check' and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_channel_check check (channel in ('web', 'whatsapp'));
  end if;
end $$;

-- Pedido manual: solo admin. Reusa place_order (mismos precios, cupones y
-- validaciones) y despues ajusta envio y estado.
create or replace function public.admin_place_order(
  p_customer_name     text,
  p_customer_whatsapp text,
  p_payment_method    text,
  p_delivery_method   text,
  p_address           text,
  p_items             jsonb,
  p_coupon_code       text    default null,
  p_customer_email    text    default null,
  p_shipping_quote_id uuid    default null,
  p_shipping_tier     text    default null,
  p_address_parts     jsonb   default null,
  p_shipping_cost     numeric default null,
  p_local             boolean default false,
  p_status            text    default null
)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v public.orders;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores pueden crear pedidos manuales.' using errcode = '42501';
  end if;
  if p_shipping_cost is not null and p_shipping_cost not between 0 and 10000 then
    raise exception 'Costo de envío inválido.' using errcode = '22023';
  end if;
  if p_status is not null and p_status not in ('pendientedepago', 'completado', 'cancelado') then
    raise exception 'Estado inválido.' using errcode = '22023';
  end if;

  perform set_config('gl.order_channel', 'whatsapp', true);
  v := public.place_order(
    p_customer_name => p_customer_name, p_customer_whatsapp => p_customer_whatsapp,
    p_payment_method => p_payment_method, p_delivery_method => p_delivery_method,
    p_address => p_address, p_items => p_items, p_coupon_code => p_coupon_code,
    p_customer_email => p_customer_email, p_expected_total => null,
    p_shipping_quote_id => p_shipping_quote_id, p_shipping_tier => p_shipping_tier,
    p_address_parts => p_address_parts
  );
  perform set_config('gl.order_channel', '', true);

  update public.orders set
    shipping_cost = case when delivery_method = 'Envío a domicilio'
                         then coalesce(p_shipping_cost, shipping_cost) else shipping_cost end,
    shipping_tier = case when p_local and delivery_method = 'Envío a domicilio' and p_shipping_cost is not null
                         then 'standard' else shipping_tier end,
    shipping_carrier = case when p_local and delivery_method = 'Envío a domicilio' and p_shipping_cost is not null
                         then 'local' else shipping_carrier end,
    shipping_service = case when p_local and delivery_method = 'Envío a domicilio' and p_shipping_cost is not null
                         then 'Entrega local' else shipping_service end,
    status = coalesce(p_status, status)
  where id = v.id
  returning * into v;

  return v;
end;
$$;

revoke all on function public.admin_place_order(text, text, text, text, text, jsonb, text, text, uuid, text, jsonb, numeric, boolean, text) from public, anon;
grant execute on function public.admin_place_order(text, text, text, text, text, jsonb, text, text, uuid, text, jsonb, numeric, boolean, text) to authenticated;

-- Aviso al equipo: los pedidos de WhatsApp no mandan correo (nuevo ni cancelado).
create or replace function public.notify_staff_on_order()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault, pg_temp
as $$
begin
  -- Pedidos de WhatsApp (admin_place_order): sin correo. to_jsonb no falla si la columna aun no existe.
  if to_jsonb(new)->>'channel' = 'whatsapp' then return null; end if;
  if tg_op = 'INSERT' then
    -- Tope diario (security_limits.staff_mail) para no agotar la cuota de Resend.
    -- Al llegar al tope se avisa una vez y los siguientes no mandan correo.
    -- Las cancelaciones no cuentan. Si el tope falla, se manda (el pedido no se bloquea).
    begin
      if public.rate_check('staff_mail', '*') then
        perform public.send_order_staff_email(new.id, 'nuevo');
      else
        perform public.send_staff_alert('staff_mail');
      end if;
    exception when others then
      raise warning 'notify_staff_on_order: %', sqlerrm;
      perform public.send_order_staff_email(new.id, 'nuevo');
    end;
  elsif new.status = 'cancelado' and coalesce(old.status, '') <> 'cancelado' then
    perform public.send_order_staff_email(new.id, 'cancelado');
  end if;
  return null;
end;
$$;
revoke all on function public.notify_staff_on_order() from public, anon, authenticated;

-- Confirmacion al cliente: devuelve 'manual' y no manda nada en pedidos de WhatsApp.
create or replace function public.send_order_confirmation(p_order_id text, p_subject text, p_html text)
returns text
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_order public.orders%rowtype;
  v_rid   bigint;
begin
  if not exists (select 1 from public.admin_users a where a.user_id = auth.uid()) then
    raise exception 'Solo los administradores pueden enviar correos';
  end if;
  if coalesce(btrim(p_subject), '') = '' or coalesce(btrim(p_html), '') = '' then
    raise exception 'Falta el asunto o el contenido del correo';
  end if;

  -- for update: dos clics seguidos no mandan dos correos
  select * into v_order from public.orders where id::text = p_order_id for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if coalesce(v_order.customer_email, '') = '' then return 'no_email'; end if;
  if coalesce(v_order.status, '') <> 'completado' then return 'not_completed'; end if;
  if v_order.confirmation_sent_at is not null then return 'already_sent'; end if;
  -- Pedido de WhatsApp: el cliente ya habla con el equipo, no se le manda correo.
  if v_order.channel = 'whatsapp' then return 'manual'; end if;

  v_rid := public.resend_post('emails', jsonb_build_object(
    'from', 'G&L Boutique <hola@glboutique.com.mx>',
    'reply_to', 'glboutiquecolima@gmail.com',
    'to', jsonb_build_array(v_order.customer_email),
    'subject', left(p_subject, 200),
    'html', p_html
  ));
  if v_rid is null then return 'no_key'; end if;

  update public.orders
     set confirmation_sent_at = now(), confirmation_request_id = v_rid
   where id = v_order.id;
  return 'sent';
end;
$$;
revoke all on function public.send_order_confirmation(text, text, text) from public, anon;
grant execute on function public.send_order_confirmation(text, text, text) to authenticated;

commit;
