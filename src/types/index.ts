export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  company_name: string | null
  plan: string
}

export interface Client {
  id: string
  user_id: string
  client_name: string
  client_email: string | null
  company_name: string | null
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  position: number
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string | null
  invoice_number: string | null
  issue_date: string
  due_date: string
  currency: string
  subtotal: number
  tax_rate: number
  total: number
  notes: string | null
  status: InvoiceStatus
  reminder_stage: number
  sent_at: string | null
  viewed_at: string | null
  paid_at: string | null
  created_at: string
  client?: Client | null
  items?: InvoiceItem[]
}

export interface CreateInvoiceInput {
  client: { name: string; email: string; company?: string }
  issueDate: string
  dueDate: string
  currency: string
  taxRate: number
  notes?: string
  items: { description: string; quantity: number; unit_price: number }[]
}

export interface ActivityLog {
  id: string
  invoice_id: string | null
  action: string
  type: string
  message: string | null
  created_at: string
}
