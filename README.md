# InvoiceGuard

Automated payment follow-ups for freelancers. Built with Next.js 14, Supabase, Gmail SMTP, and Vercel.

## What's included

- Landing page + Google-only auth (Supabase OAuth)
- Invoice CRUD (create, view, list) with clients auto-created
- Email sending via Gmail SMTP (free, works for any recipient)
- Automated 4-stage reminder sequence (+24h/+48h/+72h/+96h) via Vercel Cron
- Paywall: Free (3 invoices, no auto-reminders) / Pro $12 / Business $29
- Lemon Squeezy checkout + webhook (add keys when ready)
- Admin panel (`/admin`) — MRR, churn, user list, manual plan override

## Setup — step by step

### 1. Supabase

1. Create a project at supabase.com
2. SQL Editor → New query → paste all of `supabase/schema.sql` → Run
3. Authentication → Providers → Google → enable it (see step 3 below for credentials)
4. Authentication → URL Configuration:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`
5. Settings → API → copy `Project URL`, `anon public` key, `service_role` key

### 2. Gmail App Password (free email sending)

1. myaccount.google.com → Security → 2-Step Verification → enable
2. myaccount.google.com/apppasswords → create one named "InvoiceGuard"
3. Copy the 16-character password

### 3. Google OAuth (for "Sign in with Google")

1. console.cloud.google.com → Credentials → Create Credentials → OAuth Client ID
2. Application type: Web application
3. Authorized redirect URI: `https://YOUR-SUPABASE-PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID + Client Secret → paste into Supabase → Authentication → Providers → Google

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GMAIL_USER=
GMAIL_APP_PASSWORD=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=any-random-string
ADMIN_EMAIL=your@gmail.com
```

Lemon Squeezy variables can stay empty until you're ready to charge money.

### 5. Run locally

```bash
npm install
npm run dev
```

### 6. Deploy to Vercel

1. Push this folder to a GitHub repo
2. vercel.com → New Project → Import
3. Add every variable from `.env.local` in Vercel → Settings → Environment Variables
4. Deploy
5. Update `NEXT_PUBLIC_APP_URL` to your real Vercel URL, redeploy
6. Update Supabase Site URL / Redirect URLs to match your real Vercel URL

Vercel Cron (`vercel.json`) hits `/api/reminders` once a day (Hobby plan limit).
For more frequent reminders without upgrading Vercel, use cron-job.org pointed at:
`https://your-app.vercel.app/api/reminders` with header `Authorization: Bearer YOUR_CRON_SECRET`

## Admin panel

Visit `/admin` while logged in as `ADMIN_EMAIL`. You'll see:
- MRR, paying users, ARPU, churn rate
- Signups chart (7 days)
- Recent upgrades / cancellations
- `/admin/users` — click any user's plan badge to manually set Free/Pro/Business (useful for testing before Lemon Squeezy is live)

## Lemon Squeezy setup (when ready to charge)

1. lemonsqueezy.com → create store
2. Create two products: "Pro" ($12/mo) and "Business" ($29/mo) → copy each Variant ID
3. Settings → Webhooks → add `https://your-app.vercel.app/api/webhooks/lemonsqueezy`
   - Events: `order_created`, `subscription_cancelled`, `subscription_expired`
4. Fill in the `LEMON_SQUEEZY_*` and `NEXT_PUBLIC_LS_*` env vars in Vercel
5. Redeploy

## Notes

- RLS is disabled on all tables for simplicity — access control happens at the application layer (every query filters by `user_id`, admin routes check `ADMIN_EMAIL`).
- TypeScript strict mode is off to avoid build friction; tighten it later if you want.
