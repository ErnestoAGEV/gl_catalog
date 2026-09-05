import { layoutAdmin, layoutPublic } from '../components/layout.js'
import { adminLogout, isAdminAuthed } from '../store/index.js'
import { lockScroll, unlockScroll } from '../utils/dom.js'
import { navigate } from './router.js'
import { pageHome } from '../pages/home/home.js'
import { pageCatalog } from '../pages/catalog/catalog.js'
import { pageProduct } from '../pages/product/product.js'
import { pageCart } from '../pages/cart/cart.js'
import { pageCheckout, pageCheckoutSuccess } from '../pages/checkout/checkout.js'
import { pageAdminLogin } from '../pages/admin/adminLogin.js'
import { pageNotFound } from '../pages/notFound/notFound.js'
import { getSeoForRoute } from './routeSeo.js'


const publicRoutes = {
  '/': pageHome,
  '/catalog': pageCatalog,
  '/cart': pageCart,
  '/checkout': pageCheckout,
  '/checkout/success': pageCheckoutSuccess,
}

// Lazy-loaded admin pages — solo se descargan cuando el usuario visita el panel
const lazyAdminRoutes = {
  '/admin':            () => import('../pages/admin/adminDashboard.js').then(m => m.pageAdminDashboard),
  '/admin/dashboard':  () => import('../pages/admin/adminDashboard.js').then(m => m.pageAdminDashboard),
  '/admin/products':   () => import('../pages/admin/adminProducts.js').then(m => m.pageAdminProducts),
  '/admin/categories': () => import('../pages/admin/adminCategories.js').then(m => m.pageAdminCategories),
  '/admin/orders':     () => import('../pages/admin/adminOrders.js').then(m => m.pageAdminOrders),
  '/admin/coupons':    () => import('../pages/admin/adminCoupons.js').then(m => m.pageAdminCoupons),
  '/admin/newsletter': () => import('../pages/admin/adminNewsletter.js').then(m => m.pageAdminNewsletter),
  '/admin/clientes':   () => import('../pages/admin/adminClientes.js').then(m => m.pageAdminClientes),
  '/admin/reportes':   () => import('../pages/admin/adminReportes.js').then(m => m.pageAdminReportes),
  '/admin/banners':    () => import('../pages/admin/adminBanners.js').then(m => m.pageAdminBanners),
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
  } else if (basePath.startsWith('/producto/')) {
    page = pageProduct
  } else if (basePath.startsWith('/categoria/')) {
    page = pageCatalog
  } else {
    page = publicRoutes[basePath] || pageNotFound
  }

  const view = page(state)
  const title = view.title
  const seo = getSeoForRoute(path, basePath, state)

  if (isAdmin) {
    return {
      title,
      seo,
      html: layoutAdmin({ title, contentHtml: view.html, state }),
      onMount: (root) => {
        // Ejecutar el onMount de la vista específica
        let viewCleanup = null
        if (view.onMount) {
          try {
            const maybePromise = view.onMount(root)
            if (maybePromise instanceof Promise) {
              maybePromise.catch(err => {
                console.error(`Error in async onMount for ${title}:`, err)
              })
            } else if (typeof maybePromise === 'function') {
              viewCleanup = maybePromise
            }
          } catch (err) {
            console.error(`Error in onMount for ${title}:`, err)
          }
        }
        
        // Manejar el Sidebar en móviles globalmente para todas las vistas Admin
        const sidebar = root.querySelector('#admin-sidebar')
        const overlay = root.querySelector('#admin-sidebar-overlay')
        const openBtn = root.querySelector('#admin-mobile-menu')
        const closeBtn = root.querySelector('#close-admin-sidebar')

        const openSidebar = () => {
          sidebar?.classList.remove('-translate-x-full')
          overlay?.classList.remove('hidden')
          lockScroll()
        }

        const closeSidebar = () => {
          sidebar?.classList.add('-translate-x-full')
          overlay?.classList.add('hidden')
          unlockScroll()
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

        // Devolver el cleanup de la vista: sin esto quedaban vivos los
        // suscriptores al store, los timers de pedidos y los modales que
        // viven en document.body.
        return viewCleanup
      },
    }
  }

  return {
    title,
    seo,
    html: layoutPublic({ title, contentHtml: view.html, state, showSearch: view.showSearch, noPaddingTop: view.noPaddingTop, hideHeaderOnMobile: view.hideHeaderOnMobile, fullWidth: view.fullWidth, forceLight: view.forceLight, hideHeader: view.hideHeader }),
    onMount: view.onMount,
  }
}
