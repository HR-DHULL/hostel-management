'use server'

import { revalidatePath } from 'next/cache'
import { createClient, requireRole, logAudit } from '@/lib/supabase/server'
import { sendPaymentReceiptEmail } from '@/lib/email'
import { MONTH_NAMES } from '@/lib/utils'
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

export async function updateFeeAmount(
  module: FeeModule,
  feeId: string,
  totalAmount: number,
  discount: number
) {
  await requireRole('owner', 'staff')
  if (totalAmount < 0 || discount < 0 || discount > totalAmount) throw new Error('Invalid amount')
  const supabase = await createClient()
  const feeTable = FEE_TABLE[module]

  const { data: fee } = await (supabase.from(feeTable) as any)
    .select('paid_amount, due_date')
    .eq('id', feeId)
    .single()

  if (!fee) throw new Error('Fee record not found')

  const netAmount = totalAmount - discount
  const newStatus = computeStatus(netAmount, Number((fee as any).paid_amount), (fee as any).due_date)

  const { error } = await (supabase.from(feeTable) as any)
    .update({ total_amount: totalAmount, discount, net_amount: netAmount, status: newStatus })
    .eq('id', feeId)

  if (error) throw new Error(error.message)
  revalidatePath(feePath(module))
}

export async function recordPayment(
  module: FeeModule,
  feeId: string,
  amount: number,
  mode: string,
  notes: string,
  paidAt: string
) {
  await requireRole('owner', 'staff')
  if (amount <= 0) throw new Error('Amount must be positive')
  if (!paidAt || !/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) throw new Error('Invalid date')
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

  await logAudit({ action: 'payment', module: 'fees', entity_id: feeId, details: { amount, mode, module, month: f.month, year: f.year } })

  // Fire-and-forget: send payment receipt email if member has email
  try {
    const memberTable = module === 'hostel' ? 'hostel_students' : module === 'library' ? 'library_members' : 'mess_members'
    const { data: member } = await (supabase.from(memberTable) as any)
      .select('name, email')
      .eq('id', f[fk])
      .single()

    const memberData = member as any
    if (memberData?.email) {
      const { data: settings } = await (supabase.from('app_settings') as any)
        .select('inst_name')
        .limit(1)
        .single()

      const monthName = MONTH_NAMES[(f.month as number) - 1] ?? ''
      sendPaymentReceiptEmail({
        to: memberData.email,
        memberName: memberData.name,
        amountPaid: amount,
        totalPaid: newPaid,
        netAmount: Number(f.net_amount),
        balance: newBalance,
        month: monthName,
        year: f.year,
        mode,
        module,
        instName: (settings as any)?.inst_name ?? 'Management',
      }).catch(() => {}) // never break the payment flow
    }
  } catch {
    // Receipt email is optional — never break the payment flow
  }

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

export async function correctPaidAmount(
  module: FeeModule,
  feeId: string,
  newPaidAmount: number
) {
  const supabase = await createClient()
  const feeTable = FEE_TABLE[module]
  const fk       = MEMBER_FK[module]
  const { data: { user } } = await supabase.auth.getUser()

  const { data: fee } = await (supabase.from(feeTable) as any)
    .select('*')
    .eq('id', feeId)
    .single()

  if (!fee) throw new Error('Fee record not found')
  const f = fee as any

  const newStatus = computeStatus(Number(f.net_amount), newPaidAmount, f.due_date)

  // Update paid_amount directly
  const { error } = await (supabase.from(feeTable) as any)
    .update({ paid_amount: newPaidAmount, status: newStatus })
    .eq('id', feeId)

  if (error) throw new Error(error.message)

  // Delete old payment logs for this fee and insert a correction entry
  await (supabase.from('payment_log') as any)
    .delete()
    .eq('fee_id', feeId)
    .eq('module', module)

  if (newPaidAmount > 0) {
    await (supabase.from('payment_log') as any).insert({
      module,
      fee_id: feeId,
      member_id: f[fk],
      amount: newPaidAmount,
      mode: 'other',
      notes: 'Corrected payment entry',
      paid_at: new Date().toISOString(),
      created_by: user?.id ?? null,
    })
  }

  await logAudit({ action: 'correction', module: 'fees', entity_id: feeId, details: { new_paid_amount: newPaidAmount, module, month: f.month, year: f.year } })
  revalidatePath(feePath(module))
}

export async function resetMonthFees(
  module: FeeModule,
  month: number,
  year: number
) {
  const supabase = await createClient()
  const feeTable = FEE_TABLE[module]

  // Get all fee IDs for this month first (to delete payment logs)
  const { data: fees } = await (supabase.from(feeTable) as any)
    .select('id')
    .eq('month', month)
    .eq('year', year)

  const feeIds = ((fees ?? []) as any[]).map(f => f.id)

  // Delete payment log entries for these fees
  if (feeIds.length > 0) {
    await (supabase.from('payment_log') as any)
      .delete()
      .in('fee_id', feeIds)
      .eq('module', module)
  }

  // Delete all fee records for this month
  const { error } = await (supabase.from(feeTable) as any)
    .delete()
    .eq('month', month)
    .eq('year', year)

  if (error) throw new Error(error.message)
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

export async function generateAllFees(month: number, year: number): Promise<{ hostel: number; library: number; mess: number }> {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  const MODULES: FeeModule[] = ['hostel', 'library', 'mess']
  const MEMBER_TABLE: Record<FeeModule, string> = {
    hostel:  'hostel_students',
    library: 'library_members',
    mess:    'mess_members',
  }

  const counts: Record<FeeModule, number> = { hostel: 0, library: 0, mess: 0 }

  for (const module of MODULES) {
    const feeTable    = FEE_TABLE[module]
    const memberTable = MEMBER_TABLE[module]
    const fk          = MEMBER_FK[module]

    const { data: members } = await (supabase.from(memberTable) as any)
      .select('id, monthly_fee_amount, fee_day, discount, joining_date')
      .eq('status', 'active')

    const activeMembers = (members ?? []) as any[]

    const { data: existing } = await (supabase.from(feeTable) as any)
      .select(fk)
      .eq('month', month)
      .eq('year', year)

    const existingIds = new Set((existing ?? []).map((f: any) => f[fk]))

    const today = new Date()
    const toInsert = activeMembers
      .filter(m => {
        const joined = new Date(m.joining_date)
        return joined <= new Date(year, month, 0) && !existingIds.has(m.id)
      })
      .map(m => {
        const lastDay    = new Date(year, month, 0).getDate()
        const clampedDay = Math.min(m.fee_day, lastDay)
        const dueDate    = new Date(year, month - 1, clampedDay)
        const net        = Number(m.monthly_fee_amount) - Number(m.discount)
        const status     = dueDate < today ? 'overdue' : 'pending'
        return {
          [fk]: m.id, month, year,
          due_date: dueDate.toISOString().split('T')[0],
          total_amount: Number(m.monthly_fee_amount),
          discount: Number(m.discount),
          net_amount: net,
          paid_amount: 0,
          status,
        }
      })

    if (toInsert.length > 0) {
      await (supabase.from(feeTable) as any).insert(toInsert)
      counts[module] = toInsert.length
    }
  }

  revalidatePath('/reports')
  revalidatePath('/fees/hostel')
  revalidatePath('/fees/library')
  revalidatePath('/fees/mess')

  return counts
}
