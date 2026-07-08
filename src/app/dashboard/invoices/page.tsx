import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatMoney, formatDate, getDisplayStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'

export default async function InvoicesPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('invoices')
    .select('id, invoice_number, issue_date, due_date, total, currency, status, reminder_stage, client:clients(client_name, client_email)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const invoices = (data || []) as any[]

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Invoices</h1>
          <p className="text-sm text-slate mt-0.5">{invoices.length} total</p>
        </div>
        <Link href="/dashboard/invoices/new" className="btn-primary">+ New invoice</Link>
      </div>

      <div className="card overflow-hidden">
        {invoices.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate mb-2">No invoices yet</p>
            <p className="text-xs text-slate mb-6">Create your first invoice and start getting paid</p>
            <Link href="/dashboard/invoices/new" className="btn-primary">Create invoice</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-mist/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Invoice #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Client</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Issued</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Due</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate">Amount</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-slate">Reminders</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => {
                const status = getDisplayStatus(inv.status, inv.due_date)
                return (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-mist/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium text-ink hover:text-accent">
                        {inv.invoice_number || '—'}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate">
                      <div>{inv.client?.client_name || '—'}</div>
                      {inv.client?.client_email && <div className="text-xs text-slate/70">{inv.client.client_email}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-slate">{formatDate(inv.issue_date)}</td>
                    <td className="px-5 py-3.5 text-slate">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold">{formatMoney(Number(inv.total), inv.currency)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {[1,2,3,4].map(s => (
                          <div key={s} className={`w-2 h-2 rounded-full ${s <= (inv.reminder_stage || 0) ? 'bg-ink' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
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
