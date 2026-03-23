'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  title: string
  description?: string
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
        <Button variant="ghost" size="icon" className="relative text-slate-500">
          <Bell className="h-4 w-4" />
          {/* Notification dot — shown when there are alerts */}
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
        </Button>
      </div>
    </header>
  )
}
