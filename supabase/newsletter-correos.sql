-- Correos del boletín: bienvenida automática, envíos a suscriptores y baja.
--
-- Cómo funciona: el admin (Newsletter) arma el correo y guarda el asunto y el
-- HTML ya listo. Supabase lo manda por Resend con pg_net, igual que
-- deploy-hook.sql avisa a Vercel, y cambia {{BAJA_URL}} por el enlace de baja
-- de cada persona (glboutique.com.mx/baja?t=...).
--   · Bienvenida: un trigger al entrar un suscriptor nuevo. Si alguien se
--     vuelve a suscribir con el mismo correo, el insert falla por duplicado y
--     no recibe un segundo correo.
--   · Envíos: el admin llama a send_newsletter(); solo a quien no se dio de baja.
--
-- ──────────────────────────────────────────────────────────────────────────
-- ANTES DE EJECUTAR
--
--   1. Crear cuenta en https://resend.com (gratis: 3 000 correos al mes, 100 al día;
--      si tienes más de 100 suscriptores activos, un envío necesita el plan de pago)
--   2. Resend → Domains → Add domain → glboutique.com.mx
--      Te da 3-4 registros DNS (TXT/MX). Agrégalos donde administras el dominio
--      y espera a que Resend lo marque "Verified". Sin esto no envía a nadie.
--   3. Resend → API Keys → Create (permiso "Sending access") y copia la clave
--      (empieza con re_). Pégala abajo, en el paso 3, donde dice PEGA_AQUI_LA_CLAVE.
--   4. Remitente: hola@glboutique.com.mx (no necesita buzón). Las respuestas de
--      los clientes llegan a glboutiquecolima@gmail.com (reply_to). Ambos en el paso 4.
--
-- Se puede correr las veces que haga falta. Si lo vuelves a correr sin pegar la
-- clave, la que ya está guardada se conserva.
-- ──────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- 1. Baja: cada suscriptor tiene un token secreto para su enlace de baja. Los
--    que ya existen reciben uno al agregar la columna.
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsub_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsub_token_key
  ON public.newsletter_subscribers (unsub_token);

