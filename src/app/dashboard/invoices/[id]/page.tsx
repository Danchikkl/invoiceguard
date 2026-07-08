import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatMoney, formatDate, getDisplayStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import InvoiceActions from '@/components/invoice/InvoiceActions'
import ReminderTimeline from '@/components/invoice/ReminderTimeline'

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: inv } = await supabase
    .from('invoices')
    .select('*, client:clients(id, client_name, client_email, company_name), invoice_items(id, description, quantity, unit_price, amount, position)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!inv) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, plan')
    .eq('id', user.id)
    .maybeSingle()

  const { data: reminders } = await supabase
    .from('invoice_reminders')
    .select('*')
    .eq('invoice_id', params.id)
    .order('stage')

  const items = [...((inv as any).invoice_items || [])].sort((a: any, b: any) => a.position - b.position)
  const status = getDisplayStatus((inv as any).status, (inv as any).due_date)

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/invoices" className="text-slate hover:text-ink transition-colors text-sm">← Invoices</Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-ink">{(inv as any).invoice_number}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{(inv as any).invoice_number}</h1>
          <p className="text-sm text-slate mt-1">
            {(inv as any).client?.client_name || '—'} · Due {formatDate((inv as any).due_date)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${STATUS_COLORS[status]} text-sm px-3 py-1`}>{STATUS_LABELS[status]}</span>
          <InvoiceActions
            invoiceId={params.id}
            status={(inv as any).status}
            clientEmail={(inv as any).client?.client_email || ''}
            invoiceNumber={(inv as any).invoice_number || ''}
            userPlan={profile?.plan || 'free'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div className="card p-5 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate mb-1 uppercase tracking-wider">From</p>
              <p className="text-sm font-medium text-ink">{profile?.full_name || user.email}</p>
              <p className="text-sm text-slate">{profile?.email || user.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate mb-1 uppercase tracking-wider">Bill to</p>
              <p className="text-sm font-medium text-ink">{(inv as any).client?.client_name || '—'}</p>
              {(inv as any).client?.client_email && <p className="text-sm text-slate">{(inv as any).client.client_email}</p>}
              {(inv as any).client?.company_name && <p className="text-sm text-slate">{(inv as any).client.company_name}</p>}
            </div>
          </div>

          <div className="card p-5 grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-xs text-slate mb-1">Issued</p><p className="font-medium">{formatDate((inv as any).issue_date)}</p></div>
            <div><p className="text-xs text-slate mb-1">Due</p><p className="font-medium">{formatDate((inv as any).due_date)}</p></div>
            <div><p className="text-xs text-slate mb-1">Currency</p><p className="font-medium">{(inv as any).currency}</p></div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-mist/50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate">Description</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate">Qty</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate">Price</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-slate">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: any) => (
                  <tr key={it.id} className="border-b border-gray-50">
                    <td className="px-5 py-3">{it.description}</td>
                    <td className="px-4 py-3 text-right text-slate">{it.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate">{formatMoney(it.unit_price, (inv as any).currency)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatMoney(it.amount, (inv as any).currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 border-t border-gray-100 space-y-1.5 max-w-xs ml-auto text-sm">
              <div className="flex justify-between text-slate">
                <span>Subtotal</span><span>{formatMoney(Number((inv as any).subtotal), (inv as any).currency)}</span>
              </div>
              {Number((inv as any).tax_rate) > 0 && (
                <div className="flex justify-between text-slate">
                  <span>Tax ({(inv as any).tax_rate}%)</span>
                  <span>{formatMoney(Number((inv as any).total) - Number((inv as any).subtotal), (inv as any).currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-ink pt-1 border-t border-gray-100 text-base">
                <span>Total</span><span>{formatMoney(Number((inv as any).total), (inv as any).currency)}</span>
              </div>
            </div>
          </div>

          {(inv as any).notes && (
            <div className="card p-5">
              <p className="text-xs text-slate mb-2">Notes</p>
              <p className="text-sm text-lead">{(inv as any).notes}</p>
            </div>
          )}
        </div>

        <div>
          <ReminderTimeline reminders={reminders || []} invoiceStatus={(inv as any).status} sentAt={(inv as any).sent_at} />
        </div>
      </div>
    </div>
  )
}
