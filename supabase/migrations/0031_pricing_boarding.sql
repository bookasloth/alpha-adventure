-- 0031_pricing_boarding.sql — boarding location in server-authoritative pricing.
-- REQUIRES 0029 (trek_boarding_locations, bookings.boarding_* columns).
-- Idempotent. Mirrors src/domain/booking/pricing.ts (keep the two in lockstep).
--
-- price_booking gains `_boarding_id uuid default null`. The price is ALWAYS looked up
-- from the trek's own locations: a foreign/tampered id raises 'invalid boarding', so a
-- client can never change the charged total by sending a different id or a price.
-- Boarding is per traveller (adults + children), like add-ons.

-- Adding a defaulted arg via CREATE OR REPLACE would create a second overload and make
-- 5-arg calls ambiguous. Drop the old signature first (finalize_booking is redefined below).
drop function if exists price_booking(uuid, uuid, integer, integer, jsonb);

create or replace function price_booking(
  _trek_id uuid, _departure_id uuid, _adults int, _children int,
  _addons jsonb default '[]'::jsonb,
  _boarding_id uuid default null
) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  _base bigint; _child bigint; _override bigint;
  _unit_adult bigint; _unit_child bigint;
  _addons_total bigint := 0; _subtotal bigint; _a jsonb; _addon_price bigint; _qty int;
  _boarding_price bigint := 0; _boarding_name text; _boarding_total bigint := 0;
begin
  if _adults < 1 then raise exception 'at least one adult required' using errcode='check_violation'; end if;
  if _children < 0 then raise exception 'invalid children count' using errcode='check_violation'; end if;

  select base_price, child_price into _base, _child from treks
    where id = _trek_id and status = 'published' and deleted_at is null;
  if _base is null then raise exception 'trek not bookable' using errcode='no_data_found'; end if;

  -- Departure must belong to the trek, not be cancelled, AND not be in the past
  -- (IST — the business timezone). Blocks client-tampered past/unlisted dates.
  select price_override into _override from trek_departures
    where id = _departure_id and trek_id = _trek_id and status <> 'cancelled'
      and start_date >= (now() at time zone 'Asia/Kolkata')::date;
  if not found then raise exception 'departure not bookable' using errcode='no_data_found'; end if;

  _unit_adult := coalesce(_override, _base);
  _unit_child := coalesce(_child, _unit_adult);

  for _a in select value from jsonb_array_elements(coalesce(_addons, '[]'::jsonb)) as t(value) loop
    select price into _addon_price from trek_addons
      where id = (_a->>'addon_id')::uuid and trek_id = _trek_id and active = true;
    if not found then raise exception 'invalid addon' using errcode='check_violation'; end if;
    _qty := coalesce((_a->>'quantity')::int, 1);
    if _qty <= 0 then raise exception 'invalid addon quantity' using errcode='check_violation'; end if;
    _addons_total := _addons_total + _addon_price * _qty;
  end loop;

  -- Boarding: optional, but if an id is given it MUST be one of THIS trek's locations.
  if _boarding_id is not null then
    select price, name into _boarding_price, _boarding_name from trek_boarding_locations
      where id = _boarding_id and trek_id = _trek_id;
    if not found then raise exception 'invalid boarding' using errcode='check_violation'; end if;
    -- ponytail: per-traveller; flat = drop the pax multiplier
    _boarding_total := _boarding_price * (_adults + _children);
  end if;

  _subtotal := _unit_adult * _adults + _unit_child * _children + _addons_total + _boarding_total;
  return jsonb_build_object(
    'currency','INR',
    'price_adult', _unit_adult, 'price_child', _unit_child,
    'addons_total', _addons_total,
    'boarding_total', _boarding_total, 'boarding_name', _boarding_name,
    'discount_amount', 0, 'tax_amount', 0,
    'subtotal', _subtotal, 'grand_total', _subtotal
  );
end $$;

-- finalize_booking: identical to 0018 except it re-prices WITH the booking's stored
-- boarding_location_id and snapshots boarding_total/name, so the finalize total matches
-- the draft total.
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
              from booking_addons where booking_id = _booking_id), '[]'::jsonb),
    _b.boarding_location_id);
  _total := (_priced->>'grand_total')::bigint;
  if _expected_total is not null and _expected_total <> _total then
    raise exception 'price mismatch: expected %, got %', _expected_total, _total using errcode='check_violation'; end if;

  perform expire_stale_departure_bookings(_b.departure_id);  -- free lapsed holds first
  _seats := _b.adults + _b.children;
  perform reserve_departure_seats(_b.departure_id, _seats);  -- raises if oversold

  update bookings set
    price_adult    = (_priced->>'price_adult')::bigint,
    price_child    = (_priced->>'price_child')::bigint,
    addons_total   = (_priced->>'addons_total')::bigint,
    boarding_total = (_priced->>'boarding_total')::bigint,
    boarding_name  = _priced->>'boarding_name',
    subtotal       = (_priced->>'subtotal')::bigint,
    grand_total    = _total,
    status         = 'pending_payment',
    expires_at     = now() + interval '30 minutes'
  where id = _booking_id returning * into _b;
  return _b;
end $$;

-- Re-apply the 0025 lockdown to the NEW price_booking signature (service role only).
revoke execute on function price_booking(uuid, uuid, integer, integer, jsonb, uuid) from public, anon, authenticated;
grant  execute on function price_booking(uuid, uuid, integer, integer, jsonb, uuid) to service_role;
revoke execute on function finalize_booking(uuid, bigint) from public, anon, authenticated;
grant  execute on function finalize_booking(uuid, bigint) to service_role;
