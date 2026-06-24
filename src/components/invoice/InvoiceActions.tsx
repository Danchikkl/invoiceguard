'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  invoiceId: string
  status: string
  clientEmail: string
  senderName: string
  senderEmail: string
  invoiceNumber: string
  total: number
  currency: string
  dueDate: string
}

export default function InvoiceActions(props: Props) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [marking, setMarking] = useState(false)
  const [message, setMessage] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleSend() {
    if (!props.clientEmail) {
      showToast('No client email on file. Edit the invoice to add one.')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: props.invoiceId,
          message: message.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to send')
      showToast('Invoice sent! Reminder sequence scheduled.')
      setShowSendModal(false)
      router.refresh()
    } catch (err: any) {
      showToast('Error: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function markAs(status: string) {
    setMarking(true)
    try {
      const res = await fetch('/api/invoices/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: props.invoiceId, status }),
      })
      if (!res.ok) throw new Error('Failed')
      showToast(status === 'paid' ? 'Marked as paid. Reminders cancelled.' : `Marked as ${status}.`)
      router.refresh()
    } catch {
      showToast('Something went wrong.')
    } finally {
      setMarking(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {props.status !== 'paid' && (
          <>
            <button
              onClick={() => setShowSendModal(true)}
              className="btn-primary text-sm"
              disabled={sending}
            >
              {props.status === 'draft' ? 'Send invoice' : 'Resend'}
            </button>
            <button
              onClick={() => markAs('paid')}
              disabled={marking}
              className="btn-secondary text-sm"
            >
              Mark paid
            </button>
          </>
        )}
        {props.status === 'paid' && (
          <button onClick={() => markAs('sent')} disabled={marking} className="btn-ghost text-sm">
            Undo paid
          </button>
        )}
      </div>

      {/* Send modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowSendModal(false) }}>
          <div className="bg-paper rounded-xl shadow-elevated w-full max-w-md p-6">
            <h2 className="font-semibold text-ink mb-1">Send invoice</h2>
            <p className="text-sm text-slate mb-4">
              Sending to <strong>{props.clientEmail}</strong>
            </p>
            <div className="mb-4">
              <label className="label">Personal message (optional)</label>
              <textarea
                className="input h-24 resize-none"
                placeholder={`Hi there, please find invoice ${props.invoiceNumber} attached…`}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <div className="bg-accent-light rounded p-3 text-xs text-accent mb-4">
              After sending, reminders will be automatically scheduled at 24h, 48h, 72h, and 96h if unpaid.
            </div>
            <div className="flex gap-3">
              <button onClick={handleSend} disabled={sending} className="btn-primary flex-1">
                {sending ? 'Sending…' : 'Send now'}
              </button>
              <button onClick={() => setShowSendModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-ink text-paper text-sm px-4 py-2.5 rounded-lg shadow-elevated z-50 max-w-xs">
          {toast}
        </div>
      )}
    </>
  )
}
