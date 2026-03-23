import type { Metadata } from 'next'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { ComplaintStatusBadge, PriorityBadge } from '@/components/shared/StatusBadge'
import { Pagination } from '@/components/shared/Pagination'
import { getComplaints } from '@/lib/queries/complaints'

export const metadata: Metadata = { title: 'Complaints' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: {
    page?:     string
    status?:   string
    priority?: string
  }
}

export default async function ComplaintsPage({ searchParams }: PageProps) {
  const page     = Number(searchParams.page ?? 1)
  const status   = searchParams.status   ?? 'all'
  const priority = searchParams.priority ?? 'all'

  const { complaints, total, pageSize } = await getComplaints({ page, status, priority })
  const totalPages = Math.ceil(total / pageSize)

  const openCount = complaints.filter(c => c.status === 'open').length

  return (
    <>
      <Topbar
        title="Complaints"
        description={`${total} total · ${openCount} open`}
        actions={
          <div className="flex items-center gap-2">
            <ComplaintsFilter status={status} priority={priority} />
          </div>
        }
      />

      <div className="p-6">
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Raised</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {complaints.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 line-clamp-1">{c.subject}</p>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{c.description}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.student_name ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <ComplaintStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/complaints/${c.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {complaints.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">No complaints found</div>
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

// Inline filter (server component with link navigation)
function ComplaintsFilter({ status, priority }: { status: string; priority: string }) {
  const statuses   = [['all', 'All'], ['open', 'Open'], ['in_progress', 'In Progress'], ['resolved', 'Resolved']]
  const priorities = [['all', 'All'], ['urgent', 'Urgent'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]

  return (
    <div className="flex items-center gap-4 text-xs text-slate-500">
      <div className="flex items-center gap-1">
        {statuses.map(([val, label]) => (
          <Link
            key={val}
            href={`/complaints?status=${val}&priority=${priority}`}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              status === val
                ? 'bg-primary text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
