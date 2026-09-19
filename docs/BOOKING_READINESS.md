# Booking Readiness — Alpha Adventures

> Read-only. Covers Parts 7–10, 13. **DO NOT BUILD** — this assesses whether the
> foundation can support the booking engine. Schema from migrations; **live NOT
> VERIFIED**.

## Verdict up front
**Database foundation: ~80% ready. Application: 0% built. Guest+OTP flow: not
supported yet (by design gap, not corruption).** The schema is unusually
complete for pre-build; the missing pieces are concentrated in (a) the guest→
account→payment server flow, (b) seat-hold/expiry wiring, and (c) timezone/time
modelling.

## 7. Booking foundation checklist

| Concept | Present? | Where / gap |
|---|---|---|
| Services | ✅ | `treks` |
| Duration | ✅ | `treks.days/nights/duration_label` |
| Pricing | ✅ | `treks.base_price`, `trek_departures.price_override`, `trek_addons.price` (bigint paise) |
| Service status | ✅ | `treks.status content_status` |
| Ownership (vendor) | ⚠️ single-operator | no `vendor_id`; Alpha = sole operator (see [SECURITY_AUDIT.md §4](SECURITY_AUDIT.md)) |
| Availability | ✅ (date-based) | `trek_departures` (start_date/end_date/capacity) |
| Working hours / breaks / holidays / blocked time | ❌ | N/A for date-based trek departures; **not modelled** (would matter only for time-slot services) |
| Staff/resources | ❌ | not modelled |
| Timezone | ❌ | no tz column; `start_time` is `text`. **P2** |
| Booking duration | ✅ implicit | departure has start/end dates |
| Buffer time | ❌ | not modelled (not needed for date departures) |
| Slot generation | ⚠️ | departures are **manually created rows**, not generated from rules. Acceptable for treks |
| Booking status | ✅ | `booking_status` enum (draft…confirmed…+deposit_paid) |
| Booking lifecycle | ⚠️ | statuses exist; **no code/triggers drive transitions** |
| Cancellation | ✅ fields | `cancelled_at`, `cancellation_reason`, `release_departure_seats()` (unwired) |
| Rescheduling | ❌ | no reschedule concept/fields |
| Expiration | ⚠️ | `bookings.expires_at` column exists; **no expiry job** |
| Concurrency / double-booking | ⚠️ | `reserve_departure_seats()` FOR UPDATE exists but **unwired** |

**Model note:** this is a **capacity/seat** booking model (N seats per dated
departure), **not** a calendar time-slot model. That is the correct model for
treks. The brief's "select date/time / working hours / breaks / buffers" apply to
appointment-style services and are **largely N/A** here — call this out with the
client so we don't build slot machinery that isn't needed.

## 8. Guest booking architecture (Part 8)

**Can a booking exist before the customer account? Schema: yes. Code/RLS: not
yet.**
- `bookings.user_id` is **nullable** and `draft_token text` exists → the schema
  **anticipates** guest drafts.
