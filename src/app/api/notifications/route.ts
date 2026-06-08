import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeeVisibleForExit } from '@/lib/fee-visibility'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ items: [], overdueCount: 0, complaintCount: 0 })

    const now   = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    const [
      { data: overdueFees },
      { data: openComplaints },
      { data: recentPayments },
    ] = await Promise.all([
      // Overdue fees across all 3 modules this month
      (supabase as any).rpc('get_overdue_count_this_month', { p_month: month, p_year: year }).single().catch(() => ({ data: null })),
      (supabase as any).from('complaints').select('id, subject, priority, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(5),
      (supabase as any).from('payment_log').select('id, module, amount, paid_at, notes').order('paid_at', { ascending: false }).limit(5),
    ])

    // Count overdue fees, excluding exited members' dues (same rule used for
    // the reports, fee pages, and dashboard).
    const [
      { data: hostelOv },
      { data: libraryOv },
      { data: messOv },
    ] = await Promise.all([
      (supabase as any).from('hostel_fees').select('paid_amount, hostel_students(status)').eq('status', 'overdue'),
      (supabase as any).from('library_fees').select('paid_amount, library_members(status)').eq('status', 'overdue'),
      (supabase as any).from('mess_fees').select('paid_amount, mess_members(status)').eq('status', 'overdue'),
    ])

    const countVisible = (rows: any[] | null, key: string) =>
      (rows ?? []).filter((r: any) => isFeeVisibleForExit(r[key], r)).length

    const overdueCount   = countVisible(hostelOv, 'hostel_students')
                         + countVisible(libraryOv, 'library_members')
                         + countVisible(messOv, 'mess_members')
    const complaintCount = (openComplaints ?? []).length

    const items: { type: string; title: string; sub: string; time: string; href: string; priority?: string }[] = []

    if (overdueCount > 0) {
      items.push({
        type:  'overdue',
        title: `${overdueCount} overdue fee${overdueCount > 1 ? 's' : ''}`,
        sub:   'Fees past due date',
        time:  '',
        href:  '/fees/hostel',
      })
    }

    for (const c of (openComplaints ?? []).slice(0, 3)) {
      items.push({
        type:     'complaint',
        title:    c.subject,
        sub:      `Priority: ${c.priority}`,
        time:     c.created_at,
        href:     '/complaints',
        priority: c.priority,
      })
    }

    for (const p of (recentPayments ?? []).slice(0, 3)) {
      items.push({
        type:  'payment',
        title: `Payment received — ${p.module}`,
        sub:   `₹${Number(p.amount).toLocaleString('en-IN')}${p.notes ? ` · ${p.notes}` : ''}`,
        time:  p.paid_at,
        href:  `/fees/${p.module}`,
      })
    }

    return NextResponse.json({ items, overdueCount, complaintCount })
  } catch {
    return NextResponse.json({ items: [], overdueCount: 0, complaintCount: 0 })
  }
}
