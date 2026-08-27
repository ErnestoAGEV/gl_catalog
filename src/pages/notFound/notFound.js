import { getCategoryNames } from '../../store/index.js'
import { escapeHtml } from '../../utils/sanitize.js'

/**
 * Página 404 compartida. Se usa para rutas desconocidas y para un producto
 * inexistente (product.js la llama con su propio copy).
 */
export function pageNotFound(state, options = {}) {
  const {
    title = 'Página no encontrada | G&L',
    heading = 'Esta página<br/>no <span class="text-brand">existe</span>.',
    body = 'Puede que el enlace esté incompleto o que la pieza ya no forme parte del catálogo.',
  } = options

  const categories = getCategoryNames().slice(0, 6)
  const categoryLinks = categories.map(name => `
    <a href="/categoria/${encodeURIComponent(name)}" class="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/55 hover:text-ink ul-link">${escapeHtml(name)}</a>
  `).join('<span class="text-ink/20">·</span>')

  return {
    title,
    noPaddingTop: true,
    fullWidth: true,
    forceLight: true,
    html: `
      <section class="min-h-[78vh] flex items-center py-16 lg:py-24">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            <!-- Cifra -->
            <div class="lg:col-span-6">
              <span class="font-mono text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-ink/55 block mb-4">§ Error 404</span>
              <h1 class="font-display font-extrabold leading-[0.82] tracking-[-0.045em] text-[clamp(96px,20vw,260px)] outline-text select-none" aria-hidden="true">404.</h1>
            </div>

            <!-- Mensaje -->
            <div class="lg:col-span-6 lg:pl-6 lg:border-l border-ink/10">
              <h2 class="font-display font-extrabold text-[clamp(30px,5vw,56px)] leading-[0.95] tracking-[-0.035em]">${heading}</h2>
              <p class="mt-5 text-[14px] sm:text-[15px] leading-relaxed text-ink/65 max-w-[46ch]">${body}</p>

              <div class="mt-9 flex flex-wrap items-center gap-3">
                <a href="/catalog" class="inline-flex items-center gap-2 bg-ink text-paper px-7 h-[52px] rounded-full text-[13px] font-semibold hover:bg-brand transition-colors">
                  Ver la tienda <span class="arrow-walk">→</span>
                </a>
                <a href="/" class="inline-flex items-center gap-2 border border-ink/15 px-7 h-[52px] rounded-full text-[13px] font-semibold hover:border-ink transition-colors">
                  Volver al inicio
                </a>
              </div>

              ${categories.length ? `
                <div class="mt-10 pt-8 border-t border-ink/10">
                  <span class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink/40 block mb-4">O busca por categoría</span>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-3">${categoryLinks}</div>
                </div>
              ` : ''}
            </div>

          </div>
        </div>
      </section>
    `,
    onMount() {},
  }
}
