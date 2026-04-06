'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient, requireRole, logAudit } from '@/lib/supabase/server'

export type StaffPermissions = {
  hostel?: boolean
  library?: boolean
  mess?: boolean
  fees?: boolean
  expenses?: boolean
  complaints?: boolean
  reports?: boolean
  audit_log?: boolean
}

export type TeamMember = {
  id: string
  display_name: string
  role: string
  is_active: boolean
  created_at: string
  permissions: StaffPermissions
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  // Use regular client so RLS scopes to current user's institute
  const supabase = await createClient()
  const { data, error } = await (supabase.from('profiles') as any)
    .select('id, display_name, role, is_active, created_at, permissions')
    .in('role', ['owner', 'staff'])
    .order('created_at')
  if (error) throw new Error(error.message)
  return ((data ?? []) as any[]).map(d => ({ ...d, permissions: d.permissions ?? {} })) as TeamMember[]
}

export async function updateStaffPermissions(userId: string, permissions: StaffPermissions) {
  await requireRole('owner')
  const supabase = await createAdminClient()
  const { error } = await (supabase.from('profiles') as any)
    .update({ permissions })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  await logAudit({ action: 'update', module: 'team', entity_id: userId as any, details: { permissions } })
  revalidatePath('/settings/team')
}

export async function inviteStaff(email: string, displayName: string) {
  await requireRole('owner')
  // Get owner's institute_id to pass to the new staff member
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: ownerProfile } = await (supabase as any)
    .from('profiles').select('institute_id').eq('id', user!.id).single()
  const instituteId = (ownerProfile as any)?.institute_id ?? null

  const adminClient = await createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hazeon-hms.vercel.app'
  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName, role: 'staff', institute_id: instituteId },
    redirectTo: `${siteUrl}/auth/callback`,
  })
  if (error) throw new Error(error.message)
  await logAudit({ action: 'invite', module: 'team', entity_name: email, details: { display_name: displayName } })
  revalidatePath('/settings/team')
}

export async function removeTeamMember(userId: string) {
  await requireRole('owner')
  const supabase = await createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  await logAudit({ action: 'delete', module: 'team', entity_id: userId as any })
  revalidatePath('/settings/team')
}
