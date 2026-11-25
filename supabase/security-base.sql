-- Base de seguridad (Tarea 2, Fase A): topes editables, IP de la petición,
-- is_admin() y alertas al equipo.
--
-- Requiere pgcrypto, pg_cron, pg_net, supabase_vault y resend_post() de
-- newsletter-correos.sql. Crea tablas y funciones que nada usa todavía (las
-- consumen las Tareas 3, 4, 6, 7 y 12); lo único que actúa por su cuenta son
-- los dos cron: avisos al equipo y limpieza de rate_events, shipping_quotes
-- viejas e ip_hash.
-- Desde la Fase 0 las funciones nuevas nacen sin EXECUTE: cada grant es explícito.
--
-- Aplicar con apply_migration (ya corre en una transacción). Idempotente: se
-- puede volver a correr entero (no pisa los topes que el dueño ya ajustó ni
-- la sal de Vault).

-- ── Topes ───────────────────────────────────────────────────────────────
create table if not exists public.security_limits (
  name     text primary key,
  max_hits int not null check (max_hits > 0),
  win      interval not null check (win > interval '0')
);

comment on table public.security_limits is
  'Editar estos topes en Supabase → Table Editor → security_limits; aplica al instante.';

insert into public.security_limits (name, max_hits, win) values
  ('order_ip',         5, interval '10 minutes'),
  ('order_ip_day',    10, interval '24 hours'),
  ('order_phone',      5, interval '10 minutes'),
  ('order_global',    20, interval '1 hour'),
  ('staff_mail',      10, interval '24 hours'),
  ('staff_alert',      1, interval '1 hour'),
  ('staff_alert_day',  3, interval '24 hours'),
  ('nl_ip',            3, interval '1 hour'),
  ('nl_email',         3, interval '30 days'),
  ('nl_global',       15, interval '24 hours'),
  ('coupon_ip',       30, interval '10 minutes'),
  ('quote_ip',        10, interval '1 minute'),
  ('quote_global',    60, interval '1 minute'),
  ('ip_unknown',       5, interval '1 hour')   -- peticiones sin IP antes de avisar
on conflict (name) do nothing;

alter table public.security_limits enable row level security;
revoke all on public.security_limits from anon;
grant select, insert, update, delete on public.security_limits to authenticated;

drop policy if exists security_limits_admin_all on public.security_limits;
create policy security_limits_admin_all on public.security_limits
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- ── Eventos contados (sin políticas: solo funciones SECURITY DEFINER) ───
create table if not exists public.rate_events (
  bucket text not null,
  key    text not null,
  at     timestamptz not null default now()
);
create index if not exists rate_events_bucket_key_at_idx on public.rate_events (bucket, key, at);
alter table public.rate_events enable row level security;
revoke all on public.rate_events from anon, authenticated;

-- Sal para que rate_events no guarde IPs ni teléfonos en claro
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'rate_salt') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'rate_salt',
      'Sal de las claves de rate_events (IP, teléfono, correo)');
  end if;
end;
$$;

-- true = dentro del tope (y cuenta el intento); false = tope alcanzado (no cuenta).
-- Si la transacción que llama se deshace (raise), el intento tampoco cuenta; y
-- como inserta, las RPC que lo usan deben llamarse por POST (GET es solo lectura).
create or replace function public.rate_hit(p_bucket text, p_key text, p_limit int, p_window interval)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, extensions, vault, pg_temp
as $$
declare
  v_key  text;
  v_salt text;
begin
  if p_key = '*' then
    v_key := '*';
  else
    select decrypted_secret into v_salt from vault.decrypted_secrets where name = 'rate_salt';
    if v_salt is null then
      -- Lo crea security-base.sql; si alguien lo borró, se rehace aquí
      perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'rate_salt',
        'Sal de las claves de rate_events (IP, teléfono, correo)');
      select decrypted_secret into v_salt from vault.decrypted_secrets where name = 'rate_salt';
    end if;
    v_key := encode(extensions.digest(coalesce(p_key, '') || v_salt, 'sha256'), 'hex');
  end if;

  -- Serializa a quienes comparten cubeta y clave: sin esto dos peticiones
  -- simultáneas leen el mismo conteo y ambas pasan
  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || v_key, 0));

  if (select count(*) from public.rate_events
       where bucket = p_bucket and key = v_key and at > now() - p_window) >= p_limit then
    return false;
  end if;

  insert into public.rate_events (bucket, key) values (p_bucket, v_key);
  return true;
