// Static data for the home page — v2 Bold redesign

export const heroSlides = [
  {
    headline: 'Tu fit,<br/><span class="text-brand">perfecto.</span>',
    body: 'Para el hombre que sabe lo que se pone. Las mejores marcas en camisas, denim y fragancias — escogidas minusiosamente , al mejor precio.',
    cta: { label: 'Comprar colección', href: '/catalog' },
    secondary: { label: 'Ver lookbook', href: '/catalog' },
    image: '/img/hero-1-1080.webp?v=2',
    w: 1080,
    h: 1350,
    srcset: '/img/hero-1-640.webp?v=2 640w, /img/hero-1-1080.webp?v=2 1080w, /img/hero-1-1600.webp?v=2 1600w',
    caption: 'Look 01 — Polo gris + khaki',
    captionClass: 'bg-ink/40 backdrop-blur',
  },
  {
    headline: 'Denim<br/><span class="outline-text">honesto.</span>',
    body: 'Jeans crudos y lavados que se mejoran con el uso. Denims premium para todo tipo de ocasiones — cortes slim, straight y relaxed.',
    cta: { label: 'Ver denim', href: '/categoria/Pantalones' },
    image: '/img/hero-2-1080.webp',
    w: 1080,
    h: 1080,
    srcset: '/img/hero-2-640.webp 640w, /img/hero-2-1080.webp 1080w, /img/hero-2-1600.webp 1600w',
    caption: 'Look 02 — Jean crudo',
    captionClass: 'bg-ink/40 backdrop-blur',
  },
  {
    headline: '−10<span class="text-brand">%</span><br/>1ª compra.',
    body: '',
    couponBody: true,
    cta: { label: 'Copiar código', href: '#copy', isCopy: true },
    image: '/img/hero-3-1080.webp?v=2',
    w: 1080,
    h: 1350,
    srcset: '/img/hero-3-640.webp?v=2 640w, /img/hero-3-1080.webp?v=2 1080w, /img/hero-3-1600.webp?v=2 1600w',
    caption: 'Oferta · WELCOME10',
    captionClass: 'bg-brand',
  },
]

export const categoryTiles = [
  {
    name: 'Camisas',
    href: '/categoria/Camisas',
    categoryType: 'Camisas',
    span: 'col-span-12 md:col-span-8 row-span-2',
    eyebrow: '01 · Esenciales',
    subtitle: 'Oxford · lino · franela',
    image: '/img/cat-camisas.webp',
    w: 1080,
    h: 720,
    headingSize: 'text-[clamp(56px,7vw,120px)]',
    type: 'image',
  },
  {
    name: 'Jeans',
    href: '/categoria/Pantalones',
    categoryType: 'Pantalones',
    span: 'col-span-12 md:col-span-4 row-span-1',
    eyebrow: '02 · Denim',
    image: '/img/cat-jeans.webp',
    w: 736,
    h: 920,
    headingSize: 'text-[40px]',
    type: 'image',
  },
  {
    name: 'Polos',
    href: '/categoria/Polos',
    categoryType: 'Polos',
    span: 'col-span-6 md:col-span-2 row-span-1',
    eyebrow: '03 · Pima',
    image: '/img/cat-polos.webp',
    w: 800,
    h: 800,
    headingSize: 'text-[34px]',
    type: 'image-brand',
  },
  {
    name: 'Perfumes',
    href: '/categoria/Perfumes',
    categoryType: 'Perfumes',
    span: 'col-span-6 md:col-span-2 row-span-1',
    eyebrow: '04 · Fragancia',
    image: '/img/cat-perfumes.webp',
    w: 736,
    h: 981,
    headingSize: 'text-[28px]',
    type: 'image-ink',
  },
]

export const stats = [
  { number: '31<span class="text-brand">.</span>', caption: 'Años curando · desde 1995' },
  { number: '2.4<span class="text-brand">k</span>', caption: 'Clientes activos' },
  { number: '4.9<span class="text-[36px] opacity-40">/5</span>', caption: '+500 reseñas' },
  { number: '02', caption: 'Tiendas en Colima' },
]

// Fuente unica de las dos sucursales. Aparte de la home, la leen las paginas
// de /sucursales y scripts/prerender.mjs, que genera el JSON-LD de
// ClothingStore a partir de aqui — antes estaba escrito a mano en index.html
// y habia que acordarse de cambiar los dos sitios.
export const stores = [
  {
    id: '01',
    slug: 'colima-centro',
    name: 'Centro',
    fullName: 'G&L Colima Centro',
    schemaId: 'tienda',
    coords: '19.2424 N · 103.7254 W',
    address: 'Zaragoza #140, Col. Centro, Colima. A media cuadra del Jardín Libertad.',
    hours: ['Lun—Sáb · 10:30—14:00 · 16:30—20:00', 'Dom · 10:30—14:00'],
    mapUrl: 'https://www.google.com/maps/place/G%26L+Colima/@19.2424015,-103.7280069,17z/data=!3m2!4b1!5s0x84255aab867046b3:0x293c46c0e72ef43a!4m6!3m5!1s0x84255aab8670a0bf:0x969da2ab885623e0!8m2!3d19.2424015!4d-103.725432!16s%2Fg%2F11c45qrg02?entry=ttu',
    postal: {
      streetAddress: 'Zaragoza 140, Col. Centro',
      addressLocality: 'Colima',
      addressRegion: 'Colima',
      postalCode: '28000',
      addressCountry: 'MX',
    },
    geo: { latitude: 19.2424015, longitude: -103.725432 },
    openingHours: [
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:30', closes: '14:00' },
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '16:30', closes: '20:00' },
      { days: ['Sunday'], opens: '10:30', closes: '14:00' },
    ],
  },
  {
    id: '02',
    slug: 'villa-de-alvarez',
    name: 'Villa',
    fullName: 'G&L Villa de Álvarez',
    schemaId: 'tienda-villa',
    coords: '19.2713 N · 103.7332 W',
    address: 'María Ahumada de Gómez #30, Local #6. Sobre la avenida principal.',
    hours: ['Lun—Sáb · 09:00—20:00', 'Dom · 10:30—14:00'],
    mapUrl: 'https://www.google.com/maps/place/G%26L+Villa+de+%C3%81lvarez/@19.271313,-103.770113,14z/data=!3m1!4b1!4m6!3m5!1s0x842545c072adffd5:0xdfee853b24213661!8m2!3d19.2713167!4d-103.7332035!16s%2Fg%2F11h53ml_dy?entry=ttu',
    postal: {
      streetAddress: 'María Ahumada de Gómez 30, Local 6',
      addressLocality: 'Villa de Álvarez',
      addressRegion: 'Colima',
      addressCountry: 'MX',
    },
    geo: { latitude: 19.2713167, longitude: -103.7332035 },
    openingHours: [
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '09:00', closes: '20:00' },
      { days: ['Sunday'], opens: '10:30', closes: '14:00' },
    ],
  },
]

export const STORE_PHONE = '+52 312 101 8263'
