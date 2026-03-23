import type { Metadata } from 'next'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { MonthNavigator } from '@/components/fees/MonthNavigator'
import { AttendanceGrid } from '@/components/mess/AttendanceGrid'
import { getMessMembers, getMonthlyAttendance } from '@/lib/queries/mess'
import { MONTH_NAMES } from '@/lib/utils'

export const metadata: Metadata = { title: 'Mess Attendance' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { month?: string; year?: string }
}

export default async function MessAttendancePage({ searchParams }: PageProps) {
  const now        = new Date()
  const month      = Number(searchParams.month ?? now.getMonth() + 1)
  const year       = Number(searchParams.year  ?? now.getFullYear())
  const daysInMonth = new Date(year, month, 0).getDate()

  const [{ members }, attendance] = await Promise.all([
    getMessMembers({ status: 'active', page: 1 }),
    getMonthlyAttendance(month, year),
  ])

  const totalPresent = attendance.filter(a => a.present).length
  const totalSlots   = members.length * daysInMonth
  const pct          = totalSlots > 0 ? Math.round((totalPresent / totalSlots) * 100) : 0

  return (
    <>
      <Topbar
        title="Mess Attendance"
        description={
          <span className="flex items-center gap-2">
            <Link href="/mess" className="hover:text-primary transition-colors">Mess</Link>
            <span>/</span>
            Attendance
          </span>
        }
        actions={<MonthNavigator month={month} year={year} />}
      />

      <div className="p-6 space-y-5">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-white px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Active members</p>
            <p className="text-lg font-semibold text-slate-900">{members.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-white px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Present-days ({MONTH_NAMES[month - 1]})</p>
            <p className="text-lg font-semibold text-success tabular-nums">{totalPresent}</p>
          </div>
          <div className="rounded-lg border border-border bg-white px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Attendance rate</p>
            <p className="text-lg font-semibold text-primary tabular-nums">{pct}%</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-slate-900">
              {MONTH_NAMES[month - 1]} {year} — Daily Attendance
            </h2>
            <span className="text-xs text-slate-500">
              Click a cell to toggle · "All" marks entire column present
            </span>
          </div>
          <AttendanceGrid
            members={members.map(m => ({ id: m.id, name: m.name }))}
            attendance={attendance}
            month={month}
            year={year}
            daysInMonth={daysInMonth}
          />
        </div>
      </div>
    </>
  )
}
