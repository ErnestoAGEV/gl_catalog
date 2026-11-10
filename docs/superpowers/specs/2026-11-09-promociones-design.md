# Promociones de temporada (Buen Fin y futuras) — diseño

Fecha: 2026-11-09. Pedido por el dueño; delegó el diseño ("no me hagas preguntas, encárgate tú").

## Intención

El dueño quiere lanzar descuentos automáticos para toda la tienda o para algunas categorías, sin cupón, empezando por el Buen Fin, y repetirlos en promociones futuras sin ayuda técnica. Todo se configura desde el admin. Durante la promoción el cliente ve el precio anterior tachado junto al precio con descuento, y la tienda puede tomar un color de promoción (por ejemplo rojo para el Buen Fin) solo mientras dure.

## Lo que decidió el dueño

1. El descuento se aplica a **toda la tienda** o **por categoría**; él lo escoge en cada promoción.
2. **Productos que ya están rebajados** (con `original_price`): se escoge si entran o no. En esta primera promoción **no entran**, así que el valor por defecto es "no".
3. **Los cupones no se suman al descuento de la promoción.**
4. Todo (porcentaje, alcance, fechas y color) es **personalizable desde el admin** para futuras promociones.
5. Color de promoción opcional y elegible; el rojo es la sugerencia para el Buen Fin.

## Objetivos

- Una sección nueva en el admin, **Promociones** (`/admin/promociones`), con crear, editar, activar o desactivar, y borrar, igual que Cupones.
- La promoción empieza y termina sola según sus fechas. No hay que cambiar ni restaurar ningún precio a mano.
- Lo que se cobra (`place_order`) y lo que se ve en la tienda sale de la misma regla.

## No es objetivo

- Escoger productos sueltos (solo toda la tienda o categorías). Se puede agregar después.
- Cambiar automáticamente la cinta superior o el hero. El dueño ya los edita en Admin → Contenido.
- Acumular varias promociones sobre el mismo producto.

## Fallas que no se aceptan (aunque "funcione")

- Que se cobre un precio distinto al que se mostró.
- Que el admin guarde el precio con descuento como si fuera el precio normal del producto. Hoy el formulario de producto lee `product.price` de `state.products`.
- Que al terminar la promoción algún producto se quede con el precio rebajado.
- Que un cupón se aplique encima del precio de promoción.

## Diseño

### Datos: tabla `promotions` (archivo `supabase/promotions.sql`, idempotente como los demás)

| columna | tipo | nota |
|---|---|---|
| id | uuid pk default gen_random_uuid() | |
| name | text not null | "Buen Fin 2026"; se muestra en la etiqueta del producto |
| discount | numeric not null, check 0 < discount < 1 | fracción, igual que `coupons.discount` |
| categories | text[] not null default '{}' | vacío = toda la tienda; si no, valores de `products.type` (los mismos que usan los cupones) |
| include_on_sale | boolean not null default false | si es false, los productos con `original_price > price` se saltan |
| starts_at | timestamptz not null | |
| ends_at | timestamptz not null, check ends_at > starts_at | |
| accent_color | text null, check `~ '^#[0-9a-fA-F]{6}$'` | null = la tienda conserva su color |
| show_countdown | boolean not null default true | muestra la franja con cuenta regresiva (pedido del dueño) |
| countdown_lead_days | int not null default 3, check between 0 and 30 | cuántos días antes del inicio aparece la franja con "empieza en" |
| active | boolean not null default true | interruptor manual |
| created_at | timestamptz default now() | |

RLS: lectura pública (anon) de las filas `active` con `ends_at > now()` (la tienda necesita conocer también las promociones por empezar, ver Tienda). El admin lee y escribe todo con la misma política de admin que usa `coupons`. Hay que copiar el patrón que ya existe en `rls-hardening.sql`.

### Regla de precio (una sola, en SQL)

`public.promo_price(p public.products) returns numeric`. Si hay una promoción vigente que aplica, devuelve el precio con descuento; si no, devuelve `p.price`.

