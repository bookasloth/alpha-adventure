-- ===========================================================================
-- Alpha Adventures — 0025 lock down SECURITY DEFINER RPCs (security fix).
-- Postgres grants EXECUTE to PUBLIC on new functions, and PostgREST exposes
-- every public-schema function at /rest/v1/rpc/<name>. So anyone holding the
-- publishable key (it ships to every browser) could call these directly and,
-- because they're SECURITY DEFINER, bypass RLS:
--   confirm_mock_payment     -> confirm any held booking without paying
--   reserve/release_departure_seats -> fake "sold out" or overbook a departure
--   rate_limit_hit           -> lock other visitors out of sign-in/booking
--   finalize/link/expire/price -> drive the booking state machine
-- Every app caller uses the service-role client (server-only), and SQL-to-SQL
-- calls run as the function owner, so revoking anon/authenticated breaks
-- nothing. RULE for future migrations: any new SECURITY DEFINER function gets
-- the same revoke unless the browser genuinely needs to call it.
-- IDEMPOTENT.
-- ===========================================================================

revoke execute on function confirm_mock_payment(uuid)                       from public, anon, authenticated;
revoke execute on function finalize_booking(uuid, bigint)                   from public, anon, authenticated;
revoke execute on function link_booking_to_user(uuid, text, uuid)           from public, anon, authenticated;
revoke execute on function reserve_departure_seats(uuid, integer)           from public, anon, authenticated;
revoke execute on function release_departure_seats(uuid, integer)           from public, anon, authenticated;
revoke execute on function expire_stale_bookings()                          from public, anon, authenticated;
revoke execute on function expire_stale_departure_bookings(uuid)            from public, anon, authenticated;
revoke execute on function price_booking(uuid, uuid, integer, integer, jsonb) from public, anon, authenticated;
revoke execute on function rate_limit_hit(text, integer, integer)           from public, anon, authenticated;

grant execute on function confirm_mock_payment(uuid)                       to service_role;
grant execute on function finalize_booking(uuid, bigint)                   to service_role;
grant execute on function link_booking_to_user(uuid, text, uuid)           to service_role;
grant execute on function reserve_departure_seats(uuid, integer)           to service_role;
grant execute on function release_departure_seats(uuid, integer)           to service_role;
grant execute on function expire_stale_bookings()                          to service_role;
grant execute on function expire_stale_departure_bookings(uuid)            to service_role;
grant execute on function price_booking(uuid, uuid, integer, integer, jsonb) to service_role;
grant execute on function rate_limit_hit(text, integer, integer)           to service_role;
