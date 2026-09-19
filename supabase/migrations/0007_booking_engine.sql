-- ===========================================================================
-- Alpha Adventures — 0007 booking engine (IDEMPOTENT, additive).
-- RUN 0006_booking_enums.sql FIRST (separate execution) so the new enum values
-- are committed before this file references them.
-- Guest-first booking + email-OTP identity. Payment DEFERRED (flow ends at
-- 'pending_payment'). Money = bigint paise. Server is authoritative for price,
-- seats, and status transitions. Apply in the Supabase SQL Editor.
-- ===========================================================================

-- ---------- Indexes --------------------------------------------------------
-- Guest lookup + dedupe by draft token.
create unique index if not exists bookings_draft_token_key
  on bookings(draft_token) where draft_token is not null;
-- Expiry sweeper target (references the new enum values -> needs 0006 first).
create index if not exists bookings_expires_idx
  on bookings(expires_at) where status in ('draft','pending_auth','pending_payment');

-- ---------- Server-authoritative pricing -----------------------------------
-- Single source of price truth. Client-sent prices are NEVER trusted.
create or replace function price_booking(
  _trek_id uuid, _departure_id uuid, _adults int, _children int,
  _addons jsonb default '[]'::jsonb
) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  _base bigint; _override bigint; _unit_adult bigint; _unit_child bigint;
  _addons_total bigint := 0; _subtotal bigint; _a jsonb; _addon_price bigint; _qty int;
begin
  if _adults < 1 then raise exception 'at least one adult required' using errcode='check_violation'; end if;
  if _children < 0 then raise exception 'invalid children count' using errcode='check_violation'; end if;

  select base_price into _base from treks
    where id = _trek_id and status = 'published' and deleted_at is null;
  if _base is null then raise exception 'trek not bookable' using errcode='no_data_found'; end if;

  select price_override into _override from trek_departures
    where id = _departure_id and trek_id = _trek_id and status <> 'cancelled';
  if not found then raise exception 'departure not bookable' using errcode='no_data_found'; end if;

  _unit_adult := coalesce(_override, _base);
  _unit_child := _unit_adult;  -- ponytail: no separate child rate in catalog yet

  for _a in select value from jsonb_array_elements(coalesce(_addons, '[]'::jsonb)) as t(value) loop
    select price into _addon_price from trek_addons
      where id = (_a->>'addon_id')::uuid and trek_id = _trek_id and active = true;
    if not found then raise exception 'invalid addon' using errcode='check_violation'; end if;
    _qty := coalesce((_a->>'quantity')::int, 1);
    if _qty <= 0 then raise exception 'invalid addon quantity' using errcode='check_violation'; end if;
    _addons_total := _addons_total + _addon_price * _qty;
  end loop;

  _subtotal := _unit_adult * _adults + _unit_child * _children + _addons_total;
  return jsonb_build_object(
    'currency','INR',
    'price_adult', _unit_adult, 'price_child', _unit_child,
    'addons_total', _addons_total, 'discount_amount', 0, 'tax_amount', 0,
    'subtotal', _subtotal, 'grand_total', _subtotal
  );
end $$;

-- ---------- State-transition guard (server-authoritative) ------------------
create or replace function enforce_booking_transition() returns trigger
language plpgsql as $$
declare ok boolean;
begin
  if new.status = old.status then return new; end if;
  ok := case old.status
    when 'draft'              then new.status in ('pending_auth','cancelled','expired')
    when 'pending_auth'       then new.status in ('pending_payment','draft','cancelled','expired')
    when 'pending_payment'    then new.status in ('payment_processing','cancelled','expired')
    when 'payment_processing' then new.status in ('confirmed','payment_failed')
    when 'payment_failed'     then new.status in ('pending_payment','cancelled')
    when 'deposit_paid'       then new.status in ('confirmed','cancelled')
    when 'confirmed'          then new.status in ('completed','cancelled')
    else false
  end;
  if not ok then
    raise exception 'invalid booking transition % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
drop trigger if exists trg_booking_transition on bookings;
create trigger trg_booking_transition before update of status on bookings
  for each row execute function enforce_booking_transition();

-- ---------- Link a guest draft to the verified account ---------------------
create or replace function link_booking_to_user(_booking_id uuid, _draft_token text, _user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _b bookings;
begin
  select * into _b from bookings where id = _booking_id for update;
  if not found then raise exception 'booking not found'; end if;
  if _b.draft_token is null or _b.draft_token <> _draft_token then
    raise exception 'invalid draft token' using errcode='check_violation'; end if;
  if _b.user_id is not null and _b.user_id <> _user_id then
    raise exception 'booking already linked to another user' using errcode='check_violation'; end if;
  update bookings set user_id = _user_id, status = 'pending_auth', draft_token = null
    where id = _booking_id;  -- draft->pending_auth (or no-op if already there)
end $$;

-- ---------- Finalize: re-price + reserve seats atomically ------------------
-- pending_auth -> pending_payment. Concurrency-safe via reserve_departure_seats
-- (FOR UPDATE + capacity check). Re-prices server-side; optional client total is
-- only cross-checked, never trusted.
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

-- ---------- Expiry sweeper (schedule via pg_cron / edge function) ----------
create or replace function expire_stale_bookings() returns int
language plpgsql security definer set search_path = public as $$
declare _n int := 0; _b record;
begin
  for _b in select id, departure_id, adults, children from bookings
            where expires_at is not null and expires_at < now() and status = 'pending_payment'
            for update skip locked loop
    perform release_departure_seats(_b.departure_id, _b.adults + _b.children);
    update bookings set status = 'expired' where id = _b.id;
    _n := _n + 1;
  end loop;
  update bookings set status = 'expired'
    where expires_at is not null and expires_at < now() and status in ('draft','pending_auth');
  return _n;
end $$;

-- ---------- Capture the live `rls_auto_enable` drift (guarded) -------------
-- The live DB has an event trigger auto-enabling RLS on new tables that is NOT
-- in migrations 0001-0005. Recreated here ONLY IF ABSENT so a fresh rebuild
-- reproduces it; the live object is left untouched. If the live body differs,
-- export it (`select pg_get_functiondef('rls_auto_enable'::regproc)`) and replace.
do $$ begin
  if not exists (select 1 from pg_proc where proname = 'rls_auto_enable') then
    execute $fn$
      create function rls_auto_enable() returns event_trigger
      language plpgsql security definer as $body$
      declare r record;
      begin
        for r in select objid::regclass::text as t
                 from pg_event_trigger_ddl_commands() where command_tag = 'CREATE TABLE' loop
          execute format('alter table %s enable row level security', r.t);
        end loop;
      end $body$;
    $fn$;
    execute $et$
      create event_trigger trg_rls_auto_enable on ddl_command_end
      when tag in ('CREATE TABLE') execute function rls_auto_enable();
    $et$;
  end if;
end $$;

-- RLS: bookings stay closed to anon (guest writes go through service-role server
-- actions calling the functions above). Existing customer-owner policies from
-- 0003 are unchanged and correct.
