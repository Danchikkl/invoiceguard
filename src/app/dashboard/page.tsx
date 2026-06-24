import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatMoney, formatDate, getDisplayStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, due_date, total, currency, status, client:clients(client_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const rows = (invoices || []) as any[]
  const total = rows.reduce((s, r) => s + Number(r.total), 0)
  const paid = rows.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.total), 0)
  const outstanding = rows.filter(r => r.status !== 'paid' && r.status !== 'draft')
    .reduce((s, r) => s + Number(r.total), 0)
  const overdue = rows.filter(r => getDisplayStatus(r.status, r.due_date) === 'overdue').length

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-ink">Overview</h1>
          <p className="text-sm text-slate mt-0.5">Your invoicing at a glance</p>
        </div>
        <Link href="/dashboard/invoices/new" className="btn-primary">
          + New invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total invoiced', value: formatMoney(total), sub: `${rows.length} invoices` },
          { label: 'Collected', value: formatMoney(paid), sub: 'paid invoices', color: 'text-success' },
          { label: 'Outstanding', value: formatMoney(outstanding), sub: 'awaiting payment' },
          { label: 'Overdue', value: String(overdue), sub: overdue === 1 ? 'invoice' : 'invoices', color: overdue > 0 ? 'text-danger' : '' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate mb-1">{label}</p>
            <p className={`text-xl font-semibold tracking-tight ${color || 'text-ink'}`}>{value}</p>
            <p className="text-xs text-slate mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Recent invoices</h2>
          <Link href="/dashboard/invoices" className="text-xs text-accent hover:underline">View all</Link>
        </div>
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate mb-4">No invoices yet</p>
            <Link href="/dashboard/invoices/new" className="btn-primary text-sm">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate">Invoice</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate">Client</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate">Due</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-slate">Amount</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-slate">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((inv: any) => {
                const status = getDisplayStatus(inv.status, inv.due_date)
                return (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-mist/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium text-ink hover:text-accent">
                        {inv.invoice_number || '—'}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate">{inv.client?.client_name || '—'}</td>
                    <td className="px-5 py-3 text-slate">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatMoney(Number(inv.total), inv.currency)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`badge ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
