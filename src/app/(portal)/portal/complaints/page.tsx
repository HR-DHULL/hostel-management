import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Clock, Loader2, CheckCircle2, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PriorityBadge } from '@/components/shared/StatusBadge'
import { getPortalProfile, getPortalComplaints } from '@/lib/queries/portal'

export const metadata: Metadata = { title: 'My Complaints' }
export const dynamic = 'force-dynamic'

const STATUS_STEPS = ['open', 'in_progress', 'resolved'] as const

const STEP_META = {
  open:        { label: 'Raised',      icon: Circle },
  in_progress: { label: 'In Progress', icon: Loader2 },
  resolved:    { label: 'Resolved',    icon: CheckCircle2 },
}

const CARD_BORDER: Record<string, string> = {
  open:        'border-border',
  in_progress: 'border-warning/40',
  resolved:    'border-success/40',
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function PortalComplaintsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const profile = await getPortalProfile(user.id)
  if (!profile?.linked_student_id) redirect('/portal/dashboard')

  const complaints = await getPortalComplaints(profile.linked_student_id)

  const open     = complaints.filter(c => c.status === 'open').length
  const inProg   = complaints.filter(c => c.status === 'in_progress').length
  const resolved = complaints.filter(c => c.status === 'resolved').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Complaints</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {open > 0 && <span className="text-danger">{open} open · </span>}
            {inProg > 0 && <span className="text-warning">{inProg} in progress · </span>}
            <span className="text-success">{resolved} resolved</span>
          </p>
        </div>
        <Link href="/portal/complaints/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Raise complaint
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {complaints.map(c => {
          const currentStep = STATUS_STEPS.indexOf(c.status)
          return (
            <div key={c.id} className={`rounded-lg border bg-white p-4 ${CARD_BORDER[c.status]}`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-slate-900">{c.subject}</h3>
                <PriorityBadge priority={c.priority} />
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 mb-4">{c.description}</p>

              {/* Status timeline */}
              <div className="flex items-center gap-0 mb-4">
                {STATUS_STEPS.map((step, i) => {
                  const done    = i <= currentStep
                  const current = i === currentStep
                  const meta    = STEP_META[step]
                  const Icon    = meta.icon
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                          done
                            ? current && step === 'in_progress'
                              ? 'border-warning bg-warning/10 text-warning'
                              : step === 'resolved' && done
                                ? 'border-success bg-success/10 text-success'
                                : 'border-primary bg-primary/10 text-primary'
                            : 'border-slate-200 bg-slate-50 text-slate-300'
                        }`}>
                          <Icon className={`h-3.5 w-3.5 ${current && step === 'in_progress' ? 'animate-spin' : ''}`} />
                        </div>
                        <span className={`text-[10px] font-medium whitespace-nowrap ${
                          done ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {meta.label}
                        </span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-1 mb-4 rounded ${i < currentStep ? 'bg-primary/30' : 'bg-slate-100'}`} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Resolution note */}
              {c.resolution_note ? (
                <div className="rounded-md bg-success/5 border border-success/20 px-3 py-2.5">
                  <p className="text-xs font-semibold text-success mb-1">Staff response</p>
                  <p className="text-sm text-slate-700">{c.resolution_note}</p>
                  {c.resolved_at && (
                    <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      Resolved on {fmt(c.resolved_at)}
                    </p>
                  )}
                </div>
              ) : c.status === 'in_progress' ? (
                <div className="rounded-md bg-warning/5 border border-warning/20 px-3 py-2.5 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 text-warning animate-spin shrink-0" />
                  <p className="text-xs text-warning font-medium">Your complaint is being reviewed by our team.</p>
                </div>
              ) : (
                <div className="rounded-md bg-slate-50 border border-border px-3 py-2.5 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-500">Awaiting response from staff.</p>
                </div>
              )}

              <p className="text-xs text-slate-400 mt-3">Raised on {fmt(c.created_at)}</p>
            </div>
          )
        })}

        {complaints.length === 0 && (
          <div className="rounded-lg border border-border bg-white py-12 text-center">
            <p className="text-sm text-slate-400">No complaints raised yet</p>
            <Link href="/portal/complaints/new" className="mt-2 inline-block text-sm text-primary hover:underline">
              Raise your first complaint
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
