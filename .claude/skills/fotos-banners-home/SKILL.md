---
name: fotos-banners-home
description: Crear fotos con IA para los banners (slides) del carrusel de la home de g&l, o para cuadros de categoría y promociones de temporada, con la familia visual de la tienda. Úsala siempre que el dueño quiera cambiar, mejorar o hacer una foto de banner, portada, slide, hero o carrusel; cuando diga que no encuentra fotos parecidas, que las de Pinterest se ven mal, que quiere una foto "como la de denim", o pida un banner para Buen Fin, Navidad, Hot Sale u otra promo, aunque no diga "IA" ni "skill".
---

# Fotos de banners de la home (g&l)

Proceso que el dueño aprobó el 11-nov-2026 para hacer las fotos del carrusel. Habla con él en español sencillo, sin jerga.

## Cómo es el carrusel (manda sobre todo lo demás)

- Cada slide tiene texto a la izquierda (título, párrafo y botón, que se editan en Admin → Contenido) y una foto a la derecha. El dueño sube **una sola foto** por slide.
- Computadora: la foto se ve en **4:5** (se entrega a 1080×1350). Celular y tablet: el mismo archivo se recorta a **cuadrado centrado** (`aspect-square` + `object-cover` en `src/pages/home/home.js`). Todo lo importante tiene que caber entre el 10% y el 90% del alto. Revisar siempre las dos vistas.
- El primer slide es lo primero que carga la tienda. Uno de temporada va arriba mientras dura la promo y se quita a mano al terminar, porque las fechas quedan fijas en la imagen.

## La familia visual

Fotos permanentes, como "Tu fit, perfecto.", "Denim de verdad." y "−10% 1ª compra.":
- Estilo **outfit sin persona** (ghost styling): la ropa tiene el volumen de un hombre invisible. Sin persona, maniquí, manos, cuello ni cabeza.
- Fondo blanco continuo de estudio, luz suave de ventana desde la izquierda, sombra tenue y tono de película análoga.
- **Lo que se queda igual da el estilo. Lo que cambia hace que se distinga cada slide:** pose (sentado de frente, de lado, de pie, caminando), mueble (sillón, banco de madera, ninguno), ángulo y color dominante. Antes de proponer una, haz la tabla de los slides que ya existen para no repetir.
- La prenda que el slide anuncia es la protagonista. Por ejemplo, en "Denim" el encuadre va cerrado sobre el pantalón, porque es lo que más se vende.

Banners de temporada (Buen Fin y similares): pueden y deben romper la familia para llamar la atención. El Buen Fin 2026 fue una "lluvia de ropa" sobre azul rey de la marca, con el "10%" puesto con código.

Colores de marca: azul `#214fc7`, marino `#1A3E9E`, tinte `#EAEFFB`. Fuentes: Manrope (títulos) y JetBrains Mono (etiquetas), en `marketing/buen-fin-2026/assets/`.

## Proceso

1. **Proponer antes de generar.** Lee qué slides hay ahora (`site_content`, `section='hero_slide'`, solo filas con `content.v=2`). Propón la idea en 3 o 4 líneas, más la tabla de cómo se distingue de los demás, y espera el sí del dueño.
2. **Fable dirige y genera.** Lanza un subagente con `model: "fable"` (o retómalo con SendMessage si ya existe en la sesión). Pásale: qué se mantiene, las decisiones del dueño, los media id de Canva de los slides aprobados como pareja, la regla del cuadrado y un **límite de 3 generaciones**. Pide que devuelva el media id, el enlace exacto de "Open generated image", la ruta de la vista previa, la dirección de arte final, una lista de revisión punto por punto, lo que no pudo verificar y las descartadas.
   - Herramienta: Canva `generate-image` con `aspectRatio: "PORTRAIT_4_5"`, luego `get-generate-image-job` hasta SUCCESS (un 409 o un PENDING se resuelve consultando otra vez, sin lanzar otra generación). Para ajustar una buena sin perderla, regenera con ella como `imageReferences` ("misma foto, solo cambia X").
   - Higgsfield necesita créditos (la cuenta tiene 0) y banana no funciona en Windows. No las intentes salvo que el dueño diga que ya cambió eso.
3. **Revisar.** Canva solo entrega una miniatura de 161×200. Ábrela con Read y dile al dueño qué revisar en grande: manos o dedos que asomen, cuellos con forma de maniquí, logos o etiquetas inventadas y prendas deformes.
4. **El texto nunca lo escribe la IA.** Se probó con "−10%" y salió un garabato ilegible. Si la imagen lleva números o palabras: pide a Fable la foto con una zona limpia reservada para el texto. El dueño la descarga de Canva en tamaño completo (queda en Descargas). Cópiala a `assets/` y pon el texto con HTML + Playwright, usando como plantilla `marketing/buen-fin-2026/banner-foto.html` y `banner-foto.cjs`. El script se niega a exportar si el texto se sale del cuadrado del celular o pisa la ropa. Revisa `out/*.jpg` y el recorte `*-celular.png` con Read.
5. **Entregar.** El dueño sube las fotos él mismo en Admin → Contenido; no toques Supabase por él. Dale el enlace de Canva o la ruta del JPG, el texto sugerido del slide (título, párrafo, botón, leyenda) y avísale si la leyenda vieja ya no corresponde. Por ejemplo, "Oggi - Vaxter" sobre jeans que no son Oggi.

## Lo que salió mal antes (para no repetirlo)

- Fotos de Pinterest: miden 736 px de ancho, se ven borrosas y son de otras marcas. Prefiere IA, fotos propias o las del proveedor.
- Una bota quedó casi en la orilla del recorte del celular: pide margen holgado abajo.
- Si el texto dice "toda la tienda", comprueba que sea cierto. La promo puede excluir artículos en rebaja; en 2026 todos traían 10% o más, así que se pudo decir.
