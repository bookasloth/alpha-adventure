-- ===========================================================================
-- Alpha Adventures — 0026 atomic, idempotent gateway settlement (Razorpay,
-- and PhonePe when it lands). IDEMPOTENT + additive. Apply AFTER 0019/0025.
--
-- Called by the server (service role) once the gateway has CONFIRMED a captured
-- payment: from the checkout success handler AND from the webhook, possibly at
-- the same moment. One transaction, payment row locked first, then booking:
--   - second caller waits, then sees the payment already settled -> no-op
--   - amount must equal what we charged, else flagged for refund
--   - booking still holding seats -> confirmed
--   - hold expired / cancelled / already paid by another order -> refund_required
-- The function never talks to the gateway; refunds are issued by the app.
-- ===========================================================================

create or replace function settle_gateway_payment(
  _order_id text,
  _txn_id   text,
  _amount   bigint,
  _method   text,
  _raw      jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare _p payments; _b bookings;
begin
  select * into _p from payments where merchant_order_id = _order_id for update;
  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  -- Already handled by a concurrent/earlier caller (success, refund, or mismatch).
  if _p.status in ('success', 'refunded', 'partially_refunded') or _p.failure_code = 'amount_mismatch' then
    return jsonb_build_object('outcome', 'already_settled', 'booking_id', _p.booking_id, 'payment_id', _p.id);
  end if;

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
    -- Respect the transition DAG: pending_payment -> payment_processing -> confirmed.
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

-- One gateway payment id can only ever be recorded once.
create unique index if not exists payments_provider_txn_uidx
  on payments(provider, provider_txn_id) where provider_txn_id is not null;
