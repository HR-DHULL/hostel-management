'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IndianRupee, MessageCircle, Printer, MoreHorizontal,
  CheckSquare, Square, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeeStatusBadge } from '@/components/shared/StatusBadge'
import { PaymentModal } from './PaymentModal'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { bulkMarkPaid } from '@/lib/actions/fees'
import { formatCurrency } from '@/lib/utils'
import type { FeeModule, FeeRow } from '@/lib/queries/fees'

interface FeeTableProps {
  fees: FeeRow[]
  module: FeeModule
  month: number
  year: number
  waTemplate: string
}

export function FeeTable({ fees, module, month, year, waTemplate }: FeeTableProps) {
  const router = useRouter()
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [payingFee, setPayingFee]       = useState<FeeRow | null>(null)
  const [bulkLoading, startBulkTransit] = useTransition()

  const unpaidFees = fees.filter(f => f.status !== 'paid')
  const allSelected = unpaidFees.length > 0 && unpaidFees.every(f => selected.has(f.id))

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(unpaidFees.map(f => f.id)))
    }
  }

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBulkPaid() {
    startBulkTransit(async () => {
      await bulkMarkPaid(module, Array.from(selected), 'cash', new Date().toISOString().split('T')[0])
      setSelected(new Set())
      router.refresh()
    })
  }

  function buildWhatsApp(fee: FeeRow) {
    const msg = waTemplate
      .replace('{name}', fee.member_name)
      .replace('{amount}', formatCurrency(fee.balance))
      .replace('{month}', `${month}/${year}`)
      .replace('{date}', new Date(fee.due_date).toLocaleDateString('en-IN'))
    return `https://wa.me/${fee.member_phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <Button size="sm" onClick={handleBulkPaid} disabled={bulkLoading}>
            {bulkLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Mark all paid (cash)
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50">
              <th className="w-10 px-4 py-3">
                <button onClick={toggleAll} className="text-slate-400 hover:text-slate-700">
                  {allSelected
                    ? <CheckSquare className="h-4 w-4 text-primary" />
                    : <Square className="h-4 w-4" />
                  }
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Member</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Net</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {fees.map(fee => (
              <tr
                key={fee.id}
                className={`hover:bg-slate-50/50 transition-colors ${selected.has(fee.id) ? 'bg-primary/3' : ''}`}
              >
                <td className="px-4 py-3">
                  {fee.status !== 'paid' && (
                    <button onClick={() => toggleRow(fee.id)} className="text-slate-400 hover:text-slate-700">
                      {selected.has(fee.id)
                        ? <CheckSquare className="h-4 w-4 text-primary" />
                        : <Square className="h-4 w-4" />
                      }
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{fee.member_name}</p>
                  <p className="text-xs text-slate-500">{fee.member_phone}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(fee.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                  {formatCurrency(fee.net_amount)}
                  {fee.discount > 0 && (
                    <span className="block text-xs text-success">-{formatCurrency(fee.discount)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-success">
                  {fee.paid_amount > 0 ? formatCurrency(fee.paid_amount) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                  {formatCurrency(fee.balance)}
                </td>
                <td className="px-4 py-3">
                  <FeeStatusBadge status={fee.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {fee.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setPayingFee(fee)}
                      >
                        <IndianRupee className="h-3 w-3" />
                        Pay
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/fees/receipt/${fee.id}?module=${module}`} target="_blank">
                            <Printer className="h-4 w-4" /> Print receipt
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={buildWhatsApp(fee)} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="h-4 w-4" /> WhatsApp reminder
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {fees.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            No fee records for this month
          </div>
        )}
      </div>

      {payingFee && (
        <PaymentModal
          open
          onClose={() => setPayingFee(null)}
          fee={payingFee}
          module={module}
        />
      )}
    </>
  )
}
