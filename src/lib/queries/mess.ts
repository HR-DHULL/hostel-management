import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/helpers'

const PAGE_SIZE = 25

export type MessMemberRow = Tables<'mess_members'>

export interface MessListParams {
  page?:   number
  search?: string
  status?: 'active' | 'exited' | 'all'
}

export async function getMessMembers({
  page = 1,
  search = '',
  status = 'active',
}: MessListParams = {}) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = (supabase.from('mess_members') as any)
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, count } = await query

  return {
    members:  (data ?? []) as MessMemberRow[],
    total:    count ?? 0,
    pageSize: PAGE_SIZE,
  }
}

export async function getMessMemberById(id: string) {
  const supabase = await createClient()

  const { data } = await (supabase.from('mess_members') as any)
    .select('*')
    .eq('id', id)
    .single()

  if (!data) return null
  return data as MessMemberRow
}

export type AttendanceRow = {
  id: string
  member_id: string
  att_date: string
  present: boolean
}

/** Returns all attendance records for a given month+year */
export async function getMonthlyAttendance(month: number, year: number) {
  const supabase = await createClient()
  const start    = `${year}-${String(month).padStart(2, '0')}-01`
  const end      = new Date(year, month, 0).toISOString().split('T')[0]  // last day of month

  const { data } = await (supabase.from('mess_attendance') as any)
    .select('*')
    .gte('att_date', start)
    .lte('att_date', end)

  return (data ?? []) as AttendanceRow[]
}

/** Returns active members with their attendance count for the month */
export async function getAttendanceSummary(month: number, year: number) {
  const supabase = await createClient()

  const [membersResult, attendanceResult] = await Promise.all([
    (supabase.from('mess_members') as any)
      .select('id, name')
      .eq('status', 'active'),
    (async () => {
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const end   = new Date(year, month, 0).toISOString().split('T')[0]
      return (supabase.from('mess_attendance') as any)
        .select('member_id, present')
        .gte('att_date', start)
        .lte('att_date', end)
        .eq('present', true)
    })(),
  ])

  const members    = (membersResult.data    ?? []) as { id: string; name: string }[]
  const attendance = (attendanceResult.data ?? []) as { member_id: string }[]

  const countMap = attendance.reduce<Record<string, number>>((acc, a) => {
    acc[a.member_id] = (acc[a.member_id] ?? 0) + 1
    return acc
  }, {})

  return members.map(m => ({
    ...m,
    daysPresent: countMap[m.id] ?? 0,
  }))
}
