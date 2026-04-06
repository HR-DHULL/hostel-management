import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Printer, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { FeeStatusBadge } from '@/components/shared/StatusBadge'
import { getPortalProfile, getPortalFees } from '@/lib/queries/portal'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'

export const metadata: Metadata = { title: 'My Fees' }
export const dynamic = 'force-dynamic'

export default async function PortalFeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const profile = await getPortalProfile(user.id)
  if (!profile?.linked_student_id) redirect('/portal/dashboard')

  const fees = await getPortalFees(profile.linked_student_id)

  const totalDue       = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + f.balance, 0)
  const totalCollected = fees.reduce((s, f) => s + f.paid_amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Fees</h1>
          <p className="text-sm text-slate-500 mt-0.5">Complete fee history and receipts</p>
        </div>
        {fees.length > 0 && (
          <a
            href={`/api/portal/fee-statement?studentId=${profile.linked_student_id}`}
            download
            className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download statement
          </a>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs text-slate-500 mb-1">Total paid</p>
          <p className="text-xl font-semibold text-success tabular-nums">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs text-slate-500 mb-1">Outstanding</p>
          <p className={`text-xl font-semibold tabular-nums ${totalDue > 0 ? 'text-danger' : 'text-slate-400'}`}>
            {formatCurrency(totalDue)}
          </p>
        </div>
      </div>

      {/* Fee table */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Month</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Due date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Net</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {fees.map(fee => (
              <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {MONTH_NAMES[fee.month - 1]} {fee.year}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(fee.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(fee.net_amount)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-success">
                  {fee.paid_amount > 0 ? formatCurrency(fee.paid_amount) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                  {formatCurrency(fee.balance)}
                </td>
                <td className="px-4 py-3">
                  <FeeStatusBadge status={fee.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {fee.status === 'paid' && (
                    <Link href={`/fees/receipt/${fee.id}?module=hostel`} target="_blank">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        <Printer className="h-3 w-3" />
                        Receipt
                      </Button>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {fees.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            No fee records found
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Contact management to record payments or raise disputes.
      </p>
    </div>
  )
}
