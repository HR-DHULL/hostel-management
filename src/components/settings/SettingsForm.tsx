'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { saveSettings } from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/helpers'

type SettingsRow = Tables<'app_settings'>

export function SettingsForm({ settings }: { settings: SettingsRow | null }) {
  const router   = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')
  const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL
  const [logoUrl, setLogoUrl] = useState<string | null>(
    storageBase ? `${storageBase}/storage/v1/object/public/logos/logo?t=${Date.now()}` : null
  )
  const [logoImgError, setLogoImgError] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    setLogoUploading(true)
    setError('')
    try {
      // Always upload as fixed path "logo" — no DB column needed
      const { error: upErr } = await supabase.storage.from('logos').upload('logo', file, {
        upsert: true,
        contentType: file.type,
      })
      if (upErr) throw new Error(upErr.message)
      const { data } = supabase.storage.from('logos').getPublicUrl('logo')
      setLogoUrl(`${data.publicUrl}?t=${Date.now()}`)
      setLogoImgError(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleRemoveLogo() {
    setLogoUploading(true)
    try {
      await supabase.storage.from('logos').remove(['logo'])
      setLogoUrl(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const fd = new FormData(e.currentTarget)
    const payload = {
      inst_name:               String(fd.get('inst_name')   ?? '').trim(),
      inst_address:            String(fd.get('inst_address') ?? '').trim() || undefined,
      inst_phone:              String(fd.get('inst_phone')  ?? '').trim() || undefined,
      admin_email:             String(fd.get('admin_email') ?? '').trim() || undefined,
      wa_template_fee_reminder: String(fd.get('wa_template_fee_reminder') ?? '').trim() || undefined,
      reminder_days:           Number(fd.get('reminder_days') ?? 3),
    }

    try {
      await saveSettings(payload)
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Institute */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Institute Details</h2>
        <div className="space-y-4">

          {/* Logo upload */}
          <div className="space-y-2">
            <Label>Academy Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl && !logoImgError ? (
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 w-16 rounded-lg object-cover border border-border"
                    onError={() => setLogoImgError(true)}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={logoUploading}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300">
                  <Upload className="h-6 w-6" />
                </div>
              )}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={logoUploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {logoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {logoUploading ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
                </Button>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG — shown in sidebar</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inst_name">Institute name <span className="text-danger">*</span></Label>
            <Input
              id="inst_name"
              name="inst_name"
              defaultValue={settings?.inst_name ?? ''}
              placeholder="Shri Ram Hostel"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inst_address">Address</Label>
            <Input
              id="inst_address"
              name="inst_address"
              defaultValue={(settings as any)?.inst_address ?? ''}
              placeholder="123, Main Road, City — 110001"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inst_phone">Contact phone</Label>
              <Input
                id="inst_phone"
                name="inst_phone"
                defaultValue={(settings as any)?.inst_phone ?? ''}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin_email">Admin email</Label>
              <Input
                id="admin_email"
                name="admin_email"
                type="email"
                defaultValue={settings?.admin_email ?? ''}
                placeholder="admin@institute.com"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Reminders */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Fee Reminders</h2>
        <p className="text-xs text-slate-500 mb-4">
          WhatsApp template for fee reminders. Use <code className="bg-slate-100 px-1 rounded text-xs">{`{name}`}</code>,{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">{`{amount}`}</code>,{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">{`{month}`}</code>,{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">{`{date}`}</code> as placeholders.
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wa_template_fee_reminder">WhatsApp message template</Label>
            <Textarea
              id="wa_template_fee_reminder"
              name="wa_template_fee_reminder"
              defaultValue={
                (settings as any)?.wa_template_fee_reminder ??
                'Hi {name}, your fee of {amount} is due on {date} for {month}. Please pay at the earliest. - Management'
              }
              rows={3}
              placeholder="Hi {name}, your fee of {amount}…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reminder_days">Remind N days before due date</Label>
            <Input
              id="reminder_days"
              name="reminder_days"
              type="number"
              min="0"
              max="30"
              defaultValue={settings?.reminder_days ?? 3}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Saving…' : 'Save settings'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-success">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
    </form>
  )
}
