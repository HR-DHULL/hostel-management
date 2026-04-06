import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFeeById, getPaymentHistory } from '@/lib/queries/fees'
import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'
import type { FeeModule } from '@/lib/queries/fees'
import { PrintButton } from './PrintButton'

export const metadata: Metadata = { title: 'Fee Receipt' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params:      { feeId: string }
  searchParams: { module?: string }
}

export default async function ReceiptPage({ params, searchParams }: PageProps) {
  const module = (searchParams.module ?? 'hostel') as FeeModule

  const supabase = await createAdminClient()
  const [fee, payments, settingsResult] = await Promise.all([
    getFeeById(module, params.feeId, supabase),
    getPaymentHistory(module, params.feeId, supabase),
    (supabase.from('app_settings') as any)
      .select('inst_name, inst_address, inst_phone')
      .limit(1)
      .single(),
  ])

  if (!fee) notFound()

  const settings  = settingsResult.data as any
  const instName  = settings?.inst_name  ?? 'Institute Name'
  const instAddr  = settings?.inst_address ?? ''
  const instPhone = settings?.inst_phone ?? ''

  const moduleLabel: Record<FeeModule, string> = {
    hostel:  'Hostel Fee',
    library: 'Library Fee',
    mess:    'Mess Fee',
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 13px;
          color: #1e293b;
          background: #f8fafc;
        }
        .page {
          width: 720px;
          margin: 32px auto;
          padding: 40px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 24px;
          border-bottom: 2px solid #2563eb;
        }
        .inst-name { font-size: 20px; font-weight: 700; color: #0f172a; }
        .inst-sub  { font-size: 12px; color: #64748b; margin-top: 4px; }
        .receipt-badge { text-align: right; }
        .receipt-badge h2 {
          font-size: 18px; font-weight: 700; color: #2563eb;
          letter-spacing: 1px; text-transform: uppercase;
        }
        .receipt-badge .ref { font-size: 11px; color: #94a3b8; margin-top: 4px; }
        .meta-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 24px; margin: 24px 0;
        }
        .meta-section h3 {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 8px;
        }
        .meta-row {
          display: flex; justify-content: space-between;
          padding: 4px 0; font-size: 13px;
        }
        .meta-row .label { color: #64748b; }
        .meta-row .value { font-weight: 500; color: #0f172a; }
        .amount-section {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 6px; padding: 16px; margin: 24px 0;
        }
        .amount-row {
          display: flex; justify-content: space-between;
          padding: 5px 0; font-size: 13px;
        }
        .amount-row.total {
          border-top: 1px solid #e2e8f0; margin-top: 8px;
          padding-top: 12px; font-size: 15px; font-weight: 700;
        }
        .amount-row.total .value { color: #2563eb; }
        .payments-table {
          width: 100%; border-collapse: collapse; margin: 24px 0;
        }
        .payments-table th {
          background: #f1f5f9; text-align: left; padding: 8px 12px;
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.5px; color: #64748b;
        }
        .payments-table td {
          padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;
        }
        .status-badge {
          display: inline-block; padding: 2px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-paid    { background: #dcfce7; color: #166534; }
        .status-partial { background: #fef9c3; color: #854d0e; }
        .status-pending { background: #f1f5f9; color: #475569; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        .footer {
          margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: flex-end;
        }
        .footer .note { font-size: 11px; color: #94a3b8; }
        .signature-line { text-align: right; }
        .signature-line .line {
          width: 160px; border-top: 1px solid #1e293b;
          margin-bottom: 4px; margin-left: auto;
        }
        .signature-line .label { font-size: 11px; color: #64748b; }
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
          .page { margin: 0; border: none; border-radius: 0; }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ textAlign: 'center', padding: '16px 0', background: '#f1f5f9' }}>
        <PrintButton />
      </div>

      <div className="page">
        {/* Header */}
        <div className="header">
          <div>
            <div className="inst-name">{instName}</div>
            {instAddr  && <div className="inst-sub">{instAddr}</div>}
            {instPhone && <div className="inst-sub">Ph: {instPhone}</div>}
          </div>
          <div className="receipt-badge">
            <h2>{moduleLabel[module]} Receipt</h2>
            <div className="ref">Ref: {fee.id.slice(0, 8).toUpperCase()}</div>
            <div className="ref" style={{ marginTop: 6 }}>
              <span className={`status-badge status-${fee.status}`}>
                {fee.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Meta grid */}
        <div className="meta-grid">
          <div className="meta-section">
            <h3>Student / Member</h3>
            <div className="meta-row">
              <span className="label">Name</span>
              <span className="value">{fee.member_name}</span>
            </div>
            <div className="meta-row">
              <span className="label">Phone</span>
              <span className="value">{fee.member_phone || '—'}</span>
            </div>
            {fee.member_room && (
              <div className="meta-row">
                <span className="label">Room</span>
                <span className="value">{fee.member_room}</span>
              </div>
            )}
            {fee.member_course && (
              <div className="meta-row">
                <span className="label">Course</span>
                <span className="value">{fee.member_course}</span>
              </div>
            )}
          </div>

          <div className="meta-section">
            <h3>Fee Period</h3>
            <div className="meta-row">
              <span className="label">Month</span>
              <span className="value">{MONTH_NAMES[fee.month - 1]} {fee.year}</span>
            </div>
            <div className="meta-row">
              <span className="label">Due Date</span>
              <span className="value">
                {new Date(fee.due_date).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
            <div className="meta-row">
              <span className="label">Module</span>
              <span className="value">{moduleLabel[module]}</span>
            </div>
          </div>
        </div>

        {/* Amount breakdown */}
        <div className="amount-section">
          <div className="amount-row">
            <span style={{ color: '#64748b' }}>Gross Amount</span>
            <span>{formatCurrency(fee.total_amount)}</span>
          </div>
          {fee.discount > 0 && (
            <div className="amount-row">
              <span style={{ color: '#64748b' }}>Discount</span>
              <span style={{ color: '#16a34a' }}>− {formatCurrency(fee.discount)}</span>
            </div>
          )}
          <div className="amount-row">
            <span style={{ color: '#64748b' }}>Net Payable</span>
            <span>{formatCurrency(fee.net_amount)}</span>
          </div>
          <div className="amount-row">
            <span style={{ color: '#64748b' }}>Amount Paid</span>
            <span style={{ color: '#16a34a' }}>{formatCurrency(fee.paid_amount)}</span>
          </div>
          <div className="amount-row total">
            <span>Balance Due</span>
            <span className="value">{formatCurrency(fee.balance)}</span>
          </div>
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 8 }}>
              Payment History
            </div>
            <table className="payments-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(payments as any[]).map((p: any, i: number) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>
                      {new Date(p.paid_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{p.mode?.replace('_', ' ')}</td>
                    <td style={{ color: '#64748b' }}>{p.notes || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Footer */}
        <div className="footer">
          <div className="note">
            <div>Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div style={{ marginTop: 4 }}>This is a computer-generated receipt.</div>
          </div>
          <div className="signature-line">
            <div className="line" />
            <div className="label">Authorised Signatory</div>
          </div>
        </div>
      </div>
    </>
  )
}
