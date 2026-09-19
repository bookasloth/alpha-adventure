# Auth + Guest-First Booking Engine — Implementation Plan

> Plan for the auth + booking build. Grounded in the verified audit
> ([AUDIT_ACTION_PLAN.md](AUDIT_ACTION_PLAN.md), [SUPABASE_AUDIT.md](SUPABASE_AUDIT.md),
> [BOOKING_READINESS.md](BOOKING_READINESS.md)). **Locked decisions:**
> identity = **email OTP**; **single-operator**; **payment DEFERRED** (flow ends
> at a reserved/pending-payment state, PhonePe seam left clean); DB migrations
> are **authored here, applied by the operator** in the Supabase SQL Editor.

## 0. Constraints this build runs under
- **No live DB access from this workspace** (MCP can't reach the project) → I ship
  versioned migration SQL; operator applies it. Live integration/E2E are
  operator-verified, not run here.
- **Service-role key required at runtime** for guest (pre-account) booking writes.
  Operator must add `SUPABASE_SERVICE_ROLE_KEY` (server-only) to `.env.local`.
  Until then, guest server actions compile/typecheck but can't execute.
- **Email OTP** must be enabled in the Supabase Auth dashboard (Email provider →
  OTP/magic link). Not togglable via SQL.
- **Payment skipped** → booking lifecycle implemented up to `pending_payment`
  (seats reserved, awaiting payment). `confirmed`/email-confirmation belong to the
  later payment phase and are scaffolded, not activated (spec: no confirmation
  email before verified payment).

## 1. Current architecture (verified)
- **Auth:** none in the app. DB has `profiles` + `user_roles` + `handle_new_user()`
  trigger + `is_staff/is_admin` helpers. `/user-dashboard` is a static mock.
  `profiles=0` live → trigger untested against a real signup.
- **Booking:** none in the app. DB has the full model — `treks`,
  `trek_departures` (dated capacity), `bookings` (nullable `user_id`,
  `draft_token`, money columns, `booking_status` enum), `booking_travellers`,
  `booking_addons`, `reserve_departure_seats()`/`release_departure_seats()`,
  `payments`/`refunds`/`payment_webhook_events`. All unwired.
- **DB access:** only `/api/leads` uses Supabase. Site content still from static
  `src/data/*.js`.
- **Conflicts to resolve:** (a) booking money columns are customer-writable under
  RLS → must move pricing server-side; (b) anon can't insert bookings under RLS →
  guest booking must be **service-role server actions** keyed by `draft_token`;
  (c) no `draft_token` index; (d) `profiles.email` not unique → email dedupe via
  `auth.users`.

## 2. Required changes (smallest safe path)
Reuse everything; **no duplicate** user/booking/payment models. Additive
migrations — **run `0006_booking_enums.sql` first (alone), then
`0007_booking_engine.sql`** (Postgres forbids using a new enum value in the same
transaction that adds it):
1. `alter type booking_status add value 'pending_auth'`, `'payment_failed'`
   (idempotent) — fill the guest-auth + failure gaps in the state machine.
2. Unique index on `bookings.draft_token` (partial, where not null) — guest lookup
   + dedupe.
3. Partial index on `bookings(expires_at)` where status in draft/pending_auth/
   pending_payment — expiry sweeper.
4. `price_booking(_trek_id, _departure_id, _adults, _children, _addons jsonb)`
   RPC (SECURITY DEFINER, STABLE) — **server-authoritative price** from catalog;
   returns the financial snapshot. The single source of pricing truth.
5. `create_guest_booking(...)` / `finalize_booking(...)` RPCs (SECURITY DEFINER):
   create draft with server price + `draft_token`; transition + reserve seats
   atomically (wraps `reserve_departure_seats` FOR UPDATE).
6. `enforce_booking_transition()` BEFORE UPDATE trigger — reject invalid
   status transitions at the DB (server-authoritative, even for bad app code).
7. `link_booking_to_user(_booking_id, _draft_token, _user_id)` — attach a guest
   draft to the just-verified account (email dedupe handled by `auth.users`).
8. **Capture the `rls_auto_enable` drift** (event trigger currently only live) so a
   rebuild reproduces it.
9. RLS: keep anon closed on bookings (guest writes go via service role). Add a
   customer SELECT for own bookings is already present. No customer write to money
   columns (already enforced).

## 3. Proposed user model (no change to schema shape)
`auth.users` (email identity) —1:1— `profiles` (app profile, auto-created by
`handle_new_user`). Roles in `user_roles` (`customer` default). Email is canonical;
`profiles.phone` = optional contact. **No new user table.**

## 4. Proposed booking model (reuse existing)
`bookings` (draft→…→confirmed, `draft_token` for guests, server-priced snapshot)
—1:*— `booking_travellers`, —1:*— `booking_addons`, —*:1— `trek_departures`
(capacity/`booked_seats`), —*:1— `treks`. Money in bigint paise, snapshotted.

## 5. Booking state machine
States (existing enum + 2 new): `draft`, `pending_auth`, `pending_payment`,
`payment_processing`, `confirmed`, `payment_failed`, `cancelled`, `expired`,
`completed`, `deposit_paid`.
Valid transitions (enforced by trigger + mirrored in `src/domain/booking/state.ts`):
```
draft            → pending_auth | cancelled | expired
pending_auth     → pending_payment | draft | cancelled | expired
pending_payment  → payment_processing | cancelled | expired      ← THIS BUILD ENDS HERE
payment_processing → confirmed | payment_failed                  ← payment phase
payment_failed   → pending_payment | cancelled
confirmed        → completed | cancelled
cancelled | expired | completed = terminal
```
Frontend never sets status; only server RPCs/actions transition it.

## 6. Authentication flow (email OTP, guest-first)
```
guest browses → picks trek/departure/travellers/details (no account)
  → server action create_guest_booking() [service role] → booking(draft, draft_token)
    → httpOnly draft cookie
  → review → "confirm your email" → signInWithOtp({email}) [Supabase Auth]
    → booking → pending_auth
  → verifyOtp(code) → session established
    → auth.users by email: EXISTING → same profile; NEW → handle_new_user makes profile
    → link_booking_to_user(booking, draft_token, uid); booking stays pending_auth
  → finalize_booking(): re-price server-side, reserve seats, booking → pending_payment
  → [PAYMENT PHASE — deferred] → confirmed
```
No `/login` redirect during booking; language is "complete your booking".

## 7. OTP flow & security
- Supabase Auth email OTP (`signInWithOtp` / `verifyOtp`) — **no custom OTP
  table**, no plaintext OTP, no OTP logging. Provider handles lifecycle/expiry.
- App adds: resend countdown, change-email, attempt/expired/too-many states in the
  UI; server rate-limit on the send action (per email/IP) on top of Supabase's own
  limits. Generic error messages.

## 8. Payment flow (DEFERRED — seam only)
Documented in [BOOKING_READINESS.md §10](BOOKING_READINESS.md) &
[TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md). This build stops at
`pending_payment`. A `PaymentGateway` interface + a `MockGateway` are provided so
the confirmation transition is testable later; PhonePe implements the interface in
the payment phase. **No confirmation email until verified payment.**

## 9. Security model
- **Server-authoritative pricing** — client price is display-only; server RPC
  recomputes; snapshot stored. Client cannot set `amount/total/discount/status`.
- **Guest writes via service role only** (server actions); anon RLS stays closed.
- **Ownership** — customer RLS: read own bookings/travellers/addons/payments;
  write only own draft (already live). `user_id`/money/status not client-writable.
- **Transitions** enforced by DB trigger.
- **Session** via `@supabase/ssr` cookies + middleware; `/account/**` gated.
- Secrets server-only: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` (never
  `NEXT_PUBLIC_`).

## 10. Edge cases
Abandoned draft (expiry sweeper releases seats) · duplicate email OTP sends
(rate-limited) · existing vs new email at verify (dedupe via `auth.users`) ·
draft cookie lost mid-flow (resume by `draft_token`; else new draft) · seats sold
out between draft and finalize (re-check + `reserve_departure_seats` fails → user
re-picks) · concurrent last-seat booking (`FOR UPDATE` lock in the RPC) · changing
email at OTP step (booking → draft, re-collect).

## 11. Testing strategy
- **Runnable here (unit, vitest):** pricing calc, state-machine transitions
  (valid/invalid), booking input validation (zod). These are pure → real PASS.
- **Operator-verified (needs live DB/auth):** RLS ownership, OTP new/existing/
  invalid/expired/resend, guest-not-redirected, dedupe, capacity/concurrency,
  E2E guest→account→pending_payment. Provided as spec + (where possible) code, run
  by the operator after applying the migration + setting keys.
- CI already runs typecheck + lint + unit + build (`.github/workflows/ci.yml`).

## 12. Implementation order (this build)
1. ✅ This plan. 2. Migration `0006` (operator applies). 3. Domain core
(`state.ts`, `pricing.ts`) + unit tests. 4. Supabase admin (service-role) client +
zod schemas. 5. Booking server actions (draft/price/link/finalize). 6. Auth
(email OTP actions, session middleware, login, logout). 7. Guest booking UI
(multi-step). 8. Account / my-bookings. 9. Resend module (welcome/pending; NOT
confirmation-before-payment). 10. Verify: unit + typecheck + lint + build. Payment
+ live E2E = later phases.

## 13. Definition of done (this phase)
Plan ✅ · migration authored ✅ · server-authoritative pricing + state machine with
passing unit tests · guest→email-OTP→account→`pending_payment` code-complete &
typechecked · account view · Resend module wired (env-gated) · typecheck/lint/
build green. **Payment, live OTP, live E2E = explicitly out of this phase.**
