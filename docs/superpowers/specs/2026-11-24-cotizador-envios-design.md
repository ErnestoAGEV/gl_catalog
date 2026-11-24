# Cotizador de envíos y guías con Envia.com — diseño

Fecha: 2026-11-24. Pedido por el dueño y su mamá (las que atienden los pedidos).

## Intención

Hoy el cliente que pide envío a domicilio no sabe cuánto le cuesta hasta que la tienda se lo dice por WhatsApp. La tienda le pide opciones a un revendedor de guías (también por WhatsApp), escoge la más barata que llegue rápido, y le pasa el costo al cliente. Esa espera hace que **se pierdan ventas** y genera **ir y venir por WhatsApp**.

Se quiere: que el cliente vea el costo del envío en el checkout al instante, y que la tienda genere y pague la guía desde el admin, sin intermediario.

## Lo que decidió el dueño

1. Usar **Envia.com** (API) para cotizar en el checkout y para generar la guía. El dueño ya comparó: **Envia le da guías más baratas que su revendedor** (condición cumplida, 2026-11-24).
2. El cliente elige entre **Estándar** y **Express**.
3. Al cliente se le cobra el precio que cotiza Envia **redondeado hacia arriba al siguiente múltiplo de $5** (termina en 0 o 5), en ambas opciones, para no tener pérdidas. Ej.: $187.30 → $190; $185.00 → $185; $180.01 → $185. El redondeo se hace en el servidor (`shipping-quote`) y se guarda ya redondeado; el costo real de Envia también se guarda para el admin.
4. Pesos promedio por categoría (aprobados):

   | Categoría (`products.type`) | Peso | Empaque |
   |---|---|---|
   | Playeras | 250 g | sobre |
   | Polos | 300 g | sobre |
   | Camisas | 350 g | sobre |
   | Shorts | 350 g | sobre |
   | Pantalones | 650 g | sobre |
   | Suéteres | 600 g | sobre |
   | Perfumes, Perfumes Dama | 600 g | caja |
   | Zapatos | 1.5 kg | caja |

5. Empaque: **sobre por defecto**; **caja** si el pedido trae una categoría marcada "caja" o si el peso total pasa el límite de sobre.
6. **Envío gratis (ya existe en el sitio):** cuando aplica (`BRAND.freeShippingMin` = $1,499 o cupón con `free_shipping`, con la misma regla que hoy usa el carrito, evaluada en el servidor), **Estándar cuesta $0** y **Express cobra solo la diferencia** entre el precio redondeado de Express y el de Estándar. La guía la paga la tienda. Los textos de "Envío gratis desde $1,499" se quedan.
7. **Paqueterías permitidas: solo Estafeta, FedEx y DHL** (nada de Castores ni otras). Lista editable en Ajustes de envío; ambas funciones filtran por ella.

## Objetivos

- Checkout, envío a domicilio: al tener CP válido y carrito, mostrar Estándar y Express con precio y días estimados; el cliente elige uno; el total mostrado incluye el envío.
- El pedido guarda la opción elegida y su costo en `orders.shipping_cost` (columna ya existente), así que la hoja impresa y el resumen de WhatsApp del admin ya lo muestran sin cambios.
- Admin → detalle del pedido: botón **Generar guía** (solo con envío a domicilio y sin guía previa). Muestra las opciones actuales de Envia, preselecciona la que corresponde a lo que eligió el cliente, permite cambiar sobre/caja, genera la guía y guarda PDF + número de rastreo + paquetería en el pedido.
- Admin → nueva sección de ajustes de envío: peso por categoría, marca sobre/caja por categoría, medidas de la caja estándar, medidas y peso máximo del sobre, CP de origen y datos del remitente.

## No es objetivo (se puede agregar después)

- Página o correo de rastreo para el cliente.
- Generar la guía automáticamente al hacer el pedido (el pago llega después por WhatsApp; se pagarían guías de pedidos que no se concretan).
- Cotizar "Pago al recoger" (sigue igual).
- Cancelar guías desde el admin (se hace en el panel de Envia).
- Pedidos manuales desde admin: es un proyecto aparte que se diseña después.

## Fallas que no se aceptan (aunque "funcione")

- Que el monto de envío cobrado venga del navegador. El precio debe salir de una cotización guardada en el servidor; `place_order` lo lee de ahí.
- Que la llave de la API de Envia llegue al navegador.
- Que si Envia falla o tarda, el cliente no pueda hacer su pedido.
- Que se genere una guía dos veces para el mismo pedido (doble cargo al saldo).
- Que alguien que no es admin pueda generar guías.

## Diseño

### Estándar y Express

De las tarifas que regresa Envia para el paquete:
- **Estándar** = la más barata.
- **Express** = la de menos días estimados; si empata en días, la más barata de ellas. Solo se muestra si llega **al menos 1 día antes** que Estándar. Si no, el cliente ve una sola opción.

### Servidor: Supabase Edge Functions

El proyecto no tiene backend propio; ya usa Supabase. Dos funciones nuevas en `supabase/functions/` con la llave de Envia como secreto (`ENVIA_API_KEY`):

1. **`shipping-quote`** (pública). Recibe `{ zipCode, items: [{ productId, qty }] }`. Lee categorías de `products`, calcula peso y empaque con los ajustes, cotiza en Envia (varias paqueterías), elige Estándar/Express, guarda las opciones en una tabla `shipping_quotes` (id, opciones, peso, empaque, CP, creada_en, expira ~30 min) y regresa `{ quoteId, options: [{ tier, carrier, service, price, days }] }`. Limitar abuso (p. ej. cantidad de cotizaciones por IP/minuto) porque cada cotización llama a Envia.
2. **`shipping-label`** (solo admin: verifica el JWT y que el usuario esté en `admin_users`). Modo `rates` recotiza para el pedido; modo `generate` genera la guía con la opción elegida y guarda en `orders`. Debe bloquear el pedido (p. ej. `update ... where label_tracking is null` antes de llamar, o un estado "generando") para evitar doble guía.

