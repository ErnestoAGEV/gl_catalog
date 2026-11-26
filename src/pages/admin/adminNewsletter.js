import { getAdminSubscribers, saveEmailTemplate, sendNewsletter, getLastCampaign } from '../../store/index.js'
import { escapeHtml as esc } from '../../utils/sanitize.js'
import { csvRow } from '../../utils/csv.js'
import { showToast } from '../../utils/toast.js'
import { ICON, statCard } from './adminIcons.js'
import { confirmDelete } from './adminConfirm.js'
import { CAMPAIGN_DEFAULTS } from './newsletterEmail.js'
import { emailEditorHtml, mountEmailEditor, savedAt } from './adminEmailEditor.js'

const TEST_EMAIL_KEY = 'gl_newsletter_test_email'
const isActive = (s) => Boolean(s.confirmed_at) && !s.unsubscribed_at
// Pendiente = se suscribió pero no ha pulsado el enlace del correo de confirmación
const statusOf = (s) => s.unsubscribed_at ? 'Dado de baja' : s.confirmed_at ? 'Activo' : 'Pendiente'
const STATUS_TONE = { Activo: ['text-ok bg-ok-tint', 'bg-ok'], Pendiente: ['text-warn bg-warn-tint', 'bg-warn'], 'Dado de baja': ['text-muted bg-canvas', 'bg-line-strong'] }
const FREE_DAILY_LIMIT = 100 // plan gratis de Resend
const people = (n) => `${n} ${n === 1 ? 'persona' : 'personas'}`

