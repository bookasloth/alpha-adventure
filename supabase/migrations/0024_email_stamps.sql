-- ===========================================================================
-- Alpha Adventures — 0024 once-only stamps for lifecycle emails
-- (IDEMPOTENT, additive). Same pattern as 0021 reminder_sent_at: the crons
-- stamp a booking only after a successful send, so nothing is double-sent and
-- a failed send retries on the next run.
-- ===========================================================================

alter table bookings add column if not exists expiry_notice_sent_at  timestamptz;
alter table bookings add column if not exists review_request_sent_at timestamptz;

-- Backfill: bookings that expired / travelled before this shipped are treated
-- as already notified, so the first cron run doesn't email historical rows.
update bookings set expiry_notice_sent_at = now()
  where status = 'expired' and expiry_notice_sent_at is null;
update bookings set review_request_sent_at = now()
  where status in ('confirmed', 'completed') and departure_date < current_date
    and review_request_sent_at is null;

create index if not exists bookings_expiry_notice_idx
  on bookings(updated_at) where status = 'expired' and expiry_notice_sent_at is null;
create index if not exists bookings_review_request_idx
  on bookings(departure_date) where status in ('confirmed', 'completed') and review_request_sent_at is null;
