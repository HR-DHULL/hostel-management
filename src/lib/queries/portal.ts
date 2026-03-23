import { createClient } from '@/lib/supabase/server'

export interface PortalStudent {
  id:                  string
  name:                string
  phone:               string
  email:               string | null
  course:              string | null
  room_number:         string | null
  hostel_name:         string | null
  joining_date:        string
  status:              'active' | 'exited'
  monthly_fee_amount:  number
  discount:            number
}

export async function getPortalProfile(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('linked_student_id, display_name, role')
    .eq('id', userId)
    .single()

  if (!profile) return null
  return profile as {
    linked_student_id: string | null
    display_name: string
    role: 'owner' | 'staff' | 'student'
  }
}

export async function getPortalStudent(linkedStudentId: string) {
  const supabase = await createClient()

  const { data } = await (supabase.from('hostel_students') as any)
    .select('*, hostels(name)')
    .eq('id', linkedStudentId)
    .single()

  if (!data) return null
  const d = data as any
  return {
    id:                 d.id,
    name:               d.name,
    phone:              d.phone,
    email:              d.email,
    course:             d.course,
    room_number:        d.room_number,
    hostel_name:        d.hostels?.name ?? null,
    joining_date:       d.joining_date,
    status:             d.status,
    monthly_fee_amount: Number(d.monthly_fee_amount),
    discount:           Number(d.discount),
  } as PortalStudent
}

export interface PortalFeeRow {
  id:         string
  month:      number
  year:       number
  due_date:   string
  net_amount: number
  paid_amount: number
  balance:    number
  status:     'pending' | 'partial' | 'paid' | 'overdue'
}

export async function getPortalFees(studentId: string): Promise<PortalFeeRow[]> {
  const supabase = await createClient()

  const { data } = await (supabase.from('hostel_fees') as any)
    .select('id, month, year, due_date, net_amount, paid_amount, status')
    .eq('student_id', studentId)
    .order('year',  { ascending: false })
    .order('month', { ascending: false })

  return ((data ?? []) as any[]).map((f: any) => ({
    id:          f.id,
    month:       f.month,
    year:        f.year,
    due_date:    f.due_date,
    net_amount:  Number(f.net_amount),
    paid_amount: Number(f.paid_amount),
    balance:     Number(f.net_amount) - Number(f.paid_amount),
    status:      f.status,
  }))
}

export interface PortalComplaintRow {
  id:              string
  subject:         string
  description:     string
  priority:        'low' | 'medium' | 'high' | 'urgent'
  status:          'open' | 'in_progress' | 'resolved'
  resolution_note: string | null
  created_at:      string
}

export async function getPortalComplaints(studentId: string): Promise<PortalComplaintRow[]> {
  const supabase = await createClient()

  const { data } = await (supabase.from('complaints') as any)
    .select('id, subject, description, priority, status, resolution_note, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  return (data ?? []) as PortalComplaintRow[]
}
