import { BRAND } from '../app/config.js'
import { getSearchQuery } from '../app/store.js'

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

export function layoutAdmin({ contentHtml, state }) {
  const authed = Boolean(state?.isAdminAuthed)
  const currentPath = window.location.pathname || ''

  if (!authed) {
    return `<div class="min-h-dvh flex items-center justify-center bg-[#F8F9FA] text-[#191C1D]">
      ${contentHtml}
    </div>`
  }

  const links = [
    { path: '/admin/dashboard', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>', label: 'Dashboard' },
    { path: '/admin/orders', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>', label: 'Órdenes' },
    { path: '/admin/products', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>', label: 'Productos' },
    { path: '/admin/categories', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>', label: 'Categorías' },
    { path: '/admin/coupons', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>', label: 'Cupones' },
    { path: '/admin/newsletter', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>', label: 'Newsletter' },
  ]

  const navHtml = links.map(l => {
    const active = currentPath === l.path || (currentPath === '/admin' && l.path === '/admin/dashboard')
    return `
      <a href="${l.path}" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-brand/10 text-brand font-semibold relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-brand before:rounded-r-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${l.icon}</svg>
        ${l.label}
      </a>
    `
  }).join('')

  return `
    <div class="min-h-screen bg-[#F8F9FA] text-[#191C1D] flex flex-col md:flex-row font-inter">

      <!-- Mobile Header -->
      <header class="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 layer-header">
        <a href="/" class="flex items-center gap-2 group">
          <span class="text-xl font-bold font-manrope">G&L</span>
          <span class="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded bg-brand text-white font-bold">Admin</span>
        </a>
        <button id="admin-mobile-menu" class="p-2 text-gray-500 hover:text-gray-900">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </header>

      <!-- Sidebar Desktop / Drawer Mobile -->
      <aside id="admin-sidebar" class="fixed inset-y-0 left-0 layer-admin-sidebar w-64 bg-white border-r border-gray-100 transition-transform -translate-x-full md:translate-x-0 md:static md:flex md:flex-col">
        <div class="p-6 flex items-center justify-between">
          <a href="/" class="flex items-center gap-2 group">
             <span class="text-2xl font-bold font-manrope">G&L</span>
             <span class="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded bg-brand text-white font-bold">Admin</span>
          </a>
          <button id="close-admin-sidebar" class="md:hidden p-2 text-gray-500">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div class="mb-6 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menú Principal</div>
          ${navHtml}
        </nav>

        <div class="p-4 border-t border-gray-100">
          <a href="/" class="flex items-center gap-3 w-full px-4 py-3 mb-2 text-sm font-medium text-gray-500 hover:text-brand hover:bg-brand/5 rounded-xl transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Ver Tienda
          </a>
          <button id="admin-logout" class="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <!-- Overlay Mobile -->
      <div id="admin-sidebar-overlay" class="fixed inset-0 bg-black/50 layer-admin-overlay hidden backdrop-blur-sm animate-fade-in"></div>

      <!-- Main Content -->
      <main class="flex-1 min-h-[calc(100vh-64px)] md:min-h-screen relative overflow-x-hidden">
        <div class="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          ${contentHtml}
        </div>
      </main>

    </div>
  `
}
