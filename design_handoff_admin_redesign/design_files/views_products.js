// G&L Admin — Productos
(function () {
  const ICON = window.ICON, UI = window.UI, fmt = window.fmt;
  const COL = window.DB.COL;

  const SIZES_CLOTHING = ['CH', 'M', 'G', 'XG', '30', '32', '34', '36', '38'];
  const SIZES_PERFUME = ['50ml', '75ml', '100ml'];
  const BADGES = ['', 'Nuevo', 'Bestseller', 'Premium', 'Borrador'];

  function swatch(c, size = 14) {
    const hex = COL[c] || '#C9CCD3';
    const ring = c === 'Blanco' ? 'box-shadow:inset 0 0 0 1px #E1E3E9' : '';
    return `<span title="${c}" class="inline-block rounded-full shrink-0" style="width:${size}px;height:${size}px;background:${hex};${ring}"></span>`;
  }

  function stockBadge(p) {
    if (p.stock === '∞') return `<span class="inline-flex items-center gap-1.5 px-2 h-[22px] rounded-md text-[11.5px] font-600 bg-brand-tint text-brand">∞ Ilimitado</span>`;
    const n = Number(p.stock);
    if (n <= 0) return `<span class="inline-flex items-center gap-1.5 px-2 h-[22px] rounded-md text-[11.5px] font-600 bg-bad-tint text-bad">Agotado</span>`;
    if (n <= 10) return `<span class="inline-flex items-center gap-1.5 px-2 h-[22px] rounded-md text-[11.5px] font-600 bg-warn-tint text-warn tnum">${n} · bajo</span>`;
    return `<span class="text-[13px] font-600 text-ink tnum">${n} <span class="text-faint font-400">uds</span></span>`;
  }

  function thumb(p, size = 44) {
    const c = p.colors && p.colors.length ? (COL[p.colors[0]] || '#EAECF0') : '#EEF0F4';
    const icon = p.type === 'Perfumes' ? 'sparkle' : p.type === 'Calzado' ? 'box' : 'products';
    const dark = ['#15171C', '#1B2A4A', '#5A1E2B', '#214FC7', '#2E5D4B', '#5A3A22'].includes(c);
    return `<div class="rounded-[10px] flex items-center justify-center shrink-0 border border-line" style="width:${size}px;height:${size}px;background:${c}">
      <span style="color:${dark ? 'rgba(255,255,255,.85)' : 'rgba(21,23,28,.45)'}">${ICON[icon]({ cls: 'w-5 h-5' })}</span></div>`;
  }

  function badgePill(b) {
    if (!b) return '';
    const map = { Nuevo: 'bg-ok-tint text-ok', Bestseller: 'bg-brand-tint text-brand', Premium: 'bg-ink text-white', Borrador: 'bg-line text-muted' };
    return `<span class="inline-flex items-center px-1.5 h-[18px] rounded text-[10px] font-700 ${map[b] || 'bg-line text-muted'}">${b}</span>`;
  }

  // ── Product form (drawer) ──
  function openForm(product, onSave) {
    const editing = !!product;
    const p = product || { name: '', type: 'Camisas', price: '', originalPrice: '', stock: '', badge: '', sizes: [], colors: [], images: [] };
    const isPerfume = p.type === 'Perfumes';
    const cats = window.DB.CATEGORIES.filter((c) => c.active).map((c) => c.name);
    const allColors = Object.keys(COL);

    const html = `
      <div class="h-full bg-canvas flex flex-col anim-drawer">
        <div class="bg-paper border-b border-line px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p class="eyebrow text-faint">${editing ? 'Editar' : 'Nuevo'} producto</p>
            <h3 class="font-display font-bold text-ink text-[18px] mt-0.5">${editing ? p.name : 'Agregar al catálogo'}</h3>
          </div>
          <button data-ov-close class="w-9 h-9 rounded-[10px] border border-line bg-paper flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition">${ICON.close({ cls: 'w-[18px] h-[18px]' })}</button>
        </div>
        <form data-form class="flex-1 overflow-y-auto scroll-thin p-5 space-y-5">
          <!-- Images -->
          <div>
            <label class="lbl">Imágenes</label>
            <div class="grid grid-cols-5 gap-2">
              <div class="col-span-2 row-span-2 aspect-square rounded-xl2 border-2 border-dashed border-line-strong bg-paper flex flex-col items-center justify-center text-faint hover:border-brand hover:text-brand transition cursor-pointer">
                ${ICON.plus({ cls: 'w-6 h-6' })}<span class="text-[11px] font-600 mt-1">Subir</span>
              </div>
              ${[0, 1, 2, 3].map((i) => `<div class="aspect-square rounded-[10px] border border-line ${p.colors && p.colors[i % Math.max(1, p.colors.length)] ? '' : 'bg-canvas'} flex items-center justify-center" style="${p.colors && p.colors.length ? `background:${COL[p.colors[i % p.colors.length]] || '#EEF0F4'}` : ''}"></div>`).join('')}
            </div>
            <p class="text-[11.5px] text-faint mt-1.5">PNG, JPG o WEBP · máx. 5 imágenes · la primera es la portada</p>
          </div>

          <!-- Name + category -->
          <div class="grid grid-cols-1 gap-4">
            <div><label class="lbl">Nombre del producto</label><input name="name" class="fld" value="${p.name}" placeholder="Ej. Camisa Oxford Slim" /></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="lbl">Categoría</label><select name="type" class="fld">${cats.map((c) => `<option ${c === p.type ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
              <div><label class="lbl">Etiqueta</label><select name="badge" class="fld">${BADGES.map((b) => `<option value="${b}" ${b === p.badge ? 'selected' : ''}>${b || 'Sin etiqueta'}</option>`).join('')}</select></div>
            </div>
          </div>

          <!-- Pricing -->
          <div class="bg-paper rounded-xl2 border border-line p-4">
            <p class="eyebrow text-muted mb-3">Precio e inventario</p>
            <div class="grid grid-cols-3 gap-3">
              <div><label class="lbl">Precio</label><div class="relative"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-[14px]">$</span><input name="price" type="number" class="fld pl-7 tnum" value="${p.price}" placeholder="0" /></div></div>
              <div><label class="lbl">Precio antes</label><div class="relative"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-[14px]">$</span><input name="originalPrice" type="number" class="fld pl-7 tnum" value="${p.originalPrice || ''}" placeholder="—" /></div></div>
              <div><label class="lbl">Stock</label><input name="stock" class="fld tnum" value="${p.stock === '∞' ? '' : p.stock}" placeholder="∞ ilimitado" /></div>
            </div>
          </div>

          <!-- Sizes -->
          <div data-sizes>
            <label class="lbl">${isPerfume ? 'Capacidad' : 'Tallas disponibles'}</label>
            <div class="flex flex-wrap gap-2" data-size-group>
              ${(isPerfume ? SIZES_PERFUME : SIZES_CLOTHING).map((s) => `<button type="button" data-size="${s}" class="size-pill px-3.5 h-9 rounded-[10px] border text-[13px] font-600 tnum transition ${p.sizes.includes(s) ? 'bg-ink text-white border-ink' : 'bg-paper text-body border-line hover:border-line-strong'}">${s}</button>`).join('')}
            </div>
          </div>

          <!-- Colors -->
          <div data-colors-section class="${isPerfume ? 'hidden' : ''}">
            <label class="lbl">Colores</label>
            <div class="flex flex-wrap gap-2">
              ${allColors.map((c) => `<button type="button" data-color="${c}" class="color-pill inline-flex items-center gap-2 pl-1.5 pr-3 h-9 rounded-full border text-[12.5px] font-600 transition ${p.colors.includes(c) ? 'bg-ink text-white border-ink' : 'bg-paper text-body border-line hover:border-line-strong'}">${swatch(c, 18)}${c}</button>`).join('')}
            </div>
          </div>
        </form>
        <div class="bg-paper border-t border-line px-5 py-3.5 flex items-center gap-3 shrink-0">
          <button data-ov-close class="btn btn-ghost flex-1">Cancelar</button>
          <button data-save class="btn btn-primary flex-1">${editing ? 'Guardar cambios' : 'Crear producto'}</button>
        </div>
      </div>`;

    const { host, close } = UI.openOverlay(html, { side: 'right' });
    const form = host.querySelector('[data-form]');
    const sel = (n) => form.querySelector(`[name="${n}"]`);
    const sizes = new Set(p.sizes);
    const colors = new Set(p.colors);

    // category change toggles perfume
    sel('type').addEventListener('change', () => {
      const perf = sel('type').value === 'Perfumes';
      host.querySelector('[data-colors-section]').classList.toggle('hidden', perf);
      const grp = host.querySelector('[data-size-group]');
      grp.innerHTML = (perf ? SIZES_PERFUME : SIZES_CLOTHING).map((s) => `<button type="button" data-size="${s}" class="size-pill px-3.5 h-9 rounded-[10px] border text-[13px] font-600 tnum transition bg-paper text-body border-line hover:border-line-strong">${s}</button>`).join('');
      sizes.clear();
      wireSizes();
      host.querySelector('[data-sizes] .lbl').textContent = perf ? 'Capacidad' : 'Tallas disponibles';
    });

    function wireSizes() {
      host.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
        const s = b.dataset.size, on = sizes.has(s);
        on ? sizes.delete(s) : sizes.add(s);
        b.className = `size-pill px-3.5 h-9 rounded-[10px] border text-[13px] font-600 tnum transition ${!on ? 'bg-ink text-white border-ink' : 'bg-paper text-body border-line hover:border-line-strong'}`;
      }));
    }
    wireSizes();
    host.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
      const c = b.dataset.color, on = colors.has(c);
      on ? colors.delete(c) : colors.add(c);
      b.className = `color-pill inline-flex items-center gap-2 pl-1.5 pr-3 h-9 rounded-full border text-[12.5px] font-600 transition ${!on ? 'bg-ink text-white border-ink' : 'bg-paper text-body border-line hover:border-line-strong'}`;
    }));

    host.querySelector('[data-save]').addEventListener('click', () => {
      const name = sel('name').value.trim();
      const price = Number(sel('price').value);
      if (!name) return UI.toast('Ingresa el nombre del producto', 'error');
      if (!price || price <= 0) return UI.toast('Ingresa un precio válido', 'error');
      const data = {
        ...(product || { id: 'p' + Date.now(), sold: 0 }),
        name, type: sel('type').value, price,
        originalPrice: Number(sel('originalPrice').value) || null,
        stock: sel('stock').value.trim() === '' ? '∞' : Number(sel('stock').value),
        badge: sel('badge').value, sizes: [...sizes], colors: [...colors],
      };
      onSave(data, editing);
      close();
      UI.toast(editing ? 'Producto actualizado' : 'Producto creado');
    });
  }

  function confirmDelete(name, onYes) {
    const html = `
      <div class="bg-paper rounded-3xl border border-line shadow-pop overflow-hidden">
        <div class="p-5">
          <div class="w-11 h-11 rounded-xl2 bg-bad-tint text-bad flex items-center justify-center mb-3">${ICON.trash({ cls: 'w-5 h-5' })}</div>
          <h3 class="font-display font-bold text-ink text-[17px]">¿Eliminar producto?</h3>
          <p class="text-[13.5px] text-muted mt-1">Vas a eliminar <span class="font-600 text-body">“${name}”</span>. Esta acción no se puede deshacer.</p>
        </div>
        <div class="px-5 pb-5 flex gap-2.5">
          <button data-ov-close class="btn btn-ghost flex-1">Cancelar</button>
          <button data-yes class="btn flex-1" style="background:#D6453E;color:#fff">Eliminar</button>
        </div>
      </div>`;
    const { host, close } = UI.openOverlay(html);
    host.querySelector('[data-yes]').addEventListener('click', () => { onYes(); close(); UI.toast('Producto eliminado'); });
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.products = function (host) {
    let products = window.DB.PRODUCTS.map((p) => ({ ...p }));
    let q = '', fType = 'all', fStatus = 'all', fStock = 'all', mode = 'list';

    const allTypes = [...new Set(window.DB.PRODUCTS.map((p) => p.type))];

    function filtered() {
      return products.filter((p) => {
        const mq = !q || p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
        const mt = fType === 'all' || p.type === fType;
        const published = p.badge !== 'Borrador';
        const ms = fStatus === 'all' || (fStatus === 'published' && published) || (fStatus === 'draft' && !published);
        const inf = p.stock === '∞'; const n = Number(p.stock);
        const mk = fStock === 'all' || (fStock === 'in' && (inf || n > 0)) || (fStock === 'low' && !inf && n > 0 && n <= 10) || (fStock === 'out' && !inf && n <= 0);
        return mq && mt && ms && mk;
      });
    }

    function counts() {
      return {
        total: products.length,
        published: products.filter((p) => p.badge !== 'Borrador').length,
        low: products.filter((p) => p.stock !== '∞' && Number(p.stock) > 0 && Number(p.stock) <= 10).length,
        out: products.filter((p) => p.stock !== '∞' && Number(p.stock) <= 0).length,
      };
    }

    function save(data, editing) {
      if (editing) { const i = products.findIndex((p) => p.id === data.id); if (i >= 0) products[i] = data; }
      else products.unshift(data);
      render();
    }
    function remove(id) { products = products.filter((p) => p.id !== id); render(); }

    function render() {
      const list = filtered();
      const c = counts();
      host.innerHTML = `
        <div class="view-in space-y-5">
          <!-- header row -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="grid grid-cols-3 gap-2.5 flex-1 max-w-2xl">
              <div class="bg-paper rounded-xl2 border border-line px-4 py-3"><p class="eyebrow text-faint">Catálogo</p><p class="font-display font-bold text-ink text-[20px] tnum mt-0.5">${c.total}</p></div>
              <div class="bg-paper rounded-xl2 border border-line px-4 py-3"><p class="eyebrow text-faint">Bajo stock</p><p class="font-display font-bold text-warn text-[20px] tnum mt-0.5">${c.low}</p></div>
              <div class="bg-paper rounded-xl2 border border-line px-4 py-3"><p class="eyebrow text-faint">Agotados</p><p class="font-display font-bold text-bad text-[20px] tnum mt-0.5">${c.out}</p></div>
            </div>
            <button data-add class="btn btn-primary shrink-0">${ICON.plus({ cls: 'w-[18px] h-[18px]' })} Agregar producto</button>
          </div>

          <!-- toolbar -->
          <div class="bg-paper rounded-3xl border border-line shadow-card">
            <div class="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-line">
              <div class="relative flex-1 min-w-0">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">${ICON.search({ cls: 'w-[18px] h-[18px]' })}</span>
                <input data-search value="${q}" placeholder="Buscar producto..." class="fld pl-10" />
              </div>
              <div class="flex items-center gap-2">
                <select data-ftype class="fld w-auto min-w-[120px]"><option value="all">Categoría</option>${allTypes.map((t) => `<option ${fType === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
                <select data-fstock class="fld w-auto min-w-[110px]">
                  <option value="all" ${fStock === 'all' ? 'selected' : ''}>Stock</option>
                  <option value="in" ${fStock === 'in' ? 'selected' : ''}>Con stock</option>
                  <option value="low" ${fStock === 'low' ? 'selected' : ''}>Bajo stock</option>
                  <option value="out" ${fStock === 'out' ? 'selected' : ''}>Agotados</option>
                </select>
                <div class="seg shrink-0 hidden sm:inline-flex">
                  <button data-mode="list" class="${mode === 'list' ? 'active' : ''} !px-2.5">${ICON.list({ cls: 'w-[18px] h-[18px]' })}</button>
                  <button data-mode="grid" class="${mode === 'grid' ? 'active' : ''} !px-2.5">${ICON.grid({ cls: 'w-[18px] h-[18px]' })}</button>
                </div>
              </div>
            </div>
            ${list.length ? (mode === 'grid' ? gridHtml(list) : tableHtml(list)) : UI.empty({ icon: 'products', title: 'Sin productos', sub: 'No hay productos que coincidan. Ajusta los filtros o agrega uno nuevo.' })}
            <div class="px-5 py-3 border-t border-line flex items-center justify-between text-[12.5px] text-muted">
              <span class="tnum">${list.length} de ${products.length} productos</span>
              <span class="tnum">Página 1</span>
            </div>
          </div>
        </div>`;
      wire();
    }

    function tableHtml(list) {
      return `<div class="overflow-x-auto scroll-thin">
        <table class="w-full min-w-[680px]">
          <thead><tr class="text-left">
            <th class="eyebrow text-faint font-500 px-5 py-3">Producto</th>
            <th class="eyebrow text-faint font-500 px-5 py-3">Categoría</th>
            <th class="eyebrow text-faint font-500 px-5 py-3 text-right">Precio</th>
            <th class="eyebrow text-faint font-500 px-5 py-3">Stock</th>
            <th class="eyebrow text-faint font-500 px-5 py-3">Estado</th>
            <th class="eyebrow text-faint font-500 px-5 py-3 text-right">Acciones</th>
          </tr></thead>
          <tbody>${list.map(rowHtml).join('')}</tbody>
        </table></div>`;
    }

    function rowHtml(p) {
      const published = p.badge !== 'Borrador';
      return `<tr data-id="${p.id}" class="border-t border-line hover:bg-canvas transition-colors group">
        <td class="px-5 py-3">
          <div class="flex items-center gap-3">
            ${thumb(p)}
            <div class="min-w-0">
              <div class="flex items-center gap-1.5"><p class="text-[13.5px] font-600 text-ink truncate max-w-[220px]">${p.name}</p>${badgePill(p.badge)}</div>
              <div class="flex items-center gap-1 mt-1">${(p.colors || []).slice(0, 5).map((c) => swatch(c, 11)).join('') || '<span class="text-[11px] text-faint">Sin color</span>'}</div>
            </div>
          </div>
        </td>
        <td class="px-5 py-3"><span class="inline-flex items-center px-2 h-[24px] rounded-md bg-canvas border border-line text-[12px] font-500 text-body">${p.type}</span></td>
        <td class="px-5 py-3 text-right"><p class="text-[14px] font-700 text-ink tnum">${fmt.money(p.price)}</p>${p.originalPrice ? `<p class="text-[11.5px] text-faint line-through tnum">${fmt.money(p.originalPrice)}</p>` : ''}</td>
        <td class="px-5 py-3">${stockBadge(p)}</td>
        <td class="px-5 py-3"><button data-toggle class="inline-flex items-center gap-2"><span class="gl-toggle ${published ? 'on' : ''}"></span><span class="text-[12.5px] font-500 ${published ? 'text-ink' : 'text-muted'}">${published ? 'Publicado' : 'Borrador'}</span></button></td>
        <td class="px-5 py-3"><div class="flex items-center justify-end gap-1">
          <button data-edit class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition">${ICON.edit({ cls: 'w-[17px] h-[17px]' })}</button>
          <button data-del class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition">${ICON.trash({ cls: 'w-[17px] h-[17px]' })}</button>
        </div></td>
      </tr>`;
    }

    function gridHtml(list) {
      return `<div class="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        ${list.map((p) => {
          const published = p.badge !== 'Borrador';
          const c = p.colors && p.colors.length ? (COL[p.colors[0]] || '#EEF0F4') : '#EEF0F4';
          const dark = ['#15171C', '#1B2A4A', '#5A1E2B', '#214FC7', '#2E5D4B', '#5A3A22'].includes(c);
          return `<div data-id="${p.id}" class="rounded-xl2 border border-line bg-paper overflow-hidden group">
            <div class="aspect-[4/5] flex items-center justify-center relative" style="background:${c}">
              <span style="color:${dark ? 'rgba(255,255,255,.8)' : 'rgba(21,23,28,.4)'}">${ICON[p.type === 'Perfumes' ? 'sparkle' : 'products']({ cls: 'w-8 h-8' })}</span>
              <div class="absolute top-2 left-2 flex gap-1">${badgePill(p.badge)}</div>
              <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button data-edit class="w-7 h-7 rounded-lg bg-paper flex items-center justify-center text-body hover:text-brand shadow-card">${ICON.edit({ cls: 'w-4 h-4' })}</button>
                <button data-del class="w-7 h-7 rounded-lg bg-paper flex items-center justify-center text-body hover:text-bad shadow-card">${ICON.trash({ cls: 'w-4 h-4' })}</button>
              </div>
            </div>
            <div class="p-3">
              <p class="text-[13px] font-600 text-ink truncate">${p.name}</p>
              <div class="flex items-center justify-between mt-1.5">
                <span class="text-[14px] font-700 text-ink tnum">${fmt.money(p.price)}</span>
                ${stockBadge(p)}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }

    function wire() {
      const byId = (id) => products.find((p) => p.id === id);
      host.querySelector('[data-add]').addEventListener('click', () => openForm(null, save));
      host.querySelector('[data-search]').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); render(); });
      host.querySelector('[data-ftype]').addEventListener('change', (e) => { fType = e.target.value; render(); });
      host.querySelector('[data-fstock]').addEventListener('change', (e) => { fStock = e.target.value; render(); });
      host.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));
      host.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const id = b.closest('[data-id]').dataset.id; openForm(byId(id), save); }));
      host.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const id = b.closest('[data-id]').dataset.id; confirmDelete(byId(id).name, () => remove(id)); }));
      host.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
        const id = b.closest('[data-id]').dataset.id; const p = byId(id);
        p.badge = p.badge === 'Borrador' ? '' : 'Borrador';
        UI.toast(p.badge === 'Borrador' ? 'Movido a borradores' : 'Producto publicado'); render();
      }));
    }

    render();
  };
})();
