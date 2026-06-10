// G&L Admin — shared UI helpers
(function () {
  const ICON = window.ICON;

  // Order status meta
  const STATUS = {
    completado:       { label: 'Completado', cls: 'text-ok bg-ok-tint', dot: '#1E9E6A' },
    pendientedepago:  { label: 'Pendiente',  cls: 'text-warn bg-warn-tint', dot: '#C9821A' },
    cancelado:        { label: 'Cancelado',  cls: 'text-bad bg-bad-tint', dot: '#D6453E' },
  };
  const statusMeta = (s) => STATUS[(s || '').toLowerCase()] || { label: s || '—', cls: 'text-muted bg-line', dot: '#A4A8B2' };

  function statusPill(s) {
    const m = statusMeta(s);
    return `<span class="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[11px] font-600 ${m.cls}">
      <span class="w-1.5 h-1.5 rounded-full" style="background:${m.dot}"></span>${m.label}</span>`;
  }

  // Payment meta
  const PAY = {
    tarjeta:        { label: 'Tarjeta', icon: 'card' },
    transferencia:  { label: 'Transferencia', icon: 'cash' },
    efectivo:       { label: 'Efectivo', icon: 'cash' },
    whatsapp:       { label: 'WhatsApp', icon: 'whatsapp' },
  };
  const payMeta = (p) => {
    const k = (p || '').toLowerCase();
    return PAY[k] || { label: p || 'Sin definir', icon: 'card' };
  };

  // KPI / Stat card
  function statCard({ eyebrow, value, icon, delta, deltaDir, foot, accent }) {
    const dColor = deltaDir === 'down' ? 'text-bad' : deltaDir === 'flat' ? 'text-muted' : 'text-ok';
    const dIcon = deltaDir === 'down' ? ICON.trendDown({ cls: 'w-3.5 h-3.5' }) : deltaDir === 'flat' ? '' : ICON.trendUp({ cls: 'w-3.5 h-3.5' });
    return `
      <div class="bg-paper rounded-xl2 border border-line p-5 shadow-card">
        <div class="flex items-start justify-between">
          <p class="eyebrow text-muted">${eyebrow}</p>
          <span class="w-8 h-8 -mt-1 -mr-1 rounded-[9px] flex items-center justify-center" style="background:${accent || '#F3F6FD'};color:${accent ? '#fff' : '#214FC7'}">${ICON[icon]({ cls: 'w-[17px] h-[17px]' })}</span>
        </div>
        <p class="font-display font-extrabold text-ink text-[28px] leading-none tracking-tight mt-3 tnum">${value}</p>
        <div class="flex items-center gap-2 mt-3">
          ${delta ? `<span class="inline-flex items-center gap-1 ${dColor} text-[12.5px] font-600 tnum">${dIcon}${delta}</span>` : ''}
          ${foot ? `<span class="text-[12.5px] text-faint">${foot}</span>` : ''}
        </div>
      </div>`;
  }

  // Empty state
  function empty({ icon, title, sub, action }) {
    return `
      <div class="text-center py-16 px-6">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-canvas border border-line flex items-center justify-center text-faint mb-4">${ICON[icon]({ cls: 'w-7 h-7' })}</div>
        <p class="font-display font-bold text-ink text-[15px]">${title}</p>
        <p class="text-[13.5px] text-muted mt-1 max-w-xs mx-auto">${sub || ''}</p>
        ${action || ''}
      </div>`;
  }

  // Toast
  let toastWrap;
  function toast(msg, type = 'success') {
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2';
      document.body.appendChild(toastWrap);
    }
    const colors = { success: '#1E9E6A', error: '#D6453E', info: '#214FC7' };
    const ic = type === 'error' ? ICON.info : type === 'info' ? ICON.info : ICON.check;
    const el = document.createElement('div');
    el.className = 'anim-pop flex items-center gap-2.5 bg-ink text-white pl-3.5 pr-4 py-2.5 rounded-xl2 shadow-pop text-[13.5px] font-500';
    el.innerHTML = `<span style="color:${colors[type]}">${ic({ cls: 'w-[18px] h-[18px]' })}</span>${msg}`;
    toastWrap.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(() => el.remove(), 320); }, 2600);
  }

  // Modal / drawer host
  function openOverlay(html, { side } = {}) {
    const host = document.createElement('div');
    host.className = 'fixed inset-0 z-[120]';
    host.innerHTML = `
      <div data-ov-bg class="absolute inset-0 anim-fade" style="background:rgba(21,23,28,0.45)"></div>
      <div data-ov-panel class="absolute ${side === 'right'
        ? 'inset-y-0 right-0 w-full max-w-[460px] anim-drawer'
        : 'inset-0 flex items-center justify-center p-4'}">${side === 'right' ? html : `<div class="anim-pop w-full max-w-md">${html}</div>`}</div>`;
    document.body.appendChild(host);
    document.body.style.overflow = 'hidden';
    const close = () => { host.style.opacity = '0'; host.style.transition = 'opacity .2s'; setTimeout(() => { host.remove(); document.body.style.overflow = ''; }, 180); };
    host.querySelector('[data-ov-bg]').addEventListener('click', close);
    host.querySelectorAll('[data-ov-close]').forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    return { host, close };
  }

  function toggle(on) {
    return `<span class="gl-toggle ${on ? 'on' : ''}" role="switch" aria-checked="${on}"></span>`;
  }

  // small inline sparkline (svg) from array of values
  function sparkline(vals, color = '#214FC7', w = 120, h = 34) {
    const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
    const rng = max - min || 1;
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - ((v - min) / rng) * (h - 4) - 2]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = d + ` L${w} ${h} L0 ${h} Z`;
    const id = 'sg' + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" class="overflow-visible">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.18"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function relTime(iso) {
    const d = new Date(iso), now = Date.now();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    const days = Math.floor(diff / 86400);
    if (days === 1) return 'ayer';
    if (days < 7) return `hace ${days} días`;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }
  function dateShort(iso) { return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function timeShort(iso) { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }

  window.UI = { statusMeta, statusPill, payMeta, statCard, empty, toast, openOverlay, toggle, sparkline, relTime, dateShort, timeShort };
})();
