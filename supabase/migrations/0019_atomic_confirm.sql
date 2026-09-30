-- ===========================================================================
-- Alpha Adventures — 0019 atomic mock-payment confirm (IDEMPOTENT, additive).
-- Problem: confirmMockPayment did payment-insert + two booking UPDATEs as three
-- separate round-trips (transactions). A crash between them left a booking stuck
-- in pending_payment with a success payment on record, which the expiry sweep
-- would then cancel — a charged-but-cancelled window. Also two concurrent calls
-- (double-click) each inserted a payment and confirmed.
-- Fix: one security-definer function, one transaction, row-locked. FOR UPDATE +
-- status short-circuit makes it idempotent (a second concurrent call waits, then
-- returns the already-confirmed booking without inserting a second payment).
-- PhonePe confirm is intentionally NOT touched here (gateway deferred); port this
-- same shape to it when PhonePe lands. Apply in the Supabase SQL Editor AFTER 0007.
-- ===========================================================================

create or replace function confirm_mock_payment(_booking_id uuid)
returns bookings language plpgsql security definer set search_path = public as $$
declare _b bookings; _mo text;
begin
  select * into _b from bookings where id = _booking_id for update;
  if not found then raise exception 'booking not found'; end if;
  if _b.status = 'confirmed' then return _b; end if;                 -- idempotent no-op
  if _b.status <> 'pending_payment' then
    raise exception 'booking not payable (is %)', _b.status using errcode='check_violation'; end if;

  _mo := 'MOCK-' || replace(gen_random_uuid()::text, '-', '');
  insert into payments(booking_id, provider, merchant_order_id, provider_txn_id,
    amount, currency, status, method, idempotency_key, verified_at, kind, raw_response)
  values(_booking_id, 'mock', _mo, _mo, _b.grand_total, 'INR', 'success', 'mock',
    _mo, now(), 'full', jsonb_build_object('mock', true));

  -- Respect the transition DAG: pending_payment -> payment_processing -> confirmed.
  update bookings set status = 'payment_processing' where id = _booking_id;
  update bookings set status = 'confirmed', amount_paid = _b.grand_total, confirmed_at = now()
    where id = _booking_id returning * into _b;
  return _b;
end $$;
