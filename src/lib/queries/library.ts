import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/helpers'

const PAGE_SIZE = 25

export type LibraryMemberRow = Tables<'library_members'>

export interface LibraryListParams {
  page?:   number
  search?: string
  status?: 'active' | 'exited' | 'all'
}

export async function getLibraryMembers({
  page = 1,
  search = '',
  status = 'active',
}: LibraryListParams = {}) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = (supabase.from('library_members') as any)
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,seat_number.ilike.%${search}%`)
  }

  const { data, count } = await query

  return {
    members:  (data ?? []) as LibraryMemberRow[],
    total:    count ?? 0,
    pageSize: PAGE_SIZE,
  }
}

export async function getLibraryMemberById(id: string) {
  const supabase = await createClient()

  const { data } = await (supabase.from('library_members') as any)
    .select('*')
    .eq('id', id)
    .single()

  if (!data) return null
  return data as LibraryMemberRow
}

export async function getLibrarySeatsInUse() {
  const supabase = await createClient()

  const { data } = await (supabase.from('library_members') as any)
    .select('seat_number')
    .eq('status', 'active')
    .not('seat_number', 'is', null)

  return ((data ?? []) as any[]).map((r: any) => r.seat_number as string)
}

export interface SeatOccupancyData {
  totalSeats: number
  occupiedSeats: { seatNumber: string; memberName: string; memberId: string }[]
  vacantSeatNumbers: string[]
  unassignedMembers: { id: string; name: string }[]
}

export async function getLibrarySeatOccupancy(): Promise<SeatOccupancyData> {
  const supabase = await createClient()

  // Fetch total seats from settings
  const { data: settings } = await (supabase.from('app_settings') as any)
    .select('total_library_seats')
    .limit(1)
    .single()

  const totalSeats: number = settings?.total_library_seats ?? 50

  // Fetch active members with their seat assignments
  const { data: members } = await (supabase.from('library_members') as any)
    .select('id, name, seat_number')
    .eq('status', 'active')

  const activeMembers = (members ?? []) as { id: string; name: string; seat_number: string | null }[]

  // Separate assigned and unassigned
  const occupiedSeats = activeMembers
    .filter(m => m.seat_number)
    .map(m => ({ seatNumber: m.seat_number!, memberName: m.name, memberId: m.id }))

  const unassignedMembers = activeMembers
    .filter(m => !m.seat_number)
    .map(m => ({ id: m.id, name: m.name }))

  // Build set of occupied seat numbers
  const occupiedSet = new Set(occupiedSeats.map(s => s.seatNumber))

  // Generate all seat numbers (1..totalSeats) and find vacant ones
  const vacantSeatNumbers: string[] = []
  for (let i = 1; i <= totalSeats; i++) {
    const num = String(i)
    if (!occupiedSet.has(num)) {
      vacantSeatNumbers.push(num)
    }
  }

  return { totalSeats, occupiedSeats, vacantSeatNumbers, unassignedMembers }
}
