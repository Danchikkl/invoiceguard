'use client'
import Link from 'next/link'

interface Props {
  reason: string
  upgrade: 'pro' | 'business'
  compact?: boolean
}

const INFO = {
  pro:      { name: 'Pro',      price: '$12/mo' },
  business: { name: 'Business', price: '$29/mo' },
}

export default function PaywallBanner({ reason, upgrade, compact }: Props) {
  const info = INFO[upgrade]

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
        <span>🔒</span>
        <span className="flex-1">{reason}</span>
        <Link href="/dashboard/billing" className="font-medium text-amber-900 hover:underline whitespace-nowrap">
          Upgrade →
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔒</span>
        <div className="flex-1">
          <p className="font-semibold text-amber-900 mb-1">
            {info.name} feature
          </p>
          <p className="text-sm text-amber-700 mb-4">{reason}</p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 bg-amber-900 text-amber-50 text-sm font-medium px-4 py-2 rounded hover:bg-amber-800 transition-colors"
          >
            Upgrade to {info.name} · {info.price} →
          </Link>
        </div>
      </div>
    </div>
  )
}
