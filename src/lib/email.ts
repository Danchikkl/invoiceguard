import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatMoneyForEmail(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function buildEmailHtml(opts: {
  intro: string
  total: number
  currency: string
  dueDate: string
  senderName: string
  footer?: string
}) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EFE9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0D0D0D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FAFAF8;border:1px solid #E5E4DC;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0D0D0D;padding:20px 32px;">
          <span style="color:#FAFAF8;font-size:16px;font-weight:600;letter-spacing:-0.02em;">InvoiceGuard</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(opts.intro)}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E4DC;border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#F0EFE9;">
              <td style="padding:12px 16px;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;">Amount due</td>
              <td align="right" style="padding:12px 16px;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;">Due date</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:24px;font-weight:700;letter-spacing:-0.02em;">${formatMoneyForEmail(opts.total, opts.currency)}</td>
              <td align="right" style="padding:12px 16px;font-size:14px;color:#374151;">${escapeHtml(opts.dueDate)}</td>
            </tr>
          </table>
          <p style="margin:0;font-size:13px;color:#0D0D0D;">— ${escapeHtml(opts.senderName)}</p>
        </td></tr>
        ${opts.footer ? `<tr><td style="padding:16px 32px;border-top:1px solid #E5E4DC;font-size:11px;color:#9CA3AF;">${opts.footer}</td></tr>` : ''}
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export interface SendInvoiceEmailOptions {
  to: string
  senderName: string
  senderEmail: string
  invoiceNumber: string
  total: number
  currency: string
  dueDate: string
  message?: string
}

export async function sendInvoiceEmail(opts: SendInvoiceEmailOptions) {
  const transporter = createTransporter()
  const intro = opts.message?.trim() ||
    `Hi there, please find invoice ${opts.invoiceNumber} attached. Let me know if you have any questions.`

  const html = buildEmailHtml({
    intro,
    total: opts.total,
    currency: opts.currency,
    dueDate: opts.dueDate,
    senderName: opts.senderName,
    footer: 'Sent via InvoiceGuard',
  })

  await transporter.sendMail({
    from: `"${opts.senderName}" <${process.env.GMAIL_USER}>`,
    replyTo: opts.senderEmail,
    to: opts.to,
    subject: `Invoice ${opts.invoiceNumber} from ${opts.senderName}`,
    html,
  })
}

export interface SendReminderEmailOptions {
  to: string
  senderName: string
  senderEmail: string
  invoiceNumber: string
  total: number
  currency: string
  dueDate: string
  stage: number
}

export async function sendReminderEmail(opts: SendReminderEmailOptions) {
  const transporter = createTransporter()
  const firstName = opts.to.split('@')[0]
  const amount = formatMoneyForEmail(opts.total, opts.currency)

  const copies: Record<number, { subject: string; intro: string }> = {
    1: {
      subject: `Friendly reminder: invoice ${opts.invoiceNumber}`,
      intro: `Hi ${firstName}, just a gentle nudge — invoice ${opts.invoiceNumber} for ${amount} was due on ${opts.dueDate}. No rush if it slipped through, just wanted to make sure it didn't get lost.`,
    },
    2: {
      subject: `Following up: invoice ${opts.invoiceNumber}`,
      intro: `Hi ${firstName}, following up on invoice ${opts.invoiceNumber} for ${amount}. Could you let me know the timing for payment?`,
    },
    3: {
      subject: `Third reminder: invoice ${opts.invoiceNumber}`,
      intro: `Hi ${firstName}, I haven't been able to confirm payment on invoice ${opts.invoiceNumber} for ${amount}. Please let me know if anything is holding things up.`,
    },
    4: {
      subject: `Final notice: invoice ${opts.invoiceNumber}`,
      intro: `Hi ${firstName}, this is the final notice on invoice ${opts.invoiceNumber} for ${amount}. Please settle this within 7 days.`,
    },
  }

  const copy = copies[opts.stage] || copies[4]
  const html = buildEmailHtml({
    intro: copy.intro,
    total: opts.total,
    currency: opts.currency,
    dueDate: opts.dueDate,
    senderName: opts.senderName,
  })

  await transporter.sendMail({
    from: `"${opts.senderName}" <${process.env.GMAIL_USER}>`,
    replyTo: opts.senderEmail,
    to: opts.to,
    subject: copy.subject,
    html,
  })
}
