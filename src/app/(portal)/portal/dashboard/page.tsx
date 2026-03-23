import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  IndianRupee, AlertCircle, CheckCircle2, Clock, MessageSquare, Phone, Building2, BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { FeeStatusBadge } from '@/components/shared/StatusBadge'
import { getPortalProfile, getPortalStudent, getPortalFees, getPortalComplaints } from '@/lib/queries/portal'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'

export const metadata: Metadata = { title: 'My Dashboard' }
export const dynamic = 'force-dynamic'

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const profile = await getPortalProfile(user.id)
  if (!profile?.linked_student_id) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center">
        <AlertCircle className="h-10 w-10 text-warning mx-auto mb-3" />
        <h2 className="text-base font-semibold text-slate-900 mb-1">Account not linked</h2>
        <p className="text-sm text-slate-500">
          Your student account has not been linked yet. Please contact the management.
        </p>
      </div>
    )
  }

  const [student, fees, complaints] = await Promise.all([
    getPortalStudent(profile.linked_student_id),
    getPortalFees(profile.linked_student_id),
    getPortalComplaints(profile.linked_student_id),
  ])

  if (!student) redirect('/portal/login')

  const pendingFees  = fees.filter(f => f.status !== 'paid')
  const totalDue     = pendingFees.reduce((s, f) => s + f.balance, 0)
  const latestFee    = fees[0]
  const openComplaints = complaints.filter(c => c.status !== 'resolved').length

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="rounded-lg border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Welcome, {student.name.split(' ')[0]}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {student.status === 'active' ? 'Active student' : 'Exited'}
              {student.hostel_name && ` · ${student.hostel_name}`}
              {student.room_number && ` · Room ${student.room_number}`}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {student.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Total due</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${totalDue > 0 ? 'text-danger' : 'text-success'}`}>
            {formatCurrency(totalDue)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{pendingFees.length} pending month{pendingFees.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Monthly fee</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">
            {formatCurrency(student.monthly_fee_amount - student.discount)}
          </p>
          {student.discount > 0 && (
            <p className="text-xs text-success mt-1">Discount: {formatCurrency(student.discount)}</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Open complaints</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${openComplaints > 0 ? 'text-warning' : 'text-slate-900'}`}>
            {openComplaints}
          </p>
          <p className="text-xs text-slate-400 mt-1">{complaints.length} total raised</p>
        </div>
      </div>

      {/* Due fees alert */}
      {pendingFees.length > 0 && (
        <div className="rounded-lg border border-danger/20 bg-danger/4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger">
                  {pendingFees.length} fee{pendingFees.length > 1 ? 's' : ''} pending
                </p>
                <p className="text-xs text-danger/70 mt-0.5">
                  Total outstanding: {formatCurrency(totalDue)}
                </p>
              </div>
            </div>
            <Link href="/portal/fees">
              <Button size="sm" variant="outline" className="h-7 text-xs border-danger/30 text-danger hover:bg-danger/8">
                View fees
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Latest fee */}
      {latestFee && (
        <div className="rounded-lg border border-border bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Latest fee record</h2>
            <Link href="/portal/fees" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {MONTH_NAMES[latestFee.month - 1]} {latestFee.year}
              </p>
              <p className="text-xs text-slate-500">
                Due: {new Date(latestFee.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(latestFee.net_amount)}</p>
              <FeeStatusBadge status={latestFee.status} />
            </div>
          </div>
        </div>
      )}

      {/* Student details */}
      <div className="rounded-lg border border-border bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">My Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {student.phone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {student.phone}
            </div>
          )}
          {student.course && (
            <div className="flex items-center gap-2 text-slate-600">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              {student.course}
            </div>
          )}
          {student.room_number && (
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Room {student.room_number}
              {student.hostel_name && ` · ${student.hostel_name}`}
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
            Joined {new Date(student.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  )
}
