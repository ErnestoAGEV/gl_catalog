-- Fotos de Admin → Contenido (bucket site-content): solo admins suben.
-- El bucket nunca tuvo politica de insert propia (la unica abierta, "Public Access to Upload",
-- se borro en drop-legacy-policies.sql). La lectura no necesita politica: el bucket es publico.
-- Solo insert: uploadSiteImage usa upsert:false y nombres con Date.now(), nunca actualiza ni borra.

begin;

drop policy if exists "site_content_bucket_admin_insert" on storage.objects;
create policy "site_content_bucket_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-content'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );

commit;
