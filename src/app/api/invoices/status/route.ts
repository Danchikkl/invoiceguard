import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { invoiceId, status } = await req.json()
    if (!invoiceId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const admin = createSupabaseAdmin()
    const patch: Record<string, unknown> = { status }
    if (status === 'paid') patch.paid_at = new Date().toISOString()
    if (status === 'viewed') patch.viewed_at = new Date().toISOString()

    const { error } = await admin.from('invoices').update(patch).eq('id', invoiceId).eq('user_id', user.id)
    if (error) throw error

    // Cancel pending reminders when paid
    if (status === 'paid') {
      await admin.from('invoice_reminders')
        .update({ status: 'cancelled' })
        .eq('invoice_id', invoiceId)
        .eq('status', 'pending')
    }

    await admin.from('activity_logs').insert({
      user_id: user.id,
      invoice_id: invoiceId,
      action: `Status: ${status}`,
      type: status === 'paid' ? 'payment_received' : 'status_update',
      message: status === 'paid' ? 'Marked as paid. Reminders cancelled.' : `Marked as ${status}`,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
