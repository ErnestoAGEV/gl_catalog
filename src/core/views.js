import { layoutAdmin, layoutPublic } from '../components/layout.js'
import { adminLogout, isAdminAuthed } from '../store/index.js'
import { lockScroll, unlockScroll } from '../utils/dom.js'
import { navigate } from './router.js'
import { pageHome } from '../pages/home/home.js'
import { infoPages } from '../pages/info/infoData.js'
import { getSeoForRoute } from './routeSeo.js'


// Paginas de confianza: comparten renderer, se distinguen por la ruta.
// Las rutas salen de infoPages para no mantener la lista en dos sitios.
const infoRoutes = new Set(Object.keys(infoPages))

// Solo la home va en el bundle inicial: es la que llega primero y la que mide Google.
// Las demás se descargan al visitarlas (y en reposo, ver prefetchPublicPages).
const lazyPublic = {
  catalog: () => import('../pages/catalog/catalog.js').then(m => m.pageCatalog),
  product: () => import('../pages/product/product.js').then(m => m.pageProduct),
  cart: () => import('../pages/cart/cart.js').then(m => m.pageCart),
  checkout: () => import('../pages/checkout/checkout.js').then(m => m.pageCheckout),
  checkoutSuccess: () => import('../pages/checkout/checkout.js').then(m => m.pageCheckoutSuccess),
  unsubscribe: () => import('../pages/unsubscribe/unsubscribe.js').then(m => m.pageUnsubscribe),
  info: () => import('../pages/info/info.js').then(m => m.pageInfo),
  notFound: () => import('../pages/notFound/notFound.js').then(m => m.pageNotFound),
  adminLogin: () => import('../pages/admin/adminLogin.js').then(m => m.pageAdminLogin),
}

const publicRoutes = {
  '/catalog': lazyPublic.catalog,
  '/cart': lazyPublic.cart,
  '/checkout': lazyPublic.checkout,
  '/checkout/success': lazyPublic.checkoutSuccess,
  '/baja': lazyPublic.unsubscribe,
}

/** Tras pintar la home, baja en reposo las páginas a las que se suele ir, para que navegar siga siendo instantáneo. */
export function prefetchPublicPages() {
  if (location.pathname.startsWith('/admin')) return
  const run = () => ['catalog', 'product', 'cart', 'checkout'].forEach(k => lazyPublic[k]().catch(() => {}))
  // Tras el load: no compite con la foto del hero por la red
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 4000 }) : setTimeout(run, 1500))
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true })
}

// Lazy-loaded admin pages — solo se descargan cuando el usuario visita el panel
const lazyAdminRoutes = {
  '/admin':            () => import('../pages/admin/adminDashboard.js').then(m => m.pageAdminDashboard),
  '/admin/dashboard':  () => import('../pages/admin/adminDashboard.js').then(m => m.pageAdminDashboard),
  '/admin/products':   () => import('../pages/admin/adminProducts.js').then(m => m.pageAdminProducts),
  '/admin/categories': () => import('../pages/admin/adminCategories.js').then(m => m.pageAdminCategories),
  '/admin/size-guides': () => import('../pages/admin/adminSizeGuides.js').then(m => m.pageAdminSizeGuides),
  '/admin/orders':     () => import('../pages/admin/adminOrders.js').then(m => m.pageAdminOrders),
  '/admin/coupons':    () => import('../pages/admin/adminCoupons.js').then(m => m.pageAdminCoupons),
  '/admin/promociones': () => import('../pages/admin/adminPromotions.js').then(m => m.pageAdminPromotions),
  '/admin/newsletter': () => import('../pages/admin/adminNewsletter.js').then(m => m.pageAdminNewsletter),
  '/admin/clientes':   () => import('../pages/admin/adminClientes.js').then(m => m.pageAdminClientes),
  '/admin/reportes':   () => import('../pages/admin/adminReportes.js').then(m => m.pageAdminReportes),
  '/admin/banners':    () => import('../pages/admin/adminBanners.js').then(m => m.pageAdminBanners),
}

async function publicPage(basePath) {
  if (basePath === '/') return pageHome
  if (basePath.startsWith('/producto/')) return lazyPublic.product()
  if (basePath.startsWith('/categoria/') || basePath.startsWith('/marca/')) return lazyPublic.catalog()
  if (infoRoutes.has(basePath)) {
    const pageInfo = await lazyPublic.info()
    return (st) => pageInfo(st, basePath)
  }
  return (publicRoutes[basePath] || lazyPublic.notFound)()
}

/** Descarga el módulo de una ruta pública antes de ocultar la vista actual: así no hay pantalla en blanco al navegar. */
export function preloadRoute(path) {
  const [basePath] = path.split('?')
  if (basePath === '/admin/login') return lazyPublic.adminLogin()
  return basePath.startsWith('/admin') ? Promise.resolve() : publicPage(basePath)
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
      page = await lazyPublic.adminLogin()
    } else {
      // Lazy load: solo descarga el módulo admin cuando se necesita
      const loader = lazyAdminRoutes[basePath] || lazyAdminRoutes['/admin']
      page = await loader()
    }
  } else {
    page = await publicPage(basePath)
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
