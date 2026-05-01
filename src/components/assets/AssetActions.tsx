'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal, Pencil, Trash2, Loader2, UserCheck, ArrowDownToLine, Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  reassignAsset, returnAsset, setAssetStatus, updateAsset, deleteAsset,
} from '@/lib/actions/assets'
import type { AssetCategory, AssetStatus, AssetWithHolder } from '@/lib/queries/assets'
import type { TeamMember } from '@/lib/queries/team-members'

const NEW_JOINER = '__new__'

const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: 'laptop',    label: 'Laptop' },
  { value: 'phone',     label: 'Phone' },
  { value: 'uniform',   label: 'Uniform' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other',     label: 'Other' },
]

interface Props {
  asset:       AssetWithHolder
  teamMembers: TeamMember[]
  isOwner:     boolean
}

export function AssetActions({ asset, teamMembers, isOwner }: Props) {
  const router = useRouter()
  const [openReassign, setOpenReassign] = useState(false)
  const [openReturn,   setOpenReturn]   = useState(false)
  const [openEdit,     setOpenEdit]     = useState(false)
  const [openStatus,   setOpenStatus]   = useState<null | AssetStatus>(null)
  const [openDelete,   setOpenDelete]   = useState(false)
  const [isPending,    startTransition] = useTransition()

  function refresh() { router.refresh() }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {asset.status === 'in_use' && (
            <>
              <DropdownMenuItem onClick={() => setOpenReassign(true)}>
                <UserCheck className="h-4 w-4" /> Reassign
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenReturn(true)}>
                <ArrowDownToLine className="h-4 w-4" /> Mark returned
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {asset.status === 'in_storage' && (
            <>
              <DropdownMenuItem onClick={() => setOpenReassign(true)}>
                <UserCheck className="h-4 w-4" /> Issue to team member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <Pencil className="h-4 w-4" /> Edit details
          </DropdownMenuItem>
          {asset.status !== 'retired' && (
            <DropdownMenuItem onClick={() => setOpenStatus('retired')}>
              <Ban className="h-4 w-4" /> Mark retired
            </DropdownMenuItem>
          )}
          {asset.status !== 'lost' && (
            <DropdownMenuItem onClick={() => setOpenStatus('lost')}>
              <Ban className="h-4 w-4" /> Mark lost
            </DropdownMenuItem>
          )}
          {(asset.status === 'retired' || asset.status === 'lost') && (
            <DropdownMenuItem onClick={() => setOpenStatus('in_storage')}>
              <ArrowDownToLine className="h-4 w-4" /> Restore to storage
            </DropdownMenuItem>
          )}
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => setOpenDelete(true)}>
                <Trash2 className="h-4 w-4" /> Delete asset
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReassignDialog
        open={openReassign}
        onOpenChange={setOpenReassign}
        asset={asset}
        teamMembers={teamMembers}
        onDone={refresh}
      />

      <Dialog open={openReturn} onOpenChange={setOpenReturn}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark returned</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Move <strong>{asset.name}</strong> back to storage? Current holder
            <strong> {asset.current_holder_name ?? 'unknown'}</strong> will be marked as returned.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReturn(false)}>Cancel</Button>
            <Button
              onClick={() =>
                startTransition(async () => {
                  await returnAsset(asset.id)
                  setOpenReturn(false)
                  refresh()
                })
              }
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        asset={asset}
        onDone={refresh}
      />

      <Dialog open={openStatus !== null} onOpenChange={() => setOpenStatus(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {openStatus === 'retired' && 'Retire asset'}
              {openStatus === 'lost'    && 'Mark asset as lost'}
              {openStatus === 'in_storage' && 'Restore asset'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Change status of <strong>{asset.name}</strong>?
            {(openStatus === 'retired' || openStatus === 'lost') && asset.current_holder_name && (
              <span className="block mt-2 text-xs">
                Current holder ({asset.current_holder_name}) will be auto-returned.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenStatus(null)}>Cancel</Button>
            <Button
              onClick={() =>
                startTransition(async () => {
                  if (openStatus) await setAssetStatus(asset.id, openStatus)
                  setOpenStatus(null)
                  refresh()
                })
              }
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete asset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Permanently delete <strong>{asset.name}</strong>? Assignment history will be lost.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() =>
                startTransition(async () => {
                  await deleteAsset(asset.id)
                  setOpenDelete(false)
                  refresh()
                })
              }
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ----------------------------------------------------------------------
// REASSIGN DIALOG
// ----------------------------------------------------------------------

function ReassignDialog({
  open, onOpenChange, asset, teamMembers, onDone,
}: {
  open:         boolean
  onOpenChange: (v: boolean) => void
  asset:        AssetWithHolder
  teamMembers:  TeamMember[]
  onDone:       () => void
}) {
  const [recipient, setRecipient] = useState('')
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [notes,     setNotes]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const isNewJoiner = recipient === NEW_JOINER

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await reassignAsset(asset.id, {
        assigned_to_profile_id: isNewJoiner || !recipient ? null : recipient,
        assigned_to_name:       isNewJoiner ? name.trim() || null : null,
        assigned_to_phone:      isNewJoiner ? phone.trim() || null : null,
        assignment_notes:       notes.trim() || null,
      })
      onOpenChange(false)
      setRecipient('')
      setName('')
      setPhone('')
      setNotes('')
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {asset.status === 'in_use' ? 'Reassign' : 'Issue'} {asset.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {asset.current_holder_name && (
            <p className="text-xs text-slate-500">
              Current holder <strong>{asset.current_holder_name}</strong> will be auto-returned.
            </p>
          )}

          <div className="space-y-1">
            <Label className="text-xs">New holder *</Label>
            <Select value={recipient || undefined} onValueChange={setRecipient}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.display_name}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_JOINER}>+ New joiner / Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isNewJoiner && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !recipient}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ----------------------------------------------------------------------
// EDIT DIALOG (name, category, serial, notes)
// ----------------------------------------------------------------------

function EditDialog({
  open, onOpenChange, asset, onDone,
}: {
  open:         boolean
  onOpenChange: (v: boolean) => void
  asset:        AssetWithHolder
  onDone:       () => void
}) {
  const [name,     setName]     = useState(asset.name)
  const [category, setCategory] = useState<AssetCategory>(asset.category)
  const [serial,   setSerial]   = useState(asset.serial_number ?? '')
  const [notes,    setNotes]    = useState(asset.notes ?? '')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await updateAsset(asset.id, {
        name,
        category,
        serial_number: serial.trim() || null,
        notes:         notes.trim() || null,
      })
      onOpenChange(false)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Name *</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Serial / IMEI</Label>
            <Input value={serial} onChange={(e) => setSerial(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="rounded-md bg-danger/8 px-3 py-2 text-xs text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