- **Vigente:** `active and now() >= starts_at and now() < ends_at`.
- **Aplica:** `categories = '{}'` o `p.type = any(categories)`. Además, `include_on_sale` es true o el producto no está rebajado (`original_price is null or original_price <= price`).
- **Si aplican varias:** gana la de mayor `discount`.
- **Redondeo:** `round(p.price * (1 - discount))` a pesos enteros. En JS es `Math.round`, que para positivos da lo mismo.

`place_order` usa `promo_price(v_product)` en lugar de `v_product.price` en cuatro lugares: subtotal, base del cupón, `price` y `subtotal` de la línea.

**Cupones:** una línea cuyo precio de promoción es menor que `price` no cuenta para la base del cupón, sin importar las categorías del cupón. Si el carrito es todo de promoción, el cupón da $0 y `coupon_code` queda null, que ya es lo que pasa cuando el descuento es 0.

Las líneas del pedido guardan además `"promo": "<name>"` y `"list_price": <price>` cuando hubo promoción, para que el admin y los correos puedan mostrarla. Esto es opcional para la UI.

### Tienda (cliente)

- `src/store/promotions.js`: `loadPromotions()` lee las filas activas que no han terminado (pocas). Hay que guardarlas en `state.promotions` y en `localStorage` junto al caché de productos.
- **Regla en JS**, espejo exacto de `promo_price`: `effectivePrice(product, promotions, now)`.
- En `mapRowToProduct` se guardan los valores crudos `basePrice` y `baseOriginalPrice`. Una función `applyPromotions(products)` recalcula a partir de ellos `price`, `originalPrice` (el precio base cuando hay promoción) y `promo` ({ name, discount } o null). Así toda la UI existente (tachado, −X%, "Ahorras", carrito, checkout, JSON-LD) funciona sin tocarla. `applyPromotions` se corre al cargar, tanto desde caché como desde Supabase, y con un temporizador al próximo `starts_at` o `ends_at` dentro de las siguientes 24 h, para que una pestaña abierta cambie sola.
- **Admin:** el formulario de producto y la tarjeta del admin usan `basePrice` y `baseOriginalPrice`; nunca `price` ya modificado. El guardado (`mapProductToRow`) recibe los valores del formulario, así que no cambia.
- **Etiqueta:** en la tarjeta del catálogo y en la ficha, cuando `product.promo` existe, la etiqueta dice "<name> −X%" en lugar de solo "−X%".
- **Cupones en el cliente:** `getDiscountAmount` excluye las líneas con `product.promo`. `applyCoupon` responde "Los cupones no aplican a productos en promoción" cuando todo el carrito está en promoción.
- **Color:** si hay una promoción vigente con `accent_color`, se pone en `document.documentElement` `--color-brand` con ese color. Las variantes `-light`, `-dark`, `-ink`, `-tint` y `-tint-2` se derivan con `color-mix()` contra blanco y negro, en proporciones parecidas a las del azul actual. Al terminar se quitan los overrides. Se aplica en la tienda pública, no en `/admin`.
- **Cuenta regresiva (pedida por el dueño):** una franja delgada en la parte superior de la tienda pública (no en `/admin`), con el color de la promoción, o con `--color-brand` si la promoción no tiene color. Mientras la promoción está en curso dice "<name> · termina en 2d 04:12:33". Durante `countdown_lead_days` antes del inicio dice "<name> · empieza en …". Si hay varias, se muestra la que termina primero entre las que están en curso; si ninguna está en curso, la próxima en empezar. Se actualiza cada segundo con un solo `setInterval`, y al llegar a cero recalcula (`applyPromotions`) y cambia de texto o desaparece. Debe respetar `prefers-reduced-motion`: el texto cambia, pero sin animación. Necesita texto accesible (`role="status"` sin anunciar cada segundo: `aria-live="off"` y una etiqueta con la fecha de fin legible). La franja enlaza a `/catalogo`.
- **Pedido:** `saveOrder` pide el pedido de vuelta (`.select()` sobre el rpc). Si el `total` del servidor difiere del calculado en el cliente (por ejemplo, la promoción terminó con la página abierta), el mensaje de WhatsApp se arma con las líneas y el total del servidor, para que el cliente nunca reciba un total distinto al guardado.

