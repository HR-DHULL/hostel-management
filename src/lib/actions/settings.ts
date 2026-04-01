'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, createAdminClient } from '@/lib/supabase/server'

export type SettingsUpdate = {
  inst_name?:                string
  inst_address?:             string
  inst_phone?:               string
  admin_email?:              string
  wa_template_fee_reminder?: string
  reminder_days?:            number
  reminder_hour?:            number
  total_library_seats?:      number
}

export async function saveSettings(data: SettingsUpdate) {
  await requireRole('owner')
  const supabase = await createAdminClient()

  // Upsert the single settings row (match on any existing row)
  const { error } = await (supabase.from('app_settings') as any)
    .update(data)
    .not('id', 'is', null)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function uploadLogo(formData: FormData): Promise<{ url: string; error?: string }> {
  try {
    await requireRole('owner')
    const supabase = await createAdminClient()

    const file = formData.get('file') as File
    if (!file) return { url: '', error: 'No file provided' }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { url: '', error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }
    }
    if (file.size > MAX_SIZE_BYTES) {
      return { url: '', error: 'File too large. Maximum size is 2 MB.' }
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage
      .from('logos')
      .upload('logo', buffer, { contentType: file.type, upsert: true })

    if (error) return { url: '', error: error.message }

    const { data } = supabase.storage.from('logos').getPublicUrl('logo')
    const url = `${data.publicUrl}?t=${Date.now()}`
    return { url }
  } catch (e: unknown) {
    return { url: '', error: e instanceof Error ? e.message : 'Upload failed' }
  }
}

export async function removeLogo(): Promise<{ error?: string }> {
  try {
    await requireRole('owner')
    const supabase = await createAdminClient()
    const { error } = await supabase.storage.from('logos').remove(['logo'])
    if (error) return { error: error.message }
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Remove failed' }
  }
}
