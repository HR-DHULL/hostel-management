import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 25

export interface ComplaintRow {
  id:              string
  student_id:      string | null
  student_name:    string | null
  subject:         string
  description:     string
  priority:        'low' | 'medium' | 'high' | 'urgent'
  status:          'open' | 'in_progress' | 'resolved'
  resolution_note: string | null
  resolved_at:     string | null
  created_at:      string
}

export async function getComplaints({
  page = 1,
  status,
  priority,
}: {
  page?: number
  status?: string
  priority?: string
} = {}) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = (supabase.from('complaints') as any)
    .select('*, hostel_students(name)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (priority && priority !== 'all') query = query.eq('priority', priority)

  const { data, count } = await query

  return {
    complaints: ((data ?? []) as any[]).map((c: any) => ({
      id:              c.id,
      student_id:      c.student_id,
      student_name:    c.hostel_students?.name ?? null,
      subject:         c.subject,
      description:     c.description,
      priority:        c.priority,
      status:          c.status,
      resolution_note: c.resolution_note,
      resolved_at:     c.resolved_at,
      created_at:      c.created_at,
    })) as ComplaintRow[],
    total:    count ?? 0,
    pageSize: PAGE_SIZE,
  }
}

export async function getComplaintById(id: string) {
  const supabase = await createClient()

  const { data } = await (supabase.from('complaints') as any)
    .select('*, hostel_students(name, phone, room_number)')
    .eq('id', id)
    .single()

  if (!data) return null
  const c = data as any
  return {
    id:              c.id,
    student_id:      c.student_id,
    student_name:    c.hostel_students?.name ?? null,
    student_phone:   c.hostel_students?.phone ?? null,
    student_room:    c.hostel_students?.room_number ?? null,
    subject:         c.subject,
    description:     c.description,
    priority:        c.priority as 'low' | 'medium' | 'high' | 'urgent',
    status:          c.status as 'open' | 'in_progress' | 'resolved',
    resolution_note: c.resolution_note as string | null,
    resolved_at:     c.resolved_at as string | null,
    created_at:      c.created_at as string,
  }
}
