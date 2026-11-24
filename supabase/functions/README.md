# Edge Functions

## shipping-quote

Cotiza envío con Envia.com. Archivos: `shipping-quote/index.js` (entrypoint) + `_shared/shipping.js` + `_shared/envia.js`.

**Deploy**: con el MCP de Supabase (`deploy_edge_function`, entrypoint `index.js`, subiendo los tres archivos) o desde el Dashboard → Edge Functions. `verify_jwt` queda activo (el sitio manda la anon key en `Authorization`).

**Secretos** (Dashboard → Edge Functions → Secrets; nunca en archivos):
- `ENVIA_API_KEY`
- `ENVIA_BASE_URL`: sandbox `https://api-test.envia.com`, producción `https://api.envia.com`

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase.
