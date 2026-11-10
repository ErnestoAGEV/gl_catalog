# Video Buen Fin 2026 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un MP4 vertical de 20–25 s con *motion graphics* estilo "Números que golpean", prendas ilustradas, voz, música y efectos, que anuncia el Buen Fin de G&L y lleva a WhatsApp o a glboutique.com.mx.

**Architecture:** Igual que el video anterior de G&L (`brag-output/work/`): una página HTML de 1080×1920 con una función determinista `window.render(t)`. Playwright captura los cuadros a 30 fps y ffmpeg los une con el audio. **Todos los tiempos (escenas, voz, golpes y *whooshes*) salen de `timeline.js`**, que leen la animación, el audio y las verificaciones. Un script `retime` recalcula la línea de tiempo a partir de las duraciones reales de la voz, así que cambiar de voz es volver a correrlo.

**Tech Stack:** HTML/CSS/SVG + JS vanilla, Playwright (`C:/Users/vevle/node_modules/playwright`; `import 'playwright'` también resuelve desde el repo), Python 3.12 + numpy (como `brag-output/work/audio4.py`), ffmpeg 9.

**Spec:** `docs/superpowers/specs/2026-11-09-video-buen-fin-design.md`

## Global Constraints

- Salida: 1080×1920, 30 fps, H.264 `yuv420p` BT.709 + AAC 48 kHz, `.mp4`, duración 20–25 s.
- Zona segura: el texto va entre y=269 e y=1651 y entre x=0 y x=1080. Excepción: los elementos marcados `data-bleed` (los porcentajes) durante los primeros 0.3 s de su entrada.
- Texto en pantalla ≥ 44 px, salvo "Descuentos no acumulables" (≥ 36 px). Porcentajes de 460–520 px (más grande no cabe: "10%" en Manrope 800 mide ~2.03× su tamaño de fuente de ancho).
- Duración mínima de escena: 2.5 s; la de envíos, ≥ 3.0 s.
- Tipografías: Manrope 700/800, Inter, JetBrains Mono (copiar de `public/fonts/`). Colores: `#214fc7`, `#003baf`, `#4169e1`, `#15171C`, `#FFFFFF`, `#EAEFFB`.
- Ningún texto contiene "¡", "todo es original", "Punto Oggi" ni "distribuidor oficial". Sin logo oficial de El Buen Fin ni logos de Wrangler/Oggi.
- Textos exactos en pantalla: "Buen Fin", "10%", "en toda la tienda", "15%", "en perfumes y pantalones seleccionados", "Descuentos no acumulables", "Del 13 al 16 de noviembre", "Tiendas en Colima · En línea · WhatsApp", "Envíos a todo México", "Wrangler, Oggi y más", "Escríbenos por WhatsApp", "312 101 8263", "glboutique.com.mx", "Tu fit perfecto".
- Voz (texto para leer o para el TTS; "G&L" = "ge y ele"):
  1. "Este Buen Fin, en ge y ele…"
  2. "10% en toda la tienda."
  3. "Y 15% en perfumes y pantalones seleccionados."
  4. "Del 13 al 16 de noviembre, en nuestras tiendas de Colima, en línea y por WhatsApp."
  5. "Envíos a todo México."
  6. "Escríbenos por WhatsApp o entra a nuestra tienda en línea. Ge y ele, tu fit perfecto."
- Ícono de WhatsApp: glifo oficial de Meta (recursos de marca de Meta), `#25D366`/blanco, sin modificar.
- Música sintetizada original (evita que Meta silencie el video). Si el dueño pide una canción, se reemplaza `audio/music.wav` y se vuelve a mezclar.
- Fuente en `marketing/buen-fin-2026/`, con su propio `package.json` `{"type":"commonjs"}` (el repo es `"type":"module"`) y su propio `.gitignore`.
- **Fechas:** vista previa al dueño el **2026-11-11 a mediodía**; MP4 final el **2026-11-12**.

## Review Focus

1. **Texto que se sale de la zona segura o del cuadro en cualquier cuadro de una transición.** Lo prueba `check.mjs safe` cuadro por cuadro (1/30 s), midiendo el texto real (Task 3).
2. **Voz desfasada de su escena, o escena demasiado corta para leerla.** Lo prueba `check.mjs timing` (Task 4).
3. **WhatsApp recomprime y el número o la URL se vuelven ilegibles.** El dueño sube la vista previa a 1080×1920 a un estado real en la ronda de aprobación (Task 6). Trazos ≥ 4 px.
4. **Voz mal pronunciada ("ge y ele", "WhatsApp") o enterrada bajo la música.** El dueño la escucha en la vista previa; `check.mjs audio` exige voz ≥ 9 dB sobre la música en cada ventana de voz (Task 5).
5. **Cuadro distinto según el orden en que se pida (no determinista) o con la fuente equivocada.** Lo prueba `check.mjs determinism` y la verificación de fuentes cargadas (Task 3).

