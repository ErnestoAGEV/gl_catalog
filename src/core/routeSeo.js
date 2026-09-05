// Metadatos SEO por ruta. Modulo puro (sin DOM ni imports): lo usan tanto
// el runtime (views.js) como el prerender de build (scripts/prerender.mjs).

export function getSeoForRoute(path, basePath, state) {
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

  const infoSeo = {
    '/nosotros': {
      title: 'Nosotros | Boutique de moda masculina en Colima | G&L',
      description: 'G&L viste a los hombres colimenses desde 1995. Dos tiendas fisicas, marcas escogidas a mano y atencion por WhatsApp.',
    },
    '/envios': {
      title: 'Envios y formas de pago | G&L',
      description: 'Envio $150 MXN a todo Mexico, gratis desde $1,499. Entrega en 3 a 4 dias habiles. Efectivo, transferencia, tarjeta y link de pago.',
    },
    '/cambios': {
      title: 'Cambios y garantia | G&L',
      description: 'Cambia tu prenda dentro de los 8 dias siguientes a la entrega. Si el error fue nuestro, el envio corre por nuestra cuenta.',
    },
    '/contacto': {
      title: 'Contacto y sucursales en Colima | G&L',
      description: 'Escribenos por WhatsApp o visitanos en Colima Centro y Villa de Alvarez. Horarios, direcciones y como llegar.',
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
