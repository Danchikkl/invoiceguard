'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-mist flex items-center justify-center p-4">
      <div className="card p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center text-success text-xl mx-auto mb-4">✓</div>
        <h2 className="font-semibold text-ink mb-2">Check your email</h2>
        <p className="text-sm text-slate">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        <Link href="/auth/login" className="btn-secondary w-full mt-4 justify-center">Back to sign in</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold text-ink tracking-tight">InvoiceGuard</Link>
          <p className="text-sm text-slate mt-1">Create your free account</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Alex Johnson" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="At least 6 characters" />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2">
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
        <p className="text-center text-xs text-slate mt-4">Free plan: 3 invoices · No credit card needed</p>
      </div>
    </div>
  )
}
