// Metadatos SEO por ruta. Modulo puro (sin DOM): lo usan tanto el runtime
// (views.js) como el prerender de build (scripts/prerender.mjs).

import { findProductByPath, productDescription, productPath, productTitle } from '../utils/productCopy.js'
import { findBrandBySlug } from '../utils/brands.js'

// "Camisas para hombre", no "Camisas en Colima": la ciudad en cada title se leia
// forzada. Colima vive en la descripcion y en las paginas de sucursal.
export function categoryLabel(category) {
  const label = category.replace(/,/g, ' y ')
  return /dama/i.test(label) ? label : `${label} para hombre`
}

export function getSeoForRoute(path, basePath, state) {
  if (basePath === '/') {
    return {
      title: 'G&L Boutique | Ropa y perfumes para hombre',
      description: 'Camisas, polos, jeans y perfumes de las mejores marcas. Dos tiendas en Colima desde 1995 y envío a todo México.',
      canonicalPath: '/',
      robots: 'index,follow',
    }
  }

  if (basePath === '/catalog') {
    return {
      title: 'Catálogo de ropa para hombre | G&L',
      description: 'Explora el catálogo de G&L: camisas, polos, jeans y perfumes para hombre. Compra en línea o por WhatsApp.',
      canonicalPath: '/catalog',
      robots: 'index,follow',
    }
  }

  if (basePath.startsWith('/categoria/')) {
    const category = decodeURIComponent(basePath.split('/categoria/')[1] || '')
    return {
      title: `${categoryLabel(category)} | G&L`,
      description: `${categoryLabel(category)} de las mejores marcas, con existencias en nuestras dos tiendas de Colima. Envío a todo México.`,
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
          `${marca.items.length} piezas de ${marca.name} con existencias en nuestras dos tiendas de Colima. ` +
          `Precios, tallas y compra por WhatsApp.`,
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
      title: 'Sucursales en Colima y Villa de Álvarez | G&L',
      description: 'Las dos tiendas físicas de G&L: Colima Centro y Villa de Álvarez. Direcciones, horarios y cómo llegar.',
    },
    '/sucursales/colima-centro': {
      title: 'Tienda de ropa para hombre en Colima Centro | G&L',
      description: 'G&L Colima Centro, Zaragoza 140 a media cuadra del Jardín Libertad. Camisas, polos, jeans y perfumes. Horarios y cómo llegar.',
    },
    '/sucursales/villa-de-alvarez': {
      title: 'Tienda de ropa para hombre en Villa de Álvarez | G&L',
      description: 'G&L Villa de Álvarez, María Ahumada de Gómez 30 Local 6. Moda masculina, catálogo completo y atención por WhatsApp.',
    },
    '/nosotros': {
      title: 'Nosotros | Boutique de moda masculina desde 1995 | G&L',
      description: 'G&L viste a los hombres colimenses desde 1995. Dos tiendas físicas, marcas escogidas a mano y atención por WhatsApp.',
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

  // Ruta desconocida: antes caía aquí con canonical '/' e index,follow, asi que
  // cada URL rota se indexaba como copia de la home.
  return {
    title: 'Página no encontrada | G&L',
    description: 'La página que buscas no existe. Explora el catálogo de G&L.',
    canonicalPath: basePath,
    robots: 'noindex,follow',
  }
}
