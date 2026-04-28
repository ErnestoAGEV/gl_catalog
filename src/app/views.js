import { layoutAdmin, layoutPublic } from '../components/layout.js'
import { adminLogout, isAdminAuthed } from './store.js'
import { navigate } from './router.js'
import { pageHome } from '../pages/home.js'
import { pageCatalog } from '../pages/catalog.js'
import { pageProduct } from '../pages/product.js'
import { pageCart } from '../pages/cart.js'
import { pageCheckout, pageCheckoutSuccess } from '../pages/checkout.js'
import { pageAdminLogin } from '../pages/adminLogin.js'

function getSeoForRoute(path, basePath, state) {
  if (basePath === '/') {
    return {
      title: 'G&L | Tu fit perfecto',
      description: 'Descubre ropa y accesorios para hombre en G&L: camisas, polos, jeans y perfumes con estilo moderno.',
      canonicalPath: '/',
      robots: 'index,follow',
    }
  }

  if (basePath === '/catalog') {
    return {
      title: 'Catalogo de Ropa para Hombre | G&L',
      description: 'Explora el catalogo de G&L con camisas, polos, jeans y perfumes para hombre. Compra facil y segura.',
      canonicalPath: '/catalog',
      robots: 'index,follow',
    }
  }

  if (basePath.startsWith('/categoria/')) {
    const category = decodeURIComponent(basePath.split('/categoria/')[1] || '')
    return {
      title: `${category.replace(/,/g, ' y ')} en Colima | G&L`,
      description: `Compra ${category.replace(/,/g, ' y ').toLowerCase()} para hombre con estilo premium en Colima. G&L Tu fit perfecto.`,
      canonicalPath: basePath,
      robots: 'index,follow',
    }
  }

  if (basePath.startsWith('/producto/')) {
    const productId = basePath.split('/producto/')[1]
    const product = state?.products?.find((item) => String(item.id) === String(productId || ''))

    if (product) {
      const productType = product.type || 'Moda masculina'
      return {
        title: `${product.name} | ${productType} | G&L`,
        description: `${product.name} disponible en G&L. Compra ${productType.toLowerCase()} para hombre con estilo premium en Colima.`,
        canonicalPath: `/producto/${product.id}`,
        robots: 'index,follow',
      }
    }

    return {
      title: 'Producto no encontrado | G&L',
      description: 'El producto que buscas no está disponible en nuestro catálogo.',
      canonicalPath: basePath,
      robots: 'noindex,follow',
    }
  }

  if (basePath === '/cart') {
    return {
      title: 'Carrito de Compra | G&L',
      description: 'Revisa los productos seleccionados en tu carrito de G&L antes de finalizar tu compra.',
      canonicalPath: '/cart',
      robots: 'noindex,follow',
    }
  }

  if (basePath === '/checkout') {
    return {
      title: 'Checkout | G&L',
      description: 'Finaliza tu pedido en G&L de forma segura y confirma tu compra por WhatsApp.',
      canonicalPath: '/checkout',
      robots: 'noindex,follow',
    }
  }

  if (basePath === '/checkout/success') {
    return {
      title: 'Pedido Confirmado | G&L',
      description: 'Tu pedido fue registrado correctamente en G&L. Gracias por tu compra.',
      canonicalPath: '/checkout/success',
      robots: 'noindex,nofollow',
    }
  }

  if (basePath.startsWith('/admin')) {
    return {
      title: 'Panel Administrativo | G&L',
      description: 'Area administrativa de G&L.',
      canonicalPath: basePath,
      robots: 'noindex,nofollow',
    }
  }

  return {
    title: 'G&L | Tu fit perfecto',
    description: 'Moda masculina premium en Colima. Compra camisas, polos, jeans y perfumes en G&L.',
    canonicalPath: '/',
    robots: 'index,follow',
  }
}

const publicRoutes = {
  '/': pageHome,
  '/catalog': pageCatalog,
  '/cart': pageCart,
  '/checkout': pageCheckout,
  '/checkout/success': pageCheckoutSuccess,
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
  } else if (basePath.startsWith('/producto/')) {
    page = pageProduct
  } else if (basePath.startsWith('/categoria/')) {
    page = pageCatalog
  } else {
    page = publicRoutes[basePath] || pageHome
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
        if (view.onMount) {
          try {
            const maybePromise = view.onMount(root)
            if (maybePromise instanceof Promise) {
              maybePromise.catch(err => {
                console.error(`Error in async onMount for ${title}:`, err)
              })
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
    seo,
    html: layoutPublic({ title, contentHtml: view.html, state, showSearch: view.showSearch, noPaddingTop: view.noPaddingTop, hideHeaderOnMobile: view.hideHeaderOnMobile }),
    onMount: view.onMount,
  }
}
