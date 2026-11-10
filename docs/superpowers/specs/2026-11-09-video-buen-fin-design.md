# Video Buen Fin 2026 — G&L

Fecha: 2026-11-09 · Estado: diseño por aprobar

## Intención

G&L (tienda de ropa para hombre, 2 sucursales en Colima, tienda en línea glboutique.com.mx, envíos a todo México) quiere un video corto de *motion graphics* para anunciar su Buen Fin. Se publicará en **Instagram, Facebook y estados de WhatsApp**. Su único trabajo es que quien lo vea **mande mensaje por WhatsApp o entre a glboutique.com.mx**.

## La promoción (datos del dueño, confirmados)

- **10% de descuento en toda la tienda.**
- **15% en perfumes y pantalones seleccionados.** El video dice "perfumes y pantalones seleccionados", sin nombrar productos concretos.
- Vigencia: **del 13 al 16 de noviembre** (2026).
- Aplica en **las tiendas de Colima (Centro y Villa de Álvarez), en línea y por WhatsApp**.
- En línea el descuento **ya sale aplicado; no hay código**. El video no menciona ningún cupón.
- WhatsApp: **312 101 8263**. Web: **glboutique.com.mx**.
- **Descuentos no acumulables:** es uno u otro; el 15% no se suma al 10%. El video lo dice con una línea chica: "Descuentos no acumulables" (texto mío).
- El dueño acepta decir "Buen Fin" en el video (no confirmó registro oficial; sin logo oficial).
- **Fecha límite: el video tiene que estar listo para publicarse el 13 de noviembre.** Meta interna: MP4 final el 12.
- Slogan: **"Tu fit perfecto"**. Va en el cierre (el dueño lo eligió en lugar de "Desde 1995").

## Lo que eligió el dueño

