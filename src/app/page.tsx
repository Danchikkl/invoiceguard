import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <nav className="border-b border-gray-100 bg-paper/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-ink tracking-tight">InvoiceGuard</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-slate hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-primary text-sm px-4 py-1.5">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent mb-4 tracking-wide uppercase">
            Built by a freelancer who got tired of ghosting clients
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-ink leading-[1.1] mb-6">
            The hardest part of freelancing isn't the work.
            <span className="text-slate"> It's asking to get paid.</span>
          </h1>
          <p className="text-lg text-slate leading-relaxed mb-8">
            InvoiceGuard automatically follows up on unpaid invoices so you don't have to write awkward reminder emails. Send once, get paid faster.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/auth/signup" className="btn-primary px-6 py-2.5 text-base">
              Start for free →
            </Link>
            <span className="text-sm text-slate">No credit card required</span>
          </div>
        </div>
      </section>

      <section className="bg-mist border-y border-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm font-medium text-slate uppercase tracking-widest mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Create invoice', desc: 'Add your client, line items, and due date. Preview as PDF before sending.' },
              { step: '02', title: 'Send with one click', desc: "Invoice lands in your client's inbox with a clean summary." },
              { step: '03', title: 'Reminders run automatically', desc: 'If unpaid, we send friendly reminders at 24h, 48h, 72h, and final notice. Stops the moment they pay.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-paper rounded-lg p-6 border border-gray-100">
                <span className="text-xs font-mono text-slate mb-3 block">{step}</span>
                <h3 className="font-semibold text-ink mb-2">{title}</h3>
                <p className="text-sm text-slate leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink mb-4">
              Always know where you stand
            </h2>
            <p className="text-slate leading-relaxed mb-6">
              Every invoice shows a live reminder timeline so you can see exactly what's been sent and what's coming next.
            </p>
            <ul className="space-y-2">
              {['Stop writing awkward follow-up emails', 'Never lose track of who owes you money', 'Get paid faster with automated nudges'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-lead">
                  <span className="w-4 h-4 rounded-full bg-success-light text-success flex items-center justify-center text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-mist rounded-xl p-6 border border-gray-100">
            <p className="text-xs text-slate mb-4 font-medium">REMINDER TIMELINE · Invoice #2024-0012</p>
            {[
              { label: 'Invoice sent', sub: 'Day 0', done: true, active: false },
              { label: 'Friendly reminder', sub: 'Day 1 · polite tone', done: true, active: false },
              { label: 'Follow-up', sub: 'Day 2 · warmer nudge', done: false, active: true },
              { label: 'Urgent reminder', sub: 'Day 3 · firm tone', done: false, active: false },
              { label: 'Final notice', sub: 'Day 4 · last attempt', done: false, active: false },
            ].map(({ label, sub, done, active }) => (
              <div key={label} className="flex items-start gap-3 mb-4 last:mb-0">
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-0.5 ${
                  done ? 'bg-success text-white' : active ? 'bg-ink text-paper' : 'bg-gray-100 text-gray-400'
                }`}>
                  {done ? '✓' : '·'}
                </div>
                <div>
                  <p className={`text-sm font-medium ${active ? 'text-ink' : done ? 'text-lead' : 'text-slate'}`}>{label}</p>
                  <p className="text-xs text-slate">{sub}</p>
                  {active && <span className="inline-block mt-1 text-xs bg-ink text-paper px-2 py-0.5 rounded-full">Sending today</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-paper mb-3">Start getting paid on time</h2>
          <p className="text-gray-400 mb-6 text-sm">Free plan includes 3 invoices and automated reminders on Pro.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-paper text-ink font-medium px-6 py-2.5 rounded hover:bg-gray-100 transition-colors">
            Create free account →
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6">
        <p className="text-center text-xs text-slate">© 2024 InvoiceGuard · Built by a freelancer, for freelancers</p>
      </footer>
    </div>
  )
}
