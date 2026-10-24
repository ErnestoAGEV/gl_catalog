import { getSiteContent, addSiteContent, addSiteContentRows, updateSiteContent, deleteSiteContent, reorderSiteContent, uploadSiteImage, refreshSiteContent, getCategories } from '../../store/index.js'
import { showToast } from '../../utils/toast.js'
import { escapeHtml as esc } from '../../utils/sanitize.js'
import { lockScroll, unlockScroll } from '../../utils/dom.js'
import { confirmDelete } from './adminConfirm.js'
import { ICON } from './adminIcons.js'
import { makeSortable, dragHandle } from './adminSortable.js'
import { CONTENT_VERSION, defaultRows, headlineHtml, resolveImage } from '../../pages/home/homeContent.js'
import { categoryTiles as defaultTiles } from '../../pages/home/homeData.js'
import { marqueeHtml } from '../../components/layout.js'

// Contenido editable de la home. Solo se listan filas v2 (content.v === 2): las
// anteriores nunca llegaron a la tienda y traen cifras que ya no son ciertas.
// Una seccion sin filas v2 muestra lo que la tienda ensena hoy y un boton
// "Personalizar" que copia ese contenido a la base en una sola insercion.

const SECTIONS = {
  hero_slide: { label: 'Portada', hint: 'Los slides grandes del inicio. Arrastra para cambiar el orden.' },
  marquee: { label: 'Barra de anuncios', hint: 'La franja negra que corre arriba en todas las páginas.' },
  stat: { label: 'Cifras', hint: 'La banda negra con números, debajo de la portada. Máximo 4.' },
  manifesto: { label: 'Manifiesto', hint: 'El bloque azul con el texto de la tienda.' },
  category_tile: { label: 'Mosaico de categorías', hint: 'Las 4 tarjetas grandes. Cada lugar tiene su tamaño fijo en el diseño.' },
}

const STAT_KINDS = [
  { value: '', label: 'Número fijo' },
  { value: 'catalogCount', label: 'Piezas en catálogo (se cuenta solo)' },
  { value: 'googleReviews', label: 'Opiniones de Google (enlaza a la ficha)' },
]

const isV2 = (r) => r?.content?.v === CONTENT_VERSION
const thumb = (url) => resolveImage(url, {})?.image || url || ''

