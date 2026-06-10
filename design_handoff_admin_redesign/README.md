# Handoff: Rediseño del Panel de Administración (G&L Boutique)

## Overview
Rediseño completo de **todas las vistas del admin** de G&L Boutique (la sección `glboutique.com.mx/admin`). El objetivo es unificar las 7 vistas bajo un solo sistema visual **minimalista y analítico** ("data-driven serio"), resolviendo la inconsistencia actual donde el Dashboard estaba muy pulido pero el resto (Órdenes, Newsletter) usaba tablas grises genéricas.

Vistas cubiertas: **Login, Dashboard, Órdenes, Productos (catálogo + formulario), Categorías, Cupones, Newsletter.**

Dirección visual: tema claro, **sidebar "ink" (casi negro)** con acentos azul de marca, tipografía Manrope + Inter + JetBrains Mono (para números/códigos/etiquetas), bordes hairline en lugar de sombras pesadas, esquinas redondeadas moderadas. Densidad balanceada, totalmente responsive (móvil incluido — gestionan pedidos desde el celular).

## About the Design Files
Los archivos en `design_files/` son **referencias de diseño hechas en HTML/CSS/JS vanilla con Tailwind vía CDN**. Son prototipos que muestran el look y el comportamiento deseado — **no son código de producción para copiar tal cual.**

La tarea es **recrear estos diseños dentro del codebase existente de G&L**, que ya tiene su entorno establecido:
- **Stack:** Vanilla JS (ES modules) + **Tailwind CSS v4** (`@import "tailwindcss"` con `@theme` en `src/style.css`) + Vite + Supabase.
- **Las vistas admin viven en** `src/pages/admin/*.js` y exportan funciones `pageAdminX(state)` que devuelven `{ title, html, onMount(root) }`.
- **El chrome del admin** (sidebar + layout) está en `src/components/layout.js` → función `layoutAdmin({ contentHtml, state })`.
- **Los datos son reales vía Supabase** a través de `src/store/index.js` (`getAdminOrders`, `getAdminSubscribers`, `addProduct`, `updateProduct`, `deleteProduct`, `getAdminCoupons`, `createCoupon`, `getCategories`, `reorderCategories`, etc.). El prototipo usa datos mock en `design_files/data.js` **solo para demostración** — al implementar, conecta a los stores reales que ya existen.

> En resumen: **mantén la arquitectura actual** (funciones `pageAdminX` + `onMount` + stores Supabase) y **reemplaza el HTML/estilos** por el nuevo sistema visual documentado aquí.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciados e interacciones son finales. Recrear pixel-perfect usando Tailwind v4 del proyecto. Donde el prototipo usa CSS plano (ver "Notas de implementación"), conviene migrarlo a tokens `@theme` de Tailwind v4.

---

## Design Tokens

Integrar en `src/style.css` bajo `@theme` (Tailwind v4). El proyecto ya define `--color-brand: #214fc7` — estos extienden/refinan esa base.

### Colores
| Token | Hex | Uso |
|---|---|---|
| `ink` | `#15171C` | Fondo del sidebar, títulos fuertes, botón "ink" |
| `ink-2` | `#1B1E25` | Superficie elevada sobre ink |
| `brand` | `#214FC7` | Acción primaria, estados activos, acentos de datos |
| `brand-ink` | `#1A3E9E` | Hover de brand |
| `brand-tint` | `#EAEFFB` | Fondo de avatares, badges, chips suaves |
| `brand-tint-2` | `#F3F6FD` | Fondo de banners informativos / íconos KPI |
| `paper` | `#FFFFFF` | Tarjetas |
| `canvas` | `#F5F6F8` | Fondo de la app |
| `line` | `#E9EAEE` | Bordes hairline |
| `line-strong` | `#DCDEE4` | Borde en hover |
| `body` | `#2B2E36` | Texto de cuerpo |
| `muted` | `#767B86` | Texto secundario |
| `faint` | `#A4A8B2` | Texto terciario / placeholders |
| `ok` / `ok-tint` | `#1E9E6A` / `#E8F6EF` | Éxito (Completado, Activo, En stock) |
| `warn` / `warn-tint` | `#C9821A` / `#FBF1DE` | Advertencia (Pendiente, Bajo stock) |
| `bad` / `bad-tint` | `#D6453E` / `#FBEAE9` | Error (Cancelado, Agotado, Eliminar) |

