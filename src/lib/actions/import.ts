'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Normalises various date formats → YYYY-MM-DD */
function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0]
  const s = raw.trim()

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // DD/MM/YYYY or DD-MM-YYYY  (Indian format)
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (dmy) {
    const [, dd, mm, yyyy] = dmy
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
  }

  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) {
    const [, mm, dd, yyyy] = mdy
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
  }

  // Fallback: let JS parse it
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]

  return new Date().toISOString().split('T')[0]
}

export type StudentImportRow = {
  name: string
  phone: string
  email?: string
  course?: string
  room_number?: string
  monthly_fee_amount: number
  fee_day: number
  joining_date: string
  notes?: string
}

export type LibraryImportRow = {
  name: string
  phone: string
  email?: string
  seat_number?: string
  monthly_fee_amount: number
  fee_day: number
  joining_date: string
  notes?: string
}

export type MessImportRow = {
  name: string
  phone: string
  email?: string
  meal_plan: string
  monthly_fee_amount: number
  fee_day: number
  joining_date: string
  notes?: string
}

type ImportResult = { count: number; error?: string }

export async function importStudents(rows: StudentImportRow[]): Promise<ImportResult> {
  try {
    const supabase = await createClient()
    const records = rows.map(r => ({
      ...r,
      joining_date: parseDate(r.joining_date),
      fee_day: Math.min(28, Math.max(1, r.fee_day || 5)),
      status: 'active',
    }))
    const { error } = await (supabase.from('hostel_students') as any).insert(records)
    if (error) return { count: 0, error: error.message }
    revalidatePath('/hostel')
    return { count: rows.length }
  } catch (e: any) {
    return { count: 0, error: e.message }
  }
}

export async function importLibraryMembers(rows: LibraryImportRow[]): Promise<ImportResult> {
  try {
    const supabase = await createClient()
    const records = rows.map(r => ({
      ...r,
      joining_date: parseDate(r.joining_date),
      fee_day: Math.min(28, Math.max(1, r.fee_day || 5)),
      status: 'active',
    }))
    const { error } = await (supabase.from('library_members') as any).insert(records)
    if (error) return { count: 0, error: error.message }
    revalidatePath('/library')
    return { count: rows.length }
  } catch (e: any) {
    return { count: 0, error: e.message }
  }
}

export async function importMessMembers(rows: MessImportRow[]): Promise<ImportResult> {
  try {
    const supabase = await createClient()
    const records = rows.map(r => ({
      ...r,
      joining_date: parseDate(r.joining_date),
      fee_day: Math.min(28, Math.max(1, r.fee_day || 5)),
      meal_plan: r.meal_plan || 'veg',
      status: 'active',
    }))
    const { error } = await (supabase.from('mess_members') as any).insert(records)
    if (error) return { count: 0, error: error.message }
    revalidatePath('/mess')
    return { count: rows.length }
  } catch (e: any) {
    return { count: 0, error: e.message }
  }
}
