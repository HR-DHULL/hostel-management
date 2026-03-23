import type { Metadata } from 'next'
import Link from 'next/link'
import { Library, Building2, Utensils } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { MonthNavigator } from '@/components/fees/MonthNavigator'
import { FeeTable } from '@/components/fees/FeeTable'
import { getOrGenerateFees, getMonthSummary } from '@/lib/queries/fees'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Library Fees' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { month?: string; year?: string }
}

export default async function LibraryFeesPage({ searchParams }: PageProps) {
  const now   = new Date()
  const month = Number(searchParams.month ?? now.getMonth() + 1)
  const year  = Number(searchParams.year  ?? now.getFullYear())

  const supabase = await createClient()
  const { data: settings } = await (supabase.from('app_settings') as any)
    .select('wa_template_fee_reminder')
    .limit(1)
    .single()

  const waTemplate = (settings as any)?.wa_template_fee_reminder
    ?? 'Hi {name}, your library fee of {amount} is due on {date} for {month}. Please pay at the earliest. - Management'

  const [fees, summary] = await Promise.all([
    getOrGenerateFees('library', month, year),
    getMonthSummary('library', month, year),
  ])

  return (
    <>
      <Topbar
        title="Fee Management"
        description={
          <div className="flex items-center gap-2">
            <Link href="/fees/hostel">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Building2 className="h-3.5 w-3.5" /> Hostel
              </Button>
            </Link>
            <Link href="/fees/library">
              <Button size="sm" variant="default" className="h-7 text-xs gap-1">
                <Library className="h-3.5 w-3.5" /> Library
              </Button>
            </Link>
            <Link href="/fees/mess">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Utensils className="h-3.5 w-3.5" /> Mess
              </Button>
            </Link>
          </div>
        }
        actions={<MonthNavigator month={month} year={year} />}
      />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Total"     value={String(summary.total)} />
          <SummaryCard label="Paid"      value={String(summary.paid)}  accent="success" />
          <SummaryCard label="Overdue"   value={String(summary.overdue + summary.partial)} accent="danger" />
          <SummaryCard label="Collected" value={formatCurrency(summary.collected)} accent="primary" />
        </div>

        {summary.outstanding > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5">
            <span className="text-sm text-warning-dark font-medium">Outstanding balance</span>
            <span className="text-sm font-semibold text-warning-dark">{formatCurrency(summary.outstanding)}</span>
          </div>
        )}

        <FeeTable fees={fees} module="library" month={month} year={year} waTemplate={waTemplate} />
      </div>
    </>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: 'success' | 'danger' | 'primary' }) {
  const colorMap = { success: 'text-success', danger: 'text-danger', primary: 'text-primary' }
  const valueClass = accent ? colorMap[accent] : 'text-slate-900'
  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}
