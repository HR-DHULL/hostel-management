import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
  accent?: 'primary' | 'success' | 'warning' | 'danger'
}

const ACCENT_STYLES = {
  primary: 'bg-primary/8 text-primary',
  success: 'bg-success/8 text-success',
  warning: 'bg-warning/8 text-warning',
  danger:  'bg-danger/8 text-danger',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = 'primary',
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'mt-1.5 text-xs font-medium',
              trend.positive ? 'text-success' : 'text-danger'
            )}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', ACCENT_STYLES[accent])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  )
}

/** Skeleton placeholder while loading */
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-white p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="mt-2 h-7 w-16 rounded bg-slate-100" />
          <div className="mt-1.5 h-3 w-20 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-9 rounded-lg bg-slate-100" />
      </div>
    </div>
  )
}