- **Estilo "A · Números que golpean"** (boceto en `.superpowers/brainstorm/2184-1794285488/content/estilos.html`): pantallas a color completo, fondo azul de la marca alternado con blanco, porcentajes enormes que entran de golpe (escala grande → tamaño final), ritmo rápido. El boceto solo fijó la dirección; **el final debe ser bastante más elaborado**.
- **Prendas ilustradas**, no fotos: pantalón, camisa y frasco de perfume (y otras prendas si suman) dibujados en estilo plano con la paleta de G&L, animados entre las escenas (se deslizan, giran, se doblan). No fotos del sitio (en su mayoría vienen de terceros) ni ropa generada con IA (mostraría productos que no venden).
- **Con voz en off.**
- Debe llevar todo esto:
  1. Subtítulos de la voz (mucha gente lo ve sin sonido).
  2. Música y efectos sincronizados (golpe/*whoosh* en cada número y prenda).
  3. Fechas del 13 al 16 de noviembre.
  4. "Envíos a todo México".
  5. Marcas como texto: "Wrangler, Oggi y más". **Sin logos de las marcas.**
  6. Cierre con ícono de WhatsApp + número + glboutique.com.mx en grande, y la voz invitando a escribir o entrar.
  7. "Tu fit perfecto" en el cierre.

## Identidad visual (de `src/style.css` del sitio)

- Títulos: **Manrope** 700/800 (`public/fonts/manrope.woff2`). Texto: **Inter**. Etiquetas en mayúsculas: **JetBrains Mono**.
- Azul de marca `#214fc7`; oscuro `#003baf`; claro `#4169e1`; tinta `#15171C`; blanco `#FFFFFF`; tinte `#EAEFFB`.
- Logo: `public/icon-512.png` (G&L blanco sobre azul). Si hace falta más resolución o fondo transparente, pedírselo al dueño.

## Tono del texto y la voz

Tono aprobado del sitio: serio, profesional pero cercano, tuteo, sin jerga de mostrador y **sin "¡"**. El video puede ser enérgico en lo visual; las palabras siguen sobrias.

Guion propuesto (mi propuesta; el builder puede ajustar ritmo y longitud, sin cambiar los datos ni el tono):

1. "Este Buen Fin, en G&L…"
2. "10% en toda la tienda."
3. "Y 15% en perfumes y pantalones seleccionados."
4. "Del 13 al 16 de noviembre, en nuestras tiendas de Colima, en línea y por WhatsApp."
5. "Envíos a todo México."
6. "Escríbenos o entra a glboutique.com.mx. G&L, tu fit perfecto."

### Decisiones tomadas tras la revisión de Fable (mis decisiones, el dueño puede cambiarlas)

- **Subtítulos = el texto animado en pantalla.** No habrá una franja aparte. Toda frase que diga la voz aparece en pantalla, completa o con una redacción casi igual.
- **Pronunciación:** "G&L" se dice "ge y ele". La voz **no deletrea la URL**; dice "o entra a nuestra tienda en línea" mientras glboutique.com.mx aparece en grande. Las muestras de voz incluyen esta variante para que el dueño la oiga.
- **"Envíos a todo México"** se dice tal cual, sin insinuar que son gratis.
- **Ícono de WhatsApp:** el glifo oficial de Meta sin modificar ni recolorear.
- **Marcas en texto** con la tipografía de G&L, nunca imitando el logotipo de cada marca.
- **Sin el logo oficial de El Buen Fin.**
- Probar una subida real a un estado de WhatsApp antes de entregar, porque recomprime mucho.

## Restricciones

- Formato principal **vertical 9:16, 1080×1920, MP4 (H.264 + AAC)**, que sirve para Reels, Historias, Facebook y estados de WhatsApp.
- Duración **~20–25 s** (mi decisión). Debe caber holgado en el límite de un estado de WhatsApp.
- Zonas seguras: texto importante fuera del ~14% superior e inferior (ahí la interfaz de Instagram y WhatsApp tapa).
- Legible en celular: nada de texto pequeño; cada frase en pantalla el tiempo suficiente para leerla.
- Música y efectos **con licencia para uso comercial en redes**. Nada de canciones comerciales.
- Voz: **ElevenLabs** (el usuario ya tiene cuenta), voz con acento mexicano natural de la biblioteca. Presentar 2–3 muestras del guion al dueño para que escoja antes de montar.
- Sin "¡", sin "todo es original", "Punto Oggi" ni "distribuidor oficial" (el dueño no quiere esas frases).

## No-objetivos

- No es un anuncio con fotos de producto ni un catálogo.
- No se publica ni se pauta en redes desde aquí; se entrega el archivo.
- No se toca el sitio web.

## Anti-objetivos (sería un fracaso aunque "funcione")

- Que se vea como plantilla genérica de Canva o "hecho con IA".
- Que el número de WhatsApp o la web estén mal o no se alcancen a leer.
- Que la voz suene a español neutro/americano.
- Prendas que no parezcan ropa de hombre o que choquen con la marca.

## Cómo se hace (mi decisión, el dueño me la dejó)

Animación hecha con código (HTML/CSS/JS o SVG animado, como el boceto) y renderizada a MP4. Así se itera rápido y se reutiliza. Sugerencia: Hyperframes (lo usa la skill `brag` instalada) o captura cuadro por cuadro con Playwright + ffmpeg. La herramienta exacta la decide el builder.

Ilustraciones de prendas: SVG vectorial hecho a mano o con código, estilo plano en la paleta de la marca.

Ubicación: fuente en `marketing/buen-fin-2026/` dentro del repo del sitio. Los MP4 y audios generados **no se commitean** (agregar al `.gitignore`). Vite solo construye desde `src/` y `public/`, así que no afecta el deploy.

## Lo que queda al builder

- Storyboard escena por escena, tiempos exactos y transiciones, siempre dentro del estilo A.
- Diseño de las ilustraciones y su animación.
- Elección de música y efectos (con licencia).
- Herramienta de render.
- Ajustes de redacción del guion que no cambien datos ni tono.

## Pendiente del dueño (bloquea la voz)

- **Revisar si la cuenta de ElevenLabs es de paga y tiene créditos.** Con el plan gratuito no se permite el uso comercial. Si no hay plan, las opciones son contratar el plan Starter por un mes o grabar la voz con alguien de la tienda. La animación puede avanzar mientras tanto.

## Entregables

Por la fecha límite, las aprobaciones se juntan en una sola ronda: muestras de voz + vista previa juntas.

1. 2–3 muestras de voz para que el dueño elija.
2. Una vista previa (MP4 o página animada) para aprobación antes del render final, entregada junto con las muestras de voz.
3. MP4 final 9:16 con voz, música, efectos y subtítulos quemados.
4. Revisión del resultado con Fable antes de entregarlo (regla del usuario).
