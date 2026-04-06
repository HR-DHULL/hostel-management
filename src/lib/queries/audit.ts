import { createClient } from '@/lib/supabase/server'

export interface AuditRow {
  id:                 string
  action:             string
  module:             string
  entity_name:        string | null
  entity_id:          string | null
  details:            Record<string, unknown> | null
  performed_by:       string | null
  performed_by_name:  string | null
  created_at:         string
}

export async function getAuditLog(opts: {
  page:    number
  module?: string
  action?: string
}): Promise<{ rows: AuditRow[]; total: number }> {
  const supabase   = await createClient()
  const PAGE_SIZE  = 50
  const offset     = (opts.page - 1) * PAGE_SIZE

  let query = (supabase as any)
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (opts.module && opts.module !== 'all') query = query.eq('module', opts.module)
  if (opts.action && opts.action !== 'all') query = query.eq('action', opts.action)

  const { data, count } = await query
  return { rows: (data ?? []) as AuditRow[], total: count ?? 0 }
}
