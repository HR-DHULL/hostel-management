'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export type TeamMember = {
  id: string
  display_name: string
  role: string
  is_active: boolean
  created_at: string
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createAdminClient()
  const { data, error } = await (supabase.from('profiles') as any)
    .select('id, display_name, role, is_active, created_at')
    .in('role', ['owner', 'staff'])
    .order('created_at')
  if (error) throw new Error(error.message)
  return (data ?? []) as TeamMember[]
}

export async function inviteStaff(email: string, displayName: string) {
  const supabase = await createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hazeon-hms.vercel.app'
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName, role: 'staff' },
    redirectTo: `${siteUrl}/auth/callback`,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/settings/team')
}

export async function removeTeamMember(userId: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/team')
}
