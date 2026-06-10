// G&L Admin — Órdenes
(function () {
  const ICON = window.ICON, UI = window.UI, fmt = window.fmt;
  const lc = (s) => (s || '').toLowerCase();

  const STATUS_OPTS = [
    { v: 'completado', label: 'Completado' },
    { v: 'pendientedepago', label: 'Pendiente de pago' },
    { v: 'cancelado', label: 'Cancelado' },
  ];

  function statusDropdown(o) {
    const m = UI.statusMeta(o.status);
    return `
      <div class="relative inline-block" data-status-wrap data-id="${o.id}">
        <button data-status-btn class="inline-flex items-center gap-1.5 pl-2.5 pr-2 h-[30px] rounded-full text-[12px] font-600 ${m.cls} hover:brightness-95 transition">
          <span class="w-1.5 h-1.5 rounded-full" style="background:${m.dot}"></span>${m.label}
          ${ICON.chevDown({ cls: 'w-3.5 h-3.5 opacity-60' })}
        </button>
        <div data-status-menu class="hidden absolute right-0 top-[34px] z-30 w-[180px] bg-paper rounded-xl2 border border-line shadow-float p-1 anim-pop">
          ${STATUS_OPTS.map((s) => `<button data-set="${s.v}" class="w-full flex items-center gap-2 px-2.5 h-9 rounded-lg text-[13px] font-500 text-body hover:bg-canvas transition ${s.v === lc(o.status) ? 'bg-canvas' : ''}">
            <span class="w-1.5 h-1.5 rounded-full" style="background:${UI.statusMeta(s.v).dot}"></span>${s.label}
            ${s.v === lc(o.status) ? `<span class="ml-auto text-brand">${ICON.check({ cls: 'w-4 h-4' })}</span>` : ''}
          </button>`).join('')}
        </div>
      </div>`;
  }

  function detailDrawer(o) {
    const pay = UI.payMeta(o.payment_method);
    const itemsTotal = o.cart_items.reduce((a, it) => a + it.price * it.qty, 0);
    const html = `
      <div class="h-full bg-canvas flex flex-col anim-drawer">
        <div class="bg-paper border-b border-line px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p class="eyebrow text-faint">Pedido</p>
            <h3 class="font-display font-bold text-ink text-[18px] tnum mt-0.5">${o.id}</h3>
          </div>
          <button data-ov-close class="w-9 h-9 rounded-[10px] border border-line bg-paper flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition">${ICON.close({ cls: 'w-[18px] h-[18px]' })}</button>
        </div>
        <div class="flex-1 overflow-y-auto scroll-thin p-5 space-y-4">
          <!-- Actions -->
          <div class="grid grid-cols-2 gap-2">
            <button class="btn btn-ink h-10 text-[13px]">${ICON.whatsapp({ cls: 'w-[17px] h-[17px]' })} WhatsApp</button>
            <button class="btn btn-ghost h-10 text-[13px]">${ICON.print({ cls: 'w-[17px] h-[17px]' })} Imprimir</button>
            <button data-copy="${encodeURIComponent(o.address || o.delivery_method)}" class="btn btn-ghost h-10 text-[13px]">${ICON.copy({ cls: 'w-[16px] h-[16px]' })} Copiar dirección</button>
            <button data-copy-sum class="btn btn-ghost h-10 text-[13px]">${ICON.list({ cls: 'w-[16px] h-[16px]' })} Copiar resumen</button>
          </div>

          <!-- Customer -->
          <div class="bg-paper rounded-xl2 border border-line p-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[14px] font-bold">${fmt.initials(o.customer_name)}</div>
              <div class="min-w-0">
                <p class="font-600 text-ink text-[15px] truncate">${o.customer_name}</p>
                <p class="text-[13px] text-brand tnum">${o.customer_whatsapp}</p>
              </div>
            </div>
          </div>

          <!-- Meta grid -->
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-paper rounded-xl2 border border-line p-3.5">
              <p class="eyebrow text-faint mb-1.5">Estado</p>${UI.statusPill(o.status)}
            </div>
            <div class="bg-paper rounded-xl2 border border-line p-3.5">
              <p class="eyebrow text-faint mb-1.5">Pago</p>
              <span class="inline-flex items-center gap-1.5 text-[13px] font-600 text-ink">${ICON[pay.icon]({ cls: 'w-4 h-4 text-muted' })}${pay.label}</span>
            </div>
            <div class="bg-paper rounded-xl2 border border-line p-3.5">
              <p class="eyebrow text-faint mb-1.5">Fecha</p>
              <p class="text-[13px] font-600 text-ink">${UI.dateShort(o.created_at)}</p>
              <p class="text-[11.5px] text-faint tnum">${UI.timeShort(o.created_at)}</p>
            </div>
            <div class="bg-paper rounded-xl2 border border-line p-3.5">
              <p class="eyebrow text-faint mb-1.5">Entrega</p>
              <span class="inline-flex items-center gap-1.5 text-[13px] font-600 text-ink">${ICON[o.delivery_method.includes('domicilio') ? 'truck' : 'store']({ cls: 'w-4 h-4 text-muted' })}${o.delivery_method.includes('domicilio') ? 'Domicilio' : 'En tienda'}</span>
            </div>
          </div>

          ${o.address ? `<div class="bg-paper rounded-xl2 border border-line p-4 flex items-start gap-3">
            <span class="text-muted mt-0.5">${ICON.map({ cls: 'w-[18px] h-[18px]' })}</span>
            <div><p class="eyebrow text-faint mb-1">Dirección de envío</p><p class="text-[13.5px] text-body leading-relaxed">${o.address}</p></div>
          </div>` : ''}

          <!-- Items -->
          <div class="bg-paper rounded-xl2 border border-line overflow-hidden">
            <div class="px-4 py-3 border-b border-line flex items-center justify-between">
              <p class="font-600 text-ink text-[14px]">Productos</p>
              <span class="text-[12px] text-muted tnum">${o.cart_items.length} artículo${o.cart_items.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="divide-y divide-line">
              ${o.cart_items.map((it) => `<div class="flex items-center gap-3 px-4 py-3">
                <div class="w-8 h-8 rounded-lg bg-canvas border border-line flex items-center justify-center text-[11px] font-bold text-muted tnum shrink-0">${it.qty}×</div>
                <div class="min-w-0 flex-1"><p class="text-[13.5px] font-500 text-ink truncate">${it.name}</p><p class="text-[11.5px] text-faint">Talla ${it.size}</p></div>
                <p class="text-[13px] font-600 text-ink tnum shrink-0">${fmt.money(it.price * it.qty)}</p>
              </div>`).join('')}
            </div>
          </div>
        </div>
        <!-- Total footer -->
        <div class="bg-paper border-t border-line px-5 py-4 shrink-0">
          <div class="flex items-center justify-between text-[13px] text-muted mb-1"><span>Subtotal</span><span class="tnum">${fmt.money(itemsTotal)}</span></div>
          <div class="flex items-center justify-between"><span class="font-display font-bold text-ink text-[16px]">Total</span><span class="font-display font-extrabold text-ink text-[20px] tnum">${fmt.money(o.total)}</span></div>
        </div>
      </div>`;
    const { host } = UI.openOverlay(html, { side: 'right' });
    host.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => { navigator.clipboard?.writeText(decodeURIComponent(b.dataset.copy)); UI.toast('Dirección copiada'); }));
    host.querySelector('[data-copy-sum]')?.addEventListener('click', () => {
      const sum = `Pedido ${o.id}\nCliente: ${o.customer_name}\nWhatsApp: ${o.customer_whatsapp}\nTotal: ${fmt.money(o.total)}`;
      navigator.clipboard?.writeText(sum); UI.toast('Resumen copiado');
    });
    host.querySelectorAll('.btn-ink, .btn-ghost').forEach((b) => {
      if (!b.dataset.copy && !b.hasAttribute('data-copy-sum') && !b.hasAttribute('data-ov-close')) {
        b.addEventListener('click', () => UI.toast('Acción de demostración', 'info'));
      }
    });
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.orders = function (host) {
    let orders = window.DB.ORDERS.map((o) => ({ ...o }));
    let filter = 'all';
    let q = '';

    function filtered() {
      return orders.filter((o) => {
        const mf = filter === 'all' || lc(o.status) === filter;
        const mq = !q || o.customer_name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.customer_whatsapp.includes(q);
        return mf && mq;
      });
    }

    function render() {
      const list = filtered();
      const revenue = orders.filter((o) => lc(o.status) === 'completado').reduce((a, o) => a + o.total, 0);
      const pending = orders.filter((o) => lc(o.status) === 'pendientedepago').length;
      const counts = { all: orders.length, completado: 0, pendientedepago: 0, cancelado: 0 };
      orders.forEach((o) => counts[lc(o.status)] != null && counts[lc(o.status)]++);

      host.innerHTML = `
        <div class="view-in space-y-5">
          <!-- Stat strip -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            ${UI.statCard({ eyebrow: 'Total pedidos', value: orders.length, icon: 'orders', accent: '#214FC7', foot: 'histórico' })}
            ${UI.statCard({ eyebrow: 'Ingresos confirmados', value: fmt.money(revenue), icon: 'cash', delta: '+12.4%', deltaDir: 'up' })}
            ${UI.statCard({ eyebrow: 'Pendientes de pago', value: pending, icon: 'clock', foot: 'requieren seguimiento' })}
            ${UI.statCard({ eyebrow: 'Ticket promedio', value: fmt.money(revenue / Math.max(1, orders.filter((o) => lc(o.status) === 'completado').length)), icon: 'trendUp' })}
          </div>

          <!-- Toolbar -->
          <div class="bg-paper rounded-3xl border border-line shadow-card">
            <div class="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-line">
              <div class="relative flex-1 min-w-0">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">${ICON.search({ cls: 'w-[18px] h-[18px]' })}</span>
                <input data-search value="${q}" placeholder="Buscar por cliente, # de pedido o teléfono..." class="fld pl-10" />
              </div>
              <div class="flex items-center gap-2 overflow-x-auto scroll-thin -mx-1 px-1 pb-0.5 lg:pb-0">
                ${[['all', 'Todas'], ['completado', 'Completados'], ['pendientedepago', 'Pendientes'], ['cancelado', 'Cancelados']].map(([v, l]) =>
                  `<button data-f="${v}" class="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-[10px] text-[13px] font-600 border transition ${filter === v ? 'bg-ink text-white border-ink' : 'bg-paper text-body border-line hover:border-line-strong'}">${l}<span class="tnum ${filter === v ? 'text-white/55' : 'text-faint'}">${counts[v]}</span></button>`
                ).join('')}
              </div>
            </div>

            <!-- Desktop table -->
            <div class="hidden md:block">
              <table class="w-full">
                <thead>
                  <tr class="text-left">
                    <th class="eyebrow text-faint font-500 px-5 py-3">Pedido</th>
                    <th class="eyebrow text-faint font-500 px-5 py-3">Cliente</th>
                    <th class="eyebrow text-faint font-500 px-5 py-3">Fecha</th>
                    <th class="eyebrow text-faint font-500 px-5 py-3 text-right">Total</th>
                    <th class="eyebrow text-faint font-500 px-5 py-3">Estado</th>
                    <th class="eyebrow text-faint font-500 px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody data-rows>${list.length ? list.map(rowHtml).join('') : ''}</tbody>
              </table>
              ${list.length ? '' : UI.empty({ icon: 'orders', title: 'Sin pedidos', sub: 'No hay pedidos que coincidan con tu búsqueda o filtro.' })}
            </div>

            <!-- Mobile cards -->
            <div class="md:hidden divide-y divide-line" data-cards>${list.length ? list.map(cardHtml).join('') : UI.empty({ icon: 'orders', title: 'Sin pedidos', sub: 'No hay pedidos que coincidan.' })}</div>
          </div>
        </div>`;

      wire(host, list);
    }

    function rowHtml(o) {
      const pay = UI.payMeta(o.payment_method);
      return `<tr data-row data-id="${o.id}" class="border-t border-line hover:bg-canvas transition-colors cursor-pointer group">
        <td class="px-5 py-3.5">
          <p class="font-600 text-ink text-[13.5px] tnum">${o.id}</p>
          <span class="inline-flex items-center gap-1 text-[11.5px] text-muted mt-0.5">${ICON[pay.icon]({ cls: 'w-3.5 h-3.5' })}${pay.label}</span>
        </td>
        <td class="px-5 py-3.5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[11px] font-bold shrink-0">${fmt.initials(o.customer_name)}</div>
            <div class="min-w-0"><p class="text-[13.5px] font-600 text-ink truncate">${o.customer_name}</p><p class="text-[11.5px] text-faint tnum">${o.customer_whatsapp}</p></div>
          </div>
        </td>
        <td class="px-5 py-3.5"><p class="text-[13px] text-body">${UI.dateShort(o.created_at)}</p><p class="text-[11.5px] text-faint tnum">${UI.timeShort(o.created_at)}</p></td>
        <td class="px-5 py-3.5 text-right"><span class="font-700 text-ink text-[14px] tnum">${fmt.money(o.total)}</span></td>
        <td class="px-5 py-3.5" data-stop>${statusDropdown(o)}</td>
        <td class="px-5 py-3.5 text-right"><span class="inline-flex items-center gap-1 text-[13px] font-600 text-muted group-hover:text-brand transition-colors">Ver ${ICON.chevRight({ cls: 'w-4 h-4' })}</span></td>
      </tr>`;
    }

    function cardHtml(o) {
      const pay = UI.payMeta(o.payment_method);
      return `<div data-row data-id="${o.id}" class="p-4 active:bg-canvas transition-colors">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[12px] font-bold shrink-0">${fmt.initials(o.customer_name)}</div>
            <div class="min-w-0"><p class="text-[14px] font-600 text-ink truncate">${o.customer_name}</p><p class="text-[11.5px] text-faint tnum">${o.id} · ${UI.relTime(o.created_at)}</p></div>
          </div>
          <p class="font-700 text-ink text-[15px] tnum shrink-0">${fmt.money(o.total)}</p>
        </div>
        <div class="flex items-center justify-between mt-3">
          <span class="inline-flex items-center gap-1.5 text-[12px] text-muted">${ICON[pay.icon]({ cls: 'w-4 h-4' })}${pay.label} · ${o.delivery_method.includes('domicilio') ? 'Envío' : 'Tienda'}</span>
          ${UI.statusPill(o.status)}
        </div>
      </div>`;
    }

    function wire(host, list) {
      const byId = (id) => orders.find((o) => o.id === id);
      host.querySelector('[data-search]')?.addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); render(); });
      host.querySelector('[data-search]')?.addEventListener('focus', (e) => { const v = e.target.value; e.target.value = ''; e.target.value = v; });
      host.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
      host.querySelectorAll('[data-row]').forEach((r) => r.addEventListener('click', (e) => {
        if (e.target.closest('[data-stop]')) return;
        const o = byId(r.dataset.id); if (o) detailDrawer(o);
      }));
      // status dropdowns
      host.querySelectorAll('[data-status-wrap]').forEach((w) => {
        const btn = w.querySelector('[data-status-btn]');
        const menu = w.querySelector('[data-status-menu]');
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          host.querySelectorAll('[data-status-menu]').forEach((m) => { if (m !== menu) m.classList.add('hidden'); });
          menu.classList.toggle('hidden');
        });
        menu.querySelectorAll('[data-set]').forEach((opt) => opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const o = byId(w.dataset.id); if (o) { o.status = opt.dataset.set; UI.toast('Estado actualizado a “' + UI.statusMeta(opt.dataset.set).label + '”'); render(); }
        }));
      });
      document.addEventListener('click', () => host.querySelectorAll('[data-status-menu]').forEach((m) => m.classList.add('hidden')), { once: true });
    }

    render();
  };
})();
