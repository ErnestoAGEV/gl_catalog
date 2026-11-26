import { adminLogin, adminLogout, completeAdminLogin, isAdminAuthed, getMfaStep, listMfaFactors, startMfaEnroll, verifyMfa, refreshProducts } from '../../store/index.js'
import { navigate } from '../../core/router.js'
import { qs } from '../../utils/dom.js'
import { sanitizeEmail } from '../../utils/sanitize.js'
import { ICON } from './adminIcons.js'
import { factorName, cleanTotpCode } from '../../utils/mfa.js'

// Las mismas piezas sirven sin sesion (pantalla completa) y con sesion (dentro
// del panel, como "Seguridad"). onMount decide que paso se ve.
const steps = `
            <p id="step-eyebrow" class="eyebrow text-brand mb-2.5">Acceso restringido</p>
            <h1 id="step-title" tabindex="-1" class="focus:outline-none font-display font-extrabold text-ink text-[28px] tracking-tight leading-tight">Panel de administración</h1>
            <p id="step-lead" class="text-muted text-[14px] mt-2 mb-8">Inicia sesión para gestionar tu tienda.</p>

            <div id="admin-error" role="alert" class="hidden mb-4 rounded-xl2 bg-bad-tint border border-bad/20 p-3 text-[13px] text-bad font-medium"></div>
            <p id="step-status" role="status" class="text-[13px] text-ok font-medium mb-4 empty:mb-0"></p>

            <p id="step-loading" role="status" class="text-muted text-[14px]">Comprobando tu sesión…</p>

            <form id="admin-login" class="hidden space-y-4" novalidate>
              <div>
                <label for="admin-user" class="adm-lbl">Email</label>
                <input id="admin-user" name="user" type="email" class="adm-fld" autocomplete="username email" placeholder="admin@glboutique.mx" />
              </div>
              <div>
                <label for="admin-pass" class="adm-lbl">Contraseña</label>
                <div class="relative">
                  <input id="admin-pass" name="pass" type="password" class="adm-fld pr-11" autocomplete="current-password" placeholder="••••••••" />
                  <button type="button" id="toggle-pass" aria-label="Mostrar contraseña" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-faint hover:text-body transition-colors">${ICON.eye('w-[18px] h-[18px]')}</button>
                </div>
              </div>

              <button type="submit" id="admin-submit" class="w-full adm-btn adm-btn-primary h-12 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed">
                Ingresar
              </button>
            </form>

            <form id="mfa-form" class="hidden space-y-4" novalidate>
              <div id="mfa-enroll" class="hidden space-y-4">
                <p id="mfa-intro" class="text-body text-[14px] leading-relaxed"></p>
                <p class="text-muted text-[13px] leading-relaxed">Si ya habías escaneado un código antes, bórralo de la app y escanea este.</p>
                <div id="mfa-qr-box"></div>
                <div>
                  <label for="mfa-secret" class="adm-lbl">Si no puedes escanearlo, escribe esta clave en la app</label>
                  <div class="flex gap-2">
                    <input id="mfa-secret" type="text" readonly class="adm-fld font-mono text-[13px]" autocomplete="off" spellcheck="false" />
                    <button type="button" id="mfa-copy" class="adm-btn adm-btn-ghost h-11 shrink-0">Copiar</button>
                  </div>
                </div>
              </div>
              <div>
                <label for="mfa-code" class="adm-lbl">Código de tu app de autenticación</label>
                <input id="mfa-code" name="code" type="text" class="adm-fld tnum text-center tracking-[0.3em] text-[18px]" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" maxlength="6" placeholder="000000" aria-describedby="admin-error" />
              </div>
              <button type="submit" id="mfa-submit" class="w-full adm-btn adm-btn-primary h-12 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed">Verificar</button>
              <button type="button" id="mfa-cancel" class="w-full h-10 text-[13.5px] font-semibold text-muted hover:text-ink transition-colors">Usar otra cuenta</button>
            </form>

            <div id="mfa-retry" class="hidden space-y-3">
              <button type="button" id="mfa-retry-btn" class="w-full adm-btn adm-btn-primary h-12 text-[15px]">Reintentar</button>
              <!-- Mientras la base no exija el segundo paso (Fase D), un fallo al preparar el alta no debe dejar fuera al dueño. -->
              <button type="button" id="mfa-skip" class="w-full h-10 text-[13.5px] font-semibold text-muted hover:text-ink transition-colors">Entrar sin segundo paso por ahora</button>
            </div>

            <section id="mfa-security" class="hidden space-y-4" aria-labelledby="step-title">
              <h2 class="adm-lbl">Dispositivos dados de alta</h2>
              <ul id="mfa-devices" class="rounded-xl2 border border-line divide-y divide-line"></ul>
              <button type="button" id="mfa-add" class="w-full adm-btn adm-btn-primary h-12 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed">Agregar otro dispositivo</button>
              <a href="/admin/dashboard" class="flex items-center justify-center h-10 text-[13.5px] font-semibold text-muted hover:text-ink transition-colors">Ir al panel</a>
            </section>
`

