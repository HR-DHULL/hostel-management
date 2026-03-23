import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { getOccupancyData, getHostels } from '@/lib/queries/students'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Occupancy Grid' }

export default async function OccupancyPage() {
  const [students, hostels] = await Promise.all([
    getOccupancyData(),
    getHostels(),
  ])

  // Group by hostel
  const byHostel: Record<string, typeof students> = {}
  const unassigned: typeof students = []

  students.forEach(s => {
    if (s.hostel_id && s.room_number) {
      const key = s.hostel_id
      if (!byHostel[key]) byHostel[key] = []
      byHostel[key].push(s)
    } else {
      unassigned.push(s)
    }
  })

  const totalActive   = students.length
  const totalOnLeave  = students.filter(s => s.on_leave).length
  const totalOccupied = students.filter(s => !s.on_leave).length

  return (
    <div>
      <Topbar
        title="Room Occupancy"
        description="Live view of all rooms"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/hostel">
              <ChevronLeft className="h-4 w-4" />
              Back to students
            </Link>
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Residents</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1.5 tabular-nums">{totalActive}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Occupied</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1.5 tabular-nums">{totalOccupied}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-warning uppercase tracking-wide font-medium">On Leave</p>
            <p className="text-2xl font-semibold text-warning mt-1.5 tabular-nums">{totalOnLeave}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary/20 border border-primary/40 inline-block" />
            Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-warning/20 border border-warning/40 inline-block" />
            On leave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
            Vacant
          </span>
        </div>

        {/* Grid per hostel */}
        {hostels.map(hostel => {
          const hostelStudents = byHostel[hostel.id] ?? []
          if (hostelStudents.length === 0) return null

          // Get unique rooms sorted
          const rooms = Array.from(new Set(hostelStudents.map(s => s.room_number!))).sort((a, b) => {
            const numA = parseInt(a, 10)
            const numB = parseInt(b, 10)
            return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB
          })

          return (
            <div key={hostel.id} className="rounded-lg border border-border bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">{hostel.name}</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                {rooms.map(room => {
                  const occupants = hostelStudents.filter(s => s.room_number === room)
                  const onLeave   = occupants.some(s => s.on_leave)
                  const occupied  = occupants.length > 0

                  return (
                    <RoomCell
                      key={room}
                      room={room}
                      occupants={occupants}
                      onLeave={onLeave}
                      occupied={occupied}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Unassigned students */}
        {unassigned.length > 0 && (
          <div className="rounded-lg border border-border bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Unassigned (no room)</h2>
            <div className="flex flex-wrap gap-2">
              {unassigned.map(s => (
                <Link
                  key={s.id}
                  href={`/hostel/${s.id}`}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/40 transition-colors"
                >
                  <span className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {students.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16">
            <p className="text-sm text-slate-400">No active residents</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface RoomCellProps {
  room: string
  occupants: { id: string; name: string; on_leave: boolean }[]
  onLeave: boolean
  occupied: boolean
}

function RoomCell({ room, occupants, onLeave, occupied }: RoomCellProps) {
  const colorClass = onLeave
    ? 'bg-warning/10 border-warning/30 text-warning'
    : occupied
    ? 'bg-primary/8 border-primary/25 text-primary'
    : 'bg-slate-50 border-slate-200 text-slate-400'

  return (
    <div className={cn('rounded-md border p-2.5 min-h-[72px] relative group', colorClass)}>
      <p className="text-xs font-semibold mb-1">Rm {room}</p>
      {occupants.length > 0 ? (
        <div className="space-y-0.5">
          {occupants.slice(0, 2).map(o => (
            <Link key={o.id} href={`/hostel/${o.id}`}>
              <p className="text-[11px] leading-tight truncate hover:underline">{o.name}</p>
            </Link>
          ))}
          {occupants.length > 2 && (
            <p className="text-[10px] opacity-70">+{occupants.length - 2} more</p>
          )}
        </div>
      ) : (
        <p className="text-[11px] opacity-60">Vacant</p>
      )}
    </div>
  )
}
