import { formatDate } from '@/lib/utils'

interface Reminder {
  id: string
  stage: number
  label: string
  scheduled_at: string
  sent_at: string | null
  status: string
}

interface Props {
  reminders: Reminder[]
  invoiceStatus: string
  sentAt: string | null
}

const STAGES = [
  { stage: 0, label: 'Invoice sent' },
  { stage: 1, label: 'Reminder 1' },
  { stage: 2, label: 'Reminder 2' },
  { stage: 3, label: 'Reminder 3' },
  { stage: 4, label: 'Final notice' },
]

export default function ReminderTimeline({ reminders, invoiceStatus, sentAt }: Props) {
  if (invoiceStatus === 'draft') {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-ink mb-3">Reminder timeline</h3>
        <p className="text-xs text-slate">Send the invoice to start the automated reminder sequence.</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-ink mb-4">Reminder timeline</h3>
      <div className="space-y-3">
        {STAGES.map(({ stage, label }) => {
          const reminder = reminders.find(r => r.stage === stage)
          const isSent = stage === 0 ? !!sentAt : reminder?.status === 'sent'
          const isCancelled = reminder?.status === 'cancelled'
          const isPending = reminder?.status === 'pending'
          const isFailed = reminder?.status === 'failed'
          const scheduledDate = stage === 0 ? sentAt : reminder?.scheduled_at
          const sentDate = stage === 0 ? sentAt : reminder?.sent_at

          let dotClass = 'bg-gray-100 text-gray-400'
          let labelClass = 'text-slate'
          let icon = '·'

          if (isSent) { dotClass = 'bg-success text-white'; labelClass = 'text-lead'; icon = '✓' }
          else if (isCancelled) { dotClass = 'bg-gray-100 text-gray-300'; labelClass = 'text-slate/50' }
          else if (isFailed) { dotClass = 'bg-danger-light text-danger'; icon = '!' }
          else if (isPending) { dotClass = 'bg-accent-light text-accent'; icon = '○' }

          return (
            <div key={stage} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${dotClass}`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${labelClass}`}>{label}</p>
                {sentDate && <p className="text-xs text-slate">{formatDate(sentDate)}</p>}
                {!sentDate && scheduledDate && isPending && (
                  <p className="text-xs text-slate">Scheduled {formatDate(scheduledDate)}</p>
                )}
                {isCancelled && <p className="text-xs text-slate/50">Cancelled</p>}
                {isFailed && <p className="text-xs text-danger">Failed to send</p>}
              </div>
            </div>
          )
        })}
      </div>
      {invoiceStatus === 'paid' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-success font-medium">✓ Paid — all pending reminders cancelled</p>
        </div>
      )}
    </div>
  )
}