-- Pública a propósito: quien tenga el token (solo llega en sus correos) puede
-- darse de baja. Devuelve false si el enlace no corresponde a nadie.
CREATE OR REPLACE FUNCTION public.newsletter_unsubscribe(p_token uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH u AS (
    UPDATE public.newsletter_subscribers
    SET unsubscribed_at = coalesce(unsubscribed_at, now())
    WHERE unsub_token = p_token
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM u);
$$;
REVOKE ALL ON FUNCTION public.newsletter_unsubscribe(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.newsletter_unsubscribe(uuid) TO anon, authenticated;

-- 2. Las plantillas ('welcome' y el borrador 'campaign'). Solo los admins las
--    leen o escriben; el trigger las lee como SECURITY DEFINER.
CREATE TABLE IF NOT EXISTS public.email_templates (
  key text PRIMARY KEY,
  subject text NOT NULL,
  html text NOT NULL,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_templates_admin_all" ON public.email_templates;
CREATE POLICY "email_templates_admin_all"
  ON public.email_templates
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- 3. La clave de Resend, en Vault.
DO $vault$
DECLARE
  nueva text := 'PEGA_AQUI_LA_CLAVE';
  id_existente uuid;
BEGIN
  SELECT id INTO id_existente FROM vault.secrets WHERE name = 'resend_api_key';
  IF id_existente IS NULL THEN
    PERFORM vault.create_secret(nueva, 'resend_api_key', 'API key de Resend para los correos del boletín');
  ELSIF nueva LIKE 're_%' THEN
    PERFORM vault.update_secret(id_existente, nueva);
  END IF;
END;
$vault$;

-- 4. Un correo de Resend para una persona, con su enlace de baja ya puesto.
CREATE OR REPLACE FUNCTION public.newsletter_email_json(p_to text, p_token uuid, p_subject text, p_html text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'from', 'G&L Boutique <hola@glboutique.com.mx>',
    'reply_to', 'glboutiquecolima@gmail.com',
    'to', jsonb_build_array(p_to),
    'subject', p_subject,
    'html', replace(p_html, '{{BAJA_URL}}', 'https://www.glboutique.com.mx/baja?t=' || p_token),
    'headers', jsonb_build_object('List-Unsubscribe', '<https://www.glboutique.com.mx/baja?t=' || p_token || '>')
  );
$$;

-- La llamada a Resend. Devuelve NULL si falta la clave.
CREATE OR REPLACE FUNCTION public.resend_post(p_endpoint text, p_body jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  api_key text;
BEGIN
  SELECT decrypted_secret INTO api_key FROM vault.decrypted_secrets WHERE name = 'resend_api_key';
  IF api_key IS NULL OR api_key NOT LIKE 're_%' THEN RETURN NULL; END IF;
  RETURN net.http_post(
    url := 'https://api.resend.com/' || p_endpoint,
    headers := jsonb_build_object('Authorization', 'Bearer ' || api_key, 'Content-Type', 'application/json'),
    body := p_body,
    timeout_milliseconds := 10000
  );
END;
$$;
REVOKE ALL ON FUNCTION public.resend_post(text, jsonb) FROM public, anon, authenticated;

-- 5. Bienvenida. Mientras no guardes el correo en el admin no hay fila
--    'welcome' y no se envía nada. Nunca lanza error: la suscripción vale más
--    que el correo.
CREATE OR REPLACE FUNCTION public.send_welcome_to(p_email text, p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  tpl record;
BEGIN
  SELECT subject, html INTO tpl FROM public.email_templates WHERE key = 'welcome' AND enabled;
  IF NOT FOUND THEN RETURN; END IF;
  IF public.resend_post('emails', public.newsletter_email_json(p_email, p_token, tpl.subject, tpl.html)) IS NULL THEN
    RAISE WARNING 'send_welcome_to: falta la API key de Resend en Vault';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'send_welcome_to: %', SQLERRM;
END;
$$;
REVOKE ALL ON FUNCTION public.send_welcome_to(text, uuid) FROM public, anon, authenticated;

-- Al entrar un suscriptor nuevo.
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
BEGIN
  PERFORM public.send_welcome_to(NEW.email, NEW.unsub_token);
  RETURN NULL;
END;
$$;

-- Quien se dio de baja y vuelve a suscribirse choca con el correo duplicado;
-- la home llama a esto en ese caso: lo reactiva con enlace de baja nuevo y le
-- manda la bienvenida otra vez. Si ya estaba activo no hace nada.
CREATE OR REPLACE FUNCTION public.newsletter_resubscribe(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  UPDATE public.newsletter_subscribers
  SET unsubscribed_at = NULL, unsub_token = gen_random_uuid()
  WHERE lower(email) = lower(btrim(p_email)) AND unsubscribed_at IS NOT NULL
  RETURNING email, unsub_token INTO r;
  IF FOUND THEN PERFORM public.send_welcome_to(r.email, r.unsub_token); END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.newsletter_resubscribe(text) FROM public;
GRANT EXECUTE ON FUNCTION public.newsletter_resubscribe(text) TO anon, authenticated;

DROP TRIGGER IF EXISTS newsletter_welcome_email ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_welcome_email
AFTER INSERT ON public.newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email();

-- 6. Envío a suscriptores (solo admins), por una cola: send_newsletter() deja
--    los correos en newsletter_outbox y pg_cron manda un lote de 100 cada 10
--    segundos, para no pasar el límite de velocidad de Resend. Cada lote guarda
--    la respuesta de Resend, así el admin ve cuántos se entregaron.
--    Con p_test_email manda una sola prueba al momento, sin cola.
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id bigserial PRIMARY KEY,
  subject text NOT NULL,
  total integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.newsletter_outbox (
  id bigserial PRIMARY KEY,
  campaign_id bigint NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  email jsonb NOT NULL,
  request_id bigint,
  status_code integer,
  sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS newsletter_outbox_pending ON public.newsletter_outbox (id) WHERE request_id IS NULL;
-- Sin políticas: solo las funciones de abajo (SECURITY DEFINER) las tocan.
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_outbox ENABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS public.send_newsletter(text, text, text);
CREATE FUNCTION public.send_newsletter(p_subject text, p_html text, p_test_email text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  campana bigint;
  total integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Solo los administradores pueden enviar correos';
  END IF;
  IF coalesce(btrim(p_subject), '') = '' OR coalesce(btrim(p_html), '') = '' THEN
    RAISE EXCEPTION 'Falta el asunto o el contenido del correo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'resend_api_key' AND decrypted_secret LIKE 're_%') THEN
    RAISE EXCEPTION 'Falta la API key de Resend en Vault';
  END IF;

  IF p_test_email IS NOT NULL THEN
    IF p_test_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
      RAISE EXCEPTION 'El correo de prueba no es válido';
    END IF;
    -- La prueba lleva un token que no es de nadie: su enlace de baja no da de baja a nadie.
    PERFORM public.resend_post('emails', public.newsletter_email_json(p_test_email, '00000000-0000-0000-0000-000000000000', p_subject, p_html));
    RETURN 1;
  END IF;

  SELECT count(*) INTO total FROM public.newsletter_subscribers WHERE unsubscribed_at IS NULL;
  IF total = 0 THEN RAISE EXCEPTION 'No hay suscriptores activos'; END IF;

  INSERT INTO public.newsletter_campaigns (subject, total) VALUES (p_subject, total) RETURNING id INTO campana;
  INSERT INTO public.newsletter_outbox (campaign_id, email)
  SELECT campana, public.newsletter_email_json(email, unsub_token, p_subject, p_html)
  FROM public.newsletter_subscribers WHERE unsubscribed_at IS NULL
  ORDER BY id;
  RETURN total;
END;
$$;
REVOKE ALL ON FUNCTION public.send_newsletter(text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.send_newsletter(text, text, text) TO authenticated;

-- Lo corre pg_cron cada 10 segundos.
CREATE OR REPLACE FUNCTION public.newsletter_outbox_tick()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  ids bigint[];
  lote jsonb;
  rid bigint;
BEGIN
  -- 1. Anotar lo que respondió Resend (pg_net guarda las respuestas unas horas).
  --    Sin código = la llamada falló o expiró: queda como 0. Si en una hora no
  --    hubo respuesta (pg_net caído o respuesta ya borrada), también.
  UPDATE public.newsletter_outbox
  SET status_code = 0
  WHERE status_code IS NULL AND request_id IS NOT NULL AND sent_at < now() - interval '1 hour';

  UPDATE public.newsletter_outbox o
  SET status_code = coalesce(r.status_code, 0)
  FROM net._http_response r
  WHERE o.request_id = r.id AND o.status_code IS NULL;

  -- 2. Si Resend dijo "más despacio" o "límite del día" (429), ese lote vuelve
  --    a la cola, pero espera 15 minutos para no insistir cada 10 segundos.
  UPDATE public.newsletter_outbox
  SET request_id = NULL, status_code = NULL, sent_at = NULL
  WHERE status_code = 429 AND sent_at < now() - interval '15 minutes';

  -- 3. El siguiente lote (Resend acepta hasta 100 por llamada).
  SELECT array_agg(id), jsonb_agg(email ORDER BY id) INTO ids, lote
  FROM (SELECT id, email FROM public.newsletter_outbox WHERE request_id IS NULL ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED) s;
  IF ids IS NOT NULL THEN
    rid := public.resend_post('emails/batch', lote);
    IF rid IS NOT NULL THEN -- sin API key se queda en cola hasta que la pongas
      UPDATE public.newsletter_outbox SET request_id = rid, sent_at = now() WHERE id = ANY(ids);
    END IF;
  END IF;

  -- 4. Limpieza: los envíos de hace más de 60 días ya no se consultan.
  DELETE FROM public.newsletter_campaigns WHERE created_at < now() - interval '60 days';
END;
$$;
REVOKE ALL ON FUNCTION public.newsletter_outbox_tick() FROM public, anon, authenticated;

SELECT cron.schedule('newsletter-outbox', '10 seconds', 'SELECT public.newsletter_outbox_tick()');

-- Estado del último envío para el admin.
CREATE OR REPLACE FUNCTION public.newsletter_last_campaign()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Solo los administradores';
  END IF;
  SELECT jsonb_build_object(
    'subject', c.subject,
    'created_at', c.created_at,
    'total', c.total,
    'delivered', count(*) FILTER (WHERE o.status_code BETWEEN 200 AND 299),
    'failed', count(*) FILTER (WHERE o.status_code IS NOT NULL AND o.status_code NOT BETWEEN 200 AND 299),
    'pending', count(*) FILTER (WHERE o.status_code IS NULL)
  ) INTO out
  FROM public.newsletter_campaigns c
  LEFT JOIN public.newsletter_outbox o ON o.campaign_id = c.id
  WHERE c.id = (SELECT max(id) FROM public.newsletter_campaigns)
  GROUP BY c.id;
  RETURN out;
END;
$$;
REVOKE ALL ON FUNCTION public.newsletter_last_campaign() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.newsletter_last_campaign() TO authenticated;

-- 7. Comprobación
--   · Que no se repitan correos (la bienvenida depende de esto). Debe devolver
--     una fila; si no devuelve nada, avísame antes de lanzar envíos:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'newsletter_subscribers' AND indexdef ILIKE '%UNIQUE%(email)%';
--   · Bienvenida: guarda el correo en el admin y suscríbete en la home con un
--     alias tuyo (tucorreo+prueba1@gmail.com llega a tu bandeja normal; cada
--     prueba necesita un alias nuevo porque el correo no se puede repetir).
--   · Envíos: usa "Enviarme una prueba" en el admin antes de mandar a todos.
--   · Que la cola corra (debe aparecer 'newsletter-outbox'):
-- SELECT jobname, schedule FROM cron.job;
--   · Respuesta de Resend (200 = enviado):
-- SELECT id, created, status_code, content FROM net._http_response ORDER BY created DESC LIMIT 5;