---

### Task 1: Línea de tiempo, estructura y `retime`

**Files:**
- Create: `marketing/buen-fin-2026/package.json` → `{"type":"commonjs","private":true}`
- Create: `marketing/buen-fin-2026/.gitignore` → `frames/`, `stills/`, `out/`, `audio/`, `*.mp4`, `timeline.json`
- Create: `marketing/buen-fin-2026/timeline.js`, `retime.js`, `check.mjs`
- Create: `marketing/buen-fin-2026/assets/` (copiar `public/fonts/*.woff2` y `public/icon-512.png`)

**Interfaces:**
- Produces: `timeline.js` define `TIMELINE = { fps: 30, bpm: 120, duration, scenes: [{ id, start, end, voStart, vo, copy: string[], cues: [{ at, type: 'hit'|'whoosh' }] }] }`, con `cues[].at` relativo al inicio de la escena. Se expone con `globalThis.TIMELINE = TIMELINE; if (typeof module !== 'undefined') module.exports = TIMELINE`. Ids en orden: `intro, diez, quince, fechas, envios, cierre`.
- Produces: `node retime.js <dirWavs>` lee la duración de `s1.wav…s6.wav` con `ffprobe` y reescribe los tiempos en `timeline.js`: `voStart = start + 0.2`; `end = max(start + minDur, voStart + dur + 0.4)` redondeado **hacia arriba al siguiente 0.5 s** (un tiempo a 120 BPM = 15 cuadros). `minDur` es 2.5, o 3.0 en `envios`. Si `duration > 25`, falla con un mensaje que sugiere, en orden: acelerar la voz hasta 1.15× (`atempo`), bajar los márgenes a 0.15/0.25 y recortar la frase 4. También escribe `timeline.json` para Python.
- `check.mjs <modo>` con modos `copy | safe | determinism | timing | audio | final`. Sale con código ≠ 0 si algo falla.

- [ ] **Step 0:** Crear la rama `video-buen-fin` desde `main` (el push a `main` despliega el sitio).
- [ ] **Step 1: `check.mjs copy`**: `assert` que (a) cada texto exacto de Global Constraints está en algún `copy`, (b) `scenes[i].vo` es igual a la frase de voz i+1, (c) ningún texto contiene `¡`, `original`, `Punto Oggi` ni `distribuidor`, (d) las escenas son contiguas, empiezan en 0, terminan en `duration`, `20 ≤ duration ≤ 25` y `duration*fps` es entero.
- [ ] **Step 2:** Correr `node marketing/buen-fin-2026/check.mjs copy`. Debe FALLAR.
- [ ] **Step 3:** Escribir `timeline.js` con tiempos provisionales 0–3, 3–6.5, 6.5–11, 11–16, 16–19, 19–24.5. `copy` por escena: intro `["Buen Fin"]`; diez `["10%","en toda la tienda"]`; quince `["15%","en perfumes y pantalones seleccionados","Descuentos no acumulables"]`; fechas `["Del 13 al 16 de noviembre","Tiendas en Colima · En línea · WhatsApp"]`; envios `["Envíos a todo México","Wrangler, Oggi y más"]`; cierre `["Escríbenos por WhatsApp","312 101 8263","glboutique.com.mx","Tu fit perfecto"]`. Cues: un `hit` al entrar cada porcentaje y el logo; un `whoosh` en cada cambio de escena y en cada prenda que cruce.
- [ ] **Step 4:** Escribir `retime.js`. Probarlo con 6 WAV de silencio de duraciones conocidas (`ffmpeg -f lavfi -i anullsrc -t <d>`) y comprobar con `assert` el resultado esperado de la fórmula, incluido el mínimo de la escena de envíos.
- [ ] **Step 5:** Correr `check.mjs copy`. Debe PASAR. Commit: `feat(video): línea de tiempo, retime y verificación de textos`.

### Task 2: Ilustraciones de prendas

**Files:**
- Create: `marketing/buen-fin-2026/garments.js`, `garments-sheet.html`

**Interfaces:**
- Produces: `window.GARMENTS = { pantalon, camisa, playera, chamarra, perfume }`, strings SVG con `viewBox`, sin tamaño fijo, coloreados con `currentColor` + `var(--accent)`. Aparte, `window.WHATSAPP_GLYPH` es el SVG oficial de Meta con sus colores fijos. Es la única excepción a `currentColor`.

