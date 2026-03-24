'use client'

import { useState, useTransition } from 'react'
import { BookOpen, UtensilsCrossed, Plus, X, IndianRupee, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createLibraryMember } from '@/lib/actions/library'
import { createMessMember } from '@/lib/actions/mess'
import { formatCurrency } from '@/lib/utils'
import type { StudentLinkedServices } from '@/lib/queries/students'

interface Props {
  studentId: string
  studentName: string
  studentPhone: string
  studentEmail?: string | null
  hostelMonthlyFee: number
  hostelDiscount: number
  services: StudentLinkedServices
}

const MEAL_PLAN_LABEL: Record<string, string> = {
  veg: 'Veg', non_veg: 'Non-veg', custom: 'Custom',
}

export function StudentServicesSection({
  studentId,
  studentName,
  studentPhone,
  studentEmail,
  hostelMonthlyFee,
  hostelDiscount,
  services,
}: Props) {
  const [showLibForm, setShowLibForm] = useState(false)
  const [showMessForm, setShowMessForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Library form state
  const [libSeat, setLibSeat]     = useState('')
  const [libFee, setLibFee]       = useState('0')
  const [libFeeDay, setLibFeeDay] = useState('5')
  const [libDiscount, setLibDiscount] = useState('0')
  const [libDate, setLibDate]     = useState(new Date().toISOString().split('T')[0])

  // Mess form state
  const [messPlan, setMessPlan]       = useState<'veg' | 'non_veg' | 'custom'>('veg')
  const [messFee, setMessFee]         = useState('0')
  const [messFeeDay, setMessFeeDay]   = useState('5')
  const [messDiscount, setMessDiscount] = useState('0')
  const [messDate, setMessDate]       = useState(new Date().toISOString().split('T')[0])

  function handleEnrollLibrary() {
    setError('')
    startTransition(async () => {
      try {
        await createLibraryMember({
          name: studentName,
          phone: studentPhone,
          email: studentEmail ?? undefined,
          seat_number: libSeat || undefined,
          joining_date: libDate,
          monthly_fee_amount: Number(libFee),
          fee_day: Number(libFeeDay),
          discount: Number(libDiscount),
          linked_hostel_id: studentId,
        })
        setShowLibForm(false)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  function handleEnrollMess() {
    setError('')
    startTransition(async () => {
      try {
        await createMessMember({
          name: studentName,
          phone: studentPhone,
          email: studentEmail ?? undefined,
          meal_plan: messPlan,
          joining_date: messDate,
          monthly_fee_amount: Number(messFee),
          fee_day: Number(messFeeDay),
          discount: Number(messDiscount),
          linked_hostel_id: studentId,
        })
        setShowMessForm(false)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  const libNet  = services.library  ? Number(services.library.monthly_fee_amount)  - Number(services.library.discount)  : 0
  const messNet = services.mess     ? Number(services.mess.monthly_fee_amount)     - Number(services.mess.discount)     : 0
  const hostelNet = hostelMonthlyFee - hostelDiscount
  const total = hostelNet + libNet + messNet
  const hasAny = services.library || services.mess

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">Services & Bundle</p>
        {hasAny && (
          <span className="text-xs font-semibold text-slate-900">
            Total: {formatCurrency(total)}<span className="text-slate-400 font-normal">/mo</span>
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* ── Library ── */}
        <div className="rounded-lg border border-border bg-slate-50/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Library</span>
          </div>

          {services.library ? (
            <>
              {services.library.seat_number && (
                <p className="text-xs text-slate-600 mb-0.5">Seat: <strong>{services.library.seat_number}</strong></p>
              )}
              <p className="text-xs text-slate-600 mb-0.5">
                Fee: <strong>{formatCurrency(services.library.monthly_fee_amount)}</strong>/mo
                {Number(services.library.discount) > 0 && (
                  <span className="text-green-600 ml-1">-{formatCurrency(services.library.discount)}</span>
                )}
              </p>
              <p className="text-xs text-slate-400 mb-2">
                Since {new Date(services.library.joining_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
              <Link href={`/library?search=${encodeURIComponent(studentPhone)}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View <ExternalLink className="h-3 w-3" />
              </Link>
            </>
          ) : showLibForm ? (
            <div className="space-y-2">
              <input className="w-full rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30" placeholder="Seat no. (optional)" value={libSeat} onChange={e => setLibSeat(e.target.value)} />
              <div className="grid grid-cols-2 gap-1">
                <input className="rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30" placeholder="Fee ₹" type="number" min="0" value={libFee} onChange={e => setLibFee(e.target.value)} />
                <input className="rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30" placeholder="Discount ₹" type="number" min="0" value={libDiscount} onChange={e => setLibDiscount(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <input className="rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30" placeholder="Fee day" type="number" min="1" max="28" value={libFeeDay} onChange={e => setLibFeeDay(e.target.value)} />
                <input className="rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30" type="date" value={libDate} onChange={e => setLibDate(e.target.value)} />
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-xs flex-1 px-2" onClick={handleEnrollLibrary} disabled={isPending}>
                  {isPending ? '…' : 'Enroll'}
                </Button>
                <button onClick={() => setShowLibForm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setShowLibForm(true); setShowMessForm(false) }}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
            >
              <Plus className="h-3.5 w-3.5" /> Enroll in library
            </button>
          )}
        </div>

        {/* ── Mess ── */}
        <div className="rounded-lg border border-border bg-slate-50/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <UtensilsCrossed className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Mess</span>
          </div>

          {services.mess ? (
            <>
              <p className="text-xs text-slate-600 mb-0.5">
                Plan: <strong>{services.mess.meal_plan === 'custom' && services.mess.custom_plan_name ? services.mess.custom_plan_name : MEAL_PLAN_LABEL[services.mess.meal_plan]}</strong>
              </p>
              <p className="text-xs text-slate-600 mb-0.5">
                Fee: <strong>{formatCurrency(services.mess.monthly_fee_amount)}</strong>/mo
                {Number(services.mess.discount) > 0 && (
                  <span className="text-green-600 ml-1">-{formatCurrency(services.mess.discount)}</span>
                )}
              </p>
              <p className="text-xs text-slate-400 mb-2">
                Since {new Date(services.mess.joining_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
              <Link href={`/mess?search=${encodeURIComponent(studentPhone)}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View <ExternalLink className="h-3 w-3" />
              </Link>
            </>
          ) : showMessForm ? (
            <div className="space-y-2">
              <select className="w-full rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30 bg-white" value={messPlan} onChange={e => setMessPlan(e.target.value as any)}>
                <option value="veg">Veg</option>
                <option value="non_veg">Non-veg</option>
                <option value="custom">Custom</option>
              </select>
              <div className="grid grid-cols-2 gap-1">
                <input className="rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30" placeholder="Fee ₹" type="number" min="0" value={messFee} onChange={e => setMessFee(e.target.value)} />
                <input className="rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30" placeholder="Discount ₹" type="number" min="0" value={messDiscount} onChange={e => setMessDiscount(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <input className="rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30" placeholder="Fee day" type="number" min="1" max="28" value={messFeeDay} onChange={e => setMessFeeDay(e.target.value)} />
                <input className="rounded border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/30" type="date" value={messDate} onChange={e => setMessDate(e.target.value)} />
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-xs flex-1 px-2" onClick={handleEnrollMess} disabled={isPending}>
                  {isPending ? '…' : 'Enroll'}
                </Button>
                <button onClick={() => setShowMessForm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setShowMessForm(true); setShowLibForm(false) }}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
            >
              <Plus className="h-3.5 w-3.5" /> Enroll in mess
            </button>
          )}
        </div>
      </div>

      {/* Combined fee breakdown */}
      {hasAny && (
        <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-slate-900">Combined monthly total</span>
            </div>
            <span className="text-sm font-bold text-primary">{formatCurrency(total)}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="text-xs text-slate-500">Hostel: {formatCurrency(hostelNet)}</span>
            {services.library  && <span className="text-xs text-slate-500">Library: {formatCurrency(libNet)}</span>}
            {services.mess     && <span className="text-xs text-slate-500">Mess: {formatCurrency(messNet)}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
