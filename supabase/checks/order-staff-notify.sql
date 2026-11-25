-- Check de supabase/order-staff-notify.sql (Tarea 5). Correr con execute_sql,
-- nunca como migracion. Esperado: error con texto CHECK_OK (el raise final
-- deshace pedidos, cambios en security_limits y rate_events). No manda correos
-- reales: la peticion a Resend queda en la cola de pg_net dentro de la
-- transaccion y el rollback la quita.
do $$
declare
  v_p1  public.products%rowtype;
  v_items jsonb;
  v_order public.orders;
  v0    bigint;
  v_n   int;
  v_ip  constant text := '203.0.113.9';
begin
  perform set_config('plpgsql.check_asserts', 'on', true);

  assert exists (select 1 from public.order_notify_emails), 'order_notify_emails vacia: no hay a quien avisar';
  assert exists (select 1 from vault.decrypted_secrets where name = 'resend_api_key' and decrypted_secret like 're_%'),
    'falta resend_api_key en Vault';

  -- Topes de place_order holgados; solo se prueba el de avisos
  update public.security_limits set max_hits = 100
   where name in ('order_ip', 'order_ip_day', 'order_phone', 'order_global');
  update public.security_limits set max_hits = 1, win = interval '24 hours' where name = 'staff_mail';
  update public.security_limits set max_hits = 1, win = interval '1 hour' where name = 'staff_alert';
  update public.security_limits set max_hits = 3, win = interval '24 hours' where name = 'staff_alert_day';
  delete from public.rate_events
   where bucket in ('order_ip', 'order_ip_day', 'order_phone', 'order_global', 'staff_mail', 'staff_alert', 'staff_alert_day');

  select * into v_p1 from public.products where badge is distinct from 'Borrador' order by id limit 1;
  assert v_p1.id is not null, 'no hay productos publicados';
  update public.products set stock = null where id = v_p1.id;
  v_items := jsonb_build_array(jsonb_build_object('productId', v_p1.id,
               'size', coalesce(to_jsonb(v_p1.sizes)->>0, ''), 'color', coalesce(to_jsonb(v_p1.colors)->>0, ''), 'qty', 1));

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', jsonb_build_object('cf-connecting-ip', v_ip)::text, true);
  execute 'set local role anon';

  -- 1o: aviso normal
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  select * into v_order from public.place_order('ZZ Prueba check', '3120000051', 'Transferencia', 'Recoger en tienda', null, v_items);
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 1, format('1er pedido: %s correos en cola (esperado 1)', v_n);
  assert (select encode(body, 'escape') from net.http_request_queue where id > v0) not like '%se pausaron los avisos%',
    'el 1er pedido mando la alerta en vez del aviso normal';

  -- 2o: tope lleno, sale la alerta de pausa
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  select * into v_order from public.place_order('ZZ Prueba check', '3120000052', 'Transferencia', 'Recoger en tienda', null, v_items);
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 1, format('2o pedido: %s correos en cola (esperado 1, la alerta)', v_n);
  assert (select encode(body, 'escape') from net.http_request_queue where id > v0) like '%se pausaron los avisos%',
    'el 2o pedido no mando la alerta de pausa';

  -- 3o: ni aviso ni alerta (una alerta por hora)
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  select * into v_order from public.place_order('ZZ Prueba check', '3120000053', 'Transferencia', 'Recoger en tienda', null, v_items);
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 0, format('3er pedido: %s correos en cola (esperado 0)', v_n);
  execute 'reset role';

  -- Cancelar no cuenta para el tope y siempre avisa
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  update public.orders set status = 'cancelado' where id = v_order.id;
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 1, format('cancelacion: %s correos en cola (esperado 1)', v_n);
  assert (select count(*) from public.rate_events where bucket = 'staff_mail') = 1, 'la cancelacion o el pedido bloqueado conto para staff_mail';

  -- Si el tope falla (limite sin configurar), el pedido entra igual
  delete from public.security_limits where name = 'staff_mail';
  perform set_config('request.headers', jsonb_build_object('cf-connecting-ip', v_ip)::text, true);
  execute 'set local role anon';
  select * into v_order from public.place_order('ZZ Prueba check', '3120000054', 'Transferencia', 'Recoger en tienda', null, v_items);
  execute 'reset role';
  assert v_order.id is not null, 'el pedido no entro cuando fallo el tope';

  assert (select prosrc from pg_proc where oid = 'public.notify_staff_on_order()'::regprocedure) like '%rate_check(''staff_mail''%',
    'notify_staff_on_order no usa el tope';
  assert not exists (select 1 from pg_proc where pronamespace = 'public'::regnamespace
     and proname in ('send_order_staff_email', 'notify_staff_on_order', 'send_order_staff_test')
     and not (coalesce(proconfig, '{}') @> array['search_path=public, extensions, vault, pg_temp'])),
    'falta pg_temp en el search_path de alguna funcion del aviso';

  raise exception 'CHECK_OK';
end;
$$;
