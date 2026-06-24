'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  user: { email: string; name: string; plan: string }
  children: React.ReactNode
}

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '▦' },
  { href: '/dashboard/invoices', label: 'Invoices', icon: '◻' },
  { href: '/dashboard/clients', label: 'Clients', icon: '◯' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⊙' },
]

export default function DashboardShell({ user, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex bg-mist">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-paper border-r border-gray-100 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <Link href="/dashboard" className="font-semibold text-ink tracking-tight text-sm">
            InvoiceGuard
          </Link>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV.map(({ href, label, icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href} href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors',
                  active ? 'bg-ink text-paper' : 'text-slate hover:text-ink hover:bg-mist'
                )}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-ink truncate">{user.name || user.email}</p>
            <p className="text-xs text-slate capitalize">{user.plan} plan</p>
          </div>
          <button onClick={signOut} className="w-full text-left px-3 py-1.5 text-xs text-slate hover:text-ink transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
