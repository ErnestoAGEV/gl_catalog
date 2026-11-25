-- Check de supabase/security-base.sql (Tarea 2). Correr con execute_sql, nunca
-- como migración. Esperado: error con texto CHECK_OK (el raise final deshace
-- los rate_events, las ediciones de security_limits y la cola de pg_net).
do $$
declare
  -- Cabecera verificada en el Paso 1: la misma que v_hdr en request_ip()
  v_hdr   text := 'cf-connecting-ip';
  v_decoy text;
  v_admin uuid;
  v_total int;
  v_n     int;
  v_msg   text;
  v0      bigint;
  r1      bigint;
  r2      bigint;
  r3      bigint;
  f       text;
begin
  -- Sin esto, un servidor con check_asserts = off pasaría todo en silencio
  perform set_config('plpgsql.check_asserts', 'on', true);

  -- ── rate_check con tope bajado a 2 ──
  update public.security_limits set max_hits = 2, win = interval '10 minutes' where name = 'order_ip';
  delete from public.rate_events where bucket in ('order_ip', 'ip_unknown');
  assert public.rate_check('order_ip', '203.0.113.7'), 'order_ip: 1er intento rechazado';
  assert public.rate_check('order_ip', '203.0.113.7'), 'order_ip: 2o intento rechazado';
  assert not public.rate_check('order_ip', '203.0.113.7'), 'order_ip: 3er intento paso con tope 2';
  assert public.rate_check('order_ip', '198.51.100.9'), 'order_ip: otra IP rechazada';
  assert (select count(*) from public.rate_events where bucket = 'order_ip') = 3, 'order_ip: el intento rechazado se conto';

  begin
    perform public.rate_check('no_existe', 'x');
    v_msg := null;
  exception when others then
    v_msg := sqlerrm;
  end;
  assert v_msg = 'Limite no_existe no configurado', format('rate_check sin fila: %s', coalesce(v_msg, 'no lanzo'));

  -- Las claves guardadas no son la IP: sha256 en hex
  assert not exists (select 1 from public.rate_events where bucket = 'order_ip'
                      and (key = '203.0.113.7' or length(key) <> 64)), 'rate_events guarda la IP o una clave que no mide 64';

  -- Sin IP: el tope por IP se omite (siempre true) y queda registrado en ip_unknown
  assert public.rate_check('order_ip', 'unknown') and public.rate_check('order_ip', 'unknown')
     and public.rate_check('order_ip', 'unknown'), 'rate_check con IP unknown fue rechazado';
  assert (select count(*) from public.rate_events where bucket = 'order_ip') = 3, 'IP unknown se conto en order_ip';
  assert (select count(*) from public.rate_events where bucket = 'ip_unknown') = 3, 'IP unknown no se registro en ip_unknown';

  -- ── ip_key ──
  assert public.ip_key('2001:db8:abcd:12:1::5') = '2001:db8:abcd:12::', 'ip_key IPv6 /64 (1)';
  assert public.ip_key('2001:db8:abcd:12:ffff::9') = '2001:db8:abcd:12::', 'ip_key IPv6 /64 (2)';
  assert public.ip_key('203.0.113.7') = '203.0.113.7', 'ip_key IPv4';
  assert public.ip_key('basura') = 'unknown', 'ip_key invalida';
  assert public.ip_key(null) = 'unknown', 'ip_key null';
  assert public.ip_key('') = 'unknown', 'ip_key vacia';
  assert public.ip_key('::ffff:203.0.113.7') = '203.0.113.7', 'ip_key IPv4 escrita como IPv6';

  -- ── request_ip ── (las otras cabeceras llevan una IP señuelo que debe ignorarse)
  v_decoy := (select jsonb_object_agg(h, '6.6.6.6')::text
                from unnest(array['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip']) h where h <> v_hdr);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', (v_decoy::jsonb || jsonb_build_object(v_hdr, '203.0.113.7'))::text, true);
  assert public.request_ip() = '203.0.113.7', format('request_ip con %s: %s', v_hdr, public.request_ip());
  perform set_config('request.headers', '{}', true);
  assert public.request_ip() = 'unknown', 'request_ip sin cabeceras';
  perform set_config('request.headers', '', true);
  assert public.request_ip() = 'unknown', 'request_ip con request.headers vacio';
  perform set_config('request.headers', jsonb_build_object(v_hdr, '203.0.113.7', 'x-gl-client-ip', '1.1.1.1')::text, true);
  assert public.request_ip() = '203.0.113.7', 'request_ip: anon pudo fijar x-gl-client-ip';
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  assert public.request_ip() = '1.1.1.1', 'request_ip: service_role no uso x-gl-client-ip';
  perform set_config('request.headers', '', true);

  -- ── is_admin (solo pertenencia; aal2 lo agrega la Tarea 16) ──
  select user_id into v_admin from public.admin_users limit 1;
  assert v_admin is not null, 'no hay admin para probar is_admin';
  perform set_config('request.jwt.claims', '', true);
  assert not public.is_admin(), 'is_admin sin claims';
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_admin, 'aal', 'aal1', 'role', 'authenticated')::text, true);
  assert public.is_admin(), 'is_admin: admin con aal1';
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_admin, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  assert public.is_admin(), 'is_admin: admin con aal2';
  perform set_config('request.jwt.claims', jsonb_build_object('sub', gen_random_uuid(), 'aal', 'aal2', 'role', 'authenticated')::text, true);
  assert not public.is_admin(), 'is_admin: usuario que no es admin';

  -- ── RLS de security_limits, como authenticated ──
  v_total := (select count(*) from public.security_limits);
  execute 'set local role authenticated';
  -- (claims aún de un usuario que no es admin)
  assert (select count(*) from public.security_limits) = 0, 'un usuario que no es admin ve security_limits';
  update public.security_limits set max_hits = max_hits;
  get diagnostics v_n = row_count;
  assert v_n = 0, 'un usuario que no es admin edita security_limits';
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_admin, 'aal', 'aal1', 'role', 'authenticated')::text, true);
  assert (select count(*) from public.security_limits) = v_total, 'el admin no ve todos los topes';
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  assert (select relrowsecurity from pg_class where oid = 'public.rate_events'::regclass), 'rate_events sin RLS';
  assert (select relrowsecurity from pg_class where oid = 'public.security_limits'::regclass), 'security_limits sin RLS';

  -- ── Permisos ──
  foreach f in array array['public.rate_hit(text,text,integer,interval)', 'public.rate_check(text,text)',
                           'public.rate_check_ip(text,text)', 'public.ip_key(text)', 'public.request_ip()',
                           'public.send_staff_alert(text)', 'public.security_watch()', 'public.security_prune()'] loop
    assert not has_function_privilege('anon', f, 'execute'), format('anon ejecuta %s', f);
    assert not has_function_privilege('authenticated', f, 'execute'), format('authenticated ejecuta %s', f);
  end loop;
  assert has_function_privilege('service_role', 'public.rate_check_ip(text,text)', 'execute'), 'service_role no ejecuta rate_check_ip';
  assert has_function_privilege('service_role', 'public.rate_check(text,text)', 'execute'), 'service_role no ejecuta rate_check';
  assert has_function_privilege('authenticated', 'public.is_admin()', 'execute'), 'authenticated no ejecuta is_admin';
  assert not has_function_privilege('anon', 'public.is_admin()', 'execute'), 'anon ejecuta is_admin';
  assert not has_table_privilege('anon', 'public.rate_events', 'select'), 'anon lee rate_events';
  assert not has_table_privilege('authenticated', 'public.rate_events', 'select'), 'authenticated lee rate_events';
  assert not has_table_privilege('anon', 'public.security_limits', 'select'), 'anon lee security_limits';

  -- ── Alertas: una por motivo y hora ──
  -- Se cuentan las peticiones nuevas (id > v0): el worker de pg_net puede vaciar la cola.
  assert exists (select 1 from public.order_notify_emails), 'order_notify_emails vacia: la alerta no tendria a quien ir';
  assert exists (select 1 from vault.decrypted_secrets where name = 'resend_api_key' and decrypted_secret like 're_%'), 'falta resend_api_key en Vault';
  update public.security_limits set max_hits = 1, win = interval '1 hour' where name = 'staff_alert';
  update public.security_limits set max_hits = 3, win = interval '24 hours' where name = 'staff_alert_day';
  delete from public.rate_events where bucket in ('staff_alert', 'staff_alert_day');
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  r1 := public.send_staff_alert('orders');
  r2 := public.send_staff_alert('orders');
  r3 := public.send_staff_alert('newsletter');
  assert r1 is not null and r2 is null and r3 is not null, format('send_staff_alert devolvio %s, %s y %s', r1, r2, r3);
  assert (select count(*) from net.http_request_queue where id > v0) = 2, 'orders x2 + newsletter no encolaron exactamente 2 correos';

  -- Corren sin error (todo se deshace con el raise final)
  perform public.security_watch();
  perform public.security_prune();

  -- ── Cron ──
  assert (select count(*) from cron.job where jobname = 'security-watch' and active
            and schedule = '*/5 * * * *' and command = 'select public.security_watch()') = 1
     and (select count(*) from cron.job where jobname = 'security-watch') = 1, 'job security-watch ausente, duplicado o distinto';
  assert (select count(*) from cron.job where jobname = 'security-prune' and active
            and schedule = '17 * * * *' and command = 'select public.security_prune()') = 1
     and (select count(*) from cron.job where jobname = 'security-prune') = 1, 'job security-prune ausente, duplicado o distinto';

  raise exception 'CHECK_OK';
end;
$$;
