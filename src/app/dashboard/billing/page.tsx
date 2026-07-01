'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    desc: 'For getting started',
    features: [
      { text: 'Up to 3 invoices (lifetime)', ok: true },
      { text: 'PDF generation', ok: true },
      { text: 'Manual sending', ok: true },
      { text: 'Automated follow-ups', ok: false },
      { text: 'Mark as paid button', ok: false },
      { text: 'Custom branding', ok: false },
    ],
    cta: null,
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 12,
    desc: 'For active freelancers',
    envVar: 'NEXT_PUBLIC_LS_VARIANT_PRO',
    features: [
      { text: 'Unlimited invoices', ok: true },
      { text: 'PDF generation', ok: true },
      { text: 'Automated follow-ups (24h/48h/72h)', ok: true },
      { text: 'Reminder timeline', ok: true },
      { text: 'Mark as paid / unpaid', ok: true },
      { text: 'Custom branding', ok: false },
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    key: 'business',
    name: 'Business',
    price: 29,
    desc: 'For agencies & professionals',
    envVar: 'NEXT_PUBLIC_LS_VARIANT_BUSINESS',
    features: [
      { text: 'Everything in Pro', ok: true },
      { text: 'Remove InvoiceGuard branding', ok: true },
      { text: 'Your own email domain (SMTP)', ok: true },
      { text: 'Custom logo on PDF', ok: true },
      { text: 'Custom company name in emails', ok: true },
      { text: 'Priority support', ok: true },
    ],
    cta: 'Upgrade to Business',
    highlight: false,
  },
]

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [loading, setLoading] = useState<string | null>(null)
  const [variants, setVariants] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle()
      if (data?.plan) setCurrentPlan(data.plan)

      // Load variant IDs from env
      setVariants({
        pro:      process.env.NEXT_PUBLIC_LS_VARIANT_PRO || '',
        business: process.env.NEXT_PUBLIC_LS_VARIANT_BUSINESS || '',
      })
    }
    load()
  }, [])

  async function handleUpgrade(planKey: string) {
    const variantId = variants[planKey]
    if (!variantId) {
      alert('Payment not configured yet. Contact support.')
      return
    }
    setLoading(planKey)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      })
      const { checkoutUrl, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = checkoutUrl
    } catch (err: any) {
      alert(err.message || 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Billing & Plans</h1>
        <p className="text-sm text-slate mt-0.5">
          Current plan:{' '}
          <span className="font-medium text-ink capitalize">{currentPlan}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.key
          const isDowngrade = PLANS.findIndex(p => p.key === plan.key) <
            PLANS.findIndex(p => p.key === currentPlan)

          return (
            <div
              key={plan.key}
              className={`rounded-xl p-5 border-2 transition-all ${
                isCurrent
                  ? 'border-ink'
                  : plan.highlight
                  ? 'border-accent bg-accent-light/30'
                  : 'border-gray-100 bg-paper'
              }`}
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-ink">{plan.name}</h2>
                  {isCurrent && (
                    <span className="text-xs bg-ink text-paper px-2 py-0.5 rounded-full">Current</span>
                  )}
                  {plan.highlight && !isCurrent && (
                    <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">Popular</span>
                  )}
                </div>
                <p className="text-xs text-slate">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-5">
                <span className="text-3xl font-bold text-ink tracking-tight">${plan.price}</span>
                {plan.price > 0 && <span className="text-sm text-slate ml-1">/month</span>}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-5">
                {plan.features.map(f => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    <span className={`flex-shrink-0 mt-0.5 text-xs w-4 h-4 rounded-full flex items-center justify-center ${
                      f.ok ? 'bg-success-light text-success' : 'bg-gray-100 text-gray-300'
                    }`}>
                      {f.ok ? '✓' : '×'}
                    </span>
                    <span className={f.ok ? 'text-lead' : 'text-slate/50'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="text-center text-sm text-slate py-2">✓ Active plan</div>
              ) : isDowngrade ? (
                <div className="text-center text-xs text-slate py-2">
                  Contact support to downgrade
                </div>
              ) : plan.cta ? (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading === plan.key}
                  className={`w-full py-2.5 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                    plan.highlight
                      ? 'bg-accent text-white hover:bg-blue-700'
                      : 'bg-ink text-paper hover:bg-lead'
                  }`}
                >
                  {loading === plan.key ? 'Loading…' : plan.cta}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center text-xs text-slate">
        Payments processed securely by Lemon Squeezy · Cancel anytime · No hidden fees
      </div>
    </div>
  )
}
