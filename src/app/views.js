import { layoutAdmin, layoutPublic } from '../components/layout.js'
import { pageHome } from '../pages/home.js'
import { pageCatalog } from '../pages/catalog.js'
import { pageCart } from '../pages/cart.js'
import { pageCheckout } from '../pages/checkout.js'
import { pageWishlist } from '../pages/wishlist.js'
import { pageAdminLogin } from '../pages/adminLogin.js'
import { pageAdminProducts } from '../pages/adminProducts.js'

const publicRoutes = {
  '/': pageHome,
  '/catalog': pageCatalog,
  '/cart': pageCart,
  '/checkout': pageCheckout,
  '/wishlist': pageWishlist,
}

const adminRoutes = {
  '/admin/login': pageAdminLogin,
  '/admin/products': pageAdminProducts,
}

export function renderRoute(path, state) {
  const isAdmin = path.startsWith('/admin')
  const routes = isAdmin ? adminRoutes : publicRoutes
  const page = routes[path] || (isAdmin ? pageAdminLogin : pageHome)

  const view = page(state)
  const title = view.title

  if (isAdmin) {
    return {
      title,
      html: layoutAdmin({ title, contentHtml: view.html, state }),
      onMount: view.onMount,
    }
  }

  return {
    title,
    html: layoutPublic({ title, contentHtml: view.html, state }),
    onMount: view.onMount,
  }
}
