import { unsubscribeNewsletter } from '../../store/index.js'

// /baja?t=<token>: el enlace "Darme de baja" de los correos del boletín.
const MESSAGES = {
  loading: ['Un momento…', 'Estamos procesando tu baja.'],
  done: ['Listo, ya no te escribiremos.', 'Te diste de baja del Club G&L. Si cambias de opinión, puedes volver a suscribirte desde la página principal.'],
  invalid: ['Este enlace no es válido.', 'Puede que esté incompleto. Usa el enlace "Darme de baja" de cualquiera de nuestros correos, o escríbenos por WhatsApp y te damos de baja.'],
  error: ['No pudimos procesar tu baja.', 'Revisa tu conexión e inténtalo de nuevo en un momento, o escríbenos por WhatsApp y te damos de baja.'],
}

export function pageUnsubscribe() {
  return {
    title: 'Darse de baja | G&L',
    noPaddingTop: true,
    fullWidth: true,
    forceLight: true,
    html: `
      <section class="min-h-[70vh] flex items-center py-16 lg:py-24">
        <div class="max-w-[720px] mx-auto px-4 sm:px-6 w-full" aria-live="polite">
          <h1 id="unsub-title" class="font-display font-extrabold text-[clamp(30px,5vw,56px)] leading-[0.95] tracking-[-0.035em]">${MESSAGES.loading[0]}</h1>
          <p id="unsub-body" class="mt-5 text-[15px] leading-relaxed text-ink/65 max-w-[52ch]">${MESSAGES.loading[1]}</p>
          <a href="/" class="mt-8 inline-flex items-center h-11 px-5 rounded-full bg-ink text-paper text-[14px] font-semibold hover:bg-brand transition-colors">Volver a la tienda</a>
        </div>
      </section>`,
    async onMount(root) {
      const token = new URLSearchParams(location.search).get('t')
      const result = await unsubscribeNewsletter(token)
      const [title, body] = MESSAGES[result === true ? 'done' : result === false ? 'invalid' : 'error']
      root.querySelector('#unsub-title').textContent = title
      root.querySelector('#unsub-body').textContent = body
    },
  }
}
