// Editor de correos del boletín: campos a la izquierda, vista previa en vivo a la
// derecha. Lo usan la bienvenida y los envíos a suscriptores (adminNewsletter.js).
import { getEmailTemplate } from '../../store/index.js'
import { BRAND } from '../../utils/config.js'
import { escapeHtml as esc } from '../../utils/sanitize.js'
import { newsletterEmailHtml, checkEmailHtml, UNSUB_PLACEHOLDER } from './newsletterEmail.js'

const FIELDS = [
  ['subject', 'Asunto', 'input', 120],
  ['preheader', 'Vista previa en la bandeja', 'input', 150],
  ['title', 'Título', 'input', 80],
  ['bodyMode', 'Formato del mensaje', 'select'],
  ['body', 'Mensaje', 'textarea', 20000],
  ['code', 'Código de descuento (vacío = sin etiqueta)', 'input', 30],
  ['codeNote', 'Texto sobre el código', 'input', 60],
  ['ctaLabel', 'Texto del botón (vacío = sin botón)', 'input', 40],
  ['ctaUrl', 'Enlace del botón', 'input', 300],
  ['imageUrl', 'Foto (URL, vacío = sin foto)', 'input', 300],
]

const BODY_HINT = {
  text: 'Deja una línea vacía entre párrafos.',
  html: 'Se inserta tal cual entre el título y el botón. Usa estilos en línea (style="..."); muchos correos ignoran las hojas de estilo.',
}

/** @param {{ id: string, title: string, subtitle: string, actions: string }} opts */
export function emailEditorHtml({ id, title, subtitle, actions }) {
  const field = ([name, label, tag, max]) => {
    const fid = `${id}-${name}`
    const control = tag === 'select'
      ? `<select id="${fid}" name="${name}" class="adm-fld"><option value="text">Texto</option><option value="html">HTML</option></select>`
      : tag === 'textarea'
        ? `<textarea id="${fid}" name="${name}" rows="8" maxlength="${max}" class="adm-fld resize-y font-mono text-[13px]"></textarea><p data-body-hint class="text-[11.5px] text-faint mt-1"></p><ul data-body-issues class="mt-2 space-y-1 text-[12px]" aria-live="polite"></ul>`
        : `<input id="${fid}" name="${name}" maxlength="${max}" class="adm-fld" />`
    return `<div><label class="adm-lbl" for="${fid}">${label}</label>${control}</div>`
  }
  return `
    <form id="${id}" class="bg-paper rounded-3xl border border-line shadow-card">
      <div class="p-5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 border-b border-line">
        <div class="flex-1 min-w-0">
          <h2 class="text-[16px] font-bold text-ink">${title}</h2>
          <p class="text-[12.5px] text-muted">${subtitle}</p>
        </div>
        ${actions}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
        <div class="space-y-4">
          ${FIELDS.map(field).join('')}
          <p data-status class="text-[12px] text-faint"></p>
        </div>
        <div>
          <span class="adm-lbl">Vista previa</span>
          <iframe data-preview sandbox="" title="Vista previa: ${title}" class="w-full h-[760px] rounded-2xl border border-line bg-canvas"></iframe>
        </div>
      </div>
    </form>`
}

/**
 * Carga la plantilla guardada (o los defaults) y mantiene la vista previa al día.
 * @returns {Promise<{ saved: object|null, error: any, readFields: () => object, render: (fields?: object) => string, setStatus: (t: string) => void, htmlErrors: () => string[] }>}
 */
export async function mountEmailEditor(form, { key, defaults }) {
  const preview = form.querySelector('[data-preview]')
  const status = form.querySelector('[data-status]')
  const hint = form.querySelector('[data-body-hint]')
  const issuesList = form.querySelector('[data-body-issues]')

  const readFields = () => Object.fromEntries(FIELDS.map(([name]) => [name, form.elements[name].value.trim()]))
  const render = (fields = readFields()) => newsletterEmailHtml(fields, BRAND.whatsapp)
  const check = () => (form.elements.bodyMode.value === 'html' ? checkEmailHtml(form.elements.body.value) : { errors: [], warnings: [] })
  const refresh = () => {
    hint.textContent = BODY_HINT[form.elements.bodyMode.value]
    const { errors, warnings } = check()
    issuesList.innerHTML = errors.map(t => `<li class="text-bad font-medium">✕ ${esc(t)}</li>`).join('')
      + warnings.map(t => `<li class="text-muted">! ${esc(t)}</li>`).join('')
    preview.srcdoc = render().replaceAll(UNSUB_PLACEHOLDER, '#')
  }

  const { data: saved, error } = await getEmailTemplate(key)
  const fields = { ...defaults, ...(saved?.fields || {}) }
  FIELDS.forEach(([name]) => { form.elements[name].value = fields[name] ?? '' })
  if (!form.elements.bodyMode.value) form.elements.bodyMode.value = 'text'
  refresh()
  form.addEventListener('input', refresh)

  return { saved, error, readFields, render, setStatus: (t) => { status.textContent = t }, htmlErrors: () => check().errors }
}

export const savedAt = (date) => `Guardado el ${new Date(date).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`
