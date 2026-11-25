-- Check de supabase/place-order.sql (Tarea 4). Correr con execute_sql, nunca
-- como migracion. Esperado: error con texto CHECK_OK (el raise final deshace
-- los pedidos de prueba, los cambios de products, coupons y security_limits y
-- los rate_events). No manda correos: el aviso al equipo se apaga en el bloque.
do $$
declare
  v_p1     public.products%rowtype;   -- publicado, stock infinito, con tallas
  v_p2     public.products%rowtype;   -- borrador
  v_p3     public.products%rowtype;   -- publicado, stock = 1
  v_admin  uuid;
  v_order  public.orders;
  v_items1 jsonb;
  v_items3 jsonb;
  v_res    text;
  v_n      int;
  v_parts  jsonb := '{"street":"Zaragoza","numExt":"140","numInt":"","neighborhood":"Centro","city":"Colima","state":"COL","stateName":"Colima","zip":"28000","references":"","evil":"x"}';
  c_busy   constant text := 'Demasiados pedidos seguidos. Espera unos minutos o pídenos por WhatsApp.|whatsapp';
  c_global constant text := 'La tienda está recibiendo muchos pedidos en este momento. Pídenos por WhatsApp y te atendemos.|whatsapp';
  c_gone   constant text := 'Uno de los productos ya no esta disponible.|';
  c_stock  constant text := 'Uno de los productos esta agotado o no tiene suficientes piezas.|';
  c_method constant text := 'Metodo de pago o de entrega invalido.|';
