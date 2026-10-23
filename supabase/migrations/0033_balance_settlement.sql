-- ===========================================================================
-- Alpha Adventures — 0033 balance (split) settlement. IDEMPOTENT + additive.
-- Apply AFTER 0032 (kind-aware deposit settle).
--
-- Closes the split-payment loop: a customer who paid a DEPOSIT (booking is
-- `deposit_paid`) now pays the remaining BALANCE off-session. A `kind='balance'`
-- settle on a `deposit_paid` booking moves it deposit_paid -> payment_processing
-- -> confirmed and credits the FULL grand_total.
--
-- Before this, a balance settle matched NEITHER branch (the confirm branch only
-- fires for pending_payment) and returned `refund_required` — which would have
-- refunded a legitimate balance payment. The transition guard (0032) already
-- allows deposit_paid -> payment_processing -> confirmed.
--
-- Two changes:
--   (a) create or replace settle_gateway_payment — the deposit + full branches
--       are byte-for-byte from 0032; a balance branch is added after them.
--   (b) balance_due_reminder_sent_at column + a partial index for the cron query.
-- ===========================================================================

-- ---------- (a) Kind-aware settlement, now with the balance branch ----------
create or replace function settle_gateway_payment(
  _order_id text,
  _txn_id   text,
  _amount   bigint,
  _method   text,
  _raw      jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare _p payments; _b bookings; _offset int;
begin
  select * into _p from payments where merchant_order_id = _order_id for update;
  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  -- Already handled by a concurrent/earlier caller (success, refund, or mismatch).
  -- This is what stops a deposit — or any slice — ever crediting twice.
  if _p.status in ('success', 'refunded', 'partially_refunded') or _p.failure_code = 'amount_mismatch' then
    return jsonb_build_object('outcome', 'already_settled', 'booking_id', _p.booking_id, 'payment_id', _p.id);
  end if;

  -- _p.amount is the slice we charged (full, deposit OR balance), so the mismatch
  -- guard holds for all: a balance must arrive as exactly the balance we quoted.
  if _amount is distinct from _p.amount then
    update payments set status = 'failed', provider_txn_id = _txn_id, method = _method,
      failure_code = 'amount_mismatch', failure_message = format('paid %s, expected %s', _amount, _p.amount),
      raw_response = _raw
    where id = _p.id;
    return jsonb_build_object('outcome', 'amount_mismatch', 'booking_id', _p.booking_id, 'payment_id', _p.id);
  end if;

  update payments set status = 'success', provider_txn_id = _txn_id, method = _method,
    verified_at = now(), failure_code = null, failure_message = null, raw_response = _raw
  where id = _p.id;

  select * into _b from bookings where id = _p.booking_id for update;

  -- A failed attempt earlier doesn't block a later successful one.
  if _b.status = 'payment_failed' then
    update bookings set status = 'pending_payment' where id = _b.id;
    _b.status := 'pending_payment';
  end if;

  if _b.status = 'pending_payment' then
    -- Respect the transition DAG: pending_payment -> payment_processing -> (deposit_paid | confirmed).
    update bookings set status = 'payment_processing' where id = _b.id;

    if _p.kind = 'deposit' then
      -- Deposit slice: hold the seats, record the balance due date, DON'T confirm.
      -- amount_paid is SET (not summed) to the deposit — the success short-circuit
      -- above means this same payment can never be applied a second time.
      select coalesce(balance_due_offset_days, 2) into _offset from treks where id = _b.trek_id;
      update bookings set status = 'deposit_paid',
        amount_paid      = _p.amount,
        deposit_amount   = _p.amount,
        balance_due_date = _b.departure_date - coalesce(_offset, 2)
      where id = _b.id;
      return jsonb_build_object('outcome', 'deposit_paid', 'booking_id', _b.id, 'payment_id', _p.id);
    end if;

    -- Full / balance: the whole total is now paid -> confirmed.
    update bookings set status = 'confirmed', amount_paid = _b.grand_total, confirmed_at = now()
      where id = _b.id;
    return jsonb_build_object('outcome', 'confirmed', 'booking_id', _b.id, 'payment_id', _p.id);
  end if;

  -- Balance slice on a part-paid booking: the remaining amount is now in, so the
  -- WHOLE total is paid -> confirmed. deposit_paid -> payment_processing ->
  -- confirmed (both edges allowed by the 0032 guard). amount_paid is SET to the
  -- grand_total; the success short-circuit above makes a second balance settle a
  -- no-op (already_settled), so this never over-credits.
  if _b.status = 'deposit_paid' and _p.kind = 'balance' then
    update bookings set status = 'payment_processing' where id = _b.id;
    update bookings set status = 'confirmed', amount_paid = _b.grand_total, confirmed_at = now()
      where id = _b.id;
    return jsonb_build_object('outcome', 'confirmed', 'booking_id', _b.id, 'payment_id', _p.id);
  end if;

  -- Money captured but the booking can't take it (hold expired, cancelled, or
  -- already paid through another order): the app must refund.
  return jsonb_build_object('outcome', 'refund_required', 'booking_id', _b.id,
    'payment_id', _p.id, 'booking_status', _b.status);
end $$;

-- Server-only (see 0025): never callable with the browser's publishable key.
revoke execute on function settle_gateway_payment(text, text, bigint, text, jsonb) from public, anon, authenticated;
grant  execute on function settle_gateway_payment(text, text, bigint, text, jsonb) to service_role;

-- ---------- (b) Balance-due reminder stamp + its query index ----------------
-- One reminder per booking, stamped only after a successful send (same pattern
-- as reminder_sent_at / review_request_sent_at). Partial index serves the cron's
-- "deposit_paid, not yet reminded, balance due within the window" scan.
alter table bookings add column if not exists balance_due_reminder_sent_at timestamptz;

create index if not exists idx_bookings_balance_due_reminder
  on bookings (balance_due_date)
  where status = 'deposit_paid' and balance_due_reminder_sent_at is null;
