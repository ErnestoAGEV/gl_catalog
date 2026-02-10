import { BRAND } from '../app/config.js'
import { getSearchQuery } from '../app/store.js'

function container(children, theme = 'dark') {
  const isDark = theme === 'dark'
  return `<div class="min-h-dvh overflow-x-hidden ${isDark ? 'bg-black text-white' : 'bg-white text-gray-900'}">
    ${children}
  </div>`
}

export function layoutPublic({ contentHtml, state, showSearch = false, noPaddingTop = false }) {
  const count = (state.cart || []).reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
  const theme = state.theme || 'dark'
  const isDark = theme === 'dark'

  const searchBarHtml = showSearch ? `
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
            value="${getSearchQuery() || ''}"
            class="w-full lg:w-96 pl-10 pr-4 py-2 md:py-2.5 rounded-full ${isDark ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400'} border text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all focus:w-full lg:focus:w-[28rem]"
          />
        </div>
      </div>
  ` : ''

  return container(`
    <!-- Free Shipping Banner -->
    <div class="bg-brand text-white text-center py-2 px-4">
        <p class="text-xs font-medium flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
          </svg>
          <span>Envío GRATIS en compras +$${BRAND.freeShippingMin} MXN</span>
        </p>
      </div>

    <header class="sticky top-0 z-40 ${isDark ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-lg border-b ${isDark ? 'border-gray-800/50' : 'border-gray-200'}">
        ${searchBarHtml}
        <!-- Navigation -->
        <div class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-4 py-3">
        <a href="#/" class="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
          <img src="logo.png" alt="G&L" class="h-10 w-auto object-contain" />
        </a>
        <nav class="hidden md:flex items-center gap-6">
          <a class="text-sm font-medium ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all hover:-translate-y-0.5 relative group" href="#/catalog">
            Tienda
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand transition-all group-hover:w-full"></span>
          </a>

          <!-- Cart -->
          <a class="relative p-1.5 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all hover:scale-110" href="#/cart" title="Carrito">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            ${count > 0 ? `<span class="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">${count}</span>` : ''}
          </a>

          <!-- Theme Toggle -->
          <button id="theme-toggle" class="p-1.5 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all hover:scale-110 hover:rotate-12" title="Cambiar tema">
            ${isDark 
              ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
              : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`
            }
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-xl px-3 md:px-4 ${noPaddingTop ? 'pt-0' : 'pt-3 md:pt-5'} pb-24 md:pb-24 overflow-x-hidden mb-16 md:mb-0" id="main-content">
      ${contentHtml}
    </main>

    <footer class="${isDark ? 'bg-gray-950 border-gray-800/50' : 'bg-gray-100 border-gray-200'} border-t pb-20 md:pb-0">
      <div class="mx-auto w-full max-w-screen-sm px-4 py-8">
        <div class="flex flex-col items-center text-center">
          <span class="text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2">G&L</span>
          <p class="text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mb-4">Moda masculina · Colima, México</p>
          
          <div class="flex items-center gap-4 mb-6">
            <a href="https://wa.me/${BRAND.whatsapp}" target="_blank" class="w-10 h-10 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} flex items-center justify-center transition-colors">
              <svg class="w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/glboutiquecol/" target="_blank" class="w-10 h-10 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} flex items-center justify-center transition-colors">
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

    <!-- Mobile Bottom Navigation -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 ${isDark ? 'bg-black/80' : 'bg-white/90'} backdrop-blur-xl border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} pb-safe">
      <div class="flex items-center justify-around h-16">
        <a href="#/" class="flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors ${window.location.hash === '#/' || window.location.hash === '' ? 'text-brand' : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}">
          <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          Inicio
        </a>
        <a href="#/catalog" class="flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors ${window.location.hash.startsWith('#/catalog') ? 'text-brand' : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}">
          <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          Catálogo
        </a>
        <a href="#/cart" class="relative flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors ${window.location.hash.startsWith('#/cart') ? 'text-brand' : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}">
          <div class="relative">
             <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
             ${count > 0 ? `<span class="absolute -top-1 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white border-2 border-white dark:border-black">${count}</span>` : ''}
          </div>
          Carrito
        </a>
      </div>
    </nav>
  `, theme)
}

export function layoutAdmin({ contentHtml, state }) {
  const authed = Boolean(state?.adminSession?.ok)
  return `<div class="min-h-dvh overflow-x-hidden bg-gray-50 text-gray-900">
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div class="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
        <div class="flex items-center gap-4">
          <a href="#/" class="flex items-center gap-2 group" title="Ir a la tienda">
            <span class="text-lg font-bold text-gray-900 group-hover:text-brand transition-colors">G&L</span>
            <span class="text-xs px-2 py-0.5 rounded bg-brand/10 text-brand font-medium">Admin</span>
          </a>
          <a href="#/" class="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Ver Tienda
          </a>
        </div>
        ${
          authed
            ? `<button id="admin-logout" class="text-sm text-gray-500 hover:text-brand transition-colors">
                Salir
              </button>`
            : ''
        }
      </div>
    </header>
    <main class="mx-auto w-full max-w-screen-sm px-4 py-5">
      ${contentHtml}
    </main>
  </div>`
}
