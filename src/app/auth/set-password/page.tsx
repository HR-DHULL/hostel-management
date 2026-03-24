'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function SetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Route by role
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const dest = (profile as any)?.role === 'student' ? '/portal/dashboard' : '/dashboard'
      router.push(dest)
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Set your password</h1>
          <p className="text-sm text-slate-500 mt-1">Choose a password to complete your account setup</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">New password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                autoFocus
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm pr-10 outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Confirm password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Re-enter password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Setting password…' : 'Set password & continue'}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">Hazeon HMS</p>
      </div>
    </div>
  )
}
