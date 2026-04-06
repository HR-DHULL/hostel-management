'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, AlertTriangle, MessageSquare, IndianRupee, X } from 'lucide-react'

interface NotifItem {
  type: string
  title: string
  sub: string
  time: string
  href: string
  priority?: string
}

interface NotifData {
  items: NotifItem[]
  overdueCount: number
  complaintCount: number
}

function relTime(iso: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const TYPE_ICON: Record<string, React.ElementType> = {
  overdue:   AlertTriangle,
  complaint: MessageSquare,
  payment:   IndianRupee,
}

const TYPE_COLOR: Record<string, string> = {
  overdue:   'text-red-500 bg-red-50',
  complaint: 'text-orange-500 bg-orange-50',
  payment:   'text-green-500 bg-green-50',
}

export function NotificationBell() {
  const [open, setOpen]   = useState(false)
  const [data, setData]   = useState<NotifData | null>(null)
  const ref               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const alertCount = (data?.overdueCount ?? 0) + (data?.complaintCount ?? 0)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {alertCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-white shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {!data || data.items.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No alerts right now</p>
              </div>
            ) : (
              data.items.map((item, i) => {
                const Icon  = TYPE_ICON[item.type] ?? Bell
                const color = TYPE_COLOR[item.type] ?? 'text-slate-500 bg-slate-50'
                return (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.sub}</p>
                      {item.time && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{relTime(item.time)}</p>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-border">
            <p className="text-[10px] text-slate-400 text-center">Updates every page load</p>
          </div>
        </div>
      )}
    </div>
  )
}
