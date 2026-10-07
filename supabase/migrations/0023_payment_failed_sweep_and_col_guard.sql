-- ===========================================================================
-- Alpha Adventures — 0023 payment_failed seat release + bookings column guard.
-- Two independent P2 hardening fixes from the 2026-09-30 audit (§3.1, §3.3).
-- IDEMPOTENT + additive. Apply AFTER 0007/0018.
-- ===========================================================================

-- (1) §3.1 — payment_failed bookings never release seats.
-- finalize_booking reserves seats and moves draft -> pending_payment. If a
-- booking is ever moved pending_payment -> payment_failed, its held seats leak:
-- the sweepers only looked at pending_payment. Add payment_failed to both the
-- departure-scoped (0018) and global (0007) sweepers so a failed hold is freed.
-- (The PhonePe callback that would SET payment_failed is deferred with the rest
-- of PhonePe — mock payment stays — so this just makes the path leak-proof for
-- whenever it lands.)

create or replace function expire_stale_departure_bookings(_departure_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare _n int := 0; _b record;
begin
  for _b in select id, adults, children from bookings
            where departure_id = _departure_id
              and status in ('pending_payment', 'payment_failed')
              and expires_at is not null and expires_at < now()
            for update skip locked loop
    perform release_departure_seats(_departure_id, _b.adults + _b.children);
    update bookings set status = 'expired' where id = _b.id;
    _n := _n + 1;
  end loop;
  return _n;
end $$;

create or replace function expire_stale_bookings() returns int
language plpgsql security definer set search_path = public as $$
declare _n int := 0; _b record;
begin
  for _b in select id, departure_id, adults, children from bookings
            where expires_at is not null and expires_at < now()
              and status in ('pending_payment', 'payment_failed')
            for update skip locked loop
    perform release_departure_seats(_b.departure_id, _b.adults + _b.children);
    update bookings set status = 'expired' where id = _b.id;
    _n := _n + 1;
  end loop;
  update bookings set status = 'expired'
    where expires_at is not null and expires_at < now() and status in ('draft','pending_auth');
  return _n;
end $$;

-- (2) §3.3 — owner can PATCH own draft booking money/status columns.
-- bookings_update_draft RLS has no column allow-list. Neutralized today because
-- finalize_booking re-prices, but it's a latent hole. Mirror 0022's approach:
-- a BEFORE UPDATE trigger (NOT security definer, so current_user is the CALLER)
-- freezes server-owned columns when the caller is a PostgREST client role
-- (authenticated/anon). SECURITY DEFINER RPCs (finalize_booking et al. run as
-- the table owner) and the service_role are unaffected, so legit pricing writes
-- still go through.

create or replace function guard_booking_server_cols() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.status          := old.status;
    new.reference       := old.reference;
    new.user_id         := old.user_id;
    new.price_adult     := old.price_adult;
    new.price_child     := old.price_child;
    new.addons_total    := old.addons_total;
    new.discount_amount := old.discount_amount;
    new.points_redeemed := old.points_redeemed;
    new.subtotal        := old.subtotal;
    new.tax_amount      := old.tax_amount;
    new.grand_total     := old.grand_total;
    new.expires_at      := old.expires_at;
    new.confirmed_at    := old.confirmed_at;
  end if;
  return new;
end $$;

drop trigger if exists guard_booking_server_cols on bookings;
create trigger guard_booking_server_cols
  before update on bookings
  for each row execute function guard_booking_server_cols();
