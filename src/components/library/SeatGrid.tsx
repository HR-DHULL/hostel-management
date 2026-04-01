'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SeatGridProps {
  occupiedSeats: Record<string, { name: string; id: string }>
  unassignedMembers: { id: string; name: string }[]
}

export function SeatGrid({ occupiedSeats, unassignedMembers }: SeatGridProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [range, setRange] = useState<{ from: number; to: number } | null>(null)

  function handleApply() {
    const f = parseInt(from, 10)
    const t = parseInt(to, 10)
    if (isNaN(f) || isNaN(t) || f < 1 || t < f) return
    setRange({ from: f, to: t })
  }

  // Build seat data from range
  const allSeats: string[] = []
  const vacantSeats: string[] = []
  let occupiedCount = 0

  if (range) {
    for (let i = range.from; i <= range.to; i++) {
      const num = String(i)
      allSeats.push(num)
      if (occupiedSeats[num]) {
        occupiedCount++
      } else {
        vacantSeats.push(num)
      }
    }
  }

  const totalSeats = allSeats.length
  const vacantCount = vacantSeats.length

  return (
    <>
      {/* Range input */}
      <div className="rounded-lg border border-border bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Seat Range</h2>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="seat-from">From</Label>
            <Input
              id="seat-from"
              type="number"
              min="1"
              placeholder="1"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-28"
              onKeyDown={e => e.key === 'Enter' && handleApply()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seat-to">To</Label>
            <Input
              id="seat-to"
              type="number"
              min="1"
              placeholder="80"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-28"
              onKeyDown={e => e.key === 'Enter' && handleApply()}
            />
          </div>
          <Button onClick={handleApply} size="sm">
            Show Seats
          </Button>
        </div>
      </div>

      {range && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Seats</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1.5 tabular-nums">{totalSeats}</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-xs text-primary uppercase tracking-wide font-medium">Occupied</p>
              <p className="text-2xl font-semibold text-primary mt-1.5 tabular-nums">{occupiedCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">Vacant</p>
              <p className="text-2xl font-semibold text-emerald-600 mt-1.5 tabular-nums">{vacantCount}</p>
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
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Seats {range.from} – {range.to}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
              {allSeats.map(seat => {
                const member = occupiedSeats[seat]
                return (
                  <SeatCell
                    key={seat}
                    seat={seat}
                    memberName={member?.name}
                    memberId={member?.id}
                    occupied={!!member}
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
                {vacantSeats.map(seat => (
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
                Active members without a seat number assigned.
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
        </>
      )}

      {!range && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16">
          <p className="text-sm text-slate-400">
            Enter seat range above (e.g. 1 to 80) to view occupancy
          </p>
        </div>
      )}
    </>
  )
}

function SeatCell({
  seat,
  memberName,
  memberId,
  occupied,
}: {
  seat: string
  memberName?: string
  memberId?: string
  occupied: boolean
}) {
  const colorClass = occupied
    ? 'bg-primary/8 border-primary/25 text-primary'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700'

  return (
    <div className={cn('rounded-md border p-2.5 min-h-[72px]', colorClass)}>
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
