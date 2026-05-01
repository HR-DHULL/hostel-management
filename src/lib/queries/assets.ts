import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 25

export type AssetCategory = 'laptop' | 'phone' | 'uniform' | 'furniture' | 'equipment' | 'other'
export type AssetStatus   = 'in_use' | 'in_storage' | 'retired' | 'lost'

export interface AssetRow {
  id:              string
  expense_id:      string | null
  name:            string
  category:        AssetCategory
  serial_number:   string | null
  status:          AssetStatus
  purchase_amount: number | null
  purchase_date:   string | null
  notes:           string | null
  created_at:      string
}

export interface AssignmentRow {
  id:                     string
  asset_id:               string
  assigned_to_profile_id: string | null
  assigned_to_name:       string | null
  assigned_to_phone:      string | null
  assigned_at:            string
  returned_at:            string | null
  assignment_notes:       string | null
}

export interface AssetWithHolder extends AssetRow {
  current_holder_name:  string | null
  current_holder_phone: string | null
  assigned_at:          string | null
}

/**
 * Resolve "who is holding this right now" by joining the active assignment
 * (returned_at IS NULL) with the profile or falling back to the captured name.
 */
export async function getAssets({
  page = 1,
  status,
  category,
  search,
}: {
  page?:     number
  status?:   string
  category?: string
  search?:   string
} = {}) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  // Pull assets with their active assignment + the joined profile name.
  // PostgREST embeds: asset_assignments!asset_id pulls the related rows,
  // we filter the embed to only active (returned_at IS NULL) assignments.
  let query = (supabase.from('assets') as any)
    .select(`
      *,
      asset_assignments!asset_id (
        assigned_to_name,
        assigned_to_phone,
        assigned_at,
        returned_at,
        profile:profiles!assigned_to_profile_id ( display_name )
      )
    `, { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status   && status   !== 'all') query = query.eq('status', status)
  if (category && category !== 'all') query = query.eq('category', category)
  if (search) query = query.or(`name.ilike.%${search}%,serial_number.ilike.%${search}%`)

  const { data, count } = await query

  const assets: AssetWithHolder[] = (data ?? []).map((row: any) => {
    const active = (row.asset_assignments ?? []).find((a: any) => a.returned_at === null)
    return {
      id:              row.id,
      expense_id:      row.expense_id,
      name:            row.name,
      category:        row.category,
      serial_number:   row.serial_number,
      status:          row.status,
      purchase_amount: row.purchase_amount,
      purchase_date:   row.purchase_date,
      notes:           row.notes,
      created_at:      row.created_at,
      current_holder_name:
        active?.profile?.display_name ?? active?.assigned_to_name ?? null,
      current_holder_phone: active?.assigned_to_phone ?? null,
      assigned_at:          active?.assigned_at ?? null,
    }
  })

  return { assets, total: count ?? 0, pageSize: PAGE_SIZE }
}

/** Full assignment history for one asset, newest first. */
export async function getAssetAssignments(assetId: string) {
  const supabase = await createClient()

  const { data } = await (supabase.from('asset_assignments') as any)
    .select(`
      *,
      profile:profiles!assigned_to_profile_id ( display_name )
    `)
    .eq('asset_id', assetId)
    .order('assigned_at', { ascending: false })

  return (data ?? []).map((row: any) => ({
    ...row,
    profile_name: row.profile?.display_name ?? null,
  }))
}

/** Used by the expense detail UI to show "this purchase created N assets". */
export async function getAssetsByExpense(expenseId: string): Promise<AssetRow[]> {
  const supabase = await createClient()

  const { data } = await (supabase.from('assets') as any)
    .select('*')
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: true })

  return (data ?? []) as AssetRow[]
}

export async function getAssetSummary() {
  const supabase = await createClient()

  const { data } = await (supabase.from('assets') as any)
    .select('status')

  const rows = (data ?? []) as { status: AssetStatus }[]
  const total = rows.length
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  return { total, byStatus }
}
