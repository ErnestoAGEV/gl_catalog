// G&L Admin — Cupones
(function () {
  const ICON = window.ICON, UI = window.UI;

  function couponCard(c) {
    const pct = Math.round((c.discount || 0) * 100);
    return `<div data-code="${c.code}" class="group relative bg-paper rounded-xl2 border ${c.active ? 'border-line' : 'border-line opacity-70'} shadow-card overflow-hidden">
      <!-- ticket notches -->
      <div class="absolute top-1/2 -left-2 w-4 h-4 rounded-full bg-canvas border border-line -translate-y-1/2"></div>
      <div class="absolute top-1/2 -right-2 w-4 h-4 rounded-full bg-canvas border border-line -translate-y-1/2"></div>
      <div class="p-4 pb-3 flex items-start justify-between">
        <span class="inline-flex items-center gap-1.5 px-2 h-[22px] rounded-full text-[11px] font-600 ${c.active ? 'bg-ok-tint text-ok' : 'bg-line text-muted'}">
          <span class="w-1.5 h-1.5 rounded-full" style="background:${c.active ? '#1E9E6A' : '#A4A8B2'}"></span>${c.active ? 'Activo' : 'Inactivo'}</span>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button data-edit class="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition">${ICON.edit({ cls: 'w-4 h-4' })}</button>
          <button data-del class="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition">${ICON.trash({ cls: 'w-4 h-4' })}</button>
        </div>
      </div>
      <div class="px-4">
        <p class="font-mono font-700 tracking-[0.08em] text-[20px] ${c.active ? 'text-ink' : 'text-muted'}">${c.code}</p>
        <p class="text-[12.5px] text-muted mt-1 truncate">${c.label || '—'}</p>
      </div>
      <div class="px-4 pt-3 mt-3 border-t border-dashed border-line grid grid-cols-2 gap-2">
        <div class="text-center bg-canvas rounded-lg py-2">
          <p class="font-display font-bold text-ink text-[17px] tnum">${pct ? pct + '%' : '—'}</p>
          <p class="eyebrow text-faint mt-0.5">Descuento</p>
        </div>
        <div class="text-center bg-canvas rounded-lg py-2">
          <p class="font-display font-bold ${c.free_shipping ? 'text-ok' : 'text-faint'} text-[17px]">${c.free_shipping ? '✓' : '—'}</p>
          <p class="eyebrow text-faint mt-0.5">Envío gratis</p>
        </div>
      </div>
      <div class="p-4 pt-3 flex items-center justify-between">
        <span class="text-[11.5px] text-faint">${c.categories && c.categories.length ? c.categories.length + ' categoría(s)' : 'Toda la tienda'}</span>
        <button data-toggle><span class="gl-toggle ${c.active ? 'on' : ''}"></span></button>
      </div>
    </div>`;
  }

  function couponModal(coupon, onSave) {
    const editing = !!coupon;
    const c = coupon || { code: '', label: '', discount: 0, free_shipping: false, active: true, categories: [] };
    const cats = [...new Set(window.DB.PRODUCTS.map((p) => p.type))];
    const html = `
      <div class="bg-paper rounded-3xl border border-line shadow-pop overflow-hidden max-h-[90vh] flex flex-col">
        <div class="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <h3 class="font-display font-bold text-ink text-[17px]">${editing ? 'Editar cupón' : 'Nuevo cupón'}</h3>
          <button data-ov-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition">${ICON.close({ cls: 'w-[18px] h-[18px]' })}</button>
        </div>
        <div class="p-5 space-y-4 overflow-y-auto scroll-thin">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="lbl">Código</label><input data-code class="fld font-mono uppercase tracking-wide" value="${c.code}" placeholder="VERANO25" ${editing ? 'disabled' : ''} /></div>
            <div><label class="lbl">Descuento (%)</label><input data-disc type="number" min="0" max="100" class="fld tnum" value="${Math.round((c.discount || 0) * 100) || ''}" placeholder="25" /></div>
          </div>
          <div><label class="lbl">Descripción</label><input data-label class="fld" value="${c.label || ''}" placeholder="Descuento de verano" /></div>
          <div>
            <label class="lbl">Aplicar solo a categorías <span class="text-faint normal-case font-400">(opcional)</span></label>
            <div class="grid grid-cols-2 gap-1.5 bg-canvas border border-line rounded-xl2 p-2.5 max-h-40 overflow-y-auto scroll-thin">
              ${cats.map((t) => `<label class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-paper cursor-pointer text-[13px] text-body transition">
                <input type="checkbox" data-cat value="${t}" ${c.categories.includes(t) ? 'checked' : ''} class="w-4 h-4 accent-brand rounded" />${t}</label>`).join('')}
            </div>
            <p class="text-[11.5px] text-faint mt-1.5">Si no seleccionas ninguna, el cupón aplica a toda la tienda.</p>
          </div>
          <label class="flex items-center justify-between bg-canvas border border-line rounded-xl2 px-4 py-3 cursor-pointer">
            <div><p class="text-[13.5px] font-600 text-ink">Envío gratis</p><p class="text-[12px] text-faint">Incluye envío sin costo</p></div>
            <span class="gl-toggle ${c.free_shipping ? 'on' : ''}" data-free></span>
          </label>
          <label class="flex items-center justify-between bg-canvas border border-line rounded-xl2 px-4 py-3 cursor-pointer">
            <div><p class="text-[13.5px] font-600 text-ink">Cupón activo</p><p class="text-[12px] text-faint">Los clientes pueden usarlo</p></div>
            <span class="gl-toggle ${c.active ? 'on' : ''}" data-active></span>
          </label>
        </div>
        <div class="px-5 py-3.5 border-t border-line flex gap-2.5 shrink-0">
          <button data-ov-close class="btn btn-ghost flex-1">Cancelar</button>
          <button data-save class="btn btn-primary flex-1">${editing ? 'Guardar' : 'Crear cupón'}</button>
        </div>
      </div>`;
    const { host, close } = UI.openOverlay(html);
    let free = c.free_shipping, active = c.active;
    const codeInput = host.querySelector('[data-code]');
    codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
    host.querySelector('[data-free]').addEventListener('click', function () { free = !free; this.classList.toggle('on', free); });
    host.querySelector('[data-active]').addEventListener('click', function () { active = !active; this.classList.toggle('on', active); });
    host.querySelector('[data-save]').addEventListener('click', () => {
      const code = codeInput.value.trim();
      if (!code) return UI.toast('Ingresa un código', 'error');
      const data = {
        ...(coupon || { created_at: new Date().toISOString() }),
        code, label: host.querySelector('[data-label]').value.trim(),
        discount: (Number(host.querySelector('[data-disc]').value) || 0) / 100,
        free_shipping: free, active,
        categories: [...host.querySelectorAll('[data-cat]:checked')].map((i) => i.value),
      };
      onSave(data, editing); close(); UI.toast(editing ? 'Cupón actualizado' : 'Cupón creado');
    });
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.coupons = function (host) {
    let coupons = window.DB.COUPONS.map((c) => ({ ...c }));

    function save(data, editing) {
      if (editing) { const i = coupons.findIndex((c) => c.code === data.code); if (i >= 0) coupons[i] = data; }
      else coupons.unshift(data);
      render();
    }

    function render() {
      const active = coupons.filter((c) => c.active).length;
      host.innerHTML = `
        <div class="view-in space-y-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-display font-bold text-ink text-[20px]">Cupones de descuento</h2>
              <p class="text-[13.5px] text-muted mt-1">${coupons.length} cupones · ${active} activos</p>
            </div>
            <button data-add class="btn btn-primary shrink-0">${ICON.plus({ cls: 'w-[18px] h-[18px]' })} Crear cupón</button>
          </div>
          ${coupons.length ? `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">${coupons.map(couponCard).join('')}</div>`
            : `<div class="bg-paper rounded-3xl border border-line">${UI.empty({ icon: 'coupon', title: 'Sin cupones', sub: 'Crea tu primer código de descuento.' })}</div>`}
        </div>`;
      wire();
    }

    function wire() {
      const byCode = (code) => coupons.find((c) => c.code === code);
      host.querySelector('[data-add]').addEventListener('click', () => couponModal(null, save));
      host.querySelectorAll('[data-code]').forEach((el) => {
        const code = el.dataset.code;
        el.querySelector('[data-edit]').addEventListener('click', () => couponModal(byCode(code), save));
        el.querySelector('[data-del]').addEventListener('click', () => { coupons = coupons.filter((c) => c.code !== code); UI.toast('Cupón eliminado'); render(); });
        el.querySelector('[data-toggle]').addEventListener('click', () => { const c = byCode(code); c.active = !c.active; UI.toast(c.active ? 'Cupón activado' : 'Cupón desactivado'); render(); });
      });
    }

    render();
  };
})();
