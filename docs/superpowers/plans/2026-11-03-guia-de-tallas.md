# Guía de tallas por corte — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada ficha de producto muestre las medidas de la talla elegida, a partir de guías que el dueño captura una vez por marca + tipo de prenda + corte.

**Architecture:** Tabla `size_guides` en Supabase (lectura pública, escritura solo admin). Un módulo puro `src/utils/sizeGuides.js` decide qué guía le toca a un producto; el store la carga al arrancar como `categories`; la ficha y el admin la consumen.

**Tech Stack:** Vanilla JS (ESM) + Vite + Tailwind, Supabase (Postgres + RLS), pruebas `node scripts/test-*.mjs` con `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-11-03-guia-de-tallas-design.md`

## Global Constraints

- Sin dependencias nuevas. Reusar `escapeHtml` (`src/utils/sanitize.js`), `productBrand` / `productModel` (`src/utils/productCopy.js`), `qs` / `on` (`src/utils/dom.js`), `lockScroll` / `unlockScroll`.
- RLS: lectura `to anon, authenticated using (true)`; insert/update/delete solo `to authenticated` con `exists (select 1 from public.admin_users a where a.user_id = auth.uid())`. Ninguna política de escritura con `true`.
- Todo texto de una guía que llegue al HTML pasa por `escapeHtml`.
- Unidad fija: cm. Columnas por defecto: Pantalones y Shorts → `Cintura, Largo, Tiro`; Playeras, Camisas, Polos y Suéteres → `Largo, Hombros, Pecho`; Zapatos → `Largo de plantilla`; perfumes → sin guía.
- Un producto sin guía se ve exactamente igual que hoy.
- Despliegue = commit + push a `main`. Copy de la interfaz en español.

## Review Focus

1. **La talla elegida no está en la guía** (el producto maneja 33 y la guía no): no aparece el bloque de medidas, ni "undefined" ni una caja vacía. → test en Task 1 (`guideRow` devuelve `null`) y verificación en Task 4.
2. **Una fila con menos valores que columnas** (el dueño dejó una celda vacía): la ficha omite esa medida en lugar de pintar "cm" solo. → test en Task 1 (`measuresFor`).
3. **Texto con `<`, `"` o `&` en nombres de columna, nota o valores**: se ve tal cual, escapado. → test en Task 1 y revisión en Tasks 4 y 5.
4. **Producto con una sola talla**, que ya llega seleccionada (`initialSize`): las medidas se ven desde que carga la página, sin tocar nada. → verificación en Task 4.
5. **Caché vieja en `localStorage` tras editar una guía**: al guardar en el admin se actualizan `state.sizeGuides` y la caché, así que la ficha refleja el cambio al navegar. → verificación en Task 5.

---

### Task 1: Lógica pura de guías

**Files:**
- Create: `src/utils/sizeGuides.js`
- Create: `scripts/test-size-guides.mjs`
- Modify: `scripts/test.mjs` (agregar `import './test-size-guides.mjs'`)

**Interfaces:**
- Produces:
  - `type SizeGuide = { id, brand: string, type: string, cut: string, columns: string[], rows: { size: string, values: string[] }[], note: string|null }`
  - `findSizeGuide(product: {name, type}, guides: SizeGuide[]) -> SizeGuide|null`
  - `guideRow(guide: SizeGuide, size: string) -> {size, values}|null`
  - `measuresFor(guide: SizeGuide, size: string) -> {label: string, value: string}[]`: pares no vacíos, en el orden de las columnas.
  - `defaultColumns(type: string) -> string[]`
  - `guideLabel(guide: SizeGuide) -> string`: `"Oggi · Vaxter"`, o `"White Peak · Polos"` cuando no hay corte.

- [ ] **Step 1: Escribir las pruebas que fallan** en `scripts/test-size-guides.mjs`:

