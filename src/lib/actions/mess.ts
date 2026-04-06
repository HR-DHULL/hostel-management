'use server'

import { revalidatePath } from 'next/cache'
import { createClient, requireRole } from '@/lib/supabase/server'

type MemberInsert = {
  name: string
  phone: string
  email?: string
  meal_plan?: 'veg' | 'non_veg' | 'custom'
  custom_plan_name?: string
  joining_date: string
  monthly_fee_amount: number
  fee_day: number
  discount?: number
  linked_hostel_id?: string
  notes?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export async function createMessMember(data: MemberInsert) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  const { data: member, error } = await (supabase.from('mess_members') as any)
    .insert({ ...data, status: 'active' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/mess')
  return member
}

export async function updateMessMember(id: string, data: Partial<MemberInsert>) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  const { error } = await (supabase.from('mess_members') as any)
    .update(data as AnyRecord)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/mess')
  revalidatePath(`/mess/${id}`)
}

export async function exitMessMember(id: string, exitDate: string) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  const { error } = await (supabase.from('mess_members') as any)
    .update({ status: 'exited', exit_date: exitDate })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/mess')
  revalidatePath(`/mess/${id}`)
}

export async function deleteMessMember(id: string) {
  await requireRole('owner')
  const supabase = await createClient()

  const { data: member } = await (supabase.from('mess_members') as any)
    .select('*')
    .eq('id', id)
    .single()

  if (member) {
    const { data: { user } } = await supabase.auth.getUser()
    await (supabase.from('deleted_records') as any).insert({
      table_name: 'mess_members',
      record_id:  id,
      record_data: member,
      deleted_by:  user?.id ?? null,
    })
  }

  const { error } = await (supabase.from('mess_members') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/mess')
}

/** Upsert a single attendance record (toggle present/absent) */
export async function toggleAttendance(
  memberId: string,
  attDate: string,
  present: boolean
) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  // Check existing
  const { data: existing } = await (supabase.from('mess_attendance') as any)
    .select('id')
    .eq('member_id', memberId)
    .eq('att_date', attDate)
    .single()

  if (existing) {
    await (supabase.from('mess_attendance') as any)
      .update({ present })
      .eq('id', (existing as any).id)
  } else {
    await (supabase.from('mess_attendance') as any)
      .insert({ member_id: memberId, att_date: attDate, present })
  }

  const [year, month] = attDate.split('-').map(Number)
  revalidatePath(`/mess/attendance?month=${month}&year=${year}`)
}

/** Mark all active members present for a date */
export async function markAllPresent(attDate: string, memberIds: string[]) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  for (const memberId of memberIds) {
    const { data: existing } = await (supabase.from('mess_attendance') as any)
      .select('id')
      .eq('member_id', memberId)
      .eq('att_date', attDate)
      .single()

    if (existing) {
      await (supabase.from('mess_attendance') as any)
        .update({ present: true })
        .eq('id', (existing as any).id)
    } else {
      await (supabase.from('mess_attendance') as any)
        .insert({ member_id: memberId, att_date: attDate, present: true })
    }
  }

  const [year, month] = attDate.split('-').map(Number)
  revalidatePath(`/mess/attendance?month=${month}&year=${year}`)
}