end;
$$;
revoke all on function public.rate_hit(text, text, int, interval) from public, anon, authenticated;

create or replace function public.rate_check(p_name text, p_key text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_lim public.security_limits%rowtype;
begin
  select * into v_lim from public.security_limits where name = p_name;
  if not found then
    raise exception 'Limite % no configurado', p_name;
  end if;
  -- Sin IP no hay a quién contar: se deja pasar (teléfono, topes globales y
  -- Turnstile siguen aplicando) y security_watch avisa si se repite.
  if p_key = 'unknown' then
    raise warning 'rate_check %: peticion sin IP, tope por IP omitido', p_name;
    insert into public.rate_events (bucket, key) values ('ip_unknown', '*');
    return true;
  end if;
  return public.rate_hit(p_name, p_key, v_lim.max_hits, v_lim.win);
end;
$$;
revoke all on function public.rate_check(text, text) from public, anon, authenticated;
grant execute on function public.rate_check(text, text) to service_role;

-- IPv4 tal cual; IPv6 → su red /64 (un hogar suele tener una /64 entera)
create or replace function public.ip_key(p_ip text)
returns text
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v inet;
begin
  v := nullif(btrim(p_ip), '')::inet;
  if v is null then return 'unknown'; end if;
  if family(v) = 4 then return host(v); end if;
  -- IPv4 escrita como IPv6 (::ffff:a.b.c.d): si no, todas caerían en la misma /64
  if v <<= '::ffff:0.0.0.0/96'::inet then
    return host('0.0.0.0'::inet + (v - '::ffff:0.0.0.0'::inet));
  end if;
  return host(network(set_masklen(v, 64)));
exception when others then
  return 'unknown';
end;
$$;
revoke all on function public.ip_key(text) from public, anon, authenticated;

-- IP del cliente en llamadas por PostgREST.
-- v_hdr: cabecera verificada en el Paso 1 (V-3). Se toma el último elemento
-- separado por comas, que es lo que agrega el proxy: así sirve igual para
-- 'cf-connecting-ip' (un solo valor) que para 'x-forwarded-for'. Si cambia,
-- cambiar también v_hdr en supabase/checks/security-base.sql.
create or replace function public.request_ip()
returns text
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_hdr    constant text := 'cf-connecting-ip';
  v_h      json := nullif(current_setting('request.headers', true), '')::json;
  v_claims json := nullif(current_setting('request.jwt.claims', true), '')::json;
begin
  -- Solo la Edge Function place-order (service role) puede decir la IP del cliente
  if v_claims->>'role' = 'service_role' and nullif(btrim(v_h->>'x-gl-client-ip'), '') is not null then
    return public.ip_key(v_h->>'x-gl-client-ip');
  end if;
  return public.ip_key(reverse(split_part(reverse(v_h->>v_hdr), ',', 1)));
end;
$$;
revoke all on function public.request_ip() from public, anon, authenticated;

create or replace function public.rate_check_ip(p_name text, p_ip text)
returns boolean
language sql
volatile
security definer
set search_path = public, pg_temp
as $$
  select public.rate_check(p_name, public.ip_key(p_ip))
$$;
revoke all on function public.rate_check_ip(text, text) from public, anon, authenticated;
grant execute on function public.rate_check_ip(text, text) to service_role;

-- ── Admin ───────────────────────────────────────────────────────────────
-- Lo usan place_order y las Edge Functions de admin (rpc('is_admin') con el
-- JWT de quien llama). Por ahora solo pertenencia a admin_users: la Tarea 16
-- (admin-mfa.sql) le agrega la exigencia de aal2 en la Fase D.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ── Alertas al equipo ───────────────────────────────────────────────────
-- Devuelve el id de la petición de pg_net, o null si no se mandó (tope de
-- alertas, lista vacía, sin clave de Resend, motivo desconocido o error).
create or replace function public.send_staff_alert(p_reason text)
returns bigint
language plpgsql
volatile
security definer
set search_path = public, extensions, vault, pg_temp
as $$
declare
  v_to      jsonb;
  v_subject text;
  v_html    text;
begin
  if p_reason = 'orders' then
    v_subject := 'Alerta G&L: demasiados pedidos en la última hora';
    v_html := '<p>La tienda llegó al tope de pedidos por hora y está pidiendo a los clientes que escriban por WhatsApp.</p><p>Si es una venta real, sube el tope <code>order_global</code> en la tabla <code>security_limits</code> de Supabase. Si no reconoces los pedidos, puede ser un ataque: revisa <a href="https://glboutique.com.mx/admin/orders">el admin</a> y avisa a quien mantiene la tienda.</p>';
  elsif p_reason = 'staff_mail' then
    v_subject := 'Alerta G&L: se pausaron los avisos de pedidos';
    v_html := '<p>Se llegó al tope diario de avisos de pedido. Para no agotar la cuota de correos, los siguientes pedidos de hoy no mandarán aviso.</p><p>Revisa los pedidos en <a href="https://glboutique.com.mx/admin/orders">el admin</a>.</p>';
  elsif p_reason = 'newsletter' then
    v_subject := 'Alerta G&L: muchas suscripciones al boletín';
    v_html := '<p>Se llegó al tope diario de correos de confirmación del boletín. Si no es una campaña tuya, puede ser abuso.</p>';
  elsif p_reason = 'ip_unknown' then
    v_subject := 'Alerta G&L: la tienda no está recibiendo la IP de los clientes';
    v_html := '<p>Varias peticiones llegaron sin la IP del cliente, así que los topes por IP no se están aplicando (los de teléfono y los de toda la tienda sí).</p><p>Avisa a quien mantiene la tienda: puede que Supabase haya cambiado sus cabeceras.</p>';
  else
    raise warning 'send_staff_alert: motivo desconocido %', p_reason;
    return null;
  end if;

  select coalesce(jsonb_agg(email order by created_at), '[]'::jsonb) into v_to from public.order_notify_emails;
  if jsonb_array_length(v_to) = 0 then return null; end if;

  -- Una por motivo y hora (staff_alert) y pocas al día entre todas (staff_alert_day)
  if not (public.rate_check('staff_alert', p_reason) and public.rate_check('staff_alert_day', '*')) then
    return null;
  end if;

  return public.resend_post('emails', jsonb_build_object(
    'from', 'G&L Pedidos <hola@glboutique.com.mx>',
    'to', v_to,
    'subject', v_subject,
    'html', v_html
  ));
exception when others then
  raise warning 'send_staff_alert: %', sqlerrm;
  return null;
end;
$$;
revoke all on function public.send_staff_alert(text) from public, anon, authenticated;

-- Las alertas no pueden salir dentro de la transacción que se rechaza (el
-- raise las deshace): las manda este cron cuando un tope global está lleno o
-- cuando llegan demasiadas peticiones sin IP.
create or replace function public.security_watch()
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
begin
  for r in
    select w.reason
      from (values ('order_global', 'orders'), ('nl_global', 'newsletter'), ('ip_unknown', 'ip_unknown')) w(bucket, reason)
      join public.security_limits l on l.name = w.bucket
     where (select count(*) from public.rate_events e
             where e.bucket = w.bucket and e.at > now() - l.win) >= l.max_hits
  loop
    perform public.send_staff_alert(r.reason);
  end loop;
end;
$$;
revoke all on function public.security_watch() from public, anon, authenticated;

create or replace function public.security_prune()
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  -- Lo que ya salió de la ventana de su tope; lo de cubetas sin fila, a los
  -- 31 días (lo más largo que se cuenta es nl_email, 30 días)
  delete from public.rate_events e using public.security_limits l
   where e.bucket = l.name and e.at < now() - l.win;
  delete from public.rate_events where at < now() - interval '31 days';

  delete from public.shipping_quotes q
   where q.created_at < now() - interval '24 hours'
     and not exists (select 1 from public.orders o where o.shipping_quote_id = q.id);
  -- El tope por IP de shipping-quote cuenta el último minuto: más viejo ya no sirve
  update public.shipping_quotes set ip_hash = null
   where ip_hash is not null and created_at < now() - interval '10 minutes';

  -- Altas al boletín nunca confirmadas. Las columnas llegan con la Tarea 6:
  -- SQL dinámico para que esta función compile antes de eso.
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'newsletter_subscribers'
         and column_name in ('confirmed_at', 'confirm_sent_at')) = 2 then
    execute 'delete from public.newsletter_subscribers
              where confirmed_at is null and confirm_sent_at < now() - interval ''7 days''';
  end if;
end;
$$;
revoke all on function public.security_prune() from public, anon, authenticated;

-- ── Cron (al final; schedule con el mismo nombre reemplaza el job) ──────
select cron.schedule('security-watch', '*/5 * * * *', 'select public.security_watch()');
select cron.schedule('security-prune', '17 * * * *', 'select public.security_prune()');
