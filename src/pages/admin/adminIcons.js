const S = (p, cls = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${cls}">${p}</svg>`

export const ICON = {
  dashboard: (c) => S('<path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z"/>', c),
  orders: (c) => S('<path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4H6Z"/><path d="M4 6h16"/><path d="M16 10a4 4 0 0 1-8 0"/>', c),
  products: (c) => S('<path d="M12.89 1.45 21 6v12l-8.11 4.55a2 2 0 0 1-1.78 0L3 18V6l8.11-4.55a2 2 0 0 1 1.78 0Z"/><path d="m3.3 6.5 8.7 5 8.7-5"/><path d="M12 22V11.5"/>', c),
  tag: (c) => S('<path d="M3 7v5.2a2 2 0 0 0 .6 1.4l7.8 7.8a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8L12.4 5.6A2 2 0 0 0 11 5H6a3 3 0 0 0-3 2Z"/><circle cx="7.5" cy="9.5" r="1.4"/>', c),
  coupon: (c) => S('<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 6v2m0 3v2m0 3v2" stroke-dasharray="0.1 3.6"/>', c),
  mail: (c) => S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 7.9 5.3a2 2 0 0 0 2.2 0L21 7"/>', c),
  plus: (c) => S('<path d="M12 5v14M5 12h14"/>', c),
  search: (c) => S('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', c),
  close: (c) => S('<path d="M18 6 6 18M6 6l12 12"/>', c),
  chevDown: (c) => S('<path d="m6 9 6 6 6-6"/>', c),
  chevRight: (c) => S('<path d="m9 6 6 6-6 6"/>', c),
  chevUp: (c) => S('<path d="m6 15 6-6 6 6"/>', c),
  edit: (c) => S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>', c),
  trash: (c) => S('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0-.7 13a2 2 0 0 1-2 1.9H7.7a2 2 0 0 1-2-1.9L5 6"/>', c),
  logout: (c) => S('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>', c),
  store: (c) => S('<path d="M3 9 4.5 4h15L21 9M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M4 9h16M9 20v-6h6v6"/>', c),
  bell: (c) => S('<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>', c),
  cash: (c) => S('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>', c),
  trendUp: (c) => S('<path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/>', c),
  trendDown: (c) => S('<path d="m3 7 6 6 4-4 8 8"/><path d="M17 17h4v-4"/>', c),
  box: (c) => S('<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>', c),
  users: (c) => S('<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 14a5 5 0 0 1 5 5"/><circle cx="17.5" cy="7.5" r="2.5"/>', c),
  calendar: (c) => S('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>', c),
  menu: (c) => S('<path d="M4 6h16M4 12h16M4 18h16"/>', c),
  check: (c) => S('<path d="M20 6 9 17l-5-5"/>', c),
  info: (c) => S('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>', c),
  grid: (c) => S('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', c),
  list: (c) => S('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', c),
  eye: (c) => S('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', c),
  whatsapp: (c) => S('<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 20.5l1.5-5.7A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.5 9.5c0 3 2 5 5 5.5l1-1.5 2 .8a4.5 4.5 0 0 1-7-3.3l.8-2 1.5 1Z" stroke-width="1.3"/>', c),
  print: (c) => S('<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z"/>', c),
  copy: (c) => S('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"/>', c),
  filter: (c) => S('<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/>', c),
  eyeOff: (c) => S('<path d="M9.9 5.1A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 3.6M6 6.5A16 16 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 3.4-.7M3 3l18 18"/>', c),
  sparkle: (c) => S('<path d="M12 3l1.6 4.8L18 9.4l-4.4 1.6L12 16l-1.6-5L6 9.4l4.4-1.6L12 3Z"/>', c),
  arrowUpR: (c) => S('<path d="M7 17 17 7M8 7h9v9"/>', c),
  map: (c) => S('<path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="2.6"/>', c),
  truck: (c) => S('<path d="M3 6h11v9H3zM14 9h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>', c),
  clock: (c) => S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', c),
  card: (c) => S('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', c),
}

export function statusPill(status) {
  const map = {
    completado: { label: 'Completado', cls: 'text-ok bg-ok-tint', dot: '#1E9E6A' },
    pendientedepago: { label: 'Pendiente', cls: 'text-warn bg-warn-tint', dot: '#C9821A' },
    cancelado: { label: 'Cancelado', cls: 'text-bad bg-bad-tint', dot: '#D6453E' },
  }
  const m = map[(status || '').toLowerCase()] || { label: status || '-', cls: 'text-muted bg-line', dot: '#A4A8B2' }
  return `<span class="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[11px] font-semibold ${m.cls}">
    <span class="w-1.5 h-1.5 rounded-full" style="background:${m.dot}"></span>${m.label}</span>`
}

export function statCard({ eyebrow, value, icon, delta, deltaDir, foot, accent }) {
  const dColor = deltaDir === 'down' ? 'text-bad' : deltaDir === 'flat' ? 'text-muted' : 'text-ok'
  const dIcon = deltaDir === 'down' ? ICON.trendDown('w-3.5 h-3.5') : deltaDir === 'flat' ? '' : ICON.trendUp('w-3.5 h-3.5')
  return `
    <div class="bg-paper rounded-xl2 border border-line p-5 shadow-card">
      <div class="flex items-start justify-between">
        <p class="eyebrow text-muted">${eyebrow}</p>
        <span class="w-8 h-8 -mt-1 -mr-1 rounded-[9px] flex items-center justify-center" style="background:${accent || 'var(--color-brand-tint-2)'};color:${accent ? '#fff' : 'var(--color-brand)'}">
          ${ICON[icon]('w-[17px] h-[17px]')}
        </span>
      </div>
      <p class="font-display font-extrabold text-ink text-[28px] leading-none tracking-tight mt-3 tnum">${value}</p>
      <div class="flex items-center gap-2 mt-3">
        ${delta ? `<span class="inline-flex items-center gap-1 ${dColor} text-[12.5px] font-semibold tnum">${dIcon}${delta}</span>` : ''}
        ${foot ? `<span class="text-[12.5px] text-faint">${foot}</span>` : ''}
      </div>
    </div>`
}
