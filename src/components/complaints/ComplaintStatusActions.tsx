'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { updateComplaintStatus, deleteComplaint } from '@/lib/actions/complaints'

interface Props {
  id:     string
  status: 'open' | 'in_progress' | 'resolved'
}

export function ComplaintStatusActions({ id, status }: Props) {
  const router = useRouter()
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolution,  setResolution]  = useState('')
  const [isPending,   startTransition] = useTransition()

  function setStatus(newStatus: 'open' | 'in_progress' | 'resolved') {
    if (newStatus === 'resolved') { setResolveOpen(true); return }
    startTransition(async () => {
      await updateComplaintStatus(id, newStatus)
      router.refresh()
    })
  }

  function handleResolve() {
    startTransition(async () => {
      await updateComplaintStatus(id, 'resolved', resolution)
      setResolveOpen(false)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteComplaint(id)
      router.push('/complaints')
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {status === 'open' && (
          <Button size="sm" variant="outline" onClick={() => setStatus('in_progress')} disabled={isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Mark in progress
          </Button>
        )}
        {status !== 'resolved' && (
          <Button size="sm" onClick={() => setStatus('resolved')} disabled={isPending}>
            Mark resolved
          </Button>
        )}
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
          Delete
        </Button>
      </div>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Resolution note <span className="text-slate-400 text-xs">(optional)</span></Label>
            <Textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              placeholder="Describe how it was resolved…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
