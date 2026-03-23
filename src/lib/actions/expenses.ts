'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ExpenseCategory } from '@/lib/queries/expenses'

type ExpenseInsert = {
  description:  string
  amount:       number
  category:     ExpenseCategory
  expense_date: string
  notes?:       string
}

export async function createExpense(data: ExpenseInsert) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await (supabase.from('expenses') as any).insert({
    ...data,
    created_by: user?.id ?? null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/expenses')
}

export async function updateExpense(id: string, data: Partial<ExpenseInsert>) {
  const supabase = await createClient()

  const { error } = await (supabase.from('expenses') as any)
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/expenses')
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()

  const { error } = await (supabase.from('expenses') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/expenses')
}
