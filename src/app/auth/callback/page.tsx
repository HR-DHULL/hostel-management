'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing you in…')

  useEffect(() => {
    const supabase = createClient()

    async function handle() {
      try {
        // --- Parse URL hash (implicit flow: invite, magic link) ---
        const hash = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(hash)
        const accessToken  = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const hashType     = hashParams.get('type')

        // --- Parse query params (PKCE flow / OTP) ---
        const searchParams = new URLSearchParams(window.location.search)
        const code         = searchParams.get('code')
        const tokenHash    = searchParams.get('token_hash')
        const queryType    = searchParams.get('type')

        const type = hashType || queryType  // 'invite' | 'recovery' | etc.

        // Exchange tokens for a session
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        } else if (tokenHash && queryType) {
          await supabase.auth.verifyOtp({ token_hash: tokenHash, type: queryType as any })
        } else if (accessToken && refreshToken) {
          // Hash-based implicit flow (invite / magic link)
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        }

        // Invite or password-reset → must set a new password
        if (type === 'invite' || type === 'recovery') {
          router.replace('/auth/set-password')
          return
        }

        // Regular sign-in → route by role
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setStatus('Authentication failed. Redirecting…')
          setTimeout(() => router.replace('/login'), 1500)
          return
        }

        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        const dest = (profile as any)?.role === 'student' ? '/portal/dashboard' : '/dashboard'
        router.replace(dest)
      } catch {
        setStatus('Something went wrong. Redirecting…')
        setTimeout(() => router.replace('/login'), 1500)
      }
    }

    handle()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">{status}</p>
      </div>
    </div>
  )
}
