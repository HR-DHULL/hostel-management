'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { submitComplaint } from '@/lib/actions/portal'

export function ComplaintForm({ studentId }: { studentId: string }) {
  const router   = useRouter()
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [priority, setPriority] = useState('medium')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd    = new FormData(e.currentTarget)
    const subject     = String(fd.get('subject') ?? '').trim()
    const description = String(fd.get('description') ?? '').trim()

    if (!subject || !description) {
      setError('Subject and description are required')
      setLoading(false)
      return
    }

    try {
      await submitComplaint(studentId, subject, description, priority as 'low' | 'medium' | 'high' | 'urgent')
      router.push('/portal/complaints')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject <span className="text-danger">*</span></Label>
        <Input id="subject" name="subject" placeholder="e.g. Water supply issue in room 204" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description <span className="text-danger">*</span></Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the issue in detail…"
          rows={4}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Submitting…' : 'Submit complaint'}
        </Button>
      </div>
    </form>
  )
}