### Admin: página Promociones

Copia la estructura de `adminCoupons.js` (lista, modal, interruptor activo y confirmación al borrar) y se agrega al menú lateral en el grupo "Tienda", junto a Cupones.

Campos del formulario:

- **Nombre** (obligatorio).
- **Descuento %** (1–90).
- **Aplica a:** "Toda la tienda" o "Categorías" con casillas. Las categorías salen de `products.type`, como en Cupones.
- **Incluir productos ya rebajados** (apagado por defecto).
- **Inicio** y **Fin** (`datetime-local`, hora de Colima/CDMX según el navegador del admin; se guardan como timestamptz).
- **Color de la tienda:** muestras rápidas "Sin cambio", Rojo `#D7262B`, Negro `#111111` y un selector libre.
- **Mostrar cuenta regresiva** (encendido por defecto) y **días de aviso antes del inicio** (por defecto 3).
- **Activa.**

En la lista, cada promoción muestra un estado calculado: Programada, En curso, Terminada o Pausada. Antes de guardar, el formulario avisa (sin bloquear) cuando la promoción se encima con otra activa que comparte categorías, y explica que gana la de mayor descuento. Debajo del formulario se muestra una vista previa: "Aplica a N productos (M rebajados quedan fuera)".

## Decisiones tras la revisión (Fable, 2026-11-09), tomadas por Claude

Estas reemplazan lo que diga arriba cuando choquen.

1. **El descuento se guarda en enteros.** Se usa `discount_pct int check (discount_pct between 1 and 90)` en lugar de una fracción. El precio con descuento es `round(price * (100 - pct) / 100)` en SQL y `Math.round(price * (100 - pct) / 100)` en JS. Con precios enteros, el caso de medio peso es exacto en los dos lados. Se verifica con 7 % sobre $250 = $233 y 6 % sobre $1075.
2. **Si el precio cambió, el pedido no se guarda.** `place_order` recibe un parámetro opcional nuevo, `p_expected_total numeric default null`. Si viene y difiere del total calculado, lanza "Los precios cambiaron. Revisa tu bolsa." y no inserta nada. El checkout atrapa ese mensaje, recarga las promociones y vuelve a pintar el resumen. Los clientes viejos que no mandan el parámetro siguen funcionando, porque el valor por defecto es null. La firma vieja se borra, igual que en el cambio anterior de `place_order`. Con esto ya no hace falta pedir el pedido de vuelta para corregir el mensaje.
3. **Envío gratis:** un cupón de envío gratis sigue dando envío gratis durante la promoción. Lo que no se suma es el **porcentaje**: la base del cupón excluye las líneas en promoción, también en la rama de cupón sin categorías (`place-order.sql:194` y `coupons.js:84`). `applyCoupon` solo rechaza cuando el cupón no da envío gratis y todo el carrito está en promoción. Recordar al dueño que quite "Usa WELCOME10" de la cinta durante una promoción de toda la tienda.
4. **Desempate:** `discount_pct desc, starts_at asc, id asc`, en SQL y en JS. El color y la cuenta regresiva salen de la promoción en curso que termina primero, con el mismo desempate.
5. **`product.promo` es null cuando el redondeo deja el mismo precio.** Así coincide con la regla SQL "precio de promoción < price".
6. **Admin y precio base:**
   - El formulario y la tarjeta usan `basePrice` y `baseOriginalPrice`.
   - `updateProduct` y `addProduct`, después de mezclar los cambios, ponen `basePrice` y `baseOriginalPrice` con lo guardado y reaplican promociones antes de `cacheProducts`.
   - `applyPromotions` usa `basePrice ?? price` para los cachés viejos.
   - La comparación "products changed" en `loadProductsFromSupabase` se hace después de aplicar promociones.
