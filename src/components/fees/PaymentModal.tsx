'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IndianRupee, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FeeStatusBadge } from '@/components/shared/StatusBadge'
import { recordPayment, recordAdvancePayment } from '@/lib/actions/fees'
import { formatCurrency } from '@/lib/utils'
import type { FeeModule, FeeRow } from '@/lib/queries/fees'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  fee: FeeRow
  module: FeeModule
}

const PAYMENT_MODES = [
  { value: 'cash',          label: 'Cash' },
  { value: 'upi',           label: 'UPI' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other',         label: 'Other' },
]

export function PaymentModal({ open, onClose, fee, module }: PaymentModalProps) {
  const router = useRouter()
  const [tab, setTab]         = useState<'single' | 'advance'>('single')
  const [amount, setAmount]   = useState(String(fee.balance > 0 ? fee.balance : fee.net_amount))
  const [mode, setMode]       = useState('cash')
  const [notes, setNotes]     = useState('')
  const [paidAt, setPaidAt]   = useState(new Date().toISOString().split('T')[0])
  const [advMonths, setAdvMonths] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSinglePayment() {
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return }
    if (amt > fee.balance) { setError(`Amount exceeds balance of ${formatCurrency(fee.balance)}`); return }

    setLoading(true)
    setError('')
    try {
      await recordPayment(module, fee.id, amt, mode, notes, paidAt)
      onClose()
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdvancePayment() {
    setLoading(true)
    setError('')
    try {
      await recordAdvancePayment(module, fee.member_id, fee.month, fee.year, advMonths, mode, paidAt)
      onClose()
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment — {fee.member_name}</DialogTitle>
        </DialogHeader>

        {/* Fee summary */}
        <div className="rounded-lg bg-slate-50 border border-border p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Net payable</span>
            <span className="font-medium">{formatCurrency(fee.net_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Already paid</span>
            <span className="font-medium text-success">{formatCurrency(fee.paid_amount)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <span className="text-slate-700 font-medium">Balance due</span>
            <span className="font-semibold text-slate-900">{formatCurrency(fee.balance)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Status</span>
            <FeeStatusBadge status={fee.status} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-md border border-border overflow-hidden">
          {(['single', 'advance'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t === 'single' ? 'This month' : 'Advance payment'}
            </button>
          ))}
        </div>

        {tab === 'single' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹) <span className="text-danger">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  max={fee.balance}
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment date</Label>
                <Input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Receipt no., transaction ID…"
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Pay <strong>{advMonths}</strong> month{advMonths > 1 ? 's' : ''} in advance starting from{' '}
              <strong>current month</strong>. Each month will be marked as paid in full.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Months to pay</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={advMonths}
                  onChange={e => setAdvMonths(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment date</Label>
                <Input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <p className="text-xs text-primary font-medium">
                Total: {formatCurrency(fee.net_amount * advMonths)}
                <span className="text-primary/70 font-normal ml-1">
                  ({advMonths} × {formatCurrency(fee.net_amount)})
                </span>
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={tab === 'single' ? handleSinglePayment : handleAdvancePayment}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Recording…' : 'Record payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
