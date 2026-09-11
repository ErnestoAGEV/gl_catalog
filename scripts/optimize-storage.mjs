// Recomprime las fotos que ya estan en Supabase Storage.
//
// El commit 659a510 redimensiona en el navegador antes de subir, pero solo
// hacia adelante: lo que ya estaba subido sigue con el peso original. Medido
// el 2026-09-11: 140 fotos, 99 MB, media de 724 KB, la mas grande de 2.9 MB.
// Bajandolas a 1200 px de ancho se recuperan unos 82 MB — que en el plan
// gratuito de Supabase, con 1 GB de cuota, no es un detalle.
//
// No se ejecuta en el build. Es una pasada manual, y necesita la clave
// service_role porque escribe en Storage:
//
//   npm i -D sharp
//   SUPABASE_SERVICE_KEY=<clave service_role> node scripts/optimize-storage.mjs          (simulacion)
//   SUPABASE_SERVICE_KEY=<clave service_role> node scripts/optimize-storage.mjs --aplicar
//
// Sin --aplicar solo mide y dice que haria. La clave service_role salta el RLS:
// sale del Dashboard, en Settings > API, y no se guarda en el repositorio.
//
// Sobrescribe el objeto conservando su nombre, asi que las URLs guardadas en la
// base siguen valiendo y no hay que tocar ni una fila.

import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const ANCHO_MAX = 1200
const CALIDAD = 82
// Por debajo de esto no vale la pena ni el viaje de ida y vuelta.
const MINIMO_PARA_TOCAR = 200 * 1024
const BUCKET = 'products'

const aplicar = process.argv.includes('--aplicar')

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const URL_BASE = env.VITE_SUPABASE_URL
const CLAVE = process.env.SUPABASE_SERVICE_KEY

if (!URL_BASE) throw new Error('Falta VITE_SUPABASE_URL en .env')
if (!CLAVE) {
  console.error('Falta SUPABASE_SERVICE_KEY. Sale del Dashboard de Supabase, en Settings > API.')
  process.exit(1)
}

const cabeceras = { apikey: CLAVE, Authorization: `Bearer ${CLAVE}` }

/** Storage pagina de 100 en 100; sin esto solo se veria la primera tanda. */
async function listarTodo() {
  const todos = []
  for (let desde = 0; ; desde += 100) {
    const res = await fetch(`${URL_BASE}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...cabeceras, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 100, offset: desde }),
    })
    if (!res.ok) throw new Error(`list: ${res.status} ${await res.text()}`)
    const tanda = await res.json()
    todos.push(...tanda)
    if (tanda.length < 100) return todos
  }
}

const esImagen = (n) => /\.(jpe?g|png|webp)$/i.test(n)
const formatoDe = (n) => {
  const ext = n.split('.').pop().toLowerCase()
  return ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg'
}
const MIME = { png: 'image/png', webp: 'image/webp', jpeg: 'image/jpeg' }

const objetos = (await listarTodo()).filter((o) => esImagen(o.name))
console.log(`${objetos.length} imagenes en el bucket "${BUCKET}"`)
if (!aplicar) console.log('SIMULACION — no se escribe nada. Anade --aplicar para hacerlo de verdad.\n')

let antes = 0
let despues = 0
let tocadas = 0
let saltadas = 0

for (const obj of objetos) {
  const pesoOriginal = obj.metadata?.size || 0
  if (pesoOriginal < MINIMO_PARA_TOCAR) {
    saltadas++
    antes += pesoOriginal
    despues += pesoOriginal
    continue
  }

  const url = `${URL_BASE}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(obj.name)}`
  const original = Buffer.from(await (await fetch(url)).arrayBuffer())

  const img = sharp(original)
  const meta = await img.metadata()
  // Una foto ya estrecha pero pesada se recomprime igual: el ancho no es el
  // unico motivo por el que un jpeg de camara ocupa dos megas.
  const redimensionada = img.resize({
    width: Math.min(meta.width || ANCHO_MAX, ANCHO_MAX),
    withoutEnlargement: true,
  })
  // Cada foto conserva su formato. Convertir los jpeg a webp ahorraria algo
  // mas, pero la preview de WhatsApp no pinta webp — es el mismo agujero que
  // ya obligo a resubir once productos en jpg. El grueso del ahorro esta en
  // las dimensiones, no en el formato.
  const tipo = formatoDe(obj.name)
  const salida = await (tipo === 'png'
    ? redimensionada.png({ compressionLevel: 9 })
    : tipo === 'webp'
      ? redimensionada.webp({ quality: CALIDAD })
      : redimensionada.jpeg({ quality: CALIDAD, mozjpeg: true })
  ).toBuffer()

  antes += pesoOriginal
  // Si recomprimir no gana nada, se queda la original: mejor eso que perder
  // calidad a cambio de nada.
  const gana = salida.length < pesoOriginal * 0.9
  despues += gana ? salida.length : pesoOriginal

  const linea =
    `${gana ? '·' : ' '} ${String(Math.round(pesoOriginal / 1024)).padStart(5)} KB -> ` +
    `${String(Math.round(salida.length / 1024)).padStart(5)} KB  ${meta.width}x${meta.height}  ${obj.name.slice(0, 52)}`

  if (!gana) {
    console.log(`${linea}   (sin ganancia, se queda)`)
    continue
  }
  console.log(linea)
  tocadas++

  if (aplicar) {
    const res = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${encodeURIComponent(obj.name)}`, {
      method: 'PUT',
      headers: { ...cabeceras, 'Content-Type': MIME[formatoDe(obj.name)], 'x-upsert': 'true' },
      body: salida,
    })
    if (!res.ok) {
      console.error(`  fallo al subir ${obj.name}: ${res.status} ${await res.text()}`)
      process.exitCode = 1
    }
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(1)
console.log(
  `\n${tocadas} fotos ${aplicar ? 'recomprimidas' : 'por recomprimir'}, ${saltadas} ya ligeras.\n` +
    `Storage: ${mb(antes)} MB -> ${mb(despues)} MB (${mb(antes - despues)} MB menos)`
)

// ponytail: recomprime en el sitio, conservando nombre y formato, para no
// tocar ni una url de la base. Si algun dia hiciera falta exprimir mas, el
// siguiente paso es servir webp a quien lo acepte y jpg al resto — pero eso
// ya son dos objetos por foto y un <picture>, no una pasada de mantenimiento.
