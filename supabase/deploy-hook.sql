-- Reconstruir el sitio cuando cambia el catálogo.
--
-- El problema: el HTML de cada ficha se genera en el build. Si das de alta un
-- producto y no hay un despliegue después, esa ficha no existe para ningún
-- crawler — ni Google, ni GPTBot, ni la preview de WhatsApp. Se queda en el
-- shell de la SPA, que lleva noindex a propósito. Hoy eso depende de que
-- alguien suba código ese día.
--
-- La solución: que la propia base avise a Vercel de que hay algo nuevo.
--
-- ──────────────────────────────────────────────────────────────────────────
-- ANTES DE EJECUTAR: necesitas la URL del Deploy Hook
--
--   1. Vercel → el proyecto → Settings → Git → Deploy Hooks
--   2. Crear uno: nombre "supabase-catalogo", rama "main"
--   3. Copiar la URL que te da (queda como
--      https://api.vercel.com/v1/integrations/deploy/prj_XXXX/YYYY)
--   4. Pegarla abajo, en el paso 2, donde dice PEGA_AQUI_LA_URL (la funcion
--      del paso 3 no la lleva escrita, la lee de Vault). Si la dejas sin
--      pegar, la URL ya guardada se conserva.
--
-- Esa URL es una llave: quien la tenga puede lanzar despliegues. Por eso se
-- guarda en Vault y no suelta dentro de la función.
-- ──────────────────────────────────────────────────────────────────────────

-- 1. Extensiones. pg_net hace la llamada HTTP sin bloquear la transacción:
--    si Vercel tarda o falla, el alta del producto se guarda igual.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- 2. La URL, guardada en Vault. Se crea solo si no existe, y se actualiza solo
--    si lo que pegaste es una URL de Vercel: re-correr el archivo con
--    PEGA_AQUI_LA_URL ya no pisa la URL buena (por ejemplo al regenerar el
--    hook en Vercel, pega la nueva y vuelve a correrlo).
DO $vault$
DECLARE
  nueva text := 'PEGA_AQUI_LA_URL';
  id_existente uuid;
BEGIN
  SELECT id INTO id_existente FROM vault.secrets WHERE name = 'vercel_deploy_hook';
  IF id_existente IS NULL THEN
    PERFORM vault.create_secret(nueva, 'vercel_deploy_hook', 'Deploy Hook de Vercel para reconstruir el catalogo');
  ELSIF nueva LIKE 'https://api.vercel.com/%' THEN
    PERFORM vault.update_secret(id_existente, nueva);
  END IF;
END;
$vault$;

-- 3. La llamada a Vercel. Nadie la ejecuta por /rpc: solo los triggers de abajo.
CREATE OR REPLACE FUNCTION public.request_rebuild()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault, pg_temp
AS $$
DECLARE
  hook_url text;
BEGIN
  SELECT decrypted_secret INTO hook_url
  FROM vault.decrypted_secrets
  WHERE name = 'vercel_deploy_hook';

  IF hook_url IS NULL OR hook_url NOT LIKE 'https://api.vercel.com/%' THEN
    RAISE WARNING 'request_rebuild: la URL del Deploy Hook falta o no es de Vercel (%)', hook_url;
    RETURN;
  END IF;

  PERFORM net.http_post(url := hook_url, body := '{}'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.request_rebuild() FROM public, anon, authenticated;

-- Trigger genérico (lo usa shipping_settings_rebuild de shipping.sql). Ese es
-- FOR EACH ROW con WHEN (old.free_shipping_min IS DISTINCT FROM new...), y un
-- trigger por fila nunca dispara con 0 filas: no necesita el filtro de abajo.
-- DEFINER para poder llamar a request_rebuild(), que nadie más ejecuta.
CREATE OR REPLACE FUNCTION public.trigger_rebuild()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.request_rebuild();
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.trigger_rebuild() FROM public, anon, authenticated;

-- Para products: un trigger por sentencia dispara aunque la sentencia no toque
-- ninguna fila (un PATCH vacío por la API lanzaba un despliegue). Solo se
-- despliega si la tabla de transición trae filas. Cada tabla de transición
-- existe solo en su operación; plpgsql prepara cada sentencia al ejecutarla,
-- así que la rama que no corre no falla.
CREATE OR REPLACE FUNCTION public.products_rebuild()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF tg_op = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM old_rows) THEN PERFORM public.request_rebuild(); END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM new_rows) THEN PERFORM public.request_rebuild(); END IF;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.products_rebuild() FROM public, anon, authenticated;

-- 4. Los triggers. A nivel de sentencia (FOR EACH STATEMENT), no de fila: así
--    una edición de 40 productos de golpe lanza un despliegue, no cuarenta.
DROP TRIGGER IF EXISTS products_rebuild_insert ON public.products;
DROP TRIGGER IF EXISTS products_rebuild_update ON public.products;
DROP TRIGGER IF EXISTS products_rebuild_delete ON public.products;

CREATE TRIGGER products_rebuild_insert
AFTER INSERT ON public.products
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.products_rebuild();

CREATE TRIGGER products_rebuild_update
AFTER UPDATE ON public.products
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.products_rebuild();

CREATE TRIGGER products_rebuild_delete
AFTER DELETE ON public.products
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION public.products_rebuild();

-- ponytail: un despliegue por sentencia que toque al menos una fila (las de 0
-- filas ya no despliegan). Si algún día editas productos uno a uno durante un
-- rato, serán varios builds seguidos; ahí tocaría una tabla de "pendiente de
-- publicar" con un cron cada 15 minutos. Mientras el catálogo se toque a ratos
-- y no en continuo, esto sobra.

-- 5. Comprobación: edita un producto desde el admin y mira Vercel →
--    Deployments. Debería aparecer uno nuevo con origen "Deploy Hook" en menos
--    de un minuto. Para ver si la llamada salió:
-- SELECT id, created, url, status_code FROM net._http_response ORDER BY created DESC LIMIT 5;

-- Para desactivarlo sin borrar nada:
-- ALTER TABLE public.products DISABLE TRIGGER products_rebuild_update;
