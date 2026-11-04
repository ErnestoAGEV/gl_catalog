# Guía de tallas por corte — diseño

Fecha: 2026-11-03 · Tienda g&l (vanilla JS + Tailwind + Supabase + Vercel)

## Por qué

La duda que más llega por WhatsApp antes de comprar ropa es la talla. El dueño hoy contesta con medidas de la prenda (largo, ancho de hombros, etc.), que saca de la tabla del proveedor o mide él mismo en la tienda. Si esas medidas se ven en la ficha del producto, llegan menos preguntas y hay menos cambios.

El punto clave del dueño: **la guía es del corte, no del producto.** Un "Oggi - Vaxter" negro, azul o blanco, de gabardina o mezclilla, mide igual. Capturar la guía producto por producto sería inmanejable; se captura una vez por marca + corte y aplica sola a los productos actuales y a los que se den de alta después.

## Metas

- El cliente ve las medidas reales de la talla que elige, sin salir de la ficha.
- El dueño captura cada guía una sola vez y no tiene que hacer nada al dar de alta un producto nuevo de un corte que ya tiene guía.
- Los 10 polos White Peak, que hoy tienen la guía como foto, pasan al formato nuevo.

## No metas

- Calculadora de talla por altura/peso/edad (como la de oggi.mx). Es otro proyecto.
- Guías para perfumes (no tienen tallas).
- Convertir unidades (pulgadas). Todo en cm.
- Disponibilidad por tienda o "llega en 1–2 días": es el siguiente proyecto, va aparte.

## Anti-metas (sería un fracaso aunque funcione)

- Que un producto sin guía muestre una caja vacía o un "próximamente".
- Que el dueño tenga que tocar cada producto para ligarlo a su guía.
- Que una medida equivocada se vea con autoridad: si la guía no coincide con el producto (por ejemplo, otro corte), es peor que no mostrar nada. Por eso el dueño tiene que poder ver qué guía le tocó a cada producto.

## Lo que decidió el dueño

1. **Una guía por marca + corte.** Ejemplo: "Oggi" + "Vaxter". El Vaxter de gabardina y el de mezclilla miden igual, así que una guía cubre a todos.
2. **Cómo se ve: opción B del boceto.** Al tocar una talla en la ficha, sus medidas aparecen justo encima del botón "Agregar" (por ejemplo, *Cintura 82 cm · Largo 105 cm · Tiro 26 cm*) y cambian al tocar otra talla. Un enlace "Ver tabla completa" muestra todas las tallas, con la talla elegida resaltada, la nota de la guía y un enlace a WhatsApp para dudas.
3. **Los White Peak también pasan a tabla**, tomando las medidas de su foto actual (abajo).
4. Las medidas las captura el dueño en el admin; vienen del proveedor o las mide él.

## Cómo funciona

### Qué guía le toca a un producto

Los nombres de producto tienen la forma `Marca - Corte Variante Color`, por ejemplo "Oggi - Vaxter Gabardina Khaki", "Oggi - Vaxter Super Gabardina Khaki", "Oggi - Chinos Slim", "White Peak - Amarillo".

Una guía tiene **marca** (obligatoria), **tipo de prenda** (obligatorio, una de las categorías de la tienda: Pantalones, Polos, Camisas…) y **corte** (opcional). Una guía aplica a un producto cuando se cumplen las tres:

1. La marca del producto, según `productBrand()` (`src/utils/productCopy.js`), es la marca de la guía. Se usa `productBrand` y no el texto crudo porque los nombres traen variantes: "Collor's", "Collor’s" y "Collor`s" existen hoy en la base, y hay nombres sin espacio antes del guion ("Collor's -Bermuda").
2. El `type` del producto es el tipo de prenda de la guía. **Decisión mía:** White Peak vende 10 polos y 5 pantalones; sin este filtro, la guía de polos de White Peak se les pegaría a los pantalones.
3. Si la guía tiene corte, el modelo del producto (lo que va después de la marca, `productModel()` o equivalente) empieza con ese corte, comparando por palabras completas y sin distinguir mayúsculas ni acentos, para que "Vaxter" no coincida con "Vaxters". Una guía sin corte aplica a toda la marca dentro de ese tipo de prenda: así queda White Peak · Polos.

