// G&L Admin — app shell + router
(function () {
  const ICON = window.ICON;

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', group: 'Panel' },
    { id: 'orders', label: 'Órdenes', icon: 'orders', group: 'Operación' },
    { id: 'products', label: 'Productos', icon: 'products', group: 'Operación' },
    { id: 'categories', label: 'Categorías', icon: 'tag', group: 'Catálogo' },
    { id: 'coupons', label: 'Cupones', icon: 'coupon', group: 'Catálogo' },
    { id: 'newsletter', label: 'Newsletter', icon: 'mail', group: 'Clientes' },
  ];
  const TITLES = {
    dashboard: ['Dashboard', 'Resumen del negocio'],
    orders: ['Órdenes', 'Pedidos de clientes'],
    products: ['Productos', 'Catálogo de la tienda'],
    categories: ['Categorías', 'Organiza tu catálogo'],
    coupons: ['Cupones', 'Códigos de descuento'],
    newsletter: ['Newsletter', 'Clientes suscritos'],
  };

  const app = document.getElementById('app');
  let current = null;

  function sidebar(active) {
    const groups = [];
    NAV.forEach((n) => {
      let g = groups.find((x) => x.name === n.group);
      if (!g) { g = { name: n.group, items: [] }; groups.push(g); }
      g.items.push(n);
    });
    const navHtml = groups.map((g) => `
      <div class="px-3 mb-1 mt-5 first:mt-0">
        <p class="eyebrow text-white/35 px-3 mb-2">${g.name}</p>
        <div class="space-y-0.5">
          ${g.items.map((n) => {
            const on = n.id === active;
            return `<a href="#/${n.id}" data-nav class="nav-link ${on ? 'active' : ''} group flex items-center gap-3 px-3 h-10 rounded-[11px] text-[14px] font-${on ? '600' : '500'} transition-colors ${on ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.06]'}">
              <span class="rail"></span>
              <span class="${on ? 'text-white' : 'text-white/45 group-hover:text-white/80'} transition-colors">${ICON[n.icon]({ cls: 'w-[18px] h-[18px]' })}</span>
              ${n.label}
            </a>`;
          }).join('')}
        </div>
      </div>`).join('');

    return `
      <div class="flex flex-col h-full">
        <div class="px-6 pt-6 pb-5">
          <a href="#/dashboard" data-nav class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-[10px] bg-white flex items-center justify-center">
              <span class="font-display font-extrabold text-ink text-[15px] tracking-tight">G&amp;L</span>
            </div>
            <div class="leading-tight">
              <p class="font-display font-bold text-white text-[14.5px] tracking-tight whitespace-nowrap">G&amp;L Boutique</p>
              <p class="eyebrow mt-1 whitespace-nowrap" style="color:#8CA2DC">Panel admin</p>
            </div>
          </a>
        </div>
        <nav class="flex-1 overflow-y-auto scroll-thin pb-4">${navHtml}</nav>
        <div class="px-4 pb-5 pt-3 mt-auto border-t border-white/[0.07]">
          <a href="#/store" data-store class="flex items-center gap-3 px-3 h-10 rounded-[11px] text-[14px] font-500 text-white/55 hover:text-white hover:bg-white/[0.06] transition-colors">
            <span class="text-white/45">${ICON.store({ cls: 'w-[18px] h-[18px]' })}</span> Ver tienda
          </a>
          <div class="flex items-center gap-3 px-3 mt-3 pt-3 border-t border-white/[0.07]">
            <div class="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-[12px] font-bold">GL</div>
            <div class="min-w-0 flex-1 leading-tight">
              <p class="text-[13px] font-600 text-white truncate">Gerencia</p>
              <p class="text-[11px] text-white/40 truncate">admin@glboutique.mx</p>
            </div>
            <a href="#/login" data-nav title="Cerrar sesión" class="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">${ICON.logout({ cls: 'w-[17px] h-[17px]' })}</a>
          </div>
        </div>
      </div>`;
  }

  function topbar(active) {
    const [title, sub] = TITLES[active] || ['', ''];
    const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    return `
      <header class="sticky top-0 z-20 backdrop-blur-md border-b border-line" style="background:rgba(245,246,248,0.85)">
        <div class="h-16 px-4 md:px-8 flex items-center gap-4">
          <button data-menu class="lg:hidden -ml-1 p-2 rounded-lg text-body hover:bg-line">${ICON.menu({ cls: 'w-5 h-5' })}</button>
          <div class="min-w-0">
            <h1 class="font-display font-bold text-ink text-[17px] md:text-[19px] tracking-tight leading-none truncate">${title}</h1>
          </div>
          <div class="flex-1"></div>
          <div class="hidden md:flex items-center gap-2 text-muted text-[12.5px] mr-1">
            ${ICON.calendar({ cls: 'w-4 h-4 text-faint' })}<span class="capitalize">${today}</span>
          </div>
          <button class="relative w-9 h-9 rounded-[10px] border border-line bg-paper flex items-center justify-center text-muted hover:text-ink hover:border-line-strong transition-colors">
            ${ICON.bell({ cls: 'w-[18px] h-[18px]' })}
            <span class="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand ring-2 ring-paper"></span>
          </button>
        </div>
      </header>`;
  }

  function renderShell(active) {
    app.innerHTML = `
      <div class="flex min-h-screen">
        <!-- Sidebar desktop -->
        <aside class="hidden lg:flex w-[264px] shrink-0 bg-ink flex-col fixed inset-y-0 left-0 z-30">${sidebar(active)}</aside>
        <!-- Mobile drawer -->
        <div data-drawer class="lg:hidden fixed inset-0 z-50 hidden">
          <div data-drawer-bg class="absolute inset-0 bg-ink/50 backdrop-blur-sm anim-fade"></div>
          <aside class="absolute inset-y-0 left-0 w-[272px] bg-ink flex flex-col anim-drawer">${sidebar(active)}</aside>
        </div>
        <!-- Main -->
        <div class="flex-1 lg:ml-[264px] min-w-0 flex flex-col">
          ${topbar(active)}
          <main data-view-host class="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1320px] w-full mx-auto"></main>
        </div>
      </div>`;
    wireShell(active);
  }

  function wireShell(active) {
    app.querySelectorAll('[data-store]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); }));
    const menuBtn = app.querySelector('[data-menu]');
    const drawer = app.querySelector('[data-drawer]');
    if (menuBtn && drawer) {
      menuBtn.addEventListener('click', () => { drawer.classList.remove('hidden'); document.body.style.overflow = 'hidden'; });
      const close = () => { drawer.classList.add('hidden'); document.body.style.overflow = ''; };
      drawer.querySelector('[data-drawer-bg]').addEventListener('click', close);
      drawer.querySelectorAll('[data-nav]').forEach((a) => a.addEventListener('click', close));
    }
  }

  function mount(active) {
    const host = app.querySelector('[data-view-host]');
    if (!host) return;
    host.innerHTML = '';
    const view = window.VIEWS[active];
    if (view) view(host);
  }

  function route() {
    let hash = (location.hash || '#/dashboard').replace(/^#\//, '');
    if (hash === 'login') {
      document.body.style.overflow = '';
      window.VIEWS.login(app);
      current = 'login';
      return;
    }
    if (!window.VIEWS[hash]) hash = 'dashboard';
    if (current !== hash) {
      renderShell(hash);
      mount(hash);
      current = hash;
      const main = app.querySelector('[data-view-host]');
      if (main) main.scrollTo?.(0, 0);
      window.scrollTo(0, 0);
    }
  }

  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/' + ((function(){try{return localStorage.getItem('gl_init_route')||'dashboard'}catch(e){return 'dashboard'}})());
  route();

  window.GL = { go: (id) => { location.hash = '#/' + id; } };
})();
