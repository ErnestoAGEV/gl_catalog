-- Aviso de pedido para el equipo: cuando entra un pedido (o se cancela), los
-- correos de order_notify_emails reciben la hoja para despacharlo.
--
-- Sale de la base (trigger en orders), no del navegador: cuando entra un
-- pedido nadie tiene el admin abierto. Usa resend_post() de
-- newsletter-correos.sql (correr ese antes). Si el correo falla, el pedido se
-- guarda igual.
--
-- Idempotente: se puede volver a correr entero.

begin;

-- ── Lista de correos (se edita en Admin → Pedidos) ──────────────────────
create table if not exists public.order_notify_emails (
  email      text primary key check (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  created_at timestamptz not null default now()
);

alter table public.order_notify_emails enable row level security;

drop policy if exists "order_notify_emails_admin_all" on public.order_notify_emails;
create policy "order_notify_emails_admin_all"
  on public.order_notify_emails
  for all
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- ── HTML ────────────────────────────────────────────────────────────────
create or replace function public.html_esc(p text)
returns text
language sql
immutable
as $fn$
  select replace(replace(replace(replace(replace(coalesce(p, ''),
    '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;')
$fn$;

create or replace function public.money_mx(p numeric)
returns text
language sql
immutable
as $fn$
  select '$' || btrim(to_char(coalesce(p, 0), 'FM999,999,990.00'))
$fn$;

-- p_kind: 'nuevo' o 'cancelado'. Devuelve { subject, html }.
create or replace function public.order_staff_email(o public.orders, p_kind text)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_short  text := upper(left(o.id::text, 8));
  v_pieces int;
  v_rows   text := '';
  v_item   jsonb;
  v_img    text;
  v_phone  text;
  v_wa     text;
  v_ship   boolean := coalesce(o.delivery_method, '') ilike '%domicilio%';
  v_head   text;
  v_when   text := to_char(o.created_at at time zone 'America/Mexico_City', 'DD/MM/YYYY HH24:MI');
  v_subject text;
  v_html   text;
begin
  select coalesce(sum((i->>'qty')::int), 0) into v_pieces
    from jsonb_array_elements(coalesce(o.cart_items, '[]'::jsonb)) i;

  for v_item in select * from jsonb_array_elements(coalesce(o.cart_items, '[]'::jsonb)) loop
    -- productId viene nulo en stock infinito: ahí se busca por nombre
    select p.image_url into v_img
      from public.products p
     where p.id::text = v_item->>'productId' or p.name = v_item->>'name'
     order by (p.id::text = coalesce(v_item->>'productId', '')) desc
     limit 1;
    v_rows := v_rows || '<tr>'
      || '<td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:20px;width:28px;vertical-align:top">&#9744;</td>'
      || '<td style="padding:10px 0;border-bottom:1px solid #eee;width:72px;vertical-align:top">'
      || case when v_img ~ '^https://' then '<img src="' || html_esc(v_img) || '" width="72" height="90" alt="" style="display:block;width:72px;height:90px;object-fit:cover;border-radius:6px;background:#f2f2f2">' else '' end
      || '</td>'
      || '<td style="padding:10px 8px;border-bottom:1px solid #eee;vertical-align:top"><b>' || html_esc(v_item->>'name') || '</b><br>'
      || '<span style="color:#555">Talla: <b>' || coalesce(nullif(html_esc(v_item->>'size'), ''), '—') || '</b>'
      || ' · Color: <b>' || coalesce(nullif(html_esc(v_item->>'color'), ''), '—') || '</b></span></td>'
      || '<td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-size:18px;vertical-align:top;white-space:nowrap"><b>x' || html_esc(coalesce(v_item->>'qty', '1')) || '</b></td>'
      || '</tr>';
  end loop;

  -- wa.me necesita lada: los de 10 digitos se toman como Mexico
  v_phone := public.phone_key(o.customer_whatsapp);
  v_wa := case when length(v_phone) = 10 then '52' || v_phone else v_phone end;

  if p_kind = 'cancelado' then
    v_subject := 'CANCELADO · Pedido #' || v_short || ' · ' || coalesce(o.customer_name, '');
    v_head := '<div style="background:#D6453E;color:#fff;padding:14px 16px;border-radius:10px;font-size:18px"><b>Pedido cancelado. No lo despaches.</b><br><span style="font-size:14px">Si ya estaba empacado, regresa las piezas al inventario.</span></div>';
  else
    v_subject := 'Pedido #' || v_short || ' · ' || coalesce(o.delivery_method, '') || ' · '
      || v_pieces || case when v_pieces = 1 then ' pieza' else ' piezas' end || ' · ' || money_mx(o.total);
    v_head := '<div style="background:#111;color:#fff;padding:14px 16px;border-radius:10px;font-size:18px"><b>'
      || html_esc(coalesce(o.delivery_method, 'Sin método de entrega')) || '</b><br>'
      || '<span style="font-size:14px">Pago: ' || html_esc(coalesce(nullif(o.payment_method, ''), 'Sin definir'))
      || ' · Estado: ' || case o.status when 'pendientedepago' then 'pendiente de pago' else html_esc(o.status) end || '</span></div>';
  end if;

  v_html := '<div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:600px;margin:0 auto;padding:16px">'
    || '<p style="margin:0 0 12px;color:#555;font-size:13px">Pedido <b>#' || v_short || '</b> · ' || v_when || '</p>'
    || v_head
    || '<h2 style="font-size:16px;margin:22px 0 6px">Piezas (' || v_pieces || ')</h2>'
    || '<table style="width:100%;border-collapse:collapse;font-size:15px">' || v_rows || '</table>'
    || '<h2 style="font-size:16px;margin:22px 0 6px">Cliente</h2>'
    || '<p style="margin:0;font-size:15px;line-height:1.6"><b>' || html_esc(o.customer_name) || '</b><br>'
    || 'WhatsApp: <a href="https://wa.me/' || v_wa || '" style="color:#1E9E6A">' || html_esc(o.customer_whatsapp) || '</a>'
    || case when coalesce(o.customer_email, '') <> '' then '<br>Correo: ' || html_esc(o.customer_email) else '' end
    || '</p>'
    || case when v_ship and coalesce(o.address, '') <> '' then
         '<h2 style="font-size:16px;margin:22px 0 6px">Dirección de envío</h2>'
         || '<p style="margin:0;font-size:15px;line-height:1.6">' || replace(html_esc(o.address), E'\n', '<br>') || '<br>'
         || '<a href="https://www.google.com/maps/search/?api=1&amp;query=' || html_esc(replace(replace(replace(replace(replace(replace(replace(o.address, '%', '%25'), '#', '%23'), '&', '%26'), '?', '%3F'), E'\r', ''), E'\n', '+'), ' ', '+')) || '" style="color:#1a56db">Abrir en Google Maps</a></p>'
       else '' end
    || '<h2 style="font-size:16px;margin:22px 0 6px">Cobro</h2>'
    || '<p style="margin:0;font-size:15px;line-height:1.6">Subtotal: ' || money_mx(o.subtotal)
    || case when coalesce(o.discount, 0) > 0 then '<br>Descuento' || case when o.coupon_code is not null then ' (' || html_esc(o.coupon_code) || ')' else '' end || ': -' || money_mx(o.discount) else '' end
    || '<br><b>Total productos: ' || money_mx(o.total) || '</b>'
    || case when v_ship then '<br><span style="color:#555">El envío se cobra aparte.</span>' else '' end
    || '</p>'
    || '<p style="margin:26px 0 0"><a href="https://glboutique.com.mx/admin/orders" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold">Ver en el admin</a></p>'
    || '<p style="margin:22px 0 0;color:#888;font-size:12px">Aviso interno de G&amp;L. Trae datos del cliente: no lo reenvíes fuera del equipo.</p>'
    || '</div>';

  return jsonb_build_object('subject', left(v_subject, 200), 'html', v_html);
end;
$$;

-- Manda el aviso a toda la lista. Nunca lanza error: el pedido vale más que el correo.
-- Devuelve el id de la petición, o null si no se mandó (lista vacía, sin clave o error).
create or replace function public.send_order_staff_email(p_order_id uuid, p_kind text, p_test boolean default false)
returns bigint
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_order public.orders%rowtype;
  v_to    jsonb;
  v_mail  jsonb;
  v_rid   bigint;
begin
  select coalesce(jsonb_agg(email order by created_at), '[]'::jsonb) into v_to from public.order_notify_emails;
  if jsonb_array_length(v_to) = 0 then return null; end if;

  select * into v_order from public.orders where id = p_order_id;
  if not found then return null; end if;

  v_mail := public.order_staff_email(v_order, p_kind);
  v_rid := public.resend_post('emails', jsonb_build_object(
    'from', 'G&L Pedidos <hola@glboutique.com.mx>',
    'to', v_to,
    'subject', case when p_test then '[Prueba] ' else '' end || (v_mail->>'subject'),
    'html', v_mail->>'html'
  ));
  if v_rid is null then raise warning 'send_order_staff_email: falta la API key de Resend en Vault'; end if;
  return v_rid;
exception when others then
  raise warning 'send_order_staff_email: %', sqlerrm;
  return null;
end;
$$;
revoke all on function public.send_order_staff_email(uuid, text, boolean) from public, anon, authenticated;

create or replace function public.notify_staff_on_order()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
begin
  if tg_op = 'INSERT' then
    perform public.send_order_staff_email(new.id, 'nuevo');
  elsif new.status = 'cancelado' and coalesce(old.status, '') <> 'cancelado' then
    perform public.send_order_staff_email(new.id, 'cancelado');
  end if;
  return null;
end;
$$;
revoke all on function public.notify_staff_on_order() from public, anon, authenticated;

drop trigger if exists tr_notify_staff_on_order on public.orders;
create trigger tr_notify_staff_on_order
  after insert or update of status on public.orders
  for each row execute function public.notify_staff_on_order();

-- "Mandar prueba" del admin: el último pedido, marcado [Prueba], a la lista.
-- Devuelve 'sent', 'no_emails', 'no_orders' o 'error'.
create or replace function public.send_order_staff_test()
returns text
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.admin_users a where a.user_id = auth.uid()) then
    raise exception 'Solo los administradores pueden enviar correos';
  end if;
  if not exists (select 1 from public.order_notify_emails) then return 'no_emails'; end if;
  select id into v_id from public.orders order by created_at desc limit 1;
  if v_id is null then return 'no_orders'; end if;
  return case when public.send_order_staff_email(v_id, 'nuevo', true) is null then 'error' else 'sent' end;
end;
$$;
revoke all on function public.send_order_staff_test() from public, anon;
grant execute on function public.send_order_staff_test() to authenticated;

commit;

-- Comprobación: respuesta de Resend de los últimos avisos (200 = enviado)
-- select id, status_code, content, created from net._http_response order by created desc limit 5;