Si varias guías aplican, gana la de corte más largo. Ejemplo: "Oggi · Vaxter Super" le gana a "Oggi · Vaxter" para "Oggi - Vaxter Super Gabardina Khaki". Si ninguna aplica, el producto no tiene guía. Los productos sin marca (los que `productBrand` resuelve como "G&L") no reciben guía.

**Decisión del constructor:** si además conviene permitir que un producto apunte a una guía a mano, que lo proponga; el dueño no lo pidió. Lo mínimo es que el formulario del producto muestre qué guía detectó.

### Qué guarda una guía

- Marca, tipo de prenda, corte (opcional) y un nombre visible (ej. "Oggi · Vaxter").
- Columnas: lista ordenada de nombres de medida. Al crear la guía se proponen según el tipo de prenda y el dueño puede renombrar, quitar o agregar columnas:
  - Pantalones y shorts: Cintura, Largo, Tiro.
  - Playeras, camisas, polos y suéteres: Largo, Hombros, Pecho.
  - Zapatos: Largo de plantilla.
- Filas: una por talla, con el texto de la talla tal como aparece en los productos (30, 32…, S, M, L…) y un valor por columna. Los valores son texto corto, para permitir "82" o "82–84".
- Nota opcional (ej. "Medido con la prenda acostada. Si estás entre dos tallas, pide la mayor.").
- Unidad: cm, fija.

### Ficha del producto (`src/pages/product/product.js`)

- Si el producto tiene guía y la talla seleccionada tiene fila, se muestran sus medidas encima del botón Agregar. Si la talla no está en la guía, no se muestra nada para esa talla. Si no hay talla seleccionada, tampoco.
- "Ver tabla completa" abre la tabla de todas las filas de la guía, aunque incluya tallas que el producto no maneja (la guía de White Peak llega a XXXXL y los polos solo a XXL), con la talla elegida resaltada.
- Si un producto tiene guía en tabla y además foto de guía, gana la tabla y la foto no se muestra. La foto sigue fuera de la galería como hoy (`splitGalleryImages`).
- Si no hay tabla pero sí foto, se mantiene el botón de foto actual. No se rompe ningún producto que hoy funciona.
- Sin guía de ningún tipo: la ficha queda exactamente como hoy.
- Todo texto que venga de la guía va escapado (`escapeHtml`), como el resto de la ficha.
- Accesible: las medidas que cambian al elegir talla se anuncian a lectores de pantalla (región `aria-live` educada) y la tabla completa es una tabla real con encabezados.

### Admin

- Sección nueva **"Guías de tallas"** en el menú, junto a Categorías (`src/components/layout.js`, `src/core/views.js`).
- Lista de guías, mostrando a cuántos productos aplica cada una (ayuda a detectar un corte mal escrito).
- Crear, editar y borrar una guía: marca, corte, nota, columnas y filas. Agregar o quitar filas y columnas.
- En el formulario de producto (`adminProductForm.js` / `adminProducts.js`), una línea de solo lectura: "Guía de tallas: Oggi · Vaxter", o "Sin guía de tallas". **Decisión mía:** se actualiza en vivo mientras el dueño escribe la marca, el modelo o cambia el tipo, usando el nombre armado antes de guardar (`adminProducts.js:687-689`), para que vea si un producto nuevo agarra guía antes de guardarlo.

### Datos (Supabase)

