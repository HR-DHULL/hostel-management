'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createLibraryMember, updateLibraryMember } from '@/lib/actions/library'
import type { Tables } from '@/lib/supabase/helpers'

type MemberRow = Tables<'library_members'>

interface LibraryMemberFormProps {
  member?:    MemberRow
  onSuccess?: () => void
}

export function LibraryMemberForm({ member, onSuccess }: LibraryMemberFormProps) {
  const router  = useRouter()
  const isEdit  = !!member
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const payload = {
      name:                String(fd.get('name')   ?? ''),
      phone:               String(fd.get('phone')  ?? ''),
      email:               String(fd.get('email')  ?? '') || undefined,
      dob:                 String(fd.get('dob')    ?? '') || undefined,
      seat_number:         String(fd.get('seat_number') ?? '') || undefined,
      joining_date:        String(fd.get('joining_date') ?? ''),
      monthly_fee_amount:  Number(fd.get('monthly_fee_amount') ?? 0),
      fee_day:             Number(fd.get('fee_day') ?? 5),
      discount:            Number(fd.get('discount') ?? 0),
      notes:               String(fd.get('notes') ?? '') || undefined,
    }

    try {
      if (isEdit && member) {
        await updateLibraryMember(member.id, payload)
      } else {
        await createLibraryMember(payload)
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name <span className="text-danger">*</span></Label>
          <Input id="name" name="name" defaultValue={member?.name} required placeholder="Rahul Sharma" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone <span className="text-danger">*</span></Label>
          <Input id="phone" name="phone" defaultValue={member?.phone} required placeholder="9876543210" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={member?.email ?? ''} placeholder="rahul@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" name="dob" type="date" defaultValue={member?.dob ?? ''} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="seat_number">Seat number</Label>
          <Input id="seat_number" name="seat_number" defaultValue={member?.seat_number ?? ''} placeholder="A-01" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="joining_date">Joining date <span className="text-danger">*</span></Label>
          <Input
            id="joining_date"
            name="joining_date"
            type="date"
            defaultValue={member?.joining_date ?? new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="monthly_fee_amount">Monthly fee (₹) <span className="text-danger">*</span></Label>
          <Input id="monthly_fee_amount" name="monthly_fee_amount" type="number" min="0" step="0.01"
            defaultValue={member?.monthly_fee_amount ?? 0} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fee_day">Fee day (1–28)</Label>
          <Input id="fee_day" name="fee_day" type="number" min="1" max="28"
            defaultValue={member?.fee_day ?? 5} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discount">Discount (₹)</Label>
          <Input id="discount" name="discount" type="number" min="0" step="0.01"
            defaultValue={member?.discount ?? 0} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={member?.notes ?? ''} placeholder="Any additional notes…" rows={2} />
      </div>

      {error && (
        <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add member'}
        </Button>
      </div>
    </form>
  )
}
