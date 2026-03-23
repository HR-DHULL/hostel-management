import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalNav } from '@/components/portal/PortalNav'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/portal/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string; display_name: string } | null

  if (profile?.role !== 'student') redirect('/dashboard')

  const { data: settings } = await (supabase.from('app_settings') as any)
    .select('inst_name')
    .limit(1)
    .single()

  const instName = (settings as any)?.inst_name ?? 'Hazeon HMS'

  return (
    <div className="min-h-screen bg-muted">
      <PortalNav instName={instName} userName={profile?.display_name} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
