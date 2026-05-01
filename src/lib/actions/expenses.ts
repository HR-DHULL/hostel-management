'use server'

import { revalidatePath } from 'next/cache'
import { createClient, requireRole } from '@/lib/supabase/server'
import type { ExpenseCategory } from '@/lib/queries/expenses'
import type { AssetCategory } from '@/lib/queries/assets'

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export interface AssetLineItem {
  name:           string
  category:       AssetCategory
  serial_number?: string | null
  /**
   * Recipient: either an existing profile OR a free-text name.
   * Phone optional. If neither id nor name set, the asset is created in
   * 'in_storage' state (no initial assignment).
   */
  assigned_to_profile_id?: string | null
  assigned_to_name?:       string | null
  assigned_to_phone?:      string | null
}

interface ExpenseInsert {
  description:       string
  amount:            number
  category:          ExpenseCategory
  expense_date:      string
  notes?:            string
  given_to?:         string
  is_asset_purchase?: boolean
  /** Only used when is_asset_purchase=true. One row per physical item. */
  asset_items?:      AssetLineItem[]
}

// ----------------------------------------------------------------------
// CREATE expense (+ optional asset rows + initial assignments)
// ----------------------------------------------------------------------

export async function createExpense(data: ExpenseInsert) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { asset_items, is_asset_purchase, ...expenseFields } = data

  // 1. Insert the expense row
  const { data: expense, error } = await (supabase.from('expenses') as any)
    .insert({
      ...expenseFields,
      given_to:          expenseFields.given_to?.trim() || null,
      is_asset_purchase: !!is_asset_purchase,
      created_by:        user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  const expenseId = expense.id as string

  // 2. If asset purchase, create one asset row per line item + initial assignment
  if (is_asset_purchase && asset_items && asset_items.length > 0) {
    try {
      for (const item of asset_items) {
        const { data: asset, error: assetErr } = await (supabase.from('assets') as any)
          .insert({
            expense_id:      expenseId,
            name:            item.name,
            category:        item.category,
            serial_number:   item.serial_number?.trim() || null,
            purchase_amount: data.amount / asset_items.length,
            purchase_date:   data.expense_date,
            created_by:      user?.id ?? null,
          })
          .select('id')
          .single()

        if (assetErr) throw new Error(assetErr.message)
        const assetId = asset.id as string

        const hasProfile = !!item.assigned_to_profile_id
        const hasName    = !!(item.assigned_to_name && item.assigned_to_name.trim())

        if (hasProfile || hasName) {
          const { error: assignErr } = await (supabase.from('asset_assignments') as any).insert({
            asset_id:               assetId,
            assigned_to_profile_id: item.assigned_to_profile_id ?? null,
            assigned_to_name:       item.assigned_to_name?.trim() || null,
            assigned_to_phone:      item.assigned_to_phone?.trim() || null,
            created_by:             user?.id ?? null,
          })
          if (assignErr) throw new Error(assignErr.message)
        } else {
          // No recipient: park it in storage
          await (supabase.from('assets') as any)
            .update({ status: 'in_storage' })
            .eq('id', assetId)
        }
      }
    } catch (e) {
      // Roll back: remove the expense (CASCADE wipes any partial asset rows
      // because expense_id is SET NULL — actually it doesn't cascade, it
      // detaches). So we manually clean assets created so far before
      // bubbling the error up.
      await (supabase.from('assets') as any).delete().eq('expense_id', expenseId)
      await (supabase.from('expenses') as any).delete().eq('id', expenseId)
      throw e
    }
  }

  revalidatePath('/expenses')
  revalidatePath('/assets')
}

// ----------------------------------------------------------------------
// UPDATE / DELETE  (asset rows are NOT mutated by editing the expense.
// Use the /assets page to manage assignments going forward.)
// ----------------------------------------------------------------------

export async function updateExpense(
  id: string,
  data: Omit<Partial<ExpenseInsert>, 'asset_items' | 'is_asset_purchase'>
) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  const patch = {
    ...data,
    given_to: data.given_to !== undefined ? (data.given_to.trim() || null) : undefined,
  }

  const { error } = await (supabase.from('expenses') as any)
    .update(patch)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/expenses')
}

export async function deleteExpense(id: string) {
  await requireRole('owner')
  const supabase = await createClient()

  // Detach assets first (expense_id ON DELETE SET NULL also handles this,
  // but being explicit makes the intent obvious).
  await (supabase.from('assets') as any)
    .update({ expense_id: null })
    .eq('expense_id', id)

  const { error } = await (supabase.from('expenses') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/expenses')
  revalidatePath('/assets')
}
