import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { BuildingsClient } from '@/components/hostel/BuildingsClient'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Buildings' }
export const dynamic = 'force-dynamic'

export default async function BuildingsPage() {
  const supabase = await createClient()

  const [{ data: hostelsRaw }, { data: roomsRaw }, { data: studentsRaw }] = await Promise.all([
    (supabase.from('hostels') as any).select('id, name, description').order('name'),
    (supabase.from('rooms') as any).select('id, hostel_id, room_number, capacity').order('room_number'),
    (supabase.from('hostel_students') as any)
      .select('hostel_id, room_number')
      .eq('status', 'active'),
  ])

  const hostels = (hostelsRaw ?? []) as Array<{ id: string; name: string; description: string | null }>
  const rooms = (roomsRaw ?? []) as Array<{ id: string; hostel_id: string; room_number: string; capacity: number }>
  const students = (studentsRaw ?? []) as Array<{ hostel_id: string | null; room_number: string | null }>

  // Count occupancy per hostel+room_number
  const occupancyMap: Record<string, number> = {}
  for (const s of students) {
    if (!s.hostel_id || !s.room_number) continue
    const key = `${s.hostel_id}|${s.room_number}`
    occupancyMap[key] = (occupancyMap[key] ?? 0) + 1
  }

  const hostelData = hostels.map(h => ({
    ...h,
    rooms: rooms
      .filter(r => r.hostel_id === h.id)
      .map(r => ({
        ...r,
        occupied: occupancyMap[`${h.id}|${r.room_number}`] ?? 0,
      })),
  }))

  return (
    <div>
      <Topbar
        title="Buildings & Rooms"
        description="Manage hostel blocks and room inventory"
      />
      <div className="p-6">
        <BuildingsClient hostels={hostelData} />
      </div>
    </div>
  )
}
