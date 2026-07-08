import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function ClientsPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('clients')
    .select('id, client_name, client_email, company_name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const clients = data || []

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Clients</h1>
          <p className="text-sm text-slate mt-0.5">{clients.length} total</p>
        </div>
        <Link href="/dashboard/invoices/new" className="btn-primary">+ New invoice</Link>
      </div>

      <div className="card overflow-hidden">
        {clients.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate mb-2">No clients yet</p>
            <p className="text-xs text-slate mb-6">Clients are created automatically when you create an invoice</p>
            <Link href="/dashboard/invoices/new" className="btn-primary">Create invoice</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-mist/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Company</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Added</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-mist/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-ink">{c.client_name}</td>
                  <td className="px-5 py-3.5 text-slate">{c.client_email || '—'}</td>
                  <td className="px-5 py-3.5 text-slate">{c.company_name || '—'}</td>
                  <td className="px-5 py-3.5 text-slate">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
