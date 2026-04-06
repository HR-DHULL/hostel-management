'use server'

import { createClient, requireRole, createAdminClient } from '@/lib/supabase/server'
import { sendFeeReminderEmail } from '@/lib/email'
import { MONTH_NAMES } from '@/lib/utils'
import type { FeeModule } from '@/lib/queries/fees'

const MEMBER_TABLE: Record<FeeModule, string> = {
  hostel:  'hostel_students',
  library: 'library_members',
  mess:    'mess_members',
}

const MEMBER_FK: Record<FeeModule, string> = {
  hostel:  'student_id',
  library: 'member_id',
  mess:    'member_id',
}

const FEE_TABLE: Record<FeeModule, string> = {
  hostel:  'hostel_fees',
  library: 'library_fees',
  mess:    'mess_fees',
}

async function getInstName(): Promise<string> {
  const supabase = await createClient()
  const { data } = await (supabase.from('app_settings') as any)
    .select('inst_name')
    .limit(1)
    .single()
  return (data as any)?.inst_name ?? 'Management'
}

/** Send email reminder for a single fee record */
export async function sendSingleEmailReminder(
  module: FeeModule,
  feeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole('owner', 'staff')
    const supabase = await createClient()
    const feeTable = FEE_TABLE[module]
    const memberTable = MEMBER_TABLE[module]

    const { data: fee } = await (supabase.from(feeTable) as any)
      .select(`*, ${memberTable}(name, phone, email)`)
      .eq('id', feeId)
      .single()

    if (!fee) return { success: false, error: 'Fee record not found' }

    const f = fee as any
    const member = f[memberTable]
    const email = member?.email

    if (!email) return { success: false, error: 'No email address on file for this member' }

    const instName = await getInstName()
    const monthName = MONTH_NAMES[(f.month as number) - 1] ?? ''
    const dueDate = new Date(f.due_date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })

    await sendFeeReminderEmail({
      to: email,
      memberName: member.name,
      amount: Number(f.net_amount),
      balance: Number(f.net_amount) - Number(f.paid_amount),
      month: `${monthName} ${f.year}`,
      dueDate,
      module,
      instName,
    })

    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send email' }
  }
}

/** Send email reminders to multiple fee records (bulk) */
export async function sendBulkEmailReminders(
  module: FeeModule,
  feeIds: string[]
): Promise<{ sent: number; failed: number; noEmail: number }> {
  await requireRole('owner', 'staff')
  const supabase = await createClient()
  const feeTable = FEE_TABLE[module]
  const memberTable = MEMBER_TABLE[module]

  const { data: fees } = await (supabase.from(feeTable) as any)
    .select(`*, ${memberTable}(name, phone, email)`)
    .in('id', feeIds)

  if (!fees || fees.length === 0) return { sent: 0, failed: 0, noEmail: 0 }

  const instName = await getInstName()
  let sent = 0, failed = 0, noEmail = 0

  for (const fee of fees as any[]) {
    const member = fee[memberTable]
    const email = member?.email

    if (!email) { noEmail++; continue }

    const monthName = MONTH_NAMES[(fee.month as number) - 1] ?? ''
    const dueDate = new Date(fee.due_date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })

    try {
      await sendFeeReminderEmail({
        to: email,
        memberName: member.name,
        amount: Number(fee.net_amount),
        balance: Number(fee.net_amount) - Number(fee.paid_amount),
        month: `${monthName} ${fee.year}`,
        dueDate,
        module,
        instName,
      })
      sent++
    } catch {
      failed++
    }
  }

  return { sent, failed, noEmail }
}
