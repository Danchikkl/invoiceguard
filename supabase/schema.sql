-- InvoiceGuard — полная схема БД
-- Скопируй ВСЁ и запусти в Supabase → SQL Editor → New query → Run

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  company_name text,
  plan text default 'free',
  created_at timestamptz default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_email text,
  company_name text,
  created_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  invoice_number text,
  issue_date date not null,
  due_date date not null,
  currency text default 'USD',
  subtotal numeric(12,2) default 0,
  tax_rate numeric(5,2) default 0,
  total numeric(12,2) default 0,
  notes text,
  status text default 'draft',
  reminder_stage integer default 0,
  sent_at timestamptz,
  viewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) default 1,
  unit_price numeric(12,2) default 0,
  amount numeric(12,2) default 0,
  position integer default 0
);

create table if not exists invoice_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  stage integer not null,
  label text not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text default 'pending',
  recipient_email text,
  error text,
  unique(invoice_id, stage)
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  action text not null,
  type text not null,
  message text,
  created_at timestamptz default now()
);

-- Auto invoice numbers: YYYY-0001, YYYY-0002...
create or replace function generate_invoice_number()
returns trigger language plpgsql as $$
declare
  next_num integer;
  prefix text;
begin
  prefix := to_char(now(), 'YYYY');
  select coalesce(max(
    cast(substring(invoice_number from '[0-9]+$') as integer)
  ), 0) + 1
  into next_num
  from invoices
  where user_id = new.user_id
  and invoice_number like prefix || '-%';

  new.invoice_number := prefix || '-' || lpad(next_num::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists set_invoice_number on invoices;
create trigger set_invoice_number
  before insert on invoices
  for each row
  when (new.invoice_number is null)
  execute function generate_invoice_number();

-- Auto-create profile on signup (handles Google OAuth full_name too)
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Disable RLS for now (single-tenant admin model via ADMIN_EMAIL env check)
alter table profiles disable row level security;
alter table clients disable row level security;
alter table invoices disable row level security;
alter table invoice_items disable row level security;
alter table invoice_reminders disable row level security;
alter table activity_logs disable row level security;

-- Indexes for performance
create index if not exists invoices_user_id on invoices(user_id);
create index if not exists invoices_status on invoices(status);
create index if not exists invoice_items_invoice_id on invoice_items(invoice_id);
create index if not exists reminders_status_scheduled on invoice_reminders(status, scheduled_at);
create index if not exists clients_user_id on clients(user_id);
create index if not exists activity_logs_user_id on activity_logs(user_id);
