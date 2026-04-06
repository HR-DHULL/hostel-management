'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { resetMonthFees } from '@/lib/actions/fees'
import type { FeeModule } from '@/lib/queries/fees'

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface ResetMonthButtonProps {
  module: FeeModule
  month: number
  year: number
}

export function ResetMonthButton({ module, month, year }: ResetMonthButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleReset() {
    startTransition(async () => {
      await resetMonthFees(module, month, year)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1 text-danger border-danger/30 hover:bg-danger/5"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Reset Month
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset {MONTH_NAMES[month]} {year} Fees?</DialogTitle>
            <DialogDescription className="pt-1">
              This will permanently delete all fee records and payment history
              for <strong>{MONTH_NAMES[month]} {year}</strong> in the{' '}
              <strong className="capitalize">{module}</strong> module.
              <br /><br />
              Records will be auto-regenerated fresh (₹0 paid) when you visit
              this month again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={pending}>Cancel</Button>
            </DialogClose>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReset}
              disabled={pending}
              className="bg-danger hover:bg-danger/90"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Yes, reset fees
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
