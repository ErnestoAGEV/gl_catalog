-- Check de supabase/coupons.sql (Tarea 3). Correr con execute_sql, nunca como
-- migracion. Esperado: error con texto CHECK_OK (el raise final deshace los
-- cupones y el pedido de prueba, los rate_events y el cambio de coupon_ip).
-- No manda correos: el trigger de aviso al equipo se apaga dentro del bloque.
do $$
declare
  v_n     int;
  v_msg   text;
  v_hint  text;
  v_code  text;
begin
  perform set_config('plpgsql.check_asserts', 'on', true);

  -- Petición anónima desde una IP de prueba
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', '{"cf-connecting-ip":"203.0.113.41"}', true);
  update public.security_limits set max_hits = 100, win = interval '10 minutes' where name = 'coupon_ip';
  delete from public.rate_events where bucket = 'coupon_ip';

  insert into public.coupons (code, discount, free_shipping, label, active, expires_at, max_uses) values
    ('ZZTEST1', 0.10, false, 'Prueba 1', true, null, null),
    ('ZZTEST2', 0.10, false, 'Prueba 2', true, now() - interval '1 day', null),
    ('ZZTEST3', 0.10, false, 'Prueba 3', true, null, 1),
    ('ZZTEST4', 0.10, false, 'Prueba 4', false, null, null);

  -- El pedido a mano no debe avisar al equipo
  alter table public.orders disable trigger tr_notify_staff_on_order;
  insert into public.orders (customer_name, customer_whatsapp, payment_method, delivery_method,
                             cart_items, subtotal, discount, total, coupon_code, status)
  values ('ZZ prueba', '0000000000', 'x', 'x', '[]', 0, 0, 0, 'ZZTEST3', 'pendientedepago');

  select count(*), max(v.code) into v_n, v_code from public.validate_coupon('zz-test1') v;
  assert v_n = 1 and v_code = 'ZZTEST1', format('ZZTEST1: %s filas, code %s', v_n, v_code);
  select count(*) into v_n from public.validate_coupon('ZZTEST2');
  assert v_n = 0, 'ZZTEST2 vencido devolvio fila';
  select count(*) into v_n from public.validate_coupon('ZZTEST3');
  assert v_n = 0, 'ZZTEST3 sin usos libres devolvio fila';
  select count(*) into v_n from public.validate_coupon('NOEXISTE999');
  assert v_n = 0, 'codigo inexistente devolvio fila';
  select count(*) into v_n from public.validate_coupon('ZZTEST4');
  assert v_n = 0, 'ZZTEST4 inactivo devolvio fila';
  select count(*) into v_n from public.validate_coupon(null);
  assert v_n = 0, 'validate_coupon(null) devolvio fila';
  select count(*) into v_n from public.validate_coupon('');
  assert v_n = 0, 'validate_coupon(vacio) devolvio fila';
  assert (select count(*) from public.rate_events where bucket = 'coupon_ip') = 7, 'los intentos no se contaron en coupon_ip';

  -- Como anon, igual que por PostgREST
  execute 'set local role anon';
  select count(*), max(v.code) into v_n, v_code from public.validate_coupon('ZZTEST1') v;
  execute 'reset role';
  assert v_n = 1 and v_code = 'ZZTEST1', format('ZZTEST1 como anon: %s filas, code %s', v_n, v_code);

  -- Un pedido cancelado no gasta el uso
  update public.orders set status = 'cancelado' where coupon_code = 'ZZTEST3';
  select count(*) into v_n from public.validate_coupon('ZZTEST3');
  assert v_n = 1, 'ZZTEST3 con el pedido cancelado no devolvio fila';
  alter table public.orders enable trigger tr_notify_staff_on_order;

  -- ── Tope por IP bajado a 2 ──
  update public.security_limits set max_hits = 2 where name = 'coupon_ip';
  perform set_config('request.headers', '{"cf-connecting-ip":"198.51.100.42"}', true);
  perform * from public.validate_coupon('NOEXISTE1');
  perform * from public.validate_coupon('NOEXISTE2');
  begin
    perform * from public.validate_coupon('ZZTEST1');
    v_msg := null;
  exception when others then
    get stacked diagnostics v_msg = message_text, v_hint = pg_exception_hint;
  end;
  assert v_msg = 'Demasiados intentos. Espera unos minutos.' and v_hint = 'rate',
    format('3a llamada con tope 2: %s / hint %s', coalesce(v_msg, 'no lanzo'), v_hint);
  perform set_config('request.headers', '', true);
  perform set_config('request.jwt.claims', '', true);

  -- ── Permisos ──
  assert not has_function_privilege('anon', 'public.coupon_open(public.coupons)', 'execute'), 'anon ejecuta coupon_open';
  assert not has_function_privilege('authenticated', 'public.coupon_open(public.coupons)', 'execute'), 'authenticated ejecuta coupon_open';
  assert has_function_privilege('anon', 'public.validate_coupon(text)', 'execute'), 'anon no ejecuta validate_coupon';
  assert has_function_privilege('authenticated', 'public.validate_coupon(text)', 'execute'), 'authenticated no ejecuta validate_coupon';
  assert (select prosecdef and provolatile = 'v' from pg_proc where oid = 'public.validate_coupon(text)'::regprocedure),
    'validate_coupon no es SECURITY DEFINER volatil';
  assert pg_get_function_result('public.validate_coupon(text)'::regprocedure)
       = 'TABLE(code text, discount numeric, free_shipping boolean, label text, categories jsonb, first_purchase_only boolean)',
    format('firma de validate_coupon: %s', pg_get_function_result('public.validate_coupon(text)'::regprocedure));

  -- max_uses > 0
  begin
    update public.coupons set max_uses = 0 where code = 'ZZTEST1';
    v_msg := null;
  exception when check_violation then
    v_msg := 'ok';
  end;
  assert v_msg = 'ok', 'max_uses = 0 se acepto';


  raise exception 'CHECK_OK';
end;
$$;
