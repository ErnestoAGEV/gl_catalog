import { getAdminSubscribers } from '../app/store.js'

function formatSubscriberDate(sub) {
  const raw = sub?.created_at
    || sub?.subscribed_at
    || sub?.createdAt
    || sub?.subscribedAt
    || sub?.updated_at
    || sub?.updatedAt

  if (!raw) return 'Sin fecha disponible'

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'Sin fecha disponible'

  return `${date.toLocaleDateString()} a las ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export function pageAdminNewsletter(state) {
  const html = `
    <div class="animate-fade-in space-y-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-manrope font-bold text-gray-900 dark:text-white">Newsletter</h1>
          <p class="text-gray-500 mt-1">Clientes suscritos a tus novedades</p>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de registro</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody id="newsletter-tbody" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td colspan="3" class="px-6 py-12 text-center text-gray-400">
                <div class="animate-pulse flex flex-col items-center">
                   <svg class="w-8 h-8 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                   <span>Cargando suscriptores...</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
  return { 
    title: 'Newsletter | G&L Admin', 
    html,
    async onMount(root) {
      const tbody = root.querySelector('#newsletter-tbody')
      if (!tbody) return
      
      const subscribers = await getAdminSubscribers()
      
      if (subscribers.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="3" class="px-6 py-12 text-center text-sm text-gray-500">
              <div class="w-16 h-16 mx-auto bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <p>Aún no hay suscriptores en la base de datos.</p>
            </td>
          </tr>
        `
        return
      }

      tbody.innerHTML = subscribers.map(sub => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold uppercase">
                ${sub.email.charAt(0)}
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900 dark:text-white">${sub.email}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-500 dark:text-gray-400">${formatSubscriberDate(sub)}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              Activo
            </span>
          </td>
        </tr>
      `).join('')
    }
  }
}
