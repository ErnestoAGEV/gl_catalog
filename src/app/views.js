import { layoutAdmin, layoutPublic } from '../components/layout.js'
import { adminLogout } from './store.js'
import { navigate } from './router.js'
import { pageHome } from '../pages/home.js'
import { pageCatalog } from '../pages/catalog.js'
import { pageCart } from '../pages/cart.js'
import { pageCheckout } from '../pages/checkout.js'
import { pageAdminLogin } from '../pages/adminLogin.js'
import { pageAdminProducts } from '../pages/adminProducts.js'
import { pageAdminDashboard } from '../pages/adminDashboard.js'
import { pageAdminOrders } from '../pages/adminOrders.js'
import { pageAdminCoupons } from '../pages/adminCoupons.js'
import { pageAdminNewsletter } from '../pages/adminNewsletter.js'

const publicRoutes = {
  '/': pageHome,
  '/catalog': pageCatalog,
  '/cart': pageCart,
  '/checkout': pageCheckout,
}

const adminRoutes = {
  '/admin': pageAdminDashboard,
  '/admin/login': pageAdminLogin,
  '/admin/dashboard': pageAdminDashboard,
  '/admin/products': pageAdminProducts,
  '/admin/orders': pageAdminOrders,
  '/admin/coupons': pageAdminCoupons,
  '/admin/newsletter': pageAdminNewsletter,
}

export function renderRoute(path, state) {
  const [basePath] = path.split('?') // Ignore query params for routing
  const isAdmin = basePath.startsWith('/admin')
  const routes = isAdmin ? adminRoutes : publicRoutes
  const page = routes[basePath] || (isAdmin ? pageAdminLogin : pageHome)

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
