'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, CalendarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { grantLeave, endLeave } from '@/lib/actions/students'
type LeaveRow = {
  id: string
  student_id: string
  from_date: string
  to_date: string | null
  reason: string | null
  status: 'active' | 'ended'
  is_current: boolean
  created_at: string
  updated_at: string
}

interface LeaveManagerProps {
  studentId: string
  leaves: LeaveRow[]
}

export function LeaveManager({ studentId, leaves }: LeaveManagerProps) {
  const router    = useRouter()
  const [grantOpen, setGrantOpen] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [fromDate, setFromDate]   = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate]       = useState('')
  const [reason, setReason]       = useState('')

  const currentLeave = leaves.find(l => l.is_current && l.status === 'active')

  async function handleGrantLeave() {
    setLoading(true)
    try {
      await grantLeave(studentId, fromDate, toDate || null, reason)
      setGrantOpen(false)
      setReason('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleEndLeave(leaveId: string) {
    setLoading(true)
    try {
      await endLeave(leaveId, studentId)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {currentLeave ? (
          <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex-1 mr-3">
            <CalendarOff className="h-4 w-4 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Currently on leave</p>
              <p className="text-xs text-slate-500">
                From {new Date(currentLeave.from_date).toLocaleDateString('en-IN')}
                {currentLeave.to_date ? ` to ${new Date(currentLeave.to_date).toLocaleDateString('en-IN')}` : ' (open-ended)'}
              </p>
              {currentLeave.reason && <p className="text-xs text-slate-500 mt-0.5">{currentLeave.reason}</p>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEndLeave(currentLeave.id)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'End leave'}
            </Button>
          </div>
        ) : (
          <div />
        )}
        <Button size="sm" variant="outline" onClick={() => setGrantOpen(true)}>
          <Plus className="h-4 w-4" />
          Grant leave
        </Button>
      </div>

      {/* Leave history */}
      {leaves.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">From</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">To</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leaves.map(leave => (
                <tr key={leave.id}>
                  <td className="px-4 py-2.5 text-slate-700">
                    {new Date(leave.from_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {leave.to_date ? new Date(leave.to_date).toLocaleDateString('en-IN') : <span className="text-slate-400">Open</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{leave.reason ?? <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={leave.status === 'active' ? 'warning' : 'muted'}>
                      {leave.status === 'active' ? 'Active' : 'Ended'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {leaves.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">No leave history</p>
      )}

      {/* Grant Leave Dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Grant leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>From date <span className="text-danger">*</span></Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>To date <span className="text-slate-400 text-xs">(optional)</span></Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Home visit, medical…" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>Cancel</Button>
            <Button onClick={handleGrantLeave} disabled={loading || !fromDate}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Grant leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
