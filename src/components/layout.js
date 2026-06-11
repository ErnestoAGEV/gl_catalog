import { BRAND } from '../utils/config.js'
import { getSearchQuery } from '../store/index.js'

function container(children, theme = 'dark') {
  const isDark = theme === 'dark'
  return `<div class="min-h-dvh overflow-x-hidden ${isDark ? 'bg-black text-white' : 'bg-paper text-ink'}">
    ${children}
  </div>`
}

export function layoutPublic({ contentHtml, state, showSearch = false, noPaddingTop = false, hideHeaderOnMobile = false, fullWidth = false, forceLight = false, hideHeader = false }) {
  const count = (state.cart || []).reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
  const theme = forceLight ? 'light' : (state.theme || 'dark')
  const isDark = theme === 'dark'
  const currentPath = window.location.pathname || '/'

  const marqueeItems = `★ Envío gratis +$${BRAND.freeShippingMin} MXN — Nueva temporada 2026 — Cierre por WhatsApp en minutos — 2 tiendas físicas en Colima — Use WELCOME10 · 10% off 1ª compra — `

  const bottomMargin = hideHeader ? '' : 'mb-16 md:mb-0'
  const mainClasses = fullWidth
    ? `w-full ${noPaddingTop ? 'pt-0' : 'pt-3 md:pt-5'} pb-24 md:pb-24 overflow-x-hidden ${bottomMargin}`
    : `mx-auto w-full max-w-screen-xl px-3 md:px-4 ${noPaddingTop ? 'pt-0' : 'pt-3 md:pt-5'} pb-24 md:pb-24 overflow-x-hidden ${bottomMargin}`

  return container(`
    <!-- Marquee Announcement Bar -->
    <div class="bg-ink text-paper border-b border-white/10 overflow-hidden ${hideHeader ? 'hidden' : (hideHeaderOnMobile ? 'hidden md:block' : '')}">
      <div class="marquee-track flex whitespace-nowrap py-2.5">
        <span class="font-mono text-[11px] tracking-[0.22em] uppercase">${marqueeItems}</span>
        <span class="font-mono text-[11px] tracking-[0.22em] uppercase">${marqueeItems}</span>
        <span class="font-mono text-[11px] tracking-[0.22em] uppercase">${marqueeItems}</span>
        <span class="font-mono text-[11px] tracking-[0.22em] uppercase">${marqueeItems}</span>
      </div>
    </div>

    <header class="sticky top-0 z-40 bg-paper/95 backdrop-blur-lg border-b border-ink/10 ${hideHeader ? 'hidden' : (hideHeaderOnMobile ? 'hidden md:block' : '')}">
      <div class="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 lg:px-10 py-3">
        <!-- Logo -->
        <a href="/" class="flex items-center hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="${BRAND.name}" class="h-11 w-auto object-contain" />
        </a>

        <!-- Nav (desktop) -->
        <nav class="hidden md:flex items-center gap-8">
          <a class="text-[14px] font-medium text-ink/70 hover:text-ink transition-colors ul-link" href="/catalog">Tienda</a>
          <a class="text-[14px] font-medium text-ink/70 hover:text-ink transition-colors ul-link" href="/#sucursales">Sucursales</a>
          <a class="text-[14px] font-medium text-ink/70 hover:text-ink transition-colors ul-link" href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener noreferrer">Contacto</a>
        </nav>

        <!-- Right: Search + Bolsa -->
        <div class="hidden md:flex items-center gap-3">
          <a href="/catalog" class="group flex items-center gap-2 h-10 px-4 rounded-full bg-fog text-ink text-[13px] font-medium hover:bg-ink hover:text-paper transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Buscar
          </a>
          <a href="/cart" class="relative group flex items-center gap-2 h-10 px-4 rounded-full ${currentPath.startsWith('/cart') ? 'bg-brand' : 'bg-ink'} text-paper text-[13px] font-medium hover:bg-brand transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            Bolsa
            ${count > 0 ? `<span class="cart-count-badge absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${currentPath.startsWith('/cart') ? 'bg-paper text-brand' : 'bg-brand text-paper'} text-[10px] font-bold">${count}</span>` : ''}
          </a>
        </div>
      </div>
    </header>

    <main class="${mainClasses}" id="main-content">
      ${contentHtml}
    </main>

    <!-- Footer -->
    <footer class="bg-ink text-paper relative overflow-hidden">
      <!-- Footer Marquee -->
      <div class="py-4 md:py-6 border-b border-paper/10 overflow-hidden">
        <div class="marquee-track whitespace-nowrap" style="width:max-content;display:flex">
          <span class="font-heading font-[800] text-[40px] md:text-[80px] leading-none tracking-[-0.04em] shrink-0">G&L&nbsp;<span class="text-brand">→</span>&nbsp;TU&nbsp;FIT,&nbsp;PERFECTO&nbsp;&nbsp;<span class="text-brand">·</span>&nbsp;&nbsp;SHOP&nbsp;<span class="text-brand">·</span>&nbsp;LOOKBOOK&nbsp;<span class="text-brand">·</span>&nbsp;WHATSAPP&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span class="font-heading font-[800] text-[40px] md:text-[80px] leading-none tracking-[-0.04em] shrink-0">G&L&nbsp;<span class="text-brand">→</span>&nbsp;TU&nbsp;FIT,&nbsp;PERFECTO&nbsp;&nbsp;<span class="text-brand">·</span>&nbsp;&nbsp;SHOP&nbsp;<span class="text-brand">·</span>&nbsp;LOOKBOOK&nbsp;<span class="text-brand">·</span>&nbsp;WHATSAPP&nbsp;&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>

      <!-- Footer Content -->
      <div class="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 md:pt-16 pb-12">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div class="md:col-span-6">
            <p class="font-mono text-[12px] tracking-[0.24em] uppercase opacity-60 mb-4">Tu fit, perfecto. Desde 1995.</p>
            <p class="text-[15px] text-paper/70 max-w-md leading-relaxed">Boutique de moda masculina en Colima, México. Las mejores marcas, curadas a mano, al mejor precio. Envío a todo el país y atención por WhatsApp.</p>
          </div>
          <div class="md:col-span-2">
            <h4 class="font-mono text-[11px] tracking-[0.24em] uppercase opacity-60 mb-4">Tienda</h4>
            <ul class="space-y-2.5 text-[14px]">
              <li><a href="/categoria/Camisas" class="ul-link opacity-80 hover:opacity-100">Camisas</a></li>
              <li><a href="/categoria/Polos" class="ul-link opacity-80 hover:opacity-100">Polos</a></li>
              <li><a href="/categoria/Pantalones" class="ul-link opacity-80 hover:opacity-100">Jeans</a></li>
              <li><a href="/categoria/Perfumes" class="ul-link opacity-80 hover:opacity-100">Perfumes</a></li>
            </ul>
          </div>
          <div class="md:col-span-2">
            <h4 class="font-mono text-[11px] tracking-[0.24em] uppercase opacity-60 mb-4">Soporte</h4>
            <ul class="space-y-2.5 text-[14px]">
              <li><a href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener noreferrer" class="ul-link opacity-80 hover:opacity-100">WhatsApp</a></li>
              <li><a href="#" class="ul-link opacity-80 hover:opacity-100">Envíos</a></li>
              <li><a href="#" class="ul-link opacity-80 hover:opacity-100">Cambios</a></li>
              <li><a href="#" class="ul-link opacity-80 hover:opacity-100">FAQ</a></li>
            </ul>
          </div>
          <div class="md:col-span-2">
            <h4 class="font-mono text-[11px] tracking-[0.24em] uppercase opacity-60 mb-4">Síguenos</h4>
            <div class="flex items-center gap-3">
              <a href="https://www.instagram.com/glboutiquecol/" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full border border-paper/20 flex items-center justify-center hover:bg-paper hover:text-ink transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full border border-paper/20 flex items-center justify-center hover:bg-brand hover:border-brand transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Bottom row -->
        <div class="mt-16 pt-8 border-t border-paper/10 flex flex-col md:flex-row justify-between items-center gap-2">
          <span class="font-mono text-[12px] opacity-60">© 2026 G&L · Colima, México</span>
          <span class="font-mono text-[12px] opacity-60">Curado en Colima desde 1995</span>
        </div>
      </div>
    </footer>

    <!-- Mobile Bottom Navigation -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper/90 backdrop-blur-xl border-t border-ink/10 pb-safe">
      <div class="flex items-center justify-around h-16">
        <a href="/" class="flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors ${currentPath === '/' ? 'text-brand' : 'text-ink/40 hover:text-ink/60'}">
          <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          Inicio
        </a>
        <a href="/catalog" class="flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors ${currentPath.startsWith('/catalog') || currentPath.startsWith('/categoria') ? 'text-brand' : 'text-ink/40 hover:text-ink/60'}">
          <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          Tienda
        </a>
        <a href="/cart" class="relative flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors ${currentPath.startsWith('/cart') ? 'text-brand' : 'text-ink/40 hover:text-ink/60'}">
          <div class="relative">
             <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
             ${count > 0 ? `<span class="cart-count-badge absolute -top-1 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-brand text-[9px] font-bold text-paper">${count}</span>` : ''}
          </div>
          Bolsa
        </a>
      </div>
    </nav>
  `, theme)
}

