'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MONTH_NAMES } from '@/lib/utils'
import type { UnpaidRow, MonthlyReportData } from '@/lib/queries/reports'

interface Props {
  report: MonthlyReportData
}

export function ReportExportButton({ report }: Props) {
  function exportCSV() {
    const monthName = MONTH_NAMES[report.month - 1]
    const title = `${monthName} ${report.year} - Fee Report`

    const rows: string[][] = [
      [title],
      [],
      ['Module Summary'],
      ['Module', 'Billed', 'Collected', 'Outstanding', 'Paid', 'Partial', 'Pending', 'Overdue'],
      ...(['hostel', 'library', 'mess'] as const).map(m => {
        const s = report[m]
        return [
          m.charAt(0).toUpperCase() + m.slice(1),
          String(s.billed), String(s.collected), String(s.outstanding),
          String(s.countPaid), String(s.countPartial), String(s.countPending), String(s.countOverdue),
        ]
      }),
      [],
      ['Unpaid / Partial Members'],
      ['Name', 'Phone', 'Module', 'Billed', 'Paid', 'Balance', 'Status', 'Due Date'],
      ...report.unpaid.map(r => [
        r.name, r.phone,
        r.module.charAt(0).toUpperCase() + r.module.slice(1),
        String(r.net_amount), String(r.paid_amount), String(r.balance),
        r.status, r.due_date,
      ]),
    ]

    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `report-${report.year}-${String(report.month).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={exportCSV}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  )
}
