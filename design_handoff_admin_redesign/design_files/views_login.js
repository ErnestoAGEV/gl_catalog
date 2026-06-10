// G&L Admin — Login (full screen)
(function () {
  const ICON = window.ICON, UI = window.UI;

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.login = function (app) {
    app.innerHTML = `
      <div class="min-h-screen flex">
        <!-- Form side -->
        <div class="flex-1 flex flex-col px-6 py-8 lg:px-16">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-[10px] bg-ink flex items-center justify-center"><span class="font-display font-extrabold text-white text-[14px] tracking-tight">G&amp;L</span></div>
            <span class="font-display font-bold text-ink text-[15px] whitespace-nowrap">G&amp;L Boutique</span>
          </div>

          <div class="flex-1 flex items-center justify-center">
            <div class="w-full max-w-[360px] view-in">
              <p class="eyebrow text-brand mb-2.5">Acceso restringido</p>
              <h1 class="font-display font-extrabold text-ink text-[28px] leading-tight tracking-tight">Panel de administración</h1>
              <p class="text-[14px] text-muted mt-2">Inicia sesión para gestionar tu tienda.</p>

              <form data-form class="mt-8 space-y-4">
                <div>
                  <label class="lbl">Correo electrónico</label>
                  <input data-email type="email" class="fld" placeholder="admin@glboutique.mx" value="admin@glboutique.mx" autocomplete="username" />
                </div>
                <div>
                  <label class="lbl">Contraseña</label>
                  <div class="relative">
                    <input data-pass type="password" class="fld pr-11" placeholder="••••••••" value="demo1234" autocomplete="current-password" />
                    <button type="button" data-eye class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-faint hover:text-body transition">${ICON.eye({ cls: 'w-[18px] h-[18px]' })}</button>
                  </div>
                </div>
                <div data-err class="hidden items-center gap-2 text-[13px] text-bad bg-bad-tint rounded-xl2 px-3.5 py-2.5"></div>
                <button data-submit class="btn btn-primary w-full !h-12 text-[15px]">Ingresar al panel</button>
              </form>

              <div class="flex items-center gap-3 mt-7">
                <div class="flex-1 h-px bg-line"></div><span class="eyebrow text-faint">o</span><div class="flex-1 h-px bg-line"></div>
              </div>
              <a href="#/dashboard" class="mt-5 flex items-center justify-center gap-2 text-[13.5px] font-600 text-muted hover:text-ink transition">${ICON.store({ cls: 'w-[17px] h-[17px]' })} Volver a la tienda</a>
            </div>
          </div>

          <p class="text-[12px] text-faint text-center lg:text-left">© 2026 G&amp;L Boutique · Colima, México</p>
        </div>

        <!-- Brand side -->
        <div class="hidden lg:flex w-[46%] xl:w-[44%] bg-ink relative overflow-hidden flex-col justify-between p-14">
          <div class="absolute -right-20 -top-20 w-[420px] h-[420px] rounded-full blur-[100px]" style="background:rgba(33,79,199,0.38)"></div>
          <div class="absolute -left-24 bottom-10 w-[360px] h-[360px] rounded-full blur-[100px]" style="background:rgba(33,79,199,0.20)"></div>
          <div class="relative">
            <span class="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-white/10 text-white/80 eyebrow">${ICON.sparkle({ cls: 'w-3.5 h-3.5' })} Desde 1995</span>
          </div>
          <div class="relative">
            <h2 class="font-display font-extrabold text-white text-[44px] xl:text-[52px] leading-[1.02] tracking-tight">Tu fit,<br/>perfecto.</h2>
            <p class="text-white/55 text-[15px] mt-5 max-w-sm leading-relaxed">Gestiona pedidos, catálogo y clientes de tu boutique de moda masculina desde un solo lugar.</p>
            <div class="grid grid-cols-3 gap-4 mt-10 max-w-sm">
              ${[['18', 'Productos'], ['340+', 'Pedidos'], ['2', 'Tiendas']].map(([n, l]) => `<div><p class="font-display font-extrabold text-white text-[26px] tnum">${n}</p><p class="eyebrow text-white/40 mt-1">${l}</p></div>`).join('')}
            </div>
          </div>
          <div class="relative flex items-center gap-3 text-white/40 text-[12.5px]">${ICON.map({ cls: 'w-4 h-4' })} Colima · Villa de Álvarez</div>
        </div>
      </div>`;

    const form = app.querySelector('[data-form]');
    const pass = app.querySelector('[data-pass]');
    const err = app.querySelector('[data-err]');
    app.querySelector('[data-eye]').addEventListener('click', function () {
      const show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      this.innerHTML = (show ? ICON.eyeOff : ICON.eye)({ cls: 'w-[18px] h-[18px]' });
    });
    const submit = (e) => {
      e?.preventDefault();
      const email = app.querySelector('[data-email]').value.trim();
      if (!email || !pass.value) { err.className = 'flex items-center gap-2 text-[13px] text-bad bg-bad-tint rounded-xl2 px-3.5 py-2.5'; err.innerHTML = ICON.info({ cls: 'w-4 h-4' }) + 'Completa correo y contraseña.'; return; }
      const btn = app.querySelector('[data-submit]');
      btn.textContent = 'Ingresando…'; btn.style.opacity = '.7';
      setTimeout(() => { location.hash = '#/dashboard'; }, 550);
    };
    form.addEventListener('submit', submit);
    app.querySelector('[data-submit]').addEventListener('click', submit);
  };
})();
