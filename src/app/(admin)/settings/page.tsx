import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data } = await (supabase.from('app_settings') as any)
    .select('*')
    .limit(1)
    .single()

  const settings = data as Tables<'app_settings'> | null

  return (
    <>
      <Topbar
        title="Settings"
        description="Institute profile and notification preferences"
      />

      <div className="p-6">
        <div className="rounded-lg border border-border bg-white p-6">
          <SettingsForm settings={settings} />
        </div>
      </div>
    </>
  )
}
