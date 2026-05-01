'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUS_OPTIONS = [
  { value: 'all',        label: 'All status' },
  { value: 'in_use',     label: 'In use' },
  { value: 'in_storage', label: 'In storage' },
  { value: 'retired',    label: 'Retired' },
  { value: 'lost',       label: 'Lost' },
]

const CATEGORY_OPTIONS = [
  { value: 'all',       label: 'All categories' },
  { value: 'laptop',    label: 'Laptop' },
  { value: 'phone',     label: 'Phone' },
  { value: 'uniform',   label: 'Uniform' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other',     label: 'Other' },
]

export function AssetFilters({
  status, category, search,
}: {
  status:   string
  category: string
  search:   string
}) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ]    = useState(search)

  // Debounce search input -> URL sync (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q) params.set('q', q); else params.delete('q')
      params.delete('page')
      router.push(`/assets?${params.toString()}`)
    }, 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value); else params.delete(key)
    params.delete('page')
    router.push(`/assets?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or serial..."
          className="pl-9"
        />
      </div>

      <Select value={status} onValueChange={(v) => setParam('status', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={(v) => setParam('category', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
