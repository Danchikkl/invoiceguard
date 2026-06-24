'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatMoney } from '@/lib/utils'

interface LineItem { description: string; quantity: number; unit_price: number }

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const due = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [issueDate, setIssueDate] = useState(today)
  const [dueDate, setDueDate] = useState(due)
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }])

  function addItem() { setItems([...items, { description: '', quantity: 1, unit_price: 0 }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: keyof LineItem, val: string) {
    setItems(items.map((it, idx) => idx === i ? { ...it, [field]: field === 'description' ? val : Number(val) } : it))
  }

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0)
  const taxAmt = (subtotal * taxRate) / 100
  const total = subtotal + taxAmt

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim()) { setError('Client name is required'); return }
    if (items.every(it => !it.description.trim())) { setError('Add at least one line item'); return }
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert client
      let clientId: string | null = null
      if (clientEmail.trim()) {
        const { data: existing } = await supabase
          .from('clients').select('id')
          .eq('user_id', user.id).eq('client_email', clientEmail.trim().toLowerCase())
          .maybeSingle()
        if (existing) {
          clientId = existing.id
          await supabase.from('clients').update({ client_name: clientName, company_name: clientCompany || null }).eq('id', clientId)
        } else {
          const { data: created, error: ce } = await supabase.from('clients')
            .insert({ user_id: user.id, client_name: clientName, client_email: clientEmail.trim().toLowerCase(), company_name: clientCompany || null })
            .select('id').single()
          if (ce) throw ce
          clientId = created.id
        }
      }

      const { data: inv, error: ie } = await supabase.from('invoices')
        .insert({ user_id: user.id, client_id: clientId, issue_date: issueDate, due_date: dueDate, currency, subtotal, tax_rate: taxRate, total, notes: notes || null, status: 'draft' })
        .select('id').single()
      if (ie) throw ie

      if (items.filter(it => it.description.trim()).length > 0) {
        const rows = items.filter(it => it.description.trim()).map((it, idx) => ({
          invoice_id: inv.id, user_id: user.id, description: it.description,
          quantity: it.quantity, unit_price: it.unit_price, amount: it.quantity * it.unit_price, position: idx,
        }))
        const { error: itemErr } = await supabase.from('invoice_items').insert(rows)
        if (itemErr) throw itemErr
      }

      await supabase.from('activity_logs').insert({
        user_id: user.id, invoice_id: inv.id, client_id: clientId,
        action: 'Invoice created', type: 'invoice_created',
        message: `Invoice created for ${clientName}`,
      })

      router.push(`/dashboard/invoices/${inv.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice')
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/invoices" className="text-slate hover:text-ink transition-colors text-sm">← Invoices</Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-ink">New invoice</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-ink mb-4">Bill to</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Client name *</label>
              <input className="input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Studio" required />
            </div>
            <div>
              <label className="label">Client email</label>
              <input className="input" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="sam@acme.com" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Company (optional)</label>
              <input className="input" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Acme Inc." />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-ink mb-4">Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Issue date</label>
              <input className="input" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Due date</label>
              <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                {['USD','EUR','GBP','CAD','AUD','KZT'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tax %</label>
              <input className="input" type="number" min="0" max="100" step="0.1" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-ink mb-4">Line items</h2>
          <div className="space-y-2 mb-3">
            <div className="grid grid-cols-12 gap-2 text-xs text-slate px-1">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <input className="input" placeholder="Design services" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <input className="input text-right" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <input className="input text-right" type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                </div>
                <div className="col-span-1 text-right text-sm font-medium text-ink">
                  {formatMoney(item.quantity * item.unit_price, currency)}
                </div>
                <div className="col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-slate hover:text-danger text-lg leading-none">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="btn-ghost text-xs">+ Add line item</button>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 max-w-xs ml-auto text-sm">
            <div className="flex justify-between text-slate">
              <span>Subtotal</span><span>{formatMoney(subtotal, currency)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-slate">
                <span>Tax ({taxRate}%)</span><span>{formatMoney(taxAmt, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-ink pt-1 border-t border-gray-100">
              <span>Total</span><span>{formatMoney(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <label className="label">Notes (optional)</label>
          <textarea className="input h-20 resize-none" placeholder="Payment terms, thank-you note, anything else…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary px-6">
            {loading ? 'Saving…' : 'Save invoice'}
          </button>
          <Link href="/dashboard/invoices" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
