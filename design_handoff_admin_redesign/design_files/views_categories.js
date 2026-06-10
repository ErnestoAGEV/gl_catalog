// G&L Admin — Categorías
(function () {
  const ICON = window.ICON, UI = window.UI;

  function productCounts() {
    const counts = {};
    window.DB.PRODUCTS.forEach((p) => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return counts;
  }

  function nameModal({ title, value = '', cta, onSave }) {
    const html = `
      <div class="bg-paper rounded-3xl border border-line shadow-pop overflow-hidden">
        <div class="px-5 py-4 border-b border-line flex items-center justify-between">
          <h3 class="font-display font-bold text-ink text-[17px]">${title}</h3>
          <button data-ov-close class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition">${ICON.close({ cls: 'w-[18px] h-[18px]' })}</button>
        </div>
        <div class="p-5">
          <label class="lbl">Nombre de la categoría</label>
          <input data-input class="fld" value="${value}" placeholder="Ej. Zapatos" />
          <p data-err class="hidden text-[12.5px] text-bad mt-2"></p>
        </div>
        <div class="px-5 pb-5 flex gap-2.5">
          <button data-ov-close class="btn btn-ghost flex-1">Cancelar</button>
          <button data-save class="btn btn-primary flex-1">${cta}</button>
        </div>
      </div>`;
    const { host, close } = UI.openOverlay(html);
    const input = host.querySelector('[data-input]');
    const err = host.querySelector('[data-err]');
    setTimeout(() => input.focus(), 50);
    const submit = () => {
      const v = input.value.trim();
      if (!v) { err.textContent = 'El nombre es requerido.'; err.classList.remove('hidden'); return; }
      onSave(v); close();
    };
    host.querySelector('[data-save]').addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.categories = function (host) {
    let cats = window.DB.CATEGORIES.map((c) => ({ ...c }));

    function row(cat, i, total, counts) {
      const count = counts[cat.name] || 0;
      return `<div data-id="${cat.id}" class="group flex items-center gap-3 bg-paper rounded-xl2 border border-line hover:border-line-strong hover:shadow-card px-3.5 py-3 transition">
        <div class="flex flex-col items-center gap-0.5 shrink-0">
          <button data-up class="w-6 h-6 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-canvas transition disabled:opacity-25 disabled:pointer-events-none" ${i === 0 ? 'disabled' : ''}>${ICON.chevUp({ cls: 'w-4 h-4' })}</button>
          <button data-down class="w-6 h-6 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-canvas transition disabled:opacity-25 disabled:pointer-events-none" ${i === total - 1 ? 'disabled' : ''}>${ICON.chevDown({ cls: 'w-4 h-4' })}</button>
        </div>
        <div class="w-8 h-8 rounded-lg bg-canvas border border-line flex items-center justify-center eyebrow text-muted tnum shrink-0">${String(i + 1).padStart(2, '0')}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-600 text-ink text-[14px] truncate">${cat.name}</p>
            ${!cat.active ? '<span class="inline-flex items-center px-1.5 h-[18px] rounded text-[10px] font-600 bg-line text-muted">Oculta</span>' : ''}
          </div>
          <p class="text-[12px] text-faint mt-0.5 tnum">${count} producto${count !== 1 ? 's' : ''}</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button data-toggle title="${cat.active ? 'Ocultar' : 'Mostrar'}"><span class="gl-toggle ${cat.active ? 'on' : ''}"></span></button>
          <button data-edit class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-brand hover:bg-brand-tint transition opacity-0 group-hover:opacity-100">${ICON.edit({ cls: 'w-[16px] h-[16px]' })}</button>
          <button data-del class="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-bad hover:bg-bad-tint transition opacity-0 group-hover:opacity-100">${ICON.trash({ cls: 'w-[16px] h-[16px]' })}</button>
        </div>
      </div>`;
    }

    function render() {
      const counts = productCounts();
      host.innerHTML = `
        <div class="view-in max-w-3xl mx-auto space-y-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-display font-bold text-ink text-[20px]">Categorías del catálogo</h2>
              <p class="text-[13.5px] text-muted mt-1">${cats.length} categorías · ${cats.filter((c) => c.active).length} visibles</p>
            </div>
            <button data-add class="btn btn-primary shrink-0">${ICON.plus({ cls: 'w-[18px] h-[18px]' })} Nueva</button>
          </div>

          <div class="flex items-start gap-3 bg-brand-tint2 rounded-xl2 px-4 py-3" style="border:1px solid rgba(33,79,199,0.16)">
            <span class="text-brand shrink-0 mt-0.5">${ICON.info({ cls: 'w-[18px] h-[18px]' })}</span>
            <p class="text-[13px] text-body leading-relaxed">El orden define cómo aparecen los productos en la tienda. Usa las flechas para reordenar y los interruptores para mostrar u ocultar categorías.</p>
          </div>

          <div class="space-y-2" data-list>
            ${cats.map((c, i) => row(c, i, cats.length, counts)).join('')}
          </div>
        </div>`;
      wire();
    }

    function wire() {
      const counts = productCounts();
      const byId = (id) => cats.find((c) => c.id === id);
      host.querySelector('[data-add]').addEventListener('click', () => nameModal({
        title: 'Nueva categoría', cta: 'Crear', onSave: (name) => {
          if (cats.some((c) => c.name.toLowerCase() === name.toLowerCase())) return UI.toast('Ya existe esa categoría', 'error');
          cats.push({ id: 'c' + Date.now(), name, active: true }); UI.toast(`Categoría “${name}” creada`); render();
        },
      }));
      host.querySelectorAll('[data-id]').forEach((el) => {
        const id = el.dataset.id; const idx = cats.findIndex((c) => c.id === id);
        el.querySelector('[data-up]')?.addEventListener('click', () => { if (idx > 0) { [cats[idx - 1], cats[idx]] = [cats[idx], cats[idx - 1]]; render(); } });
        el.querySelector('[data-down]')?.addEventListener('click', () => { if (idx < cats.length - 1) { [cats[idx], cats[idx + 1]] = [cats[idx + 1], cats[idx]]; render(); } });
        el.querySelector('[data-toggle]').addEventListener('click', () => { const c = byId(id); c.active = !c.active; UI.toast(c.active ? 'Categoría visible' : 'Categoría oculta'); render(); });
        el.querySelector('[data-edit]').addEventListener('click', () => { const c = byId(id); nameModal({ title: 'Editar categoría', value: c.name, cta: 'Guardar', onSave: (name) => { c.name = name; UI.toast('Categoría actualizada'); render(); } }); });
        el.querySelector('[data-del]').addEventListener('click', () => {
          const c = byId(id); const n = counts[c.name] || 0;
          if (n > 0) return UI.toast(`No se puede eliminar: tiene ${n} producto(s) asignado(s)`, 'error');
          cats = cats.filter((x) => x.id !== id); UI.toast('Categoría eliminada'); render();
        });
      });
    }

    render();
  };
})();
