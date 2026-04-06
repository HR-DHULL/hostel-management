import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/helpers'

export type FeeModule = 'hostel' | 'library' | 'mess'

const FEE_TABLE: Record<FeeModule, 'hostel_fees' | 'library_fees' | 'mess_fees'> = {
  hostel:  'hostel_fees',
  library: 'library_fees',
  mess:    'mess_fees',
}

const MEMBER_TABLE: Record<FeeModule, 'hostel_students' | 'library_members' | 'mess_members'> = {
  hostel:  'hostel_students',
  library: 'library_members',
  mess:    'mess_members',
}

const MEMBER_FK: Record<FeeModule, string> = {
  hostel:  'student_id',
  library: 'member_id',
  mess:    'member_id',
}

export interface FeeRow {
  id: string
  member_id: string   // maps to student_id or member_id depending on module
  member_name: string
  member_phone: string
  member_email: string | null
  month: number
  year: number
  due_date: string
  total_amount: number
  discount: number
  net_amount: number
  paid_amount: number
  balance: number
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  notes: string | null
}

/** Generate missing fee records for active members, then return all fees for the month */
export async function getOrGenerateFees(
  module: FeeModule,
  month: number,
  year: number
): Promise<FeeRow[]> {
  const supabase = await createClient()
  const feeTable    = FEE_TABLE[module]
  const memberTable = MEMBER_TABLE[module]
  const fk          = MEMBER_FK[module]

  // 1. Get all active members
  const { data: members } = await (supabase.from(memberTable) as any)
    .select('id, name, phone, email, monthly_fee_amount, fee_day, discount, joining_date')
    .eq('status', 'active')

  const activeMembers = (members ?? []) as {
    id: string
    name: string
    phone: string
    monthly_fee_amount: number
    fee_day: number
    discount: number
    joining_date: string
  }[]

  // 2. Get existing fee records for this month
  const { data: existing } = await (supabase.from(feeTable) as any)
    .select('*')
    .eq('month', month)
    .eq('year', year)

  const existingIds = new Set((existing ?? []).map((f: any) => f[fk]))

  // 3. Generate missing fee records
  const today = new Date()
  const toInsert = activeMembers
    .filter(m => {
      // Only generate if member joined on or before this month
      const joined = new Date(m.joining_date)
      const monthStart = new Date(year, month - 1, 1)
      return joined <= new Date(year, month, 0) && !existingIds.has(m.id)
    })
    .map(m => {
      const dueDate = new Date(year, month - 1, m.fee_day)
      // Clamp to last day of month if fee_day > days in month
      const lastDay = new Date(year, month, 0).getDate()
      const clampedDay = Math.min(m.fee_day, lastDay)
      const finalDueDate = new Date(year, month - 1, clampedDay)
      const net = Number(m.monthly_fee_amount) - Number(m.discount)
      const status = finalDueDate < today ? 'overdue' : 'pending'

      return {
        [fk]: m.id,
        month,
        year,
        due_date: finalDueDate.toISOString().split('T')[0],
        total_amount: Number(m.monthly_fee_amount),
        discount: Number(m.discount),
        net_amount: net,
        paid_amount: 0,
        status,
      }
    })

  if (toInsert.length > 0) {
    await (supabase.from(feeTable) as any).insert(toInsert)
  }

  // 4. Update overdue status for existing unpaid records
  await (supabase.from(feeTable) as any)
    .update({ status: 'overdue' })
    .eq('month', month)
    .eq('year', year)
    .eq('paid_amount', 0)
    .lt('due_date', today.toISOString().split('T')[0])
    .in('status', ['pending'])

  // 5. Fetch all fees for this month with member info
  const { data: allFees } = await (supabase.from(feeTable) as any)
    .select(`*, ${memberTable}(name, phone, email)`)
    .eq('month', month)
    .eq('year', year)
    .order('due_date')

  return ((allFees ?? []) as any[]).map((f: any) => ({
    id: f.id,
    member_id: f[fk],
    member_name: f[memberTable]?.name ?? 'Unknown',
    member_phone: f[memberTable]?.phone ?? '',
    member_email: f[memberTable]?.email ?? null,
    month: f.month,
    year: f.year,
    due_date: f.due_date,
    total_amount: Number(f.total_amount),
    discount: Number(f.discount),
    net_amount: Number(f.net_amount),
    paid_amount: Number(f.paid_amount),
    balance: Number(f.net_amount) - Number(f.paid_amount),
    status: f.status,
    notes: f.notes,
  }))
}

export async function getFeeById(module: FeeModule, feeId: string) {
  const supabase = await createClient()
  const feeTable    = FEE_TABLE[module]
  const memberTable = MEMBER_TABLE[module]
  const fk          = MEMBER_FK[module]

  const { data } = await (supabase.from(feeTable) as any)
    .select(`*, ${memberTable}(name, phone, email, room_number, course, joining_date, monthly_fee_amount)`)
    .eq('id', feeId)
    .single()

  if (!data) return null
  const d = data as any

  return {
    id: d.id,
    member_id: d[fk],
    member_name: d[memberTable]?.name ?? '',
    member_phone: d[memberTable]?.phone ?? '',
    member_email: d[memberTable]?.email ?? null,
    member_room: d[memberTable]?.room_number ?? null,
    member_course: d[memberTable]?.course ?? null,
    member_joining_date: d[memberTable]?.joining_date ?? null,
    month: d.month as number,
    year: d.year as number,
    due_date: d.due_date as string,
    total_amount: Number(d.total_amount),
    discount: Number(d.discount),
    net_amount: Number(d.net_amount),
    paid_amount: Number(d.paid_amount),
    balance: Number(d.net_amount) - Number(d.paid_amount),
    status: d.status as string,
    notes: d.notes as string | null,
  }
}

export async function getPaymentHistory(module: FeeModule, feeId: string) {
  const supabase = await createClient()

  const { data } = await (supabase.from('payment_log') as any)
    .select('*')
    .eq('fee_id', feeId)
    .eq('module', module)
    .order('paid_at', { ascending: false })

  return (data ?? []) as any[]
}

export async function getMonthSummary(module: FeeModule, month: number, year: number) {
  const supabase = await createClient()
  const feeTable = FEE_TABLE[module]

  const { data } = await (supabase.from(feeTable) as any)
    .select('status, net_amount, paid_amount')
    .eq('month', month)
    .eq('year', year)

  const fees = (data ?? []) as any[]

  return {
    total:       fees.length,
    paid:        fees.filter(f => f.status === 'paid').length,
    partial:     fees.filter(f => f.status === 'partial').length,
    pending:     fees.filter(f => f.status === 'pending').length,
    overdue:     fees.filter(f => f.status === 'overdue').length,
    collected:   fees.reduce((s, f) => s + Number(f.paid_amount), 0),
    outstanding: fees.reduce((s, f) => s + (Number(f.net_amount) - Number(f.paid_amount)), 0),
  }
}

export interface StudentFeeHistoryRow {
  id: string
  month: number
  year: number
  due_date: string
  net_amount: number
  paid_amount: number
  balance: number
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  notes: string | null
}

/** All hostel fee records for a single student, newest first */
export async function getStudentFeeHistory(studentId: string): Promise<StudentFeeHistoryRow[]> {
  const supabase = await createClient()
  const { data } = await (supabase.from('hostel_fees') as any)
    .select('id, month, year, due_date, net_amount, paid_amount, balance, status, notes')
    .eq('student_id', studentId)
    .order('year',  { ascending: false })
    .order('month', { ascending: false })
  return (data ?? []) as StudentFeeHistoryRow[]
}
