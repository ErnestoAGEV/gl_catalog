// Static data for the home page — v2 Bold redesign

export const heroSlides = [
  {
    headline: 'Tu fit,<br/><span class="text-brand">perfecto.</span>',
    body: 'Para el hombre que sabe lo que se pone. Las mejores marcas en camisas, denim y fragancias — escogidas minusiosamente , al mejor precio.',
    cta: { label: 'Comprar colección', href: '/catalog' },
    secondary: { label: 'Ver lookbook', href: '/catalog' },
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1600&q=80&auto=format&fit=crop',
    caption: 'Look 01 — Camisa hueso',
    captionClass: 'bg-ink/40 backdrop-blur',
  },
  {
    headline: 'Denim<br/><span class="outline-text">honesto.</span>',
    body: 'Jeans crudos y lavados que se mejoran con el uso. Denims premium para todo tipo de ocasiones — cortes slim, straight y relaxed.',
    cta: { label: 'Ver denim', href: '/categoria/Pantalones' },
    image: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=1600&q=80&auto=format&fit=crop',
    caption: 'Look 02 — Jean crudo',
    captionClass: 'bg-ink/40 backdrop-blur',
  },
  {
    headline: '−10<span class="text-brand">%</span><br/>1ª compra.',
    body: '',
    couponBody: true,
    cta: { label: 'Copiar código', href: '#copy', isCopy: true },
    image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1600&q=80&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1080&q=80&auto=format&fit=crop',
    headingSize: 'text-[clamp(56px,7vw,120px)]',
    type: 'image',
  },
  {
    name: 'Jeans',
    href: '/categoria/Pantalones',
    categoryType: 'Pantalones',
    span: 'col-span-12 md:col-span-4 row-span-1',
    eyebrow: '02 · Denim',
    image: 'https://i.pinimg.com/736x/8a/e5/6c/8ae56c59aba6c6a1f88e579b133a0104.jpg',
    headingSize: 'text-[40px]',
    type: 'image',
  },
  {
    name: 'Polos',
    href: '/categoria/Polos',
    categoryType: 'Polos',
    span: 'col-span-6 md:col-span-2 row-span-1',
    eyebrow: '03 · Pima',
    image: 'https://i.pinimg.com/1200x/b2/de/7a/b2de7a76b7037ee02ba7394cfb874849.jpg',
    headingSize: 'text-[34px]',
    type: 'image-brand',
  },
  {
    name: 'Perfumes',
    href: '/categoria/Perfumes',
    categoryType: 'Perfumes',
    span: 'col-span-6 md:col-span-2 row-span-1',
    eyebrow: '04 · Fragancia',
    image: 'https://i.pinimg.com/736x/2c/f3/45/2cf345c33502c764d0a39389f18fce93.jpg',
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

export const stores = [
  {
    id: '01',
    name: 'Centro',
    fullName: 'G&L Colima Centro',
    coords: '19.2424 N · 103.7254 W',
    address: 'Zaragoza #140, Col. Centro, Colima. A media cuadra del Jardín Libertad.',
    hours: ['Lun—Sáb · 10:30—14:00 · 16:30—20:00', 'Dom · 10:30—14:00'],
    mapUrl: 'https://www.google.com/maps/place/G%26L+Colima/@19.2424015,-103.7280069,17z/data=!3m2!4b1!5s0x84255aab867046b3:0x293c46c0e72ef43a!4m6!3m5!1s0x84255aab8670a0bf:0x969da2ab885623e0!8m2!3d19.2424015!4d-103.725432!16s%2Fg%2F11c45qrg02?entry=ttu',
  },
  {
    id: '02',
    name: 'Villa',
    fullName: 'G&L Villa de Álvarez',
    coords: '19.2713 N · 103.7332 W',
    address: 'María Ahumada de Gómez #30, Local #6. Sobre la avenida principal.',
    hours: ['Lun—Sáb · 09:00—20:00', 'Dom · 10:30—14:00'],
    mapUrl: 'https://www.google.com/maps/place/G%26L+Villa+de+%C3%81lvarez/@19.271313,-103.770113,14z/data=!3m1!4b1!4m6!3m5!1s0x842545c072adffd5:0xdfee853b24213661!8m2!3d19.2713167!4d-103.7332035!16s%2Fg%2F11h53ml_dy?entry=ttu',
  },
]
