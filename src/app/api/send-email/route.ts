import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { sendInvoiceEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { invoiceId, message } = await req.json()
    if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })

    const admin = createSupabaseAdmin()

    // Load invoice
    const { data: inv, error: invErr } = await admin
      .from('invoices')
      .select('*, client:clients(client_name, client_email), invoice_items(description, quantity, unit_price, amount, position)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (invErr || !inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const clientEmail = (inv as any).client?.client_email
    if (!clientEmail) return NextResponse.json({ error: 'Client has no email address' }, { status: 400 })

    // Load sender profile
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle()

    const senderName = profile?.full_name || user.email?.split('@')[0] || 'InvoiceGuard user'
    const senderEmail = profile?.email || user.email || ''

    await sendInvoiceEmail({
      to: clientEmail,
      senderName,
      senderEmail,
      invoiceNumber: (inv as any).invoice_number || invoiceId.slice(0, 8),
      total: Number((inv as any).total),
      currency: (inv as any).currency || 'USD',
      dueDate: (inv as any).due_date,
      message,
    })

    const nowIso = new Date().toISOString()

    // Update invoice status
    await admin.from('invoices').update({ status: 'sent', sent_at: nowIso }).eq('id', invoiceId)

    // Schedule reminders: +24h, +48h, +72h, +96h
    const stages = [
      { stage: 1, label: 'Reminder 1', offset: 24 },
      { stage: 2, label: 'Reminder 2', offset: 48 },
      { stage: 3, label: 'Reminder 3', offset: 72 },
      { stage: 4, label: 'Final Notice', offset: 96 },
    ]
    const reminderRows = stages.map(s => ({
      user_id: user.id,
      invoice_id: invoiceId,
      stage: s.stage,
      label: s.label,
      scheduled_at: new Date(Date.now() + s.offset * 3600000).toISOString(),
      status: 'pending',
      recipient_email: clientEmail,
    }))
    await admin.from('invoice_reminders')
      .upsert(reminderRows, { onConflict: 'invoice_id,stage', ignoreDuplicates: true })

    // Activity log
    await admin.from('activity_logs').insert({
      user_id: user.id,
      invoice_id: invoiceId,
      action: 'Invoice sent',
      type: 'invoice_sent',
      message: `Invoice emailed to ${clientEmail}. Reminder sequence scheduled.`,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[send-email]', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
