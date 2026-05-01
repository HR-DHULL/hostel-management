'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AssetCategory } from '@/lib/queries/assets'
import type { TeamMember } from '@/lib/queries/team-members'

const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: 'laptop',    label: 'Laptop' },
  { value: 'phone',     label: 'Phone' },
  { value: 'uniform',   label: 'Uniform' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other',     label: 'Other' },
]

const NEW_JOINER_KEY = '__new__'

export interface AssetItemDraft {
  name:                   string
  category:               AssetCategory
  serial_number:          string
  /** Either a profile id, or NEW_JOINER_KEY meaning "use the typed name" */
  recipient_choice:       string
  assigned_to_name:       string
  assigned_to_phone:      string
}

export function emptyAssetItem(): AssetItemDraft {
  return {
    name:              '',
    category:          'other',
    serial_number:     '',
    recipient_choice:  '',
    assigned_to_name:  '',
    assigned_to_phone: '',
  }
}

interface Props {
  items:        AssetItemDraft[]
  onChange:     (items: AssetItemDraft[]) => void
  teamMembers:  TeamMember[]
}

export function AssetItemsRepeater({ items, onChange, teamMembers }: Props) {
  function update(index: number, patch: Partial<AssetItemDraft>) {
    const next = items.slice()
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  function add() {
    onChange([...items, emptyAssetItem()])
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Asset items <span className="text-slate-400 text-xs">({items.length})</span>
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3.5 w-3.5" />
          Add item
        </Button>
      </div>

      {items.length === 0 && (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-slate-400">
          No items yet. Click &quot;Add item&quot; for each physical asset on this bill.
        </p>
      )}

      {items.map((item, idx) => {
        const isNewJoiner = item.recipient_choice === NEW_JOINER_KEY

        return (
          <div
            key={idx}
            className="rounded-md border border-border bg-slate-50/50 p-3 space-y-3"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Item {idx + 1}
              </p>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-slate-400 hover:text-danger transition-colors"
                title="Remove item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  required
                  value={item.name}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="Dell Latitude 7420"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category *</Label>
                <Select
                  value={item.category}
                  onValueChange={(v) => update(idx, { category: v as AssetCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">
                Serial / IMEI <span className="text-slate-400">(optional)</span>
              </Label>
              <Input
                value={item.serial_number}
                onChange={(e) => update(idx, { serial_number: e.target.value })}
                placeholder="SN-2026-0042"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Issue to *</Label>
              <Select
                value={item.recipient_choice || undefined}
                onValueChange={(v) => update(idx, { recipient_choice: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.display_name} <span className="text-slate-400">({m.role})</span>
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_JOINER_KEY}>+ New joiner / Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isNewJoiner && (
              <div className="grid grid-cols-2 gap-2 rounded bg-white p-2 border border-border">
                <div className="space-y-1">
                  <Label className="text-xs">Name *</Label>
                  <Input
                    required={isNewJoiner}
                    value={item.assigned_to_name}
                    onChange={(e) => update(idx, { assigned_to_name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Phone <span className="text-slate-400">(optional)</span>
                  </Label>
                  <Input
                    value={item.assigned_to_phone}
                    onChange={(e) => update(idx, { assigned_to_phone: e.target.value })}
                    placeholder="+91"
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Convert UI drafts to the action payload shape.
 * Resolves recipient_choice into either profile_id or text name.
 */
export function draftsToPayload(items: AssetItemDraft[]) {
  return items.map(item => {
    const isNewJoiner = item.recipient_choice === NEW_JOINER_KEY
    return {
      name:                   item.name.trim(),
      category:               item.category,
      serial_number:          item.serial_number.trim() || null,
      assigned_to_profile_id: isNewJoiner || !item.recipient_choice ? null : item.recipient_choice,
      assigned_to_name:       isNewJoiner ? item.assigned_to_name.trim() : null,
      assigned_to_phone:      isNewJoiner ? item.assigned_to_phone.trim() || null : null,
    }
  })
}
