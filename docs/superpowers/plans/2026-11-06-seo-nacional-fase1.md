# SEO nacional + Merchant — Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que las páginas de marca y categoría de glboutique.com.mx compitan en búsquedas nacionales y que las 248 fichas pasen los requisitos de datos de Google Merchant Center, sin romper nada de lo que hoy funciona.

**Architecture:** Todo vive en el build: `scripts/prerender.mjs` escribe el HTML que ve Google; `src/core/routeSeo.js` y `src/utils/{brands,productCopy,related}.js` son módulos puros compartidos por el prerender y la SPA. Los cambios van en esos módulos (con tests en `scripts/test-*.mjs`) y el prerender se protege con asserts que truenan el build si el HTML sale mal.

**Tech Stack:** Vite 5 + JS vanilla, Supabase (solo lectura en build), Vercel (`vercel.json`), tests con `node:assert` vía `npm test`.

**Spec:** hallazgos de la auditoría en `glboutique.com.mx-audit/2026-11-06/findings/` — `technical.md` (H-1..H-6), `content-sxo.md` (H-1, H-2, H-3, H-5), `schema-geo.md` (#2, #4), `ecommerce-merchant.md` (H3, H6, H7).

## Global Constraints

- Sin dependencias nuevas.
- Copy en español de México, tono de la tienda (directo, sin "¡"), sin rayas largas nuevas en texto visible.
- "Colima" solo en sucursales, nosotros, contacto, footer y llms.txt (decisión del dueño, oct-2026).
- Hechos que SÍ se pueden publicar (confirmados por el dueño 2026-11-06): G&L desde 1995; vende **Wrangler y Oggi desde 2005**; es **Punto Oggi** (punto de venta oficial Oggi); Wrangler lista a G&L como punto de venta; **todo lo que vende es original**. Ningún otro dato de marca (años, "distribuidor oficial" de Lee u otras) se inventa.
- No se cambia el esquema de Supabase ni las URLs canónicas existentes.
- No commit a `main` remoto ni deploy: el dueño aprueba antes de subir. Commits locales sí, uno por tarea.
- `.claude/settings.local.json` no se toca ni se commitea.
- Cada tarea termina con `npm test` verde y `npx vite build` (corre el prerender si hay `.env`) sin errores.

## Review Focus

1. Categoría con acento o espacio (`Suéteres`, `Perfumes Dama`) en los enlaces nuevos del nav: el href debe ser `encodeURIComponent` igual que el canonical, o se crean URLs duplicadas.
2. Marca con caracteres HTML (`Soul&Blues`, `Collor's`) en nav, títulos y textos nuevos: debe salir `Soul&amp;Blues` en HTML y no doble-escaparse en `textContent`.
3. Producto sin `original_price`, o con `original_price <= price`: no debe emitir `priceSpecification` (Google lo marca como error).
4. Redirects de mayúsculas en Vercel: si Vercel compara rutas sin distinguir mayúsculas, `/categoria/camisas → /categoria/Camisas` hace bucle infinito. Verificar antes de dejarlo (Task 6).
5. La ficha en el navegador (SPA) usa el mismo `relatedProducts` con `limit = 4`: el nuevo orden no puede dejarla vacía ni recomendar el mismo producto.

---

### Task 1: Navegación completa en el HTML servido

**Files:**
- Modify: `scripts/prerender.mjs` (`contactFooter()` ~257, `contentShell()` ~415, shell de la home ~542-560, final del archivo para asserts)
- Modify: `src/components/layout.js:8-16` (`CATEGORY_LINKS`, footer)

**Interfaces:**
- Produces: `siteLinks()` en prerender → string HTML con `<nav aria-label="Secciones">` que contiene: todas las `categories` (href `/categoria/${encodeURIComponent(c)}`, texto `categoryLabel`-free, solo el nombre), todas las `brands` (`/marca/${slug}`), y Ayuda: `/sucursales`, `/envios`, `/cambios`, `/contacto`, `/nosotros`.

- [ ] **Step 1:** Escribir `siteLinks()` y meterlo dentro de `contactFooter()` (antes de teléfono/sucursales), para que salga en todas las páginas que usan `contentShell`.
- [ ] **Step 2:** (La home ya recibe `contactFooter()` en `HOME_SHELL_MARK`, `prerender.mjs:~597`: no hace falta paso aparte.)
- [ ] **Step 3:** `layout.js`: agregar `['Suéteres','Suéteres']` a `CATEGORY_LINKS` y en el footer un `<ul data-footer-brands></ul>` vacío. Rellenarlo desde el `subscribe` global de `src/core/startApp.js` (~línea 701, donde se actualiza `a[data-cart-link]`) con `brandIndex(state.products)` cuando cambie `products.length` — NO al pintar el layout, porque `/catalog`, `/categoria/*`, `/marca/*` e info se montan antes de que lleguen los productos y no se repintan (`startApp.js:685-694`).
- [ ] **Step 4:** Assert al final del prerender, antes de escribir: para `/` y cada ruta de categoría, marca, ficha e info, el HTML contiene `href="/marca/${slug}"` de TODAS las `brands` (la variable ya calculada, no recalcular) y `href="/envios"`; si falta, `throw new Error(path + ': falta nav')`.
- [ ] **Step 5:** `npm test` y `npx vite build` → build OK; `grep -c 'href="/marca/' dist/categoria/Camisas/index.html` ≥ 11; `grep -c 'href="/marca/' dist/index.html` ≥ 11.
- [ ] **Step 6:** Commit `feat(seo): menu de categorias, marcas y ayuda en el HTML servido`.

### Task 2: Páginas de marca con contenido real

**Files:**
- Modify: `src/utils/brands.js` (`brandIntro`, nuevo `BRAND_COPY`)
- Modify: `scripts/test-brands.mjs`

**Interfaces:**
- Produces: `brandIntro(brand, items) -> string` (misma firma, texto plano). Nuevo `export const BRAND_COPY = { wrangler: string, oggi: string }` indexado por `brandSlug`.

- [ ] **Step 1: Tests** en `test-brands.mjs`:
  - `brandIntro('Wrangler', items)` incluye `'desde 2005'` y `'original'`.
  - `brandIntro('Oggi', items)` incluye `'Punto Oggi'` y `'desde 2005'`.
  - `brandIntro('Lee', items)` NO incluye `'2005'` ni `'Punto'`, SÍ incluye `'original'`.
  - Con items `Pantalones` tallas `['30','32']` y `Camisas` tallas `['M','L']`, el texto incluye `'jeans y pantalones'` cerca de `30` y `'camisas'` cerca de `M` (tallas agrupadas por tipo, no mezcladas en una sola lista).
  - Sin `'Colima'`.
- [ ] **Step 2:** `npm test` → falla.
- [ ] **Step 3:** Implementar. `BRAND_COPY.wrangler` y `.oggi`: 60-110 palabras cada uno escritas a partir de las frases `larga` de `FAMILIES` en `src/utils/productCopy.js` para esa marca (cortes reales que hay en catálogo: Wrangler Slim Fit, Regular, Silver Edition; Oggi Vaxter, Leader, Rebel, chinos/gabardina) + los hechos confirmados (Global Constraints). Para el resto de marcas, la plantilla actual más una frase "Todo es original" y la palabra "jeans" cuando haya pantalones de mezclilla. Las tallas: una frase por tipo con `sizeSummary`.
- [ ] **Step 4:** `npm test` → pasa.
- [ ] **Step 5:** Commit `feat(seo): paginas de marca con texto propio (Wrangler y Oggi desde 2005, Punto Oggi)`.

### Task 3: "Jeans" y metas con marcas y precio

**Files:**
- Modify: `src/core/routeSeo.js` (`categoryLabel`, rama `/categoria/`, rama `/marca/`)
- Modify: `src/utils/productCopy.js` (`typeSingular` / `productTitle` para familias de mezclilla)
- Create: `scripts/test-route-seo.mjs`; Modify: `scripts/test.mjs` (importarlo), `scripts/test-product-copy.mjs`

**Interfaces:**
- `categoryLabel('Pantalones') === 'Jeans y pantalones para hombre'`; el resto sin cambio.
- Title de marca: el tipo `Pantalones` se nombra `Jeans` (ej. `Jeans y camisas Wrangler para hombre | G&L`), ≤ 60 caracteres o cae a `Wrangler para hombre | G&L`.
- Meta de categoría: `${label}: ${top3 marcas por conteo}. De $${min} a $${max} MXN. Envío a todo México, gratis desde $1,499.` (si no hay productos cargados, la meta actual).
- Meta de marca: `${n} piezas originales de ${marca}: ${tipos}. De $${min} a $${max} MXN, envío a todo México.`
- Ficha: agregar `denim: true` a las familias de mezclilla en `FAMILIES` (Wrangler Slim y Regular, Lee Slim y Regular, Oggi Vaxter/Power/Iron, los 4 Paddocks) y si `familyFor(product)?.denim`, el title usa `Jeans` en vez de `Pantalón` (`familyFor` sigue privada, `productTitle` está en el mismo módulo). Los tests actuales `test-product-copy.mjs:124,134` (Chinos, Leader → "Pantalón") deben seguir pasando.
- Meta de categoría de perfumes (`isPerfumeCategory`): sin nombres de marca (decisión documentada en `brands.js:29-34`), solo rango de precio.
- Canonical de marca: `routeSeo.js` rama `/marca/` usa `` `/marca/${marca.slug}` `` en vez de `basePath` (hoy `/marca/Oggi` hidrata con canonical propio e index: duplicado).

- [ ] **Step 1: Tests** (`test-route-seo.mjs`) con un `state = { products: [...], isLoading: false }` de 3 Wrangler pantalones ($760-$945) y 2 Oggi: asserts exactos de title y que description contiene `'Wrangler'`, `'$760'`, `'$945'`, `'todo México'`, longitud ≤ 160. Title de `/marca/wrangler` empieza con `'Jeans'`. En `test-product-copy.mjs`: title de un Wrangler Slim Fit contiene `'Jeans'`, de un Oggi chino de gabardina NO.
- [ ] **Step 2:** `npm test` → falla.
- [ ] **Step 3:** Implementar (las cuentas de marcas y precios salen de `state.products` filtrando `badge !== 'Borrador'`, igual que el resto de `routeSeo.js`).
- [ ] **Step 4:** `npm test` → pasa; `npx vite build` OK.
- [ ] **Step 5:** Commit `feat(seo): jeans en titulos y metas con marcas y rango de precio`.

### Task 4: Datos de producto para Merchant

**Files:**
- Modify: `scripts/prerender.mjs` (Product ~805-842 y variantes en `hasVariant` ~880-905)
- Modify: `src/utils/productCopy.js` (helpers puros) + `scripts/test-product-copy.mjs`

**Interfaces:**
- Produces: `productAudience(product) -> { '@type':'PeopleAudience', suggestedGender:'male'|'female', suggestedMinAge:13 }` (`female` solo si `type === 'Perfumes Dama'`).
- Produces: `listPriceSpec(product) -> object|undefined`: `{ '@type':'UnitPriceSpecification', price:Number(original_price), priceCurrency:'MXN', priceType:'https://schema.org/ListPrice' }` solo si `Number(original_price) > Number(price)`; si no, `undefined`.

- [ ] **Step 1: Tests:** `productAudience({type:'Perfumes Dama'}).suggestedGender === 'female'`; `({type:'Camisas'})` → `'male'`; `listPriceSpec({price:800, original_price:1000}).price === 1000`; `listPriceSpec({price:800, original_price:800}) === undefined`; `listPriceSpec({price:800})` → `undefined`; `original_price:'1000'` (string) funciona.
- [ ] **Step 2:** `npm test` → falla. **Step 3:** implementar helpers y usarlos en prerender: `audience` en Product y en cada variante; `priceSpecification: listPriceSpec(p)` en cada Offer (principal y variantes); `seller: { '@id': `${BASE_URL}/#marca` }` también en las Offer de variantes.
- [ ] **Step 4:** `npm test` + build; abrir `dist/producto/<una rebajada>/index.html` y confirmar `ListPrice` y `PeopleAudience` en el JSON-LD; en una sin rebaja, sin `priceSpecification`.
- [ ] **Step 5:** Commit `feat(merchant): genero/edad, precio de lista y seller en variantes`.

### Task 5: Relacionados que dicen lo que muestran

**Files:**
- Modify: `src/utils/related.js`; `scripts/test-related.mjs`
- Modify: `scripts/prerender.mjs` (`relatedSection` ~749) y donde la ficha SPA pinta el título (`src/pages/product/product.js`, buscar `isLookPairing`)

**Interfaces:**
- `relatedProducts(current, all, limit=4)`: orden nuevo = (1) misma prenda en otro color (mismo `name.trim()`, la misma clave que `variantGroups` en prerender), (2) misma marca y mismo `type`, (3) complementos actuales intercalados ("completa tu look"), (4) misma categoría de otra marca, (5) resto con perfumes al final, como hoy. Nunca incluye `current` ni borradores. La marca se calcula localmente con `String(name).split(/\s*-\s*/)[0].trim()` para NO importar de `productCopy.js` (que ya importa `groupOf` de aquí: ciclo). Un nombre sin " - " no tiene marca (no entra en (2)). Los asserts existentes de `test-related.mjs` deben seguir pasando.
- Nuevo `relatedTitle(current, items) -> string`: `'Otros colores'` si la mitad o más de `items` son (1); si no, `` `Más ${marca}` `` si la mitad o más son (1)+(2); si no, `'Completa tu look'` si `isLookPairing(current)`; si no, `'Más de la tienda'`.

- [ ] **Step 1: Tests:** pantalón Wrangler con 2 hermanos de color + 3 Wrangler pantalón + camisas → primeros 2 son los hermanos, título `'Otros colores'`; sin hermanos → `'Más Wrangler'`; sin marca → `'Completa tu look'`; 88 pantalones distintos no reciben todos los mismos 6 (assert: dos pantalones de marcas distintas dan listas distintas).
- [ ] **Step 2:** falla. **Step 3:** implementar y usar `relatedTitle` en prerender y en la ficha SPA (reemplaza el título actual).
- [ ] **Step 4:** `npm test` + build. **Step 5:** Commit `fix(relacionados): primero colores y misma marca, titulo que dice lo que lista`.

### Task 6: Arreglos técnicos chicos

**Files:** `vercel.json`, `index.html:2`, `scripts/prerender.mjs` (bloque sucursal ~958, sitemap ~1107, llms ~1159)

- [ ] **Step 1:** `index.html`: `lang="es"` → `lang="es-MX"`.
- [ ] **Step 2:** JSON-LD de página de sucursal: agregar `'@type': 'ClothingStore'` al bloque `{ '@id', mainEntityOfPage }`.
- [ ] **Step 3:** llms.txt: sección `## Marcas` con `- [Nombre](BASE_URL/marca/slug)` por cada `brands`.
- [ ] **Step 4:** sitemap: `lastmod` de cada categoría y marca = máximo `lastmodOf(p)` de sus productos (fallback `today`).
- [ ] **Step 5:** Redirects 308 en `vercel.json` (`redirects`, junto a los existentes) de variantes sin acento/minúsculas a la canónica para las categorías actuales: `/categoria/camisas`, `/categoria/pantalones`, `/categoria/jeans`→Pantalones, `/categoria/polos`, `/categoria/playeras`, `/categoria/shorts`, `/categoria/sueteres` y `/categoria/Sueteres`→`Su%C3%A9teres`, `/categoria/zapatos`, `/categoria/perfumes`, `/categoria/perfumes-dama`→`Perfumes%20Dama`; Sin redirects de marca (lo cubre el canonical de Task 3). Vercel compila `source` con `sensitive: true` (`@vercel/routing-utils` `sourceToRegex`), así que `/categoria/camisas` → `/categoria/Camisas` no hace bucle; confirmarlo en el preview deploy (vite preview no aplica `vercel.json`). Usar solo las categorías que existen hoy en el build (`categories` del prerender).
- [ ] **Step 6:** Títulos duplicados (3 pares en `technical.md` H-6): NO se cambia código; se listan al dueño para que diferencie los nombres en el admin.
- [ ] **Step 7:** `npm test` + build; `dist/llms.txt` lista 11 marcas; JSON `vercel.json` válido (`node -e "JSON.parse(require('fs').readFileSync('vercel.json'))"`).
- [ ] **Step 8:** Commit `fix(seo): es-MX, sucursal con tipo, marcas en llms.txt, lastmod real y redirects de categorias`.

### Task 8: Aviso de privacidad, Términos y cómo se paga

**Files:**
- Modify: `src/pages/info/infoData.js` (`infoPages`: nuevas `/privacidad` y `/terminos`; `/envios`: sección de pago clara)
- Modify: `src/core/routeSeo.js` (`infoSeo`: title/description de las dos páginas)
- Modify: `src/components/layout.js` (footer: enlaces Privacidad y Términos), `scripts/prerender.mjs` (`siteLinks()` de Task 1 los incluye)
- Modify: `src/pages/checkout/checkoutView.js` (junto al botón de confirmar: "Al confirmar aceptas los Términos y el Aviso de privacidad", con enlaces) y la pantalla de éxito (pasos del pago)

**Decisiones:**
- El pago SIGUE siendo por WhatsApp (decisión del dueño 2026-11-06). Se explica en `/envios`, checkout y éxito: métodos aceptados, que el pedido queda registrado en el sitio, que un asesor manda los datos de pago por WhatsApp en horario de tienda, y que el pedido se aparta X horas (usar lo que ya diga el sitio; si no dice, no inventar plazo).
- Aviso de privacidad según la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (2025): identidad y domicilio del responsable; datos que se recaban (nombre, WhatsApp, correo, dirección de envío, correo del newsletter — verificar en `src/store/` qué más se guarda); finalidades primarias (procesar pedido, envío, cambios, contacto) y secundarias (newsletter/promociones, con forma de negarse); transferencias (paquetería para el envío, proveedores de hosting/base de datos); derechos ARCO y cómo ejercerlos; cambios al aviso; fecha de actualización.
- Términos: precios en MXN con IVA, disponibilidad, pedido y confirmación por WhatsApp, envío (costo $150, gratis desde $1,499, 3 a 4 días hábiles), cambios (los mismos 8 días y condiciones de `/cambios`, enlazando), originalidad de productos, contacto. Nada que contradiga `/envios` o `/cambios`.
- Responsable (confirmado por el dueño 2026-11-06): **Ernesto Vega Vega**, persona física con actividad empresarial, que opera la marca comercial G&L. Domicilio: **Calle Ignacio Zaragoza #140, Col. Centro, C.P. 28000, Colima, Colima**. Contacto para privacidad/ARCO: **glboutiquecolima@gmail.com** y el WhatsApp de la tienda (`STORE_PHONE` / `BRAND`). NO publicar RFC ni CURP. El build **truena** si quedan marcadores `[[` en `infoPages` (assert en prerender).

- [ ] **Step 1:** Test en `scripts/test-home-content.mjs` o nuevo `scripts/test-info-pages.mjs`: existen `/privacidad` y `/terminos` en `infoPages`, cada una con ≥ 5 secciones, ninguna contiene `'[['`; footer de `layout.js` contiene `href="/privacidad"`.
- [ ] **Step 2:** falla. **Step 3:** redactar e implementar. **Step 4:** `npm test` + build; `dist/privacidad/index.html` y `dist/terminos/index.html` existen y están en `dist/sitemap.xml`.
- [ ] **Step 5:** Commit `feat(legal): aviso de privacidad, terminos y pasos de pago por WhatsApp`.

### Task 7: Verificación de que nada se rompió

- [ ] **Step 1:** `npm test` y `npx vite build` limpios.
- [ ] **Step 2:** `npx vite preview --port 4173` y recorrido con Chrome headless (`--dump-dom --virtual-time-budget=40000`): `/`, `/catalog`, `/categoria/Pantalones`, `/categoria/Su%C3%A9teres`, `/marca/wrangler`, `/marca/soul-blues`, una ficha rebajada, `/cart`, `/checkout`. Para cada una: la página hidratada pinta productos (no "0"), el `#prerender-shell` desapareció (no hay nav duplicado), sin errores en consola.
- [ ] **Step 3:** Comparar contra producción las mismas rutas: conteos de productos por categoría iguales.
- [ ] **Step 4:** Revisión del diff completo con Fable antes de reportar al dueño.
