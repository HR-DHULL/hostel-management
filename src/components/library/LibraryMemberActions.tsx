'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, LogOut, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LibraryMemberForm } from './LibraryMemberForm'
import { exitLibraryMember, deleteLibraryMember } from '@/lib/actions/library'
import type { Tables } from '@/lib/supabase/helpers'

type MemberRow = Tables<'library_members'>

interface LibraryMemberActionsProps {
  member: MemberRow
}

export function LibraryMemberActions({ member }: LibraryMemberActionsProps) {
  const router = useRouter()
  const [editOpen,   setEditOpen]   = useState(false)
  const [exitOpen,   setExitOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exitDate,   setExitDate]   = useState(new Date().toISOString().split('T')[0])
  const [loading,    setLoading]    = useState(false)

  async function handleExit() {
    setLoading(true)
    try {
      await exitLibraryMember(member.id, exitDate)
      setExitOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteLibraryMember(member.id)
      setDeleteOpen(false)
      router.push('/library')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit details
          </DropdownMenuItem>
          {member.status === 'active' && (
            <DropdownMenuItem onClick={() => setExitOpen(true)}>
              <LogOut className="h-4 w-4" /> Mark as exited
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit member — {member.name}</DialogTitle>
          </DialogHeader>
          <LibraryMemberForm member={member} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as exited</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will mark <strong>{member.name}</strong> as exited and free their seat.
            The record will be preserved.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="exit_date_lib">Exit date</Label>
            <Input
              id="exit_date_lib"
              type="date"
              value={exitDate}
              onChange={e => setExitDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitOpen(false)}>Cancel</Button>
            <Button onClick={handleExit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong>{member.name}</strong>?
            Their record will be moved to the audit log.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
