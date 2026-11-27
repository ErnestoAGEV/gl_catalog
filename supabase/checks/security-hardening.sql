-- Check de supabase/security-hardening.sql (Tarea 15, Fase C). Correr con
-- execute_sql, nunca como migración. Esperado: error con texto CHECK_OK (el
-- raise final deshace la fila de prueba del boletín, rate_events, las
-- ediciones de security_limits y la cola de pg_net).
do $$
declare
  v_admin  uuid;
  v_total  int;
  v_n      int;
  v_st     text;
  t        record;
  c        text;
  r        public.newsletter_subscribers%rowtype;
  v_auth   oid := 'authenticated'::regrole::oid;
begin
  -- Sin esto, un servidor con check_asserts = off pasaría todo en silencio
  perform set_config('plpgsql.check_asserts', 'on', true);

  -- ── Privilegios de tabla y secuencia ──
  for t in
    select cl.oid, cl.oid::regclass as rel, cl.relkind
    from pg_class cl
    where cl.relnamespace = 'public'::regnamespace and cl.relkind in ('r', 'p', 'v', 'm', 'f', 'S')
  loop
    if t.relkind = 'S' then
      assert not has_sequence_privilege('anon', t.oid, 'USAGE, UPDATE'), format('anon usa la secuencia %s', t.rel);
      continue;
    end if;
    assert not has_table_privilege('anon', t.oid, 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'),
      format('anon escribe en %s', t.rel);
    assert not has_table_privilege('authenticated', t.oid, 'TRUNCATE'), format('authenticated tiene TRUNCATE en %s', t.rel);
    if t.relkind in ('r', 'p') then
      foreach c in array array['INSERT', 'UPDATE', 'DELETE'] loop
        if has_table_privilege('authenticated', t.oid, c) then
          assert exists (
            select 1 from pg_policy p
            where p.polrelid = t.oid
              and p.polcmd::text in (case c when 'INSERT' then 'a' when 'UPDATE' then 'w' else 'd' end, '*')
              and p.polroles && array[v_auth, 0::oid]
          ), format('authenticated tiene %s en %s sin politica que lo use', c, t.rel);
        end if;
      end loop;
    end if;
  end loop;
  -- Los casos que el plan nombra
  assert has_table_privilege('authenticated', 'public.orders', 'UPDATE'), 'orders: authenticated perdio UPDATE';
  assert not has_table_privilege('authenticated', 'public.orders', 'INSERT'), 'orders: authenticated conserva INSERT';
  assert not has_table_privilege('authenticated', 'public.orders', 'DELETE'), 'orders: authenticated conserva DELETE';
  assert not has_table_privilege('authenticated', 'public.admin_users', 'INSERT, UPDATE, DELETE'), 'admin_users: authenticated escribe';
  assert not has_table_privilege('authenticated', 'public.newsletter_subscribers', 'INSERT, UPDATE, DELETE'), 'newsletter_subscribers: authenticated escribe';
  assert has_table_privilege('authenticated', 'public.products', 'INSERT')
     and has_table_privilege('authenticated', 'public.products', 'UPDATE')
     and has_table_privilege('authenticated', 'public.products', 'DELETE'), 'products: el admin perdio escritura';
  assert has_table_privilege('authenticated', 'public.categories', 'INSERT')
     and has_table_privilege('authenticated', 'public.site_content', 'DELETE'), 'categories/site_content: el admin perdio escritura';

  -- ── Políticas ──
  assert not exists (select 1 from pg_policy where polname in
    ('newsletter_public_insert', 'coupons_public_read_active', 'orders_public_insert', 'products_bucket_public_read')),
    'queda una politica vieja abierta';
  assert exists (select 1 from pg_policy where polrelid = 'public.products'::regclass and polname = 'products_public_read'
                 and pg_get_expr(polqual, polrelid) like '%badge%'), 'products_public_read no filtra badge';
  assert exists (select 1 from pg_policy where polrelid = 'public.products'::regclass and polname = 'products_admin_read'),
    'falta products_admin_read';
  assert exists (select 1 from pg_policy where polrelid = 'storage.objects'::regclass and polname = 'products_bucket_admin_read'),
    'falta products_bucket_admin_read';
  assert (select count(*) from pg_policy where polrelid = 'public.categories'::regclass) = 2
     and exists (select 1 from pg_policy where polrelid = 'public.categories'::regclass and polname = 'categories_public_read')
     and exists (select 1 from pg_policy where polrelid = 'public.categories'::regclass and polname = 'categories_admin_all'),
    'categories: politicas distintas de categories_public_read + categories_admin_all';
  assert (select count(*) from pg_policy where polrelid = 'public.site_content'::regclass) = 2
     and exists (select 1 from pg_policy where polrelid = 'public.site_content'::regclass and polname = 'site_content_public_read')
     and exists (select 1 from pg_policy where polrelid = 'public.site_content'::regclass and polname = 'site_content_admin_all'),
    'site_content: politicas distintas de site_content_public_read + site_content_admin_all';
  assert (select count(*) from storage.buckets where id in ('products', 'site-content')
          and file_size_limit = 5242880 and 'image/jpeg' = any(allowed_mime_types)) = 2,
    'buckets sin tope de tamano o de tipos';

  -- ── Como anon: sin borradores, sin cupones, sin alta directa ──
  execute 'set local role anon';
  assert (select count(*) from public.products where badge = 'Borrador') = 0, 'anon ve borradores';
  assert (select count(*) from public.products) > 0, 'anon no ve productos';
  assert (select count(*) from public.coupons) = 0, 'anon lee cupones';
  begin
    insert into public.newsletter_subscribers (email) values ('zz+t15direct@example.com');
    v_st := null;
  exception when others then
    v_st := sqlstate;
  end;
  execute 'reset role';
  assert v_st = '42501', format('insert directo al boletin: sqlstate %s (esperado 42501 permission denied)', coalesce(v_st, 'no lanzo'));

  -- ── Como admin: ve los borradores ──
  select user_id into v_admin from public.admin_users limit 1;
  assert v_admin is not null, 'no hay admins para probar products_admin_read';
  select count(*) into v_total from public.products;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.products;
  execute 'reset role';
  assert v_n = v_total, format('admin ve %s de %s productos (faltan borradores)', v_n, v_total);

  -- ── El alta por RPC sigue funcionando sin los triggers ──
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', '{"cf-connecting-ip":"203.0.113.7"}', true);
  update public.security_limits set max_hits = 100 where name in ('nl_ip', 'nl_email', 'nl_global');
  delete from public.newsletter_subscribers where email like 'zz+t15%@example.com';
  execute 'set local role anon';
  perform public.newsletter_subscribe('ZZ+T15@Example.com');
  execute 'reset role';
  select * into r from public.newsletter_subscribers where email = 'zz+t15@example.com';
  assert r.id is not null, 'newsletter_subscribe: no guardo la fila';
  assert r.confirmed_at is null and r.unsubscribed_at is null and r.confirm_token is not null
     and r.confirm_sent_at is not null and r.unsub_token is not null and r.source = 'home_page',
    'newsletter_subscribe: la fila no quedo pendiente de confirmar';

  -- ── Lo borrado ──
  assert to_regprocedure('public.newsletter_resubscribe(text)') is null, 'existe newsletter_resubscribe(text)';
  assert to_regprocedure('public.newsletter_direct_insert()') is null, 'existe la funcion newsletter_direct_insert()';
  assert not exists (select 1 from pg_trigger where tgrelid = 'public.newsletter_subscribers'::regclass
                     and tgname in ('newsletter_welcome_email', 'newsletter_direct_insert')),
    'queda un trigger viejo del boletin';

  -- ── EXECUTE ──
  assert not has_function_privilege('anon', 'public.html_esc(text)', 'execute'), 'anon ejecuta html_esc';
  assert not has_function_privilege('anon', 'public.money_mx(numeric)', 'execute'), 'anon ejecuta money_mx';
  assert not has_function_privilege('anon', 'public.newsletter_email_json(text, uuid, text, text)', 'execute'), 'anon ejecuta newsletter_email_json';
  assert not has_function_privilege('anon', 'public.order_staff_email(public.orders, text)', 'execute'), 'anon ejecuta order_staff_email';
  assert not has_function_privilege('anon', 'public.phone_key(text)', 'execute'), 'anon ejecuta phone_key';
  assert not has_function_privilege('authenticated', 'public.phone_key(text)', 'execute'), 'authenticated ejecuta phone_key';
  assert has_function_privilege('anon', 'public.validate_coupon(text)', 'execute'), 'anon no ejecuta validate_coupon';
  assert has_function_privilege('anon', 'public.newsletter_subscribe(text)', 'execute'), 'anon no ejecuta newsletter_subscribe';
  assert has_function_privilege('anon', 'public.newsletter_confirm(uuid)', 'execute'), 'anon no ejecuta newsletter_confirm';
  assert has_function_privilege('anon', 'public.newsletter_unsubscribe(uuid)', 'execute'), 'anon no ejecuta newsletter_unsubscribe';
  assert has_function_privilege('anon', 'public.free_shipping_min()', 'execute'), 'anon no ejecuta free_shipping_min';
  -- Tarea 12 no hecha: place_order sigue abierta a anon
  assert has_function_privilege('anon', 'public.place_order(text, text, text, text, text, jsonb, text, text, numeric, uuid, text, jsonb)', 'execute'),
    'anon no ejecuta place_order';
  assert has_function_privilege('authenticated',
    'public.admin_place_order(text, text, text, text, text, jsonb, text, text, uuid, text, jsonb, numeric, boolean, text)', 'execute'),
    'authenticated no ejecuta admin_place_order';

  -- ── search_path con pg_temp en toda SECURITY DEFINER de public ──
  assert not exists (
    select 1 from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prosecdef
      and not exists (select 1 from pg_depend d
                      where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
      and not exists (select 1 from unnest(p.proconfig) x where x like 'search_path=%' and position('pg_temp' in x) > 0)
  ), (select 'SECURITY DEFINER sin pg_temp: ' || string_agg(p.oid::regprocedure::text, ', ')
      from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.prosecdef
        and not exists (select 1 from unnest(p.proconfig) x where x like 'search_path=%' and position('pg_temp' in x) > 0));

  raise exception 'CHECK_OK';
end;
$$;
