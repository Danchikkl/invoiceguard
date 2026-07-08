'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  invoiceId: string
  status: string
  clientEmail: string
  invoiceNumber: string
  userPlan: string
}

export default function InvoiceActions(props: Props) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [marking, setMarking] = useState(false)
  const [message, setMessage] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'ok' | 'warn'>('ok')
  const [paywallMsg, setPaywallMsg] = useState('')

  const isFree = props.userPlan === 'free'

  function showToast(msg: string, type: 'ok' | 'warn' = 'ok') {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 4000)
  }

  async function handleSend() {
    if (!props.clientEmail) { showToast('No client email on file.', 'warn'); return }
    setSending(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: props.invoiceId, message: message.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to send')

      if (json.upgradeMessage) {
        showToast(`Invoice sent! Note: ${json.upgradeMessage}`, 'warn')
      } else {
        showToast('Invoice sent! Reminder sequence scheduled. ✓')
      }
      setShowSendModal(false)
      router.refresh()
    } catch (err: any) {
      showToast('Error: ' + err.message, 'warn')
    } finally {
      setSending(false)
    }
  }

  async function handleMarkPaid() {
    if (isFree) {
      setPaywallMsg('Manually marking invoices as paid requires Pro or Business plan.')
      return
    }
    setMarking(true)
    try {
      const res = await fetch('/api/invoices/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: props.invoiceId, status: 'paid' }),
      })
      const json = await res.json()
      if (json.paywalled) { setPaywallMsg(json.error); return }
      if (!res.ok) throw new Error(json.error)
      showToast('Marked as paid. Reminders cancelled. ✓')
      router.refresh()
    } catch (err: any) {
      showToast('Error: ' + err.message, 'warn')
    } finally {
      setMarking(false)
    }
  }

  return (
    <>
      {paywallMsg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setPaywallMsg('')}>
          <div className="bg-paper rounded-xl shadow-elevated w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-3">🔒</div>
            <h2 className="font-semibold text-ink mb-2">Pro feature</h2>
            <p className="text-sm text-slate mb-4">{paywallMsg}</p>
            <div className="flex gap-3">
              <Link href="/dashboard/billing" className="btn-primary flex-1 justify-center">Upgrade to Pro · $12/mo</Link>
              <button onClick={() => setPaywallMsg('')} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {props.status !== 'paid' && (
          <>
            <button onClick={() => setShowSendModal(true)} disabled={sending} className="btn-primary text-sm">
              {props.status === 'draft' ? 'Send invoice' : 'Resend'}
            </button>
            <button onClick={handleMarkPaid} disabled={marking} className={`btn-secondary text-sm ${isFree ? 'opacity-60' : ''}`}>
              {isFree ? '🔒 Mark paid' : 'Mark paid'}
            </button>
          </>
        )}
        {props.status === 'paid' && <span className="text-sm text-success font-medium">✓ Paid</span>}
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowSendModal(false) }}>
          <div className="bg-paper rounded-xl shadow-elevated w-full max-w-md p-6">
            <h2 className="font-semibold text-ink mb-1">Send invoice</h2>
            <p className="text-sm text-slate mb-4">Sending to <strong>{props.clientEmail}</strong></p>
            <div className="mb-4">
              <label className="label">Personal message (optional)</label>
              <textarea className="input h-24 resize-none"
                placeholder={`Hi there, please find invoice ${props.invoiceNumber} attached…`}
                value={message} onChange={e => setMessage(e.target.value)} />
            </div>
            {isFree ? (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-700 mb-4">
                ⚠ Free plan: invoice will be sent but automated follow-ups won't be scheduled.{' '}
                <Link href="/dashboard/billing" className="font-medium underline">Upgrade to Pro</Link> to enable reminders.
              </div>
            ) : (
              <div className="bg-accent-light rounded p-3 text-xs text-accent mb-4">
                After sending, reminders will be scheduled at +24h, +48h, +72h, and +96h if unpaid.
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleSend} disabled={sending} className="btn-primary flex-1">
                {sending ? 'Sending…' : 'Send now'}
              </button>
              <button onClick={() => setShowSendModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 text-sm px-4 py-2.5 rounded-lg shadow-elevated z-50 max-w-xs ${
          toastType === 'warn' ? 'bg-amber-900 text-amber-50' : 'bg-ink text-paper'
        }`}>
          {toast}
        </div>
      )}
    </>
  )
}
