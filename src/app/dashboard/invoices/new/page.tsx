import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
        <Link href="/dashboard/invoices" className="text-slate hover:text-ink text-sm">← Invoices</Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-ink">New invoice</span>
      </div>

      {!check.allowed ? (
     <PaywallBanner 
  reason={check.reason!} 
  upgrade={check.upgrade === "business" ? "business" : "pro"} 
/>
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
