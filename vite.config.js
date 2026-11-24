import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Minimo de envio gratis: shipping_settings es la fuente de verdad; se inyecta al construir.
async function readFreeShippingMin(env) {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  try {
    if (!url || !key) throw new Error('sin variables de Supabase')
    const res = await fetch(`${url}/rest/v1/rpc/free_shipping_min`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    const n = Number(await res.json())
    if (!res.ok || !Number.isFinite(n)) throw new Error(`HTTP ${res.status}`)
    return n
  } catch (err) {
    console.warn(`[vite] No pude leer free_shipping_min (${err.message}); uso 1499`)
    return 1499
  }
}

export default defineConfig(async ({ mode }) => ({
  define: { __FREE_SHIPPING_MIN__: JSON.stringify(await readFreeShippingMin(loadEnv(mode, process.cwd(), ''))) },
  plugins: [tailwindcss()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
}))