```js
import assert from 'node:assert/strict'
import { findSizeGuide, guideRow, measuresFor, defaultColumns, guideLabel } from '../src/utils/sizeGuides.js'

const g = (brand, type, cut, extra = {}) => ({ id: `${brand}|${type}|${cut}`, brand, type, cut, columns: ['Cintura', 'Largo', 'Tiro'], rows: [{ size: '32', values: ['82', '105', '26'] }], note: null, ...extra })
const vaxter = g('Oggi', 'Pantalones', 'Vaxter')
const vaxterSuper = g('Oggi', 'Pantalones', 'Vaxter Super')
const wp = g('White Peak', 'Polos', '', { columns: ['Largo', 'Ancho'], rows: [{ size: 'S', values: ['67', '50'] }] })
const collors = g("Collor's", 'Pantalones', 'Aiden')
const guides = [vaxter, vaxterSuper, wp, collors]
const p = (name, type) => ({ name, type })

assert.equal(findSizeGuide(p('Oggi - Vaxter Gabardina Khaki', 'Pantalones'), guides), vaxter)
assert.equal(findSizeGuide(p('Oggi - Vaxter Super Gabardina Khaki', 'Pantalones'), guides), vaxterSuper) // gana el corte más largo
assert.equal(findSizeGuide(p('Oggi - Vaxters Raro', 'Pantalones'), guides), null)                      // palabra completa
assert.equal(findSizeGuide(p('OGGI - vaxter rebel negro', 'Pantalones'), guides), vaxter)              // mayúsculas
assert.equal(findSizeGuide(p('Oggi - Chinos Slim', 'Pantalones'), guides), null)                        // sin guía
assert.equal(findSizeGuide(p('White Peak - Amarillo', 'Polos'), guides), wp)                            // marca sin corte
assert.equal(findSizeGuide(p('White Peak - Pantalon Khaki', 'Pantalones'), guides), null)              // otro tipo de prenda
assert.equal(findSizeGuide(p('Collor’s - Aiden 3362', 'Pantalones'), guides), collors)                 // apóstrofo curvo
assert.equal(findSizeGuide(p('Collor`s -Aiden 3372', 'Pantalones'), guides), collors)                  // acento grave y sin espacio
assert.equal(findSizeGuide(p('Oggi - Váxter Avatar', 'Pantalones'), guides), vaxter)                   // acentos
assert.equal(findSizeGuide(p('Camisa sin marca', 'Camisas'), [g('Camisa sin marca', 'Camisas', '')]), null) // sin separador = sin marca

assert.deepEqual(guideRow(vaxter, '32'), { size: '32', values: ['82', '105', '26'] })
assert.equal(guideRow(vaxter, '33'), null)
assert.deepEqual(measuresFor(vaxter, '32'), [{ label: 'Cintura', value: '82' }, { label: 'Largo', value: '105' }, { label: 'Tiro', value: '26' }])
assert.deepEqual(measuresFor(g('Oggi', 'Pantalones', 'X', { rows: [{ size: '32', values: ['82', '', '26'] }] }), '32'),
  [{ label: 'Cintura', value: '82' }, { label: 'Tiro', value: '26' }])                                   // celda vacía se omite
assert.deepEqual(measuresFor(vaxter, '33'), [])

assert.deepEqual(defaultColumns('Pantalones'), ['Cintura', 'Largo', 'Tiro'])
assert.deepEqual(defaultColumns('Polos'), ['Largo', 'Hombros', 'Pecho'])
assert.deepEqual(defaultColumns('Zapatos'), ['Largo de plantilla'])
assert.deepEqual(defaultColumns('Perfumes'), [])
assert.equal(guideLabel(vaxter), 'Oggi · Vaxter')
assert.equal(guideLabel(wp), 'White Peak · Polos')

console.log('ok — size guides')
```

- [ ] **Step 2: Correr y ver que falla**

Run: `node scripts/test-size-guides.mjs`
Expected: FAIL, `Cannot find module …/src/utils/sizeGuides.js`

- [ ] **Step 3: Implementar `src/utils/sizeGuides.js`**

`norm(s)`: minúsculas, `normalize('NFD')` sin diacríticos, apóstrofos `` [`´‘’] `` → `'`, espacios colapsados y trim. Marca del producto = `norm(productBrand(name))`; si el nombre no tiene separador de marca (`productModel(name) === name.trim()`), devolver `null`. Palabras del modelo = `norm(productModel(name)).split(' ')`; una guía aplica si `norm(guide.brand) === marca`, `guide.type === product.type` y las palabras de `norm(guide.cut)` (vacío = cero palabras) son prefijo de las del modelo. Gana la de más palabras en el corte. `defaultColumns` usa `isPerfumeCategory` / `isShoeCategory` de `src/pages/admin/adminProductsData.js` para perfumes y zapatos, y la lista Pantalones/Shorts para cintura.

