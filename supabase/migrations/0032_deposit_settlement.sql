-- ===========================================================================
-- Alpha Adventures — 0032 deposit (split) settlement. IDEMPOTENT + additive.
-- Apply AFTER 0026 (gateway settle) and 0030 (per-trek deposit config).
--
-- Lets a customer pay a DEPOSIT slice now: the booking settles to `deposit_paid`
-- (NOT confirmed), keeps its reserved seats, and records when the balance is
-- due. The balance is collected later (Task 7). Everything else — full and
-- balance payments — keeps the existing confirm path.
--
-- Two changes, both `create or replace` (safe to re-run):
--   (a) the transition guard gains payment_processing -> deposit_paid and
--       deposit_paid -> payment_processing (balance collection, Task 7).
--   (b) settle_gateway_payment branches on the locked payment row's `kind`.
-- ===========================================================================

-- ---------- (a) State-transition guard: allow the deposit states ------------
-- Verbatim copy of 0007's guard with two edges added; all existing transitions
-- preserved so re-running this never narrows the DAG.
create or replace function enforce_booking_transition() returns trigger
language plpgsql as $$
declare ok boolean;
begin
  if new.status = old.status then return new; end if;
  ok := case old.status
    when 'draft'              then new.status in ('pending_auth','cancelled','expired')
    when 'pending_auth'       then new.status in ('pending_payment','draft','cancelled','expired')
    when 'pending_payment'    then new.status in ('payment_processing','cancelled','expired')
    when 'payment_processing' then new.status in ('confirmed','payment_failed','deposit_paid')
    when 'payment_failed'     then new.status in ('pending_payment','cancelled')
    when 'deposit_paid'       then new.status in ('confirmed','cancelled','payment_processing')
    when 'confirmed'          then new.status in ('completed','cancelled')
    else false
  end;
  if not ok then
    raise exception 'invalid booking transition % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- ---------- (b) Kind-aware settlement ---------------------------------------
-- Same locked, idempotent contract as 0026. The ONLY behavioural change is a
-- deposit branch: when the locked payment row is a 'deposit', part-pay and hold
-- without confirming. Full/balance keep the confirm-the-whole-total path.
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

  -- _p.amount is the slice we charged (full OR deposit), so the mismatch guard
  -- holds for both: a deposit must arrive as exactly the deposit we quoted.
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

  -- Money captured but the booking can't take it (hold expired, cancelled, or
  -- already paid through another order): the app must refund.
  return jsonb_build_object('outcome', 'refund_required', 'booking_id', _b.id,
    'payment_id', _p.id, 'booking_status', _b.status);
end $$;

-- Server-only (see 0025): never callable with the browser's publishable key.
revoke execute on function settle_gateway_payment(text, text, bigint, text, jsonb) from public, anon, authenticated;
grant  execute on function settle_gateway_payment(text, text, bigint, text, jsonb) to service_role;
