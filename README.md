# InvoiceGuard

Automated payment follow-ups for freelancers.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (auth + database)
- **Gmail SMTP** via Nodemailer (free, works for any recipient)
- **Vercel** (hosting + cron for reminders)

---

## Setup

### 1. Supabase

1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Settings → API → copy URL and anon key

### 2. Gmail App Password (free email)

1. Google Account → Security → 2-Step Verification → enable
2. Google Account → Security → App passwords → create
3. Copy the 16-character password

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=any-random-string
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Deploy to Vercel

1. Push to GitHub
2. vercel.com → New Project → Import repo
3. Add all env vars from above in Vercel dashboard
4. Deploy

Vercel cron (`vercel.json`) runs `/api/reminders` every hour automatically.
The cron route requires `Authorization: Bearer YOUR_CRON_SECRET` header.

---

## How reminders work

When an invoice is sent:
- +24h → Reminder 1 (friendly nudge)
- +48h → Reminder 2 (following up)
- +72h → Reminder 3 (firmer tone)
- +96h → Final notice

All reminders cancel immediately when invoice is marked paid.

---

## Supabase Auth setup

In Supabase dashboard:
- Authentication → URL Configuration
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`
