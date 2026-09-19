# Security & RLS Audit — Alpha Adventures

> Read-only. Covers Parts 5, 6, 15. RLS reviewed from `0003_rls.sql` + `0005`.
> **Live RLS state NOT VERIFIED** (MCP has no access to `rkzfezshvzszeykgrsdx`);
> confirm with the introspection SQL. Severity: **P0** critical · **P1** before
> booking prod · **P2** soon · **P3** improvement.

> **LIVE-VERIFIED (2026-09-19):** RLS is **enabled on all 33 tables**; every
> policy below was confirmed against live `pg_policies`. The booking money-column
> and anon-insert findings are **confirmed**, not just declared.

## 1. RLS posture (verified live)
RLS is enabled on all ~35 tables (0003 loop + 0005). Model:
- **anon:** read published content (`status='published'`), read non-cancelled
  departures, **insert `leads`** only.
- **customer (authenticated):** read/write **own** draft bookings + travellers +
  addons; read own bookings/payments/refunds/points/profile.
- **staff/admin:** manage catalog/content/CRM/ops via `is_staff()/is_admin()`.
- **financial state (payments/refunds/webhooks/points writes):** **no
  INSERT/UPDATE policy → service-role only.** Correct.

This is a **solid, well-structured RLS design** — owner-scoped, least-privilege,
money kept server-side. The issues below are specific.

## 2. Findings

### P1 — Booking money columns are client-writable (price tampering)
- **Evidence:** `bookings_insert` `with check (user_id = auth.uid() and status =
  'draft')` and `bookings_update_draft` constrain **who** and **status**, but do
  **not** constrain the money columns (`price_adult, grand_total, subtotal,
  discount_amount, points_redeemed, …`). A logged-in customer can insert/patch a
  draft with **arbitrary amounts** (e.g. `grand_total = 100`).
- **Risk:** if payment amount is derived from `bookings.grand_total`, a tampered
  draft → **underpayment / free booking**.
- **Required action:** booking creation & pricing **must be server-side**
  (service role or a `SECURITY DEFINER` RPC that computes price from
  `treks/trek_departures/trek_addons`); never trust client-supplied amounts.
  Consider revoking direct customer INSERT/UPDATE on `bookings` in favour of an
  RPC. Blocks booking engine.
- **Tables:** `bookings`, `booking_addons`.

### P1 — Guest booking is impossible under current RLS (product blocker)
- **Evidence:** `bookings_insert` requires `user_id = auth.uid()`. For anon
  `auth.uid()` is null → `null = null` is NULL → **insert denied**. There is **no
  SELECT policy for anon** on `bookings`. `draft_token` exists but nothing uses
  it.
- **Risk:** the core requirement ("book first, account after OTP") **cannot work**
  via client RLS. This is **not a bug** — anon *should not* freely write bookings
  — but it means guest booking **must** run through a **server-side service-role
  path** (create draft with `draft_token`, link `user_id` after OTP). That path
  does not exist yet.
- **Required action:** design the guest-booking server flow (see
  [BOOKING_READINESS.md §Guest](BOOKING_READINESS.md)); add an index on
  `bookings.draft_token`; keep anon RLS closed.
- **Blocks booking engine.**

### P2 — `leads_insert_public with check (true)` has no rate limiting
- **Evidence:** `0003` `leads_insert_public`. Anon can insert unlimited leads;
  `/api/leads` has a honeypot but **no rate limit**.
- **Risk:** spam/flood of `leads`.
- **Action:** rate-limit at the route/edge; optionally a per-IP throttle. Not a
  blocker.

### P2 — Free-text status columns
- **Evidence (live-confirmed):** `profiles.status` (default `'active'`) and
  `profiles.medical_clearance_status` (default `'pending'`) are `text`.
  (`leads.status` **is** the `lead_status` enum live — not an issue.)
- **Risk:** inconsistent values, brittle filters.
- **Action:** convert `profiles` statuses to enums / check constraints.

### P3 — `media_read_public` exposes any `visibility='public'` row
- Fine for site imagery; ensure private uploads use `visibility<>'public'`.

## 3. Specific checks requested (Part 5)
- **USING vs WITH CHECK:** correctly split on `profiles`, `bookings`,
  `booking_travellers/addons`. No obvious USING/CHECK inversion. **Good.**
- **`true` policies:** `tags_read`, `settings_read`, `seo_read`,
  `leads_insert_public` use `true`. All are **intended public** surfaces (public
  taxonomy/settings/SEO; public lead capture). Acceptable, but `leads` needs rate
  limiting (above).
- **Overly broad / privilege escalation:** `user_roles` writes are **admin-only**
  (`is_admin()`); customers **cannot** self-grant roles. Role helpers are
  `SECURITY DEFINER` reading `user_roles` (avoids recursion) — **good**.
- **Insecure service-role usage:** **none found** — service-role key is not in
  the repo at all. (When introduced, it must stay server-only.)
- **Missing policies:** `payment_webhook_events`, `payments`/`refunds` writes,
  `points_ledger` writes intentionally have **no** policy → service-role only.
  **Correct.**
- **Cross-customer leakage:** `bookings_select`/`payments_select`/`refunds_select`
  scope to `user_id = auth.uid()` (via booking join). A customer **cannot** read
  another customer's booking/payment. **Good** (assuming RLS is actually enabled
  live — NOT VERIFIED).
- **IDOR:** booking/payment access is row-scoped by owner, not by guessable id →
  IDOR mitigated **at the DB**. But there is **no app auth yet**, so no app-layer
  IDOR surface exists either.

## 4. Multi-tenant / vendor isolation (Part 6)
**This is a single-operator platform, not a multi-vendor marketplace.** There is
**no `vendors`/`tenants` table and no `vendor_id`** anywhere. "Vendor" = Alpha
Adventures itself; internal separation is **staff/admin vs customer**, which RLS
handles.
- **Implication:** the brief's cross-vendor data-leak concerns are **N/A today**.
- **If multi-vendor is ever intended** (the brief implies a generic booking
  platform), it is **NOT supported**: there is no tenant key on treks/departures/
  bookings/payments, and RLS has no tenant predicate. Retrofitting tenancy later
  is expensive. **DECISION LOCKED (2026-09-19): single-operator** — Alpha is the
  sole seller. No `vendor_id`/tenant boundary will be added; the cross-vendor
  leakage class stays N/A.

## 5. Secrets (Part 15) — see [CODEBASE_AUDIT.md §4](CODEBASE_AUDIT.md)
- No secrets committed. Only public Supabase URL + publishable key in the client.
- **Service-role, PhonePe keys, PhonePe webhook secret, OTP/SMS creds, Resend
  key:** none present yet → nothing leaked, but **all must be server-only** when
  added. Never `NEXT_PUBLIC_*`. Webhook signature verification is mandatory
  before trusting any payment callback.

## 6. Overall security verdict
- **RLS design: strong** (owner-scoped, money server-only, no role escalation).
- **Blockers before booking:** server-side pricing/booking (P1 tampering),
  guest-booking server path (P1), then rate limiting + enum statuses (P2).
- **Live RLS enablement: NOT VERIFIED** — must confirm every table truly has RLS
  on in production before launch.
