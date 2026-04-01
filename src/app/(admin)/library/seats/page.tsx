import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { getActiveLibraryMembersWithSeats } from '@/lib/queries/library'
import { SeatGrid } from '@/components/library/SeatGrid'

export const metadata: Metadata = { title: 'Library Seat Map' }
export const dynamic = 'force-dynamic'

export default async function LibrarySeatsPage() {
  const members = await getActiveLibraryMembersWithSeats()

  // Build occupied map: seat_number -> { name, id }
  const occupiedSeats: Record<string, { name: string; id: string }> = {}
  const unassigned: { id: string; name: string }[] = []

  members.forEach(m => {
    if (m.seat_number) {
      occupiedSeats[m.seat_number] = { name: m.name, id: m.id }
    } else {
      unassigned.push({ id: m.id, name: m.name })
    }
  })

  return (
    <div>
      <Topbar
        title="Library Seat Map"
        description="Enter seat range to view occupancy"
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
        <SeatGrid occupiedSeats={occupiedSeats} unassignedMembers={unassigned} />
      </div>
    </div>
  )
}
