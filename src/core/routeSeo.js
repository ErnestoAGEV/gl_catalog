// Metadatos SEO por ruta. Modulo puro (sin DOM): lo usan tanto el runtime
// (views.js) como el prerender de build (scripts/prerender.mjs).

import { findProductByPath, productDescription, productPath, productTitle } from '../utils/productCopy.js'
import { findBrandBySlug } from '../utils/brands.js'

// "Camisas para hombre", no "Camisas en Colima": la tienda vende a todo Mexico
// (decision del dueno, oct-2026). Colima vive solo en las paginas de sucursal.
export function categoryLabel(category) {
  const label = category.replace(/,/g, ' y ')
  return /dama/i.test(label) ? label : `${label} para hombre`
}

export function getSeoForRoute(path, basePath, state) {
  if (basePath === '/') {
    return {
      // El slogan va primero: es lo que se ve en la pestana. Lo de despues es lo
      // que le dice a Google (y a quien lee el resultado) que vende.
      title: 'G&L Boutique | Tu fit perfecto · Ropa de marca para hombre',
      description: 'Camisas, polos, jeans, zapatos y perfumes de marca para hombre. Envío a todo México, gratis desde $1,499, y atención personal por WhatsApp. Desde 1995.',
      canonicalPath: '/',
      robots: 'index,follow',
    }
  }

  if (basePath === '/catalog') {
    return {
      title: 'Catálogo de ropa para hombre | G&L',
      description: 'Camisas, polos, jeans, zapatos y perfumes de marca para hombre. Envío a todo México; compra en línea o por WhatsApp.',
      canonicalPath: '/catalog',
      robots: 'index,follow',
    }
  }

  if (basePath.startsWith('/categoria/')) {
    const category = decodeURIComponent(basePath.split('/categoria/')[1] || '')
    // Solo con el catalogo ya cargado: mientras llega no se sabe si existe, y
    // marcar noindex una categoria real por llegar antes que la base seria peor.
    const publicos = (state?.products || []).filter((p) => p.badge !== 'Borrador')
    const tipos = new Set(publicos.map((p) => p.type))
    if (publicos.length && !state.isLoading && !category.split(',').some((c) => tipos.has(c.trim()))) {
      return {
        title: 'Categoría no encontrada | G&L',
        description: 'Esa categoría no está en el catálogo. Mira lo que hay ahora en la tienda.',
        canonicalPath: '/catalog',
        robots: 'noindex,follow',
      }
    }
    return {
      title: `${categoryLabel(category)} | G&L`,
      description: `${categoryLabel(category)} de las mejores marcas. Envío a todo México, gratis desde $1,499, y atención por WhatsApp.`,
      canonicalPath: basePath,
      robots: 'index,follow',
    }
  }

  if (basePath.startsWith('/marca/')) {
    const marca = findBrandBySlug(state?.products || [], basePath.split('/marca/')[1])
    if (marca) {
      return {
        title: `${marca.name} para hombre | G&L`,
        description:
          `${marca.items.length} piezas de ${marca.name} para hombre. ` +
          `Precios, tallas y envío a todo México; compra en línea o por WhatsApp.`,
        canonicalPath: basePath,
        robots: 'index,follow',
      }
    }
    // Un slug que no corresponde a ninguna marca con pagina no debe indexarse
    // ni declarar un canonical inventado: mismo criterio que el shell de la SPA.
    return {
      title: 'Marca no encontrada | G&L',
      description: 'Esa marca no está en el catálogo. Mira lo que hay ahora en la tienda.',
      canonicalPath: '/catalog',
      robots: 'noindex,follow',
    }
  }

  if (basePath.startsWith('/producto/')) {
    const product = findProductByPath(state?.products, basePath.split('/producto/')[1])

    if (product) {
      return {
        title: productTitle(product),
        description: productDescription(product),
        canonicalPath: productPath(product),
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

  const infoSeo = {
    '/sucursales': {
      title: 'Tiendas de ropa para hombre en Colima y Villa de Álvarez | G&L',
      description: 'Visítanos en el Centro de Colima o en Villa de Álvarez: el mismo surtido en las dos. Direcciones, horarios y cómo llegar.',
    },
    '/sucursales/colima-centro': {
      title: 'Tienda de ropa para hombre en el Centro de Colima | G&L',
      description: 'Zaragoza 140 esquina con Álvaro Obregón, junto al estacionamiento Zaragoza. Wrangler, Lee, Oggi, Branigans, zapatos y perfumes. Horario y cómo llegar.',
    },
    '/sucursales/villa-de-alvarez': {
      title: 'Tienda de ropa para hombre en Villa de Álvarez | G&L',
      description: 'María Ahumada de Gómez 30, local 6, con horario corrido de 9:00 a 20:00. Wrangler, Lee, Oggi, Branigans, zapatos y perfumes para hombre.',
    },
    '/nosotros': {
      title: 'Nosotros | Boutique de ropa para hombre desde 1995 | G&L',
      description: 'G&L viste hombres desde 1995. Empezamos en Colima y hoy enviamos a todo México: marcas escogidas a mano y atención personal por WhatsApp.',
    },
    '/envios': {
      title: 'Envíos y formas de pago | G&L',
      description: 'Envío $150 MXN a todo México, gratis desde $1,499. Entrega en 3 a 4 días hábiles. Efectivo, transferencia, tarjeta y link de pago.',
    },
    '/cambios': {
      title: 'Cambios y garantía | G&L',
      description: 'Cambia tu prenda dentro de los 8 días siguientes a la entrega. Si el error fue nuestro, el envío corre por nuestra cuenta.',
    },
    '/contacto': {
      title: 'Contacto y sucursales en Colima | G&L',
      description: 'Escríbenos por WhatsApp o visítanos en Colima Centro y Villa de Álvarez. Horarios, direcciones y cómo llegar.',
    },
  }

  if (infoSeo[basePath]) {
    return { ...infoSeo[basePath], canonicalPath: basePath, robots: 'index,follow' }
  }

  if (basePath === '/cart') {
    return {
      title: 'Tu bolsa | G&L',
      description: 'Revisa los productos de tu bolsa de G&L antes de cerrar tu pedido por WhatsApp.',
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

  // Ruta desconocida: antes caía aquí con canonical '/' e index,follow, asi que
  // cada URL rota se indexaba como copia de la home.
  return {
    title: 'Página no encontrada | G&L',
    description: 'La página que buscas no existe. Explora el catálogo de G&L.',
    canonicalPath: basePath,
    robots: 'noindex,follow',
  }
}
