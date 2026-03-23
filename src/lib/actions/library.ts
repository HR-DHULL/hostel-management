'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type MemberInsert = {
  name: string
  phone: string
  email?: string
  dob?: string
  seat_number?: string
  joining_date: string
  monthly_fee_amount: number
  fee_day: number
  discount?: number
  linked_hostel_id?: string
  notes?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export async function createLibraryMember(data: MemberInsert) {
  const supabase = await createClient()

  const { data: member, error } = await (supabase.from('library_members') as any)
    .insert({ ...data, status: 'active' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/library')
  return member
}

export async function updateLibraryMember(id: string, data: Partial<MemberInsert>) {
  const supabase = await createClient()

  const { error } = await (supabase.from('library_members') as any)
    .update(data as AnyRecord)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/library')
  revalidatePath(`/library/${id}`)
}

export async function exitLibraryMember(id: string, exitDate: string) {
  const supabase = await createClient()

  const { error } = await (supabase.from('library_members') as any)
    .update({ status: 'exited', exit_date: exitDate, seat_number: null })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/library')
  revalidatePath(`/library/${id}`)
}

export async function deleteLibraryMember(id: string) {
  const supabase = await createClient()

  const { data: member } = await (supabase.from('library_members') as any)
    .select('*')
    .eq('id', id)
    .single()

  if (member) {
    const { data: { user } } = await supabase.auth.getUser()
    await (supabase.from('deleted_records') as any).insert({
      table_name: 'library_members',
      record_id:  id,
      record_data: member,
      deleted_by:  user?.id ?? null,
    })
  }

  const { error } = await (supabase.from('library_members') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/library')
}
