'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleAttendance, markAllPresent } from '@/lib/actions/mess'
import type { AttendanceRow } from '@/lib/queries/mess'

interface Member {
  id:   string
  name: string
}

interface AttendanceGridProps {
  members:    Member[]
  attendance: AttendanceRow[]
  month:      number
  year:       number
  daysInMonth: number
}

export function AttendanceGrid({
  members,
  attendance,
  month,
  year,
  daysInMonth,
}: AttendanceGridProps) {
  const router = useRouter()
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({})
  const [isPending,  startTransition] = useTransition()
  const [today] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  // Build a quick-lookup: "memberId|date" → boolean
  const attMap: Record<string, boolean> = {}
  for (const a of attendance) {
    attMap[`${a.member_id}|${a.att_date}`] = a.present
  }

  function isPresent(memberId: string, day: number): boolean {
    const key = `${memberId}|${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (key in optimistic) return optimistic[key]
    return attMap[key] ?? false
  }

  function toggle(memberId: string, day: number) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const key  = `${memberId}|${date}`
    const next = !isPresent(memberId, day)

    setOptimistic(prev => ({ ...prev, [key]: next }))

    startTransition(async () => {
      await toggleAttendance(memberId, date, next)
      router.refresh()
    })
  }

  async function handleMarkAllPresent(day: number) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const updates: Record<string, boolean> = {}
    for (const m of members) {
      updates[`${m.id}|${date}`] = true
    }
    setOptimistic(prev => ({ ...prev, ...updates }))
    startTransition(async () => {
      await markAllPresent(date, members.map(m => m.id))
      router.refresh()
    })
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-slate-50 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-border min-w-[160px]">
              Member
            </th>
            {days.map(d => {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const isToday = dateStr === today
              return (
                <th
                  key={d}
                  className={`px-1 py-2 text-center font-medium border-b border-border w-9 ${
                    isToday ? 'bg-primary/8 text-primary' : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  <div>{d}</div>
                  <button
                    onClick={() => handleMarkAllPresent(d)}
                    className="mt-0.5 text-[9px] text-slate-400 hover:text-primary transition-colors"
                    title="Mark all present"
                  >
                    All
                  </button>
                </th>
              )
            })}
            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-border bg-slate-50">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {members.map(member => {
            const presentDays = days.filter(d => isPresent(member.id, d)).length
            return (
              <tr key={member.id} className="hover:bg-slate-50/50">
                <td className="sticky left-0 bg-white z-10 px-3 py-1.5 font-medium text-slate-900 border-r border-slate-100">
                  {member.name}
                </td>
                {days.map(d => {
                  const present = isPresent(member.id, d)
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  const isToday = dateStr === today
                  return (
                    <td
                      key={d}
                      className={`px-0.5 py-1 text-center ${isToday ? 'bg-primary/3' : ''}`}
                    >
                      <button
                        onClick={() => toggle(member.id, d)}
                        className={`flex h-6 w-6 items-center justify-center rounded mx-auto transition-colors ${
                          present
                            ? 'bg-success/15 text-success hover:bg-success/25'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                        }`}
                      >
                        {present ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </button>
                    </td>
                  )
                })}
                <td className="px-3 py-1.5 text-center font-semibold text-slate-900 tabular-nums">
                  {presentDays}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {members.length === 0 && (
        <div className="py-10 text-center text-sm text-slate-400">
          No active mess members
        </div>
      )}
    </div>
  )
}
