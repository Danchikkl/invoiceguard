import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const adminEmail = process.env.ADMIN_EMAIL
    if (!user || !adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, plan } = await req.json()
    if (!userId || !['free', 'pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()
    const { error } = await admin.from('profiles').update({ plan }).eq('id', userId)
    if (error) throw error

    await admin.from('activity_logs').insert({
      user_id: userId,
      action: `Plan set to ${plan} by admin`,
      type: 'plan_upgraded',
      message: `Admin manually set plan to ${plan}`,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
