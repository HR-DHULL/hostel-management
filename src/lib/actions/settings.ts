'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export type SettingsUpdate = {
  inst_name?:               string
  inst_address?:            string
  inst_phone?:              string
  admin_email?:             string
  wa_template_fee_reminder?: string
  reminder_days?:           number
  reminder_hour?:           number
}

export async function saveSettings(data: SettingsUpdate) {
  const supabase = await createAdminClient()

  // Try update first; if no row, insert
  const { data: existing } = await (supabase.from('app_settings') as any)
    .select('id')
    .limit(1)
    .single()

  if (existing) {
    const { error } = await (supabase.from('app_settings') as any)
      .update(data)
      .eq('id', (existing as any).id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await (supabase.from('app_settings') as any)
      .insert(data)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}
