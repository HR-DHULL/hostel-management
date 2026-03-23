'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitComplaint(
  studentId: string,
  subject: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'urgent'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await (supabase.from('complaints') as any).insert({
    student_id:  studentId,
    raised_by:   user?.id ?? null,
    subject,
    description,
    priority,
    status: 'open',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/portal/complaints')
  revalidatePath('/complaints')
}
