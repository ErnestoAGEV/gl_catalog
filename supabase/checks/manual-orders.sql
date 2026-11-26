-- Check de supabase/manual-orders.sql. Correr con execute_sql, nunca como
-- migracion. Esperado: error con texto CHECK_OK (el raise final deshace pedidos,
-- cambios en security_limits y rate_events). No manda correos reales: la cola de
-- pg_net se deshace con el rollback. Depende de place-order.sql, order-staff-notify.sql
-- y order-confirmation.sql.
do $$
declare
  v_p     public.products%rowtype;
  v_items jsonb;
  v_admin uuid;
  v_o     public.orders;
  v_w     public.orders;
  v0      bigint;
  v_n     int;
  v_msg   text;
  v_unit  numeric;
  v_ip    constant text := '203.0.113.9';
  v_sig   constant text := 'public.admin_place_order(text,text,text,text,text,jsonb,text,text,uuid,text,jsonb,numeric,boolean,text)';
begin
  perform set_config('plpgsql.check_asserts', 'on', true);

  select user_id into v_admin from public.admin_users limit 1;
  assert v_admin is not null, 'no hay admin_users';
  assert exists (select 1 from public.order_notify_emails), 'order_notify_emails vacia: la prueba de correos no valdria';

  update public.security_limits set max_hits = 1000
   where name in ('order_ip', 'order_ip_day', 'order_phone', 'order_global', 'staff_mail');
  delete from public.rate_events
   where bucket in ('order_ip', 'order_ip_day', 'order_phone', 'order_global', 'staff_mail', 'staff_alert', 'staff_alert_day');

  select * into v_p from public.products where badge is distinct from 'Borrador' order by id limit 1;
  assert v_p.id is not null, 'no hay productos publicados';
  update public.products set stock = '0' where id = v_p.id;
  v_items := jsonb_build_array(jsonb_build_object('productId', v_p.id,
               'size', coalesce(to_jsonb(v_p.sizes)->>0, ''), 'color', coalesce(to_jsonb(v_p.colors)->>0, ''), 'qty', 2));

  perform set_config('request.headers', jsonb_build_object('cf-connecting-ip', v_ip)::text, true);

  -- Permisos
  assert not has_function_privilege('anon', v_sig, 'execute'), 'anon puede ejecutar admin_place_order';
  assert has_function_privilege('authenticated', v_sig, 'execute'), 'authenticated no puede ejecutar admin_place_order';

  -- No admin
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', gen_random_uuid()::text, 'aal', 'aal2')::text, true);
  begin
    execute 'set local role authenticated';
    perform public.admin_place_order('ZZ Prueba check', '3120000061', 'Transferencia', 'Recoger en tienda', null, v_items);
    execute 'reset role';
    raise exception 'un no admin pudo crear un pedido manual';
  exception when others then
    execute 'reset role';
    get stacked diagnostics v_msg = message_text;
    assert v_msg = 'Solo los administradores pueden crear pedidos manuales.', format('mensaje de no admin: %s', v_msg);
  end;

  -- Admin
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', v_admin::text, 'aal', 'aal2')::text, true);

  -- Recoger en tienda: canal, estado, subtotal, sin correos, stock intacto
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  execute 'set local role authenticated';
  select * into v_o from public.admin_place_order('ZZ Prueba check', '3120000062', 'Transferencia', 'Recoger en tienda', null, v_items);
  execute 'reset role';
  assert v_o.channel = 'whatsapp', 'canal no es whatsapp';
  assert v_o.status = 'pendientedepago', format('estado %s', v_o.status);
  select i.price into v_unit from public.promo_info(v_p) i;
  assert v_o.subtotal = v_unit * 2, format('subtotal %s, esperado %s', v_o.subtotal, v_unit * 2);
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 0, format('pedido manual: %s correos en cola (esperado 0)', v_n);
  assert (select stock from public.products where id = v_p.id) = '0', 'el pedido manual toco el stock';
  assert coalesce(current_setting('gl.order_channel', true), '') = '', 'gl.order_channel no se reinicio';

  -- A domicilio con costo propio y entrega local
  execute 'set local role authenticated';
  select * into v_w from public.admin_place_order('ZZ Prueba check', '3120000063', 'Efectivo', 'Envío a domicilio',
    'Calle 1 #2, Centro, Colima, Colima, 28000', v_items, null, null, null, null,
    '{"street":"Calle 1","numExt":"2","neighborhood":"Centro","city":"Colima","state":"COL","stateName":"Colima","zip":"28000"}'::jsonb,
    60, true);
  execute 'reset role';
  assert v_w.shipping_cost = 60 and v_w.shipping_carrier = 'local' and v_w.shipping_service = 'Entrega local'
     and v_w.shipping_tier = 'standard',
     format('envio local: %s/%s/%s/%s', v_w.shipping_cost, v_w.shipping_carrier, v_w.shipping_service, v_w.shipping_tier);

  -- Validaciones
  begin
    execute 'set local role authenticated';
    perform public.admin_place_order('ZZ Prueba check', '3120000064', 'Transferencia', 'Recoger en tienda', null, v_items, null, null, null, null, null, 10001);
    execute 'reset role';
    raise exception 'acepto envio 10001';
  exception when others then
    execute 'reset role';
    get stacked diagnostics v_msg = message_text;
    assert v_msg = 'Costo de envío inválido.', format('mensaje costo: %s', v_msg);
  end;
  begin
    execute 'set local role authenticated';
    perform public.admin_place_order('ZZ Prueba check', '3120000065', 'Transferencia', 'Recoger en tienda', null, v_items, null, null, null, null, null, null, false, 'xx');
    execute 'reset role';
    raise exception 'acepto estado xx';
  exception when others then
    execute 'reset role';
    get stacked diagnostics v_msg = message_text;
    assert v_msg = 'Estado inválido.', format('mensaje estado: %s', v_msg);
  end;

  -- Estado inicial completado
  execute 'set local role authenticated';
  select * into v_o from public.admin_place_order('ZZ Prueba check', '3120000066', 'Transferencia', 'Recoger en tienda', null, v_items,
    null, 'zz@example.com', null, null, null, null, false, 'completado');
  execute 'reset role';
  assert v_o.status = 'completado', 'no quedo completado';

  -- Confirmacion al cliente: 'manual', sin correo
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  execute 'set local role authenticated';
  select public.send_order_confirmation(v_o.id::text, 'Asunto', '<p>Hola</p>') into v_msg;
  execute 'reset role';
  assert v_msg = 'manual', format('send_order_confirmation devolvio %s (esperado manual)', v_msg);
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 0, 'la confirmacion de un pedido WhatsApp encolo correo';

  -- Cancelar un pedido WhatsApp no avisa al equipo
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  update public.orders set status = 'cancelado' where id = v_w.id;
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 0, format('cancelacion WhatsApp: %s correos en cola (esperado 0)', v_n);

  -- Pedido web: canal web y 1 aviso al equipo
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  execute 'set local role anon';
  select * into v_o from public.place_order('ZZ Prueba check', '3120000067', 'Transferencia', 'Recoger en tienda', null, v_items);
  execute 'reset role';
  assert v_o.channel = 'web', format('pedido web con canal %s', v_o.channel);
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 1, format('pedido web: %s correos en cola (esperado 1)', v_n);

  raise exception 'CHECK_OK';
end;
$$;
