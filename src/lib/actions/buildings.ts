'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createHostel(name: string, description?: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from('hostels') as any)
    .insert({ name, description: description || null, is_active: true })
  if (error) throw new Error(error.message)
  revalidatePath('/hostel/buildings')
  revalidatePath('/hostel')
}

export async function updateHostel(id: string, name: string, description?: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from('hostels') as any)
    .update({ name, description: description || null })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/hostel/buildings')
  revalidatePath('/hostel')
}

export async function deleteHostel(id: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from('hostels') as any).delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/hostel/buildings')
  revalidatePath('/hostel')
}

export async function createRoom(hostelId: string, roomNumber: string, capacity: number) {
  const supabase = await createClient()
  const { error } = await (supabase.from('rooms') as any)
    .insert({ hostel_id: hostelId, room_number: roomNumber, capacity, is_active: true })
  if (error) throw new Error(error.message)
  revalidatePath('/hostel/buildings')
  revalidatePath('/hostel/occupancy')
}

export async function updateRoom(id: string, roomNumber: string, capacity: number) {
  const supabase = await createClient()
  const { error } = await (supabase.from('rooms') as any)
    .update({ room_number: roomNumber, capacity })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/hostel/buildings')
  revalidatePath('/hostel/occupancy')
}

export async function deleteRoom(id: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from('rooms') as any).delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/hostel/buildings')
  revalidatePath('/hostel/occupancy')
}