-- ===========================================================================
-- Alpha Adventures — 0021 pre-departure reminders (IDEMPOTENT, additive).
-- Adds a once-only stamp so the booking-reminders cron never double-sends.
-- Apply in the Supabase SQL Editor.
-- ===========================================================================

alter table bookings add column if not exists reminder_sent_at timestamptz;

-- Cron target: confirmed bookings whose departure is near and not yet reminded.
create index if not exists bookings_reminder_idx
  on bookings(departure_date) where status = 'confirmed' and reminder_sent_at is null;
