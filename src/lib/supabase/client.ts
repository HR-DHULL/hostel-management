import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  // Fallbacks are safe — env vars are always set at runtime (Vercel/local .env.local)
  // These only activate during Next.js build-time SSR when no env is available
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  return createBrowserClient<Database>(url, key)
}
