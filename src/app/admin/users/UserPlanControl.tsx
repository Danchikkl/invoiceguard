'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLANS = [
  { key: 'free', label: 'Free', color: 'bg-gray-100 text-gray-600' },
  { key: 'pro', label: 'Pro', color: 'bg-blue-50 text-blue-700' },
  { key: 'business', label: 'Business', color: 'bg-amber-50 text-amber-700' },
]

export default function UserPlanControl({ userId, currentPlan }: { userId: string; currentPlan: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function changePlan(newPlan: string) {
    if (newPlan === currentPlan) { setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/set-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: newPlan }),
      })
      if (!res.ok) throw new Error('Failed')
      router.refresh()
    } catch {
      alert('Failed to update plan')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const current = PLANS.find(p => p.key === currentPlan) || PLANS[0]

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`text-xs font-medium px-2.5 py-1 rounded-full ${current.color} hover:opacity-80 transition-opacity disabled:opacity-50`}
      >
        {loading ? '...' : current.label} ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-paper border border-gray-200 rounded-lg shadow-elevated py-1 z-20 min-w-[120px]">
            {PLANS.map(p => (
              <button
                key={p.key}
                onClick={() => changePlan(p.key)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-mist transition-colors ${
                  p.key === currentPlan ? 'font-medium text-ink' : 'text-slate'
                }`}
              >
                {p.label} {p.key === currentPlan && '✓'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
