import { stores, STORE_PHONE } from '../home/homeData.js'

const LEGAL_ADDRESS = 'Calle Ignacio Zaragoza #140, Col. Centro, C.P. 28000, Colima, Colima'
const PRIVACY_EMAIL = 'glboutiquecolima@gmail.com'
const LEGAL_UPDATED = '6 de noviembre de 2026'

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

// Una pagina por sucursal: "ropa hombre Colima centro" y "tienda ropa Villa de
// Alvarez" son busquedas distintas y una pagina compartida no rankea bien para
// las dos. El copy se arma desde stores para no repetir direcciones a mano.
const storePages = Object.fromEntries(
  stores.map((store) => [
    `/sucursales/${store.slug}`,
    {
      eyebrow: `Sucursal ${store.name}`,
      heading: `Nuestra tienda<br/>en ${store.headingPlace}.`,
      lead: store.pageCopy.lead,
      sections: [
        {
          h: '¿Cómo llego?',
          body: store.pageCopy.llegar,
        },
        {
          h: '¿A qué hora abren?',
          body: store.pageCopy.horario,
          list: store.hours,
        },
        {
          h: 'Qué encuentras aquí',
          // Propio de cada tienda: el mismo parrafo en las dos paginas era
          // contenido duplicado.
          body: `${store.pageCopy.surtido} Si buscas una prenda en particular, escríbenos antes de tu visita y te confirmamos si está disponible en tu talla.`,
        },
      ],
      store: store.slug,
      cta: { label: 'Preguntar por WhatsApp', whatsapp: `Hola, me gustaría información sobre la sucursal ${store.name}` },
    },
  ])
)

