'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { generateAllFees } from '@/lib/actions/fees'
import { MONTH_NAMES } from '@/lib/utils'

interface Props {
  month: number
  year: number
}

export function GenerateFeesButton({ month, year }: Props) {
  const router   = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<{ hostel: number; library: number; mess: number } | null>(null)
  const [error, setError]     = useState('')

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`
  const total = result ? result.hostel + result.library + result.mess : 0

  async function handleGenerate() {
    setLoading(true)
    setError('')
    try {
      const counts = await generateAllFees(month, year)
      setResult(counts)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setResult(null)
    setError('')
    setOpen(true)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Zap className="h-4 w-4" />
        Generate fees
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate fees — {monthLabel}</DialogTitle>
          </DialogHeader>

          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  {total === 0
                    ? 'All fee records already exist for this month.'
                    : `${total} new fee record${total !== 1 ? 's' : ''} created.`}
                </p>
              </div>
              {total > 0 && (
                <div className="rounded-lg bg-slate-50 border border-border divide-y divide-border text-sm">
                  {(['hostel', 'library', 'mess'] as const).map(m => (
                    <div key={m} className="flex justify-between px-4 py-2">
                      <span className="capitalize text-slate-600">{m}</span>
                      <span className="font-medium text-slate-900">{result[m]} new</span>
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full" onClick={() => setOpen(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                This will generate fee records for all active members in{' '}
                <strong>Hostel, Library, and Mess</strong> for <strong>{monthLabel}</strong>.
              </p>
              <p className="text-xs text-slate-400">
                Members who already have a fee record for this month will be skipped. This is safe to run multiple times.
              </p>
              {error && (
                <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Generating…' : 'Generate now'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
