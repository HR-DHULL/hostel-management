import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Phone, User, MapPin } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { ComplaintStatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { ComplaintStatusActions } from '@/components/complaints/ComplaintStatusActions'
import { getComplaintById } from '@/lib/queries/complaints'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const c = await getComplaintById(params.id)
  return { title: c ? c.subject : 'Complaint' }
}

export default async function ComplaintDetailPage({ params }: PageProps) {
  const c = await getComplaintById(params.id)
  if (!c) notFound()

  return (
    <div>
      <Topbar
        title={c.subject}
        description={
          <span className="flex items-center gap-2">
            <Link href="/complaints" className="hover:text-primary transition-colors">Complaints</Link>
            <span>/</span>
            {c.subject}
          </span>
        }
        actions={<ComplaintStatusActions id={c.id} status={c.status} />}
      />

      <div className="p-6 max-w-2xl space-y-5">
        {/* Status + priority */}
        <div className="flex items-center gap-3">
          <ComplaintStatusBadge status={c.status} />
          <PriorityBadge priority={c.priority} />
          <span className="text-xs text-slate-400">
            {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Student info */}
        {c.student_name && (
          <div className="rounded-lg border border-border bg-white p-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {c.student_name}
            </div>
            {c.student_phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {c.student_phone}
              </div>
            )}
            {c.student_room && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Room {c.student_room}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Complaint</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{c.description}</p>
        </div>

        {/* Resolution */}
        {c.status === 'resolved' && (
          <div className="rounded-lg border border-success/20 bg-success/5 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-success mb-2">Resolved</h3>
            {c.resolved_at && (
              <p className="text-xs text-slate-400 mb-2">
                {new Date(c.resolved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
            {c.resolution_note ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.resolution_note}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">No resolution note</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
