// Baja las fotos alojadas en dominios ajenos y las vuelve a subir al Storage
// propio, actualizando `image_url` e `images` en Supabase.
//
// Por que: 146 de 235 productos servian su foto principal desde dominios de
// terceros —el CDN de Liverpool (un retailer competidor, con Cache-Control
// private), Pinterest, oggi.mx, images.lee.com…—. Pueden desaparecer o
// bloquear el hotlinking sin aviso, no posicionan en Google Images para este
// dominio, y son una exposicion legal por uso de material ajeno.
//
//   node scripts/rehost-images.mjs              # simulacro, no escribe nada
//   node scripts/rehost-images.mjs --aplicar    # sube y actualiza la base
//
// El simulacro solo lee: comprueba que cada foto siga viva, su tipo y su peso.
// Para --aplicar hace falta SUPABASE_SERVICE_KEY en el entorno: subir al bucket
// exige permisos de admin, la clave anonima no alcanza.

import { existsSync, readFileSync } from 'node:fs'

const APLICAR = process.argv.includes('--aplicar')
const BUCKET = 'products'
// Dominios que ya son nuestros: todo lo demas es ajeno y hay que traerselo.
const PROPIOS = ['supabase.co']

if (!process.env.VITE_SUPABASE_URL && existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const URL_BASE = process.env.VITE_SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_KEY

if (!URL_BASE) throw new Error('Falta VITE_SUPABASE_URL')
if (APLICAR && !SERVICE) {
  throw new Error(
    'Falta SUPABASE_SERVICE_KEY. Esta en el panel de Supabase, en Project Settings > API,\n' +
      'como "service_role". No la subas al repo: se pasa por el entorno para esta corrida.'
  )
}

const clave = APLICAR ? SERVICE : ANON
const cabeceras = { apikey: clave, Authorization: `Bearer ${clave}` }

const esAjena = (url) => {
  try {
    const host = new globalThis.URL(url).host
    return !PROPIOS.some((p) => host.endsWith(p))
  } catch {
    return false
  }
}

const extensionDe = (tipo) =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' })[tipo] ||
  'jpg'

const res = await fetch(
  `${URL_BASE}/rest/v1/products?select=id,name,image_url,images,badge`,
  { headers: cabeceras }
)
if (!res.ok) throw new Error(`Supabase: ${res.status} ${await res.text()}`)

const productos = (await res.json()).filter((p) => p.badge !== 'Borrador')

// Cada foto ajena, una sola vez aunque la compartan varios productos.
const trabajos = new Map()
for (const p of productos) {
  for (const url of [p.image_url, ...(p.images || [])]) {
    if (url && esAjena(url) && !trabajos.has(url)) {
      trabajos.set(url, { url, host: new globalThis.URL(url).host })
    }
  }
}

console.log(
  `[rehost] ${productos.length} productos publicados · ` +
    `${trabajos.size} fotos en dominios ajenos` +
    (APLICAR ? '' : ' · SIMULACRO, no se escribe nada')
)

const porHost = {}
const caidas = []
const nuevas = new Map() // url vieja -> url nueva

let n = 0
for (const trabajo of trabajos.values()) {
  n += 1
  let respuesta
  try {
    respuesta = await fetch(trabajo.url)
  } catch (e) {
    caidas.push({ ...trabajo, motivo: e.message })
    continue
  }
  if (!respuesta.ok) {
    caidas.push({ ...trabajo, motivo: `HTTP ${respuesta.status}` })
    continue
  }

  const tipo = respuesta.headers.get('content-type') || ''
  if (!tipo.startsWith('image/')) {
    caidas.push({ ...trabajo, motivo: `no es imagen (${tipo})` })
    continue
  }

  const bytes = new Uint8Array(await respuesta.arrayBuffer())
  porHost[trabajo.host] = (porHost[trabajo.host] || 0) + 1

  if (!APLICAR) {
    if (n % 25 === 0) console.log(`  ${n}/${trabajos.size} comprobadas`)
    continue
  }

  const nombre = `rehost-${Date.now()}-${n}.${extensionDe(tipo)}`
  const subida = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${nombre}`, {
    method: 'POST',
    headers: { ...cabeceras, 'Content-Type': tipo, 'x-upsert': 'false' },
    body: bytes,
  })
  if (!subida.ok) {
    caidas.push({ ...trabajo, motivo: `subida ${subida.status}: ${await subida.text()}` })
    continue
  }
  nuevas.set(trabajo.url, `${URL_BASE}/storage/v1/object/public/${BUCKET}/${nombre}`)
  console.log(`  ${n}/${trabajos.size} ${trabajo.host} -> ${nombre}`)
}

if (APLICAR) {
  let tocados = 0
  for (const p of productos) {
    const image_url = nuevas.get(p.image_url) || p.image_url
    const images = (p.images || []).map((u) => nuevas.get(u) || u)
    const cambia =
      image_url !== p.image_url || images.some((u, i) => u !== (p.images || [])[i])
    if (!cambia) continue

    const patch = await fetch(`${URL_BASE}/rest/v1/products?id=eq.${p.id}`, {
      method: 'PATCH',
      headers: { ...cabeceras, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ image_url, images }),
    })
    if (!patch.ok) {
      caidas.push({ url: p.id, host: p.name, motivo: `patch ${patch.status}` })
      continue
    }
    tocados += 1
  }
  console.log(`[rehost] ${nuevas.size} fotos subidas · ${tocados} productos actualizados`)
} else {
  console.log('\n[rehost] fotos vivas por dominio:')
  for (const [host, cuenta] of Object.entries(porHost).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(cuenta).padStart(3)}  ${host}`)
  }
}

if (caidas.length) {
  console.log(`\n[rehost] ${caidas.length} con problema — hay que resubirlas a mano:`)
  for (const c of caidas.slice(0, 20)) console.log(`  ${c.motivo}  ${c.host}  ${c.url.slice(0, 90)}`)
  if (caidas.length > 20) console.log(`  … y ${caidas.length - 20} mas`)
} else {
  console.log('\n[rehost] ninguna caida')
}