begin
  perform set_config('plpgsql.check_asserts', 'on', true);

  -- Intenta un pedido desde una IP; devuelve 'OK' o 'mensaje|hint'. Temporal:
  -- el raise final la deshace.
  execute $f$
    create function pg_temp.zz_try(p_wa text, p_ip text, p_pay text, p_del text, p_items jsonb,
                                   p_email text default null)
    returns text language plpgsql as $b$
    declare v_msg text; v_hint text;
    begin
      perform set_config('request.headers', jsonb_build_object('cf-connecting-ip', p_ip)::text, true);
      perform public.place_order('ZZ Prueba check', p_wa, p_pay, p_del, null, p_items, null, p_email);
      return 'OK';
    exception when others then
      get stacked diagnostics v_msg = message_text, v_hint = pg_exception_hint;
      return v_msg || '|' || coalesce(v_hint, '');
    end;
    $b$
  $f$;

  -- Los pedidos de prueba no deben avisar al equipo
  alter table public.orders disable trigger tr_notify_staff_on_order;

  -- Topes holgados para los casos de validacion; se bajan a 2 mas abajo
  update public.security_limits set max_hits = 100
   where name in ('order_ip', 'order_ip_day', 'order_phone', 'order_global');
  delete from public.rate_events where bucket in ('order_ip', 'order_ip_day', 'order_phone', 'order_global');

  -- ── Productos de prueba (cambios deshechos por el raise final) ──
  -- p1: publicado y con tallas si hay; se le pone stock infinito
  select * into v_p1 from public.products
   where badge is distinct from 'Borrador'
   order by (jsonb_typeof(to_jsonb(sizes)) = 'array' and to_jsonb(sizes) <> '[]'::jsonb) desc nulls last, id
   limit 1;
  assert v_p1.id is not null, 'no hay productos publicados';
  assert jsonb_typeof(to_jsonb(v_p1.sizes)) = 'array' and to_jsonb(v_p1.sizes) <> '[]'::jsonb,
    'ningun producto publicado tiene tallas: no se puede probar la talla invalida';
  update public.products set stock = null
   where id = v_p1.id and not (stock is null or btrim(stock::text) in ('', E'∞'));

  select * into v_p3 from public.products
   where badge is distinct from 'Borrador' and id <> v_p1.id
   order by id limit 1;
  assert v_p3.id is not null, 'hace falta un segundo producto publicado';
  update public.products set stock = '1' where id = v_p3.id;

  select * into v_p2 from public.products where badge = 'Borrador' limit 1;
  if v_p2.id is null then
    select * into v_p2 from public.products where id not in (v_p1.id, v_p3.id) order by id limit 1;
    assert v_p2.id is not null, 'hace falta un tercer producto para el borrador';
    update public.products set badge = 'Borrador' where id = v_p2.id;
  end if;

  v_items1 := jsonb_build_array(jsonb_build_object('productId', v_p1.id,
                'size', coalesce(to_jsonb(v_p1.sizes)->>0, ''), 'color', coalesce(to_jsonb(v_p1.colors)->>0, ''), 'qty', 1));
  v_items3 := jsonb_build_array(jsonb_build_object('productId', v_p3.id,
                'size', coalesce(to_jsonb(v_p3.sizes)->>0, ''), 'color', coalesce(to_jsonb(v_p3.colors)->>0, ''), 'qty', 1));

  -- ── Pedido valido, como anon (igual que por PostgREST) ──
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', '{"cf-connecting-ip":"203.0.113.7"}', true);
  execute 'set local role anon';
  select * into v_order from public.place_order('ZZ Prueba check', '3120000001', 'Transferencia', 'Recoger en tienda',
                                                 null, v_items1 || v_items3);
  execute 'reset role';
  assert v_order.status = 'pendientedepago', format('pedido valido: status %s', v_order.status);
  assert v_order.payment_method = 'Transferencia' and v_order.delivery_method = 'Recoger en tienda', 'pedido valido: metodos';

  -- ── Borrador ──
  v_res := pg_temp.zz_try('3120000002', '203.0.113.7', 'Transferencia', 'Recoger en tienda',
             jsonb_build_array(jsonb_build_object('productId', v_p2.id, 'size', '', 'color', '', 'qty', 1)));
  assert v_res = c_gone, format('borrador: %s', v_res);

  -- ── Existencias ──
  v_res := pg_temp.zz_try('3120000002', '203.0.113.7', 'Transferencia', 'Recoger en tienda',
             jsonb_set(v_items3, '{0,qty}', '2'));
  assert v_res = c_stock, format('qty 2 con stock 1: %s', v_res);
  v_res := pg_temp.zz_try('3120000002', '203.0.113.7', 'Transferencia', 'Recoger en tienda', v_items3 || v_items3);
  assert v_res = c_stock, format('dos lineas de 1 con stock 1: %s', v_res);
  update public.products set stock = '0' where id = v_p3.id;
  v_res := pg_temp.zz_try('3120000002', '203.0.113.7', 'Transferencia', 'Recoger en tienda', v_items3);
  assert v_res = c_stock, format('qty 1 con stock 0: %s', v_res);
  update public.products set stock = '1' where id = v_p3.id;

  -- ── Talla y color ──
  v_res := pg_temp.zz_try('3120000002', '203.0.113.7', 'Transferencia', 'Recoger en tienda',
             jsonb_set(v_items1, '{0,size}', '"ZZ-NO-EXISTE"'));
  assert v_res = 'Revisa la talla o el color de tus productos.|', format('talla inexistente: %s', v_res);
  if jsonb_typeof(to_jsonb(v_p1.colors)) = 'array' and to_jsonb(v_p1.colors) <> '[]'::jsonb then
    v_res := pg_temp.zz_try('3120000002', '203.0.113.7', 'Transferencia', 'Recoger en tienda',
               jsonb_set(v_items1, '{0,color}', '"ZZ-NO-EXISTE"'));
    assert v_res = 'Revisa la talla o el color de tus productos.|', format('color inexistente: %s', v_res);
  end if;

  -- ── Metodos ──
  v_res := pg_temp.zz_try('3120000002', '203.0.113.7', 'PAGADO - transferencia confirmada', 'Recoger en tienda', v_items1);
  assert v_res = c_method, format('pago inventado: %s', v_res);
  v_res := pg_temp.zz_try('3120000002', '203.0.113.7', 'Transferencia', 'Envío a domicilio ', v_items1);
  assert v_res = c_method, format('entrega con espacio: %s', v_res);

  -- ── Correo ──
  v_res := pg_temp.zz_try('3120000002', '203.0.113.7', 'Transferencia', 'Recoger en tienda', v_items1, 'a<b@x.com');
  assert v_res = 'El correo no parece valido.|', format('correo con <: %s', v_res);

  -- ── Direccion por partes (sin cotizacion: modo sin Envia) ──
  select * into v_order from public.place_order('ZZ Prueba check', '3120000003', 'Transferencia', 'Envío a domicilio',
                                                 'OTRA DIRECCION', v_items1, null, 'zz@example.com',
                                                 null, null, null, v_parts);
  assert v_order.address = 'Zaragoza #140, Col. Centro, Colima, Colima, C.P. 28000',
    format('direccion armada: %s', v_order.address);
  assert not (v_order.address_parts ? 'evil'), 'address_parts conserva una clave ajena';
  assert v_order.address_parts->>'zip' = '28000', 'address_parts perdio el zip';
  assert v_order.shipping_cost is null, 'sin cotizacion el envio debe quedar null';
  begin
    perform public.place_order('ZZ Prueba check', '3120000003', 'Transferencia', 'Envío a domicilio',
                               null, v_items1, null, null, null, null, null, v_parts - 'street');
    v_res := 'OK';
  exception when others then
    v_res := sqlerrm;
  end;
  assert v_res = 'Completa tu direccion de envio.', format('partes sin calle: %s', v_res);

  -- ── Cupones vencido y sin usos: como si no existieran ──
  insert into public.coupons (code, discount, free_shipping, label, active, expires_at, max_uses) values
    ('ZZPOEXP', 0.10, false, 'Prueba', true, now() - interval '1 day', null),
    ('ZZPOMAX', 0.10, false, 'Prueba', true, null, 1),
    ('ZZPOOK',  0.10, false, 'Prueba', true, null, null);
  insert into public.orders (customer_name, customer_whatsapp, payment_method, delivery_method,
                             cart_items, subtotal, discount, total, coupon_code, status)
  values ('ZZ prueba', '0000000000', 'x', 'x', '[]', 0, 0, 0, 'ZZPOMAX', 'pendientedepago');
  select * into v_order from public.place_order('ZZ Prueba check', '3120000004', 'Transferencia', 'Recoger en tienda',
                                                 null, v_items1, 'zzpoexp');
  assert v_order.coupon_code is null and v_order.discount = 0, 'cupon vencido se aplico';
  select * into v_order from public.place_order('ZZ Prueba check', '3120000004', 'Transferencia', 'Recoger en tienda',
                                                 null, v_items1, 'ZZPOMAX');
  assert v_order.coupon_code is null and v_order.discount = 0, 'cupon sin usos libres se aplico';
  -- Control: el mismo producto con un cupon abierto si descuenta (si no tiene promocion)
  select * into v_order from public.place_order('ZZ Prueba check', '3120000004', 'Transferencia', 'Recoger en tienda',
                                                 null, v_items1, 'ZZPOOK');
  assert v_order.coupon_code = 'ZZPOOK' or v_order.cart_items->0 ? 'promo', 'cupon abierto no se aplico';

  -- ── Topes bajados a 2 ──
  update public.security_limits set max_hits = 2
   where name in ('order_ip', 'order_ip_day', 'order_phone', 'order_global');

  -- Mismo WhatsApp en formatos distintos, IPs distintas → order_phone
  delete from public.rate_events where bucket like 'order\_%';
  assert pg_temp.zz_try('312 123 4567', '198.51.100.1', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'telefono 1o';
  assert pg_temp.zz_try('+52 312 123 4567', '198.51.100.2', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'telefono 2o';
  v_res := pg_temp.zz_try('044 312 123 4567', '198.51.100.3', 'Transferencia', 'Recoger en tienda', v_items1);
  assert v_res = c_busy, format('telefono 3o: %s', v_res);

  -- Numeros distintos, misma IP → order_ip
  delete from public.rate_events where bucket like 'order\_%';
  assert pg_temp.zz_try('3120000011', '198.51.100.10', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'ip 1o';
  assert pg_temp.zz_try('3120000012', '198.51.100.10', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'ip 2o';
  v_res := pg_temp.zz_try('3120000013', '198.51.100.10', 'Transferencia', 'Recoger en tienda', v_items1);
  assert v_res = c_busy, format('ip 3o: %s', v_res);

  -- order_ip_day (order_ip holgado para que no salte antes)
  delete from public.rate_events where bucket like 'order\_%';
  update public.security_limits set max_hits = 100 where name = 'order_ip';
  assert pg_temp.zz_try('3120000021', '198.51.100.20', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'ip_day 1o';
  assert pg_temp.zz_try('3120000022', '198.51.100.20', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'ip_day 2o';
  v_res := pg_temp.zz_try('3120000023', '198.51.100.20', 'Transferencia', 'Recoger en tienda', v_items1);
  assert v_res = c_busy, format('ip_day 3o: %s', v_res);
  update public.security_limits set max_hits = 2 where name = 'order_ip';

  -- Numeros e IPs distintos → order_global
  delete from public.rate_events where bucket like 'order\_%';
  assert pg_temp.zz_try('3120000031', '198.51.100.31', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'global 1o';
  assert pg_temp.zz_try('3120000032', '198.51.100.32', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'global 2o';
  v_res := pg_temp.zz_try('3120000033', '198.51.100.33', 'Transferencia', 'Recoger en tienda', v_items1);
  assert v_res = c_global, format('global 3o: %s', v_res);
  -- El rechazado no cuenta: solo los pedidos que entran
  assert (select count(*) from public.rate_events where bucket = 'order_global') = 2, 'el pedido rechazado se conto';

  -- Dos IPv6 de la misma /64 son la misma IP
  delete from public.rate_events where bucket like 'order\_%';
  update public.security_limits set max_hits = 100 where name = 'order_global';
  assert pg_temp.zz_try('3120000041', '2001:db8:abcd:12:1::5', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'ipv6 1o';
  assert pg_temp.zz_try('3120000042', '2001:db8:abcd:12:ffff::9', 'Transferencia', 'Recoger en tienda', v_items1) = 'OK', 'ipv6 2o';
  v_res := pg_temp.zz_try('3120000043', '2001:db8:abcd:12:aaaa::1', 'Transferencia', 'Recoger en tienda', v_items1);
  assert v_res = c_busy, format('ipv6 misma /64: %s', v_res);
  select count(distinct key) into v_n from public.rate_events where bucket = 'order_ip';
  assert v_n = 1, format('ipv6 /64 en %s claves', v_n);
  -- order_global vuelve a 2 y ya tiene 2 (los IPv6): todos los topes quedan llenos
  update public.security_limits set max_hits = 2 where name = 'order_global';

  -- ── Admin con aal2: sin topes, metodos libres, sin tope de stock; borrador no ──
  select user_id into v_admin from public.admin_users limit 1;
  assert v_admin is not null, 'no hay admin en admin_users';
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', v_admin, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  v_res := pg_temp.zz_try('3120000041', '2001:db8:abcd:12:1::5', 'Efectivo en tienda', 'Recoger en tienda',
             jsonb_set(v_items3, '{0,qty}', '5'));
  assert v_res = 'OK', format('admin: efectivo, qty 5 con stock 1, topes llenos: %s', v_res);
  v_res := pg_temp.zz_try('3120000041', '2001:db8:abcd:12:1::5', 'Efectivo en tienda', 'Recoger en tienda',
             jsonb_build_array(jsonb_build_object('productId', v_p2.id, 'size', '', 'color', '', 'qty', 1)));
  assert v_res = c_gone, format('admin con borrador: %s', v_res);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.headers', '', true);

  -- Nunca se descuenta stock
  assert (select btrim(stock::text) from public.products where id = v_p3.id) = '1', 'se desconto stock';

  alter table public.orders enable trigger tr_notify_staff_on_order;

  -- ── Firmas y permisos ──
  assert to_regprocedure('public.coupon_first_purchase_ok(text,text,text)') is null, 'sigue coupon_first_purchase_ok';
  select count(*) into v_n from pg_proc where proname = 'place_order' and pronamespace = 'public'::regnamespace;
  assert v_n = 1, format('%s versiones de place_order', v_n);
  assert has_function_privilege('anon', 'public.place_order(text,text,text,text,text,jsonb,text,text,numeric,uuid,text,jsonb)', 'execute'),
    'anon no ejecuta place_order';
  assert has_function_privilege('authenticated', 'public.place_order(text,text,text,text,text,jsonb,text,text,numeric,uuid,text,jsonb)', 'execute'),
    'authenticated no ejecuta place_order';
  assert (select prosecdef from pg_proc where oid = 'public.place_order(text,text,text,text,text,jsonb,text,text,numeric,uuid,text,jsonb)'::regprocedure),
    'place_order no es SECURITY DEFINER';
  assert to_regclass('public.orders_coupon_code_idx') is not null, 'falta el indice orders_coupon_code_idx';

  raise exception 'CHECK_OK';
end;
$$;
