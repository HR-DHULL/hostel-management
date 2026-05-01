'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createAsset } from '@/lib/actions/assets'
import type { AssetCategory } from '@/lib/queries/assets'
import type { TeamMember } from '@/lib/queries/team-members'

const NEW_JOINER = '__new__'

const CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: 'laptop',    label: 'Laptop' },
  { value: 'phone',     label: 'Phone' },
  { value: 'uniform',   label: 'Uniform' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other',     label: 'Other' },
]

interface AssetFormProps {
  teamMembers: TeamMember[]
  onSuccess?:  () => void
}

export function AssetForm({ teamMembers, onSuccess }: AssetFormProps) {
  const router = useRouter()

  const [category, setCategory] = useState<AssetCategory>('other')
  const [issueNow, setIssueNow] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [holderName,  setHolderName]  = useState('')
  const [holderPhone, setHolderPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const isNewJoiner = recipient === NEW_JOINER

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const name           = String(fd.get('name') ?? '').trim()
    const serial         = String(fd.get('serial_number') ?? '').trim()
    const purchaseAmount = Number(fd.get('purchase_amount') ?? 0)
    const purchaseDate   = String(fd.get('purchase_date') ?? '')
    const vendor         = String(fd.get('vendor') ?? '').trim()
    const notes          = String(fd.get('notes')  ?? '').trim()

    // Front-end validation
    if (!name) { setError('Name is required'); setLoading(false); return }
    if (issueNow) {
      if (!recipient) { setError('Pick a team member or "New joiner"'); setLoading(false); return }
      if (isNewJoiner && !holderName.trim()) {
        setError('New-joiner name is required'); setLoading(false); return
      }
    }

    try {
      await createAsset({
        name,
        category,
        serial_number:   serial || null,
        purchase_amount: purchaseAmount > 0 ? purchaseAmount : null,
        purchase_date:   purchaseDate || null,
        vendor:          vendor || null,
        notes:           notes  || null,
        assignment: issueNow
          ? {
              assigned_to_profile_id: isNewJoiner ? null : recipient,
              assigned_to_name:       isNewJoiner ? holderName : null,
              assigned_to_phone:      isNewJoiner ? holderPhone : null,
            }
          : undefined,
      })
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
        <Label htmlFor="name">Item name <span className="text-danger">*</span></Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Dell Latitude 7420, Cook uniform set..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
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
          <Label htmlFor="serial_number">
            Serial / IMEI <span className="text-slate-400 text-xs">(optional)</span>
          </Label>
          <Input id="serial_number" name="serial_number" placeholder="SN-2026-0042" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="purchase_amount">
            Purchase price (Rs) <span className="text-slate-400 text-xs">(optional)</span>
          </Label>
          <Input
            id="purchase_amount"
            name="purchase_amount"
            type="number"
            min="0"
            step="0.01"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="purchase_date">
            Purchase date <span className="text-slate-400 text-xs">(optional)</span>
          </Label>
          <Input
            id="purchase_date"
            name="purchase_date"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="vendor">
          Vendor / shop <span className="text-slate-400 text-xs">(optional)</span>
        </Label>
        <Input id="vendor" name="vendor" placeholder="Croma, Amazon, local market..." />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">
          Notes <span className="text-slate-400 text-xs">(optional)</span>
        </Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <div className="rounded-md border border-border bg-slate-50/50 p-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={issueNow}
            onChange={(e) => setIssueNow(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">Issue to a team member now</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Leave unticked to put it in storage. You can issue it later from the assets list.
            </p>
          </div>
        </label>

        {issueNow && (
          <div className="mt-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Holder *</Label>
              <Select value={recipient || undefined} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.display_name} <span className="text-slate-400">({m.role})</span>
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_JOINER}>+ New joiner / Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isNewJoiner && (
              <div className="grid grid-cols-2 gap-2 rounded bg-white p-2 border border-border">
                <div className="space-y-1">
                  <Label className="text-xs">Name *</Label>
                  <Input
                    required={isNewJoiner}
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Phone <span className="text-slate-400">(optional)</span>
                  </Label>
                  <Input
                    value={holderPhone}
                    onChange={(e) => setHolderPhone(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Saving...' : 'Add asset'}
        </Button>
      </div>
    </form>
  )
}
