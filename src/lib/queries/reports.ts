import { createClient } from '@/lib/supabase/server'

export interface ModuleSummary {
  billed:      number
  collected:   number
  outstanding: number
  countPaid:   number
  countPartial: number
  countPending: number
  countOverdue: number
  total:       number
}

export interface UnpaidRow {
  id:         string
  name:       string
  phone:      string
  net_amount: number
  paid_amount: number
  balance:    number
  status:     string
  due_date:   string
  module:     'hostel' | 'library' | 'mess'
}

export interface MonthlyReportData {
  month:     number
  year:      number
  hostel:    ModuleSummary
  library:   ModuleSummary
  mess:      ModuleSummary
  expenses:  number
  unpaid:    UnpaidRow[]
}

function summarise(fees: any[]): ModuleSummary {
  return {
    billed:       fees.reduce((s, f) => s + Number(f.net_amount),   0),
    collected:    fees.reduce((s, f) => s + Number(f.paid_amount),  0),
    outstanding:  fees.reduce((s, f) => s + Number(f.balance),      0),
    countPaid:    fees.filter(f => f.status === 'paid').length,
    countPartial: fees.filter(f => f.status === 'partial').length,
    countPending: fees.filter(f => f.status === 'pending').length,
    countOverdue: fees.filter(f => f.status === 'overdue').length,
    total:        fees.length,
  }
}

export async function getMonthlyReport(month: number, year: number): Promise<MonthlyReportData> {
  const supabase  = await createClient()
  const monthStr  = String(month).padStart(2, '0')
  const firstDay  = `${year}-${monthStr}-01`
  const lastDay   = new Date(year, month, 0).toISOString().split('T')[0]

  const [
    { data: hostelFees },
    { data: libraryFees },
    { data: messFees },
    { data: expensesData },
  ] = await Promise.all([
    (supabase.from('hostel_fees') as any)
      .select('id, net_amount, paid_amount, balance, status, due_date, student_id, hostel_students(name, phone)')
      .eq('month', month).eq('year', year),
    (supabase.from('library_fees') as any)
      .select('id, net_amount, paid_amount, balance, status, due_date, member_id, library_members(name, phone)')
      .eq('month', month).eq('year', year),
    (supabase.from('mess_fees') as any)
      .select('id, net_amount, paid_amount, balance, status, due_date, member_id, mess_members(name, phone)')
      .eq('month', month).eq('year', year),
    (supabase.from('expenses') as any)
      .select('amount')
      .gte('expense_date', firstDay)
      .lte('expense_date', lastDay),
  ])

  const hf = (hostelFees  ?? []) as any[]
  const lf = (libraryFees ?? []) as any[]
  const mf = (messFees    ?? []) as any[]

  // Build unpaid list across all modules
  const unpaid: UnpaidRow[] = [
    ...hf
      .filter(f => f.status !== 'paid')
      .map(f => ({
        id: f.id, module: 'hostel' as const,
        name: f.hostel_students?.name ?? '—', phone: f.hostel_students?.phone ?? '—',
        net_amount: Number(f.net_amount), paid_amount: Number(f.paid_amount),
        balance: Number(f.balance), status: f.status, due_date: f.due_date,
      })),
    ...lf
      .filter(f => f.status !== 'paid')
      .map(f => ({
        id: f.id, module: 'library' as const,
        name: f.library_members?.name ?? '—', phone: f.library_members?.phone ?? '—',
        net_amount: Number(f.net_amount), paid_amount: Number(f.paid_amount),
        balance: Number(f.balance), status: f.status, due_date: f.due_date,
      })),
    ...mf
      .filter(f => f.status !== 'paid')
      .map(f => ({
        id: f.id, module: 'mess' as const,
        name: f.mess_members?.name ?? '—', phone: f.mess_members?.phone ?? '—',
        net_amount: Number(f.net_amount), paid_amount: Number(f.paid_amount),
        balance: Number(f.balance), status: f.status, due_date: f.due_date,
      })),
  ].sort((a, b) => b.balance - a.balance)

  return {
    month, year,
    hostel:   summarise(hf),
    library:  summarise(lf),
    mess:     summarise(mf),
    expenses: (expensesData ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0),
    unpaid,
  }
}
