import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { TeamClient } from '@/components/settings/TeamClient'
import { getTeamMembers } from '@/lib/actions/team'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Team' }
export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const members = await getTeamMembers()
  const { data: settingsRaw } = await (supabase as any).from('app_settings').select('inst_name').single()
  const instName: string = (settingsRaw as any)?.inst_name ?? 'Hazeon HMS'

  return (
    <div>
      <Topbar
        title="Team"
        description="Manage staff access and send invites"
      />
      <div className="p-6">
        <TeamClient members={members} currentUserId={user.id} instName={instName} />
      </div>
    </div>
  )
}
