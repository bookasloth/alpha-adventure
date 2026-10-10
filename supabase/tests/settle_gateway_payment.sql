-- Scenario tests for settle_gateway_payment (0026). Safe to run against any
-- environment: everything happens inside one DO block that ends by RAISING its
-- results, so the transaction rolls back and no test rows survive.
-- Expected final error message: "RESULTS ok: all 8 checks passed".
do $$
declare
  _trek uuid; _dep uuid; _b uuid; _b2 uuid; _r jsonb; _st text; _fails text := '';
begin
  select t.id, d.id into _trek, _dep from treks t join trek_departures d on d.trek_id = t.id limit 1;
  if _trek is null then raise exception 'RESULTS skipped: no trek/departure to test with'; end if;

  -- 1) happy path: held booking + pending order -> confirmed
  insert into bookings(trek_id, departure_id, status, adults, grand_total, expires_at)
    values (_trek, _dep, 'pending_payment', 1, 150000, now() + interval '20 minutes') returning id into _b;
  insert into payments(booking_id, provider, merchant_order_id, amount, status, idempotency_key, kind)
    values (_b, 'razorpay', 'order_TEST_1', 150000, 'pending', 'order_TEST_1', 'full');
  _r := settle_gateway_payment('order_TEST_1', 'pay_TEST_1', 150000, 'upi', '{}');
  select status into _st from bookings where id = _b;
  if _r->>'outcome' <> 'confirmed' or _st <> 'confirmed' then _fails := _fails || ' [1 confirm]'; end if;

  -- 2) duplicate webhook / handler race: second call is a no-op
  _r := settle_gateway_payment('order_TEST_1', 'pay_TEST_1', 150000, 'upi', '{}');
  if _r->>'outcome' <> 'already_settled' then _fails := _fails || ' [2 idempotent]'; end if;

  -- 3) a second order paid for an already-confirmed booking -> refund, not double charge kept
  insert into payments(booking_id, provider, merchant_order_id, amount, status, idempotency_key, kind)
    values (_b, 'razorpay', 'order_TEST_2', 150000, 'pending', 'order_TEST_2', 'full');
  _r := settle_gateway_payment('order_TEST_2', 'pay_TEST_2', 150000, 'card', '{}');
  if _r->>'outcome' <> 'refund_required' then _fails := _fails || ' [3 double-pay]'; end if;

  -- 4) wrong amount (tampered / partial) -> flagged, booking untouched
  insert into bookings(trek_id, departure_id, status, adults, grand_total, expires_at)
    values (_trek, _dep, 'pending_payment', 1, 150000, now() + interval '20 minutes') returning id into _b2;
  insert into payments(booking_id, provider, merchant_order_id, amount, status, idempotency_key, kind)
    values (_b2, 'razorpay', 'order_TEST_3', 150000, 'pending', 'order_TEST_3', 'full');
  _r := settle_gateway_payment('order_TEST_3', 'pay_TEST_3', 100, 'card', '{}');
  select status into _st from bookings where id = _b2;
  if _r->>'outcome' <> 'amount_mismatch' or _st <> 'pending_payment' then _fails := _fails || ' [4 amount]'; end if;

  -- 5) mismatch is only reported once (so it's refunded once)
  _r := settle_gateway_payment('order_TEST_3', 'pay_TEST_3', 100, 'card', '{}');
  if _r->>'outcome' <> 'already_settled' then _fails := _fails || ' [5 mismatch-once]'; end if;

  -- 6) payment lands after the hold expired -> refund_required, booking stays expired
  update bookings set status = 'expired' where id = _b2;
  insert into payments(booking_id, provider, merchant_order_id, amount, status, idempotency_key, kind)
    values (_b2, 'razorpay', 'order_TEST_4', 150000, 'pending', 'order_TEST_4', 'full');
  _r := settle_gateway_payment('order_TEST_4', 'pay_TEST_4', 150000, 'upi', '{}');
  select status into _st from bookings where id = _b2;
  if _r->>'outcome' <> 'refund_required' or _st <> 'expired' then _fails := _fails || ' [6 late]'; end if;

  -- 7) unknown order id -> not_found (no booking touched)
  _r := settle_gateway_payment('order_DOES_NOT_EXIST', 'pay_X', 150000, 'upi', '{}');
  if _r->>'outcome' <> 'not_found' then _fails := _fails || ' [7 unknown]'; end if;

  -- 8) the same gateway payment id can't be recorded twice
  begin
    update payments set provider_txn_id = 'pay_TEST_1' where merchant_order_id = 'order_TEST_4';
    _fails := _fails || ' [8 unique txn]';
  exception when unique_violation then null;
  end;

  if _fails = '' then raise exception 'RESULTS ok: all 8 checks passed';
  else raise exception 'RESULTS FAILED:%', _fails; end if;
end $$;
