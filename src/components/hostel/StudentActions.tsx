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
import { StudentForm } from './StudentForm'
import { exitStudent, deleteStudent } from '@/lib/actions/students'
import type { Tables } from '@/lib/supabase/helpers'

type StudentRow = Tables<'hostel_students'>
type HostelRow  = Tables<'hostels'>

interface StudentActionsProps {
  student: StudentRow
  hostels: HostelRow[]
}

export function StudentActions({ student, hostels }: StudentActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen]       = useState(false)
  const [exitOpen, setExitOpen]       = useState(false)
  const [deleteOpen, setDeleteOpen]   = useState(false)
  const [exitDate, setExitDate]       = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading]         = useState(false)

  async function handleExit() {
    setLoading(true)
    try {
      await exitStudent(student.id, exitDate)
      setExitOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteStudent(student.id)
      setDeleteOpen(false)
      router.push('/hostel')
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
          {student.status === 'active' && (
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
            <DialogTitle>Edit student — {student.name}</DialogTitle>
          </DialogHeader>
          <StudentForm
            hostels={hostels}
            student={student}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as exited</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will mark <strong>{student.name}</strong> as exited and vacate their room.
            The record will be preserved.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="exit_date">Exit date</Label>
            <Input
              id="exit_date"
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
            <DialogTitle>Delete student</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong>{student.name}</strong>?
            Their record will be moved to the audit log and cannot be recovered easily.
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