- [ ] **Step 1:** Dibujar en estilo plano, claramente masculino, con trazo ≥ 4 px a 1080 de ancho: jeans de cinco bolsillos con costuras, camisa de botones con cuello, playera, chamarra de mezclilla y frasco de perfume con atomizador. Usar la skill `design-taste-frontend` para el criterio.
- [ ] **Step 2:** `garments-sheet.html` las muestra a 300 px sobre `#214fc7` y sobre `#FFFFFF`. Captura con Playwright → `out/garments-sheet.png`.
- [ ] **Step 3:** Revisar la captura (cada prenda reconocible, nada desaparece sobre el azul). Corregir hasta que pase.
- [ ] **Step 4:** Commit: `feat(video): ilustraciones SVG de prendas`.

### Task 3: Animación `video.html`

**Files:**
- Create: `marketing/buen-fin-2026/video.html`
- Create: `marketing/buen-fin-2026/frames.cjs` (adaptado de `brag-output/work/frames.cjs`)
- Create: `marketing/buen-fin-2026/sheet.cjs` (copia de `brag-output/work/sheet.cjs`, que escribe en `out/sheet.png`)
- Modify: `check.mjs` (modos `safe` y `determinism`)

**Interfaces:**
- Consumes: `TIMELINE`, `GARMENTS`, `WHATSAPP_GLYPH`.
- Produces: `window.render(t: number): void`. **Contrato de determinismo:** el resultado depende solo de `t`, sin `Date`, sin animaciones ni `transition` de CSS, sin `requestAnimationFrame`, sin `Math.random` (usar un generador con semilla fija) y sin estado que dependa de llamadas anteriores. Cada texto es un `<span data-copy="…">` con `display:inline-block; white-space:nowrap`. Los porcentajes llevan además `data-bleed`.
- `frames.cjs`: el número de cuadros es `Math.round(TIMELINE.duration * TIMELINE.fps)`. Borra `frames/` antes de un `all`. Antes de capturar, `await Promise.all([...document.fonts].map(f => f.load()))` y `assert` de `document.fonts.check('800 100px Manrope')`, `'400 40px Inter'` y `'400 40px "JetBrains Mono"'`.

- [ ] **Step 1: `check.mjs safe`**: carga las fuentes igual que `frames.cjs` y recorre cada cuadro (paso 1/30). Para cada `[data-copy]` visible (opacidad efectiva > 0.05, multiplicando la de los ancestros; sin `display:none`), mide el texto con `Range.getClientRects()` y comprueba los límites de la zona segura (los `data-bleed` quedan exentos 0.3 s desde su entrada). A la mitad de cada escena, para cada string de `scene.copy` hay un elemento con `textContent` (espacios normalizados) igual a `data-copy`, opacidad efectiva ≥ 0.95, escala de `transform` entre 0.98 y 1.02, `font-size` ≥ el mínimo, y `document.elementFromPoint` en su centro cae dentro de él.
- [ ] **Step 2: `check.mjs determinism`**: captura `render(5)` en una página nueva y luego `render(5); render(20); render(5)` en otra. Las dos capturas deben ser idénticas byte a byte. Repetir con la mitad de cada escena.
- [ ] **Step 3:** Correr ambos modos. Deben FALLAR.
- [ ] **Step 4:** Implementar `video.html`: estilo A del boceto (`.superpowers/brainstorm/2184-1794285488/content/estilos.html`), más elaborado. Fondo azul/blanco alternado, porcentajes en Manrope 800 de 460–520 px que entran por escala 2.4→1 con *overshoot*, cambios de escena con barrido diagonal (`clip-path`) y prendas que cruzan, giran o caen en el instante de su `cue`. Funciones de *easing* en un solo objeto `ease`. Usar las skills `design-taste-frontend` y `emil-design-eng`.
- [ ] **Step 5:** Correr `safe` y `determinism`. Deben PASAR.
- [ ] **Step 6:** Capturar stills a la mitad de cada escena y en 3 transiciones, armar `out/sheet.png` y revisarla.
- [ ] **Step 7:** Commit: `feat(video): animación determinista del video Buen Fin`.

### Task 4: Voz

**Files:**
- Create: `marketing/buen-fin-2026/audio/vo/s1.wav … s6.wav` (ignorados por git)
- Create: `marketing/buen-fin-2026/clean-vo.sh`
- Modify: `check.mjs` (modo `timing`)

