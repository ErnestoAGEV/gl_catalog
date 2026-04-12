# 🛍️ G&L — Tu fit perfecto

**E-commerce de moda masculina** con catálogo en línea, carrito de compras y cierre de venta por **WhatsApp**. Incluye panel administrativo completo para gestión de productos, pedidos, cupones y newsletter.

🌐 **[glboutique.com.mx](https://www.glboutique.com.mx)**

---

## ✨ Características

### Tienda
- 🏠 Landing page con hero editorial y categorías destacadas
- 📦 Catálogo con filtros por categoría, búsqueda y paginación
- 🛒 Carrito de compras persistente
- 💬 Checkout con generación automática de mensaje WhatsApp
- 🎟️ Sistema de cupones de descuento
- 🌙 Modo oscuro / claro
- 📱 PWA instalable (Progressive Web App)
- ⚡ SPA con navegación instantánea y caché de vistas

### Panel Administrativo
- 📊 Dashboard con métricas de ventas en tiempo real
- 📋 Gestión de pedidos (estados, historial)
- 🏷️ CRUD de productos con drag & drop de imágenes
- 🎟️ Gestión de cupones
- 📧 Newsletter (suscriptores)
- 🔔 Notificaciones en tiempo real de nuevos pedidos
- 🔐 Autenticación con Supabase Auth + RLS

## 🛠️ Tech Stack

| Tecnología | Uso |
|---|---|
| **Vite** | Build tool & dev server |
| **Vanilla JS** | Sin frameworks — JavaScript puro con módulos ES |
| **TailwindCSS v4** | Diseño responsive y utilidades CSS |
| **Supabase** | Base de datos (PostgreSQL), Auth, Storage y Realtime |
| **Vercel** | Hosting y deploy automático |
| **Service Worker** | Caché offline (PWA) |

## 📁 Estructura del Proyecto

```
g&l/
├── index.html              # Entry point HTML
├── vercel.json             # Config de deploy (rewrites, headers, CSP)
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker
│   ├── robots.txt          # SEO
│   ├── sitemap.xml         # Sitemap para Google
│   └── *.png / *.webp      # Assets estáticos (logo, banners, iconos)
├── src/
│   ├── main.js             # Punto de entrada JS
│   ├── style.css           # Estilos globales + Tailwind
│   ├── app/
│   │   ├── config.js       # Constantes de marca (nombre, WhatsApp, envío)
│   │   ├── router.js       # SPA router (history API)
│   │   ├── views.js        # Definición de rutas y SEO por página
│   │   ├── startApp.js     # Bootstrap de la app
│   │   ├── store.js        # Estado global + Supabase CRUD
│   │   ├── seo.js          # Meta tags dinámicos (canonical, OG, Twitter)
│   │   ├── supabase.js     # Cliente Supabase
│   │   └── ...             # Toast, formato, sanitización, etc.
│   ├── components/
│   │   └── layout.js       # Layout público y admin
│   └── pages/
│       ├── home.js         # Página de inicio
│       ├── catalog.js      # Catálogo de productos
│       ├── product.js      # Detalle de producto
│       ├── cart.js          # Carrito
│       ├── checkout.js     # Checkout → WhatsApp
│       ├── admin*.js       # Páginas del panel admin (lazy-loaded)
│       └── ...
└── supabase/
    └── rls-hardening.sql   # Políticas de seguridad RLS
```

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Build de Producción

```bash
npm run build
npm run preview    # Vista previa del build
```

> **Nota Windows:** El proyecto incluye `.npmrc` con `script-shell=powershell.exe` para evitar problemas con `&` en la ruta de la carpeta.

## ⚙️ Configuración

### Variables de Entorno (`.env`)

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_WHATSAPP_NUMBER=523121018263
VITE_BRAND_NAME=G&L
```

### WhatsApp

El número de WhatsApp se configura en `.env` o directamente en `src/app/config.js`. En el checkout se genera un mensaje estructurado con productos, cantidades, precios, método de pago y datos del cliente.

## 🔒 Seguridad

1. Ejecuta `supabase/rls-hardening.sql` en el SQL Editor de Supabase
2. Crea un usuario admin en Supabase Auth
3. Inserta su `user_id` en la tabla `public.admin_users`
4. Mantén RLS activado en todas las tablas

## 🗺️ Rutas

### Públicas
| Ruta | Página |
|---|---|
| `/` | Home — hero, categorías, productos destacados |
| `/catalog` | Catálogo con filtros y búsqueda |
| `/producto/:id` | Detalle de producto |
| `/cart` | Carrito de compras |
| `/checkout` | Formulario de compra → WhatsApp |
| `/checkout/success` | Confirmación de pedido |

### Administrativas (protegidas)
| Ruta | Página |
|---|---|
| `/admin/login` | Login |
| `/admin/dashboard` | Dashboard de ventas |
| `/admin/products` | CRUD de productos |
| `/admin/orders` | Gestión de pedidos |
| `/admin/coupons` | Gestión de cupones |
| `/admin/newsletter` | Suscriptores |

## 📄 Licencia

Proyecto privado — Todos los derechos reservados © 2026 G&L