### Tipografía
- **Display / títulos:** `Manrope` (600, 700, 800). Tracking apretado en titulares (`-0.02em` aprox).
- **UI / cuerpo:** `Inter` (400–700).
- **Mono:** `JetBrains Mono` (400–700) — para **números** (con `font-variant-numeric: tabular-nums`), **códigos de cupón**, y **eyebrows/etiquetas** en mayúsculas.
- **Eyebrow** (etiqueta de sección): JetBrains Mono, `10.5px`, `letter-spacing: 0.18em`, `uppercase`, color `muted`/`faint`.
- Escala usada (px): títulos de página `17–19`, títulos de tarjeta `16`, KPI grandes `28`, número de página/título sección `20`, cuerpo `13.5–14`, secundario `12.5–13`, eyebrow `10.5–11`.

### Radios, sombras, espaciado
- **Radios:** inputs/botones `11px`; tarjetas pequeñas `14px` (`xl2`); tarjetas grandes/contenedores `20px` (`3xl`); pills `999px`.
- **Sombras:** `card` = `0 1px 2px rgba(20,23,28,0.04), 0 1px 1px rgba(20,23,28,0.03)` (muy sutil); `float` (drawers/tooltips) = `0 12px 32px -8px rgba(20,23,28,0.18)`; `pop` (modales) = `0 20px 50px -12px rgba(20,23,28,0.28)`.
- **Filosofía:** preferir **bordes hairline (`line`) + sombra `card` mínima** sobre sombras grandes. Grid de 8px.

### Iconografía
Set de íconos line-style, stroke `1.75`, `viewBox 0 0 24 24`, definidos en `design_files/icons.js` (objeto `window.ICON`). Reusar ese set o el equivalente del proyecto (mismo peso de trazo y estilo).

---

## Componentes compartidos (ver `design_files/ui.js`)

