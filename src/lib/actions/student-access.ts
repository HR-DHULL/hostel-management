'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export async function inviteStudentAccess(
  studentId: string,
  email: string,
  displayName: string,
) {
  const supabase = await createAdminClient()

  // Invite student — this creates auth.users record + triggers profile creation
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hazeon-hms.vercel.app'
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName, role: 'student' },
    redirectTo: `${siteUrl}/auth/callback`,
  })
  if (error) throw new Error(error.message)

  // Link the new auth profile to the hostel_students record
  const { error: profileError } = await (supabase as any)
    .from('profiles')
    .update({ linked_student_id: studentId })
    .eq('id', data.user.id)
  if (profileError) throw new Error(profileError.message)

  revalidatePath(`/hostel/${studentId}`)
}

export async function revokeStudentAccess(studentId: string, userId: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath(`/hostel/${studentId}`)
}
