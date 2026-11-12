import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  base: '/',
  build: {
    // prerender.mjs lo lee para precargar el código de cada página (y lo borra)
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
