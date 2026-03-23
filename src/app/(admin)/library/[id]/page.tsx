import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Phone, Mail, Calendar, MapPin, IndianRupee } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StudentStatusBadge } from '@/components/shared/StatusBadge'
import { LibraryMemberActions } from '@/components/library/LibraryMemberActions'
import { getLibraryMemberById } from '@/lib/queries/library'
import { formatCurrency, getInitials } from '@/lib/utils'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const member = await getLibraryMemberById(params.id)
  return { title: member ? member.name : 'Member' }
}

export default async function LibraryMemberProfilePage({ params }: PageProps) {
  const member = await getLibraryMemberById(params.id)
  if (!member) notFound()

  return (
    <div>
      <Topbar
        title={member.name}
        description={
          <span className="flex items-center gap-2">
            <Link href="/library" className="hover:text-primary transition-colors">
              Library
            </Link>
            <span>/</span>
            {member.name}
          </span>
        }
        actions={<LibraryMemberActions member={member} />}
      />

      <div className="p-6 space-y-6">
        {/* Profile card */}
        <div className="rounded-lg border border-border bg-white p-5">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {getInitials(member.name)}
            </div>

            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <InfoRow icon={Phone} label="Phone" value={member.phone} />
              {member.email && <InfoRow icon={Mail} label="Email" value={member.email} />}
              {member.dob && (
                <InfoRow
                  icon={Calendar}
                  label="Date of birth"
                  value={new Date(member.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                />
              )}
              <InfoRow
                icon={MapPin}
                label="Seat"
                value={member.seat_number ?? 'Not assigned'}
              />
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

        {/* Tabs */}
        <Tabs defaultValue="fees">
          <TabsList>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
          </TabsList>

          <TabsContent value="fees">
            <div className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-900">Fee history</h3>
                <Link href="/fees/library" className="text-xs text-primary hover:underline">
                  View all library fees →
                </Link>
              </div>
              <p className="text-sm text-slate-400 py-6 text-center">
                All fee records are managed in the{' '}
                <Link href="/fees/library" className="text-primary hover:underline">
                  Library Fees
                </Link>{' '}
                section.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="complaints">
            <div className="rounded-lg border border-border bg-white p-5">
              <h3 className="text-sm font-medium text-slate-900 mb-4">Complaints</h3>
              <p className="text-sm text-slate-400 py-6 text-center">Complaints available in Phase 7</p>
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
