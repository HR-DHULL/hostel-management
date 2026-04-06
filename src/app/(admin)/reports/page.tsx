import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { MonthNavigator } from '@/components/fees/MonthNavigator'
import { ReportExportButton } from '@/components/reports/ReportExportButton'
import { GenerateFeesButton } from '@/components/reports/GenerateFeesButton'
import { FeeStatusBadge } from '@/components/shared/StatusBadge'
import { getMonthlyReport } from '@/lib/queries/reports'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'
import { Building2, BookOpen, UtensilsCrossed, Receipt } from 'lucide-react'

export const metadata: Metadata = { title: 'Monthly Report' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { month?: string; year?: string }
}

const MODULE_META = {
  hostel:  { label: 'Hostel',  icon: Building2,       color: 'text-blue-600',  bg: 'bg-blue-50'  },
  library: { label: 'Library', icon: BookOpen,         color: 'text-purple-600', bg: 'bg-purple-50' },
  mess:    { label: 'Mess',    icon: UtensilsCrossed,  color: 'text-orange-600', bg: 'bg-orange-50' },
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const now   = new Date()
  const month = Number(searchParams.month) || now.getMonth() + 1
  const year  = Number(searchParams.year)  || now.getFullYear()

  const report = await getMonthlyReport(month, year)

  const totalBilled    = report.hostel.billed    + report.library.billed    + report.mess.billed
  const totalCollected = report.hostel.collected + report.library.collected + report.mess.collected
  const totalOutstanding = report.hostel.outstanding + report.library.outstanding + report.mess.outstanding
  const netProfit = totalCollected - report.expenses

  return (
    <div>
      <Topbar
        title="Monthly Report"
        description={`${MONTH_NAMES[month - 1]} ${year}`}
        actions={
          <div className="flex items-center gap-3">
            <MonthNavigator month={month} year={year} />
            <GenerateFeesButton month={month} year={year} />
            <ReportExportButton report={report} />
          </div>
        }
      />

      <div className="p-6 space-y-6">

        {/* Top summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total billed',    value: totalBilled,      sub: 'across all modules' },
            { label: 'Total collected', value: totalCollected,   sub: 'payments received',  green: true },
            { label: 'Outstanding',     value: totalOutstanding, sub: 'yet to be collected', red: totalOutstanding > 0 },
            { label: 'Net (after exp)', value: netProfit,        sub: `Expenses: ${formatCurrency(report.expenses)}`, green: netProfit >= 0, red: netProfit < 0 },
          ].map(({ label, value, sub, green, red }) => (
            <div key={label} className="rounded-lg border border-border bg-white p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`text-xl font-bold mt-1 ${green ? 'text-success' : red ? 'text-danger' : 'text-slate-900'}`}>
                {formatCurrency(value)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Module breakdown */}
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold text-slate-900">Module breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-slate-50/60">
                <tr className="text-xs text-slate-500">
                  <th className="px-5 py-2.5 text-left font-medium">Module</th>
                  <th className="px-4 py-2.5 text-right font-medium">Billed</th>
                  <th className="px-4 py-2.5 text-right font-medium">Collected</th>
                  <th className="px-4 py-2.5 text-right font-medium">Outstanding</th>
                  <th className="px-4 py-2.5 text-right font-medium">Paid</th>
                  <th className="px-4 py-2.5 text-right font-medium">Partial</th>
                  <th className="px-4 py-2.5 text-right font-medium">Pending</th>
                  <th className="px-4 py-2.5 text-right font-medium">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(['hostel', 'library', 'mess'] as const).map(m => {
                  const s    = report[m]
                  const meta = MODULE_META[m]
                  return (
                    <tr key={m} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${meta.bg}`}>
                            <meta.icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          </div>
                          <span className="font-medium text-slate-800">{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(s.billed)}</td>
                      <td className="px-4 py-3 text-right font-medium text-success">{formatCurrency(s.collected)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(s.outstanding)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{s.countPaid}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{s.countPartial}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{s.countPending}</td>
                      <td className="px-4 py-3 text-right text-danger">{s.countOverdue || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-border bg-slate-50">
                <tr className="text-sm font-semibold text-slate-800">
                  <td className="px-5 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalBilled)}</td>
                  <td className="px-4 py-3 text-right text-success">{formatCurrency(totalCollected)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalOutstanding)}</td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Expenses row */}
        <div className="rounded-lg border border-border bg-white p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
            <Receipt className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">Total expenses this month</p>
            <p className="text-xs text-slate-400">From the Expenses module</p>
          </div>
          <p className="text-lg font-bold text-danger">{formatCurrency(report.expenses)}</p>
        </div>

        {/* Unpaid / Partial members */}
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Unpaid / Partial members
              {report.unpaid.length > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                  {report.unpaid.length}
                </span>
              )}
            </h2>
          </div>

          {report.unpaid.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">
              All members have paid for this month.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-slate-50/60">
                  <tr className="text-xs text-slate-500">
                    <th className="px-5 py-2.5 text-left font-medium">Name</th>
                    <th className="px-4 py-2.5 text-left font-medium">Phone</th>
                    <th className="px-4 py-2.5 text-left font-medium">Module</th>
                    <th className="px-4 py-2.5 text-right font-medium">Billed</th>
                    <th className="px-4 py-2.5 text-right font-medium">Paid</th>
                    <th className="px-4 py-2.5 text-right font-medium">Balance</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.unpaid.map(r => {
                    const meta = MODULE_META[r.module]
                    return (
                      <tr key={`${r.module}-${r.id}`} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3 font-medium text-slate-800">{r.name}</td>
                        <td className="px-4 py-3 text-slate-500">{r.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${meta.color}`}>
                            <meta.icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(r.net_amount)}</td>
                        <td className="px-4 py-3 text-right text-success">{formatCurrency(r.paid_amount)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-danger">{formatCurrency(r.balance)}</td>
                        <td className="px-4 py-3">
                          <FeeStatusBadge status={r.status as any} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
