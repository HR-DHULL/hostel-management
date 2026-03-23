'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCallback } from 'react'
import type { Tables } from '@/lib/supabase/helpers'

interface StudentsFilterProps {
  hostels: Tables<'hostels'>[]
}

export function StudentsFilter({ hostels }: StudentsFilterProps) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all' && value !== '') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, phone, room…"
          className="pl-9"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={e => updateParam('search', e.target.value)}
        />
      </div>

      <Select
        defaultValue={searchParams.get('status') ?? 'active'}
        onValueChange={v => updateParam('status', v)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="exited">Exited</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      {hostels.length > 0 && (
        <Select
          defaultValue={searchParams.get('hostelId') ?? ''}
          onValueChange={v => updateParam('hostelId', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All buildings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All buildings</SelectItem>
            {hostels.map(h => (
              <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
