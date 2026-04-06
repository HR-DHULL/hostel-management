'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IndianRupee, MessageCircle, Printer, MoreHorizontal,
  CheckSquare, Square, Loader2, Search, X, Pencil, Send, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FeeStatusBadge } from '@/components/shared/StatusBadge'
import { PaymentModal } from './PaymentModal'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { bulkMarkPaid } from '@/lib/actions/fees'
import { sendSingleEmailReminder, sendBulkEmailReminders } from '@/lib/actions/email-reminders'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import type { FeeModule, FeeRow } from '@/lib/queries/fees'

function BulkReminderModal({ fees, waTemplate, month, year }: { fees: FeeRow[]; waTemplate: string; month: number; year: number }) {
  const [open, setOpen] = useState(false)

  function buildWA(fee: FeeRow) {
    const msg = waTemplate
      .replace('{name}', fee.member_name)
      .replace('{amount}', formatCurrency(fee.balance))
      .replace('{month}', `${month}/${year}`)
      .replace('{date}', new Date(fee.due_date).toLocaleDateString('en-IN'))
    return `https://wa.me/${fee.member_phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  const overdueFirst = [...fees].sort((a, b) => (b.status === 'overdue' ? 1 : 0) - (a.status === 'overdue' ? 1 : 0))

  return (
    <>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setOpen(true)}>
        <Send className="h-3.5 w-3.5" />
        Remind all ({fees.length})
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg mx-4 rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Bulk Fee Reminder</h2>
                <p className="text-xs text-slate-500 mt-0.5">{fees.length} pending/overdue — click each to open WhatsApp</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {overdueFirst.map(fee => (
                <div key={fee.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{fee.member_name}</p>
                    <p className="text-xs text-slate-500">{fee.member_phone} · Balance: {formatCurrency(fee.balance)}</p>
                  </div>
                  <a
                    href={buildWA(fee)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Send
                  </a>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-5 py-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function BulkEmailModal({ fees, module }: { fees: FeeRow[]; module: FeeModule }) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; noEmail: number } | null>(null)

  const withEmail = fees.filter(f => f.member_email)
  const withoutEmail = fees.length - withEmail.length

  async function handleSendAll() {
    setSending(true)
    setResult(null)
    const res = await sendBulkEmailReminders(module, fees.map(f => f.id))
    setResult(res)
    setSending(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setOpen(true); setResult(null) }}>
        <Mail className="h-3.5 w-3.5" />
        Email all ({withEmail.length})
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg mx-4 rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Bulk Email Reminder</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {withEmail.length} with email · {withoutEmail > 0 ? `${withoutEmail} without email` : 'all have email'}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {result ? (
                <div className="space-y-2">
                  {result.sent > 0 && (
                    <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
                      {result.sent} email{result.sent > 1 ? 's' : ''} sent successfully
                    </p>
                  )}
                  {result.noEmail > 0 && (
                    <p className="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
                      {result.noEmail} member{result.noEmail > 1 ? 's' : ''} skipped (no email on file)
                    </p>
                  )}
                  {result.failed > 0 && (
                    <p className="text-sm text-red-700 bg-red-50 rounded-md px-3 py-2">
                      {result.failed} email{result.failed > 1 ? 's' : ''} failed to send
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Send fee reminder emails to all {withEmail.length} members with pending/overdue fees who have an email address on file.
                </p>
              )}
            </div>

            <div className="border-t border-border px-5 py-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                {result ? 'Close' : 'Cancel'}
              </Button>
              {!result && (
                <Button size="sm" onClick={handleSendAll} disabled={sending || withEmail.length === 0}>
                  {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {sending ? 'Sending...' : `Send ${withEmail.length} emails`}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

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
  const [search, setSearch]             = useState('')

  const filteredFees = search.trim()
    ? fees.filter(f => f.member_name.toLowerCase().includes(search.toLowerCase()))
    : fees

  const unpaidFees = filteredFees.filter(f => f.status !== 'paid')
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

  const pendingFees = filteredFees.filter(f => f.status !== 'paid')

  return (
    <>
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="pl-8 pr-8 h-8 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Bulk reminders */}
      {pendingFees.length > 0 && (
        <div className="flex items-center gap-2">
          <BulkReminderModal fees={pendingFees} waTemplate={waTemplate} month={month} year={year} />
          <BulkEmailModal fees={pendingFees} module={module} />
        </div>
      )}

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
            {filteredFees.map(fee => (
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
                    {fee.status !== 'paid' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setPayingFee(fee)}
                      >
                        <IndianRupee className="h-3 w-3" />
                        Pay
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-slate-500"
                        onClick={() => setPayingFee(fee)}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
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
                        <DropdownMenuItem
                          disabled={!fee.member_email}
                          onClick={async () => {
                            if (!fee.member_email) {
                              toast.error('No email address on file')
                              return
                            }
                            toast.promise(
                              sendSingleEmailReminder(module, fee.id).then(res => {
                                if (!res.success) throw new Error(res.error)
                              }),
                              {
                                loading: 'Sending email...',
                                success: `Email sent to ${fee.member_email}`,
                                error: (e) => e.message || 'Failed to send email',
                              }
                            )
                          }}
                        >
                          <Mail className="h-4 w-4" /> Email reminder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFees.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            {search ? `No results for "${search}"` : 'No fee records for this month'}
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
