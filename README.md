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
- Credenciales del panel: editar `ADMIN_CREDENTIALS` en `src/app/config.js`

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
