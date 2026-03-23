'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FeeModule } from '@/lib/queries/fees'

const FEE_TABLE: Record<FeeModule, string> = {
  hostel:  'hostel_fees',
  library: 'library_fees',
  mess:    'mess_fees',
}

const MEMBER_FK: Record<FeeModule, string> = {
  hostel:  'student_id',
  library: 'member_id',
  mess:    'member_id',
}

function feePath(module: FeeModule) {
  return `/fees/${module}`
}

function computeStatus(netAmount: number, paidAmount: number, dueDate: string): string {
  if (paidAmount <= 0) {
    const due = new Date(dueDate)
    return due < new Date() ? 'overdue' : 'pending'
  }
  if (paidAmount >= netAmount) return 'paid'
  return 'partial'
}

export async function recordPayment(
  module: FeeModule,
  feeId: string,
  amount: number,
  mode: string,
  notes: string,
  paidAt: string
) {
  const supabase = await createClient()
  const feeTable = FEE_TABLE[module]
  const fk       = MEMBER_FK[module]
  const { data: { user } } = await supabase.auth.getUser()

  // Get current fee
  const { data: fee } = await (supabase.from(feeTable) as any)
    .select('*')
    .eq('id', feeId)
    .single()

  if (!fee) throw new Error('Fee record not found')

  const f = fee as any
  const newPaid    = Number(f.paid_amount) + amount
  const newBalance = Number(f.net_amount) - newPaid
  const newStatus  = computeStatus(Number(f.net_amount), newPaid, f.due_date)

  // Update fee
  const { error: updateErr } = await (supabase.from(feeTable) as any)
    .update({ paid_amount: newPaid, status: newStatus })
    .eq('id', feeId)

  if (updateErr) throw new Error(updateErr.message)

  // Log payment
  await (supabase.from('payment_log') as any).insert({
    module,
    fee_id: feeId,
    member_id: f[fk],
    amount,
    mode,
    notes: notes || null,
    paid_at: paidAt,
    created_by: user?.id ?? null,
  })

  revalidatePath(feePath(module))
}

export async function bulkMarkPaid(
  module: FeeModule,
  feeIds: string[],
  mode: string,
  paidAt: string
) {
  const supabase = await createClient()
  const feeTable = FEE_TABLE[module]
  const fk       = MEMBER_FK[module]
  const { data: { user } } = await supabase.auth.getUser()

  const { data: fees } = await (supabase.from(feeTable) as any)
    .select('*')
    .in('id', feeIds)

  const paymentLogs = ((fees ?? []) as any[]).map(f => ({
    module,
    fee_id: f.id,
    member_id: f[fk],
    amount: Number(f.net_amount) - Number(f.paid_amount),
    mode,
    paid_at: paidAt,
    created_by: user?.id ?? null,
  }))

  // Mark all as paid
  await (supabase.from(feeTable) as any)
    .update({ paid_amount: null, status: 'paid' })
    .in('id', feeIds)

  // Update paid_amount for each to net_amount
  for (const f of (fees ?? []) as any[]) {
    await (supabase.from(feeTable) as any)
      .update({ paid_amount: Number(f.net_amount), status: 'paid' })
      .eq('id', f.id)
  }

  if (paymentLogs.length > 0) {
    await (supabase.from('payment_log') as any).insert(paymentLogs)
  }

  revalidatePath(feePath(module))
}

export async function recordAdvancePayment(
  module: FeeModule,
  memberId: string,
  startMonth: number,
  startYear: number,
  months: number,
  mode: string,
  paidAt: string
) {
  const supabase  = await createClient()
  const feeTable  = FEE_TABLE[module]
  const fk        = MEMBER_FK[module]
  const memberTable = module === 'hostel' ? 'hostel_students' : module === 'library' ? 'library_members' : 'mess_members'
  const { data: { user } } = await supabase.auth.getUser()

  // Get member fee details
  const { data: memberData } = await (supabase.from(memberTable) as any)
    .select('monthly_fee_amount, fee_day, discount')
    .eq('id', memberId)
    .single()

  if (!memberData) throw new Error('Member not found')
  const m = memberData as any

  const today = new Date()

  for (let i = 0; i < months; i++) {
    let m_num = startMonth + i
    let y = startYear
    if (m_num > 12) { m_num -= 12; y++ }

    const lastDay    = new Date(y, m_num, 0).getDate()
    const clampedDay = Math.min(Number(m.fee_day), lastDay)
    const dueDate    = new Date(y, m_num - 1, clampedDay).toISOString().split('T')[0]
    const net        = Number(m.monthly_fee_amount) - Number(m.discount)

    // Upsert fee record
    const { data: existing } = await (supabase.from(feeTable) as any)
      .select('id, paid_amount, net_amount')
      .eq(fk, memberId)
      .eq('month', m_num)
      .eq('year', y)
      .single()

    if (existing) {
      const ex = existing as any
      await (supabase.from(feeTable) as any)
        .update({ paid_amount: Number(ex.net_amount), status: 'paid' })
        .eq('id', ex.id)

      await (supabase.from('payment_log') as any).insert({
        module,
        fee_id: ex.id,
        member_id: memberId,
        amount: Number(ex.net_amount) - Number(ex.paid_amount),
        mode,
        notes: `Advance payment`,
        paid_at: paidAt,
        created_by: user?.id ?? null,
      })
    } else {
      const { data: newFee } = await (supabase.from(feeTable) as any)
        .insert({
          [fk]: memberId,
          month: m_num,
          year: y,
          due_date: dueDate,
          total_amount: Number(m.monthly_fee_amount),
          discount: Number(m.discount),
          net_amount: net,
          paid_amount: net,
          status: 'paid',
        })
        .select('id')
        .single()

      if (newFee) {
        await (supabase.from('payment_log') as any).insert({
          module,
          fee_id: (newFee as any).id,
          member_id: memberId,
          amount: net,
          mode,
          notes: `Advance payment`,
          paid_at: paidAt,
          created_by: user?.id ?? null,
        })
      }
    }
  }

  revalidatePath(feePath(module))
}