- **`statCard`** — Tarjeta KPI: `paper`, borde `line`, radio `14px`, padding `20px`. Eyebrow arriba-izq, ícono en cuadro `32px` arriba-der (fondo `brand-tint-2`/`brand`), valor grande Manrope 800 `28px` con `tabular-nums`, fila inferior con delta (verde `ok` ▲ / rojo `bad` ▼) + texto `faint`.
- **`statusPill(status)`** — Pill `22px` alto, radio full, con punto de color + label. Mapa: Completado→`ok`/`ok-tint`, Pendiente→`warn`/`warn-tint`, Cancelado→`bad`/`bad-tint`.
- **`toggle`** — Interruptor `38×22px`, off `#D6D9E0`, on `brand`, knob blanco `18px` que se desliza `16px`. **Importante:** debe ser `display:inline-block` para que tome tamaño dentro de cualquier botón.
- **`openOverlay(html, {side})`** — Host de modal/drawer. `side:'right'` = drawer lateral `max-w-460px` que entra deslizando; sin `side` = modal centrado `max-w-md` con pop. Backdrop `rgba(21,23,28,0.45)`. Cierra con click en backdrop, botón `[data-ov-close]`, o tecla Esc.
- **`toast(msg, type)`** — Notificación inferior-centro, fondo `ink`, ícono de color según tipo (success/error/info), auto-cierra ~2.6s.
- **`empty({icon,title,sub})`** — Estado vacío centrado con ícono en cuadro `canvas`.
- **`sparkline`, `relTime`, `dateShort`, `timeShort`** — utilidades de datos/fecha en español MX.
- **Inputs (`.fld`):** fondo `paper`, borde `#E1E3E9`, radio `11px`, padding `10px 13px`, focus = borde `brand` + ring `rgba(33,79,199,.12)` 3px. Labels (`.lbl`): `11px`, 600, uppercase, `muted`.
- **Botones:** `.btn-primary` (brand→brand-ink hover), `.btn-ghost` (paper + borde line), `.btn-ink` (ink→#2B2E36). Alto base ~`40px`, radio `11px`, peso 600.
- **Segmented control (`.seg`):** fondo `#EEEFF2`, ítems `paper` + sombra al activarse.

---

## Chrome: Sidebar + Topbar (recrear en `layoutAdmin`)

### Sidebar (desktop, fijo, ancho `264px`, fondo `ink`)
- **Header:** cuadro blanco `36px` con "G&L" en Manrope 800 ink + "G&L Boutique" (blanco, 14.5px, nowrap) + eyebrow "PANEL ADMIN" en azul claro `#8CA2DC`.
- **Nav agrupada** por secciones con eyebrow de grupo (`Panel`, `Operación`, `Catálogo`, `Clientes`): Dashboard / Órdenes, Productos / Categorías, Cupones / Newsletter. Ítem activo: fondo `rgba(255,255,255,.10)`, texto blanco, **riel blanco de 3px** a la izquierda (animado scaleY). Inactivo: `rgba(255,255,255,.55)` → blanco en hover con `rgba(255,255,255,.06)`.
- **Footer:** "Ver tienda" + bloque de usuario (avatar `brand`, "Gerencia" / email) + botón logout.
- **Móvil:** el sidebar se vuelve **drawer** que entra desde la izquierda con backdrop; se abre con botón hamburguesa del topbar. (El proyecto ya tiene esta lógica en `layout.js`.)

### Topbar (sticky, alto `64px`, fondo `rgba(245,246,248,0.85)` + blur, borde inferior `line`)
- Botón menú (solo móvil), título de la vista (Manrope 700, 17–19px), a la derecha: fecha actual en español (capitalizada) + botón campana con punto azul de notificación.

---

## Vistas

> Datos mock en `design_files/data.js`; al implementar, usar los stores Supabase reales. Toda la copia (textos) está en español MX.

### 1. Login (`pageAdminLogin`) — pantalla completa, sin sidebar
- **Layout split:** izquierda (form, fondo `paper`/canvas) + derecha `~46%` (panel `ink`, oculto en móvil).
- **Izquierda:** logo arriba; centrado: eyebrow "ACCESO RESTRINGIDO" (brand), título "Panel de administración" (Manrope 800, 28px), subtítulo, campos Email + Contraseña (con botón ojo show/hide), caja de error (`bad-tint`), botón primario alto `48px` "Ingresar al panel", divisor "o", link "Volver a la tienda". Footer de copyright.
- **Derecha (ink):** halos azules difuminados (`rgba(33,79,199,.38)` y `.20`, blur 100px), badge "✦ DESDE 1995", titular "Tu fit, perfecto." (Manrope 800, 44–52px), descripción, 3 stats (18 Productos / 340+ Pedidos / 2 Tiendas), ubicación al pie.
- **Comportamiento:** validación de campos vacíos; submit muestra "Ingresando…" y navega a `/admin/dashboard`. Conservar el **anti-brute-force progresivo** que ya existe en el login actual.

### 2. Dashboard (`pageAdminDashboard`)
- **Header:** eyebrow "RESUMEN EJECUTIVO", saludo "Hola, Gerencia 👋", subtítulo dinámico, **selector de rango segmentado 7/30/90 días** a la derecha.
- **4 KPIs** (`statCard`): Ingresos, Órdenes, Ticket promedio, Suscriptores — cada uno con delta y pie.
- **Grid 2/3 + 1/3:**
  - **Izq — "Ingresos por día":** gráfica de **barras** (una por día) en `paper` radio 20px. Líneas de cuadrícula punteadas con etiquetas `$k` a la izquierda; barras `rgba(33,79,199,.24)`, **el mejor día en `brand` sólido**; tooltip en hover (bubble `ink`). Debajo: fila con Promedio diario / Mejor día / Pedidos pagados. Esquina sup-der: "Ventas hoy".
  - **Der — "Estado de pedidos":** **dona SVG** (Completado verde / Pendiente ámbar / Cancelado rojo) con % de éxito al centro + leyenda con conteos. Debajo: alerta de inventario (bajo stock / agotados) con link a Productos.
- **Grid 2/3 + 1/3 inferior:** Izq "Pedidos recientes" (lista de 6, avatar + nombre + id/tiempo + total + statusPill). Der: "Más vendidos" (top 4 con ranking) + tarjeta `ink` "Acciones rápidas" (Agregar producto / Crear cupón) con halo azul.
- **Cálculos:** ingresos = suma de pedidos `completado` en el rango; ticket = ingresos/pedidos pagados; buckets diarios; top productos por `qty` de `cart_items`. (La lógica ya existe en el `adminDashboard.js` actual — reusar, solo cambia la presentación.)

### 3. Órdenes (`pageAdminOrders`)
- **4 KPIs:** Total pedidos, Ingresos confirmados, Pendientes de pago, Ticket promedio.
- **Toolbar** en tarjeta: búsqueda (cliente / # pedido / teléfono) + **chips de filtro por estado** (Todas/Completados/Pendientes/Cancelados) con conteo cada uno; chip activo en `ink`.
- **Tabla desktop:** columnas Pedido (#id + método de pago con ícono), Cliente (avatar + nombre + WhatsApp), Fecha, Total (alineado der.), Estado (**dropdown inline** que cambia el estado), Acción ("Ver →"). Hover de fila `canvas`. Click en la fila abre el detalle.
- **Móvil:** tarjetas apiladas con la misma info.
- **Drawer de detalle** (lado derecho): header con #pedido + botón cerrar; **acciones** (WhatsApp, Imprimir, Copiar dirección, Copiar resumen); tarjeta de cliente; grid de meta (Estado, Pago, Fecha, Entrega); dirección de envío; lista de productos (qty × nombre, talla, subtotal); footer con Subtotal + **Total**. Conservar la lógica real existente (imprimir, copiar, abrir WhatsApp, notificación de pedido nuevo con sonido + realtime de Supabase).

### 4. Productos (`pageAdminProducts` + `adminProductForm`)
- **3 mini-stats:** Catálogo (total), Bajo stock (ámbar), Agotados (rojo) + botón "Agregar producto".
- **Toolbar:** búsqueda + select Categoría + select Stock (Con stock / Bajo / Agotados) + **toggle vista lista/grid**.
- **Tabla:** Producto (thumbnail de color + nombre + badge + swatches de color), Categoría (chip), Precio (con precio anterior tachado), Stock (badge: `N uds` / `N · bajo` ámbar / `Agotado` rojo / `∞ Ilimitado`), Estado (**toggle Publicado/Borrador**), Acciones (editar/eliminar).
- **Vista grid:** tarjetas con tile de color (placeholder), badge, acciones en hover, nombre, precio, stock.
- **Thumbnails:** placeholders de color (primer color del producto) con ícono de categoría — **al implementar, usar la imagen real del producto** (`product.images[0]`).
- **Formulario (drawer derecho):** Imágenes (dropzone + grid de 5, la primera = portada), Nombre, Categoría, Etiqueta, bloque Precio/Precio antes/Stock, **Tallas** (pills toggle — cambian a capacidades ml si la categoría es Perfumes), **Colores** (pills con swatch; ocultos para Perfumes). Footer Cancelar / Guardar. Validación: nombre y precio > 0 requeridos. Conservar **compresión de imágenes a webp** y subida a Supabase que ya existe.
- **Eliminar:** modal de confirmación centrado (ícono `bad-tint`, "Esta acción no se puede deshacer").

### 5. Categorías (`pageAdminCategories`) — ancho máx ~`3xl`, centrado
- Header con conteo (N categorías · M visibles) + botón "Nueva".
- **Banner informativo** (`brand-tint-2`) explicando que el orden define el orden en la tienda.
- **Lista de filas** (`paper`, borde `line`): flechas arriba/abajo para reordenar, número de orden `01`, nombre + badge "Oculta" si inactiva, conteo de productos, **toggle activo/oculto**, editar, eliminar (editar/eliminar aparecen en hover).
- Modales de crear/editar nombre. **No permitir eliminar** categorías con productos asignados (toast de error). Conservar `reorderCategories` real.

### 6. Cupones (`pageAdminCoupons`)
- Header (N cupones · M activos) + "Crear cupón".
- **Grid de tarjetas tipo ticket** (con muescas/notches circulares a los lados): badge Activo/Inactivo, **código en mono** grande, descripción, dos cajas (Descuento % / Envío gratis ✓), pie con "Toda la tienda" o "N categoría(s)" + toggle activo. Tarjetas inactivas atenuadas.
- **Modal crear/editar:** Código (mono, uppercase, solo A-Z0-9; readonly al editar), Descuento %, Descripción, checkboxes de **categorías aplicables** (vacío = toda la tienda), toggles Envío gratis y Activo. Conservar `createCoupon`/`updateCoupon` y guardado de `discount` como decimal (25% → 0.25).

### 7. Newsletter (`pageAdminNewsletter`)
- **3 KPIs:** Suscriptores (con delta últimos 7 días), Nuevos esta semana, Dominio principal (@dominio + conteo).
- **Toolbar:** búsqueda de correo + botón "Exportar CSV".
- **Tabla:** Suscriptor (avatar con inicial + email), Fecha de registro (fecha + hora), Estado (pill "Activo" verde). Versión móvil en tarjetas.

---

## Interacciones & comportamiento (transversal)
- **Navegación:** las vistas se montan en el `<main>` del layout admin; conservar el router actual (`src/core/router.js`) y rutas `/admin/...`.
- **Animaciones:** entrada de vista con `translateY` sutil (sin opacidad para no romper en estados sin repaint). Drawers entran deslizando (`.32s` cubic-bezier `.22,.61,.36,1`). Modales con pop. Toggles `.2s`. Respetar `prefers-reduced-motion`.
- **Estados:** loading (spinner/skeleton), vacío (`empty`), error (toast). Validación de formularios con mensajes en español.
- **Responsive:** sidebar→drawer en móvil; tablas→tarjetas en `<768px`; targets táctiles ≥44px.

## State Management
Reusar los stores existentes (`src/store/*`). El prototipo mantiene estado local en cada vista (filtros, búsqueda, página, modo lista/grid, sets de tallas/colores seleccionados, estado de pedidos editado). Persistencia de filtros de productos en `sessionStorage` ya existe — conservarla.

## Assets
- **Logo:** `design_files` referencia "G&L" como wordmark; usar `/public/logo.png` real del proyecto.
- **Íconos:** set line-style en `icons.js` (o el equivalente del proyecto).
- **Imágenes de producto:** los tiles de color son placeholders — usar `product.images` reales.
- Sin imágenes externas ni dependencias nuevas (Tailwind y fuentes ya están en el proyecto).

## Notas de implementación (importante)
1. El prototipo usa **Tailwind por CDN** y define varias utilidades de color (`bg-ok-tint`, `bg-brand-tint`, etc.) como **CSS plano** en `<style>` porque el CDN no genera de forma fiable utilidades de color anidadas inyectadas en runtime. En tu **Tailwind v4 compilado esto NO es problema** — define los colores en `@theme` y usa las clases normalmente.
2. El `.gl-toggle` necesita `display:inline-block` para tomar tamaño.
3. Los **números** deben usar `tabular-nums` (clase `.tnum`).
4. Mantén la separación actual: HTML como template string en `pageAdminX`, lógica en `onMount(root)`.

## Files (en `design_files/`)
- `G&L Admin.html` — shell: tokens, fuentes, config Tailwind, `<style>` con utilidades.
- `app.js` — router + sidebar + topbar.
- `ui.js` — componentes compartidos (statCard, statusPill, toggle, openOverlay, toast, empty, utilidades).
- `icons.js` — set de íconos (`window.ICON`).
- `data.js` — datos mock (reemplazar por stores Supabase).
- `views_dashboard.js`, `views_orders.js`, `views_products.js`, `views_categories.js`, `views_coupons.js`, `views_newsletter.js`, `views_login.js` — una por vista.
