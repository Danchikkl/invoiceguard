import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { variantId } = await req.json()
    if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 })

    const apiKey  = process.env.LEMON_SQUEEZY_API_KEY
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID
    if (!apiKey || !storeId) {
      return NextResponse.json({ error: 'Payment not configured yet' }, { status: 500 })
    }

    const admin = createSupabaseAdmin()
    const { data: profile } = await admin.from('profiles').select('email, full_name').eq('id', user.id).maybeSingle()

    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              name: profile?.full_name || '',
              custom: { user_id: user.id },
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
            },
          },
          relationships: {
            store:   { data: { type: 'stores',   id: storeId   } },
            variant: { data: { type: 'variants',  id: variantId } },
          },
        },
      }),
    })

    const json = await res.json()
    const checkoutUrl = json?.data?.attributes?.url
    if (!checkoutUrl) throw new Error('Failed to create checkout session')

    return NextResponse.json({ checkoutUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