### Base de datos (SQL idempotente como los demás archivos de `supabase/`)

- `shipping_settings` (una fila o clave/valor): CP origen, datos del remitente, medidas de caja, medidas y peso máximo del sobre.
- Peso y empaque por categoría: tabla `shipping_category_weights (category text pk, grams int, needs_box bool)` con los valores aprobados como semilla. Categoría sin fila → peso por defecto configurable (p. ej. 400 g, sobre).
- `shipping_quotes` como arriba; sin lectura pública.
- `orders`: columnas nuevas `shipping_tier`, `shipping_carrier`, `shipping_service`, `shipping_quote_id`, `label_tracking`, `label_url`, `label_carrier`, `label_cost`.
- `place_order`: nuevo parámetro opcional `p_shipping_quote_id` + `p_shipping_tier`. Si viene, valida que la cotización exista, no haya expirado y que el tier exista; copia precio/paquetería al pedido y lo suma a `p_expected_total`. Si no viene (Envia falló), el pedido entra como hoy con `shipping_cost` nulo.

  **Ojo:** hoy `orders.total` es solo productos y el envío se suma aparte en el admin (`toPay = total + shipping_cost`). Se mantiene así: `total` = productos, `shipping_cost` = envío. `p_expected_total` debe compararse contra productos + envío para que el cliente vea lo mismo que se guarda.

### Checkout

- La dirección ya se pide en campos separados (calle, número, colonia, ciudad, estado, `zipCode`) y se une en `fullAddress`. Al tener `zipCode` de 5 dígitos, se cotiza (con debounce) y aparece el selector Estándar/Express debajo de la dirección. Volver a cotizar si cambia el CP o el carrito.
- Mientras cotiza: estado de carga. Si falla: mensaje "Te confirmamos el costo de envío por WhatsApp" y se puede enviar el pedido sin envío (comportamiento de hoy).
- El resumen y el total muestran el envío elegido.
- Tono del copy: el aprobado para la tienda (serio, cercano, tuteo, sin "¡").

### Admin

- Detalle del pedido: junto al campo "Costo de envío" (se conserva para pedidos sin cotización), bloque de guía: **Generar guía** → opciones con precio y días, sobre/caja editable, aviso si el costo real es mayor a lo cobrado ("Esta guía cuesta $X más de lo que pagó el cliente"), confirmar. Ya generada: paquetería, número de rastreo copiable y botón para abrir/imprimir el PDF.
- Ajustes de envío: tabla editable de pesos por categoría y datos de remitente/medidas.

## Enfoques considerados

- **A. Envia completo (cotiza + genera guía)** — elegido. Resuelve la espera y el ir y venir, y quita al intermediario. Es el más grande.
- **B. Solo cotizar con Envia** — el precio cotizado no coincidiría con lo que cobra el revendedor; la guía seguiría por WhatsApp.
- **C. Tabla propia por zona** — sin dependencias pero aproximada, a mantener a mano y sin guías.

Se construye en dos partes: **Parte 1** cotizador en checkout (lo que hace perder ventas); **Parte 2** guía desde admin.

## Decisiones tras la revisión (propuestas de diseño, corregibles)

- **Cotización ligada al carrito:** `shipping_quotes` guarda también los artículos (`productId`, `qty`) y el CP. `place_order` rechaza la cotización si el carrito o el CP del pedido no coinciden (evita cotizar una playera y pedir diez zapatos).
- **Dirección por partes:** la Parte 1 ya guarda la dirección separada (nueva columna `orders.address_parts jsonb`: calle, número, int., colonia, ciudad, estado, CP, referencias) además del texto unido de hoy, para poder generar la guía sin recapturar. Pedidos viejos: formulario editable en el admin al generar la guía. El estado se mapea a su código para Envia.
- **Totales del checkout:** `shownTotal`/`serverTotal`, el mensaje de WhatsApp del cliente (`buildOrderMessage`) y el error "Los precios cambiaron" pasan a incluir el envío.
- **Fuera de México** (CP que no sea de 5 dígitos): no se cotiza; se muestra "Te confirmamos el envío por WhatsApp".
- **Un solo paquete por pedido.** Si el peso pasa lo que aguanta la caja estándar, no se cotiza y se muestra el mensaje de WhatsApp (casos raros; multipaquete queda fuera).
- **Categorías sin peso aprobado** (semilla propuesta): Sudaderas 700 g sobre, Chamarras 1 kg caja, Abrigos 1.2 kg caja. Nombre exacto de "Perfumes Dama" a confirmar contra la tabla `categories`. Valor por defecto para categoría sin fila: 500 g, caja (conservador).
- Infraestructura: el repo aún no tiene `supabase/functions`; la Parte 1 incluye inicializarlo y documentar cómo desplegar y poner el secreto.

## Lo que queda al constructor

- Confirmar en la documentación de Envia (sandbox `api-test.envia.com`): endpoints de tarifas y de generación, cómo se piden varias paqueterías, el tipo de paquete "sobre" y su límite de peso/medidas, y el formato de respuesta (días estimados).
- Datos del remitente: dirección de la tienda del Centro (Calle Ignacio Zaragoza #140, Col. Centro, CP 28000, Colima) salvo que el dueño diga otra; teléfono lo pone el dueño en ajustes.
- Detalles de UI dentro del estilo actual del admin y del checkout.
