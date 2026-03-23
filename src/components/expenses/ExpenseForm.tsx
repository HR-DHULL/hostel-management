'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createExpense, updateExpense } from '@/lib/actions/expenses'
import type { ExpenseRow, ExpenseCategory } from '@/lib/queries/expenses'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'utilities',   label: 'Utilities' },
  { value: 'staff',       label: 'Staff' },
  { value: 'food',        label: 'Food' },
  { value: 'misc',        label: 'Misc' },
  { value: 'other',       label: 'Other' },
]

interface ExpenseFormProps {
  expense?:   ExpenseRow
  onSuccess?: () => void
}

export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const router  = useRouter()
  const isEdit  = !!expense
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [category, setCategory] = useState<string>(expense?.category ?? 'misc')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const payload = {
      description:  String(fd.get('description') ?? '').trim(),
      amount:       Number(fd.get('amount') ?? 0),
      category:     category as ExpenseCategory,
      expense_date: String(fd.get('expense_date') ?? ''),
      notes:        String(fd.get('notes') ?? '') || undefined,
    }

    try {
      if (isEdit && expense) {
        await updateExpense(expense.id, payload)
      } else {
        await createExpense(payload)
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
          placeholder="e.g. Plumber repair — Block A"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹) <span className="text-danger">*</span></Label>
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

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={expense?.notes ?? ''}
          placeholder="Receipt no., vendor…"
          rows={2}
        />
      </div>

      {error && (
        <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  )
}
