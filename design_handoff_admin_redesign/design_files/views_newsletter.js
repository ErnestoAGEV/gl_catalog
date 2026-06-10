// G&L Admin — Newsletter
(function () {
  const ICON = window.ICON, UI = window.UI;

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.newsletter = function (host) {
    const subs = window.DB.SUBSCRIBERS.map((s) => ({ ...s }));
    let q = '';

    function filtered() { return subs.filter((s) => !q || s.email.toLowerCase().includes(q)); }

    function render() {
      const list = filtered();
      const last7 = subs.filter((s) => Date.now() - new Date(s.created_at) < 7 * 86400000).length;
      const domains = {};
      subs.forEach((s) => { const d = s.email.split('@')[1]; domains[d] = (domains[d] || 0) + 1; });
      const topDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];

      host.innerHTML = `
        <div class="view-in space-y-5">
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
            ${UI.statCard({ eyebrow: 'Suscriptores', value: subs.length, icon: 'users', accent: '#214FC7', delta: '+' + last7, deltaDir: 'up', foot: 'últimos 7 días' })}
            ${UI.statCard({ eyebrow: 'Nuevos esta semana', value: last7, icon: 'sparkle', foot: 'crecimiento activo' })}
            ${UI.statCard({ eyebrow: 'Dominio principal', value: topDomain ? '@' + topDomain[0].split('.')[0] : '—', icon: 'mail', foot: topDomain ? topDomain[1] + ' suscriptores' : '' })}
          </div>

          <div class="bg-paper rounded-3xl border border-line shadow-card">
            <div class="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-line">
              <div class="relative flex-1 min-w-0">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">${ICON.search({ cls: 'w-[18px] h-[18px]' })}</span>
                <input data-search value="${q}" placeholder="Buscar correo..." class="fld pl-10" />
              </div>
              <button data-export class="btn btn-ghost shrink-0">${ICON.arrowUpR({ cls: 'w-[16px] h-[16px]' })} Exportar CSV</button>
            </div>

            <!-- desktop -->
            <div class="hidden md:block">
              <table class="w-full">
                <thead><tr class="text-left">
                  <th class="eyebrow text-faint font-500 px-5 py-3">Suscriptor</th>
                  <th class="eyebrow text-faint font-500 px-5 py-3">Fecha de registro</th>
                  <th class="eyebrow text-faint font-500 px-5 py-3 text-right">Estado</th>
                </tr></thead>
                <tbody>${list.map(rowHtml).join('')}</tbody>
              </table>
              ${list.length ? '' : UI.empty({ icon: 'mail', title: 'Sin resultados', sub: 'No hay correos que coincidan.' })}
            </div>
            <!-- mobile -->
            <div class="md:hidden divide-y divide-line">${list.length ? list.map(cardHtml).join('') : UI.empty({ icon: 'mail', title: 'Sin resultados', sub: 'No hay correos que coincidan.' })}</div>

            <div class="px-5 py-3 border-t border-line text-[12.5px] text-muted tnum">${list.length} de ${subs.length} suscriptores</div>
          </div>
        </div>`;
      wire();
    }

    function rowHtml(s) {
      return `<tr class="border-t border-line hover:bg-canvas transition">
        <td class="px-5 py-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[13px] font-bold uppercase shrink-0">${s.email[0]}</div>
            <p class="text-[13.5px] font-500 text-ink truncate">${s.email}</p>
          </div>
        </td>
        <td class="px-5 py-3"><p class="text-[13px] text-body">${UI.dateShort(s.created_at)}</p><p class="text-[11.5px] text-faint tnum">${UI.timeShort(s.created_at)}</p></td>
        <td class="px-5 py-3 text-right"><span class="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[11px] font-600 bg-ok-tint text-ok"><span class="w-1.5 h-1.5 rounded-full bg-ok"></span>Activo</span></td>
      </tr>`;
    }
    function cardHtml(s) {
      return `<div class="p-4 flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[13px] font-bold uppercase shrink-0">${s.email[0]}</div>
        <div class="min-w-0 flex-1"><p class="text-[13.5px] font-500 text-ink truncate">${s.email}</p><p class="text-[11.5px] text-faint">${UI.dateShort(s.created_at)}</p></div>
        <span class="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[11px] font-600 bg-ok-tint text-ok shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-ok"></span>Activo</span>
      </div>`;
    }

    function wire() {
      host.querySelector('[data-search]').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); render(); });
      host.querySelector('[data-export]').addEventListener('click', () => UI.toast('Exportando ' + subs.length + ' suscriptores...', 'info'));
    }

    render();
  };
})();
