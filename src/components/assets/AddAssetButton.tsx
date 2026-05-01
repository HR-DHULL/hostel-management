'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AssetForm } from './AssetForm'
import type { TeamMember } from '@/lib/queries/team-members'

export function AddAssetButton({ teamMembers }: { teamMembers: TeamMember[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add asset
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add asset</DialogTitle>
          </DialogHeader>
          <AssetForm teamMembers={teamMembers} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
