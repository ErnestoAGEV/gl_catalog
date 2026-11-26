# Edge Functions

## shipping-quote

Cotiza envío con Envia.com. Archivos: `shipping-quote/index.js` (entrypoint) + `_shared/shipping.js` + `_shared/envia.js`.

**Deploy**: con el MCP de Supabase (`deploy_edge_function`, entrypoint `index.js`, subiendo los tres archivos) o desde el Dashboard → Edge Functions. `verify_jwt` queda activo (el sitio manda la anon key en `Authorization`).

**Secretos** (Dashboard → Edge Functions → Secrets; nunca en archivos):
- `ENVIA_API_KEY`
- `ENVIA_BASE_URL`: sandbox `https://api-test.envia.com`, producción `https://api.envia.com`

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase.

## shipping-label

Genera guías de Envia desde el admin (modos `rates`, `generate`, `release`). Archivos: `shipping-label/index.js` (entrypoint) + `_shared/shipping.js` + `_shared/envia.js` + `_shared/label.js`.

**Solo admin**: `verify_jwt` activo; la función valida el JWT de la sesión (`auth.getUser`) y que el usuario esté en `admin_users`. La anon key recibe 401; un usuario que no es admin, 403. Compra guías con saldo real de Envia.

**Deploy**: con el MCP de Supabase (`deploy_edge_function`, nombre `shipping-label`, entrypoint `index.js`, `verify_jwt: true`, subiendo los cuatro archivos).

**Secretos obligatorios** (sin ellos, o con otro host, responde "Las guías no están configuradas." y no llama a Envia; nunca usa `ENVIA_BASE_URL`/`ENVIA_API_KEY`):
- `ENVIA_LABEL_BASE_URL`: sandbox `https://api-test.envia.com`, producción `https://api.envia.com`
- `ENVIA_LABEL_API_KEY`: la llave de esa misma cuenta

Sandbox = cuenta de sandbox de Envia aparte, con sus propias paqueterías y saldo de prueba (las guías salen con `label_sandbox = true` y el teléfono del remitente como destinatario). Producción = esos dos secretos con `https://api.envia.com` y la llave real.

**Formatos de impresión** (`shipping_settings.label_print_size`, `PDF`): pendiente de verificar por paquetería con `GET /carrier-print-option?carrier_id=<id>`.
