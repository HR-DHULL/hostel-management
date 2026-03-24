'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, X, Check, Mail, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inviteStaff, removeTeamMember, type TeamMember } from '@/lib/actions/team'
import { IdCardModal } from '@/components/shared/IdCardModal'

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-primary/10 text-primary',
  staff:  'bg-slate-100 text-slate-600',
}

export function TeamClient({ members: initial, currentUserId, instName }: { members: TeamMember[]; currentUserId: string; instName: string }) {
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleInvite() {
    if (!email.trim() || !displayName.trim()) return
    setError('')
    setSuccess('')
    startTransition(async () => {
      try {
        await inviteStaff(email.trim(), displayName.trim())
        setSuccess(`Invite sent to ${email.trim()}`)
        setEmail('')
        setDisplayName('')
        setShowInvite(false)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from the team? They will lose all access.`)) return
    setError('')
    startTransition(async () => {
      try {
        await removeTeamMember(userId)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700 flex items-center gap-2">
          <Check className="h-4 w-4" /> {success}
        </div>
      )}

      {/* Invite form */}
      {showInvite ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-900">Invite a staff member</p>
          <p className="text-xs text-slate-500">They will receive an email with a link to set their password and log in.</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              autoFocus
              className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Full name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
            <input
              type="email"
              className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInvite} disabled={isPending || !email.trim() || !displayName.trim()}>
              <Mail className="h-3.5 w-3.5" />
              {isPending ? 'Sending…' : 'Send invite'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowInvite(false)}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" onClick={() => { setShowInvite(true); setSuccess('') }}>
          <Plus className="h-4 w-4" /> Invite Staff
        </Button>
      )}

      {/* Team list */}
      {initial.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-12">
          <Users className="h-8 w-8 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No team members yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {initial.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {member.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{member.display_name}</span>
                      {member.id === currentUserId && (
                        <span className="text-xs text-slate-400">(you)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[member.role] ?? 'bg-slate-100 text-slate-600'}`}>
                      {member.role === 'owner' && <Shield className="h-3 w-3" />}
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(member.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IdCardModal
                        type="staff"
                        data={{ id: member.id, display_name: member.display_name, role: member.role }}
                        instName={instName}
                      />
                      {member.id !== currentUserId && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(member.id, member.display_name)}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          disabled={isPending}
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Staff members can manage all records. Only owners can access Settings and delete data.
        To promote someone to owner, change their role directly in Supabase → profiles table.
      </p>
    </div>
  )
}
