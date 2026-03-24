import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/helpers'

const PAGE_SIZE = 25

export type StudentRow = Tables<'hostel_students'>
export type HostelRow  = Tables<'hostels'>

export interface StudentsListParams {
  page?: number
  search?: string
  status?: 'active' | 'exited' | 'all'
  hostelId?: string
}

export async function getStudents({
  page = 1,
  search = '',
  status = 'active',
  hostelId,
}: StudentsListParams = {}) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('hostel_students')
    .select('*, hostels(name)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,room_number.ilike.%${search}%`)
  }

  if (hostelId) {
    query = query.eq('hostel_id', hostelId)
  }

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  return {
    students: (data ?? []) as (StudentRow & { hostels: { name: string } | null })[],
    total: count ?? 0,
    pageSize: PAGE_SIZE,
  }
}

export async function getStudentById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hostel_students')
    .select('*, hostels(name, id)')
    .eq('id', id)
    .single()

  if (error) return null

  return data as StudentRow & { hostels: { name: string; id: string } | null }
}

export async function getStudentLeaves(studentId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('leaves')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  return ((data ?? []) as unknown) as Tables<'leaves'>[]
}

export async function getHostels() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('hostels')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (data ?? []) as HostelRow[]
}

export type StudentLinkedServices = {
  library: { id: string; seat_number: string | null; monthly_fee_amount: number; discount: number; joining_date: string } | null
  mess:    { id: string; meal_plan: string; custom_plan_name: string | null; monthly_fee_amount: number; discount: number; joining_date: string } | null
}

export async function getStudentLinkedServices(studentId: string): Promise<StudentLinkedServices> {
  const supabase = await createClient()
  const [lib, mess] = await Promise.all([
    (supabase as any)
      .from('library_members')
      .select('id, seat_number, monthly_fee_amount, discount, joining_date')
      .eq('linked_hostel_id', studentId)
      .eq('status', 'active')
      .maybeSingle(),
    (supabase as any)
      .from('mess_members')
      .select('id, meal_plan, custom_plan_name, monthly_fee_amount, discount, joining_date')
      .eq('linked_hostel_id', studentId)
      .eq('status', 'active')
      .maybeSingle(),
  ])
  return { library: lib.data ?? null, mess: mess.data ?? null }
}

export async function getStudentPortalUser(studentId: string): Promise<{ id: string } | null> {
  try {
    const supabase = await createAdminClient()
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('linked_student_id', studentId)
      .eq('role', 'student')
      .maybeSingle()
    return (data as { id: string } | null)
  } catch {
    return null
  }
}

export async function getOccupancyData() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('hostel_students')
    .select('id, name, room_number, hostel_id, status, hostels(name)')
    .eq('status', 'active')

  const { data: leavesData } = await supabase
    .from('leaves')
    .select('student_id, from_date, to_date')
    .eq('is_current', true)
    .eq('status', 'active')

  type LeaveRef = { student_id: string; from_date: string; to_date: string | null }
  const leaves = (leavesData ?? []) as LeaveRef[]
  const onLeaveIds = new Set(leaves.map(l => l.student_id))

  type StudentWithHostel = StudentRow & { hostels: { name: string } | null }

  const enriched = ((students ?? []) as StudentWithHostel[]).map(s => ({
    ...s,
    on_leave: onLeaveIds.has(s.id),
  }))

  return enriched
}
