'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createExpense, updateExpense, type AssetLineItem } from '@/lib/actions/expenses'
import type { ExpenseRow, ExpenseCategory } from '@/lib/queries/expenses'
import type { TeamMember } from '@/lib/queries/team-members'
import {
  AssetItemsRepeater,
  draftsToPayload,
  emptyAssetItem,
  type AssetItemDraft,
} from './AssetItemsRepeater'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'utilities',   label: 'Utilities' },
  { value: 'staff',       label: 'Staff' },
  { value: 'food',        label: 'Food' },
  { value: 'misc',        label: 'Misc' },
  { value: 'other',       label: 'Other' },
]

interface ExpenseFormProps {
  expense?:    ExpenseRow
  teamMembers: TeamMember[]
  onSuccess?:  () => void
}

export function ExpenseForm({ expense, teamMembers, onSuccess }: ExpenseFormProps) {
  const router  = useRouter()
  const isEdit  = !!expense
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [category,  setCategory]  = useState<string>(expense?.category ?? 'misc')
  const [isAsset,   setIsAsset]   = useState<boolean>(!!expense?.is_asset_purchase)
  const [items,     setItems]     = useState<AssetItemDraft[]>(
    isEdit ? [] : [emptyAssetItem()],   // edit mode skips repeater entirely
  )

  function validate(payload: { description: string; amount: number; expense_date: string }) {
    if (!payload.description) return 'Description is required'
    if (!(payload.amount > 0)) return 'Amount must be greater than 0'
    if (!payload.expense_date) return 'Date is required'
    if (!isEdit && isAsset) {
      if (items.length === 0) return 'Add at least one asset item'
      for (const it of items) {
        if (!it.name.trim()) return 'Each asset needs a name'
        if (!it.recipient_choice) return 'Each asset needs a recipient'
        if (it.recipient_choice === '__new__' && !it.assigned_to_name.trim()) {
          return 'New-joiner recipient needs a name'
        }
      }
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const base = {
      description:  String(fd.get('description') ?? '').trim(),
      amount:       Number(fd.get('amount') ?? 0),
      category:     category as ExpenseCategory,
      expense_date: String(fd.get('expense_date') ?? ''),
      notes:        String(fd.get('notes') ?? '') || undefined,
      given_to:     String(fd.get('given_to') ?? '') || undefined,
    }

    const validationError = validate(base)
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    try {
      if (isEdit && expense) {
        await updateExpense(expense.id, base)
      } else {
        const assetPayload: AssetLineItem[] = isAsset
          ? draftsToPayload(items)
          : []
        await createExpense({
          ...base,
          is_asset_purchase: isAsset,
          asset_items:       assetPayload,
        })
      }
      onSuccess?.()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="description">Description <span className="text-danger">*</span></Label>
        <Input
          id="description"
          name="description"
          defaultValue={expense?.description}
          required
          placeholder="e.g. Plumber repair Block A, or 5 staff laptops"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (Rs) <span className="text-danger">*</span></Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={expense?.amount ?? ''}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expense_date">Date <span className="text-danger">*</span></Label>
          <Input
            id="expense_date"
            name="expense_date"
            type="date"
            defaultValue={expense?.expense_date ?? new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isAsset && (
        <div className="space-y-1.5">
          <Label htmlFor="given_to">
            Given to <span className="text-slate-400 text-xs">(optional)</span>
          </Label>
          <Input
            id="given_to"
            name="given_to"
            defaultValue={expense?.given_to ?? ''}
            placeholder="Mess kitchen, Block A, Common area..."
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={expense?.notes ?? ''}
          placeholder="Receipt no., vendor..."
          rows={2}
        />
      </div>

      {!isEdit && (
        <div className="rounded-md border border-border bg-slate-50/50 p-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAsset}
              onChange={(e) => setIsAsset(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">
                This expense is an asset purchase
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tick when buying durable items issued to team members (laptop, phone, uniform). Each item gets tracked in the Assets register.
              </p>
            </div>
          </label>

          {isAsset && (
            <div className="mt-4">
              <AssetItemsRepeater
                items={items}
                onChange={setItems}
                teamMembers={teamMembers}
              />
            </div>
          )}
        </div>
      )}

      {isEdit && expense?.is_asset_purchase && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Asset items for this expense are managed from the <strong>Assets</strong> page.
          Editing here only updates the bill details.
        </p>
      )}

      {error && (
        <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  )
}
