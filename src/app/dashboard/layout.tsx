import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/dashboard/Shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, plan')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL

  return (
    <DashboardShell
      user={{
        email: user.email || '',
        name: profile?.full_name || '',
        plan: profile?.plan || 'free',
        isAdmin,
      }}
    >
      {children}
    </DashboardShell>
  )
}
