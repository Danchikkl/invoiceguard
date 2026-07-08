'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('full_name, company_name').eq('id', user.id).maybeSingle()
      if (data) { setName(data.full_name || ''); setCompany(data.company_name || '') }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ full_name: name, company_name: company }).eq('id', user.id)
    setMsg('Saved!')
    setSaving(false)
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-xl font-semibold text-ink mb-6">Settings</h1>
      <div className="card p-6">
        <h2 className="text-sm font-medium text-ink mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Johnson" />
          </div>
          <div>
            <label className="label">Company (optional)</label>
            <input className="input" value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-mist" value={email} disabled />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save changes'}</button>
            {msg && <span className="text-sm text-success">{msg}</span>}
          </div>
        </form>
      </div>

      <div className="card p-6 mt-4">
        <h2 className="text-sm font-medium text-ink mb-2">Automated reminders</h2>
        <p className="text-sm text-slate mb-3">Available on Pro and Business plans. Runs automatically after you send an invoice.</p>
        <div className="space-y-2 text-sm text-slate">
          {[
            { offset: '+24h', label: 'Reminder 1 — friendly nudge' },
            { offset: '+48h', label: 'Reminder 2 — following up' },
            { offset: '+72h', label: 'Reminder 3 — firmer tone' },
            { offset: '+96h', label: 'Final notice — last attempt' },
          ].map(r => (
            <div key={r.offset} className="flex items-center gap-3">
              <span className="font-mono text-xs bg-mist px-2 py-0.5 rounded text-lead w-14 text-center">{r.offset}</span>
              <span>{r.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate mt-3">All reminders stop immediately when invoice is marked paid.</p>
      </div>
    </div>
  )
}
