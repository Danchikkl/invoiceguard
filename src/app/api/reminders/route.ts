import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { sendReminderEmail } from '@/lib/email'

// This route is called by a cron job (Vercel Cron or external)
// Set up in vercel.json or call from an external scheduler every hour

export async function GET(req: NextRequest) {
  // Simple auth check — use a secret token
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET || 'dev-cron-secret'
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseAdmin()
  const now = new Date().toISOString()

  // Get pending reminders that are due
  const { data: due, error } = await admin
    .from('invoice_reminders')
    .select('id, user_id, invoice_id, stage, label, recipient_email')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(25)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: { id: string; ok: boolean; reason?: string }[] = []

  for (const job of (due || [])) {
    try {
      // Load invoice context
      const { data: inv } = await admin
        .from('invoices')
        .select('invoice_number, total, currency, due_date, status, paid_at, user_id, clients:client_id(client_name, client_email)')
        .eq('id', job.invoice_id)
        .maybeSingle()

      if (!inv) {
        await admin.from('invoice_reminders').update({ status: 'cancelled', error: 'Invoice not found' }).eq('id', job.id)
        results.push({ id: job.id, ok: false, reason: 'invoice_missing' })
        continue
      }

      // Skip if paid
      if ((inv as any).status === 'paid' || (inv as any).paid_at) {
        await admin.from('invoice_reminders').update({ status: 'cancelled' }).eq('id', job.id)
        results.push({ id: job.id, ok: false, reason: 'paid' })
        continue
      }

      const recipient = job.recipient_email || (inv as any).clients?.client_email
      if (!recipient) {
        await admin.from('invoice_reminders').update({ status: 'failed', error: 'No recipient email' }).eq('id', job.id)
        results.push({ id: job.id, ok: false, reason: 'no_recipient' })
        continue
      }

      // Load sender profile
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, email')
        .eq('id', job.user_id)
        .maybeSingle()

      const senderName = profile?.full_name || 'InvoiceGuard user'
      const senderEmail = profile?.email || ''

      await sendReminderEmail({
        to: recipient,
        senderName,
        senderEmail,
        invoiceNumber: (inv as any).invoice_number || job.invoice_id.slice(0, 8),
        total: Number((inv as any).total),
        currency: (inv as any).currency || 'USD',
        dueDate: (inv as any).due_date,
        stage: job.stage,
      })

      const sentAt = new Date().toISOString()
      await admin.from('invoice_reminders').update({ status: 'sent', sent_at: sentAt, recipient_email: recipient, error: null }).eq('id', job.id)
      await admin.from('invoices').update({ reminder_stage: job.stage }).eq('id', job.invoice_id)
      await admin.from('activity_logs').insert({
        user_id: job.user_id,
        invoice_id: job.invoice_id,
        action: `${job.label} sent`,
        type: 'reminder_sent',
        message: `${job.label} sent to ${recipient}`,
      })

      results.push({ id: job.id, ok: true })
    } catch (err: any) {
      await admin.from('invoice_reminders').update({ status: 'failed', error: err.message }).eq('id', job.id)
      results.push({ id: job.id, ok: false, reason: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
