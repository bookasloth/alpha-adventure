-- Phase 0: contact/enquiry lead capture.
-- Public (anon) may INSERT a lead; nobody can read via the public key.
-- Admin reads happen later via service role / dashboard (auth phase).

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null check (char_length(name) <= 120),
  email      text        not null check (char_length(email) <= 200),
  phone      text        check (char_length(phone) <= 40),
  subject    text        check (char_length(subject) <= 160),
  message    text        not null check (char_length(message) <= 5000),
  source     text        not null default 'contact',
  status     text        not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

-- Allow anonymous submissions only. No SELECT policy => reads are blocked.
drop policy if exists "anon can submit leads" on public.leads;
create policy "anon can submit leads"
  on public.leads
  for insert
  to anon
  with check (true);
