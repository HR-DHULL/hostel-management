import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChevronLeft, Phone, Mail, Calendar, BookOpen, Building2, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StudentStatusBadge, FeeStatusBadge } from '@/components/shared/StatusBadge'
import { StudentActions } from '@/components/hostel/StudentActions'
import { LeaveManager } from '@/components/hostel/LeaveManager'
import { IdCardModal } from '@/components/shared/IdCardModal'
import { StudentPortalAccessButton } from '@/components/hostel/StudentPortalAccessButton'
import { StudentServicesSection } from '@/components/hostel/StudentServicesSection'
import { getStudentById, getStudentLeaves, getHostels, getStudentPortalUser, getStudentLinkedServices } from '@/lib/queries/students'
import { getStudentFeeHistory } from '@/lib/queries/fees'
import { formatCurrency, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const student = await getStudentById(params.id)
  return { title: student ? student.name : 'Student' }
}

export default async function StudentProfilePage({ params }: PageProps) {
  const supabase = await createClient()
  const [student, hostels, feeHistory] = await Promise.all([
    getStudentById(params.id),
    getHostels(),
    getStudentFeeHistory(params.id),
  ])

  if (!student) notFound()
  // Run separately so failures here never break the main page render
  const [portalUser, settingsRaw, servicesResult] = await Promise.allSettled([
    getStudentPortalUser(params.id),
    (supabase as any).from('app_settings').select('inst_name').single(),
    getStudentLinkedServices(params.id),
  ])
  const portalUserId = portalUser.status === 'fulfilled' ? portalUser.value : null
  const instName: string =
    settingsRaw.status === 'fulfilled' ? ((settingsRaw.value as any)?.data?.inst_name ?? 'Hazeon HMS') : 'Hazeon HMS'
  const services = servicesResult.status === 'fulfilled'
    ? servicesResult.value
    : { library: null, mess: null }

  const leaves = await getStudentLeaves(params.id)
  type ProfileLeaveRow = { id: string; student_id: string; is_current: boolean; status: 'active' | 'ended'; from_date: string; to_date: string | null; reason: string | null; created_at: string; updated_at: string }
  const typedLeaves = leaves as unknown as ProfileLeaveRow[]
  const onLeave = typedLeaves.some(l => l.is_current && l.status === 'active')

  return (
    <div>
      <Topbar
        title={student.name}
        description={
          <span className="flex items-center gap-2">
            <Link href="/hostel" className="hover:text-primary transition-colors">
              Hostel
            </Link>
            <span>/</span>
            {student.name}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <IdCardModal
              type="student"
              data={{
                id: student.id,
                name: student.name,
                phone: student.phone,
                course: student.course,
                room_number: student.room_number,
                hostel_name: student.hostels?.name,
                joining_date: student.joining_date,
                status: student.status,
              }}
              instName={instName}
            />
            <StudentActions student={student} hostels={hostels} />
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Profile card */}
        <div className="rounded-lg border border-border bg-white p-5">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {getInitials(student.name)}
            </div>

            {/* Info */}
            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <InfoRow icon={Phone} label="Phone" value={student.phone} />
              {student.email && <InfoRow icon={Mail} label="Email" value={student.email} />}
              {student.dob && (
                <InfoRow
                  icon={Calendar}
                  label="Date of birth"
                  value={new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                />
              )}
              {student.course && <InfoRow icon={BookOpen} label="Course" value={student.course} />}
              <InfoRow
                icon={Building2}
                label="Room"
                value={student.room_number
                  ? `${student.room_number}${student.hostels?.name ? ` · ${student.hostels.name}` : ''}`
                  : 'Not assigned'
                }
              />
              <InfoRow
                icon={Calendar}
                label="Joined"
                value={new Date(student.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              />
              <InfoRow icon={IndianRupee} label="Monthly fee" value={formatCurrency(Number(student.monthly_fee_amount))} />
              {Number(student.discount) > 0 && (
                <InfoRow icon={IndianRupee} label="Discount" value={formatCurrency(Number(student.discount))} />
              )}
            </div>

            {/* Status badges */}
            <div className="flex flex-col items-end gap-2">
              <StudentStatusBadge status={student.status} />
              {onLeave && (
                <span className="inline-flex items-center rounded-md border border-warning/30 bg-warning/8 px-2 py-0.5 text-xs font-medium text-warning">
                  On leave
                </span>
              )}
            </div>
          </div>

          {student.notes && (
            <div className="mt-4 rounded-md bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500 mb-0.5 font-medium">Notes</p>
              <p className="text-sm text-slate-700">{student.notes}</p>
            </div>
          )}

          <StudentServicesSection
            studentId={student.id}
            studentName={student.name}
            studentPhone={student.phone}
            studentEmail={student.email}
            hostelMonthlyFee={Number(student.monthly_fee_amount)}
            hostelDiscount={Number(student.discount)}
            services={services}
          />

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-slate-500 font-medium mb-2">Portal Access</p>
            <StudentPortalAccessButton
              studentId={student.id}
              studentName={student.name}
              studentEmail={student.email}
              portalUserId={portalUserId?.id ?? null}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leave">
          <TabsList>
            <TabsTrigger value="leave">Leave tracker</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
          </TabsList>

          <TabsContent value="leave">
            <div className="rounded-lg border border-border bg-white p-5">
              <h3 className="text-sm font-medium text-slate-900 mb-4">Leave history</h3>
              <LeaveManager studentId={student.id} leaves={typedLeaves} />
            </div>
          </TabsContent>

          <TabsContent value="fees">
            <div className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-900">Fee history</h3>
                <Link href="/fees/hostel" className="text-xs text-primary hover:underline">
                  Go to Fees →
                </Link>
              </div>

              {feeHistory.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No fee records yet.</p>
              ) : (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Total billed', value: feeHistory.reduce((s, f) => s + Number(f.net_amount), 0) },
                      { label: 'Total paid',   value: feeHistory.reduce((s, f) => s + Number(f.paid_amount), 0), green: true },
                      { label: 'Outstanding',  value: feeHistory.reduce((s, f) => s + Number(f.balance), 0),    red: true },
                    ].map(({ label, value, green, red }) => (
                      <div key={label} className="rounded-lg bg-slate-50 border border-border px-3 py-2.5">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className={`text-sm font-semibold mt-0.5 ${green ? 'text-success' : red && value > 0 ? 'text-danger' : 'text-slate-900'}`}>
                          {formatCurrency(value)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-slate-500">
                          <th className="pb-2 text-left font-medium">Month</th>
                          <th className="pb-2 text-right font-medium">Billed</th>
                          <th className="pb-2 text-right font-medium">Paid</th>
                          <th className="pb-2 text-right font-medium">Balance</th>
                          <th className="pb-2 text-left font-medium pl-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {feeHistory.map(f => (
                          <tr key={f.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 text-slate-700 font-medium">
                              {new Date(f.year, f.month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-2.5 text-right text-slate-600">{formatCurrency(Number(f.net_amount))}</td>
                            <td className="py-2.5 text-right text-success font-medium">{formatCurrency(Number(f.paid_amount))}</td>
                            <td className="py-2.5 text-right text-slate-600">{formatCurrency(Number(f.balance))}</td>
                            <td className="py-2.5 pl-3">
                              <FeeStatusBadge status={f.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
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
