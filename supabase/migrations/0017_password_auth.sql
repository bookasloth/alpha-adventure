-- Switch to password auth: track our own (non-blocking) email verification.
-- Supabase native "Confirm email" stays OFF; we send a Brevo verify link that
-- sets this flag and only drives a dashboard banner (gates nothing).
alter table public.profiles
  add column if not exists email_verified boolean not null default false;
