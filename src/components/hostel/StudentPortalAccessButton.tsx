'use client'

import { useState, useTransition } from 'react'
import { KeyRound, Mail, X, Check, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inviteStudentAccess, revokeStudentAccess } from '@/lib/actions/student-access'

interface Props {
  studentId: string
  studentName: string
  studentEmail?: string | null
  portalUserId?: string | null  // set if access already granted
}

export function StudentPortalAccessButton({
  studentId,
  studentName,
  studentEmail,
  portalUserId,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState(studentEmail ?? '')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleInvite() {
    if (!email.trim()) return
    setMessage(null)
    startTransition(async () => {
      try {
        await inviteStudentAccess(studentId, email.trim(), studentName)
        setMessage({ type: 'success', text: `Invite sent to ${email.trim()}. They'll receive an email to set their password.` })
        setShowForm(false)
      } catch (e: any) {
        setMessage({ type: 'error', text: e.message })
      }
    })
  }

  function handleRevoke() {
    if (!portalUserId) return
    if (!confirm(`Remove portal access for ${studentName}? They will no longer be able to log in.`)) return
    setMessage(null)
    startTransition(async () => {
      try {
        await revokeStudentAccess(studentId, portalUserId)
        setMessage({ type: 'success', text: 'Portal access removed.' })
      } catch (e: any) {
        setMessage({ type: 'error', text: e.message })
      }
    })
  }

  return (
    <div className="space-y-2">
      {message && (
        <div className={`rounded-md px-3 py-2 text-xs flex items-start gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' && <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
          {message.text}
        </div>
      )}

      {portalUserId ? (
        // Already has access
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
            <Check className="h-3.5 w-3.5" />
            Portal access granted
          </div>
          <button
            onClick={handleRevoke}
            disabled={isPending}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
            title="Revoke access"
          >
            <ShieldOff className="h-3.5 w-3.5" />
            Revoke
          </button>
        </div>
      ) : showForm ? (
        // Invite form
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
          <p className="text-xs font-medium text-slate-700">
            Send portal login invite to {studentName}
          </p>
          <div className="flex gap-2">
            <input
              autoFocus
              type="email"
              className="flex-1 rounded-md border border-border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            <Button size="sm" onClick={handleInvite} disabled={isPending || !email.trim()} className="text-xs h-7">
              <Mail className="h-3.5 w-3.5" />
              {isPending ? 'Sending…' : 'Send'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 px-2">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[11px] text-slate-400">
            Student will receive an email to set their password and access their portal at /portal/login
          </p>
        </div>
      ) : (
        // Button to open form
        <button
          onClick={() => { setShowForm(true); setMessage(null) }}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Send portal access
        </button>
      )}
    </div>
  )
}
