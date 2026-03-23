import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { StudentStatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { AddMessMemberButton } from '@/components/mess/AddMessMemberButton'
import { Pagination } from '@/components/shared/Pagination'
import { getMessMembers } from '@/lib/queries/mess'
import { formatCurrency, getInitials } from '@/lib/utils'

export const metadata: Metadata = { title: 'Mess' }
export const dynamic = 'force-dynamic'

const MEAL_PLAN_LABEL: Record<string, string> = {
  veg:     'Veg',
  non_veg: 'Non-veg',
  custom:  'Custom',
}

interface PageProps {
  searchParams: {
    page?:   string
    search?: string
    status?: string
  }
}

export default async function MessPage({ searchParams }: PageProps) {
  const page   = Number(searchParams.page ?? 1)
  const search = searchParams.search ?? ''
  const status = (searchParams.status as 'active' | 'exited' | 'all') ?? 'active'

  const { members, total, pageSize } = await getMessMembers({ page, search, status })
  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <Topbar
        title="Mess"
        description={`${total} member${total !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/mess/attendance">
              <Button size="sm" variant="outline" className="gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Attendance
              </Button>
            </Link>
            <AddMessMemberButton />
          </div>
        }
      />

      <div className="p-6">
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Member</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Meal plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly fee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-700">
                      {member.meal_plan === 'custom' && member.custom_plan_name
                        ? member.custom_plan_name
                        : MEAL_PLAN_LABEL[member.meal_plan] ?? member.meal_plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(member.joining_date).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                    {formatCurrency(member.monthly_fee_amount)}
                    {member.discount > 0 && (
                      <span className="block text-xs text-success">-{formatCurrency(member.discount)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StudentStatusBadge status={member.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/mess/${member.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {members.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              No mess members found
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
