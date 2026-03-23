import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 25

export type ExpenseCategory = 'maintenance' | 'utilities' | 'staff' | 'food' | 'misc' | 'other'

export interface ExpenseRow {
  id:           string
  description:  string
  amount:       number
  category:     ExpenseCategory
  expense_date: string
  notes:        string | null
  created_at:   string
}

export async function getExpenses({
  page = 1,
  category,
  month,
  year,
}: {
  page?: number
  category?: string
  month?: number
  year?: number
} = {}) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = (supabase.from('expenses') as any)
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('expense_date', { ascending: false })

  if (category && category !== 'all') query = query.eq('category', category)

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end   = new Date(year, month, 0).toISOString().split('T')[0]
    query = query.gte('expense_date', start).lte('expense_date', end)
  }

  const { data, count } = await query

  return {
    expenses: (data ?? []) as ExpenseRow[],
    total:    count ?? 0,
    pageSize: PAGE_SIZE,
  }
}

export async function getExpenseSummary(month: number, year: number) {
  const supabase = await createClient()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end   = new Date(year, month, 0).toISOString().split('T')[0]

  const { data } = await (supabase.from('expenses') as any)
    .select('amount, category')
    .gte('expense_date', start)
    .lte('expense_date', end)

  const rows = (data ?? []) as { amount: number; category: string }[]
  const total = rows.reduce((s, r) => s + Number(r.amount), 0)

  const byCategory = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + Number(r.amount)
    return acc
  }, {})

  return { total, byCategory }
}
