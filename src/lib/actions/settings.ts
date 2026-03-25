'use server'

import { revalidatePath } from 'next/cache'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const KNOWN_ID     = 'aacc6d46-9d28-4830-ad74-0acdfb0208d3'

const headers = () => ({
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=minimal',
})

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
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/app_settings?id=eq.${KNOWN_ID}`,
    { method: 'PATCH', headers: headers(), body: JSON.stringify(data) }
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg)
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}
