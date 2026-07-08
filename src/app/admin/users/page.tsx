import { requireAdmin } from '@/lib/admin'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import Link from 'next/link'
import UserPlanControl from './UserPlanControl'

export default async function AdminUsersPage() {
  await requireAdmin()
  const admin = createSupabaseAdmin()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name, plan, created_at')
    .order('created_at', { ascending: false })

  const { data: invoiceCounts } = await admin.from('invoices').select('user_id')
  const countMap: Record<string, number> = {}
  ;(invoiceCounts || []).forEach(inv => {
    countMap[inv.user_id] = (countMap[inv.user_id] || 0) + 1
  })

  const users = profiles || []

  return (
    <div className="min-h-screen bg-mist">
      <nav className="bg-ink text-paper h-14 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold">InvoiceGuard Admin</span>
          <div className="flex gap-3 text-sm">
            <Link href="/admin" className="text-gray-400 hover:text-paper">Overview</Link>
            <Link href="/admin/users" className="text-paper font-medium">Users</Link>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-paper">← Back to app</Link>
      </nav>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-ink">Users</h1>
          <p className="text-sm text-slate mt-0.5">{users.length} total</p>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-mist/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Invoices</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate">Plan</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="px-5 py-3 font-medium text-ink">{u.full_name || '—'}</td>
                  <td className="px-5 py-3 text-slate">{u.email}</td>
                  <td className="px-5 py-3 text-slate">{countMap[u.id] || 0}</td>
                  <td className="px-5 py-3 text-slate">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <UserPlanControl userId={u.id} currentPlan={u.plan || 'free'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