export function pageAdminLogin(state) {
  if (state?.isAdminAuthed) {
    // Dentro del panel el titulo de la pagina ya es el h1 de la cabecera.
    const inner = steps.replace('<h1 ', '<h2 ').replace('</h1>', '</h2>')
    return { title: 'Seguridad | G&L', html: `<div class="max-w-md">${inner}</div>`, onMount }
  }
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

${steps}
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
    onMount,
  }
}

async function onMount(root) {
  const $ = (sel) => qs(root, sel)
  const loading = $('#step-loading')
  const loginForm = $('#admin-login')
  const mfaForm = $('#mfa-form')
  const retryBox = $('#mfa-retry')
  const security = $('#mfa-security')
  const errorBox = $('#admin-error')
  const statusLine = $('#step-status')
  const title = $('#step-title')
  const submitBtn = $('#admin-submit')
  const passInput = $('#admin-pass')
  const eyeBtn = $('#toggle-pass')
  const enrollBox = $('#mfa-enroll')
  const qrBox = $('#mfa-qr-box')
  const secretInput = $('#mfa-secret')
  const copyBtn = $('#mfa-copy')
  const codeInput = $('#mfa-code')
  const mfaSubmit = $('#mfa-submit')
  const cancelBtn = $('#mfa-cancel')
  const devices = $('#mfa-devices')
  const addBtn = $('#mfa-add')

  let enrollFactorId = null // factor en alta; null = codigo de un factor ya verificado
  let addingDevice = false  // alta de otro dispositivo desde Seguridad (ya en aal2)

  const show = (el) => {
    for (const x of [loading, loginForm, mfaForm, retryBox, security]) x.classList.toggle('hidden', x !== el)
    // Al cambiar de paso, el lector de pantalla empieza por el titulo nuevo.
    if (el !== loading) title.focus()
  }

  const setHead = (eyebrow, text, lead) => {
    $('#step-eyebrow').textContent = eyebrow
    title.textContent = text
    const leadEl = $('#step-lead')
    leadEl.textContent = lead
    leadEl.classList.toggle('hidden', !lead)
  }

  // field: el campo al que se refiere el error (aria-invalid solo en ese).
  const setError = (msg, field) => {
    for (const f of [passInput, codeInput]) f.removeAttribute('aria-invalid')
    if (!msg) { errorBox.classList.add('hidden'); errorBox.textContent = ''; return }
    if (field) field.setAttribute('aria-invalid', 'true')
    errorBox.textContent = msg
    errorBox.classList.remove('hidden')
  }

  const showLoading = (text) => {
    loading.textContent = text
    show(loading)
  }

  eyeBtn.addEventListener('click', () => {
    const showPass = passInput.type === 'password'
    passInput.type = showPass ? 'text' : 'password'
    eyeBtn.setAttribute('aria-label', showPass ? 'Ocultar contraseña' : 'Mostrar contraseña')
    eyeBtn.innerHTML = (showPass ? ICON.eyeOff : ICON.eye)('w-[18px] h-[18px]')
  })

  // ── Anti-brute force: bloqueo progresivo, compartido por contraseña y código ──
  let failCount = 0
  let lockUntil = 0
  let lockTimer = null

  const startLockdown = (btn, label) => {
    failCount++
    const waitSec = Math.min(3 * Math.pow(2, failCount - 1), 30)
    lockUntil = Date.now() + waitSec * 1000
    btn.disabled = true
    clearTimeout(lockTimer)

    const tick = () => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000)
      if (remaining > 0) {
        btn.textContent = `Espera ${remaining}s…`
        lockTimer = setTimeout(tick, 1000)
      } else {
        btn.disabled = false
        btn.textContent = label
      }
    }
    tick()
  }

  const setBusy = (btn, busy, idle, working) => {
    btn.disabled = busy
    btn.textContent = busy ? working : idle
  }

  const showLogin = () => {
    setHead('Acceso restringido', 'Panel de administración', 'Inicia sesión para gestionar tu tienda.')
    show(loginForm)
  }

  const showSecurity = async (status = '') => {
    showLoading('Cargando tus dispositivos…')
    const res = await listMfaFactors()
    setHead('Cuenta', 'Seguridad', 'Los dispositivos con los que entras al admin. Ten al menos dos, por si pierdes uno.')
    const item = (text) => {
      const li = document.createElement('li')
      li.className = 'px-4 py-3 text-[14px] text-muted'
      li.textContent = text
      return li
    }
    if (res.error) {
      // Sin la lista no se sabe que nombre esta libre: no se ofrece el alta.
      devices.replaceChildren(item(res.error))
      addBtn.disabled = true
    } else {
      addBtn.disabled = false
      devices.replaceChildren(...res.factors.map((f) => {
        const li = document.createElement('li')
        li.className = 'flex items-center justify-between gap-3 px-4 py-3 text-[14px]'
        const name = document.createElement('span')
        name.className = 'font-semibold text-ink'
        name.textContent = f.friendly_name || 'Dispositivo'
        const date = document.createElement('span')
        date.className = 'text-muted text-[13px]'
        date.textContent = f.created_at ? `Desde ${new Date(f.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''
        li.append(name, date)
        return li
      }))
      if (!res.factors.length) devices.append(item('Aún no tienes dispositivos dados de alta.'))
    }
    show(security)
    statusLine.textContent = status
  }

  const showChallenge = () => {
    enrollFactorId = null
    codeInput.value = ''
    enrollBox.classList.add('hidden')
    cancelBtn.textContent = 'Usar otra cuenta'
    setHead('Segundo paso', 'Verificación en dos pasos', 'Abre tu app de autenticación y escribe el código de 6 dígitos de G&L.')
    show(mfaForm)
  }

  const showEnroll = async () => {
    setError('')
    codeInput.value = ''
    showLoading('Preparando el alta…')

    let names = []
    if (addingDevice) {
      const list = await listMfaFactors()
      if (list.error) { addingDevice = false; await showSecurity(); setError(list.error); return }
      names = list.factors.map((f) => f.friendly_name)
    }
    const res = await startMfaEnroll(factorName(names))
    if (res.challenge) { addingDevice = false; showChallenge(); return }
    if (res.error) {
      setError(res.error)
      if (addingDevice) { addingDevice = false; await showSecurity(); return }
      setHead('Segundo paso', 'Activa la verificación en dos pasos', '')
      show(retryBox)
      return
    }
    enrollFactorId = res.factorId
    // data:image/svg+xml que arma supabase-js; la CSP de vercel.json permite data: en img-src.
    const qr = document.createElement('img')
    qr.src = res.qr
    qr.alt = 'Código QR para tu app de autenticación'
    qr.width = 184
    qr.height = 184
    qr.className = 'w-[184px] h-[184px] bg-white rounded-xl2 p-2 border border-line'
    qrBox.replaceChildren(qr)
    secretInput.value = res.secret
    copyBtn.textContent = 'Copiar'
    $('#mfa-intro').textContent = addingDevice
      ? 'Escanea este código con la app de autenticación del otro dispositivo (Google Authenticator, 1Password o Authy) y escribe el código de 6 dígitos que te da.'
      : 'Para entrar al admin necesitas un segundo paso. Escanea este código con Google Authenticator, 1Password o Authy y escribe el código de 6 dígitos.'
    cancelBtn.textContent = addingDevice ? 'Cancelar' : 'Usar otra cuenta'
    enrollBox.classList.remove('hidden')
    setHead('Segundo paso', addingDevice ? 'Agregar otro dispositivo' : 'Activa la verificación en dos pasos', '')
    show(mfaForm)
  }

  // Marca la sesion como admin (admin_users). Error -> vuelve a la contraseña.
  const complete = async () => {
    if (isAdminAuthed()) return true
    const r = await completeAdminLogin()
    if (r.error) { setError(r.error); showLogin(); return false }
    // Con la sesión de admin el catálogo trae también los borradores.
    refreshProducts().catch(() => {})
    return true
  }

  const finish = async () => {
    if (!(await complete())) return
    failCount = 0
    clearTimeout(lockTimer)
    navigate('/admin/dashboard')
  }

  const decide = async () => {
    setError('')
    statusLine.textContent = ''
    let step
    try {
      step = await getMfaStep()
    } catch {
      setError('No se pudo comprobar la sesión. Inténtalo de nuevo.')
      showLogin()
      return
    }
    if (step === 'login') return showLogin()
    // aal2: la pagina es Seguridad, tambien si se abrio directo.
    if (step === 'none') { if (await complete()) await showSecurity(); return }
    if (step === 'challenge') return showChallenge()
    return showEnroll()
  }

  loginForm.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    setError('')

    if (Date.now() < lockUntil) return

    const { value: email } = sanitizeEmail(qs(root, 'input[name="user"]').value)
    // Sin trim: los espacios de una contraseña son parte de ella.
    const pass = passInput.value

    if (!email || !pass) { setError('Completa email y contraseña.'); return }

    setBusy(submitBtn, true, 'Ingresar', 'Ingresando…')
    // El finally no es adorno: si adminLogin lanzara, el boton se quedaba
    // en "Ingresando…" y no habia forma de reintentar sin recargar.
    let result
    try {
      result = await adminLogin(email, pass)
    } catch (err) {
      result = { error: String(err?.message || err) }
    } finally {
      setBusy(submitBtn, false, 'Ingresar')
    }

    if (result.error) {
      // El mensaje real, no "credenciales invalidas" para todo: con dos
      // pestañas abiertas el fallo es del lock de sesion, y decir que la
      // contraseña esta mal manda a buscar por donde no es.
      const esCredencial = /invalid|credential|password|email/i.test(result.error)
      setError(esCredencial ? 'Credenciales inválidas.' : result.error, esCredencial ? passInput : null)
      // El bloqueo progresivo es contra la fuerza bruta. Un fallo que no es
      // de credenciales no deberia castigar al que si sabe su contraseña.
      if (esCredencial) startLockdown(submitBtn, 'Ingresar')
      return
    }

    passInput.value = ''
    await decide()
  })

  mfaForm.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    setError('')
    if (Date.now() < lockUntil) return

    const code = cleanTotpCode(codeInput.value)
    if (!code) { setError('Escribe los 6 dígitos del código.', codeInput); codeInput.focus(); return }

    setBusy(mfaSubmit, true, 'Verificar', 'Verificando…')
    let r
    try {
      r = await verifyMfa(code, enrollFactorId || undefined)
    } finally {
      setBusy(mfaSubmit, false, 'Verificar')
    }

    // Sus factores se borraron (recuperacion): toca dar de alta uno nuevo.
    if (r.enroll) { await showEnroll(); return }

    if (r.error) {
      const msg = r.wrongCode && enrollFactorId
        ? `${r.error} Si ya habías escaneado un código antes, bórralo de la app y escanea este.`
        : r.error
      setError(msg, codeInput)
      codeInput.select()
      if (r.wrongCode) startLockdown(mfaSubmit, 'Verificar')
      return
    }

    enrollFactorId = null
    if (addingDevice) {
      addingDevice = false
      await showSecurity('Dispositivo agregado.')
      return
    }
    await finish()
  })

  cancelBtn.addEventListener('click', async () => {
    setError('')
    if (addingDevice) { addingDevice = false; await showSecurity(); return }
    await adminLogout()
    showLogin()
  })

  addBtn.addEventListener('click', () => {
    statusLine.textContent = ''
    addingDevice = true
    showEnroll()
  })

  $('#mfa-retry-btn').addEventListener('click', () => { setError(''); showEnroll() })
  // Solo hasta la Fase D (Tarea 16 lo quita): no dejar fuera al dueño si el alta no arranca.
  $('#mfa-skip').addEventListener('click', () => { setError(''); finish() })

  copyBtn.addEventListener('click', async () => {
    secretInput.select()
    try {
      await navigator.clipboard.writeText(secretInput.value)
      copyBtn.textContent = 'Copiada'
    } catch { /* queda seleccionada para copiarla a mano */ }
  })

  await decide()
  return () => clearTimeout(lockTimer)
}
