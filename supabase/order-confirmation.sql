-- Correo de confirmación de pedido: cuando el admin marca un pedido como
-- Completado, el cliente recibe el resumen en su correo (solo pedidos con
-- correo, que se pide en envío a domicilio).
--
-- El admin arma el HTML (src/pages/admin/orderEmail.js) y llama a
-- send_order_confirmation(); aquí se revisa que sea admin, que el pedido esté
-- completado, tenga correo y no se haya mandado ya, y se envía por Resend con
-- resend_post() de newsletter-correos.sql (correr ese antes).
--
-- Idempotente: se puede volver a correr entero.

begin;

alter table public.orders add column if not exists confirmation_sent_at timestamptz;
alter table public.orders add column if not exists confirmation_request_id bigint;

-- Devuelve: 'sent', 'no_email', 'not_completed', 'already_sent' o 'no_key'.
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

-- "Enviado" en el admin quiere decir que se le entregó a Resend; si Resend lo
-- rechaza (correo inválido), se ve abajo. Para volver a mandarlo: corre esto y
-- cambia el pedido a Pendiente y otra vez a Completado.
-- update public.orders set confirmation_sent_at = null where id::text like 'a1b2c3d4%';
--
-- Comprobación: respuesta de Resend del último correo (200 = enviado)
-- select o.id, o.customer_email, o.confirmation_sent_at, r.status_code, r.content
--   from public.orders o left join net._http_response r on r.id = o.confirmation_request_id
--  where o.confirmation_sent_at is not null order by o.confirmation_sent_at desc limit 5;
