'use client'

import { NotificationBell } from './NotificationBell'

interface TopbarProps {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}

export function Topbar({ title, description, actions }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <NotificationBell />
      </div>
    </header>
  )
}