- [ ] **Step 4: Correr y ver que pasa**

Run: `node scripts/test-size-guides.mjs && npm test`
Expected: `ok — size guides` y el resto de las pruebas en ok.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sizeGuides.js scripts/test-size-guides.mjs scripts/test.mjs
git commit -m "feat(guia-tallas): logica para encontrar la guia de un producto"
```

### Task 2: Tabla `size_guides` y guía de White Peak

**Files:**
- Create: `supabase/size-guides.sql`

**Interfaces:**
- Produces: tabla `public.size_guides(id uuid pk default gen_random_uuid(), brand text not null, type text not null, cut text not null default '', columns jsonb not null default '[]', rows jsonb not null default '[]', note text, created_at timestamptz default now(), updated_at timestamptz default now())`, con índice único sobre `(lower(brand), type, lower(cut))` y el trigger `set_updated_at` existente.

- [ ] **Step 1: Escribir `supabase/size-guides.sql`**: tabla, RLS con 4 políticas según Global Constraints (`size_guides_public_read`, `size_guides_admin_insert`, `size_guides_admin_update`, `size_guides_admin_delete`) y el insert de la guía inicial:
  - brand `White Peak`, type `Polos`, cut `''`, columns `["Largo","Ancho"]`, note `Todas las medidas están en centímetros.`
  - rows: S 67/50 · M 68/55 · L 72/58 · XL 75/60 · XXL 77/64 · XXXL 80/65 · XXXXL 82/67
- [ ] **Step 2: Aplicar** con `mcp__supabase__apply_migration` (name `size_guides`). Requiere aprobación del dueño en la sesión.
- [ ] **Step 3: Probar RLS** con `execute_sql` en una transacción con `rollback`: como `anon`, `select count(*)` da 1 y un `update … returning` da 0 filas; como `authenticated` con `sub` aleatorio, también 0 filas; como `authenticated` con el `user_id` de `admin_users`, 1 fila. Luego `get_advisors(security)` sin avisos nuevos para `size_guides`.
- [ ] **Step 4: Commit**

```bash
git add supabase/size-guides.sql
git commit -m "feat(guia-tallas): tabla size_guides con RLS de admin y guia de White Peak"
```

### Task 3: Store de guías

**Files:**
- Create: `src/store/sizeGuides.js`
- Modify: `src/store/state.js` (agregar `sizeGuides: []` al `state` y a `getState()`)
- Modify: `src/store/index.js` (re-exportar)
- Modify: `src/core/startApp.js:98-100` (llamar `loadSizeGuides()` junto a `loadCategories()`)

**Interfaces:**
- Consumes: `SizeGuide` (Task 1), tabla `size_guides` (Task 2).
- Produces: `loadSizeGuides(): Promise<void>`, `getSizeGuides(): SizeGuide[]`, `addSizeGuide(g): Promise<{data?, error?}>`, `updateSizeGuide(id, patch): Promise<{error}>`, `deleteSizeGuide(id): Promise<{error}>`. Mismo patrón que `src/store/categories.js`: caché `gl_size_guides_cache` / `gl_size_guides_cache_ts` con TTL de 1 h, refresco en segundo plano, `ensureAdminAccess()` antes de escribir, `emit()` tras cada cambio, y **reescribir la caché tras cada escritura**.

- [ ] **Step 1: Implementar** el módulo, normalizando cada fila de la base a `SizeGuide` (`columns` y `rows` arreglos aunque vengan nulos, `cut` como `''`).
- [ ] **Step 2: Verificar**: `npm test` y `npx vite build` sin errores. En `npm run dev`, desde la consola de la página, `(await import('/src/store/index.js')).getSizeGuides()` devuelve la guía de White Peak.
- [ ] **Step 3: Commit**

```bash
git add src/store/sizeGuides.js src/store/state.js src/store/index.js src/core/startApp.js
git commit -m "feat(guia-tallas): cargar las guias al arrancar"
```

### Task 4: Medidas en la ficha del producto

**Files:**
- Modify: `src/pages/product/product.js` (bloque de tallas, ~líneas 337-349; handler de tallas, ~705-719; modal de guía, ~597-642)

**Interfaces:**
- Consumes: `findSizeGuide`, `measuresFor`, `guideLabel` (Task 1); `state.sizeGuides` (Task 3).

- [ ] **Step 1: Calcular** `const sizeGuide = isPerfume ? null : findSizeGuide(product, state.sizeGuides)` junto a la preparación de datos (~línea 165). Si hay `sizeGuide`, la foto de guía (`sizeGuideImage`) no se usa para el botón; sigue fuera de la galería.
- [ ] **Step 2: Bloque de medidas** entre `#pdp-sizes` y los CTAs: `<div id="pdp-size-measures" aria-live="polite">`, que muestra `measuresFor(sizeGuide, selectedSize)` como pares *etiqueta / valor + " cm"* con el estilo del boceto B (fondo azul claro de marca, etiquetas mono en mayúsculas de 11 px o más). Vacío y oculto (`hidden`) si no hay guía, no hay talla o la talla no tiene fila. Se pinta con `initialSize` al cargar y se repinta en el handler de clic de talla.
- [ ] **Step 3: Botón y modal**: con `sizeGuide`, el botón `#pdp-size-guide` dice "Ver tabla completa" y abre el mismo modal `#size-guide-modal` (mismo cierre con Esc, clic fuera y foco de vuelta), con: título `guideLabel(sizeGuide)` + " — medidas de la prenda", una `<table>` con `<th scope="col">` (Talla + columnas) y `<th scope="row">` por talla, la fila de `selectedSize` resaltada, la `note`, y un enlace "¿Dudas? Pregúntanos por WhatsApp" a `https://wa.me/${BRAND.whatsapp}?text=` + `encodeURIComponent('Hola, tengo una duda de talla del ' + product.name)`. La trampa de foco debe recorrer los dos controles (Cerrar y el enlace). Sin `sizeGuide`, el botón de foto queda como hoy.
- [ ] **Step 4: Verificar** con `npm run dev` en Chrome:
  - Un polo White Peak: al tocar M se ve "Largo 68 cm · Ancho 55 cm"; con XXL, "77 / 64"; la tabla completa muestra de S a XXXXL con la fila elegida resaltada, y ya no aparece la foto.
  - Un pantalón sin guía (`Oggi - Chinos Slim`): la ficha queda idéntica a producción.
  - Un producto con una sola talla y guía: las medidas se ven al cargar.
  - Una talla sin fila: no aparece el bloque.
  - Sin errores en la consola.
