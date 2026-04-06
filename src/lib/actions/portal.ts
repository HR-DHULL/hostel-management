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
  if (!user) throw new Error('Unauthorized')

  // Verify the calling user owns this student record
  const { data: profile } = await supabase
    .from('profiles')
    .select('linked_student_id')
    .eq('id', user.id)
    .single()

  if ((profile as any)?.linked_student_id !== studentId) {
    throw new Error('Forbidden')
  }

  // Basic input validation
  if (!subject?.trim() || subject.trim().length > 200) throw new Error('Invalid subject')
  if (!description?.trim() || description.trim().length > 2000) throw new Error('Invalid description')

  const { error } = await (supabase.from('complaints') as any).insert({
    student_id:  studentId,
    raised_by:   user.id,
    subject:     subject.trim(),
    description: description.trim(),
    priority,
    status: 'open',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/portal/complaints')
  revalidatePath('/complaints')
}
