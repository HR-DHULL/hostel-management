import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/helpers'

const PAGE_SIZE = 25

export type LibraryMemberRow = Tables<'library_members'>

export interface LibraryListParams {
  page?:   number
  search?: string
  status?: 'active' | 'exited' | 'all'
}

export async function getLibraryMembers({
  page = 1,
  search = '',
  status = 'active',
}: LibraryListParams = {}) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = (supabase.from('library_members') as any)
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,seat_number.ilike.%${search}%`)
  }

  const { data, count } = await query

  return {
    members:  (data ?? []) as LibraryMemberRow[],
    total:    count ?? 0,
    pageSize: PAGE_SIZE,
  }
}

export async function getLibraryMemberById(id: string) {
  const supabase = await createClient()

  const { data } = await (supabase.from('library_members') as any)
    .select('*')
    .eq('id', id)
    .single()

  if (!data) return null
  return data as LibraryMemberRow
}

export async function getLibrarySeatsInUse() {
  const supabase = await createClient()

  const { data } = await (supabase.from('library_members') as any)
    .select('seat_number')
    .eq('status', 'active')
    .not('seat_number', 'is', null)

  return ((data ?? []) as any[]).map((r: any) => r.seat_number as string)
}
