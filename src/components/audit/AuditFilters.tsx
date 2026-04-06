'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AuditFilters() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={searchParams.get('module') ?? 'all'}
        onValueChange={v => update('module', v)}
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="All modules" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All modules</SelectItem>
          <SelectItem value="hostel">Hostel</SelectItem>
          <SelectItem value="library">Library</SelectItem>
          <SelectItem value="mess">Mess</SelectItem>
          <SelectItem value="fees">Fees</SelectItem>
          <SelectItem value="team">Team</SelectItem>
          <SelectItem value="settings">Settings</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get('action') ?? 'all'}
        onValueChange={v => update('action', v)}
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="All actions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          <SelectItem value="create">Created</SelectItem>
          <SelectItem value="update">Updated</SelectItem>
          <SelectItem value="delete">Deleted</SelectItem>
          <SelectItem value="payment">Payment</SelectItem>
          <SelectItem value="correction">Correction</SelectItem>
          <SelectItem value="generate">Generated</SelectItem>
          <SelectItem value="invite">Invited</SelectItem>
          <SelectItem value="revoke">Revoked</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
