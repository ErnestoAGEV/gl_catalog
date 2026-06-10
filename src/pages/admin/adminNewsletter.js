import { getAdminSubscribers } from '../../store/index.js'
import { ICON, statCard } from './adminIcons.js'

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
        ${statCard({ eyebrow: 'Total suscritos', value: subscribers.length.toLocaleString(), icon: 'mail', foot: 'Todos los registros' })}
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
          return `<tr class="border-t border-line hover:bg-canvas transition-colors">
            <td class="px-5 py-3"><div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[13px] font-bold uppercase shrink-0">${sub.email[0]}</div>
              <span class="text-[13.5px] font-medium text-ink truncate">${sub.email}</span>
            </div></td>
            <td class="px-5 py-3"><span class="text-[13px] text-muted tnum">${formatSubscriberDate(sub)}</span> <span class="text-[11px] text-faint">${formatSubscriberTime(sub)}</span></td>
            <td class="px-5 py-3"><span class="inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[11px] font-semibold text-ok bg-ok-tint"><span class="w-1.5 h-1.5 rounded-full bg-ok"></span>Activo</span></td>
          </tr>`
        }).join('')

        mobileList.innerHTML = filtered.map(sub => {
          return `<div class="px-4 py-3 hover:bg-canvas transition-colors"><div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[13px] font-bold uppercase shrink-0">${sub.email[0]}</div>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-medium text-ink truncate">${sub.email}</p>
              <p class="text-[11.5px] text-faint mt-0.5 tnum">${formatSubscriberDate(sub)}</p>
            </div>
            <span class="inline-flex items-center gap-1 px-2 h-[20px] rounded-full text-[10px] font-semibold text-ok bg-ok-tint shrink-0">Activo</span>
          </div></div>`
        }).join('')

        footer.textContent = searchTerm ? `${filtered.length} de ${subscribers.length} suscriptores` : `${subscribers.length} suscriptores`
      }

      render()

      searchInput?.addEventListener('input', (e) => { searchTerm = e.target.value.trim(); render() })

      exportBtn?.addEventListener('click', () => {
        if (!subscribers.length) return
        const rows = ['Email,Fecha de registro', ...subscribers.map(s => `${s.email},${formatSubscriberDate(s)}`)].join('\n')
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
