# G&L (landing e-commerce + WhatsApp) · México

Landing e-commerce mobile-first para ropa de hombre **G&L**, con flujo de compra por **WhatsApp** (sin pagos en línea) y un **panel de vendedores** (CRUD) protegido por login.

## Requisitos
- Node.js (funciona con tu Node 20.17)
- npm

## Cómo correr
- Instalar: `npm install`
- Desarrollo: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

> Nota Windows: este proyecto incluye `.npmrc` con `script-shell=powershell.exe` para evitar problemas con `&` en la ruta del folder.

## Configuración rápida
- Número de WhatsApp de la tienda (formato `52...` sin `+`): editar `STORE_WHATSAPP_NUMBER` en `src/app/config.js`
- Panel admin: usa Supabase Auth (email/password), no credenciales hardcodeadas en frontend.

## Seguridad (prioridad alta)
- Ejecuta `supabase/rls-hardening.sql` en el SQL Editor de Supabase para habilitar políticas RLS.
- El script crea la tabla `public.admin_users`; solo los usuarios presentes ahí pueden administrar productos, pedidos, cupones y uploads.
- Después de crear el usuario admin en Supabase Auth, inserta su `user_id` en `public.admin_users`.
- Mantén activado RLS en `products`, `orders`, `coupons`, `newsletter_subscribers` y usa el bucket `products` para imágenes.

## Rutas
- Público:
  - `#/` Home (CTA principal: **Ver catálogo**)
  - `#/catalog` Catálogo (filtros + agregar al carrito)
  - `#/cart` Carrito (editar cantidades / eliminar)
  - `#/checkout` Checkout (sin pago en línea) → redirección a WhatsApp
- Vendedores:
  - `#/admin/login` Login
  - `#/admin/products` CRUD Productos

## Persistencia
- Catálogo, carrito y sesión admin se guardan en `localStorage`.

### Ver el catálogo “seed” actualizado
Si ya abriste el proyecto antes, probablemente ya tenés productos guardados y el seed no se vuelve a aplicar.
- Opción simple: en el navegador abrí DevTools → Application/Storage → Local Storage y borrá `gl_products`.
- Opción total: borrá todo el Local Storage del sitio.

## WhatsApp
En checkout se genera un mensaje estructurado con:
- Productos, cantidades, precios y total
- Método de pago y entrega
- Dirección (solo si **Transferencia + Envío a domicilio**)
- Datos del cliente

Luego redirige a `wa.me` con el texto precargado.