export const infoPages = {
  '/sucursales': {
    eyebrow: 'Sucursales',
    heading: 'Dos tiendas<br/>en <span class="text-brand">Colima</span>.',
    lead: 'Una en el Centro de Colima, en la esquina de Zaragoza y Álvaro Obregón, y otra en Villa de Álvarez, con horario corrido. Ambas tienen el mismo surtido; la del Centro es más amplia.',
    sections: [
      {
        h: 'Antes de venir',
        body: 'Si buscas una prenda o una talla en particular, escríbenos por WhatsApp y te confirmamos si está disponible en la sucursal más cercana. Así te ahorras el viaje.',
      },
      {
        h: 'También puedes recoger aquí',
        body: 'Si compras en línea, puedes elegir recoger en tienda sin costo de envío. Apartamos tu prenda y puedes pasar por ella cuando te resulte conveniente.',
      },
    ],
    showStores: true,
    cta: { label: 'Ver el catálogo', href: '/catalog' },
  },

  ...storePages,

  '/nosotros': {
    eyebrow: 'Nosotros',
    heading: 'Desde 1995<br/>vistiendo <span class="text-brand">hombres</span>.',
    lead: 'Llevamos treinta años atendiendo a nuestros clientes en tienda. Sabemos qué camisa es adecuada para el calor de mayo, qué jean funciona igual de bien el viernes que el lunes y qué busca cada cliente que nos visita.',
    sections: [
      {
        h: 'Lo que hacemos',
        body: 'G&L es una boutique de ropa para hombre que nació en Colima. No fabricamos ropa: la seleccionamos. Cada temporada revisamos marca por marca y elegimos prendas con telas que no se deforman al tercer lavado, cortes que favorecen a cualquier complexión y precios justos.',
      },
      {
        h: 'Dos tiendas, el mismo equipo',
        body: 'Una en el Centro de Colima, en la esquina de Zaragoza y Álvaro Obregón, y otra en Villa de Álvarez, sobre la avenida María Ahumada de Gómez. Ambas tienen el mismo surtido; la del Centro es más amplia. En las dos te atiende personal que conoce el inventario y te orienta con la talla: cómo viene cada marca, si encoge y si conviene elegir una talla más o una menos. Nuestro objetivo es que aciertes desde la primera compra.',
      },
      {
        h: 'También por WhatsApp',
        body: 'La tienda en línea es una extensión de la atención en sucursal, no un reemplazo. Eliges aquí, confirmas tu pedido por WhatsApp y te atiende una persona. Si tienes dudas sobre la talla, con gusto te asesoramos antes de tu compra. Y si no estás en Colima, enviamos a cualquier parte de México.',
      },
    ],
    cta: { label: 'Ver el catálogo', href: '/catalog' },
  },

  '/envios': {
    // faq: los encabezados son preguntas y el schema las repite tal cual. Si
    // alguien reescribe un h2 y deja de ser pregunta, hay que quitar la marca:
    // el FAQPage tiene que coincidir con lo visible.
    faq: true,
    eyebrow: 'Envíos y pagos',
    heading: 'Te llega en<br/>3 o 4 <span class="text-brand">días</span>.',
    lead: 'Enviamos a todo México. Tu pedido sale en cuanto se confirma el pago y llega en 3 a 4 días hábiles.',
    sections: [
      {
        h: '¿Cuánto cuesta el envío?',
        list: [
          '$150 MXN a cualquier parte de la República.',
          'Gratis en compras de $1,499 MXN o más.',
          'Recoger en tienda no tiene costo: apartas por WhatsApp y pasas por tu pedido.',
        ],
      },
      {
        h: '¿En cuánto tiempo llega mi pedido?',
        body: 'De 3 a 4 días hábiles, contados desde que completas tu pedido y no desde que agregas productos al carrito. Los fines de semana y días festivos no cuentan. Cuando tu pedido sale, te compartimos el número de guía por WhatsApp para que puedas rastrearlo.',
      },
      {
        h: '¿Cómo puedo pagar?',
        list: [
          'Efectivo en cualquiera de las dos sucursales.',
          'Transferencia bancaria (SPEI).',
          'Tarjeta de débito o crédito con terminal en tienda.',
          'Link de pago a distancia, si confirmas tu pedido por WhatsApp.',
        ],
      },
      {
        h: '¿Cómo se paga un pedido hecho en el sitio?',
        list: [
          'Armas tu pedido y lo envías; queda registrado con tus datos y los productos que elegiste.',
          'Un asesor te contacta por WhatsApp en horario de tienda para confirmar tallas, total y envío.',
          'Si pagas por transferencia, en esa misma conversación te comparte los datos bancarios. Si recoges en tienda, pagas al recoger, en efectivo o con tarjeta.',
          'Una vez confirmado el pago, enviamos tu pedido y te compartimos la guía por WhatsApp.',
          'El sitio no cobra en línea ni te pide datos de tarjeta.',
        ],
      },
    ],
    cta: { label: 'Preguntar por WhatsApp', whatsapp: 'Hola, tengo una duda sobre envíos' },
  },

  '/cambios': {
    faq: true,
    eyebrow: 'Cambios',
    heading: 'Si no te queda,<br/>lo <span class="text-brand">cambiamos</span>.',
    lead: 'No realizamos devoluciones con reembolso de dinero, pero con gusto te cambiamos la prenda.',
    sections: [
      {
        h: '¿Cómo hago un cambio?',
        list: [
          'Tienes 8 días a partir de que recibes tu paquete para solicitar el cambio.',
          'La prenda debe estar sin usar y con sus etiquetas.',
          'Escríbenos por WhatsApp y te indicamos cómo enviarla.',
        ],
      },
      {
        h: '¿Quién paga el envío de un cambio?',
        body: 'Si el cambio se debe a que elegiste otra talla o cambiaste de opinión, el envío corre por tu cuenta. Si el error fue nuestro —te enviamos una talla distinta a la que pediste o la prenda tenía un defecto—, nosotros cubrimos el envío.',
      },
      {
        h: '¿Cómo evito tener que cambiar la prenda?',
        body: 'Antes de comprar, consúltanos la talla por WhatsApp. Revisamos la prenda y te decimos cómo viene: si encoge, si es holgada o si conviene elegir una talla más. Es más rápido que hacer un cambio.',
      },
    ],
    cta: { label: 'Solicitar un cambio', whatsapp: 'Hola, me gustaría solicitar un cambio' },
  },

  '/contacto': {
    eyebrow: 'Contacto',
    heading: 'Aquí <span class="text-brand">estamos</span>.',
    lead: 'La forma más rápida de contactarnos es WhatsApp: respondemos en minutos durante el horario de tienda. Si estás cerca, también puedes visitarnos.',
    sections: [
      {
        h: 'WhatsApp',
        body: 'Es nuestro canal principal. Por ahí resolvemos dudas de tallas, apartamos prendas, confirmamos pedidos y damos seguimiento a los envíos.',
      },
      {
        h: 'Instagram y Facebook',
        body: 'Publicamos las novedades en Instagram (@glboutiquecol) y en nuestra página de Facebook. Si viste una prenda que te interesa, envíanos la foto por WhatsApp y te confirmamos las tallas disponibles.',
      },
    ],
    showStores: true,
    cta: { label: 'Escribir por WhatsApp', whatsapp: 'Hola, tengo una pregunta' },
  },

  // Ley Federal de Protección de Datos Personales en Posesión de los
  // Particulares (2025). Responsable y domicilio confirmados por el dueño
  // (nov 2026). RFC y CURP no se publican.
  '/privacidad': {
    eyebrow: 'Aviso de privacidad',
    heading: 'Aviso de<br/><span class="text-brand">privacidad</span>.',
    lead: 'Qué datos tuyos guardamos cuando compras en G&amp;L, para qué los usamos y cómo puedes pedirnos que los corrijamos o los eliminemos.',
    sections: [
      {
        h: 'Quién es responsable de tus datos',
        body: `Ernesto Vega Vega, persona física con actividad empresarial que opera la marca comercial G&amp;L, con domicilio en ${LEGAL_ADDRESS}, es el responsable del uso y la protección de tus datos personales.`,
      },
      {
        h: 'Qué datos recabamos',
        body: 'Solo los que nos das al hacer un pedido o al suscribirte al boletín. No pedimos datos sensibles ni datos de tarjeta: el sitio no cobra en línea.',
        list: [
          'Nombre y número de WhatsApp.',
          'Correo electrónico, si lo escribes.',
          'Dirección de envío (calle, número, colonia, ciudad, código postal, estado y referencias), si pides envío a domicilio.',
          'Lo que pediste, la forma de pago y la forma de entrega.',
          'Correo del boletín, si te suscribes.',
        ],
      },
      {
        h: 'Para qué los usamos',
        body: 'Para lo necesario de tu compra, sin lo cual no podríamos atenderte:',
        list: [
          'Registrar y confirmar tu pedido.',
          'Escribirte por WhatsApp para el pago y el seguimiento.',
          'Enviarte el paquete y el aviso de envío.',
          'Atender cambios, aclaraciones y dudas.',
        ],
      },
      {
        h: 'Usos secundarios',
        body: 'Si te suscribes al boletín, usamos tu correo para mandarte novedades y promociones. Puedes negarte en cualquier momento con el enlace para darte de baja que viene en cada correo, o escribiéndonos. Negarte no afecta tus compras.',
      },
      {
        h: 'Con quién compartimos tus datos',
        body: 'No vendemos ni rentamos tus datos. Solo los compartimos con quien nos ayuda a atenderte, y solo para eso:',
        list: [
          'La paquetería que entrega tu pedido: nombre, teléfono y dirección.',
          'Los proveedores que alojan el sitio y la base de datos y que envían los correos.',
          'Una autoridad, únicamente cuando la ley nos lo exija.',
        ],
      },
      {
        h: 'Tus derechos ARCO',
        body: `Puedes pedir acceso a tus datos, que los rectifiquemos, que los cancelemos o oponerte a su uso, y también retirar tu consentimiento. Escríbenos a <a class="ul-link" href="mailto:${PRIVACY_EMAIL}">${PRIVACY_EMAIL}</a> o por WhatsApp al ${STORE_PHONE} con tu nombre, qué datos y qué pides, y una identificación que muestre que eres el titular. Te respondemos dentro del plazo que marca la ley.`,
      },
      {
        h: 'Lo que se guarda en tu navegador',
        body: 'El sitio no usa cookies de publicidad ni de rastreo. Tu bolsa y una copia del catálogo se guardan en tu propio navegador para que la página cargue rápido; puedes borrarlas limpiando los datos del sitio.',
      },
      {
        h: 'Cambios a este aviso',
        body: `Si cambia este aviso, lo publicamos en esta misma página con la fecha nueva. Última actualización: ${LEGAL_UPDATED}.`,
      },
    ],
    cta: { label: 'Preguntar por WhatsApp', whatsapp: 'Hola, tengo una pregunta sobre mis datos' },
  },

  '/terminos': {
    eyebrow: 'Términos',
    heading: 'Términos<br/>de <span class="text-brand">compra</span>.',
    lead: 'Las condiciones para comprar en G&amp;L, explicadas de forma breve y clara.',
    sections: [
      {
        h: 'Quién te vende',
        body: `G&amp;L es la marca comercial que opera Ernesto Vega Vega, con domicilio en ${LEGAL_ADDRESS}. Para cualquier duda, escríbenos por WhatsApp al ${STORE_PHONE}.`,
      },
      {
        h: 'Precios y disponibilidad',
        body: 'Los precios están en pesos mexicanos (MXN) e incluyen IVA. El inventario es el mismo de las dos tiendas físicas: si algo se agota antes de confirmar tu pedido, te avisamos por WhatsApp antes de cobrarte.',
      },
      {
        h: 'Cómo se hace un pedido',
        body: 'Armas tu pedido en el sitio y lo envías; queda registrado. Un asesor te escribe por WhatsApp para confirmar tallas, el total y el pago. El sitio no cobra en línea: el pedido queda firme cuando se confirma el pago, o cuando pagas en tienda si vas a recoger. <a class="ul-link" href="/envios">Así se paga</a>.',
      },
      {
        h: 'Envíos',
        body: `El envío cuesta $${SHIPPING.cost} MXN a todo México y es gratis desde $${SHIPPING.freeFrom.toLocaleString('es-MX')} MXN. Llega en ${SHIPPING.daysMin} a ${SHIPPING.daysMax} días hábiles desde que se confirma el pedido. Recoger en tienda no cuesta. Detalles en <a class="ul-link" href="/envios">envíos y pagos</a>.`,
      },
      {
        h: 'Cambios',
        body: `No hay reembolso de dinero: cambiamos la prenda dentro de los ${SHIPPING.exchangeDays} días siguientes a la entrega, sin usar y con etiquetas. Si el error fue nuestro, el envío del cambio lo pagamos nosotros. Todo el detalle en <a class="ul-link" href="/cambios">cambios</a>.`,
      },
      {
        h: 'Productos originales',
        body: 'Todo lo que vendemos es original.',
      },
      {
        h: 'Tus datos',
        body: 'Lo que hacemos con los datos de tu pedido está en el <a class="ul-link" href="/privacidad">aviso de privacidad</a>.',
      },
    ],
    cta: { label: 'Preguntar por WhatsApp', whatsapp: 'Hola, tengo una duda sobre una compra' },
  },
}
