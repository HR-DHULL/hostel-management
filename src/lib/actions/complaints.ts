'use server'

import { revalidatePath } from 'next/cache'
import { createClient, requireRole } from '@/lib/supabase/server'

export async function updateComplaintStatus(
  id: string,
  status: 'open' | 'in_progress' | 'resolved',
  resolutionNote?: string
) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const update: Record<string, unknown> = { status }
  if (status === 'resolved') {
    update.resolution_note = resolutionNote ?? null
    update.resolved_at     = new Date().toISOString()
    update.resolved_by     = user?.id ?? null
  }

  const { error } = await (supabase.from('complaints') as any)
    .update(update)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/complaints')
  revalidatePath(`/complaints/${id}`)
}

export async function deleteComplaint(id: string) {
  await requireRole('owner')
  const supabase = await createClient()

  const { error } = await (supabase.from('complaints') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/complaints')
}
