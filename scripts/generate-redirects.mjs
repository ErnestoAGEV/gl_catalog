// Escribe en vercel.json los 301 de las urls viejas /producto/<uuid> hacia el
// slug nuevo.
//
// Se corre A MANO, no en cada build: Vercel lee vercel.json del repo, no de
// dist/, asi que el archivo tiene que estar commiteado para que surta efecto.
//
// Y no hace falta correrlo cada vez que agregas un producto: los uuid que
// alguien pudo haber compartido son los que ya existian en la migracion. Un
// producto nuevo nace con slug y nunca tuvo una url vieja que redirigir.
//
//   node scripts/generate-redirects.mjs

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { productPath } from '../src/utils/productCopy.js'

if (!process.env.VITE_SUPABASE_URL && existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (match) process.env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, '')
  }
}

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env
if (!url) throw new Error('Falta VITE_SUPABASE_URL')

const res = await fetch(`${url}/rest/v1/products?select=id,name,colors,badge`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
})
if (!res.ok) throw new Error(`Supabase: ${res.status}`)

const products = (await res.json()).filter((p) => p.badge !== 'Borrador')

const config = JSON.parse(readFileSync('vercel.json', 'utf8'))

// Solo se conservan los redirects que no son de producto, para poder volver a
// correr esto sin acumular entradas viejas.
const kept = (config.redirects || []).filter((r) => !r.source.startsWith('/producto/'))

const productRedirects = products
  .map((product) => ({
    source: `/producto/${product.id}`,
    destination: productPath(product),
    permanent: true,
  }))
  // El slug ya contiene el id: si coincidieran, el redirect seria un bucle
  .filter((r) => r.source !== r.destination)

config.redirects = [...kept, ...productRedirects]

writeFileSync('vercel.json', `${JSON.stringify(config, null, 2)}\n`)

console.log(
  `[redirects] ${productRedirects.length} urls viejas -> slug ` +
    `(${kept.length} redirects ajenos conservados)`
)
