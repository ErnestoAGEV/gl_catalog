import { layoutAdmin, layoutPublic } from '../components/layout.js'
import { adminLogout, isAdminAuthed } from './store.js'
import { navigate } from './router.js'
import { pageHome } from '../pages/home.js'
import { pageCatalog } from '../pages/catalog.js'
import { pageCart } from '../pages/cart.js'
import { pageCheckout } from '../pages/checkout.js'
import { pageAdminLogin } from '../pages/adminLogin.js'

const publicRoutes = {
  '/': pageHome,
  '/catalog': pageCatalog,
  '/cart': pageCart,
  '/checkout': pageCheckout,
}

// Lazy-loaded admin pages — solo se descargan cuando el usuario visita el panel
const lazyAdminRoutes = {
  '/admin':            () => import('../pages/adminDashboard.js').then(m => m.pageAdminDashboard),
  '/admin/dashboard':  () => import('../pages/adminDashboard.js').then(m => m.pageAdminDashboard),
  '/admin/products':   () => import('../pages/adminProducts.js').then(m => m.pageAdminProducts),
  '/admin/orders':     () => import('../pages/adminOrders.js').then(m => m.pageAdminOrders),
  '/admin/coupons':    () => import('../pages/adminCoupons.js').then(m => m.pageAdminCoupons),
  '/admin/newsletter': () => import('../pages/adminNewsletter.js').then(m => m.pageAdminNewsletter),
}

export async function renderRoute(path, state) {
  const [basePath] = path.split('?') // Ignore query params for routing
  const isAdmin = basePath.startsWith('/admin')

  // ── Guard de autenticación admin ──
  const isProtectedAdmin = isAdmin && basePath !== '/admin/login'
  if (isProtectedAdmin && !state.isAdminAuthed && !isAdminAuthed()) {
    return renderRoute('/admin/login', state)
  }

  let page
  if (isAdmin) {
    if (basePath === '/admin/login') {
      page = pageAdminLogin
    } else {
      // Lazy load: solo descarga el módulo admin cuando se necesita
      const loader = lazyAdminRoutes[basePath] || lazyAdminRoutes['/admin']
      page = await loader()
    }
  } else {
    page = publicRoutes[basePath] || pageHome
  }

  const view = page(state)
  const title = view.title

  if (isAdmin) {
    return {
      title,
      html: layoutAdmin({ title, contentHtml: view.html, state }),
      onMount: (root) => {
        // Ejecutar el onMount de la vista específica
        if (view.onMount) view.onMount(root)
        
        // Manejar el Sidebar en móviles globalmente para todas las vistas Admin
        const sidebar = root.querySelector('#admin-sidebar')
        const overlay = root.querySelector('#admin-sidebar-overlay')
        const openBtn = root.querySelector('#admin-mobile-menu')
        const closeBtn = root.querySelector('#close-admin-sidebar')

        const openSidebar = () => {
          sidebar?.classList.remove('-translate-x-full')
          overlay?.classList.remove('hidden')
          document.body.style.overflow = 'hidden'
        }

        const closeSidebar = () => {
          sidebar?.classList.add('-translate-x-full')
          overlay?.classList.add('hidden')
          document.body.style.overflow = ''
        }

        openBtn?.addEventListener('click', openSidebar)
        closeBtn?.addEventListener('click', closeSidebar)
        overlay?.addEventListener('click', closeSidebar)

        // Logout Global
        const logoutBtn = root.querySelector('#admin-logout')
        logoutBtn?.addEventListener('click', async () => {
          await adminLogout()
          navigate('/admin/login')
        })
      },
    }
  }

  return {
    title,
    html: layoutPublic({ title, contentHtml: view.html, state, showSearch: view.showSearch, noPaddingTop: view.noPaddingTop }),
    onMount: view.onMount,
  }
}
