-- Check de supabase/newsletter-correos.sql (Tarea 6). Correr con execute_sql,
-- nunca como migracion. Esperado: error con texto CHECK_OK (el raise final
-- deshace las filas de prueba, los cambios en security_limits y rate_events).
-- No manda correos reales: las peticiones a Resend quedan en la cola de pg_net
-- dentro de la transaccion y el rollback las quita. Depende de security-base.sql.
do $$
declare
  v0     bigint;
  v_n    int;
  v_msg  text;
  v_tok  uuid;
  r      public.newsletter_subscribers%rowtype;
begin
  perform set_config('plpgsql.check_asserts', 'on', true);

  assert exists (select 1 from vault.decrypted_secrets where name = 'resend_api_key' and decrypted_secret like 're_%'),
    'falta resend_api_key en Vault: sin ella la cola no crece y el check no prueba nada';

  -- Peticion anonima desde una IP de prueba; topes holgados salvo donde se prueban
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', '{"cf-connecting-ip":"203.0.113.7"}', true);
  update public.security_limits set max_hits = 100 where name in ('nl_ip', 'nl_email', 'nl_global');
  delete from public.rate_events where bucket in ('nl_ip', 'nl_email', 'nl_global');
  delete from public.newsletter_subscribers where email like 'zz+test%@example.com';

  -- ── Alta: una fila pendiente y un correo; repetir no manda otro ──
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  execute 'set local role anon';
  perform public.newsletter_subscribe('ZZ+Test@Example.com ');
  execute 'reset role';
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 1, format('alta: %s correos en cola (esperado 1)', v_n);
  assert (select convert_from(body, 'UTF8') from net.http_request_queue where id > v0) like '%Confirma tu suscripci%',
    'alta: el correo no es el de confirmacion';
  select * into r from public.newsletter_subscribers where email = 'zz+test@example.com';
  assert r.id is not null, 'alta: no hay fila con el correo normalizado';
  assert r.confirmed_at is null and r.confirm_token is not null and r.confirm_sent_at is not null and r.source = 'home_page',
    'alta: la fila no quedo pendiente';
  assert (select convert_from(body, 'UTF8') from net.http_request_queue where id > v0) like '%/confirmar?t=' || r.confirm_token || '%',
    'alta: el enlace no lleva el confirm_token';
  v_tok := r.confirm_token;

  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  perform public.newsletter_subscribe('zz+test@example.com');
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 0, format('alta repetida: %s correos en cola (esperado 0)', v_n);

  -- ── Confirmar: sin bienvenida, segundo clic = true, token ajeno o vencido = false ──
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  execute 'set local role anon';
  assert public.newsletter_confirm(v_tok), 'confirmar: devolvio false';
  assert public.newsletter_confirm(v_tok), 'confirmar (2o clic): devolvio false';
  assert not public.newsletter_confirm(gen_random_uuid()), 'confirmar token ajeno: devolvio true';
  execute 'reset role';
  assert (select confirmed_at is not null and unsubscribed_at is null from public.newsletter_subscribers where email = 'zz+test@example.com'),
    'confirmar: no quedo confirmada';
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 0, format('confirmar: %s correos en cola (esperado 0, sin bienvenida)', v_n);

  perform public.newsletter_subscribe('zz+test2@example.com');
  update public.newsletter_subscribers set confirm_sent_at = now() - interval '8 days'
   where email = 'zz+test2@example.com' returning confirm_token into v_tok;
  assert not public.newsletter_confirm(v_tok), 'confirmar enlace de hace 8 dias: devolvio true';
  assert (select confirmed_at is null from public.newsletter_subscribers where email = 'zz+test2@example.com'),
    'confirmar enlace vencido: quedo confirmada';

  -- ── Correo invalido ──
  begin
    perform public.newsletter_subscribe('no-es-correo');
    v_msg := null;
  exception when others then
    v_msg := sqlerrm;
  end;
  assert v_msg = 'El correo no parece valido.', format('correo invalido: %s', coalesce(v_msg, 'no lanzo'));

  -- ── Tope por IP en 1 ──
  update public.security_limits set max_hits = 1 where name = 'nl_ip';
  delete from public.rate_events where bucket = 'nl_ip';
  perform public.newsletter_subscribe('zz+test3@example.com');
  begin
    perform public.newsletter_subscribe('zz+test4@example.com');
    v_msg := null;
  exception when others then
    v_msg := sqlerrm;
  end;
  assert v_msg = 'Demasiados intentos. Intenta mas tarde.', format('2a alta con nl_ip=1: %s', coalesce(v_msg, 'no lanzo'));
  assert not exists (select 1 from public.newsletter_subscribers where email = 'zz+test4@example.com'), 'nl_ip: la 2a alta se guardo';
  update public.security_limits set max_hits = 100 where name = 'nl_ip';

  -- ── Tope por correo en 1: la 2a peticion (pasadas 24 h) no manda nada ──
  update public.security_limits set max_hits = 1 where name = 'nl_email';
  update public.newsletter_subscribers set confirm_sent_at = now() - interval '2 days' where email = 'zz+test3@example.com';
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  perform public.newsletter_subscribe('zz+test3@example.com');
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 0, format('2a peticion con nl_email=1: %s correos en cola (esperado 0)', v_n);
  update public.security_limits set max_hits = 100 where name = 'nl_email';

  -- ── Insert directo como el sitio en caché: queda pendiente y recibe confirmacion ──
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  execute 'set local role anon';
  insert into public.newsletter_subscribers (email, confirmed_at, unsubscribed_at, source)
  values ('ZZ+Test5@example.com', now(), null, 'x');
  execute 'reset role';
  select * into r from public.newsletter_subscribers where email = 'zz+test5@example.com';
  assert r.id is not null, 'insert directo: no se normalizo el correo';
  assert r.confirmed_at is null and r.source = 'home_page' and r.confirm_token is not null,
    format('insert directo: confirmed_at %s, source %s', r.confirmed_at, r.source);
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 1, format('insert directo: %s correos en cola (esperado 1)', v_n);
  assert (select convert_from(body, 'UTF8') from net.http_request_queue where id > v0) like '%Confirma tu suscripción a G&L%',
    'insert directo: el correo no es el de confirmacion';

  -- ── newsletter_resubscribe de alguien dado de baja: no reactiva, manda enlace ──
  update public.newsletter_subscribers set unsubscribed_at = now(), confirm_sent_at = now() - interval '2 days'
   where email = 'zz+test@example.com';
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  execute 'set local role anon';
  perform public.newsletter_resubscribe('zz+test@example.com');
  execute 'reset role';
  assert (select unsubscribed_at is not null from public.newsletter_subscribers where email = 'zz+test@example.com'),
    'resubscribe: lo reactivo sin confirmar';
  select count(*) into v_n from net.http_request_queue where id > v0;
  assert v_n = 1, format('resubscribe: %s correos en cola (esperado 1)', v_n);

  -- Ninguna funcion nueva quedo abierta de mas
  assert has_function_privilege('anon', 'public.newsletter_subscribe(text)', 'execute'), 'anon no puede llamar newsletter_subscribe';
  assert has_function_privilege('anon', 'public.newsletter_confirm(uuid)', 'execute'), 'anon no puede llamar newsletter_confirm';
  assert not has_function_privilege('anon', 'public.send_confirm_to(text, uuid)', 'execute'), 'anon puede llamar send_confirm_to';

  raise exception 'CHECK_OK';
end;
$$;
