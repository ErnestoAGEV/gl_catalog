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
--   4. Pegarla abajo, donde dice PEGA_AQUI_LA_URL
--
-- Esa URL es una llave: quien la tenga puede lanzar despliegues. Por eso se
-- guarda en Vault y no suelta dentro de la función.
-- ──────────────────────────────────────────────────────────────────────────

-- 1. Extensiones. pg_net hace la llamada HTTP sin bloquear la transacción:
--    si Vercel tarda o falla, el alta del producto se guarda igual.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- 2. La URL, guardada en Vault. Idempotente: si ya existe, la actualiza en vez
--    de fallar por nombre duplicado, para que puedas correr esto las veces que
--    haga falta (por ejemplo si regeneras el hook en Vercel).
DO $vault$
DECLARE
  id_existente uuid;
BEGIN
  SELECT id INTO id_existente FROM vault.secrets WHERE name = 'vercel_deploy_hook';
  IF id_existente IS NULL THEN
    PERFORM vault.create_secret(
      'PEGA_AQUI_LA_URL',
      'vercel_deploy_hook',
      'Deploy Hook de Vercel para reconstruir el catalogo'
    );
  ELSE
    PERFORM vault.update_secret(id_existente, 'PEGA_AQUI_LA_URL');
  END IF;
END;
$vault$;

-- 3. La función que dispara el despliegue.
CREATE OR REPLACE FUNCTION public.trigger_rebuild()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  hook_url text;
BEGIN
  SELECT decrypted_secret INTO hook_url
  FROM vault.decrypted_secrets
  WHERE name = 'vercel_deploy_hook';

  IF hook_url IS NULL OR hook_url = 'PEGA_AQUI_LA_URL' THEN
    RAISE WARNING 'trigger_rebuild: falta la URL del Deploy Hook en Vault';
    RETURN NULL;
  END IF;

  PERFORM net.http_post(url := hook_url, body := '{}'::jsonb);
  RETURN NULL;
END;
$$;

-- 4. Los triggers. A nivel de sentencia (FOR EACH STATEMENT), no de fila: así
--    una edición de 40 productos de golpe lanza un despliegue, no cuarenta.
DROP TRIGGER IF EXISTS products_rebuild_insert ON public.products;
DROP TRIGGER IF EXISTS products_rebuild_update ON public.products;
DROP TRIGGER IF EXISTS products_rebuild_delete ON public.products;

CREATE TRIGGER products_rebuild_insert
AFTER INSERT ON public.products
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_rebuild();

CREATE TRIGGER products_rebuild_update
AFTER UPDATE ON public.products
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_rebuild();

CREATE TRIGGER products_rebuild_delete
AFTER DELETE ON public.products
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_rebuild();

-- ponytail: un despliegue por sentencia. Si algún día editas productos uno a
-- uno durante un rato, serán varios builds seguidos; ahí tocaría una tabla de
-- "pendiente de publicar" con un cron cada 15 minutos. Mientras el catálogo se
-- toque a ratos y no en continuo, esto sobra.

-- 5. Comprobación: edita un producto desde el admin y mira Vercel →
--    Deployments. Debería aparecer uno nuevo con origen "Deploy Hook" en menos
--    de un minuto. Para ver si la llamada salió:
-- SELECT id, created, url, status_code FROM net._http_response ORDER BY created DESC LIMIT 5;

-- Para desactivarlo sin borrar nada:
-- ALTER TABLE public.products DISABLE TRIGGER products_rebuild_update;
