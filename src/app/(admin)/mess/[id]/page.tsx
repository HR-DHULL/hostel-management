import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Phone, Mail, Calendar, Utensils, IndianRupee } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StudentStatusBadge } from '@/components/shared/StatusBadge'
import { MessMemberActions } from '@/components/mess/MessMemberActions'
import { getMessMemberById } from '@/lib/queries/mess'
import { formatCurrency, getInitials } from '@/lib/utils'

interface PageProps {
  params: { id: string }
}

const MEAL_PLAN_LABEL: Record<string, string> = {
  veg:     'Veg',
  non_veg: 'Non-veg',
  custom:  'Custom',
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const member = await getMessMemberById(params.id)
  return { title: member ? member.name : 'Member' }
}

export default async function MessMemberProfilePage({ params }: PageProps) {
  const member = await getMessMemberById(params.id)
  if (!member) notFound()

  const mealLabel = member.meal_plan === 'custom' && member.custom_plan_name
    ? member.custom_plan_name
    : MEAL_PLAN_LABEL[member.meal_plan] ?? member.meal_plan

  return (
    <div>
      <Topbar
        title={member.name}
        description={
          <span className="flex items-center gap-2">
            <Link href="/mess" className="hover:text-primary transition-colors">Mess</Link>
            <span>/</span>
            {member.name}
          </span>
        }
        actions={<MessMemberActions member={member} />}
      />

      <div className="p-6 space-y-6">
        <div className="rounded-lg border border-border bg-white p-5">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {getInitials(member.name)}
            </div>

            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <InfoRow icon={Phone} label="Phone" value={member.phone} />
              {member.email && <InfoRow icon={Mail} label="Email" value={member.email} />}
              <InfoRow icon={Utensils} label="Meal plan" value={mealLabel} />
              <InfoRow
                icon={Calendar}
                label="Joined"
                value={new Date(member.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              />
              {member.exit_date && (
                <InfoRow
                  icon={Calendar}
                  label="Exited"
                  value={new Date(member.exit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                />
              )}
              <InfoRow icon={IndianRupee} label="Monthly fee" value={formatCurrency(Number(member.monthly_fee_amount))} />
              {Number(member.discount) > 0 && (
                <InfoRow icon={IndianRupee} label="Discount" value={formatCurrency(Number(member.discount))} />
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <StudentStatusBadge status={member.status} />
            </div>
          </div>

          {member.notes && (
            <div className="mt-4 rounded-md bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500 mb-0.5 font-medium">Notes</p>
              <p className="text-sm text-slate-700">{member.notes}</p>
            </div>
          )}
        </div>

        <Tabs defaultValue="fees">
          <TabsList>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="fees">
            <div className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-900">Fee history</h3>
                <Link href="/fees/mess" className="text-xs text-primary hover:underline">
                  View all mess fees →
                </Link>
              </div>
              <p className="text-sm text-slate-400 py-6 text-center">
                All fee records are managed in the{' '}
                <Link href="/fees/mess" className="text-primary hover:underline">Mess Fees</Link>{' '}
                section.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <div className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-900">Attendance</h3>
                <Link href="/mess/attendance" className="text-xs text-primary hover:underline">
                  Monthly attendance grid →
                </Link>
              </div>
              <p className="text-sm text-slate-400 py-6 text-center">
                View and manage daily attendance in the{' '}
                <Link href="/mess/attendance" className="text-primary hover:underline">Attendance</Link>{' '}
                section.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  )
}
