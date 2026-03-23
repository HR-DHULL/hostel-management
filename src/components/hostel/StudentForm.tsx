'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createStudent, updateStudent } from '@/lib/actions/students'
import type { Tables } from '@/lib/supabase/helpers'

type HostelRow   = Tables<'hostels'>
type StudentRow  = Tables<'hostel_students'>

interface StudentFormProps {
  hostels: HostelRow[]
  student?: StudentRow               // if provided → edit mode
  onSuccess?: () => void
}

export function StudentForm({ hostels, student, onSuccess }: StudentFormProps) {
  const router = useRouter()
  const isEdit = !!student

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const payload = {
      name:                 String(fd.get('name') ?? ''),
      phone:                String(fd.get('phone') ?? ''),
      email:                String(fd.get('email') ?? '') || undefined,
      dob:                  String(fd.get('dob') ?? '') || undefined,
      course:               String(fd.get('course') ?? '') || undefined,
      hostel_id:            String(fd.get('hostel_id') ?? '') || undefined,
      room_number:          String(fd.get('room_number') ?? '') || undefined,
      joining_date:         String(fd.get('joining_date') ?? ''),
      monthly_fee_amount:   Number(fd.get('monthly_fee_amount') ?? 0),
      fee_day:              Number(fd.get('fee_day') ?? 5),
      discount:             Number(fd.get('discount') ?? 0),
      notes:                String(fd.get('notes') ?? '') || undefined,
    }

    try {
      if (isEdit && student) {
        await updateStudent(student.id, payload)
      } else {
        await createStudent(payload)
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
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name <span className="text-danger">*</span></Label>
          <Input id="name" name="name" defaultValue={student?.name} required placeholder="Rahul Sharma" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone <span className="text-danger">*</span></Label>
          <Input id="phone" name="phone" defaultValue={student?.phone} required placeholder="9876543210" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={student?.email ?? ''} placeholder="rahul@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" name="dob" type="date" defaultValue={student?.dob ?? ''} />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="course">Course / Stream</Label>
          <Input id="course" name="course" defaultValue={student?.course ?? ''} placeholder="B.Tech CSE" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="joining_date">Joining date <span className="text-danger">*</span></Label>
          <Input
            id="joining_date"
            name="joining_date"
            type="date"
            defaultValue={student?.joining_date ?? new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>

      {/* Row 4 — Room */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="hostel_id">Building</Label>
          <Select name="hostel_id" defaultValue={student?.hostel_id ?? ''}>
            <SelectTrigger id="hostel_id">
              <SelectValue placeholder="Select building" />
            </SelectTrigger>
            <SelectContent>
              {hostels.map(h => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="room_number">Room number</Label>
          <Input id="room_number" name="room_number" defaultValue={student?.room_number ?? ''} placeholder="101" />
        </div>
      </div>

      {/* Row 5 — Fees */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="monthly_fee_amount">Monthly fee (₹) <span className="text-danger">*</span></Label>
          <Input id="monthly_fee_amount" name="monthly_fee_amount" type="number" min="0" step="0.01"
            defaultValue={student?.monthly_fee_amount ?? 0} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fee_day">Fee day (1–28)</Label>
          <Input id="fee_day" name="fee_day" type="number" min="1" max="28"
            defaultValue={student?.fee_day ?? 5} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discount">Discount (₹)</Label>
          <Input id="discount" name="discount" type="number" min="0" step="0.01"
            defaultValue={student?.discount ?? 0} />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={student?.notes ?? ''} placeholder="Any additional notes…" rows={2} />
      </div>

      {error && (
        <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
        </Button>
      </div>
    </form>
  )
}
