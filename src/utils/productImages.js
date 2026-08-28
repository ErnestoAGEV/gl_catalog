/**
 * La tabla de tallas se sube dentro de `images` y salía como "foto 02" del
 * producto. La aparta de la galería para alimentar el botón de guía de tallas.
 * Si el producto solo tuviera esa imagen, la galería se queda con ella: es
 * preferible enseñar la tabla a dejar la ficha sin foto.
 */
export function splitGalleryImages(images = []) {
  const sizeGuide = images.find(u => /guia|gu%C3%ADa|talla|size[-_]?(guide|chart)/i.test(u)) || null
  const gallery = images.filter(u => u !== sizeGuide)
  return gallery.length > 0
    ? { gallery, sizeGuide }
    : { gallery: images, sizeGuide: null }
}