7. **Zona horaria:** al guardar, `new Date(datetimeLocal).toISOString()`; al editar, se convierte de vuelta a hora local.
8. **Renombrar una categoría:** `renameCategory` (`src/store/categories.js`) también reemplaza el nombre en `promotions.categories`.
9. **RLS:** la lectura pública solo ve `active and ends_at > now() and starts_at < now() + make_interval(days => greatest(countdown_lead_days, 1))`. Así una promoción programada no se puede leer antes de su aviso.
10. **Color (cambiado por el dueño el 2026-11-09: "no me gusta el rojo en toda la página"):** el color de la promo pinta solo lo que es de la promo: la franja, la etiqueta, el precio con descuento y "Ahorras" (`--color-promo`, clases `.promo-bg` y `.promo-text`). El resto de la tienda conserva su azul, en los dos modos. El admin ofrece "Sin cambio" (usa el azul), Rojo `#D7262B` y un selector libre, y rechaza colores con contraste menor a 4.5:1 contra blanco. El azul fijo de `cart.js:334` se cambia a la variable.
11. **SEO prerender:** el HTML estático conserva el precio base. El JSON-LD del cliente ya muestra el precio de promoción. Se acepta este límite: reconstruir el sitio al inicio y al final de cada promoción queda para después.
12. **Despliegue:** no se crea ni se activa ninguna promoción real hasta que el cliente nuevo esté en producción.

## Agregados aprobados por el dueño (2026-11-09)

- **A1. "Ver promociones":**
  - La franja de la cuenta regresiva lleva un botón que abre `/catalogo?promo=1`.
  - En el catálogo, ese parámetro deja solo los productos con `product.promo` y muestra un chip "En promoción" que se puede quitar.
  - Sin promoción en curso, el parámetro se ignora y se muestra el catálogo completo.
- **A2. Reportes:**
  - En Admin → Reportes va una tarjeta por promoción terminada o en curso con estos datos: pedidos no cancelados entre `starts_at` y `ends_at`, ventas (suma de `total`), ticket promedio, y comparación con el mismo número de días justo antes del inicio.
  - Solo lectura, con los pedidos que el admin ya carga.
- **A3. Envío gratis:** se confirma la decisión 3; los cupones de envío gratis siguen funcionando durante la promoción.

## Restricciones

- Vanilla JS + Tailwind; no se agregan dependencias.
- Supabase en plan gratuito: una consulta pequeña más por carga, que se cachea con los productos.
- El SQL se aplica antes de desplegar el cliente. El cliente viejo en caché sigue funcionando porque `place_order` mantiene su firma.
- Se despliega con commit y push a main, después de la aprobación del dueño.

## Lo que queda a criterio del constructor

- Los nombres internos, salvo los de la tabla y las funciones SQL.
- Las proporciones exactas de `color-mix`, siempre que el texto siga siendo legible (contraste AA sobre `--color-brand`).
- Cómo se ve la etiqueta de promoción, siempre que use los estilos que ya existen.

## Verificación

1. **SQL:** con `set role` y rollback, sobre productos reales, comparar `promo_price` contra la regla en JS en estos casos: toda la tienda, una categoría, un producto rebajado con include_on_sale apagado y encendido, dos promociones encimadas, y antes, durante y después de las fechas.
2. **`place_order` dentro de una transacción con rollback:** un carrito mixto con cupón. El cupón solo debe contar las líneas sin promoción.
3. **Navegador local:** con una promoción de prueba en curso, revisar catálogo, ficha, carrito y checkout (tachado, etiqueta, color) y confirmar que el formulario del admin muestra el precio base. Al pausarla, todo debe volver a como estaba.
4. **Limpieza:** borrar las promociones de prueba; no se manda nada a clientes.
