import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Building2, LayoutGrid } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StudentStatusBadge } from '@/components/shared/StatusBadge'
import { AddStudentButton } from '@/components/hostel/AddStudentButton'
import { StudentsFilter } from '@/components/hostel/StudentsFilter'
import { Pagination } from '@/components/shared/Pagination'
import { getStudents, getHostels } from '@/lib/queries/students'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Hostel' }

interface PageProps {
  searchParams: {
    page?: string
    search?: string
    status?: string
    hostelId?: string
  }
}

export default async function HostelPage({ searchParams }: PageProps) {
  const page     = Number(searchParams.page ?? 1)
  const search   = searchParams.search ?? ''
  const status   = (searchParams.status as 'active' | 'exited' | 'all') ?? 'active'
  const hostelId = searchParams.hostelId

  const [{ students, total, pageSize }, hostels] = await Promise.all([
    getStudents({ page, search, status, hostelId }),
    getHostels(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <Topbar
        title="Hostel"
        description={`${total} student${total !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/hostel/occupancy">
                <LayoutGrid className="h-4 w-4" />
                Occupancy
              </Link>
            </Button>
            <AddStudentButton hostels={hostels} />
          </div>
        }
      />

      <div className="p-6 space-y-4">
        <StudentsFilter hostels={hostels} />

        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16">
            <Building2 className="h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">No students found</p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? 'Try adjusting your search' : 'Add a student to get started'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly Fee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(student => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/hostel/${student.id}`} className="flex items-center gap-3 group">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                            {student.name}
                          </p>
                          <p className="text-xs text-slate-500">{student.phone}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {student.room_number
                        ? (
                          <div>
                            <p className="font-medium">{student.room_number}</p>
                            <p className="text-xs text-slate-400">{student.hostels?.name ?? ''}</p>
                          </div>
                        )
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-700">{student.course ?? <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(Number(student.monthly_fee_amount))}</td>
                    <td className="px-4 py-3"><StudentStatusBadge status={student.status} /></td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(student.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} />
        )}
      </div>
    </div>
  )
}
