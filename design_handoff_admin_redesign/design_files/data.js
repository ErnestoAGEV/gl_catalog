// G&L Admin — seed data (men's fashion boutique, Colima MX)
(function () {
  // Seeded RNG so the demo stays stable across reloads
  let _seed = 20260608;
  const rand = () => { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; };
  const money = (n) =>
    '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const initials = (name) =>
    (name || '?').split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  const CATEGORIES = [
    { id: 'c1', name: 'Camisas', active: true },
    { id: 'c2', name: 'Polos', active: true },
    { id: 'c3', name: 'Pantalones', active: true },
    { id: 'c4', name: 'Perfumes', active: true },
    { id: 'c5', name: 'Calzado', active: true },
    { id: 'c6', name: 'Accesorios', active: true },
    { id: 'c7', name: 'Chamarras', active: false },
  ];

  // color hex map for swatches
  const COL = { Negro:'#15171C', Blanco:'#F4F4F2', Azul:'#214FC7', Marino:'#1B2A4A', Gris:'#8B8F99', Beige:'#D9C7A8', Vino:'#5A1E2B', Verde:'#2E5D4B', Café:'#5A3A22', Celeste:'#9FC4E8' };

  let pid = 100;
  const P = (name, type, price, op, stock, badge, sizes, colors) => ({
    id: 'p' + ++pid, name, type, price, originalPrice: op, stock, badge,
    sizes, colors, sold: Math.floor(rand() * 80) + 4,
  });

  const PRODUCTS = [
    P('Camisa Oxford Slim Azul', 'Camisas', 749, 899, 24, 'Bestseller', ['CH','M','G','XG'], ['Azul','Blanco','Celeste']),
    P('Camisa Lino Manga Larga', 'Camisas', 829, null, 8, '', ['CH','M','G'], ['Blanco','Beige']),
    P('Camisa Cuadros Flanela', 'Camisas', 689, 790, 0, '', ['M','G','XG'], ['Vino','Verde']),
    P('Polo Piqué Premium', 'Polos', 549, null, 41, 'Nuevo', ['CH','M','G','XG'], ['Negro','Marino','Blanco']),
    P('Polo Algodón Pima', 'Polos', 599, 699, 15, '', ['CH','M','G'], ['Gris','Marino']),
    P('Jeans Slim Stretch', 'Pantalones', 999, 1199, 33, 'Bestseller', ['30','32','34','36'], ['Marino','Negro']),
    P('Pantalón Chino Casual', 'Pantalones', 879, null, 6, '', ['30','32','34','36'], ['Beige','Marino','Gris']),
    P('Jeans Rectos Clásico', 'Pantalones', 949, null, 0, '', ['32','34','36','38'], ['Azul','Negro']),
    P('Perfume Noir Intense 100ml', 'Perfumes', 1290, 1490, '∞', 'Premium', ['100ml'], []),
    P('Perfume Aqua Fresh 75ml', 'Perfumes', 990, null, '∞', '', ['75ml'], []),
    P('Tenis Urbano Blanco', 'Calzado', 1390, null, 12, 'Nuevo', ['25','26','27','28'], ['Blanco','Gris']),
    P('Zapato Casual Cuero', 'Calzado', 1690, 1990, 4, '', ['26','27','28','29'], ['Café','Negro']),
    P('Cinturón Piel Genuina', 'Accesorios', 449, null, 28, '', ['Única'], ['Café','Negro']),
    P('Cartera Slim Minimal', 'Accesorios', 379, 449, 19, '', ['Única'], ['Negro','Café']),
    P('Gorra Logo Bordado', 'Accesorios', 299, null, 52, '', ['Única'], ['Negro','Marino','Blanco']),
    P('Camisa Mezclilla Trucker', 'Camisas', 799, null, 0, 'Borrador', ['M','G','XG'], ['Azul']),
    P('Polo Rayas Náuticas', 'Polos', 529, null, 22, '', ['CH','M','G','XG'], ['Marino','Blanco']),
    P('Sudadera Capucha Esencial', 'Chamarras', 899, 1090, 14, '', ['CH','M','G','XG'], ['Negro','Gris']),
  ];

  // Orders — spread across recent days
  const NAMES = ['Carlos Méndez','Luis Ramírez','Jorge Hernández','Diego Torres','Fernando Ríos','Andrés Salazar','Roberto Vega','Miguel Ángel Ruiz','Pablo Domínguez','Sergio Cárdenas','Emilio Navarro','Raúl Figueroa','Iván Macías','Héctor Lozano','Mario Beltrán'];
  const phones = ['312 118 4420','312 204 9981','314 155 2030','312 870 1144','313 442 8890','312 559 6677','314 220 3318','312 901 4455','313 778 2200','312 334 9090'];
  const addresses = ['Av. Tecnológico 455, Col. Centro, Colima','Calle Manzanillo 120, Villa de Álvarez','Blvd. Camino Real 78, Colima','Av. Pino Suárez 210, Col. Jardines','Calle 5 de Mayo 33, Comala'];

  function buildOrders() {
    const out = [];
    const now = Date.now();
    const statuses = ['completado','completado','completado','pendientedepago','pendientedepago','cancelado'];
    const pays = ['Tarjeta','Transferencia','Efectivo','whatsapp'];
    const delivery = ['Envío a domicilio','Recoge en tienda'];
    let n = 5200;
    for (let i = 0; i < 34; i++) {
      const daysAgo = Math.floor(Math.pow(rand(), 1.4) * 11);
      const created = new Date(now - daysAgo * 86400000 - rand() * 80000000);
      const itemCount = 1 + Math.floor(rand() * 3);
      const items = [];
      let total = 0;
      for (let k = 0; k < itemCount; k++) {
        const prod = PRODUCTS[Math.floor(rand() * 14)];
        const qty = 1 + Math.floor(rand() * 2);
        const size = prod.sizes[Math.floor(rand() * prod.sizes.length)];
        items.push({ name: prod.name, size, qty, price: prod.price });
        total += prod.price * qty;
      }
      const del = delivery[Math.floor(rand() * delivery.length)];
      out.push({
        id: 'GL-' + ++n,
        customer_name: NAMES[Math.floor(rand() * NAMES.length)],
        customer_whatsapp: phones[Math.floor(rand() * phones.length)],
        created_at: created.toISOString(),
        total,
        status: statuses[Math.floor(rand() * statuses.length)],
        payment_method: pays[Math.floor(rand() * pays.length)],
        delivery_method: del,
        address: del === 'Envío a domicilio' ? addresses[Math.floor(rand() * addresses.length)] : '',
        cart_items: items,
      });
    }
    return out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const ORDERS = buildOrders();

  const COUPONS = [
    { code: 'WELCOME10', label: 'Bienvenida · 10% primera compra', discount: 0.10, free_shipping: false, active: true, categories: [], created_at: '2026-01-12' },
    { code: 'VERANO25', label: 'Descuento de verano', discount: 0.25, free_shipping: false, active: true, categories: ['Camisas','Polos'], created_at: '2026-04-02' },
    { code: 'ENVIOGRATIS', label: 'Envío gratis sin mínimo', discount: 0, free_shipping: true, active: true, categories: [], created_at: '2026-03-18' },
    { code: 'PERFUME15', label: 'Fragancias seleccionadas', discount: 0.15, free_shipping: false, active: false, categories: ['Perfumes'], created_at: '2026-02-20' },
    { code: 'VIP30', label: 'Clientes frecuentes', discount: 0.30, free_shipping: true, active: true, categories: [], created_at: '2026-05-01' },
  ];

  const subDomains = ['gmail.com','hotmail.com','outlook.com','yahoo.com.mx'];
  const subNames = ['carlos.mendez','luisr','jorgehdz','diego.t','fer.rios','andres.s','rvega88','miguel.ruiz','pablo.dom','sergio.c','emilio.nav','raul.f','ivan.m','hector.l','mario.b','alex.q','dani.p','beto.g'];
  const SUBSCRIBERS = subNames.map((u, i) => ({
    email: u + '@' + subDomains[i % subDomains.length],
    created_at: new Date(Date.now() - (i * 2 + 1) * 86400000 - rand() * 80000000).toISOString(),
  }));

  window.DB = { CATEGORIES, PRODUCTS, ORDERS, COUPONS, SUBSCRIBERS, COL };
  window.fmt = { money, initials };
})();
