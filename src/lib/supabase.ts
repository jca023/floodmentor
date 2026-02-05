import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// For development/demo mode, we'll allow the app to work without Supabase
const isDemoMode = !supabaseUrl || !supabaseAnonKey

let supabase: SupabaseClient | null = null

if (!isDemoMode) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase, isDemoMode }

// Helper to check if Supabase is configured
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    )
  }
  return supabase
}
