import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ComplaintStatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { getPortalProfile, getPortalComplaints } from '@/lib/queries/portal'

export const metadata: Metadata = { title: 'My Complaints' }
export const dynamic = 'force-dynamic'

export default async function PortalComplaintsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const profile = await getPortalProfile(user.id)
  if (!profile?.linked_student_id) redirect('/portal/dashboard')

  const complaints = await getPortalComplaints(profile.linked_student_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Complaints</h1>
          <p className="text-sm text-slate-500 mt-0.5">{complaints.length} total raised</p>
        </div>
        <Link href="/portal/complaints/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Raise complaint
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {complaints.map(c => (
          <div key={c.id} className="rounded-lg border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-sm font-medium text-slate-900">{c.subject}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={c.priority} />
                <ComplaintStatusBadge status={c.status} />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-2 line-clamp-2">{c.description}</p>
            {c.resolution_note && (
              <div className="rounded-md bg-success/5 border border-success/20 px-3 py-2 mt-2">
                <p className="text-xs text-success font-medium mb-0.5">Resolution</p>
                <p className="text-xs text-slate-600">{c.resolution_note}</p>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        ))}

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
