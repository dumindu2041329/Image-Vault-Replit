import { createClient } from '@supabase/supabase-js'

// Use placeholder values that will be replaced when config is loaded
let supabaseUrl = 'https://placeholder.supabase.co'
let supabaseAnonKey = 'placeholder-key'

// Create initial client
export let supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to initialize with real config
export async function initializeSupabase() {
  try {
    const response = await fetch('/api/config')
    if (response.ok) {
      const config = await response.json()
      if (config.supabaseUrl && config.supabaseAnonKey) {
        supabaseUrl = config.supabaseUrl
        supabaseAnonKey = config.supabaseAnonKey
        supabase = createClient(supabaseUrl, supabaseAnonKey)
        return true
      }
    }
    return false
  } catch (error) {
    console.error('Failed to initialize Supabase:', error)
    return false
  }
}