import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { checkCanCreateInvoice } from '@/lib/paywall'
import PaywallBanner from '@/components/ui/PaywallBanner'
import NewInvoiceForm from '@/components/invoice/NewInvoiceForm'

export default async function NewInvoicePage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const check = await checkCanCreateInvoice(user.id)

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/dashboard/invoices" className="text-slate hover:text-ink text-sm">← Invoices</a>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-ink">New invoice</span>
      </div>

      {!check.allowed ? (
        <div className="space-y-4">
          <PaywallBanner
            reason={check.reason!}
            upgrade={check.upgrade!}
          />
          <div className="card p-6 opacity-40 pointer-events-none select-none">
            <p className="text-center text-slate text-sm py-8">
              Invoice form locked — upgrade to create more invoices
            </p>
          </div>
        </div>
      ) : (
        <>
          {check.limit && (
            <div className="mb-4 text-sm text-slate bg-mist rounded px-3 py-2">
              Free plan: {check.used}/{check.limit} invoices used
            </div>
          )}
          <NewInvoiceForm />
        </>
      )}
    </div>
  )
}
