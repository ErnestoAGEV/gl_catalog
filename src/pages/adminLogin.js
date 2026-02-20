import { adminLogin } from '../app/store.js'
import { navigate } from '../app/router.js'
import { on, qs } from '../app/dom.js'

export function pageAdminLogin() {
  return {
    title: 'Login vendedores | G&L',
    html: `
      <div class="flex min-h-[70vh] items-center justify-center">
        <div class="w-full max-w-xs">
          <div class="text-center mb-8">
            <span class="text-2xl font-bold text-white">G&L</span>
            <p class="text-xs text-gray-500 mt-1">Panel de administración</p>
          </div>

          <section class="rounded-xl bg-gray-900 p-6">
            <form id="admin-login" class="space-y-4" novalidate>
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Email</label>
                <input name="user" type="email" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" autocomplete="username email" placeholder="admin@ejemplo.com" />
              </div>

              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Contraseña</label>
                <input name="pass" type="password" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" autocomplete="current-password" placeholder="••••••••" />
              </div>

              <div id="admin-error" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"></div>

              <button type="submit" id="admin-submit" class="w-full rounded-lg bg-white hover:bg-gray-100 px-4 py-3 text-sm font-semibold text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Ingresar
              </button>
            </form>
          </section>

          <div class="text-center mt-6">
            <a href="#/" class="text-xs text-gray-500 hover:text-white transition-colors">
              ← Volver a la tienda
            </a>
          </div>
        </div>
      </div>
    `,
    onMount(root) {
      const form = qs(root, '#admin-login')
      const errorBox = qs(root, '#admin-error')
      const submitBtn = qs(root, '#admin-submit')

      const setError = (msg) => {
        if (!msg) {
          errorBox.classList.add('hidden')
          errorBox.textContent = ''
          return
        }
        errorBox.textContent = msg
        errorBox.classList.remove('hidden')
      }

      const setLoading = (loading) => {
        submitBtn.disabled = loading
        submitBtn.textContent = loading ? 'Ingresando…' : 'Ingresar'
      }

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault()
        setError('')

        const email = qs(root, 'input[name="user"]').value.trim()
        const pass = qs(root, 'input[name="pass"]').value

        if (!email || !pass) {
          setError('Completá email y contraseña.')
          return
        }

        setLoading(true)
        const result = await adminLogin(email, pass)
        setLoading(false)

        if (result.error) {
          setError('Credenciales inválidas.')
          return
        }

        navigate('/admin/products')
      })

      // Safety: if someone clicks the (hidden) logout button via cached layout.
      on(root, 'click', '#admin-logout', () => {})
    },
  }
}
