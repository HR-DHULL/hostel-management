'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MONTH_NAMES } from '@/lib/utils'

interface MonthNavigatorProps {
  month: number
  year: number
}

export function MonthNavigator({ month, year }: MonthNavigatorProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  function navigate(m: number, y: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', String(m))
    params.set('year', String(y))
    router.push(`${pathname}?${params.toString()}`)
  }

  function prev() {
    if (month === 1) navigate(12, year - 1)
    else navigate(month - 1, year)
  }

  function next() {
    if (month === 12) navigate(1, year + 1)
    else navigate(month + 1, year)
  }

  const now   = new Date()
  const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear()

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={prev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-[140px] text-center">
        <span className="text-sm font-semibold text-slate-900">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        {isCurrent && (
          <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            Current
          </span>
        )}
      </div>

      <Button variant="outline" size="icon" className="h-8 w-8" onClick={next}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
