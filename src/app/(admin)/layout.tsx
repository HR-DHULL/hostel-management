import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Tables } from '@/lib/supabase/helpers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile for name/role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Tables<'profiles'> | null

  if (profile?.role === 'student') {
    redirect('/portal/dashboard')
  }

  // Get institute name
  const { data: settingsData } = await supabase
    .from('app_settings')
    .select('*')
    .single()

  const settings = settingsData as Tables<'app_settings'> | null

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar
        instName={settings?.inst_name ?? 'Hazeon HMS'}
        logoUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/logo`}
        userRole={profile?.role}
        userName={profile?.display_name}
      />
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