- Tabla nueva para las guías. El diseño de columnas (jsonb para columnas y filas, o tablas normalizadas) queda a criterio del constructor; una sola tabla con jsonb basta para este volumen.
- RLS con el patrón vigente desde la auditoría del 2026-11-03: lectura pública, y escritura (insert, update, delete) solo `to authenticated` con `exists (select 1 from admin_users a where a.user_id = auth.uid())`. **Ninguna** política con `true` para escribir: las políticas se suman con OR y una sola permisiva anula todo (ver `supabase/drop-legacy-policies.sql`).
- Guardar la migración como archivo `.sql` en `supabase/`, como las demás.
- Plan gratuito: la tabla es diminuta y se lee una vez al cargar el catálogo, como `categories`. No agrega fotos al Storage.

### Migración de White Peak (datos iniciales)

Crear la guía **White Peak · Polos (sin corte)** desde la foto `…guia-de-tallas-white-peack.jpeg`, que es idéntica en los 10 productos. La foto dice "White Peack - Polo Clasica", con las columnas Talla / Largo / Ancho, en cm:

| Talla en la foto | Talla en la tienda | Largo | Ancho |
|---|---|---|---|
| CH | S | 67 | 50 |
| M | M | 68 | 55 |
| G | L | 72 | 58 |
| XL | XL | 75 | 60 |
| XXL | XXL | 77 | 64 |
| XXXL | XXXL | 80 | 65 |
| XXXXL | XXXXL | 82 | 67 |

Nota de la guía: "Todas las medidas están en centímetros."

Decisiones mías: CH→S y G→L para que coincidan con los botones de talla; la columna se queda como "Ancho", tal como la nombra la foto. Las fotos no se borran del Storage ni de los productos: con la tabla dejan de mostrarse, y si se borra la guía vuelven a funcionar.

## Restricciones

- Vanilla JS + Tailwind, sin dependencias nuevas. Reusar helpers existentes (`escapeHtml`, `productBrand`, `qs`/`on` de `utils/dom.js`, el patrón de páginas admin).
- La guía vive solo del lado del cliente. Aunque las fichas se prerenderizan (`scripts/prerender.mjs`), el cliente quita `#prerender-shell` y vuelve a pintar la ficha desde `state` (`src/core/startApp.js`), así que no hace falta tocar el prerender. Para SEO no se necesita.
- Las tallas de letra se guardan como S, M, L, XL… El dueño está evaluando mostrarlas como CH, M, G, EG. Eso es un proyecto aparte y solo cambiaría cómo se muestran, no los datos; la guía guarda las filas con las mismas tallas que los productos (S, M, L…), así que sigue funcionando sin cambios.
- Despliegue = commit + push a `main`. Editar productos dispara reconstrucción por el deploy hook; editar guías no necesita hacerlo si la guía se lee en el cliente.
- Pruebas: la detección guía↔producto es lógica nueva y lleva su prueba en `scripts/` (el patrón `test-*.mjs` que corre `npm test`), con al menos: Vaxter general vs. Vaxter Super, marca sin corte (White Peak · Polos aplica a "White Peak - Amarillo" pero no a un pantalón White Peak), "Vaxter" no coincide con "Vaxters", acentos y mayúsculas, variantes de apóstrofo ("Collor's" / "Collor’s" / "Collor`s"), y producto sin guía. Usar nombres reales de la base, por ejemplo "Oggi - Vaxter Super Gabardina Khaki" y "Oggi - Chinos Slim". El test de escapado del admin (`scripts/test-admin-escaping.mjs`) debe seguir pasando.
- Verificación en navegador antes de dar por terminado: ficha con guía (pantalón Oggi Vaxter y polo White Peak), ficha sin guía (queda igual), admin crear/editar una guía y el formulario de producto mostrando la guía detectada.

## Lo que queda al constructor

- Forma exacta de la tabla en Supabase y de su RLS (dentro de la regla de arriba).
- Diseño visual fino, siguiendo el estilo actual de la ficha (etiquetas mono en mayúsculas, píldoras de talla, azul de marca) y del admin rediseñado.
- Si "Ver tabla completa" abre un modal, una hoja inferior en celular o un desplegable.
- Cómo se carga la guía (junto con productos/categorías o aparte) y su caché.
- Si conviene una opción para ligar un producto a una guía a mano (ver arriba).
