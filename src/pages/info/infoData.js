// Contenido de las paginas de confianza (/nosotros, /envios, /cambios,
// /contacto). Van aparte del renderer para que editar el copy no obligue a
// tocar markup, y para que scripts/prerender.mjs pueda leerlas sin arrastrar
// nada del DOM.

export const SHIPPING = {
  cost: 150,
  freeFrom: 1499,
  daysMin: 3,
  daysMax: 4,
  exchangeDays: 8,
}

export const infoPages = {
  '/nosotros': {
    eyebrow: 'Desde 1995 · Colima',
    heading: 'Vistiendo a los<br/>hombres <span class="text-brand">colimenses</span>.',
    lead: 'Treinta años detrás del mostrador dan para conocer a la gente. Sabemos qué camisa aguanta el calor de mayo, qué jean se ve bien el viernes y también el lunes, y qué busca cada cliente que cruza la puerta.',
    sections: [
      {
        h: 'Lo que hacemos',
        body: 'G&L es una boutique de moda masculina en Colima. No inventamos ropa: la escogemos. Cada temporada revisamos marca por marca y nos quedamos con lo que de verdad aguanta — telas que no se deforman al tercer lavado, cortes que le quedan a un hombre real y precios que no insultan a nadie.',
      },
      {
        h: 'Dos tiendas, la misma gente',
        body: 'Una en el Centro, a media cuadra del Jardín Libertad. Otra en Villa de Álvarez, sobre la avenida principal. En las dos te atiende alguien que conoce el inventario de memoria y te orienta con la talla: cómo viene cada marca, si encoge, si conviene subir o bajar. La idea es que te lleves la correcta a la primera.',
      },
      {
        h: 'Y por WhatsApp, igual',
        body: 'La tienda en línea es una extensión del mostrador, no un reemplazo. Escoges aquí, cierras por WhatsApp y platicas con una persona. Si tienes duda de la talla, pregunta antes de comprar: para eso estamos.',
      },
    ],
    cta: { label: 'Ver el catálogo', href: '/catalog' },
  },

  '/envios': {
    eyebrow: 'Envíos y pagos',
    heading: 'Te llega en<br/>3 o 4 <span class="text-brand">días</span>.',
    lead: 'Mandamos guías a todo México. El pedido sale en cuanto se confirma el pago y llega en 3 a 4 días hábiles.',
    sections: [
      {
        h: 'Costo del envío',
        list: [
          '$150 MXN de guía a cualquier parte de la República.',
          'Gratis en compras de $1,499 MXN o más.',
          'Recoger en tienda no cuesta nada: apartas por WhatsApp y pasas por él.',
        ],
      },
      {
        h: 'Tiempo de entrega',
        body: 'De 3 a 4 días hábiles contados desde que completas el pedido, no desde que lo pones en el carrito. Los fines de semana y días festivos no cuentan. En cuanto sale, te pasamos el número de guía por WhatsApp para que lo rastrees.',
      },
      {
        h: 'Formas de pago',
        list: [
          'Efectivo en cualquiera de las dos sucursales.',
          'Transferencia bancaria (SPEI).',
          'Tarjeta de débito o crédito con terminal en tienda.',
          'Link de pago a distancia, si cierras el pedido por WhatsApp.',
        ],
      },
    ],
    cta: { label: 'Preguntar por WhatsApp', whatsapp: 'Hola, tengo una duda sobre envíos' },
  },

  '/cambios': {
    eyebrow: 'Cambios',
    heading: 'Si no te queda,<br/>lo <span class="text-brand">cambiamos</span>.',
    lead: 'No manejamos devoluciones con reembolso de dinero. Lo que sí hacemos, y sin problema, es cambiarte la prenda.',
    sections: [
      {
        h: 'Cómo funciona',
        list: [
          'Tienes 8 días desde que recibes el paquete para pedir el cambio.',
          'La prenda tiene que venir sin usar, con sus etiquetas.',
          'Nos escribes por WhatsApp y te decimos cómo mandarla.',
        ],
      },
      {
        h: 'Quién paga el envío del cambio',
        body: 'Si el cambio es porque escogiste otra talla o cambiaste de opinión, el envío corre por tu cuenta. Si el error fue nuestro — te mandamos una talla distinta a la que pediste, o la prenda venía con un defecto — lo pagamos nosotros y no tienes que discutirlo con nadie.',
      },
      {
        h: 'Para no llegar hasta aquí',
        body: 'Antes de comprar, pregúntanos la talla por WhatsApp. Tenemos la prenda enfrente y te decimos cómo viene: si encoge, si es holgada, si conviene subir una talla. Es más rápido que un cambio.',
      },
    ],
    cta: { label: 'Solicitar un cambio', whatsapp: 'Hola, quiero hacer un cambio' },
  },

  '/contacto': {
    eyebrow: 'Contacto',
    heading: 'Aquí <span class="text-brand">estamos</span>.',
    lead: 'Lo más rápido es WhatsApp: contestamos en minutos durante el horario de tienda. Y si andas por el rumbo, pásale.',
    sections: [
      {
        h: 'WhatsApp',
        body: 'Es nuestro canal principal. Por ahí resolvemos dudas de tallas, apartamos prendas, cerramos pedidos y damos seguimiento a los envíos.',
      },
      {
        h: 'Instagram',
        body: 'Publicamos lo que va llegando en @glboutiquecol. Si viste algo ahí y lo quieres, mándanos la foto por WhatsApp y te decimos si hay tallas.',
      },
    ],
    showStores: true,
    cta: { label: 'Escribir por WhatsApp', whatsapp: 'Hola, tengo una pregunta' },
  },
}
