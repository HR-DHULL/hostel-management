import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { AuditFilters } from '@/components/audit/AuditFilters'
import { Pagination } from '@/components/shared/Pagination'
import { getAuditLog } from '@/lib/queries/audit'
import {
  UserPlus, Trash2, PenLine, IndianRupee, RotateCcw, Zap,
  Building2, BookOpen, UtensilsCrossed, Settings, Users, Receipt,
  Mail, ShieldOff,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Audit Log' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { page?: string; module?: string; action?: string }
}

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  create:     { label: 'Created',    icon: UserPlus,     color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'   },
  update:     { label: 'Updated',    icon: PenLine,      color: 'text-slate-700',  bg: 'bg-slate-50 border-slate-200' },
  delete:     { label: 'Deleted',    icon: Trash2,       color: 'text-red-700',    bg: 'bg-red-50 border-red-200'     },
  payment:    { label: 'Payment',    icon: IndianRupee,  color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  correction: { label: 'Corrected',  icon: RotateCcw,    color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200'},
  generate:   { label: 'Generated',  icon: Zap,          color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200'},
  invite:     { label: 'Invited',    icon: Mail,         color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-200'   },
  revoke:     { label: 'Revoked',    icon: ShieldOff,    color: 'text-rose-700',   bg: 'bg-rose-50 border-rose-200'   },
}

const MODULE_META: Record<string, { label: string; icon: React.ElementType }> = {
  hostel:   { label: 'Hostel',    icon: Building2 },
  library:  { label: 'Library',   icon: BookOpen },
  mess:     { label: 'Mess',      icon: UtensilsCrossed },
  fees:     { label: 'Fees',      icon: Receipt },
  settings: { label: 'Settings',  icon: Settings },
  team:     { label: 'Team',      icon: Users },
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fullTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function describeEntry(action: string, module: string, entityName: string | null, details: Record<string, unknown> | null): string {
  const name = entityName ?? 'a record'
  const d    = details ?? {}

  if (action === 'payment') {
    const amt = d.amount ? `₹${Number(d.amount).toLocaleString('en-IN')}` : ''
    const mod = d.module ? ` (${String(d.module)})` : ''
    const mo  = d.month && d.year ? ` for ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(d.month)-1]} ${d.year}` : ''
    return `Recorded payment ${amt}${mod}${mo}`
  }
  if (action === 'correction') {
    const amt = d.new_paid_amount ? `₹${Number(d.new_paid_amount).toLocaleString('en-IN')}` : ''
    const mo  = d.month && d.year ? ` for ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(d.month)-1]} ${d.year}` : ''
    return `Corrected paid amount to ${amt}${mo}`
  }
  if (action === 'create')  return `Added ${name} to ${module}`
  if (action === 'delete')  return `Deleted ${name} from ${module}`
  if (action === 'update' && d.event === 'exit') return `Marked ${name} as exited`
  if (action === 'update')  return `Updated ${name}`
  if (action === 'invite')  return `Invited ${name} to team`
  if (action === 'revoke')  return `Revoked portal access`
  if (action === 'generate') {
    const counts = [
      d.hostel  ? `Hostel: ${d.hostel}`  : '',
      d.library ? `Library: ${d.library}` : '',
      d.mess    ? `Mess: ${d.mess}`       : '',
    ].filter(Boolean).join(', ')
    return `Generated fees${counts ? ` — ${counts}` : ''}`
  }
  return `${action} on ${module}`
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const page   = Number(searchParams.page ?? 1)
  const module = searchParams.module ?? 'all'
  const action = searchParams.action ?? 'all'

  const { rows, total } = await getAuditLog({ page, module, action })
  const totalPages = Math.ceil(total / 50)

  return (
    <div>
      <Topbar
        title="Audit Log"
        description={`${total} action${total !== 1 ? 's' : ''} recorded`}
        actions={<AuditFilters />}
      />

      <div className="p-6 space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-sm text-slate-400">No audit records found.</p>
            <p className="text-xs text-slate-300 mt-1">Actions will appear here as staff use the system.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-slate-50">
                <tr className="text-xs text-slate-500">
                  <th className="px-5 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Module</th>
                  <th className="px-4 py-3 text-left font-medium">Performed by</th>
                  <th className="px-4 py-3 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(row => {
                  const am   = ACTION_META[row.action] ?? ACTION_META['update']
                  const mm   = MODULE_META[row.module] ?? MODULE_META['hostel']
                  const Icon = am.icon
                  const Mod  = mm.icon
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${am.bg} ${am.color}`}>
                          <Icon className="h-3 w-3" />
                          {am.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs">
                        {describeEntry(row.action, row.module, row.entity_name, row.details)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <Mod className="h-3.5 w-3.5 text-slate-400" />
                          {mm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.performed_by_name ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-slate-500" title={fullTime(row.created_at)}>
                          {relativeTime(row.created_at)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
      </div>
    </div>
  )
}
