import { adminLogin } from '../../store/index.js'
import { navigate } from '../../core/router.js'
import { on, qs } from '../../utils/dom.js'
import { sanitizeEmail } from '../../utils/sanitize.js'
import { ICON } from './adminIcons.js'

export function pageAdminLogin() {
  return {
    title: 'Login vendedores | G&L',
    html: `
      <div class="min-h-dvh flex">
        <!-- Left: form -->
        <div class="flex-1 flex items-center justify-center px-6 py-12 bg-canvas">
          <div class="w-full max-w-sm">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-11 h-11 rounded-xl2 bg-ink flex items-center justify-center">
                <span class="font-display font-extrabold text-white text-[16px] tracking-tight">G&L</span>
              </div>
              <div>
                <p class="font-display font-bold text-ink text-[18px] tracking-tight">G&L Boutique</p>
                <p class="eyebrow text-faint mt-0.5">Panel de administración</p>
              </div>
            </div>

            <p class="eyebrow text-brand mb-2.5">Acceso restringido</p>
            <h1 class="font-display font-extrabold text-ink text-[28px] tracking-tight leading-tight">Panel de<br/>administración</h1>
            <p class="text-muted text-[14px] mt-2 mb-8">Inicia sesión para gestionar tu tienda.</p>

            <form id="admin-login" class="space-y-4" novalidate>
              <div>
                <label class="adm-lbl">Email</label>
                <input name="user" type="email" class="adm-fld" autocomplete="username email" placeholder="admin@glboutique.mx" />
              </div>
              <div>
                <label class="adm-lbl">Contraseña</label>
                <div class="relative">
                  <input name="pass" type="password" class="adm-fld pr-11" autocomplete="current-password" placeholder="••••••••" />
                  <button type="button" id="toggle-pass" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-faint hover:text-body transition-colors">${ICON.eye('w-[18px] h-[18px]')}</button>
                </div>
              </div>

              <div id="admin-error" class="hidden rounded-xl2 bg-bad-tint border border-bad/20 p-3 text-[13px] text-bad font-medium"></div>

              <button type="submit" id="admin-submit" class="w-full adm-btn adm-btn-primary h-12 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed">
                Ingresar
              </button>
            </form>

            <div class="flex items-center gap-3 mt-7">
              <div class="flex-1 h-px bg-line"></div><span class="eyebrow text-faint">o</span><div class="flex-1 h-px bg-line"></div>
            </div>
            <a href="/" class="mt-5 flex items-center justify-center gap-2 text-[13.5px] font-semibold text-muted hover:text-ink transition-colors">
              ${ICON.store('w-[17px] h-[17px]')} Volver a la tienda
            </a>
          </div>
        </div>

        <!-- Right: decorative panel (hidden on mobile) -->
        <div class="hidden lg:flex w-[46%] xl:w-[44%] bg-ink relative overflow-hidden flex-col justify-between p-14">
          <div class="absolute -right-20 -top-20 w-[420px] h-[420px] rounded-full blur-[100px]" style="background:rgba(33,79,199,0.38)"></div>
          <div class="absolute -left-24 bottom-10 w-[360px] h-[360px] rounded-full blur-[100px]" style="background:rgba(33,79,199,0.20)"></div>
          <div class="relative">
            <span class="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-white/10 text-white/80 eyebrow">${ICON.sparkle('w-3.5 h-3.5')} Desde 1995</span>
          </div>
          <div class="relative">
            <h2 class="font-display font-extrabold text-white text-[44px] xl:text-[52px] leading-[1.02] tracking-tight">Tu fit,<br/>perfecto.</h2>
            <p class="text-white/55 text-[15px] mt-5 max-w-sm leading-relaxed">Gestiona pedidos, catálogo y clientes de tu boutique de moda masculina desde un solo lugar.</p>
            <div class="grid grid-cols-3 gap-4 mt-10 max-w-sm">
              ${[['18', 'Productos'], ['340+', 'Pedidos'], ['2', 'Tiendas']].map(([n, l]) => `<div><p class="font-display font-extrabold text-white text-[26px] tnum">${n}</p><p class="eyebrow text-white/40 mt-1">${l}</p></div>`).join('')}
            </div>
          </div>
          <div class="relative flex items-center gap-3 text-white/40 text-[12.5px]">${ICON.map('w-4 h-4')} Colima · Villa de Álvarez</div>
        </div>
      </div>
    `,
    onMount(root) {
      const form = qs(root, '#admin-login')
      const errorBox = qs(root, '#admin-error')
      const submitBtn = qs(root, '#admin-submit')
      const passInput = qs(root, 'input[name="pass"]')
      const eyeBtn = qs(root, '#toggle-pass')

      eyeBtn?.addEventListener('click', () => {
        const show = passInput.type === 'password'
        passInput.type = show ? 'text' : 'password'
        eyeBtn.innerHTML = (show ? ICON.eyeOff : ICON.eye)('w-[18px] h-[18px]')
      })

      const setError = (msg) => {
        if (!msg) { errorBox.classList.add('hidden'); errorBox.textContent = ''; return }
        errorBox.textContent = msg
        errorBox.classList.remove('hidden')
      }

      const setLoading = (loading, label = 'Ingresar') => {
        submitBtn.disabled = loading
        submitBtn.textContent = loading ? 'Ingresando…' : label
      }

      // ── Anti-brute force: progressive lockout ──
      let failCount = 0
      let lockUntil = 0
      let lockTimer = null

      const startLockdown = () => {
        const waitSec = Math.min(3 * Math.pow(2, failCount - 1), 30)
        lockUntil = Date.now() + waitSec * 1000
        submitBtn.disabled = true

        const tick = () => {
          const remaining = Math.ceil((lockUntil - Date.now()) / 1000)
          if (remaining > 0) {
            submitBtn.textContent = `Espera ${remaining}s…`
            lockTimer = setTimeout(tick, 1000)
          } else {
            submitBtn.disabled = false
            submitBtn.textContent = 'Ingresar'
          }
        }
        tick()
      }

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault()
        setError('')

        if (Date.now() < lockUntil) return

        const { value: email } = sanitizeEmail(qs(root, 'input[name="user"]').value)
        const pass = qs(root, 'input[name="pass"]').value.trim()

        if (!email || !pass) { setError('Completá email y contraseña.'); return }

        setLoading(true)
        const result = await adminLogin(email, pass)
        setLoading(false)

        if (result.error) {
          failCount++
          setError('Credenciales inválidas.')
          startLockdown()
          return
        }

        failCount = 0
        clearTimeout(lockTimer)
        navigate('/admin/dashboard')
      })

      on(root, 'click', '#admin-logout', () => {})
    },
  }
}
