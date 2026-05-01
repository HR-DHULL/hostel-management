import { createClient } from '@/lib/supabase/server'

export interface TeamMember {
  id:           string
  display_name: string
  role:         'owner' | 'staff'
  is_active:    boolean
}

/**
 * Returns all owners + staff in the current institute.
 * Used for the asset-assignment recipient dropdown.
 * RLS handles institute scoping; we just filter out students and inactive users.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient()

  const { data } = await (supabase.from('profiles') as any)
    .select('id, display_name, role, is_active')
    .in('role', ['owner', 'staff'])
    .eq('is_active', true)
    .order('display_name', { ascending: true })

  return (data ?? []) as TeamMember[]
}