- [ ] **Step 5: Commit**

```bash
git add src/pages/product/product.js
git commit -m "feat(guia-tallas): medidas de la talla elegida en la ficha"
```

### Task 5: Sección "Guías de tallas" en el admin

**Files:**
- Create: `src/pages/admin/adminSizeGuides.js`
- Modify: `src/core/views.js` (ruta `'/admin/size-guides'` → `pageAdminSizeGuides`)
- Modify: `src/components/layout.js:276-298` (entrada en `NAV` después de Categorías, icono `tag`, etiqueta `Guías de tallas`, grupo `Tienda`; y en `TITLES`)

**Interfaces:**
- Consumes: store (Task 3), `findSizeGuide`, `defaultColumns`, `guideLabel` (Task 1), `getCategories()`, `productBrand`, `confirmDelete` (`adminConfirm.js`), `ICON`, `showToast`.
- Produces: `pageAdminSizeGuides(state) -> { title, html, onMount(root) }`, con la misma forma que `pageAdminCategories`.

- [ ] **Step 1: Lista**: una tarjeta por guía con `guideLabel`, tipo, número de tallas y "Aplica a N productos" (N = productos de `state.products` cuyo `findSizeGuide` es esa guía). Estado vacío: texto que explique para qué sirve, más el botón "Nueva guía".
- [ ] **Step 2: Formulario** (crear y editar, en el mismo panel): marca (input con `datalist` de marcas existentes, como en `adminProductForm.js:88`), tipo de prenda (select de categorías), corte (opcional, con ayuda: "Como empieza el nombre después de la marca, ej. Vaxter"), columnas (un input por columna, con agregar y quitar; se precargan con `defaultColumns(tipo)` al elegir tipo en una guía nueva), filas (una por talla: input de talla y un input por columna; agregar y quitar fila), nota. Vista previa en vivo: "Esta guía aplica a N productos" y los primeros 5 nombres. Guardar valida marca, tipo y al menos una columna y una fila con talla; un error de unicidad (23505) se muestra como "Ya existe una guía para esa marca, tipo y corte".
- [ ] **Step 3: Borrar** con `confirmDelete`.
- [ ] **Step 4: Verificar**: `npm test` (incluye `test-admin-escaping.mjs`) y `npx vite build`. En Chrome con sesión de admin:
  - La guía de White Peak aparece con "Aplica a 10 productos".
  - Crear una guía de prueba `Oggi · Pantalones · Vaxter` muestra "Aplica a" ~15 productos; al abrir un Vaxter en la tienda (sin recargar) se ven sus medidas.
  - Editarla cambia la ficha; borrarla la quita.
  - Un valor `<b>x</b>` se ve como texto.
  - **Borrar la guía de prueba al terminar.**
- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/adminSizeGuides.js src/core/views.js src/components/layout.js
git commit -m "feat(guia-tallas): seccion de guias en el admin"
```

### Task 6: Guía detectada en el formulario de producto

**Files:**
- Modify: `src/pages/admin/adminProductForm.js` (línea de solo lectura bajo las tallas, `id="detected-size-guide"`)
- Modify: `src/pages/admin/adminProducts.js` (actualizarla en vivo)

**Interfaces:**
- Consumes: `findSizeGuide`, `guideLabel` (Task 1); `getSizeGuides()` (Task 3).

- [ ] **Step 1: Implementar**: función local `paintDetectedGuide()` que arma el nombre igual que `adminProducts.js:687-689` (`brand && model ? \`${brand} - ${model}\` : model || brand`) y el `type` del select, y escribe "Guía de tallas: Oggi · Vaxter" o "Sin guía de tallas" (con `textContent`). Se llama al abrir el formulario (nuevo o edición) y en `input` de marca y modelo y `change` de tipo. Oculta para perfumes.
- [ ] **Step 2: Verificar** en Chrome: abrir un polo White Peak dice "White Peak · Polos"; un Chinos Slim dice "Sin guía de tallas"; en un producto nuevo, escribir marca "White Peak" con tipo Polos hace que cambie en vivo. Cerrar sin guardar.
- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/adminProductForm.js src/pages/admin/adminProducts.js
git commit -m "feat(guia-tallas): el formulario de producto muestra la guia que le toca"
```

### Task 7: Revisión, despliegue y prueba en producción

- [ ] **Step 1:** `npm test` y `npx vite build` en verde.
- [ ] **Step 2:** Revisión del diff completo con un subagente `model: "fable"` contra el spec (CLAUDE.md del dueño). Corregir lo confirmado.
- [ ] **Step 3:** `git push origin main` y esperar a que el estado del commit sea `success` (`gh api repos/:owner/:repo/commits/<sha>/status`).
- [ ] **Step 4:** En producción (Chrome): polo White Peak con medidas y tabla; pantalón sin guía idéntico a antes; home, catálogo, carrito y checkout sin errores en consola; admin → Guías de tallas abre y lista White Peak.
- [ ] **Step 5:** Avisar al dueño que puede capturar la guía de Oggi · Vaxter cuando tenga las medidas, o mandarlas para capturarlas.
