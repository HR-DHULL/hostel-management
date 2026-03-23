import type { Metadata } from 'next'
import { Building2, BookOpen, UtensilsCrossed, IndianRupee, AlertTriangle, Clock } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/dashboard/StatCard'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, getMonthName } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Dashboard' }

async function getDashboardStats() {
  const supabase = await createClient()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [
    { count: hostelCount },
    { count: libraryCount },
    { count: messCount },
    { data: hostelFeesData },
    { data: complaintsData },
  ] = await Promise.all([
    supabase.from('hostel_students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('library_members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('mess_members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('hostel_fees').select('*').eq('month', month).eq('year', year),
    supabase.from('complaints').select('*').neq('status', 'resolved'),
  ])

  const hostelFees = (hostelFeesData ?? []) as Tables<'hostel_fees'>[]
  const complaints = (complaintsData ?? []) as Tables<'complaints'>[]

  const collected   = hostelFees.reduce((sum, f) => sum + Number(f.paid_amount), 0)
  const outstanding = hostelFees.reduce((sum, f) => sum + Number(f.balance), 0)
  const overdue     = hostelFees.filter(f => f.status === 'overdue').length
  const openComplaints = complaints.length

  return {
    hostelCount: hostelCount ?? 0,
    libraryCount: libraryCount ?? 0,
    messCount: messCount ?? 0,
    collected,
    outstanding,
    overdue,
    openComplaints,
    month,
    year,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const monthLabel = `${getMonthName(stats.month)} ${stats.year}`

  return (
    <div>
      <Topbar
        title="Dashboard"
        description={`Overview for ${monthLabel}`}
      />

      <div className="p-6 space-y-6">
        {/* Members */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Active Members
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Hostel Students"
              value={stats.hostelCount}
              subtitle="Currently residing"
              icon={Building2}
              accent="primary"
            />
            <StatCard
              title="Library Members"
              value={stats.libraryCount}
              subtitle="Active seats"
              icon={BookOpen}
              accent="success"
            />
            <StatCard
              title="Mess Members"
              value={stats.messCount}
              subtitle="Active meal plans"
              icon={UtensilsCrossed}
              accent="warning"
            />
          </div>
        </div>

        {/* Fee Summary */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Fee Summary — {monthLabel}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Collected"
              value={formatCurrency(stats.collected)}
              subtitle="This month"
              icon={IndianRupee}
              accent="success"
            />
            <StatCard
              title="Outstanding"
              value={formatCurrency(stats.outstanding)}
              subtitle="Pending + partial"
              icon={Clock}
              accent="warning"
            />
            <StatCard
              title="Overdue Fees"
              value={stats.overdue}
              subtitle="Past due date"
              icon={AlertTriangle}
              accent="danger"
            />
            <StatCard
              title="Open Complaints"
              value={stats.openComplaints}
              subtitle="Unresolved tickets"
              icon={AlertTriangle}
              accent="danger"
            />
          </div>
        </div>

        {/* Chart placeholder — Phase 8 */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="text-sm font-medium text-slate-900 mb-1">Fee Collection Trend</h3>
          <p className="text-xs text-slate-500 mb-4">Last 6 months</p>
          <div className="flex h-40 items-center justify-center rounded-md bg-slate-50 border border-dashed border-slate-200">
            <p className="text-xs text-slate-400">Chart available in Phase 8</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="/hostel"
            className="group flex items-center gap-3 rounded-lg border border-border bg-white p-4 hover:border-primary/40 transition-colors"
          >
            <Building2 className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
            <div>
              <p className="text-sm font-medium text-slate-900">Manage Hostel</p>
              <p className="text-xs text-slate-500">Students, rooms, fees</p>
            </div>
          </a>
          <a
            href="/library"
            className="group flex items-center gap-3 rounded-lg border border-border bg-white p-4 hover:border-success/40 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-slate-400 group-hover:text-success transition-colors" />
            <div>
              <p className="text-sm font-medium text-slate-900">Manage Library</p>
              <p className="text-xs text-slate-500">Members, seats, fees</p>
            </div>
          </a>
          <a
            href="/mess"
            className="group flex items-center gap-3 rounded-lg border border-border bg-white p-4 hover:border-warning/40 transition-colors"
          >
            <UtensilsCrossed className="h-5 w-5 text-slate-400 group-hover:text-warning transition-colors" />
            <div>
              <p className="text-sm font-medium text-slate-900">Manage Mess</p>
              <p className="text-xs text-slate-500">Members, attendance, fees</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
