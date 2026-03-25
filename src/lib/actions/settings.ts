'use server'

import { revalidatePath } from 'next/cache'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const KNOWN_ID     = 'aacc6d46-9d28-4830-ad74-0acdfb0208d3'

const authHeaders = () => ({
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
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
    {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(data),
    }
  )
  if (!res.ok) throw new Error(await res.text())

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function uploadLogo(formData: FormData): Promise<{ url: string; error?: string }> {
  try {
    const file = formData.get('file') as File
    if (!file) return { url: '', error: 'No file provided' }

    const buffer = await file.arrayBuffer()

    // Delete existing logo first (ignore errors)
    await fetch(`${SUPABASE_URL}/storage/v1/object/logos/logo`, {
      method: 'DELETE',
      headers: authHeaders(),
    })

    // Upload new logo
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/logos/logo`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': file.type,
        'x-upsert': 'true',
      },
      body: buffer,
    })

    if (!res.ok) {
      const msg = await res.text()
      return { url: '', error: msg }
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/logos/logo?t=${Date.now()}`
    return { url }
  } catch (e: any) {
    return { url: '', error: e.message }
  }
}

export async function removeLogo(): Promise<{ error?: string }> {
  try {
    await fetch(`${SUPABASE_URL}/storage/v1/object/logos/logo`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    return {}
  } catch (e: any) {
    return { error: e.message }
  }
}
