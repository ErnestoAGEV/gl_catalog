import { getAdminCoupons } from '../app/store.js'

export function pageAdminCoupons(state) {
  const html = `
    <div class="animate-fade-in space-y-6">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-manrope font-bold text-gray-900 dark:text-white">Cupones</h1>
          <p class="text-gray-500 mt-1">Gestión de descuentos y promociones</p>
        </div>
        <button class="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Crear Cupón
        </button>
      </div>
      
      <div id="coupons-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         <!-- Loader -->
         <div class="col-span-full py-12 text-center text-gray-400">
            <div class="animate-pulse flex flex-col items-center">
               <svg class="w-8 h-8 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
               <span>Cargando cupones...</span>
            </div>
         </div>
      </div>
    </div>
  `
  return { 
    title: 'Cupones | G&L Admin', 
    html,
    async onMount(root) {
      const listEl = root.querySelector('#coupons-list')
      if (!listEl) return
      
      const coupons = await getAdminCoupons()
      
      if (coupons.length === 0) {
        listEl.innerHTML = `
          <div class="col-span-full py-12 text-center text-gray-500">
            <div class="w-16 h-16 mx-auto bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
            </div>
            <p>No hay cupones activos actualmente.</p>
          </div>
        `
        return
      }

      listEl.innerHTML = coupons.map(coupon => `
         <div class="${coupon.active ? 'bg-brand/5 border-brand/20' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 opacity-60'} rounded-2xl border p-6 relative overflow-hidden group">
           <div class="flex items-center justify-between mb-4">
             <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">${coupon.active ? 'Activo' : 'Inactivo'}</span>
             <button class="text-gray-400 hover:text-red-500 transition-colors" title="Borrar cupón">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
             </button>
           </div>
           <h3 class="text-xl font-bold font-manrope ${coupon.active ? 'text-brand' : 'text-gray-800 dark:text-gray-300'} mb-1">${coupon.code}</h3>
           <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">${coupon.label} ${coupon.free_shipping ? '(Envío Gratis)' : ''}</p>
           <div class="pt-4 border-t ${coupon.active ? 'border-brand/10' : 'border-gray-200 dark:border-gray-700'} text-xs text-gray-500 flex justify-between">
             <span>Creado el ${new Date(coupon.created_at).toLocaleDateString()}</span>
           </div>
         </div>
      `).join('')
    }
  }
}
