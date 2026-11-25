import { confirmNewsletter } from '../../store/index.js'

// /confirmar?t=<token>: el enlace del correo de confirmación del boletín.
// Confirma solo al pulsar el botón: los antivirus de correo abren los enlaces.
const MESSAGES = {
  ask: ['Confirma tu suscripción', 'Pulsa el botón para recibir las novedades de G&L.'],
  loading: ['Un momento…', 'Pulsa el botón para recibir las novedades de G&L.'],
  done: ['Listo, ya eres parte del Club G&L.', 'Usa WELCOME10 para tener 10% de descuento en tu primera compra.'],
  invalid: ['Este enlace no es válido o ya venció.', 'Vuelve a suscribirte desde la página principal y te mandamos uno nuevo.'],
  error: ['No pudimos confirmar tu suscripción.', 'Revisa tu conexión e inténtalo de nuevo en un momento.'],
}

export function pageConfirm() {
  return {
    title: 'Confirmar suscripción | G&L',
    noPaddingTop: true,
    fullWidth: true,
    forceLight: true,
    html: `
      <section class="min-h-[70vh] flex items-center py-16 lg:py-24">
        <div class="max-w-[720px] mx-auto px-4 sm:px-6 w-full" aria-live="polite">
          <h1 id="confirm-title" class="font-display font-extrabold text-[clamp(30px,5vw,56px)] leading-[0.95] tracking-[-0.035em]">${MESSAGES.ask[0]}</h1>
          <p id="confirm-body" class="mt-5 text-[15px] leading-relaxed text-ink/65 max-w-[52ch]">${MESSAGES.ask[1]}</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <button id="confirm-btn" type="button" class="inline-flex items-center h-11 px-5 rounded-full bg-ink text-paper text-[14px] font-semibold hover:bg-brand transition-colors disabled:opacity-60">Confirmar mi suscripción</button>
            <a href="/" class="inline-flex items-center h-11 px-5 rounded-full border border-ink/15 text-[14px] font-semibold hover:border-ink transition-colors">Volver a la tienda</a>
          </div>
        </div>
      </section>`,
    onMount(root) {
      const token = new URLSearchParams(location.search).get('t')
      const btn = root.querySelector('#confirm-btn')
      const show = ([title, body]) => {
        root.querySelector('#confirm-title').textContent = title
        root.querySelector('#confirm-body').textContent = body
      }
      btn.addEventListener('click', async () => {
        btn.disabled = true
        show(MESSAGES.loading)
        const result = await confirmNewsletter(token)
        show(MESSAGES[result === true ? 'done' : result === false ? 'invalid' : 'error'])
        // Solo el error de red deja reintentar
        if (result === null) btn.disabled = false
        else btn.remove()
      })
    },
  }
}