export function layoutAdmin({ title, contentHtml, state }) {
  const authed = Boolean(state?.isAdminAuthed)
  const currentPath = window.location.pathname || ''

  if (!authed) {
    return `<div class="min-h-dvh bg-canvas text-body">${contentHtml}</div>`
  }

  const NAV = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', group: 'Panel' },
    { path: '/admin/orders', icon: 'orders', label: 'Órdenes', group: 'Operación' },
    { path: '/admin/products', icon: 'products', label: 'Productos', group: 'Operación' },
    { path: '/admin/categories', icon: 'tag', label: 'Categorías', group: 'Catálogo' },
    { path: '/admin/coupons', icon: 'coupon', label: 'Cupones', group: 'Catálogo' },
    { path: '/admin/newsletter', icon: 'mail', label: 'Newsletter', group: 'Clientes' },
    { path: '/admin/clientes', icon: 'users', label: 'Clientes', group: 'Clientes' },
    { path: '/admin/reportes', icon: 'chart', label: 'Reportes', group: 'Análisis' },
    { path: '/admin/banners', icon: 'image', label: 'Contenido', group: 'Sitio' },
  ]

  const TITLES = {
    '/admin/dashboard': 'Dashboard',
    '/admin/orders': 'Órdenes',
    '/admin/products': 'Productos',
    '/admin/categories': 'Categorías',
    '/admin/coupons': 'Cupones',
    '/admin/newsletter': 'Newsletter',
    '/admin/clientes': 'Clientes',
    '/admin/reportes': 'Reportes',
    '/admin/banners': 'Contenido',
  }

  const I = (name, cls = 'w-[18px] h-[18px]') => {
    const paths = {
      dashboard: '<path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z"/>',
      orders: '<path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4H6Z"/><path d="M4 6h16"/><path d="M16 10a4 4 0 0 1-8 0"/>',
      products: '<path d="M12.89 1.45 21 6v12l-8.11 4.55a2 2 0 0 1-1.78 0L3 18V6l8.11-4.55a2 2 0 0 1 1.78 0Z"/><path d="m3.3 6.5 8.7 5 8.7-5"/><path d="M12 22V11.5"/>',
      tag: '<path d="M3 7v5.2a2 2 0 0 0 .6 1.4l7.8 7.8a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8L12.4 5.6A2 2 0 0 0 11 5H6a3 3 0 0 0-3 2Z"/><circle cx="7.5" cy="9.5" r="1.4"/>',
      coupon: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 6v2m0 3v2m0 3v2" stroke-dasharray="0.1 3.6"/>',
      mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 7.9 5.3a2 2 0 0 0 2.2 0L21 7"/>',
      store: '<path d="M3 9 4.5 4h15L21 9M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M4 9h16M9 20v-6h6v6"/>',
      logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
      menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      close: '<path d="M18 6 6 18M6 6l12 12"/>',
      bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
      users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 14a5 5 0 0 1 5 5"/><circle cx="17.5" cy="7.5" r="2.5"/>',
      chart: '<path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 5-6"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    }
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${cls}">${paths[name] || ''}</svg>`
  }

  // Build grouped nav
  const groups = []
  NAV.forEach(n => {
    let g = groups.find(x => x.name === n.group)
    if (!g) { g = { name: n.group, items: [] }; groups.push(g) }
    g.items.push(n)
  })

  const navHtml = groups.map(g => `
    <div class="px-3 mb-1 mt-5 first:mt-0">
      <p class="eyebrow text-white/35 px-3 mb-2">${g.name}</p>
      <div class="space-y-0.5">
        ${g.items.map(n => {
          const on = currentPath === n.path || (currentPath === '/admin' && n.path === '/admin/dashboard')
          return `<a href="${n.path}" class="admin-nav-link ${on ? 'active' : ''} group flex items-center gap-3 px-3 h-10 rounded-[11px] text-[14px] ${on ? 'font-semibold' : 'font-medium'} transition-colors ${on ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.06]'}">
            <span class="admin-rail"></span>
            <span class="${on ? 'text-white' : 'text-white/45 group-hover:text-white/80'} transition-colors">${I(n.icon)}</span>
            ${n.label}
          </a>`
        }).join('')}
      </div>
    </div>`).join('')

  const sidebarContent = `
    <div class="flex flex-col h-full">
      <div class="px-6 pt-6 pb-5">
        <a href="/admin/dashboard" class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-[10px] bg-white flex items-center justify-center">
            <span class="font-display font-extrabold text-ink text-[15px] tracking-tight">G&L</span>
          </div>
          <div class="leading-tight">
            <p class="font-display font-bold text-white text-[14.5px] tracking-tight whitespace-nowrap">G&L Boutique</p>
            <p class="eyebrow mt-1 whitespace-nowrap" style="color:#8CA2DC">Panel admin</p>
          </div>
        </a>
      </div>
      <nav class="flex-1 overflow-y-auto adm-scroll-thin pb-4">${navHtml}</nav>
      <div class="px-4 pb-5 pt-3 mt-auto border-t border-white/[0.07]">
        <a href="/" class="flex items-center gap-3 px-3 h-10 rounded-[11px] text-[14px] font-medium text-white/55 hover:text-white hover:bg-white/[0.06] transition-colors">
          <span class="text-white/45">${I('store')}</span> Ver tienda
        </a>
        <div class="flex items-center gap-3 px-3 mt-3 pt-3 border-t border-white/[0.07]">
          <div class="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-[12px] font-bold">GL</div>
          <div class="min-w-0 flex-1 leading-tight">
            <p class="text-[13px] font-semibold text-white truncate">Gerencia</p>
            <p class="text-[11px] text-white/40 truncate">admin@glboutique.mx</p>
          </div>
          <button id="admin-logout" title="Cerrar sesión" class="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">${I('logout', 'w-[17px] h-[17px]')}</button>
        </div>
      </div>
    </div>`

  const pageTitle = TITLES[currentPath] || TITLES['/admin/dashboard'] || title || 'Dashboard'
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  return `
    <div class="flex min-h-screen">
      <!-- Sidebar desktop (fixed) -->
      <aside class="hidden lg:flex w-[264px] shrink-0 bg-ink flex-col fixed inset-y-0 left-0 z-30">${sidebarContent}</aside>

      <!-- Sidebar mobile (drawer) -->
      <aside id="admin-sidebar" class="lg:hidden fixed inset-y-0 left-0 layer-admin-sidebar w-[272px] bg-ink flex flex-col transition-transform -translate-x-full z-50">${sidebarContent}</aside>
      <div id="admin-sidebar-overlay" class="fixed inset-0 bg-ink/50 backdrop-blur-sm layer-admin-overlay hidden z-40"></div>

      <!-- Main -->
      <div class="flex-1 lg:ml-[264px] min-w-0 flex flex-col">
        <!-- Topbar -->
        <header class="sticky top-0 z-20 backdrop-blur-md border-b border-line" style="background:rgba(245,246,248,0.85)">
          <div class="h-16 px-4 md:px-8 flex items-center gap-4">
            <button id="admin-mobile-menu" class="lg:hidden -ml-1 p-2 rounded-lg text-body hover:bg-line">${I('menu', 'w-5 h-5')}</button>
            <div class="min-w-0">
              <h1 class="font-display font-bold text-ink text-[17px] md:text-[19px] tracking-tight leading-none truncate">${pageTitle}</h1>
            </div>
            <div class="flex-1"></div>
            <div class="hidden md:flex items-center gap-2 text-muted text-[12.5px] mr-1">
              ${I('calendar', 'w-4 h-4 text-faint')}<span class="capitalize">${today}</span>
            </div>
            <div class="relative">
              <button id="admin-bell" class="relative w-9 h-9 rounded-[10px] border border-line bg-paper flex items-center justify-center text-muted hover:text-ink hover:border-line-strong transition-colors">
                ${I('bell', 'w-[18px] h-[18px]')}
                <span id="admin-bell-badge" class="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand ring-2 ring-paper hidden"></span>
              </button>
              <div id="admin-bell-panel" class="hidden absolute right-0 top-[calc(100%+8px)] w-[340px] max-h-[420px] bg-paper rounded-2xl border border-line shadow-pop overflow-hidden z-50">
                <div class="flex items-center justify-between px-4 py-3 border-b border-line">
                  <h3 class="text-[14px] font-bold text-ink">Notificaciones</h3>
                  <button id="admin-bell-read-all" class="text-[12px] font-semibold text-brand hover:text-brand/80 transition-colors">Marcar leídas</button>
                </div>
                <div id="admin-bell-list" class="overflow-y-auto adm-scroll-thin max-h-[340px]"></div>
              </div>
            </div>
          </div>
        </header>
        <main class="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1320px] w-full mx-auto">
          ${contentHtml}
        </main>
      </div>
    </div>
  `
}
