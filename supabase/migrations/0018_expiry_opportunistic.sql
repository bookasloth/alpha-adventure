-- ===========================================================================
-- Alpha Adventures — 0018 opportunistic seat-hold expiry (IDEMPOTENT, additive).
-- Problem: the 30-min hold (finalize_booking.expires_at) was only released by the
-- once-daily expire-bookings cron, so abandoned carts held seats up to ~24h and
-- could silently sell out a departure. Fix: release stale holds for a departure
-- at the moment someone competes for it (inside finalize_booking) — cadence-
-- independent and works on any Vercel plan. The cron stays as a backstop (bumped
-- to */5 in vercel.json) for display accuracy on departures nobody is booking.
-- Apply in the Supabase SQL Editor AFTER 0007/0008.
-- ===========================================================================

-- Departure-scoped version of expire_stale_bookings: releases seats held by
-- pending_payment bookings on THIS departure whose 30-min window has lapsed.
create or replace function expire_stale_departure_bookings(_departure_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare _n int := 0; _b record;
begin
  for _b in select id, adults, children from bookings
            where departure_id = _departure_id
              and status = 'pending_payment'
              and expires_at is not null and expires_at < now()
            for update skip locked loop
    perform release_departure_seats(_departure_id, _b.adults + _b.children);
    update bookings set status = 'expired' where id = _b.id;
    _n := _n + 1;
  end loop;
  return _n;
end $$;

-- finalize_booking: identical to 0007 except it sweeps this departure's stale
-- holds BEFORE the capacity check, so an abandoned cart never blocks a live one.
create or replace function finalize_booking(_booking_id uuid, _expected_total bigint default null)
returns bookings language plpgsql security definer set search_path = public as $$
declare _b bookings; _priced jsonb; _total bigint; _seats int;
begin
  select * into _b from bookings where id = _booking_id for update;
  if not found then raise exception 'booking not found'; end if;
  if _b.user_id is null then raise exception 'booking has no user' using errcode='check_violation'; end if;
  if _b.status <> 'pending_auth' then
    raise exception 'booking not in pending_auth (is %)', _b.status using errcode='check_violation'; end if;

  _priced := price_booking(_b.trek_id, _b.departure_id, _b.adults, _b.children,
    coalesce((select jsonb_agg(jsonb_build_object('addon_id', addon_id, 'quantity', quantity))
              from booking_addons where booking_id = _booking_id), '[]'::jsonb));
  _total := (_priced->>'grand_total')::bigint;
  if _expected_total is not null and _expected_total <> _total then
    raise exception 'price mismatch: expected %, got %', _expected_total, _total using errcode='check_violation'; end if;

  perform expire_stale_departure_bookings(_b.departure_id);  -- free lapsed holds first
  _seats := _b.adults + _b.children;
  perform reserve_departure_seats(_b.departure_id, _seats);  -- raises if oversold

  update bookings set
    price_adult   = (_priced->>'price_adult')::bigint,
    price_child   = (_priced->>'price_child')::bigint,
    addons_total  = (_priced->>'addons_total')::bigint,
    subtotal      = (_priced->>'subtotal')::bigint,
    grand_total   = _total,
    status        = 'pending_payment',
    expires_at    = now() + interval '30 minutes'
  where id = _booking_id returning * into _b;
  return _b;
end $$;
