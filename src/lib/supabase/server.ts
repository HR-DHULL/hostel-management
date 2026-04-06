import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — cookies can't be set here.
            // Session refresh is handled by middleware.
          }
        },
      },
    }
  )
}

/**
 * Verify the current user has one of the allowed roles.
 * Throws a 403 error if the check fails — call this at the top of sensitive server actions.
 */
export async function requireRole(...allowed: ('owner' | 'staff' | 'student')[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized: not logged in')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as { role: string } | null)?.role
  if (!role || !allowed.includes(role as 'owner' | 'staff' | 'student')) {
    throw new Error('Unauthorized: insufficient permissions')
  }
}

export interface AuditEntry {
  action:   'create' | 'update' | 'delete' | 'payment' | 'correction' | 'generate' | 'invite' | 'revoke'
  module:   'hostel' | 'library' | 'mess' | 'fees' | 'settings' | 'team'
  entity_name?: string
  entity_id?:   string
  details?:     Record<string, unknown>
}

/**
 * Write a single audit log entry. Fire-and-forget — never throws.
 * Uses the admin client so it bypasses RLS on audit_log.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('display_name, institute_id')
      .eq('id', user.id)
      .single()

    const admin = await createAdminClient()
    await (admin as any).from('audit_log').insert({
      action:            entry.action,
      module:            entry.module,
      entity_name:       entry.entity_name ?? null,
      entity_id:         entry.entity_id   ?? null,
      details:           entry.details      ?? null,
      performed_by:      user.id,
      performed_by_name: (profile as any)?.display_name ?? user.email ?? null,
      institute_id:      (profile as any)?.institute_id ?? null,
    })
  } catch {
    // Audit logging must never break the main operation
  }
}

/** Service-role client — bypasses RLS entirely */
export async function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
