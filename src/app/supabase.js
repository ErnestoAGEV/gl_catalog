import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,       // Supabase guarda el JWT en localStorage de forma segura
      autoRefreshToken: true,     // Renueva el token antes de que expire
      detectSessionInUrl: false,
    }
  })
} else {
  console.warn('Supabase credentials missing! Check your .env file.')
}

export { supabase }
