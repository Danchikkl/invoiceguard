import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function getDisplayStatus(status: string, dueDate: string): string {
  if (status === 'paid') return 'paid'
  const isOverdue = status !== 'draft' && new Date(dueDate) < new Date()
  if (isOverdue) return 'overdue'
  return status
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  paid: 'Paid',
  overdue: 'Overdue',
}

export const STATUS_COLORS: Record<string, string> = {
  draft:   'bg-gray-100 text-gray-600',
  sent:    'bg-blue-50 text-blue-700',
  viewed:  'bg-indigo-50 text-indigo-700',
  paid:    'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
}
