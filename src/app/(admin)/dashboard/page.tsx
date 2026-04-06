import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, BookOpen, UtensilsCrossed, IndianRupee, AlertTriangle, Clock, MessageSquare, Receipt, TrendingUp } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/dashboard/StatCard'
import { FeeChart } from '@/components/dashboard/FeeChart'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, getMonthName, MONTH_NAMES } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const supabase = await createClient()
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const [
    { count: hostelCount },
    { count: libraryCount },
    { count: messCount },
    { data: hostelFeesData },
    { data: libraryFeesData },
    { data: messFeesData },
    { data: complaintsData },
    { data: expensesData },
    { data: recentPayments },
  ] = await Promise.all([
    supabase.from('hostel_students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('library_members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('mess_members').select('*',    { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('hostel_fees').select('paid_amount, balance, status').eq('month', month).eq('year', year),
    supabase.from('library_fees').select('paid_amount').eq('month', month).eq('year', year),
    supabase.from('mess_fees').select('paid_amount').eq('month', month).eq('year', year),
    (supabase.from('complaints') as any).select('status').neq('status', 'resolved'),
    (supabase.from('expenses') as any).select('amount')
      .gte('expense_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('expense_date', new Date(year, month, 0).toISOString().split('T')[0]),
    (supabase as any).from('payment_log').select('id, module, amount, mode, paid_at, notes').order('paid_at', { ascending: false }).limit(6),
  ])

  const hostelFees  = (hostelFeesData  ?? []) as Tables<'hostel_fees'>[]
  const libraryFees = (libraryFeesData ?? []) as any[]
  const messFees    = (messFeesData    ?? []) as any[]

  const collectedHostel  = hostelFees.reduce((s, f)  => s + Number(f.paid_amount), 0)
  const collectedLibrary = libraryFees.reduce((s, f) => s + Number(f.paid_amount), 0)
  const collectedMess    = messFees.reduce((s, f)    => s + Number(f.paid_amount), 0)
  const outstanding      = hostelFees.reduce((s, f)  => s + Number(f.balance), 0)
  const overdue          = hostelFees.filter(f => f.status === 'overdue').length
  const openComplaints   = (complaintsData ?? []).length
  const monthExpenses    = ((expensesData ?? []) as any[]).reduce((s, e) => s + Number(e.amount), 0)
  const collectedTotal   = collectedHostel + collectedLibrary + collectedMess
  const netIncome        = collectedTotal - monthExpenses

  // 6-month trend
  const trend = await buildTrend(supabase, month, year)

  return {
    hostelCount: hostelCount ?? 0,
    libraryCount: libraryCount ?? 0,
    messCount: messCount ?? 0,
    collectedTotal,
    outstanding,
    overdue,
    openComplaints,
    monthExpenses,
    netIncome,
    month,
    year,
    trend,
    recentPayments: (recentPayments ?? []) as any[],
  }
}

async function buildTrend(supabase: any, currentMonth: number, currentYear: number) {
  const points = []

  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i
    let y = currentYear
    if (m <= 0) { m += 12; y-- }

    const [h, l, ms] = await Promise.all([
      supabase.from('hostel_fees').select('paid_amount').eq('month', m).eq('year', y),
      supabase.from('library_fees').select('paid_amount').eq('month', m).eq('year', y),
      supabase.from('mess_fees').select('paid_amount').eq('month', m).eq('year', y),
    ])

    const sum = (arr: any[]) => arr.reduce((s, f) => s + Number(f.paid_amount), 0)

    points.push({
      month:   MONTH_NAMES[m - 1].slice(0, 3),
      hostel:  sum((h.data ?? []) as any[]),
      library: sum((l.data ?? []) as any[]),
      mess:    sum((ms.data ?? []) as any[]),
    })
  }

  return points
}

export default async function DashboardPage() {
  const d = await getDashboardData()
  const monthLabel = `${getMonthName(d.month)} ${d.year}`

  return (
    <div>
      <Topbar
        title="Dashboard"
        description={`Overview for ${monthLabel}`}
        actions={
          d.openComplaints > 0 ? (
            <Link href="/complaints?status=open">
              <div className="flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/8 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/12 transition-colors">
                <MessageSquare className="h-3.5 w-3.5" />
                {d.openComplaints} open complaint{d.openComplaints > 1 ? 's' : ''}
              </div>
            </Link>
          ) : null
        }
      />

      <div className="p-6 space-y-6">
        {/* Members */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Active Members</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Hostel Students"  value={d.hostelCount}  subtitle="Currently residing"  icon={Building2}     accent="primary" />
            <StatCard title="Library Members"  value={d.libraryCount} subtitle="Active seats"        icon={BookOpen}      accent="success" />
            <StatCard title="Mess Members"     value={d.messCount}    subtitle="Active meal plans"   icon={UtensilsCrossed} accent="warning" />
          </div>
        </div>

        {/* Fee Summary */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Fee Summary — {monthLabel}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <StatCard title="Collected"      value={formatCurrency(d.collectedTotal)} subtitle="All modules"    icon={IndianRupee}   accent="success" />
            <StatCard title="Net Income"     value={formatCurrency(d.netIncome)}      subtitle="After expenses" icon={TrendingUp}    accent={d.netIncome >= 0 ? 'success' : 'danger'} />
            <StatCard title="Outstanding"    value={formatCurrency(d.outstanding)}    subtitle="Hostel pending" icon={Clock}         accent="warning" />
            <StatCard title="Overdue Fees"   value={d.overdue}                        subtitle="Past due date"  icon={AlertTriangle} accent="danger" />
            <StatCard title="Month Expenses" value={formatCurrency(d.monthExpenses)}  subtitle="Total spent"    icon={Receipt}       accent="danger" />
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-lg border border-border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Fee Collection Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 6 months — Hostel · Library · Mess</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />Hostel</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-success" />Library</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-warning" />Mess</span>
            </div>
          </div>
          <FeeChart data={d.trend} />
        </div>

        {/* Recent payments */}
        {d.recentPayments.length > 0 && (
          <div className="rounded-lg border border-border bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-slate-900">Recent Payments</h3>
            </div>
            <div className="divide-y divide-border">
              {d.recentPayments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50">
                      <IndianRupee className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-900 capitalize">
                        {p.module} fee{p.notes ? ` · ${p.notes}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(p.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{p.mode?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600 tabular-nums">
                    +{formatCurrency(Number(p.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { href: '/hostel',   icon: Building2,      label: 'Manage Hostel',  sub: 'Students, rooms, fees',    color: 'hover:border-primary/40 group-hover:text-primary' },
            { href: '/library',  icon: BookOpen,       label: 'Manage Library', sub: 'Members, seats, fees',     color: 'hover:border-success/40 group-hover:text-success' },
            { href: '/mess',     icon: UtensilsCrossed,label: 'Manage Mess',    sub: 'Members, attendance, fees', color: 'hover:border-warning/40 group-hover:text-warning' },
          ].map(({ href, icon: Icon, label, sub, color }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-lg border border-border bg-white p-4 transition-colors ${color}`}
            >
              <Icon className="h-5 w-5 text-slate-400 transition-colors" />
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
