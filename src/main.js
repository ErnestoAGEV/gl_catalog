import './style.css'
import { startApp } from './core/startApp.js'

const mount = document.querySelector('#app')

/**
 * Si el arranque falla, la app dejaba el body vacío: con el tema oscuro eso es
 * una pantalla negra sin ninguna pista. Pintamos algo legible y reintentable.
 * Va dentro de #prerender-shell a propósito: el render lo elimina solo si la
 * app acaba levantando, así que un arranque lento no se queda con el aviso.
 */
function bootFailed(reason) {
  if (mount.querySelector('.page-route-container')) return // ya montó: falsa alarma
  if (document.getElementById('gl-boot-error')) return     // ya avisamos
  console.error('Boot failed:', reason)

  const detail = String(reason?.message || reason || '').slice(0, 300)
  const shell = document.getElementById('prerender-shell') || mount
  shell.id = 'prerender-shell'
  shell.innerHTML = `
    <div id="gl-boot-error" class="min-h-dvh flex flex-col items-center justify-center text-center px-6 bg-paper text-ink">
      <span class="font-mono text-[11px] tracking-[0.28em] uppercase text-ink/55 mb-4">No cargó</span>
      <h1 class="font-display font-extrabold text-[clamp(28px,5vw,48px)] leading-[0.95] tracking-[-0.035em] mb-6">Algo impidió abrir<br/>la página.</h1>
      <button type="button" onclick="window.location.reload()" class="inline-flex items-center gap-2 bg-ink text-paper px-7 h-[52px] rounded-full text-[13px] font-semibold hover:bg-brand transition-colors">
        Reintentar
      </button>
      <p class="mt-8 font-mono text-[10px] text-ink/40 max-w-[60ch] break-words">${detail}</p>
    </div>
  `
}

startApp(mount).catch(bootFailed)

// Red de seguridad: si nada se montó, la pantalla está en blanco de verdad.
setTimeout(() => bootFailed('El arranque no completó a tiempo.'), 15000)
