import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/badge'
import { AddExpenseButton } from '@/components/expenses/AddExpenseButton'
import { ExpenseActions } from '@/components/expenses/ExpenseActions'
import { Pagination } from '@/components/shared/Pagination'
import { getExpenses, getExpenseSummary } from '@/lib/queries/expenses'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'

export const metadata: Metadata = { title: 'Expenses' }
export const dynamic = 'force-dynamic'

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: 'bg-blue-50 text-blue-700',
  utilities:   'bg-purple-50 text-purple-700',
  staff:       'bg-orange-50 text-orange-700',
  food:        'bg-green-50 text-green-700',
  misc:        'bg-slate-100 text-slate-600',
  other:       'bg-slate-100 text-slate-600',
}

interface PageProps {
  searchParams: { page?: string; category?: string; month?: string; year?: string }
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const now      = new Date()
  const page     = Number(searchParams.page     ?? 1)
  const category = searchParams.category ?? 'all'
  const month    = Number(searchParams.month ?? now.getMonth() + 1)
  const year     = Number(searchParams.year  ?? now.getFullYear())

  const [{ expenses, total, pageSize }, summary] = await Promise.all([
    getExpenses({ page, category, month, year }),
    getExpenseSummary(month, year),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <Topbar
        title="Expenses"
        description={`${MONTH_NAMES[month - 1]} ${year}`}
        actions={<AddExpenseButton />}
      />

      <div className="p-6 space-y-5">
        {/* Month summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-white px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Total this month</p>
            <p className="text-lg font-semibold text-danger tabular-nums">{formatCurrency(summary.total)}</p>
          </div>
          {Object.entries(summary.byCategory).slice(0, 3).map(([cat, amt]) => (
            <div key={cat} className="rounded-lg border border-border bg-white px-4 py-3">
              <p className="text-xs text-slate-500 mb-1 capitalize">{cat}</p>
              <p className="text-lg font-semibold text-slate-900 tabular-nums">{formatCurrency(amt)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{exp.description}</p>
                    {exp.notes && <p className="text-xs text-slate-500 mt-0.5">{exp.notes}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[exp.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(exp.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ExpenseActions expense={exp} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {expenses.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              No expenses for this period
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} />
          </div>
        )}
      </div>
    </>
  )
}
