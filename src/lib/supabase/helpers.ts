/**
 * Type helpers for Supabase query results.
 * Use these to extract row types for explicit typing.
 */
import type { Database } from './types'

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
