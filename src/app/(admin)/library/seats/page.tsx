import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { getLibrarySeatOccupancy } from '@/lib/queries/library'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Library Seat Map' }
export const dynamic = 'force-dynamic'

export default async function LibrarySeatsPage() {
  const { totalSeats, occupiedSeats, vacantSeatNumbers, unassignedMembers } =
    await getLibrarySeatOccupancy()

  const occupiedCount = occupiedSeats.length
  const vacantCount = vacantSeatNumbers.length

  // Build a lookup: seatNumber -> member info
  const seatMap = new Map(
    occupiedSeats.map(s => [s.seatNumber, { name: s.memberName, id: s.memberId }])
  )

  // Generate all seats 1..totalSeats
  const allSeats = Array.from({ length: totalSeats }, (_, i) => String(i + 1))

  return (
    <div>
      <Topbar
        title="Library Seat Map"
        description={`${totalSeats} total seats`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/library">
              <ChevronLeft className="h-4 w-4" />
              Back to members
            </Link>
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
              Total Seats
            </p>
            <p className="text-2xl font-semibold text-slate-900 mt-1.5 tabular-nums">
              {totalSeats}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-primary uppercase tracking-wide font-medium">
              Occupied
            </p>
            <p className="text-2xl font-semibold text-primary mt-1.5 tabular-nums">
              {occupiedCount}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">
              Vacant
            </p>
            <p className="text-2xl font-semibold text-emerald-600 mt-1.5 tabular-nums">
              {vacantCount}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary/20 border border-primary/40 inline-block" />
            Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" />
            Vacant
          </span>
        </div>

        {/* Seat grid */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">All Seats</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {allSeats.map(seat => {
              const member = seatMap.get(seat)
              const isOccupied = !!member

              return (
                <SeatCell
                  key={seat}
                  seat={seat}
                  memberName={member?.name}
                  memberId={member?.id}
                  occupied={isOccupied}
                />
              )
            })}
          </div>
        </div>

        {/* Vacant seats quick list */}
        {vacantCount > 0 && (
          <div className="rounded-lg border border-border bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Vacant Seats ({vacantCount})
            </h2>
            <div className="flex flex-wrap gap-2">
              {vacantSeatNumbers.map(seat => (
                <span
                  key={seat}
                  className="inline-flex items-center justify-center rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 tabular-nums"
                >
                  Seat {seat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Unassigned members */}
        {unassignedMembers.length > 0 && (
          <div className="rounded-lg border border-border bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Unassigned Members ({unassignedMembers.length})
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              These active members don&apos;t have a seat number assigned yet.
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedMembers.map(m => (
                <Link
                  key={m.id}
                  href={`/library/${m.id}`}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/40 transition-colors"
                >
                  <span className="h-5 w-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {totalSeats === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16">
            <p className="text-sm text-slate-400">
              No library seats configured. Go to Settings to set the total number of seats.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface SeatCellProps {
  seat: string
  memberName?: string
  memberId?: string
  occupied: boolean
}

function SeatCell({ seat, memberName, memberId, occupied }: SeatCellProps) {
  const colorClass = occupied
    ? 'bg-primary/8 border-primary/25 text-primary'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700'

  return (
    <div className={cn('rounded-md border p-2.5 min-h-[72px] relative', colorClass)}>
      <p className="text-xs font-semibold mb-1">Seat {seat}</p>
      {occupied && memberName ? (
        <Link href={`/library/${memberId}`}>
          <p className="text-[11px] leading-tight truncate hover:underline">{memberName}</p>
        </Link>
      ) : (
        <p className="text-[11px] opacity-70">Vacant</p>
      )}
    </div>
  )
}
