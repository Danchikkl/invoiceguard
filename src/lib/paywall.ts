import { createSupabaseAdmin } from '@/lib/supabase/server'

export type PlanKey = 'free' | 'pro' | 'business'

export interface PaywallResult {
  allowed: boolean
  reason?: string
  upgrade?: PlanKey
  limit?: number
  used?: number
}

export const PLAN_LIMITS = {
  free:     { invoices: 3,    autoReminders: false, manualPaid: false, customBranding: false },
  pro:      { invoices: 9999, autoReminders: true,  manualPaid: true,  customBranding: false },
  business: { invoices: 9999, autoReminders: true,  manualPaid: true,  customBranding: true  },
} as const

export async function getUserPlan(userId: string): Promise<PlanKey> {
  const admin = createSupabaseAdmin()
  const { data } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .maybeSingle()
  return (data?.plan as PlanKey) || 'free'
}

export async function checkCanCreateInvoice(userId: string): Promise<PaywallResult> {
  const plan = await getUserPlan(userId)
  if (plan !== 'free') return { allowed: true }

  const admin = createSupabaseAdmin()
  const { count } = await admin
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const used = count || 0
  const limit = PLAN_LIMITS.free.invoices

  if (used >= limit) {
    return {
      allowed: false,
      reason: `Free plan allows up to ${limit} invoices total. You've used all ${limit}.`,
      upgrade: 'pro',
      limit,
      used,
    }
  }
  return { allowed: true, limit, used }
}

export async function checkCanSendReminders(userId: string): Promise<PaywallResult> {
  const plan = await getUserPlan(userId)
  if (PLAN_LIMITS[plan].autoReminders) return { allowed: true }
  return {
    allowed: false,
    reason: 'Automated follow-ups are available on Pro and Business plans.',
    upgrade: 'pro',
  }
}

export async function checkCanMarkPaid(userId: string): Promise<PaywallResult> {
  const plan = await getUserPlan(userId)
  if (PLAN_LIMITS[plan].manualPaid) return { allowed: true }
  return {
    allowed: false,
    reason: 'Manually marking invoices as paid requires Pro or Business.',
    upgrade: 'pro',
  }
}
