import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { checkCanMarkPaid } from '@/lib/paywall'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { invoiceId, status } = await req.json()
    if (!invoiceId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Paywall: только Pro/Business могут вручную менять статус на paid
    if (status === 'paid') {
      const check = await checkCanMarkPaid(user.id)
      if (!check.allowed) {
        return NextResponse.json({
          error: check.reason,
          upgrade: check.upgrade,
          paywalled: true,
        }, { status: 403 })
      }
    }

    const admin = createSupabaseAdmin()
    const patch: Record<string, unknown> = { status }
    if (status === 'paid') patch.paid_at = new Date().toISOString()
    if (status === 'viewed') patch.viewed_at = new Date().toISOString()

    const { error } = await admin.from('invoices').update(patch).eq('id', invoiceId).eq('user_id', user.id)
    if (error) throw error

    if (status === 'paid') {
      await admin.from('invoice_reminders').update({ status: 'cancelled' })
        .eq('invoice_id', invoiceId).eq('status', 'pending')
    }

    await admin.from('activity_logs').insert({
      user_id: user.id, invoice_id: invoiceId,
      action: `Status: ${status}`,
      type: status === 'paid' ? 'payment_received' : 'status_update',
      message: status === 'paid' ? 'Marked as paid. Reminders cancelled.' : `Marked as ${status}`,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
