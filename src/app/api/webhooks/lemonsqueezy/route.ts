import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature') || ''
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || ''

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(rawBody)
  const digest = hmac.digest('hex')
  if (digest !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload   = JSON.parse(rawBody)
  const eventName = payload.meta?.event_name
  const userId    = payload.meta?.custom_data?.user_id
  const variantId = String(payload.data?.attributes?.variant_id || '')

  if (!userId) return NextResponse.json({ ok: true })

  const admin = createSupabaseAdmin()

  const planMap: Record<string, string> = {
    [process.env.LEMON_SQUEEZY_VARIANT_PRO      || '']: 'pro',
    [process.env.LEMON_SQUEEZY_VARIANT_BUSINESS || '']: 'business',
  }
  const newPlan = planMap[variantId]

  if (eventName === 'order_created' && newPlan) {
    await admin.from('profiles').update({ plan: newPlan }).eq('id', userId)
    await admin.from('activity_logs').insert({
      user_id: userId, action: `Upgraded to ${newPlan}`,
      type: 'plan_upgraded', message: `Plan upgraded to ${newPlan}`,
    })
  }

  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    await admin.from('profiles').update({ plan: 'free' }).eq('id', userId)
    await admin.from('activity_logs').insert({
      user_id: userId, action: 'Plan cancelled',
      type: 'plan_cancelled', message: 'Subscription cancelled — moved to Free',
    })
  }

  return NextResponse.json({ ok: true })
}
