-- Fase 0: sin escritura anónima directa en las tablas de public.
--
-- Supabase da por defecto INSERT/UPDATE/DELETE/TRUNCATE a anon y authenticated
-- en todas las tablas, y RLS queda como única guarda. Aquí se quita esa capa:
-- anon solo escribe por RPCs SECURITY DEFINER; authenticated (el admin)
-- conserva insert/update/delete porque sus políticas lo usan.
--
-- Desde aquí toda función nueva necesita su `grant execute` explícito.
--
-- Idempotente. Correr como postgres: los default privileges son del rol que
-- crea los objetos.

revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
grant insert on public.newsletter_subscribers to anon;  -- el sitio actual; se quita en la Fase C
revoke truncate, references, trigger on all tables in schema public from authenticated;

alter default privileges for role postgres in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon;
alter default privileges for role postgres in schema public revoke truncate, references, trigger on tables from authenticated;
alter default privileges for role postgres revoke execute on functions from public;  -- global: el EXECUTE a PUBLIC no se quita por esquema
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
