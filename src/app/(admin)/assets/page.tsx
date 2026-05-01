import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { Pagination } from '@/components/shared/Pagination'
import { AssetActions } from '@/components/assets/AssetActions'
import { AssetFilters } from '@/components/assets/AssetFilters'
import { AddAssetButton } from '@/components/assets/AddAssetButton'
import { getAssets, getAssetSummary } from '@/lib/queries/assets'
import { getTeamMembers } from '@/lib/queries/team-members'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Assets' }
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  in_use:     'In use',
  in_storage: 'In storage',
  retired:    'Retired',
  lost:       'Lost',
}

const STATUS_STYLE: Record<string, string> = {
  in_use:     'bg-emerald-50 text-emerald-700',
  in_storage: 'bg-slate-100 text-slate-600',
  retired:    'bg-amber-50 text-amber-700',
  lost:       'bg-red-50 text-red-700',
}

const CATEGORY_LABEL: Record<string, string> = {
  laptop:    'Laptop',
  phone:     'Phone',
  uniform:   'Uniform',
  furniture: 'Furniture',
  equipment: 'Equipment',
  other:     'Other',
}

interface PageProps {
  searchParams: { page?: string; status?: string; category?: string; q?: string }
}

export default async function AssetsPage({ searchParams }: PageProps) {
  const page     = Number(searchParams.page ?? 1)
  const status   = searchParams.status   ?? 'all'
  const category = searchParams.category ?? 'all'
  const search   = searchParams.q ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user?.id).single()
  const isOwner = (profile as any)?.role === 'owner'

  const [{ assets, total, pageSize }, summary, teamMembers] = await Promise.all([
    getAssets({ page, status, category, search }),
    getAssetSummary(),
    getTeamMembers(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <Topbar
        title="Assets"
        description="Durable items issued to team members"
        actions={<AddAssetButton teamMembers={teamMembers} />}
      />

      <div className="p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Total assets" value={summary.total} />
          <SummaryCard label="In use"       value={summary.byStatus.in_use     ?? 0} />
          <SummaryCard label="In storage"   value={summary.byStatus.in_storage ?? 0} />
          <SummaryCard
            label="Retired / Lost"
            value={(summary.byStatus.retired ?? 0) + (summary.byStatus.lost ?? 0)}
          />
        </div>

        {/* Filters */}
        <AssetFilters status={status} category={category} search={search} />

        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Serial</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Current holder</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assets.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{a.name}</p>
                    {a.notes && <p className="text-xs text-slate-400 mt-0.5">{a.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {CATEGORY_LABEL[a.category] ?? a.category}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {a.serial_number ?? <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    {a.current_holder_name ? (
                      <div>
                        <p className="font-medium text-slate-900">{a.current_holder_name}</p>
                        {a.current_holder_phone && (
                          <p className="text-xs text-slate-500">{a.current_holder_phone}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Nobody</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {a.purchase_amount != null ? formatCurrency(a.purchase_amount) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AssetActions asset={a} teamMembers={teamMembers} isOwner={isOwner} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {assets.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              No assets yet. Click &quot;Add asset&quot; to register a durable item.
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 tabular-nums">{value}</p>
    </div>
  )
}