**Interfaces:**
- Consumes: `retime.js` (Task 1).
- Produces: `audio/vo/s{1..6}.wav` mono 48 kHz, ya limpios.

- [ ] **Step 0 (decidido: el dueño graba su voz con el celular):** entrega la grabación a más tardar el 2026-11-10. Puede ser un archivo por frase o uno solo con pausas de 2 s entre frases; en ese caso, se corta en `s1…s6` por los silencios (`silencedetect`). Si al dueño no le gusta cómo suena en la vista previa, la vuelve a grabar y se corre `retime` de nuevo.
- [ ] **Step 1 (provisional, sin bloquear):** mientras llega la voz real, generar las 6 frases con una voz de sistema (Windows SAPI) **solo para medir tiempos**. Nunca se entrega.
- [ ] **Step 2: `check.mjs timing`**: con `ffprobe`, para cada escena `start ≤ voStart`, `voStart + dur ≤ end − 0.15`, duración de escena ≥ `minDur` y ninguna frase se encima con la siguiente.
- [ ] **Step 3:** `clean-vo.sh <archivoEntrada> <n>`: ffmpeg con `highpass=80`, `afftdn`, `silenceremove` al inicio y al final, compresor suave, `loudnorm` y salida mono 48 kHz en `audio/vo/s<n>.wav`. Si la grabación llega en un solo archivo, cortar las frases a mano por tiempos.
- [ ] **Step 4:** `node retime.js audio/vo`, luego `check.mjs timing`, `copy` y `safe`. Deben PASAR.
- [ ] **Step 5:** Commit: `feat(video): tiempos ajustados a la voz`.

### Task 5: Música, efectos y mezcla

**Files:**
- Create: `marketing/buen-fin-2026/audio.py` (basado en `brag-output/work/audio4.py`)
- Modify: `check.mjs` (modo `audio`)

**Interfaces:**
- Consumes: `timeline.json` (lo escribe `retime.js`) y `audio/vo/*.wav`.
- Produces: `audio/voice.wav`, `audio/music_ducked.wav` y `audio/mix.wav`, estéreo 48 kHz con duración exacta de `duration`.

- [ ] **Step 1: `check.mjs audio`**: `ffmpeg -i mix.wav -af volumedetect -f null -` (lee stderr) debe dar `max_volume ≤ -2.0 dB`. La duración es igual a `duration` ± 0.05. En cada ventana `[voStart, voStart+dur]`, el RMS de `voice.wav` es ≥ 9 dB mayor que el de `music_ducked.wav`.
- [ ] **Step 2:** `audio.py`: música original a 120 BPM, con energía, y cada inicio de escena en un tiempo. Golpe grave en cada `cue` de tipo `hit` y *whoosh* en cada `whoosh`. *Ducking* de la música a ~15% en las ventanas de voz. Pico normalizado a −2 dBFS.
- [ ] **Step 3:** Correr `check.mjs audio`. Debe PASAR. Escuchar la mezcla completa.
- [ ] **Step 4:** Commit: `feat(video): música y efectos sintetizados`.

### Task 6: Vista previa, aprobación y render final

**Files:**
- Create: `marketing/buen-fin-2026/render.sh`
- Modify: `check.mjs` (modo `final`)

**Interfaces:**
- Produces: `out/gl-buen-fin-2026.mp4`.

- [ ] **Step 1:** `render.sh`: `node frames.cjs all` y luego `ffmpeg -y -framerate 30 -i frames/f%04d.png -i audio/mix.wav -vf scale=out_color_matrix=bt709 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -shortest -movflags +faststart out/gl-buen-fin-2026.mp4`.
- [ ] **Step 2: `check.mjs final`**: `ffprobe` da 1080×1920, 30 fps, `h264`, `yuv420p`, `bt709`, `aac`, duración = `duration` ± 0.1, y `volumedetect` sobre el MP4 da ≤ −1.0 dB.
- [ ] **Step 3:** Renderizar a resolución completa y correr todos los modos de `check.mjs`. Entregar al dueño **antes del 2026-11-11 a mediodía**, en una sola ronda: verlo, aprobar la voz y subirlo a un estado de WhatsApp de prueba para confirmar que el número y la URL se leen.
- [ ] **Step 4:** Aplicar cambios, volver a renderizar y correr todos los modos de `check.mjs`. Deben PASAR.
- [ ] **Step 5:** Revisión con Fable (subagente `model: "fable"`) con la hoja de contacto, la salida de `check.mjs` y el spec. Corregir lo que encuentre.
- [ ] **Step 6:** Entregar el MP4 final el 2026-11-12. Commit: `feat(video): render final Buen Fin 2026`.
