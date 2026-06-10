// G&L Admin — Dashboard
(function () {
  const ICON = window.ICON, UI = window.UI, fmt = window.fmt;
  const lc = (s) => (s || '').toLowerCase();
  const isPaid = (s) => ['completado'].includes(lc(s));

  function compute(orders, days) {
    const now = Date.now(), dayMs = 86400000;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const startMs = start.getTime() - (days - 1) * dayMs;
    const inRange = orders.filter((o) => new Date(o.created_at).getTime() >= startMs);
    const paid = inRange.filter((o) => isPaid(o.status));
    const revenue = paid.reduce((a, o) => a + o.total, 0);
    // daily buckets
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      buckets.push({ key: d.toISOString().slice(0, 10), label: d, value: 0 });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    paid.forEach((o) => { const k = new Date(o.created_at).toISOString().slice(0, 10); const i = idx.get(k); if (i != null) buckets[i].value += o.total; });
    // status counts
    const st = { completado: 0, pendientedepago: 0, cancelado: 0 };
    inRange.forEach((o) => { const k = lc(o.status); if (st[k] != null) st[k]++; });
    // top products
    const map = new Map();
    inRange.forEach((o) => o.cart_items.forEach((it) => { map.set(it.name, (map.get(it.name) || 0) + it.qty); }));
    const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    return { inRange, paid, revenue, buckets, st, top, count: inRange.length };
  }

  function barChart(buckets, days) {
    const max = Math.max(...buckets.map((b) => b.value), 1);
    const avg = buckets.reduce((a, b) => a + b.value, 0) / buckets.length;
    const bestIdx = buckets.reduce((bi, b, i, arr) => (b.value > arr[bi].value ? i : bi), 0);
    const showEvery = days <= 7 ? 1 : days <= 30 ? 5 : 12;
    const gridLines = [1, 0.66, 0.33, 0].map((f) => `<div class="flex items-center gap-2"><span class="eyebrow text-faint w-9 text-right tnum">${f === 0 ? '0' : '$' + Math.round((max * f) / 1000) + 'k'}</span><div class="flex-1 border-t border-dashed border-line"></div></div>`).join('');
    return `
      <div class="relative">
        <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pt-1 pb-7">${gridLines}</div>
        <div class="relative flex items-end gap-[3px] h-[200px] pl-12 pr-1">
          ${buckets.map((b, i) => {
            const h = Math.max(2, (b.value / max) * 100);
            const best = i === bestIdx && b.value > 0;
            return `<div class="group relative flex-1 flex flex-col justify-end h-full" data-bar>
              <div class="bar bar-fill w-full rounded-t-[4px]" style="height:${h}%;background:${best ? '#214FC7' : 'rgba(33,79,199,0.24)'}"></div>
              <div class="bar-tip absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10 whitespace-nowrap">
                <div class="bg-ink text-white text-[11px] font-600 px-2 py-1 rounded-lg shadow-float tnum">${fmt.money(b.value)}</div>
                <div class="w-2 h-2 bg-ink rotate-45 mx-auto -mt-1"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
        <div class="flex gap-[3px] pl-12 pr-1 mt-2">
          ${buckets.map((b, i) => `<div class="flex-1 text-center">${i % showEvery === 0 ? `<span class="eyebrow text-faint tnum">${b.label.toLocaleDateString('es-MX', { day: '2-digit', month: days > 7 ? 'short' : undefined }).replace('.', '')}</span>` : ''}</div>`).join('')}
        </div>
      </div>`;
  }

  function statusBlock(st, total) {
    const rows = [
      { k: 'completado', label: 'Completado', color: '#1E9E6A' },
      { k: 'pendientedepago', label: 'Pendiente de pago', color: '#C9821A' },
      { k: 'cancelado', label: 'Cancelado', color: '#D6453E' },
    ];
    const t = Math.max(total, 1);
    // donut
    let acc = 0;
    const R = 52, C = 2 * Math.PI * R;
    const segs = rows.map((r) => {
      const frac = st[r.k] / t;
      const seg = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${r.color}" stroke-width="16" stroke-dasharray="${(frac * C).toFixed(1)} ${C}" stroke-dashoffset="${(-acc * C).toFixed(1)}" transform="rotate(-90 70 70)" stroke-linecap="butt"/>`;
      acc += frac; return seg;
    }).join('');
    const completedPct = Math.round((st.completado / t) * 100);
    return `
      <div class="flex items-center gap-5">
        <div class="relative shrink-0">
          <svg viewBox="0 0 140 140" width="124" height="124">
            <circle cx="70" cy="70" r="${R}" fill="none" stroke="#EEEFF2" stroke-width="16"/>${segs}
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-display font-extrabold text-ink text-[24px] leading-none tnum">${completedPct}%</span>
            <span class="eyebrow text-muted mt-1">éxito</span>
          </div>
        </div>
        <div class="flex-1 space-y-3">
          ${rows.map((r) => `<div>
            <div class="flex items-center justify-between mb-1">
              <span class="flex items-center gap-2 text-[13px] font-500 text-body"><span class="w-2 h-2 rounded-full" style="background:${r.color}"></span>${r.label}</span>
              <span class="text-[13px] font-600 text-ink tnum">${st[r.k]}</span>
            </div>
          </div>`).join('')}
        </div>
      </div>`;
  }

  function recentOrders(orders) {
    const rows = orders.slice(0, 6);
    return rows.map((o) => `
      <a href="#/orders" data-nav class="flex items-center gap-3 px-2 -mx-2 h-[52px] rounded-xl2 hover:bg-canvas transition-colors">
        <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[12px] font-bold shrink-0">${fmt.initials(o.customer_name)}</div>
        <div class="min-w-0 flex-1">
          <p class="text-[13.5px] font-600 text-ink truncate">${o.customer_name}</p>
          <p class="text-[11.5px] text-faint tnum">${o.id} · ${UI.relTime(o.created_at)}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-[13.5px] font-700 text-ink tnum">${fmt.money(o.total)}</p>
        </div>
        <div class="shrink-0 w-[108px] flex justify-end">${UI.statusPill(o.status)}</div>
      </a>`).join('');
  }

  function lowStock(products) {
    const low = products.filter((p) => p.stock !== '∞' && Number(p.stock) > 0 && Number(p.stock) <= 10).length;
    const out = products.filter((p) => p.stock !== '∞' && Number(p.stock) <= 0).length;
    return { low, out };
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.dashboard = function (host) {
    let days = 7;
    const orders = window.DB.ORDERS, products = window.DB.PRODUCTS, subs = window.DB.SUBSCRIBERS;
    const inv = lowStock(products);

    function render() {
      const d = compute(orders, days);
      const todayKey = new Date().toISOString().slice(0, 10);
      const today = d.buckets.find((b) => b.key === todayKey)?.value || 0;
      const best = Math.max(...d.buckets.map((b) => b.value), 0);
      const avgDay = d.buckets.reduce((a, b) => a + b.value, 0) / d.buckets.length;
      const ticket = d.paid.length ? d.revenue / d.paid.length : 0;
      const sparkVals = d.buckets.map((b) => b.value);

      host.innerHTML = `
        <div class="view-in space-y-6">
          <!-- Header -->
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p class="eyebrow text-brand mb-1.5">Resumen ejecutivo</p>
              <h2 class="font-display font-extrabold text-ink text-[26px] md:text-[30px] leading-none tracking-tight">Hola, Gerencia 👋</h2>
              <p class="text-[14px] text-muted mt-2">Esto pasó en tu tienda en los últimos ${days} días.</p>
            </div>
            <div class="seg" data-range>
              ${[7, 30, 90].map((n) => `<button data-d="${n}" class="${n === days ? 'active' : ''}">${n} días</button>`).join('')}
            </div>
          </div>

          <!-- KPIs -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            ${UI.statCard({ eyebrow: 'Ingresos', value: fmt.money(d.revenue), icon: 'cash', accent: '#214FC7', delta: '+12.4%', deltaDir: 'up', foot: 'vs periodo previo' })}
            ${UI.statCard({ eyebrow: 'Órdenes', value: d.count, icon: 'orders', delta: '+8', deltaDir: 'up', foot: 'nuevas' })}
            ${UI.statCard({ eyebrow: 'Ticket promedio', value: fmt.money(ticket), icon: 'trendUp', delta: '+3.1%', deltaDir: 'up', foot: 'por pedido' })}
            ${UI.statCard({ eyebrow: 'Suscriptores', value: subs.length, icon: 'users', delta: '+5', deltaDir: 'up', foot: 'esta semana' })}
          </div>

          <!-- Chart + status -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div class="xl:col-span-2 bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
              <div class="flex items-start justify-between mb-5">
                <div>
                  <h3 class="font-display font-bold text-ink text-[16px]">Ingresos por día</h3>
                  <p class="text-[12.5px] text-muted mt-0.5">Pedidos completados · últimos ${days} días</p>
                </div>
                <div class="text-right">
                  <p class="eyebrow text-faint">Ventas hoy</p>
                  <p class="font-display font-extrabold text-brand text-[20px] leading-none mt-1 tnum">${fmt.money(today)}</p>
                </div>
              </div>
              ${barChart(d.buckets, days)}
              <div class="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-line">
                <div><p class="eyebrow text-faint mb-1">Promedio diario</p><p class="font-display font-bold text-ink text-[16px] tnum">${fmt.money(avgDay)}</p></div>
                <div><p class="eyebrow text-faint mb-1">Mejor día</p><p class="font-display font-bold text-ink text-[16px] tnum">${fmt.money(best)}</p></div>
                <div><p class="eyebrow text-faint mb-1">Pedidos pagados</p><p class="font-display font-bold text-ink text-[16px] tnum">${d.paid.length}</p></div>
              </div>
            </div>

            <div class="bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
              <h3 class="font-display font-bold text-ink text-[16px] mb-1">Estado de pedidos</h3>
              <p class="text-[12.5px] text-muted mb-5">${d.count} pedidos en el periodo</p>
              ${statusBlock(d.st, d.count)}
              <div class="mt-6 pt-5 border-t border-line flex items-center gap-3">
                <span class="w-9 h-9 rounded-[10px] bg-warn-tint text-warn flex items-center justify-center shrink-0">${ICON.box({ cls: 'w-[18px] h-[18px]' })}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-600 text-ink">${inv.low} con bajo stock · ${inv.out} agotados</p>
                  <p class="text-[11.5px] text-muted">Revisa tu inventario</p>
                </div>
                <a href="#/products" data-nav class="text-brand hover:text-brand-ink shrink-0">${ICON.chevRight({ cls: 'w-5 h-5' })}</a>
              </div>
            </div>
          </div>

          <!-- Recent + top + quick -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div class="xl:col-span-2 bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-display font-bold text-ink text-[16px]">Pedidos recientes</h3>
                <a href="#/orders" data-nav class="inline-flex items-center gap-1 text-[13px] font-600 text-brand hover:text-brand-ink">Ver todos ${ICON.chevRight({ cls: 'w-4 h-4' })}</a>
              </div>
              <div class="divide-y divide-line">${recentOrders(orders)}</div>
            </div>

            <div class="space-y-5">
              <div class="bg-paper rounded-3xl border border-line shadow-card p-5 md:p-6">
                <h3 class="font-display font-bold text-ink text-[16px] mb-4">Más vendidos</h3>
                <div class="space-y-3.5">
                  ${d.top.map((t, i) => `<div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-md bg-canvas border border-line flex items-center justify-center eyebrow text-muted tnum shrink-0">${i + 1}</span>
                    <p class="flex-1 min-w-0 text-[13.5px] font-500 text-body truncate">${t[0]}</p>
                    <span class="text-[12.5px] font-600 text-ink tnum shrink-0">${t[1]} uds</span>
                  </div>`).join('') || '<p class="text-[13px] text-muted">Sin datos en el periodo.</p>'}
                </div>
              </div>
              <div class="rounded-3xl p-5 md:p-6 bg-ink text-white relative overflow-hidden">
                <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl" style="background:rgba(33,79,199,0.35)"></div>
                <p class="eyebrow text-white/45 relative">Acciones rápidas</p>
                <div class="mt-4 space-y-2 relative">
                  <a href="#/products" data-nav class="flex items-center gap-3 px-3 h-11 rounded-xl2 bg-white/[0.07] hover:bg-white/[0.12] transition-colors text-[14px] font-500">
                    <span class="text-brand-tint">${ICON.plus({ cls: 'w-[18px] h-[18px]' })}</span> Agregar producto
                    <span class="ml-auto text-white/30">${ICON.chevRight({ cls: 'w-4 h-4' })}</span>
                  </a>
                  <a href="#/coupons" data-nav class="flex items-center gap-3 px-3 h-11 rounded-xl2 bg-white/[0.07] hover:bg-white/[0.12] transition-colors text-[14px] font-500">
                    <span class="text-brand-tint">${ICON.coupon({ cls: 'w-[18px] h-[18px]' })}</span> Crear cupón
                    <span class="ml-auto text-white/30">${ICON.chevRight({ cls: 'w-4 h-4' })}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>`;

      host.querySelectorAll('[data-range] button').forEach((b) => b.addEventListener('click', () => { days = Number(b.dataset.d); render(); }));
      wireNav(host);
    }
    render();
  };

  function wireNav(host) {
    host.querySelectorAll('[data-nav]').forEach((a) => {
      // hash navigation handled natively; nothing extra needed
    });
  }
})();
