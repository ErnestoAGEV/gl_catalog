import { getSiteContent, addSiteContent, updateSiteContent, deleteSiteContent, reorderSiteContent, uploadSiteImage } from '../../store/index.js'
import { showToast } from '../../utils/toast.js'
import { ICON } from './adminIcons.js'
import { heroSlides as defaultSlides, stats as defaultStats } from '../../pages/home/homeData.js'
import { BRAND } from '../../utils/config.js'

function escAttr(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function pageAdminBanners(state) {
  return {
    title: 'Banners y Contenido | Admin G&L',
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

      let allContent = await getSiteContent()

      const bySection = (section) => allContent.filter(r => r.section === section).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

      // ── Seed existing hardcoded content into Supabase ──
      async function seedDefaults() {
        const marqueeText = `★ Envío gratis +$${BRAND.freeShippingMin} MXN — Nueva temporada 2026 — Cierre por WhatsApp en minutos — 2 tiendas físicas en Colima — Use WELCOME10 · 10% off 1ª compra —`

        const seeds = []

        // Hero slides — extract accent text from HTML spans
        const extractAccent = (html) => {
          const m = (html || '').match(/<span[^>]*class="text-brand"[^>]*>([^<]+)<\/span>/)
          return m ? m[1] : null
        }

        for (let i = 0; i < defaultSlides.length; i++) {
          const s = defaultSlides[i]
          const accent = extractAccent(s.headline)
          const plainTitle = (s.headline || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
          seeds.push(addSiteContent({
            section: 'hero_slide',
            title: plainTitle,
            subtitle: s.body || '',
            cta_text: s.cta?.label || '',
            cta_link: s.cta?.href || '',
            image_url: s.image || null,
            content: accent ? { accent } : null,
            display_order: i + 1,
            active: true,
          }))
        }

        // Marquee
        seeds.push(addSiteContent({
          section: 'marquee',
          title: marqueeText,
          display_order: 1,
          active: true,
        }))

        // Stats
        for (let i = 0; i < defaultStats.length; i++) {
          const s = defaultStats[i]
          seeds.push(addSiteContent({
            section: 'stat',
            title: (s.number || '').replace(/<[^>]*>/g, ''),
            subtitle: s.caption || '',
            display_order: i + 1,
            active: true,
          }))
        }

        await Promise.all(seeds)
        allContent = await getSiteContent()
        render()
        showToast('Contenido existente importado', 'success')
      }

      // ── Render ──
      function render() {
        const heroSlides = bySection('hero_slide')
        const marqueeItems = bySection('marquee')
        const statItems = bySection('stat')

        pageRoot.innerHTML = `
          <div class="admin-view-in space-y-6">
            <!-- Header -->
            <div>
              <p class="eyebrow text-faint">Contenido</p>
              <h1 class="font-display font-extrabold text-ink text-[24px] tracking-tight mt-0.5">Banners y contenido</h1>
              <p class="text-[13.5px] text-muted mt-1">Administra los slides del hero, la barra de anuncios y la banda de estadisticas.</p>
            </div>

            <!-- Seed banner when all empty -->
            ${allContent.length === 0 ? `
              <div class="flex items-start gap-3 bg-brand-tint-2 border border-brand-tint rounded-xl2 px-4 py-3">
                ${ICON.info('w-5 h-5 text-brand shrink-0 mt-0.5')}
                <div class="flex-1">
                  <p class="text-[13px] text-brand-ink leading-relaxed">Tu sitio ya tiene contenido (slides, marquee, stats) pero aún no está en la base de datos. Impórtalo para poder editarlo desde aquí.</p>
                </div>
                <button id="btn-seed-defaults" class="adm-btn adm-btn-primary shrink-0">Importar contenido actual</button>
              </div>
            ` : ''}

            <!-- Section 1: Hero Slides -->
            <div class="bg-paper rounded-3xl border border-line shadow-card overflow-hidden">
              <div class="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 class="font-display font-bold text-ink text-[17px]">Hero Slides</h2>
                  <p class="text-[12.5px] text-muted mt-0.5">${heroSlides.length} slide${heroSlides.length !== 1 ? 's' : ''} configurado${heroSlides.length !== 1 ? 's' : ''}</p>
                </div>
                <button id="btn-add-slide" class="adm-btn adm-btn-primary">${ICON.plus('w-[18px] h-[18px]')} Agregar slide</button>
              </div>
              <div id="hero-list" class="px-5 pb-5">
                ${heroSlides.length === 0 ? `
                  <div class="py-12 text-center">
                    ${ICON.grid('w-10 h-10 mx-auto mb-3 text-line-strong')}
                    <p class="text-[14px] font-semibold text-body">No hay slides</p>
                    <p class="text-[12.5px] text-muted mt-1">Agrega el primero o importa el contenido actual</p>
                  </div>
                ` : `
                  <div class="space-y-2 admin-stagger">
                    ${heroSlides.map((slide, i) => `
                      <div class="group flex items-center gap-3 bg-canvas rounded-xl2 border border-line hover:border-line-strong hover:shadow-card px-3.5 py-3 transition-all" data-slide-id="${slide.id}">
                        <div class="flex flex-col items-center gap-0.5 shrink-0">
                          <button type="button" data-move-up="${slide.id}" class="w-6 h-6 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-paper transition-colors disabled:opacity-25 disabled:pointer-events-none" ${i === 0 ? 'disabled' : ''} title="Mover arriba">${ICON.chevUp('w-4 h-4')}</button>
                          <button type="button" data-move-down="${slide.id}" class="w-6 h-6 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-paper transition-colors disabled:opacity-25 disabled:pointer-events-none" ${i === heroSlides.length - 1 ? 'disabled' : ''} title="Mover abajo">${ICON.chevDown('w-4 h-4')}</button>
                        </div>
                        ${slide.image_url
                          ? `<img src="${escAttr(slide.image_url)}" alt="" class="w-12 h-12 rounded-lg object-cover shrink-0 border border-line" />`
                          : `<div class="w-12 h-12 rounded-lg bg-line flex items-center justify-center shrink-0">${ICON.grid('w-5 h-5 text-muted')}</div>`
                        }
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="text-[14px] font-semibold text-ink truncate">${slide.title ? (slide.content?.accent ? escHtml(slide.title).replace(escHtml(slide.content.accent), `<span class="text-brand">${escHtml(slide.content.accent)}</span>`) : escHtml(slide.title)) : '<span class="text-muted italic">Sin titulo</span>'}</span>
                            ${!slide.active ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-line text-muted font-medium">Inactivo</span>' : ''}
                          </div>
                          <span class="text-[12px] text-faint truncate block">${escHtml(slide.subtitle) || ''}</span>
                        </div>
                        <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity shrink-0">
                          <button type="button" data-toggle-slide="${slide.id}" class="gl-toggle ${slide.active ? 'on' : ''}" title="${slide.active ? 'Desactivar' : 'Activar'}"></button>
                          <button type="button" data-edit-slide="${slide.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors" title="Editar">${ICON.edit('w-[17px] h-[17px]')}</button>
                          <button type="button" data-delete-slide="${slide.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors" title="Eliminar">${ICON.trash('w-[17px] h-[17px]')}</button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>

            <!-- Section 2: Marquee -->
            <div class="bg-paper rounded-3xl border border-line shadow-card overflow-hidden">
              <div class="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 class="font-display font-bold text-ink text-[17px]">Barra de anuncios</h2>
                  <p class="text-[12.5px] text-muted mt-0.5">Texto que se muestra en la barra superior del sitio</p>
                </div>
                ${marqueeItems.length === 0 ? `<button id="btn-add-marquee" class="adm-btn adm-btn-primary">${ICON.plus('w-[18px] h-[18px]')} Agregar</button>` : ''}
              </div>
              <div id="marquee-list" class="px-5 pb-5">
                ${marqueeItems.length === 0 ? `
                  <div class="py-12 text-center">
                    ${ICON.bell('w-10 h-10 mx-auto mb-3 text-line-strong')}
                    <p class="text-[14px] font-semibold text-body">No hay anuncio</p>
                    <p class="text-[12.5px] text-muted mt-1">Agrega uno con el boton de arriba</p>
                  </div>
                ` : marqueeItems.map(item => `
                  <div class="group flex items-center gap-3 bg-canvas rounded-xl2 border border-line hover:border-line-strong hover:shadow-card px-3.5 py-3 transition-all" data-marquee-id="${item.id}">
                    <div class="w-10 h-10 rounded-lg bg-warn-tint text-warn flex items-center justify-center shrink-0">${ICON.bell('w-5 h-5')}</div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[14px] font-semibold text-ink truncate">${escHtml(item.title) || '<span class="text-muted italic">Sin texto</span>'}</p>
                      ${!item.active ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-line text-muted font-medium">Inactivo</span>' : ''}
                    </div>
                    <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity shrink-0">
                      <button type="button" data-toggle-marquee="${item.id}" class="gl-toggle ${item.active ? 'on' : ''}" title="${item.active ? 'Desactivar' : 'Activar'}"></button>
                      <button type="button" data-edit-marquee="${item.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors" title="Editar">${ICON.edit('w-[17px] h-[17px]')}</button>
                      <button type="button" data-delete-marquee="${item.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors" title="Eliminar">${ICON.trash('w-[17px] h-[17px]')}</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Section 3: Stats Band -->
            <div class="bg-paper rounded-3xl border border-line shadow-card overflow-hidden">
              <div class="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 class="font-display font-bold text-ink text-[17px]">Banda de estadisticas</h2>
                  <p class="text-[12.5px] text-muted mt-0.5">Numeros destacados que se muestran en la pagina de inicio</p>
                </div>
                ${statItems.length < 4 ? `<button id="btn-add-stat" class="adm-btn adm-btn-primary">${ICON.plus('w-[18px] h-[18px]')} Agregar</button>` : ''}
              </div>
              <div id="stats-list" class="px-5 pb-5">
                ${statItems.length === 0 ? `
                  <div class="py-12 text-center">
                    ${ICON.trendUp('w-10 h-10 mx-auto mb-3 text-line-strong')}
                    <p class="text-[14px] font-semibold text-body">No hay estadisticas</p>
                    <p class="text-[12.5px] text-muted mt-1">Agrega la primera con el boton de arriba</p>
                  </div>
                ` : `
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 admin-stagger">
                    ${statItems.map(item => `
                      <div class="group flex items-center gap-3 bg-canvas rounded-xl2 border border-line hover:border-line-strong hover:shadow-card px-3.5 py-3 transition-all" data-stat-id="${item.id}">
                        <div class="flex-1 min-w-0">
                          <p class="text-[20px] font-display font-extrabold text-ink tnum">${escHtml(item.title) || '0'}</p>
                          <p class="text-[12.5px] text-muted truncate">${escHtml(item.subtitle) || '<span class="italic">Sin descripcion</span>'}</p>
                          ${!item.active ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-line text-muted font-medium mt-1 inline-block">Inactivo</span>' : ''}
                        </div>
                        <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity shrink-0">
                          <button type="button" data-toggle-stat="${item.id}" class="gl-toggle ${item.active ? 'on' : ''}" title="${item.active ? 'Desactivar' : 'Activar'}"></button>
                          <button type="button" data-edit-stat="${item.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition-colors" title="Editar">${ICON.edit('w-[17px] h-[17px]')}</button>
                          <button type="button" data-delete-stat="${item.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition-colors" title="Eliminar">${ICON.trash('w-[17px] h-[17px]')}</button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>
          </div>
        `

        // Seed button
        const seedBtn = pageRoot.querySelector('#btn-seed-defaults')
        if (seedBtn) {
          seedBtn.addEventListener('click', async () => {
            seedBtn.disabled = true
            seedBtn.textContent = 'Importando...'
            await seedDefaults()
          })
        }

        bindHeroEvents()
        bindMarqueeEvents()
        bindStatEvents()
      }

      // ══════════════════════════════════════
      // HERO SLIDES — Events
      // ══════════════════════════════════════
      function bindHeroEvents() {
        // Add slide
        const addBtn = pageRoot.querySelector('#btn-add-slide')
        if (addBtn) addBtn.addEventListener('click', () => openSlideModal())

        // Move up
        pageRoot.querySelectorAll('[data-move-up]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const slides = bySection('hero_slide')
            const id = btn.dataset.moveUp
            const idx = slides.findIndex(s => s.id === id)
            if (idx <= 0) return
            const ids = slides.map(s => s.id)
            ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
            btn.disabled = true
            const { error } = await reorderSiteContent(ids)
            if (error) { showToast('Error al reordenar', 'error'); return }
            allContent = await getSiteContent()
            render()
          })
        })

        // Move down
        pageRoot.querySelectorAll('[data-move-down]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const slides = bySection('hero_slide')
            const id = btn.dataset.moveDown
            const idx = slides.findIndex(s => s.id === id)
            if (idx === -1 || idx >= slides.length - 1) return
            const ids = slides.map(s => s.id)
            ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
            btn.disabled = true
            const { error } = await reorderSiteContent(ids)
            if (error) { showToast('Error al reordenar', 'error'); return }
            allContent = await getSiteContent()
            render()
          })
        })

        // Toggle active
        pageRoot.querySelectorAll('[data-toggle-slide]').forEach(toggle => {
          toggle.addEventListener('click', async () => {
            const id = toggle.dataset.toggleSlide
            const slide = allContent.find(r => r.id === id)
            if (!slide) return
            const { error } = await updateSiteContent(id, { active: !slide.active })
            if (error) { showToast('Error al actualizar', 'error'); return }
            showToast(slide.active ? 'Slide desactivado' : 'Slide activado', 'success')
            allContent = await getSiteContent()
            render()
          })
        })

        // Edit
        pageRoot.querySelectorAll('[data-edit-slide]').forEach(btn => {
          btn.addEventListener('click', () => {
            const slide = allContent.find(r => r.id === btn.dataset.editSlide)
            if (slide) openSlideModal(slide)
          })
        })

        // Delete
        pageRoot.querySelectorAll('[data-delete-slide]').forEach(btn => {
          btn.addEventListener('click', () => {
            const slide = allContent.find(r => r.id === btn.dataset.deleteSlide)
            if (slide) openDeleteConfirm(slide, 'slide')
          })
        })
      }

      // ══════════════════════════════════════
      // MARQUEE — Events
      // ══════════════════════════════════════
      function bindMarqueeEvents() {
        const addBtn = pageRoot.querySelector('#btn-add-marquee')
        if (addBtn) addBtn.addEventListener('click', () => openMarqueeModal())

        pageRoot.querySelectorAll('[data-toggle-marquee]').forEach(toggle => {
          toggle.addEventListener('click', async () => {
            const id = toggle.dataset.toggleMarquee
            const item = allContent.find(r => r.id === id)
            if (!item) return
            const { error } = await updateSiteContent(id, { active: !item.active })
            if (error) { showToast('Error al actualizar', 'error'); return }
            showToast(item.active ? 'Anuncio desactivado' : 'Anuncio activado', 'success')
            allContent = await getSiteContent()
            render()
          })
        })

        pageRoot.querySelectorAll('[data-edit-marquee]').forEach(btn => {
          btn.addEventListener('click', () => {
            const item = allContent.find(r => r.id === btn.dataset.editMarquee)
            if (item) openMarqueeModal(item)
          })
        })

        pageRoot.querySelectorAll('[data-delete-marquee]').forEach(btn => {
          btn.addEventListener('click', () => {
            const item = allContent.find(r => r.id === btn.dataset.deleteMarquee)
            if (item) openDeleteConfirm(item, 'anuncio')
          })
        })
      }

      // ══════════════════════════════════════
      // STATS — Events
      // ══════════════════════════════════════
      function bindStatEvents() {
        const addBtn = pageRoot.querySelector('#btn-add-stat')
        if (addBtn) addBtn.addEventListener('click', () => openStatModal())

        pageRoot.querySelectorAll('[data-toggle-stat]').forEach(toggle => {
          toggle.addEventListener('click', async () => {
            const id = toggle.dataset.toggleStat
            const item = allContent.find(r => r.id === id)
            if (!item) return
            const { error } = await updateSiteContent(id, { active: !item.active })
            if (error) { showToast('Error al actualizar', 'error'); return }
            showToast(item.active ? 'Estadistica desactivada' : 'Estadistica activada', 'success')
            allContent = await getSiteContent()
            render()
          })
        })

        pageRoot.querySelectorAll('[data-edit-stat]').forEach(btn => {
          btn.addEventListener('click', () => {
            const item = allContent.find(r => r.id === btn.dataset.editStat)
            if (item) openStatModal(item)
          })
        })

        pageRoot.querySelectorAll('[data-delete-stat]').forEach(btn => {
          btn.addEventListener('click', () => {
            const item = allContent.find(r => r.id === btn.dataset.deleteStat)
            if (item) openDeleteConfirm(item, 'estadistica')
          })
        })
      }

      // ══════════════════════════════════════
      // SLIDE MODAL (Add / Edit)
      // ══════════════════════════════════════
      function openSlideModal(slide = null) {
        const isEdit = !!slide
        const modalId = 'slide-modal'
        root.querySelector(`#${modalId}`)?.remove()

        const maxOrder = bySection('hero_slide').reduce((max, s) => Math.max(max, s.display_order || 0), 0)

        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="${modalId}" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade">
            <div class="w-full max-w-md bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden">
              <div class="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 class="font-display font-bold text-ink text-[17px]">${isEdit ? 'Editar slide' : 'Nuevo slide'}</h2>
                <button data-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">${ICON.close('w-[18px] h-[18px]')}</button>
              </div>
              <form data-form class="px-5 pb-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label class="adm-lbl">Titulo</label>
                  <input name="title" type="text" maxlength="120" value="${escAttr(slide?.title)}" class="adm-fld" placeholder="Ej: Nueva coleccion primavera" autofocus />
                </div>
                <div>
                  <label class="adm-lbl">Texto destacado <span class="text-faint font-normal">(se muestra en azul)</span></label>
                  <input name="accent" type="text" maxlength="60" value="${escAttr(slide?.content?.accent)}" class="adm-fld" placeholder="Ej: perfecto. — la palabra que se verá en color azul" />
                </div>
                <div>
                  <label class="adm-lbl">Subtítulo</label>
                  <input name="subtitle" type="text" maxlength="200" value="${escAttr(slide?.subtitle)}" class="adm-fld" placeholder="Ej: Descubre las tendencias de la temporada" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="adm-lbl">Texto CTA</label>
                    <input name="cta_text" type="text" maxlength="40" value="${escAttr(slide?.cta_text)}" class="adm-fld" placeholder="Ej: Ver mas" />
                  </div>
                  <div>
                    <label class="adm-lbl">Link CTA</label>
                    <input name="cta_link" type="text" maxlength="200" value="${escAttr(slide?.cta_link)}" class="adm-fld" placeholder="Ej: /catalog" />
                  </div>
                </div>
                <div>
                  <label class="adm-lbl">Imagen</label>
                  <div class="flex items-center gap-3">
                    <div id="slide-img-preview" class="w-16 h-16 rounded-xl border border-line bg-canvas flex items-center justify-center shrink-0 overflow-hidden">
                      ${slide?.image_url
                        ? `<img src="${escAttr(slide.image_url)}" alt="" class="w-full h-full object-cover" />`
                        : ICON.grid('w-6 h-6 text-muted')
                      }
                    </div>
                    <div class="flex-1">
                      <label class="adm-btn adm-btn-ghost cursor-pointer inline-flex text-[13px]">
                        <input type="file" name="image" accept="image/*" class="hidden" />
                        Seleccionar imagen
                      </label>
                      <p class="text-[11.5px] text-faint mt-1">JPG, PNG o WebP. Max 5MB.</p>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3 pt-1">
                  <button type="button" data-toggle-active class="gl-toggle ${!isEdit || slide?.active ? 'on' : ''}" title="Activo"></button>
                  <span class="text-[13.5px] text-body font-medium">Activo</span>
                </div>
                <p data-error class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2"></p>
                <div class="flex gap-2.5 pt-1">
                  <button type="button" data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                  <button type="submit" data-submit class="adm-btn adm-btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)

        const modal = root.querySelector(`#${modalId}`)
        const form = modal.querySelector('[data-form]')
        const errorEl = modal.querySelector('[data-error]')
        const submitBtn = modal.querySelector('[data-submit]')
        const imgPreview = modal.querySelector('#slide-img-preview')
        const fileInput = form.querySelector('input[name="image"]')
        const activeToggle = modal.querySelector('[data-toggle-active]')

        let isActive = !isEdit || slide?.active
        let pendingFile = null
        let uploadedUrl = slide?.image_url || null

        const close = () => modal.remove()
        modal.querySelector('[data-close]').addEventListener('click', close)
        modal.querySelector('[data-cancel]').addEventListener('click', close)
        modal.addEventListener('click', (e) => { if (e.target === modal) close() })

        activeToggle.addEventListener('click', () => {
          isActive = !isActive
          activeToggle.classList.toggle('on', isActive)
        })

        fileInput.addEventListener('change', () => {
          const file = fileInput.files[0]
          if (!file) return
          if (file.size > 5 * 1024 * 1024) {
            showToast('La imagen no debe superar 5MB', 'error')
            fileInput.value = ''
            return
          }
          pendingFile = file
          const reader = new FileReader()
          reader.onload = (e) => {
            imgPreview.innerHTML = `<img src="${e.target.result}" alt="" class="w-full h-full object-cover" />`
          }
          reader.readAsDataURL(file)
        })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')

          const title = form.querySelector('input[name="title"]').value.trim()
          const accent = form.querySelector('input[name="accent"]').value.trim()
          const subtitle = form.querySelector('input[name="subtitle"]').value.trim()
          const cta_text = form.querySelector('input[name="cta_text"]').value.trim()
          const cta_link = form.querySelector('input[name="cta_link"]').value.trim()

          submitBtn.disabled = true
          submitBtn.textContent = isEdit ? 'Guardando...' : 'Creando...'

          // Upload image if pending
          if (pendingFile) {
            const { url, error: uploadErr } = await uploadSiteImage(pendingFile)
            if (uploadErr) {
              errorEl.textContent = 'Error al subir la imagen. Intenta de nuevo.'
              errorEl.classList.remove('hidden')
              submitBtn.disabled = false
              submitBtn.textContent = isEdit ? 'Guardar' : 'Crear'
              return
            }
            uploadedUrl = url
          }

          const payload = {
            title: title || null,
            subtitle: subtitle || null,
            cta_text: cta_text || null,
            cta_link: cta_link || null,
            image_url: uploadedUrl || null,
            content: accent ? { accent } : null,
            active: isActive,
          }

          let result
          if (isEdit) {
            result = await updateSiteContent(slide.id, payload)
          } else {
            result = await addSiteContent({ ...payload, section: 'hero_slide', display_order: maxOrder + 1 })
          }

          if (result.error) {
            errorEl.textContent = 'Error. Intentalo de nuevo.'
            errorEl.classList.remove('hidden')
            submitBtn.disabled = false
            submitBtn.textContent = isEdit ? 'Guardar' : 'Crear'
            return
          }

          showToast(isEdit ? 'Slide actualizado' : 'Slide creado', 'success')
          close()
          allContent = await getSiteContent()
          render()
        })
      }

      // ══════════════════════════════════════
      // MARQUEE MODAL (Add / Edit)
      // ══════════════════════════════════════
      function openMarqueeModal(item = null) {
        const isEdit = !!item
        const modalId = 'marquee-modal'
        root.querySelector(`#${modalId}`)?.remove()

        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="${modalId}" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade">
            <div class="w-full max-w-md bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden">
              <div class="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 class="font-display font-bold text-ink text-[17px]">${isEdit ? 'Editar anuncio' : 'Nuevo anuncio'}</h2>
                <button data-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">${ICON.close('w-[18px] h-[18px]')}</button>
              </div>
              <form data-form class="px-5 pb-5 space-y-4">
                <div>
                  <label class="adm-lbl">Texto del anuncio *</label>
                  <textarea name="title" rows="3" required maxlength="300" class="adm-fld" placeholder="Ej: Envio gratis en compras mayores a $999">${escHtml(item?.title)}</textarea>
                </div>
                <div class="flex items-center gap-3 pt-1">
                  <button type="button" data-toggle-active class="gl-toggle ${!isEdit || item?.active ? 'on' : ''}" title="Activo"></button>
                  <span class="text-[13.5px] text-body font-medium">Activo</span>
                </div>
                <p data-error class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2"></p>
                <div class="flex gap-2.5 pt-1">
                  <button type="button" data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                  <button type="submit" data-submit class="adm-btn adm-btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)

        const modal = root.querySelector(`#${modalId}`)
        const form = modal.querySelector('[data-form]')
        const errorEl = modal.querySelector('[data-error]')
        const submitBtn = modal.querySelector('[data-submit]')
        const activeToggle = modal.querySelector('[data-toggle-active]')

        let isActive = !isEdit || item?.active

        const close = () => modal.remove()
        modal.querySelector('[data-close]').addEventListener('click', close)
        modal.querySelector('[data-cancel]').addEventListener('click', close)
        modal.addEventListener('click', (e) => { if (e.target === modal) close() })

        activeToggle.addEventListener('click', () => {
          isActive = !isActive
          activeToggle.classList.toggle('on', isActive)
        })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')

          const title = form.querySelector('textarea[name="title"]').value.trim()
          if (!title) {
            errorEl.textContent = 'El texto es requerido.'
            errorEl.classList.remove('hidden')
            return
          }

          submitBtn.disabled = true
          submitBtn.textContent = isEdit ? 'Guardando...' : 'Creando...'

          const payload = { title, active: isActive }

          let result
          if (isEdit) {
            result = await updateSiteContent(item.id, payload)
          } else {
            result = await addSiteContent({ ...payload, section: 'marquee', display_order: 1 })
          }

          if (result.error) {
            errorEl.textContent = 'Error. Intentalo de nuevo.'
            errorEl.classList.remove('hidden')
            submitBtn.disabled = false
            submitBtn.textContent = isEdit ? 'Guardar' : 'Crear'
            return
          }

          showToast(isEdit ? 'Anuncio actualizado' : 'Anuncio creado', 'success')
          close()
          allContent = await getSiteContent()
          render()
        })
      }

      // ══════════════════════════════════════
      // STAT MODAL (Add / Edit)
      // ══════════════════════════════════════
      function openStatModal(item = null) {
        const isEdit = !!item
        const modalId = 'stat-modal'
        root.querySelector(`#${modalId}`)?.remove()

        const maxOrder = bySection('stat').reduce((max, s) => Math.max(max, s.display_order || 0), 0)

        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="${modalId}" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade">
            <div class="w-full max-w-md bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden">
              <div class="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 class="font-display font-bold text-ink text-[17px]">${isEdit ? 'Editar estadistica' : 'Nueva estadistica'}</h2>
                <button data-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">${ICON.close('w-[18px] h-[18px]')}</button>
              </div>
              <form data-form class="px-5 pb-5 space-y-4">
                <div>
                  <label class="adm-lbl">Numero / Valor *</label>
                  <input name="title" type="text" required maxlength="30" value="${escAttr(item?.title)}" class="adm-fld" placeholder="Ej: +500" autofocus />
                </div>
                <div>
                  <label class="adm-lbl">Descripcion *</label>
                  <input name="subtitle" type="text" required maxlength="80" value="${escAttr(item?.subtitle)}" class="adm-fld" placeholder="Ej: Clientes satisfechos" />
                </div>
                <div class="flex items-center gap-3 pt-1">
                  <button type="button" data-toggle-active class="gl-toggle ${!isEdit || item?.active ? 'on' : ''}" title="Activo"></button>
                  <span class="text-[13.5px] text-body font-medium">Activo</span>
                </div>
                <p data-error class="hidden text-[13px] text-bad bg-bad-tint rounded-xl2 px-4 py-2"></p>
                <div class="flex gap-2.5 pt-1">
                  <button type="button" data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                  <button type="submit" data-submit class="adm-btn adm-btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)

        const modal = root.querySelector(`#${modalId}`)
        const form = modal.querySelector('[data-form]')
        const errorEl = modal.querySelector('[data-error]')
        const submitBtn = modal.querySelector('[data-submit]')
        const activeToggle = modal.querySelector('[data-toggle-active]')

        let isActive = !isEdit || item?.active

        const close = () => modal.remove()
        modal.querySelector('[data-close]').addEventListener('click', close)
        modal.querySelector('[data-cancel]').addEventListener('click', close)
        modal.addEventListener('click', (e) => { if (e.target === modal) close() })

        activeToggle.addEventListener('click', () => {
          isActive = !isActive
          activeToggle.classList.toggle('on', isActive)
        })

        form.addEventListener('submit', async (e) => {
          e.preventDefault()
          errorEl.classList.add('hidden')

          const title = form.querySelector('input[name="title"]').value.trim()
          const subtitle = form.querySelector('input[name="subtitle"]').value.trim()

          if (!title || !subtitle) {
            errorEl.textContent = 'Ambos campos son requeridos.'
            errorEl.classList.remove('hidden')
            return
          }

          submitBtn.disabled = true
          submitBtn.textContent = isEdit ? 'Guardando...' : 'Creando...'

          const payload = { title, subtitle, active: isActive }

          let result
          if (isEdit) {
            result = await updateSiteContent(item.id, payload)
          } else {
            result = await addSiteContent({ ...payload, section: 'stat', display_order: maxOrder + 1 })
          }

          if (result.error) {
            errorEl.textContent = 'Error. Intentalo de nuevo.'
            errorEl.classList.remove('hidden')
            submitBtn.disabled = false
            submitBtn.textContent = isEdit ? 'Guardar' : 'Crear'
            return
          }

          showToast(isEdit ? 'Estadistica actualizada' : 'Estadistica creada', 'success')
          close()
          allContent = await getSiteContent()
          render()
        })
      }

      // ══════════════════════════════════════
      // DELETE CONFIRM
      // ══════════════════════════════════════
      function openDeleteConfirm(item, label) {
        root.querySelector('#content-delete-modal')?.remove()
        const wrap = document.createElement('div')
        wrap.innerHTML = `
          <div id="content-delete-modal" class="fixed inset-0 layer-modal flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 adm-anim-fade">
            <div class="w-full max-w-sm bg-paper rounded-3xl border border-line shadow-pop adm-anim-pop overflow-hidden">
              <div class="p-5">
                <div class="w-11 h-11 rounded-xl2 bg-bad-tint text-bad flex items-center justify-center mb-3">${ICON.trash('w-5 h-5')}</div>
                <h3 class="font-display font-bold text-ink text-[17px]">Eliminar ${escHtml(label)}?</h3>
                <p class="text-[13.5px] text-muted mt-1">Vas a eliminar este ${escHtml(label)}${item.title ? ': <span class="font-semibold text-body">"' + escHtml(item.title) + '"</span>' : ''}. Esta accion no se puede deshacer.</p>
              </div>
              <div class="px-5 pb-5 flex gap-2.5">
                <button data-cancel class="adm-btn adm-btn-ghost flex-1">Cancelar</button>
                <button data-confirm class="adm-btn flex-1" style="background:#D6453E;color:#fff">Eliminar</button>
              </div>
            </div>
          </div>`
        root.appendChild(wrap.firstElementChild)

        const modal = root.querySelector('#content-delete-modal')
        const close = () => modal.remove()
        modal.querySelector('[data-cancel]').addEventListener('click', close)
        modal.addEventListener('click', (e) => { if (e.target === modal) close() })
        modal.querySelector('[data-confirm]').addEventListener('click', async () => {
          const confirmBtn = modal.querySelector('[data-confirm]')
          confirmBtn.disabled = true
          confirmBtn.textContent = 'Eliminando...'
          const { error } = await deleteSiteContent(item.id)
          if (error) { showToast('Error al eliminar', 'error'); close(); return }
          showToast(`${label.charAt(0).toUpperCase() + label.slice(1)} eliminado`, 'success')
          close()
          allContent = await getSiteContent()
          render()
        })
      }

      // Initial render
      render()
    },
  }
}