export function pageAdminBanners() {
  return {
    title: 'Contenido | Admin G&L',
    html: `
      <div id="adm-banners-root" class="admin-view-in max-w-3xl mx-auto space-y-6">
        <div class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    `,

    async onMount(root) {
      const pageRoot = root.querySelector('#adm-banners-root')
      if (!pageRoot) return

      let allContent = []
      const rowsOf = (section) => allContent.filter(r => r.section === section && isV2(r)).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

      const reload = async () => {
        allContent = await getSiteContent()
        render()
      }

      // Tras cada cambio: relee, repinta y actualiza la cache de la tienda en este navegador.
      const afterSave = async (msg = 'Guardado. Ya se ve en la tienda.') => {
        await refreshSiteContent()
        await reload()
        showToast(msg, 'success')
      }

      const fail = (msg, error) => {
        if (import.meta.env.DEV && error) console.error(error)
        showToast(msg, 'error')
      }

      // ── Bloques comunes ──
      const card = (section, body, action = '') => `
        <section class="bg-paper rounded-3xl border border-line shadow-card overflow-hidden" data-section="${section}">
          <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
            <div class="min-w-0">
              <h2 class="font-display font-bold text-ink text-[17px]">${SECTIONS[section].label}</h2>
              <p class="text-[12.5px] text-muted mt-0.5">${SECTIONS[section].hint}</p>
            </div>
            ${action}
          </div>
          <div class="px-5 pb-5">${body}</div>
        </section>`

      const personalize = (section) => `
        <div class="rounded-xl2 border border-dashed border-line-strong bg-canvas px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p class="text-[13px] text-body flex-1">Esta sección muestra el contenido original de la página. Para cambiarlo, primero cópialo aquí.</p>
          <button type="button" class="adm-btn adm-btn-primary shrink-0" data-personalize="${section}">Personalizar</button>
        </div>`

      const rowActions = (r, editAttr) => `
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" data-toggle="${r.id}" class="gl-toggle ${r.active ? 'on' : ''}" title="${r.active ? 'Ocultar' : 'Mostrar'}" aria-label="${r.active ? 'Ocultar' : 'Mostrar'}"></button>
          <button type="button" ${editAttr}="${r.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors" title="Editar" aria-label="Editar">${ICON.edit('w-[17px] h-[17px]')}</button>
          <button type="button" data-delete="${r.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors" title="Eliminar" aria-label="Eliminar">${ICON.trash('w-[17px] h-[17px]')}</button>
        </div>`

      const hiddenTag = (r) => r.active ? '' : '<span class="text-[10px] px-1.5 py-0.5 rounded bg-line text-muted font-medium">Oculto</span>'

      // ── Secciones ──
      const heroHtml = () => {
        const rows = rowsOf('hero_slide')
        if (!rows.length) return card('hero_slide', personalize('hero_slide'))
        const list = rows.map(r => `
          <div class="group flex items-center gap-3 bg-canvas rounded-xl2 border border-line hover:border-line-strong px-3.5 py-3 transition-[border-color,box-shadow] select-none cursor-grab" data-sort-id="${r.id}">
            ${dragHandle(r.title || 'slide')}
            <img src="${esc(thumb(r.image_url))}" alt="" class="w-12 h-12 rounded-lg object-cover shrink-0 border border-line bg-line" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[14px] font-semibold text-ink truncate">${headlineHtml(r.title, r.content?.accent, r.content?.accentStyle).replace(/<br\/>/g, ' ') || '<span class="text-muted italic">Sin título</span>'}</span>
                ${hiddenTag(r)}
              </div>
              <span class="text-[12px] text-faint truncate block">${esc(r.cta_link === '#copy' ? 'Botón: copiar cupón WELCOME10' : (r.subtitle || ''))}</span>
            </div>
            ${rowActions(r, 'data-edit-slide')}
          </div>`).join('')
        return card('hero_slide', `<div id="hero-sortable" class="space-y-2">${list}</div>`,
          `<button type="button" id="btn-add-slide" class="adm-btn adm-btn-primary shrink-0">${ICON.plus('w-[18px] h-[18px]')} Agregar slide</button>`)
      }

      const marqueeSection = () => {
        const r = rowsOf('marquee')[0]
        if (!r) return card('marquee', personalize('marquee'))
        return card('marquee', `
          <form id="marquee-form" class="space-y-3">
            <textarea name="title" rows="2" maxlength="400" class="adm-fld resize-y" aria-label="Texto de la barra de anuncios">${esc(r.title || '')}</textarea>
            <p class="text-[11.5px] text-muted">Separa los avisos con " — ". El texto se repite solo a lo largo de la barra.</p>
            <div class="flex justify-end">
              <button type="submit" class="adm-btn adm-btn-primary">Guardar</button>
            </div>
          </form>`)
      }

      const statsSection = () => {
        const rows = rowsOf('stat')
        if (!rows.length) return card('stat', personalize('stat'))
        const list = rows.map(r => {
          const kind = r.content?.kind
          const big = kind === 'catalogCount' ? '<span class="text-muted">auto</span>' : headlineHtml(r.title, r.content?.accent, 'brand')
          return `
          <div class="group flex items-center gap-3 bg-canvas rounded-xl2 border border-line hover:border-line-strong px-3.5 py-3 transition-[border-color,box-shadow] select-none cursor-grab" data-sort-id="${r.id}">
            ${dragHandle(r.subtitle || 'cifra')}
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-[20px] font-display font-extrabold text-ink tnum">${big}</p>
                ${hiddenTag(r)}
              </div>
              <p class="text-[12.5px] text-muted truncate">${esc(r.subtitle || '')}${kind ? ` · ${esc(STAT_KINDS.find(k => k.value === kind)?.label || '')}` : ''}</p>
            </div>
            ${rowActions(r, 'data-edit-stat')}
          </div>`
        }).join('')
        return card('stat', `<div id="stats-sortable" class="space-y-2">${list}</div>`,
          rows.length < 4 ? `<button type="button" id="btn-add-stat" class="adm-btn adm-btn-primary shrink-0">${ICON.plus('w-[18px] h-[18px]')} Agregar</button>` : '')
      }

      const manifestoSection = () => {
        const r = rowsOf('manifesto')[0]
        if (!r) return card('manifesto', personalize('manifesto'))
        return card('manifesto', `
          <form id="manifesto-form" class="space-y-3">
            <div>
              <label class="adm-lbl" for="mf-title">Texto principal</label>
              <textarea id="mf-title" name="title" rows="4" maxlength="600" class="adm-fld resize-y">${esc(r.title || '')}</textarea>
            </div>
            <div>
              <label class="adm-lbl" for="mf-sub">Remate (se ve más tenue al final)</label>
              <input id="mf-sub" name="subtitle" maxlength="200" class="adm-fld" value="${esc(r.subtitle || '')}" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="adm-lbl" for="mf-cta">Texto del enlace</label>
                <input id="mf-cta" name="cta_text" maxlength="60" class="adm-fld" value="${esc(r.cta_text || '')}" placeholder="Vacío = sin enlace" />
              </div>
              <div>
                <label class="adm-lbl" for="mf-link">Lleva a</label>
                ${linkSelect('cta_link', r.cta_link, 'mf-link')}
              </div>
            </div>
            <div class="flex justify-end"><button type="submit" class="adm-btn adm-btn-primary">Guardar</button></div>
          </form>`)
      }

      const tilesSection = () => {
        const rows = rowsOf('category_tile')
        if (!rows.length) return card('category_tile', personalize('category_tile'))
        const tiles = defaultTiles.map((base, i) => {
          const r = rows.find(x => x.display_order === i + 1)
          const size = ['Grande', 'Mediana', 'Chica', 'Chica'][i] || ''
          return `
            <button type="button" ${r ? `data-edit-tile="${r.id}"` : `data-create-tile="${i + 1}"`} class="group relative aspect-[4/3] rounded-xl2 overflow-hidden border border-line text-left focus-visible:ring-2 focus-visible:ring-brand">
              <img src="${esc(thumb(r?.image_url || base.image))}" alt="" class="absolute inset-0 w-full h-full object-cover" />
              <span class="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/0"></span>
              <span class="absolute top-2 left-2 text-[10px] font-mono uppercase tracking-wider bg-paper/90 text-ink px-1.5 py-0.5 rounded">${i + 1} · ${size}</span>
              <span class="absolute bottom-2 left-3 right-3 text-paper">
                <span class="block font-display font-bold text-[16px] leading-tight">${esc(r?.title || base.name)}</span>
                <span class="block text-[11px] opacity-80 truncate">${esc(r ? (r.content?.eyebrow || '') : base.eyebrow)}</span>
              </span>
              <span class="absolute top-2 right-2 w-7 h-7 rounded-lg bg-paper/90 text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">${ICON.edit('w-4 h-4')}</span>
            </button>`
        }).join('')
        return card('category_tile', `<div class="grid grid-cols-2 gap-3">${tiles}</div>`)
      }

      // ── Selector de destino para botones/enlaces ──
      function linkSelect(name, current, id, { allowCopy = false } = {}) {
        const cats = getCategories().filter(c => c.active !== false)
        const options = [
          ['/catalog', 'Toda la tienda'],
          ...cats.map(c => [`/categoria/${encodeURIComponent(c.name)}`, `Categoría: ${c.name}`]),
          ['/sucursales', 'Sucursales'],
          ['/nosotros', 'Nosotros'],
          ...(allowCopy ? [['#copy', 'Copiar cupón WELCOME10']] : []),
        ]
        const known = options.some(([v]) => v === current)
        return `
          <select id="${id}" name="${name}" class="adm-fld" data-link-select>
            ${options.map(([v, l]) => `<option value="${esc(v)}" ${v === current ? 'selected' : ''}>${esc(l)}</option>`).join('')}
            <option value="__other" ${current && !known ? 'selected' : ''}>Otro enlace…</option>
          </select>
          <input name="${name}_other" class="adm-fld mt-2 ${current && !known ? '' : 'hidden'}" placeholder="/ruta o https://…" value="${current && !known ? esc(current) : ''}" />`
      }

      const readLink = (form, name) => {
        const v = form.elements[name].value
        return v === '__other' ? form.elements[`${name}_other`].value.trim() : v
      }

      // ── Modal genérico ──
      function openModal({ title, body, onSave, onOpen }) {
        document.getElementById('adm-content-modal')?.remove()
        const modal = document.createElement('div')
        modal.id = 'adm-content-modal'
        modal.className = 'fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade'
        modal.innerHTML = `
          <div class="w-full max-w-lg bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-modal="true" aria-label="${esc(title)}">
            <div class="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <h2 class="font-display font-bold text-ink text-[17px]">${esc(title)}</h2>
              <button type="button" data-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors" aria-label="Cerrar">${ICON.close('w-[18px] h-[18px]')}</button>
            </div>
            <form data-form class="px-5 pb-5 space-y-4 overflow-y-auto adm-scroll-thin flex-1" novalidate>
              ${body}
              <p data-error class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2"></p>
              <div class="flex gap-2.5 pt-1">
                <button type="button" data-close class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                <button type="submit" data-submit class="adm-btn adm-btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>`
        document.body.appendChild(modal)
        lockScroll()

        const form = modal.querySelector('[data-form]')
        const errorEl = modal.querySelector('[data-error]')
        const submit = modal.querySelector('[data-submit]')
        let dirty = false
        let saving = false
        form.addEventListener('input', () => { dirty = true })
        form.addEventListener('change', (e) => {
          dirty = true
          if (e.target.matches('[data-link-select]')) {
            form.elements[`${e.target.name}_other`]?.classList.toggle('hidden', e.target.value !== '__other')
          }
        })

        const close = () => {
          document.removeEventListener('keydown', onKey)
          modal.remove()
          unlockScroll()
        }
        const requestClose = async () => {
          if (saving) return
          if (dirty && !await confirmDelete({ title: '¿Descartar cambios?', message: 'Lo que cambiaste no se ha guardado.', confirmLabel: 'Descartar' })) return
          close()
        }
        function onKey(e) {
          if (e.key === 'Escape' && !document.getElementById('adm-confirm-modal')) requestClose()
        }
        document.addEventListener('keydown', onKey)
        modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', requestClose))
        modal.addEventListener('click', (e) => { if (e.target === modal) requestClose() })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')
          saving = true
          submit.disabled = true
          submit.textContent = 'Guardando...'
          try {
            const err = await onSave(form)
            if (err) {
              errorEl.textContent = err
              errorEl.classList.remove('hidden')
              return
            }
            close()
          } finally {
            saving = false
            submit.disabled = false
            submit.textContent = 'Guardar'
          }
        })

        onOpen?.(form)
        form.querySelector('input:not([type=hidden]), textarea')?.focus()
      }

      // Campo de foto: muestra la actual, permite cambiarla o volver a la original.
      const imageField = (current, original, warning = '') => `
        <div>
          <span class="adm-lbl">Foto</span>
          <div class="flex items-center gap-3">
            <img data-img-preview src="${esc(thumb(current || original))}" alt="" ${current || original ? '' : 'hidden'} class="w-20 h-20 rounded-xl object-cover border border-line bg-line shrink-0" />
            <div class="flex flex-col gap-1.5 items-start">
              <label class="adm-btn adm-btn-ghost py-1.5 px-3 text-[12.5px] cursor-pointer">
                Cambiar foto
                <input type="file" name="image" accept="image/jpeg,image/png,image/webp" class="sr-only" />
              </label>
              ${original && current !== original ? '<button type="button" data-img-reset class="text-[12px] font-medium text-muted hover:text-ink">Volver a la foto original</button>' : ''}
            </div>
          </div>
          <input type="hidden" name="image_url" value="${esc(current || original || '')}" />
          <p class="text-[11.5px] text-muted mt-2">Se reduce sola antes de subirla. ${warning}</p>
        </div>`

      const bindImageField = (form, original) => {
        const preview = form.querySelector('[data-img-preview]')
        form.elements.image.addEventListener('change', () => {
          const f = form.elements.image.files[0]
          if (f) { preview.src = URL.createObjectURL(f); preview.hidden = false }
        })
        form.querySelector('[data-img-reset]')?.addEventListener('click', () => {
          form.elements.image.value = ''
          form.elements.image_url.value = original
          preview.src = original
          form.dispatchEvent(new Event('input'))
        })
      }

      // Sube la foto nueva si la hay; si no, conserva la URL del campo.
      const readImage = async (form) => {
        const f = form.elements.image.files[0]
        if (!f) return { image_url: form.elements.image_url.value || null }
        const { url, w, h, error } = await uploadSiteImage(f)
        if (error) throw new Error('No se pudo subir la foto. Inténtalo de nuevo.')
        return { image_url: url, w, h }
      }

      // ── Editores ──
      function openSlide(r = null) {
        const rows = rowsOf('hero_slide')
        const isFirst = r ? rows[0]?.id === r.id : rows.length === 0
        const c = r?.content || {}
        openModal({
          title: r ? 'Editar slide' : 'Nuevo slide',
          body: `
            <div>
              <label class="adm-lbl" for="sl-title">Título *</label>
              <textarea id="sl-title" name="title" rows="2" maxlength="80" class="adm-fld resize-none font-display font-bold text-[18px]">${esc(r?.title || '')}</textarea>
              <p class="text-[11.5px] text-muted mt-1">Enter hace un salto de línea, como en la página.</p>
            </div>
            <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <div>
                <label class="adm-lbl" for="sl-accent">Palabra destacada</label>
                <input id="sl-accent" name="accent" maxlength="40" class="adm-fld" value="${esc(c.accent || '')}" placeholder="Ej: perfecto." />
              </div>
              <div>
                <label class="adm-lbl" for="sl-style">Estilo</label>
                <select id="sl-style" name="accentStyle" class="adm-fld">
                  <option value="brand" ${c.accentStyle !== 'outline' ? 'selected' : ''}>Azul</option>
                  <option value="outline" ${c.accentStyle === 'outline' ? 'selected' : ''}>Contorno</option>
                </select>
              </div>
            </div>
            <div class="rounded-xl2 bg-canvas border border-line px-4 py-3">
              <p class="eyebrow text-faint mb-1">Vista previa</p>
              <p data-preview class="font-heading font-[800] text-[30px] leading-[0.95] tracking-[-0.03em] text-ink break-words"></p>
            </div>
            <div>
              <label class="adm-lbl" for="sl-body">Texto</label>
              <textarea id="sl-body" name="subtitle" rows="3" maxlength="300" class="adm-fld resize-y" placeholder="Vacío en el slide del cupón = texto de WELCOME10">${esc(r?.subtitle || '')}</textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="adm-lbl" for="sl-cta">Texto del botón</label>
                <input id="sl-cta" name="cta_text" maxlength="40" class="adm-fld" value="${esc(r?.cta_text || '')}" placeholder="Ej: Ver denim" />
              </div>
              <div>
                <label class="adm-lbl" for="sl-link">El botón lleva a</label>
                ${linkSelect('cta_link', r?.cta_link || '/catalog', 'sl-link', { allowCopy: true })}
              </div>
            </div>
            <div>
              <label class="adm-lbl" for="sl-caption">Leyenda sobre la foto</label>
              <input id="sl-caption" name="caption" maxlength="60" class="adm-fld" value="${esc(c.caption || '')}" placeholder="Ej: Look 01 — Polo gris + khaki" />
            </div>
            ${imageField(r?.image_url, '', isFirst ? '<span class="text-warn font-medium">Es el primer slide: su foto es lo primero que carga la tienda. Una foto subida aquí se ve al momento, pero la carga rápida (y la vista previa de Google) llega con el siguiente despliegue.</span>' : '')}
          `,
          onOpen: (form) => {
            const preview = form.querySelector('[data-preview]')
            const paint = () => { preview.innerHTML = headlineHtml(form.elements.title.value || 'Título', form.elements.accent.value, form.elements.accentStyle.value) }
            form.addEventListener('input', paint)
            form.addEventListener('change', paint)
            paint()
            bindImageField(form, '')
          },
          onSave: async (form) => {
            const title = form.elements.title.value.trim()
            if (!title) return 'El título es obligatorio.'
            const cta_link = readLink(form, 'cta_link')
            if (!cta_link) return 'Escribe a dónde lleva el botón.'
            let img
            try { img = await readImage(form) } catch (e) { return e.message }
            if (!img.image_url) return 'Elige una foto para el slide.'
            const payload = {
              title,
              subtitle: form.elements.subtitle.value.trim(),
              cta_text: form.elements.cta_text.value.trim(),
              cta_link,
              image_url: img.image_url,
              content: {
                ...c,
                v: CONTENT_VERSION,
                accent: form.elements.accent.value.trim(),
                accentStyle: form.elements.accentStyle.value,
                caption: form.elements.caption.value.trim(),
                ...(img.w ? { w: img.w, h: img.h } : {}),
              },
            }
            const max = rows.reduce((m, x) => Math.max(m, x.display_order || 0), 0)
            const { error } = r ? await updateSiteContent(r.id, payload) : await addSiteContent({ ...payload, section: 'hero_slide', active: true, display_order: max + 1 })
            if (error) return 'No se pudo guardar. Inténtalo de nuevo.'
            await afterSave()
          },
        })
      }

      function openStat(r = null) {
        const c = r?.content || {}
        openModal({
          title: r ? 'Editar cifra' : 'Nueva cifra',
          body: `
            <div>
              <label class="adm-lbl" for="st-kind">Tipo</label>
              <select id="st-kind" name="kind" class="adm-fld">
                ${STAT_KINDS.map(k => `<option value="${k.value}" ${(c.kind || '') === k.value ? 'selected' : ''}>${esc(k.label)}</option>`).join('')}
              </select>
            </div>
            <div data-number-row>
              <label class="adm-lbl" for="st-num">Número</label>
              <input id="st-num" name="title" maxlength="12" class="adm-fld font-display font-bold text-[18px]" value="${esc(r?.title || '')}" placeholder="Ej: 31  ·  4.8/5" />
              <p class="text-[11.5px] text-muted mt-1">Un número que puedas respaldar: lo lee cualquier cliente.</p>
            </div>
            <div>
              <label class="adm-lbl" for="st-cap">Texto debajo *</label>
              <input id="st-cap" name="subtitle" maxlength="60" class="adm-fld" value="${esc(r?.subtitle || '')}" placeholder="Ej: Años vistiendo a Colima" />
            </div>`,
          onOpen: (form) => {
            const sync = () => form.querySelector('[data-number-row]').classList.toggle('hidden', form.elements.kind.value === 'catalogCount')
            form.elements.kind.addEventListener('change', sync)
            sync()
          },
          onSave: async (form) => {
            const kind = form.elements.kind.value || null
            const title = form.elements.title.value.trim()
            const subtitle = form.elements.subtitle.value.trim()
            if (kind !== 'catalogCount' && !title) return 'Escribe el número.'
            if (!subtitle) return 'Escribe el texto de la cifra.'
            const payload = { title: kind === 'catalogCount' ? '' : title, subtitle, content: { ...c, v: CONTENT_VERSION, kind } }
            const rows = rowsOf('stat')
            const max = rows.reduce((m, x) => Math.max(m, x.display_order || 0), 0)
            const { error } = r ? await updateSiteContent(r.id, payload) : await addSiteContent({ ...payload, section: 'stat', active: true, display_order: max + 1 })
            if (error) return 'No se pudo guardar. Inténtalo de nuevo.'
            await afterSave()
          },
        })
      }

      function openTile(r, position) {
        const base = defaultTiles[position - 1]
        openModal({
          title: `Tarjeta ${position} del mosaico`,
          body: `
            <div>
              <label class="adm-lbl" for="tl-name">Nombre *</label>
              <input id="tl-name" name="title" maxlength="24" class="adm-fld font-display font-bold text-[18px]" value="${esc(r?.title || base.name)}" />
            </div>
            <div>
              <label class="adm-lbl" for="tl-link">Lleva a</label>
              ${linkSelect('cta_link', r?.cta_link || base.href, 'tl-link')}
              <p class="text-[11.5px] text-muted mt-1">El número de piezas se cuenta solo con la categoría elegida.</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="adm-lbl" for="tl-eye">Etiqueta</label>
                <input id="tl-eye" name="eyebrow" maxlength="30" class="adm-fld" value="${esc(r ? (r.content?.eyebrow || '') : base.eyebrow)}" placeholder="Ej: 01 · Esenciales" />
              </div>
              <div>
                <label class="adm-lbl" for="tl-sub">Subtítulo ${position === 1 ? '' : '<span class="text-faint font-normal">(solo tarjeta 1)</span>'}</label>
                <input id="tl-sub" name="subtitle" maxlength="40" class="adm-fld" value="${esc(r?.subtitle ?? base.subtitle ?? '')}" />
              </div>
            </div>
            ${imageField(r?.image_url || base.image, base.image)}`,
          onOpen: (form) => bindImageField(form, base.image),
          onSave: async (form) => {
            const title = form.elements.title.value.trim()
            if (!title) return 'El nombre es obligatorio.'
            const cta_link = readLink(form, 'cta_link')
            if (!cta_link) return 'Escribe a dónde lleva la tarjeta.'
            let img
            try { img = await readImage(form) } catch (e) { return e.message }
            const payload = {
              title,
              subtitle: form.elements.subtitle.value.trim(),
              cta_link,
              image_url: img.image_url || base.image,
              content: { ...(r?.content || {}), v: CONTENT_VERSION, eyebrow: form.elements.eyebrow.value.trim(), ...(img.w ? { w: img.w, h: img.h } : {}) },
            }
            const { error } = r ? await updateSiteContent(r.id, payload) : await addSiteContent({ ...payload, section: 'category_tile', active: true, display_order: position })
            if (error) return 'No se pudo guardar. Inténtalo de nuevo.'
            await afterSave()
          },
        })
      }

      // ── Render + eventos ──
      function render() {
        pageRoot.innerHTML = `
          <div class="admin-view-in space-y-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="eyebrow text-faint">Sitio</p>
                <h1 class="font-display font-extrabold text-ink text-[24px] tracking-tight mt-0.5">Contenido de la página</h1>
                <p class="text-[13.5px] text-muted mt-1">Lo que guardes aquí se ve en la tienda al momento.</p>
              </div>
              <a href="/" target="_blank" rel="noopener" class="adm-btn adm-btn-ghost shrink-0">${ICON.eye('w-[18px] h-[18px]')} Ver en la tienda</a>
            </div>
            <div class="flex items-start gap-3 bg-brand-tint-2 border border-brand-tint rounded-xl2 px-4 py-3">
              ${ICON.info('w-5 h-5 text-brand shrink-0 mt-0.5')}
              <p class="text-[13px] text-brand-ink leading-relaxed">Google y la vista previa de WhatsApp toman los cambios en el siguiente despliegue del sitio. Las fotos subidas se entregan por el optimizador de Vercel para no gastar la cuota de Supabase.</p>
            </div>
            ${heroHtml()}
            ${marqueeSection()}
            ${statsSection()}
            ${manifestoSection()}
            ${tilesSection()}
          </div>`
        bind()
      }

      function bind() {
        const byId = (id) => allContent.find(r => r.id === id)

        pageRoot.querySelectorAll('[data-personalize]').forEach(btn => btn.addEventListener('click', async () => {
          const section = btn.dataset.personalize
          btn.disabled = true
          btn.textContent = 'Copiando...'
          // Otra pestaña u otro admin pudo personalizarla ya: sin esto se duplicaria la seccion.
          allContent = await getSiteContent()
          if (rowsOf(section).length) return render()
          // Una sola insercion: si falla, no queda la seccion a medias.
          const rows = defaultRows(section, { marqueeDefault: marqueeHtml([]) })
          const { error } = await addSiteContentRows(rows)
          if (error) {
            btn.disabled = false
            btn.textContent = 'Personalizar'
            return fail('No se pudo copiar el contenido. Inténtalo de nuevo.', error)
          }
          await afterSave('Listo. Ya puedes editar esta sección.')
        }))

        pageRoot.querySelector('#btn-add-slide')?.addEventListener('click', () => openSlide())
        pageRoot.querySelectorAll('[data-edit-slide]').forEach(b => b.addEventListener('click', () => openSlide(byId(b.dataset.editSlide))))
        pageRoot.querySelector('#btn-add-stat')?.addEventListener('click', () => openStat())
        pageRoot.querySelectorAll('[data-edit-stat]').forEach(b => b.addEventListener('click', () => openStat(byId(b.dataset.editStat))))
        pageRoot.querySelectorAll('[data-edit-tile]').forEach(b => {
          const r = byId(b.dataset.editTile)
          b.addEventListener('click', () => openTile(r, r.display_order))
        })
        pageRoot.querySelectorAll('[data-create-tile]').forEach(b => b.addEventListener('click', () => openTile(null, Number(b.dataset.createTile))))

        pageRoot.querySelectorAll('[data-toggle]').forEach(t => t.addEventListener('click', async () => {
          const r = byId(t.dataset.toggle)
          // Sin ninguna visible, la tienda vuelve al contenido original de la seccion.
          if (r.active && rowsOf(r.section).filter(x => x.active).length === 1) return fail('Deja al menos uno visible en esta sección.')
          const { error } = await updateSiteContent(r.id, { active: !r.active })
          if (error) return fail('No se pudo actualizar.', error)
          await afterSave(r.active ? 'Oculto en la tienda.' : 'Visible en la tienda.')
        }))

        pageRoot.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', async () => {
          const r = byId(b.dataset.delete)
          if (r.active && rowsOf(r.section).filter(x => x.active).length === 1) return fail('Deja al menos uno visible en esta sección.')
          if (!await confirmDelete({ title: '¿Eliminar?', highlight: r.title || r.subtitle || '', message: 'Se quita de la tienda. No se puede deshacer.' })) return
          const { error } = await deleteSiteContent(r.id)
          if (error) return fail('No se pudo eliminar.', error)
          await afterSave('Eliminado.')
        }))

        const reorder = async (ids) => {
          const { error } = await reorderSiteContent(ids)
          if (error) {
            fail('No se pudo guardar el orden. Inténtalo de nuevo.', error)
            return reload()
          }
          await afterSave('Orden guardado.')
        }
        const heroList = pageRoot.querySelector('#hero-sortable')
        if (heroList) makeSortable(heroList, reorder)
        const statsList = pageRoot.querySelector('#stats-sortable')
        if (statsList) makeSortable(statsList, reorder)

        const marqueeForm = pageRoot.querySelector('#marquee-form')
        marqueeForm?.addEventListener('submit', async (e) => {
          e.preventDefault()
          const r = rowsOf('marquee')[0]
          const title = marqueeForm.elements.title.value.trim()
          if (!title) return fail('Escribe el texto de la barra.')
          // Siempre activa: una fila inactiva haria volver el texto original, no ocultar la barra.
          const { error } = await updateSiteContent(r.id, { title, active: true })
          if (error) return fail('No se pudo guardar.', error)
          await afterSave()
        })

        const mf = pageRoot.querySelector('#manifesto-form')
        mf?.addEventListener('submit', async (e) => {
          e.preventDefault()
          const r = rowsOf('manifesto')[0]
          const title = mf.elements.title.value.trim()
          if (!title) return fail('Escribe el texto del manifiesto.')
          const { error } = await updateSiteContent(r.id, {
            title,
            subtitle: mf.elements.subtitle.value.trim(),
            cta_text: mf.elements.cta_text.value.trim(),
            cta_link: readLink(mf, 'cta_link') || '/catalog',
          })
          if (error) return fail('No se pudo guardar.', error)
          await afterSave()
        })
      }

      await reload()

      return () => {
        document.getElementById('adm-content-modal')?.remove()
      }
    },
  }
}
