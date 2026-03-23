'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type StudentInsert = {
  name: string
  phone: string
  email?: string
  dob?: string
  course?: string
  hostel_id?: string
  room_number?: string
  joining_date: string
  monthly_fee_amount: number
  fee_day: number
  discount?: number
  notes?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export async function createStudent(data: StudentInsert) {
  const supabase = await createClient()

  const { data: student, error } = await (supabase
    .from('hostel_students') as any)
    .insert({ ...data, status: 'active' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/hostel')
  return student
}

export async function updateStudent(id: string, data: Partial<StudentInsert>) {
  const supabase = await createClient()

  const { error } = await (supabase.from('hostel_students') as any)
    .update(data as AnyRecord)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/hostel')
  revalidatePath(`/hostel/${id}`)
}

export async function exitStudent(id: string, exitDate: string) {
  const supabase = await createClient()

  const { error } = await (supabase.from('hostel_students') as any)
    .update({ status: 'exited', exit_date: exitDate })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/hostel')
  revalidatePath(`/hostel/${id}`)
}

export async function deleteStudent(id: string) {
  const supabase = await createClient()

  // Get full record first for audit log
  const { data: student } = await (supabase.from('hostel_students') as any)
    .select('*')
    .eq('id', id)
    .single()

  if (student) {
    const { data: { user } } = await supabase.auth.getUser()
    await (supabase.from('deleted_records') as any).insert({
      table_name: 'hostel_students',
      record_id: id,
      record_data: student,
      deleted_by: user?.id ?? null,
    })
  }

  const { error } = await (supabase.from('hostel_students') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/hostel')
}

export async function grantLeave(studentId: string, fromDate: string, toDate: string | null, reason: string) {
  const supabase = await createClient()

  // End any current active leave
  await (supabase.from('leaves') as any)
    .update({ status: 'ended', is_current: false })
    .eq('student_id', studentId)
    .eq('is_current', true)

  const { error } = await (supabase.from('leaves') as any).insert({
    student_id: studentId,
    from_date: fromDate,
    to_date: toDate,
    reason,
    status: 'active',
    is_current: true,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/hostel/${studentId}`)
  revalidatePath('/hostel/occupancy')
}

export async function endLeave(leaveId: string, studentId: string) {
  const supabase = await createClient()

  const { error } = await (supabase.from('leaves') as any)
    .update({ status: 'ended', is_current: false, to_date: new Date().toISOString().split('T')[0] })
    .eq('id', leaveId)

  if (error) throw new Error(error.message)

  revalidatePath(`/hostel/${studentId}`)
  revalidatePath('/hostel/occupancy')
}
