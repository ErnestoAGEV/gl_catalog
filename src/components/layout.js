import { BRAND } from '../app/config.js'

function container(children, theme = 'dark') {
  const isDark = theme === 'dark'
  return `<div class="min-h-dvh ${isDark ? 'bg-black text-white' : 'bg-white text-gray-900'}">
    ${children}
  </div>`
}

export function layoutPublic({ contentHtml, state }) {
  const count = (state.cart || []).reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
  const wishlistCount = (state.wishlist || []).length
  const theme = state.theme || 'dark'
  const isDark = theme === 'dark'

  return container(`
    <!-- Free Shipping Banner -->
    <div class="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-center py-2 px-4">
      <p class="text-xs font-medium flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
        </svg>
        <span>Envío GRATIS en compras +$${BRAND.freeShippingMin} MXN</span>
      </p>
    </div>

    <header class="sticky top-0 z-30 ${isDark ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-lg border-b ${isDark ? 'border-gray-800/50' : 'border-gray-200'}">
      <!-- Search Bar -->
      <div class="mx-auto w-full max-w-screen-sm px-4 pt-3">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="search" 
            id="global-search"
            placeholder="Buscar productos..." 
            class="w-full pl-10 pr-4 py-2.5 rounded-full ${isDark ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400'} border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      <!-- Navigation -->
      <div class="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
        <a href="#/" class="text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}">
          G&L
        </a>
        <nav class="flex items-center gap-3">
          <a class="text-sm ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors" href="#/catalog">
            Tienda
          </a>

          <!-- Wishlist -->
          <a class="relative p-1.5 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors" href="#/wishlist" title="Favoritos">
            <svg class="w-5 h-5" fill="${wishlistCount > 0 ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            ${wishlistCount > 0 ? `<span class="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">${wishlistCount}</span>` : ''}
          </a>

          <!-- Cart -->
          <a class="relative p-1.5 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors" href="#/cart" title="Carrito">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            ${count > 0 ? `<span class="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">${count}</span>` : ''}
          </a>

          <!-- Theme Toggle -->
          <button id="theme-toggle" class="p-1.5 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors" title="Cambiar tema">
            ${isDark 
              ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
              : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`
            }
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-sm px-4 py-5 pb-24">
      ${contentHtml}
    </main>

    <footer class="${isDark ? 'bg-gray-950 border-gray-800/50' : 'bg-gray-100 border-gray-200'} border-t">
      <div class="mx-auto w-full max-w-screen-sm px-4 py-8">
        <div class="flex flex-col items-center text-center">
          <span class="text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2">G&L</span>
          <p class="text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mb-4">Moda masculina · Colima, México</p>
          
          <div class="flex items-center gap-4 mb-6">
            <a href="https://wa.me/${BRAND.whatsapp}" target="_blank" class="w-10 h-10 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} flex items-center justify-center transition-colors">
              <svg class="w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" class="w-10 h-10 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} flex items-center justify-center transition-colors">
              <svg class="w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>

          <div class="flex flex-wrap justify-center gap-4 mb-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}">
            <a href="#/catalog" class="hover:underline">Catálogo</a>
            <a href="#/cart" class="hover:underline">Carrito</a>
            <a href="https://wa.me/${BRAND.whatsapp}" target="_blank" class="hover:underline">Contacto</a>
          </div>

          <div class="text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}">
            © 2026 ${BRAND.name}. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  `, theme)
}

export function layoutAdmin({ contentHtml, state }) {
  const authed = Boolean(state?.adminSession?.ok)
  return container(`
    <header class="sticky top-0 z-30 bg-black/90 backdrop-blur-lg border-b border-gray-800/50">
      <div class="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-white">G&L</span>
          <span class="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">Admin</span>
        </div>
        ${
          authed
            ? `<button id="admin-logout" class="text-sm text-gray-400 hover:text-white transition-colors">
                Salir
              </button>`
            : ''
        }
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-sm px-4 py-5">
      ${contentHtml}
    </main>
  `)
}