function formatSubscriberDate(sub) {
  const raw = sub?.created_at || sub?.subscribed_at || sub?.createdAt || sub?.subscribedAt || sub?.updated_at || sub?.updatedAt
  if (!raw) return 'Sin fecha'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatSubscriberTime(sub) {
  const raw = sub?.created_at || sub?.subscribed_at || sub?.createdAt || sub?.subscribedAt || sub?.updated_at || sub?.updatedAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function avatarInitials(email) {
  return (email.split('@')[0].slice(0, 2) || '??').toUpperCase()
}

function avatarColor(email) {
  const colors = ['#214FC7', '#1E9E6A', '#C9821A', '#D6453E', '#7C3AED', '#0891B2', '#BE185D', '#4F46E5']
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0
  return colors[Math.abs(hash) % colors.length]
}

export function pageAdminNewsletter(state) {
  return {
    title: 'Newsletter | G&L Admin',
    html: `
      <div class="admin-view-in space-y-6">
        <!-- KPIs -->
        <div id="nl-kpis" class="grid grid-cols-1 sm:grid-cols-3 gap-4 admin-stagger">
          ${statCard({ eyebrow: 'Total suscritos', value: '—', icon: 'mail', foot: 'Cargando...' })}
          ${statCard({ eyebrow: 'Nuevos (7 días)', value: '—', icon: 'trendUp', accent: '#1E9E6A' })}
          ${statCard({ eyebrow: 'Top dominio', value: '—', icon: 'users' })}
        </div>

        <!-- Toolbar + table -->
        <div class="bg-paper rounded-3xl border border-line shadow-card">
          <div class="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-line">
            <div class="relative flex-1 min-w-0">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">${ICON.search('w-[18px] h-[18px]')}</span>
              <input id="nl-search" placeholder="Buscar por email..." class="adm-fld pl-10" />
            </div>
            <button id="nl-export" class="adm-btn adm-btn-ghost">${ICON.arrowUpR('w-4 h-4')} Exportar CSV</button>
          </div>

          <!-- Desktop table -->
          <div class="hidden md:block overflow-x-auto adm-scroll-thin">
            <table class="w-full min-w-[560px]">
              <thead>
                <tr class="text-left">
                  <th class="eyebrow text-faint font-medium px-5 py-3">Suscriptor</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3">Fecha registro</th>
                  <th class="eyebrow text-faint font-medium px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody id="nl-tbody"></tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div id="nl-mobile" class="md:hidden divide-y divide-line"></div>

          <!-- Footer -->
          <div id="nl-footer" class="px-5 py-3 border-t border-line text-[12.5px] text-muted tnum"></div>
        </div>

        ${emailEditorHtml({
          id: 'cp-form',
          title: 'Enviar correo a suscriptores',
          subtitle: 'Llega a las personas que confirmaron su suscripción y no se han dado de baja.',
          actions: `
            <button type="button" data-draft class="adm-btn adm-btn-ghost" disabled>Guardar borrador</button>
            <input name="testEmail" type="email" placeholder="Correo para la prueba" aria-label="Correo para la prueba" class="adm-fld sm:w-52" />
            <button type="button" data-test class="adm-btn adm-btn-ghost" disabled>Enviarme una prueba</button>
            <button type="submit" data-submit class="adm-btn adm-btn-primary" disabled>${ICON.mail('w-4 h-4')} Enviar</button>
            <p data-campaign class="basis-full text-[12.5px] text-muted" aria-live="polite"></p>`,
        })}

      </div>
    `,

    async onMount(root) {
      const tbody = root.querySelector('#nl-tbody')
      const mobileList = root.querySelector('#nl-mobile')
      const kpis = root.querySelector('#nl-kpis')
      const footer = root.querySelector('#nl-footer')
      const searchInput = root.querySelector('#nl-search')
      const exportBtn = root.querySelector('#nl-export')

      tbody.innerHTML = `<tr><td colspan="3" class="px-5 py-12 text-center text-faint"><div class="animate-pulse">${ICON.mail('w-8 h-8 mx-auto mb-2 text-line-strong')}<p class="text-[13px]">Cargando suscriptores...</p></div></td></tr>`
      mobileList.innerHTML = `<div class="px-5 py-12 text-center text-faint animate-pulse">${ICON.mail('w-8 h-8 mx-auto mb-2 text-line-strong')}<p class="text-[13px]">Cargando...</p></div>`

      const subscribers = await getAdminSubscribers()
      setupCampaign(root.querySelector('#cp-form'), subscribers.filter(isActive).length)

      // ── KPI calculations ──
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const newThisWeek = subscribers.filter(s => {
        const d = new Date(s.created_at || s.subscribed_at || s.createdAt || s.subscribedAt || '')
        return !Number.isNaN(d.getTime()) && d >= weekAgo
      }).length

      const domains = {}
      subscribers.forEach(s => {
        const d = (s.email || '').split('@')[1] || 'desconocido'
        domains[d] = (domains[d] || 0) + 1
      })
      const topDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0]

      kpis.innerHTML = `
        ${statCard({ eyebrow: 'Suscritos activos', value: subscribers.filter(isActive).length.toLocaleString(), icon: 'mail', foot: `${subscribers.filter(s => statusOf(s) === 'Pendiente').length} pendientes · ${subscribers.filter(s => s.unsubscribed_at).length} dados de baja` })}
        ${statCard({ eyebrow: 'Nuevos (7 días)', value: newThisWeek.toString(), icon: 'trendUp', delta: newThisWeek > 0 ? `+${newThisWeek}` : '0', deltaDir: newThisWeek > 0 ? 'up' : 'flat', accent: '#1E9E6A' })}
        ${statCard({ eyebrow: 'Top dominio', value: topDomain ? `@${topDomain[0]}` : '—', icon: 'users', foot: topDomain ? `${topDomain[1]} suscriptores` : '' })}
      `

      let searchTerm = ''

      const render = () => {
        const term = searchTerm.toLowerCase()
        const filtered = subscribers.filter(s => !term || s.email.toLowerCase().includes(term))

        if (!filtered.length) {
          const msg = searchTerm ? 'Sin resultados' : 'Aún no hay suscriptores'
          const sub = searchTerm ? 'Prueba con otro email' : 'Los suscriptores aparecerán aquí'
          tbody.innerHTML = `<tr><td colspan="3" class="px-5 py-16 text-center"><div>${ICON.mail('w-10 h-10 mx-auto mb-3 text-line-strong')}<p class="text-[14px] font-semibold text-body mb-1">${msg}</p><p class="text-[12.5px] text-muted">${sub}</p></div></td></tr>`
          mobileList.innerHTML = `<div class="px-5 py-16 text-center">${ICON.mail('w-10 h-10 mx-auto mb-3 text-line-strong')}<p class="text-[14px] font-semibold text-body">${msg}</p></div>`
          footer.textContent = `0 de ${subscribers.length} suscriptores`
          return
        }

        tbody.innerHTML = filtered.map(sub => {
          const status = statusOf(sub)
          return `<tr class="border-t border-line hover:bg-canvas transition-colors">
            <td class="px-5 py-3"><div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[13px] font-bold uppercase shrink-0">${esc(sub.email[0])}</div>
              <span class="text-[13.5px] font-medium text-ink truncate">${esc(sub.email)}</span>
            </div></td>
            <td class="px-5 py-3"><span class="text-[13px] text-muted tnum">${formatSubscriberDate(sub)}</span> <span class="text-[11px] text-faint">${formatSubscriberTime(sub)}</span></td>
            <td class="px-5 py-3"><span class="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[11px] font-semibold ${STATUS_TONE[status][0]}"><span class="w-1.5 h-1.5 rounded-full ${STATUS_TONE[status][1]}"></span>${status}</span></td>
          </tr>`
        }).join('')

        mobileList.innerHTML = filtered.map(sub => {
          const status = statusOf(sub)
          return `<div class="px-4 py-3 hover:bg-canvas transition-colors"><div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[13px] font-bold uppercase shrink-0">${esc(sub.email[0])}</div>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-medium text-ink truncate">${esc(sub.email)}</p>
              <p class="text-[11.5px] text-faint mt-0.5 tnum">${formatSubscriberDate(sub)}</p>
            </div>
            <span class="inline-flex items-center gap-1 px-2 h-[20px] rounded-full text-[10px] font-semibold ${STATUS_TONE[status][0]} shrink-0">${status}</span>
          </div></div>`
        }).join('')

        footer.textContent = searchTerm ? `${filtered.length} de ${subscribers.length} suscriptores` : `${subscribers.length} suscriptores`
      }

      render()

      searchInput?.addEventListener('input', (e) => { searchTerm = e.target.value.trim(); render() })

      exportBtn?.addEventListener('click', () => {
        if (!subscribers.length) return
        const rows = [csvRow(['Email', 'Fecha de registro', 'Estado']), ...subscribers.map(s => csvRow([s.email, formatSubscriberDate(s), statusOf(s)]))].join('\n')
        const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `gl-newsletter-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      })
    }
  }
}

async function setupCampaign(form, activeCount) {
  const buttons = [...form.querySelectorAll('[data-draft], [data-test], [data-submit]')]
  const testInput = form.elements.testEmail
  try { testInput.value = localStorage.getItem(TEST_EMAIL_KEY) || '' } catch { /* sin storage */ }
  const editor = await mountEmailEditor(form, { key: 'campaign', defaults: CAMPAIGN_DEFAULTS })
  if (editor.saved) editor.setStatus(`Borrador: ${savedAt(editor.saved.updated_at).toLowerCase()}`)

  // Estado del último envío; mientras queden correos en cola se consulta cada 10 s.
  const campaignLine = form.querySelector('[data-campaign]')
  let poll = null
  const showCampaign = async () => {
    clearTimeout(poll)
    const c = await getLastCampaign()
    if (!form.isConnected) return
    if (!c) { poll = setTimeout(showCampaign, 30000); return } // fallo de red o aún sin envíos
    const when = new Date(c.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    const parts = [`${c.delivered} entregados a Resend`]
    if (c.failed) parts.push(`${c.failed} fallidos`)
    if (c.pending) parts.push(`${c.pending} en cola`)
    campaignLine.textContent = `Último envío, "${c.subject}" (${when}): ${parts.join(', ')} de ${c.total}.`
    if (c.pending) poll = setTimeout(showCampaign, 10000)
  }
  showCampaign()

  // Corre una accion con los botones bloqueados para que no se dispare dos veces.
  const busy = async (fn) => {
    buttons.forEach(b => { b.disabled = true })
    try { await fn() } finally { buttons.forEach(b => { b.disabled = false }) }
  }
  const message = () => {
    const f = editor.readFields()
    return { f, subject: f.subject, html: editor.render(f) }
  }
  const ready = () => {
    const m = message()
    if (!m.subject || !m.f.title) { showToast('El asunto y el título son obligatorios', 'error'); return null }
    if (editor.htmlErrors().length) { showToast('Corrige el HTML del mensaje antes de enviar', 'error'); return null }
    return m
  }
  const saveDraft = (m) => saveEmailTemplate('campaign', { subject: m.subject || '(sin asunto)', html: m.html, fields: m.f, enabled: false })

  form.querySelector('[data-draft]').addEventListener('click', () => busy(async () => {
    const { error } = await saveDraft(message())
    if (error) return showToast('No se pudo guardar el borrador', 'error')
    editor.setStatus(`Borrador: ${savedAt(Date.now()).toLowerCase()}`)
    showToast('Borrador guardado', 'success')
  }))

  form.querySelector('[data-test]').addEventListener('click', () => busy(async () => {
    const m = ready()
    if (!m) return
    const testEmail = testInput.value.trim()
    if (!testInput.checkValidity() || !testEmail) { testInput.focus(); return showToast('Escribe el correo donde quieres la prueba', 'error') }
    try { localStorage.setItem(TEST_EMAIL_KEY, testEmail) } catch { /* sin storage */ }
    const { error } = await sendNewsletter({ subject: `[Prueba] ${m.subject}`, html: m.html, testEmail })
    if (error) return showToast(error, 'error')
    showToast(`Prueba solicitada a ${testEmail}: revisa tu bandeja en un minuto`, 'success')
  }))

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (form.querySelector('[data-submit]').disabled) return
    busy(async () => {
      const m = ready()
      if (!m) return
      if (!activeCount) return showToast('Aún no hay suscriptores activos', 'error')
      const overLimit = activeCount > FREE_DAILY_LIMIT
        ? ` Ojo: el plan gratis de Resend manda ${FREE_DAILY_LIMIT} correos al día; con más necesitas el plan de pago o algunos no saldrán.`
        : ''
      const ok = await confirmDelete({
        title: `¿Enviar a ${people(activeCount)}?`,
        message: `"${m.subject}" llegará a todos los suscriptores activos. Un envío no se puede deshacer.${overLimit}`,
        confirmLabel: 'Enviar ahora',
        icon: 'mail',
      })
      if (!ok) return
      await saveDraft(m) // queda como referencia de lo último que se mandó
      const { count, error } = await sendNewsletter({ subject: m.subject, html: m.html })
      if (error) return showToast(error, 'error')
      showToast(`En camino a ${people(count)}`, 'success')
      showCampaign()
    })
  })

  if (editor.error) return editor.setStatus('No se pudo cargar el borrador. Recarga la página para editarlo.')
  buttons.forEach(b => { b.disabled = false })
}
