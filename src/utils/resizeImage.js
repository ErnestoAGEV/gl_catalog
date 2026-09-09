// Redimensiona una foto en el navegador antes de subirla a Supabase.
//
// Las fotos salen del telefono a 3000-4000 px y se subian tal cual. Lighthouse
// marcaba 1,9 MB de sobra en una sola ficha, y cada byte tambien ocupa cuota
// del Storage, que esta en plan gratuito.
//
// Sale siempre en JPEG, nunca WebP: WhatsApp y Facebook no renderizan WebP en
// la vista previa del enlace —por eso existe socialImage() en productCopy.js—
// y una foto nueva en WebP volveria a caer en el respaldo.
//
// Si algo falla se sube el archivo original. Perder una venta por no poder dar
// de alta un producto es mucho peor que subir una foto pesada.

const MAX_SIDE = 1400
const QUALITY = 0.82

// Formatos que sabemos recomprimir sin perder nada importante. Un GIF animado
// o un SVG pasan de largo: redimensionarlos los rompe.
//
// HEIC va incluido a proposito. iOS suele convertirlo a JPEG al subirlo, pero
// cuando no lo hace, el archivo llega a la tienda y medio navegador no sabe
// pintarlo. Si este navegador lo puede decodificar, sale JPEG; si no, se sube
// tal cual, que es lo que pasaba antes.
const RESIZABLE = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

/** Encaja (w, h) dentro de un cuadrado de lado max sin deformar. */
export function fitWithin(w, h, max = MAX_SIDE) {
  const side = Math.max(w, h)
  if (!side || side <= max) return { w, h }
  const factor = max / side
  return { w: Math.max(1, Math.round(w * factor)), h: Math.max(1, Math.round(h * factor)) }
}

/** "IMG_4335.HEIC" -> "IMG_4335.jpg" */
export function toJpgName(name) {
  return String(name || 'foto').replace(/\.[^.]+$/, '') + '.jpg'
}

export async function resizeForUpload(file) {
  if (!RESIZABLE.includes(file?.type)) return file
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file

  let bitmap
  try {
    // from-image aplica la rotacion EXIF: sin esto las fotos verticales del
    // telefono se suben acostadas. Safari no acepto ese parametro hasta la 17
    // y lanza en vez de ignorarlo, asi que reintentamos sin el.
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      bitmap = await createImageBitmap(file)
    }
  } catch {
    return file
  }

  try {
    const { w, h } = fitWithin(bitmap.width, bitmap.height)
    // Ya cabe y ya es JPEG: recomprimir solo le quitaria calidad.
    if (w === bitmap.width && h === bitmap.height && file.type === 'image/jpeg') return file

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // El PNG transparente sobre negro se ve sucio; el fondo blanco es el de la ficha.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bitmap, 0, 0, w, h)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
    if (!blob) return file
    // Un PNG plano puede pesar menos que su JPEG: nos quedamos con el chico.
    if (blob.size >= file.size && w === bitmap.width && h === bitmap.height) return file

    return new File([blob], toJpgName(file.name), { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  } finally {
    bitmap.close?.()
  }
}
