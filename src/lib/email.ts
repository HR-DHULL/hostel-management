import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
})

const FROM_EMAIL = process.env.SMTP_FROM_NAME
  ? `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_EMAIL}>`
  : process.env.SMTP_EMAIL!

export interface FeeReminderData {
  to: string
  memberName: string
  amount: number
  balance: number
  month: string
  dueDate: string
  module: string
  instName: string
}

export interface PaymentReceiptData {
  to: string
  memberName: string
  amountPaid: number
  totalPaid: number
  netAmount: number
  balance: number
  month: string
  year: number
  mode: string
  module: string
  instName: string
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export async function sendFeeReminderEmail(data: FeeReminderData) {
  const { to, memberName, amount, balance, month, dueDate, module, instName } = data

  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `Fee Reminder — ${formatINR(balance)} pending for ${month}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #1e293b; font-size: 18px;">${instName}</h2>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Fee Payment Reminder</p>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hello <strong>${memberName}</strong>,
        </p>

        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
          Please pay your pending <strong>${module}</strong> fee of <strong style="color: #dc2626;">${formatINR(balance)}</strong> before <strong>5th ${month}</strong> to avoid fine charges.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 0 0 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Total Fee</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${formatINR(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Pending Amount</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #dc2626;">${formatINR(balance)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Due Date</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${dueDate}</td>
            </tr>
          </table>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
          If you have already paid, please ignore this message.
        </p>

        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Thank You<br/>
          <strong>— Management, ${instName}</strong>
        </p>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
            This is an automated reminder. Do not reply to this email.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendPaymentReceiptEmail(data: PaymentReceiptData) {
  const { to, memberName, amountPaid, totalPaid, netAmount, balance, month, year, mode, module, instName } = data

  const status = balance <= 0 ? 'Fully Paid' : `Partially Paid — ${formatINR(balance)} remaining`
  const statusColor = balance <= 0 ? '#16a34a' : '#f59e0b'

  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `Payment Received — ${formatINR(amountPaid)} for ${month} ${year}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <div style="border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #1e293b; font-size: 18px;">${instName}</h2>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Payment Receipt</p>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Dear <strong>${memberName}</strong>,
        </p>

        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
          We have received your <strong>${module}</strong> fee payment. Here are the details:
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 0 0 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Month</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${month} ${year}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Amount Received</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #16a34a;">${formatINR(amountPaid)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Payment Mode</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${mode.replace('_', ' ').toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Total Paid</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${formatINR(totalPaid)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Net Fee</td>
              <td style="padding: 6px 0; text-align: right; color: #1e293b;">${formatINR(netAmount)}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0 6px; color: #64748b; font-weight: 600;">Status</td>
              <td style="padding: 8px 0 6px; text-align: right; font-weight: 700; color: ${statusColor};">${status}</td>
            </tr>
          </table>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 24px;">
          Thank you for your timely payment.
        </p>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
            This is an automated receipt from ${instName}. Do not reply to this email.
          </p>
        </div>
      </div>
    `,
  })
}
