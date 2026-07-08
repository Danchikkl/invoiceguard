import { requireAdmin } from '@/lib/admin'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  await requireAdmin()
  const admin = createSupabaseAdmin()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name, plan, created_at')
    .order('created_at', { ascending: false })

  const users = profiles || []
  const total = users.length
  const free = users.filter(u => u.plan === 'free' || !u.plan).length
  const pro = users.filter(u => u.plan === 'pro').length
  const business = users.filter(u => u.plan === 'business').length
  const paying = pro + business

  const mrr = pro * 12 + business * 29
  const arpu = paying > 0 ? Math.round((mrr / paying) * 100) / 100 : 0
  const conversionRate = total > 0 ? Math.round((paying / total) * 1000) / 10 : 0

  const { count: totalInvoices } = await admin.from('invoices').select('id', { count: 'exact', head: true })

  const { data: paidInvoices } = await admin.from('invoices').select('total').eq('status', 'paid')
  const totalCollected = (paidInvoices || []).reduce((s, i) => s + Number(i.total), 0)

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: cancellations } = await admin
    .from('activity_logs').select('id, user_id, message, created_at')
    .eq('type', 'plan_cancelled').gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })

  const { data: upgrades } = await admin
    .from('activity_logs').select('id, user_id, message, created_at, action')
    .eq('type', 'plan_upgraded').gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false }).limit(10)

  const churnRate = paying > 0 && cancellations
    ? Math.round((cancellations.length / (paying + cancellations.length)) * 1000) / 10
    : 0

  const signupsByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    signupsByDay[d.toISOString().split('T')[0]] = 0
  }
  users.forEach(u => {
    const day = u.created_at?.split('T')[0]
    if (day && signupsByDay[day] !== undefined) signupsByDay[day]++
  })

  return (
    <div className="min-h-screen bg-mist">
      <nav className="bg-ink text-paper h-14 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold">InvoiceGuard Admin</span>
          <div className="flex gap-3 text-sm">
            <Link href="/admin" className="text-paper font-medium">Overview</Link>
            <Link href="/admin/users" className="text-gray-400 hover:text-paper">Users</Link>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-paper">← Back to app</Link>
      </nav>

      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <MetricCard label="MRR" value={`$${mrr}`} accent="success" />
          <MetricCard label="Paying users" value={String(paying)} sub={`${conversionRate}% conversion`} />
          <MetricCard label="ARPU" value={`$${arpu}`} />
          <MetricCard label="Churn (30d)" value={`${churnRate}%`} accent={churnRate > 10 ? 'danger' : undefined} />
          <MetricCard label="Total users" value={String(total)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-xs text-slate mb-1">Free</p>
            <p className="text-2xl font-semibold text-ink">{free}</p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gray-400" style={{ width: `${total ? (free/total)*100 : 0}%` }} />
            </div>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate mb-1">Pro · $12/mo</p>
            <p className="text-2xl font-semibold text-blue-600">{pro}</p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${total ? (pro/total)*100 : 0}%` }} />
            </div>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate mb-1">Business · $29/mo</p>
            <p className="text-2xl font-semibold text-amber-600">{business}</p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${total ? (business/total)*100 : 0}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-xs text-slate mb-1">Total invoices created</p>
            <p className="text-2xl font-semibold text-ink">{totalInvoices || 0}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate mb-1">Total collected (paid invoices)</p>
            <p className="text-2xl font-semibold text-success">${totalCollected.toLocaleString()}</p>
          </div>
        </div>

        <div className="card p-5 mb-8">
          <p className="text-sm font-medium text-ink mb-4">Signups — last 7 days</p>
          <div className="flex items-end gap-2 h-24">
            {Object.entries(signupsByDay).map(([day, count]) => {
              const max = Math.max(...Object.values(signupsByDay), 1)
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-accent-light rounded-t flex items-end justify-center" style={{ height: '80px' }}>
                    <div className="w-full bg-accent rounded-t" style={{ height: `${(count/max)*100}%`, minHeight: count > 0 ? '4px' : '0' }} />
                  </div>
                  <span className="text-[10px] text-slate">{day.slice(5)}</span>
                  <span className="text-[10px] font-medium text-ink">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="text-sm font-medium text-ink mb-3">Recent upgrades</p>
            {(!upgrades || upgrades.length === 0) ? (
              <p className="text-xs text-slate">No upgrades yet</p>
            ) : (
              <div className="space-y-2">
                {upgrades.map(u => (
                  <div key={u.id} className="text-xs border-b border-gray-50 pb-2">
                    <p className="text-lead">{u.message}</p>
                    <p className="text-slate">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-ink mb-3">Cancellations (30d)</p>
            {(!cancellations || cancellations.length === 0) ? (
              <p className="text-xs text-success">No cancellations 🎉</p>
            ) : (
              <div className="space-y-2">
                {cancellations.map(c => (
                  <div key={c.id} className="text-xs border-b border-gray-50 pb-2">
                    <p className="text-danger">{c.message}</p>
                    <p className="text-slate">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'success' | 'danger' }) {
  const color = accent === 'success' ? 'text-success' : accent === 'danger' ? 'text-danger' : 'text-ink'
  return (
    <div className="card p-4">
      <p className="text-xs text-slate mb-1">{label}</p>
      <p className={`text-xl font-semibold tracking-tight ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate mt-0.5">{sub}</p>}
    </div>
  )
}
