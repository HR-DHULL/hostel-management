'use client'

import { useState, useRef } from 'react'
import { CreditCard, Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type StudentCardData = {
  id: string
  name: string
  phone: string
  course?: string | null
  room_number?: string | null
  hostel_name?: string | null
  joining_date: string
  status: string
}

export type StaffCardData = {
  id: string
  display_name: string
  role: string
}

type Props =
  | { type: 'student'; data: StudentCardData; instName: string }
  | { type: 'staff'; data: StaffCardData; instName: string }

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function StudentCard({ data, instName }: { data: StudentCardData; instName: string }) {
  const shortId = 'STU-' + data.id.replace(/-/g, '').toUpperCase().slice(0, 8)
  const since = new Date(data.joining_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

  return (
    <div style={{ width: 320, fontFamily: 'system-ui, sans-serif', borderRadius: 12, overflow: 'hidden', border: '2px solid #2563eb', boxShadow: '0 4px 20px rgba(37,99,235,0.15)' }}>
      <div style={{ background: '#2563eb', padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, background: 'white', borderRadius: 2 }} />
          <p style={{ color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, margin: 0, textTransform: 'uppercase' as const }}>{instName}</p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, margin: '2px 0 0 15px', letterSpacing: 2 }}>STUDENT IDENTITY CARD</p>
      </div>

      <div style={{ background: 'white', padding: '14px 14px 12px', display: 'flex', gap: 12 }}>
        <div style={{ width: 56, height: 68, background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>
          {initials(data.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 3px', lineHeight: 1.2 }}>{data.name}</p>
          {data.course && <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>{data.course}</p>}
          {data.room_number && (
            <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>
              Room <strong style={{ color: '#334155' }}>{data.room_number}</strong>
              {data.hostel_name && <span style={{ color: '#94a3b8' }}> · {data.hostel_name}</span>}
            </p>
          )}
          <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>
            Ph: <strong style={{ color: '#334155' }}>{data.phone}</strong>
          </p>
          <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>
            Since: <strong style={{ color: '#334155' }}>{since}</strong>
          </p>
        </div>
      </div>

      <div style={{ background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '7px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b', margin: 0, letterSpacing: 1 }}>{shortId}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: data.status === 'active' ? '#22c55e' : '#94a3b8' }} />
          <span style={{ fontSize: 9, color: '#64748b', textTransform: 'capitalize' as const }}>{data.status}</span>
        </div>
      </div>
    </div>
  )
}

function StaffCard({ data, instName }: { data: StaffCardData; instName: string }) {
  const shortId = 'STF-' + data.id.replace(/-/g, '').toUpperCase().slice(0, 8)
  const color = data.role === 'owner' ? '#7c3aed' : '#2563eb'

  return (
    <div style={{ width: 320, fontFamily: 'system-ui, sans-serif', borderRadius: 12, overflow: 'hidden', border: `2px solid ${color}`, boxShadow: `0 4px 20px ${color}26` }}>
      <div style={{ background: color, padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, background: 'white', borderRadius: 2 }} />
          <p style={{ color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, margin: 0, textTransform: 'uppercase' as const }}>{instName}</p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, margin: '2px 0 0 15px', letterSpacing: 2 }}>STAFF IDENTITY CARD</p>
      </div>

      <div style={{ background: 'white', padding: '20px 14px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, background: `${color}1a`, border: `2px solid ${color}40`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color, flexShrink: 0 }}>
            {initials(data.display_name)}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 5px' }}>{data.display_name}</p>
            <span style={{ background: `${color}18`, color, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              {data.role}
            </span>
          </div>
        </div>
      </div>

      <div style={{ background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '7px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b', margin: 0, letterSpacing: 1 }}>{shortId}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 9, color: '#64748b' }}>Active</span>
        </div>
      </div>
    </div>
  )
}

export function IdCardModal(props: Props) {
  const [open, setOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    if (!cardRef.current) return
    const name = props.type === 'student' ? props.data.name : props.data.display_name
    const win = window.open('', '_blank', 'width=440,height=580')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${name} - ID Card</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; font-family: system-ui, sans-serif; }
    @media print { body { background: white; } }
  </style>
</head>
<body>${cardRef.current.outerHTML}</body>
</html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 300)
  }

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <CreditCard className="h-3.5 w-3.5" />
        ID Card
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-5 flex flex-col items-center gap-4 w-full max-w-[380px]">
            <div className="flex w-full items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Identity Card Preview</p>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={cardRef}>
              {props.type === 'student'
                ? <StudentCard data={props.data} instName={props.instName} />
                : <StaffCard data={props.data} instName={props.instName} />
              }
            </div>

            <Button onClick={handlePrint} className="w-full gap-2">
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
