-- ===========================================================================
-- Alpha Adventures — 0006 booking enums.
-- RUN THIS FIRST, ON ITS OWN (a separate SQL Editor execution), THEN run 0007.
-- Postgres forbids USING a newly added enum value in the same transaction that
-- added it (SQLSTATE 55P04). So the ADD VALUEs must commit before 0007 (which
-- references them in an index predicate) runs.
-- Idempotent.
-- ===========================================================================
alter type booking_status add value if not exists 'pending_auth';
alter type booking_status add value if not exists 'payment_failed';
