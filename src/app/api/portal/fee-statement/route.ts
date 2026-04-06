import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MONTH_NAMES } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const supabase   = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const studentId = request.nextUrl.searchParams.get('studentId')
  if (!studentId) return new NextResponse('Missing studentId', { status: 400 })

  // Verify the requesting user owns this student record
  const { data: profile } = await supabase
    .from('profiles')
    .select('linked_student_id, display_name')
    .eq('id', user.id)
    .single()

  if ((profile as any)?.linked_student_id !== studentId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: student } = await (supabase.from('hostel_students') as any)
    .select('name, phone, course, room_number')
    .eq('id', studentId)
    .single()

  const { data: fees } = await (supabase.from('hostel_fees') as any)
    .select('month, year, due_date, net_amount, paid_amount, balance, status')
    .eq('student_id', studentId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  const { data: settings } = await (supabase.from('app_settings') as any)
    .select('inst_name').single()

  const rows = (fees ?? []) as any[]
  const s    = (student ?? {}) as any
  const inst = (settings as any)?.inst_name ?? 'Institute'

  const lines = [
    `FEE STATEMENT`,
    `Institute: ${inst}`,
    `Student: ${s.name ?? ''}`,
    `Phone: ${s.phone ?? ''}`,
    s.course     ? `Course: ${s.course}` : '',
    s.room_number ? `Room: ${s.room_number}` : '',
    `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    ``,
    `Month,Year,Due Date,Net Amount,Paid,Balance,Status`,
    ...rows.map(f =>
      [
        MONTH_NAMES[f.month - 1],
        f.year,
        new Date(f.due_date).toLocaleDateString('en-IN'),
        f.net_amount,
        f.paid_amount,
        f.balance,
        f.status,
      ].join(',')
    ),
    ``,
    `Total Paid,${rows.reduce((s: number, f: any) => s + Number(f.paid_amount), 0)}`,
    `Total Outstanding,${rows.filter((f: any) => f.status !== 'paid').reduce((s: number, f: any) => s + Number(f.balance), 0)}`,
  ].filter(l => l !== null)

  const csv = lines.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': `attachment; filename="fee-statement-${s.name?.replace(/\s+/g, '-') ?? 'statement'}.csv"`,
    },
  })
}
