import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Fallback: count overdue directly
    const [
      { count: hostelOverdue },
      { count: libraryOverdue },
      { count: messOverdue },
    ] = await Promise.all([
      (supabase as any).from('hostel_fees').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
      (supabase as any).from('library_fees').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
      (supabase as any).from('mess_fees').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
    ])

    const overdueCount   = (hostelOverdue ?? 0) + (libraryOverdue ?? 0) + (messOverdue ?? 0)
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