- But RLS **blocks anon writes** (correct), so guest booking **must** be created
  **server-side with the service role**, keyed by `draft_token` (a random,
  httpOnly-cookie'd token), then linked to `user_id` after OTP.
- **No code implements any of this.** `draft_token` has no index and no consumer.

**Recommended guest flow (design only — do not implement):**
```
Guest selects trek + departure + pax
  → server action (service role) creates booking(status='draft',
      user_id=null, draft_token=<random>, contact_*), sets draft cookie
  → collect customer details onto the draft
  → OTP: Supabase Auth phone/email OTP (signInWithOtp / verifyOtp)
  → on verify: auth.users row exists → handle_new_user() makes profile+role
      → server links booking.user_id = profile.id, clears draft_token
      → EXISTING customer? same phone/email resolves to same auth.users → same
        profile → link, no duplicate
  → create payment (server) → PhonePe → verify webhook → status=confirmed
```
Needs: `draft_token` index; a booking-intent server action; OTP wiring; an
account-link step; abandoned-draft expiry (below). See
[TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md).

**OTP: NOT VERIFIED** whether Supabase Auth phone/email OTP is enabled on the
project (dashboard setting; not visible via SQL). No OTP table exists (Supabase
Auth manages OTP internally — a custom table is usually unnecessary).

## 9. Concurrency & double-booking (Part 9)

**Present:** `reserve_departure_seats(_departure_id,_seats)` — `SELECT … FOR
UPDATE` locks the departure row, checks `booked_seats + seats <= capacity`,
increments, flips to `full`. This is the **correct DB-level guard** against
oversell **when called inside the booking/payment transaction**.

**Missing / to design:**
- **Nothing calls it.** Booking insert does **not** reserve seats; there is no
  trigger. Two customers can both create drafts for the last seat.
- **When to reserve:** reserve at **payment initiation** (short hold), not at
  draft creation, to avoid abandoned drafts locking seats. Release on
  expiry/failure via `release_departure_seats()`.
- **Pending-booking / payment-timeout expiry:** `expires_at` exists but **no
  scheduled job** releases seats or expires drafts. Needs a cron/edge function.
- **Late/duplicate webhooks:** `payment_webhook_events UNIQUE(provider,event_id)`
  + `payments.idempotency_key UNIQUE` give the primitives; **handler code must**
  be idempotent (insert-event-or-noop, re-check provider status).
- **Browser-closed-during-payment / retry / network timeout:** covered by
  server-authoritative status + webhook + reconciliation poll (none built).
- **Duplicate booking attempts:** enforce via `draft_token`/idempotency at the
  server action.

**Missing DB pieces for safe concurrency:** an index on `bookings.draft_token`;
a job to expire drafts + release seats; (optional) reserve seats via the RPC
inside the payment transaction. No `EXCLUDE`/unique-slot constraint is needed for
the capacity model — the counter + `FOR UPDATE` + `check(booked_seats<=capacity)`
is sufficient **if used**.

## 10. Payment readiness (Part 10)

**Schema: strong. Code: none.**
- Provider default `phonepe` ✅ (matches target). `merchant_order_id UNIQUE`,
  `idempotency_key UNIQUE`, `payment_webhook_events UNIQUE(provider,event_id)`,
  `signature_verified boolean`, `raw_response jsonb`, `verified_at`, `kind`
  (full/deposit/balance), `refunds` table, amounts in **bigint paise**,
  `payment_status` + `refund_status` enums, `booking.amount_paid`/`balance_due`.
- **All the right primitives for idempotent, server-verified payments exist.**
- **Zero implementation:** no order creation, no PhonePe request/verify, no
  webhook handler, no signature verification, no reconciliation. **NOT VERIFIED
  that PhonePe API behavior matches assumptions** — confirm against PhonePe PG
  docs + live merchant creds before building.
- **Critical rule to enforce when built:** payment status set **only** after
  server-side signature verification **and** provider status re-check — never
  from frontend/redirect params. RLS already keeps `payments` writes to the
  service role, which supports this.

## 13. Timezone / date / slot handling

- **Departures:** `start_date date`, `end_date date`, `start_time text`. No
  timezone. `bookings.departure_date date`. Times (`booking_cutoff`, timestamps)
  are `timestamptz` (UTC-stored) — **good**.
- **Assessment:** for multi-day treks starting in India, date-only + IST-implied
  is *usually* fine, but:
  - `start_time` as **text** ("06:00 AM") is not comparable/sortable and can't be
    combined with date into an instant.
  - No canonical timezone → a customer in another timezone sees a bare date; any
    future reminder/cutoff logic risks off-by-one-day errors.
- **Recommendation (design):** store a canonical **`timezone` on the operator/
  departure** (Asia/Kolkata) and, where a real start instant matters, a
  `start_at timestamptz`. Always store instants in UTC, render in the operator's
  timezone. Keep `date` for display of the departure day. **P2** (not a blocker
  for date-based treks, but fix before any time-sensitive reminders/cutoffs).

## Bottom line
- **Blocks booking build (must fix first):** server-side pricing/booking (P1),
  guest→OTP→account server flow + `draft_token` index (P1), seat-reservation +
  expiry wiring (P1).
- **Strong and reusable as-is:** payment/idempotency schema, seat-reservation
  RPC, booking/payment status enums, integer money.
- **Confirm before building:** PhonePe API contract; Supabase Auth OTP enabled;
  single-operator (not multi-vendor); live schema matches migrations.
