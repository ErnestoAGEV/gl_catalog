-- Check de la Fase 0 (deploy-hook.sql, place-order.sql, anon-writes.sql).
-- Correr con execute_sql, nunca como migración. Esperado: error con texto
-- CHECK_OK (el raise final deshace todo, incluida la cola de pg_net, así que
-- la edición de prueba no lanza un despliegue real).
do $$
declare
  v0 bigint;
  t record;
begin
  -- Sin descuento de inventario
  assert not exists (select 1 from pg_trigger where tgname = 'tr_deduct_stock_on_order'), 'sigue el trigger tr_deduct_stock_on_order';
  assert to_regproc('public.deduct_stock_on_order') is null, 'sigue la funcion deduct_stock_on_order';

  -- Despliegue solo con filas. Se cuentan las peticiones nuevas (id > v0) y no
  -- count(*), porque el worker de pg_net puede vaciar la cola mientras tanto.
  v0 := (select coalesce(max(id), 0) from net.http_request_queue);
  update public.products set name = name where false;
  assert (select count(*) from net.http_request_queue where id > v0) = 0, 'un UPDATE de 0 filas encolo un despliegue';
  update public.products set name = name where id = (select id from public.products limit 1);
  assert (select count(*) from net.http_request_queue where id > v0) = 1, 'un UPDATE de 1 fila no encolo exactamente un despliegue (revisa la URL en Vault)';
  delete from public.products where false;
  assert (select count(*) from net.http_request_queue where id > v0) = 1, 'un DELETE de 0 filas encolo un despliegue';

  -- Sin escritura anónima (salvo INSERT en newsletter_subscribers) ni
  -- TRUNCATE/REFERENCES/TRIGGER para authenticated. has_any_column_privilege
  -- cubre también los permisos por columna.
  for t in
    select c.oid, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')
  loop
    assert not has_table_privilege('anon', t.oid, 'DELETE,TRUNCATE,TRIGGER'), format('anon puede DELETE/TRUNCATE/TRIGGER en %s', t.relname);
    assert not has_any_column_privilege('anon', t.oid, 'UPDATE,REFERENCES'), format('anon puede UPDATE/REFERENCES en %s', t.relname);
    assert t.relname = 'newsletter_subscribers' or not has_any_column_privilege('anon', t.oid, 'INSERT'), format('anon puede INSERT en %s', t.relname);
    assert not has_table_privilege('authenticated', t.oid, 'TRUNCATE,TRIGGER'), format('authenticated puede TRUNCATE/TRIGGER en %s', t.relname);
    assert not has_any_column_privilege('authenticated', t.oid, 'REFERENCES'), format('authenticated puede REFERENCES en %s', t.relname);
  end loop;
  assert has_table_privilege('anon', 'public.newsletter_subscribers', 'INSERT'), 'anon perdio el INSERT del boletin (el sitio actual lo usa)';

  -- Default privileges: lo nuevo nace cerrado
  create table public._zz_acl_probe(id int);
  create function public._zz_acl_fn() returns int language sql as 'select 1';
  assert not has_table_privilege('anon', 'public._zz_acl_probe', 'insert'), 'tabla nueva: anon puede INSERT';
  assert not has_function_privilege('anon', 'public._zz_acl_fn()', 'execute'), 'funcion nueva: anon puede ejecutarla';
  assert not has_function_privilege('authenticated', 'public._zz_acl_fn()', 'execute'), 'funcion nueva: authenticated puede ejecutarla';

  raise exception 'CHECK_OK';
end;
$$;
