# Target Architecture — Alpha Adventures (proposal, do NOT implement)

> Read-only proposal. Covers Parts 4, 20, 21. **Good news:** the existing schema
> (migrations 0001–0005) already matches most of the recommended target. This
> proposal **ratifies** that schema and specifies the **missing glue** (guest
> flow, identity dedupe, seat/expiry wiring, server-side pricing) — it does not
> propose a rewrite.

**DECISIONS LOCKED (2026-09-19):**
1. **Single-operator** — Alpha Adventures is the only seller. No multi-vendor /
   `vendor_id` / tenant boundary. The current schema already fits this.
2. **Email is the canonical customer identity** — sign-in/verification is by
   **email OTP (or magic link)**; a verified email = the account. Phone is
   optional secondary contact data, **not** the identity. **No SMS provider
   required for auth.**

## Part 4 — auth.users ↔ customer identity (answers)

| # | Question | Answer (declared schema) |
|---|---|---|
| 1 | Is `auth.users` used? | Schema yes (`profiles.id → auth.users`); **app: no auth wired yet**. NOT VERIFIED live auth settings |
| 2 | Profile table? | `profiles` ✅ |
| 3 | auth.users↔profiles link | 1:1 via PK = `auth.users.id`; `handle_new_user()` trigger auto-creates profile + `customer` role |
| 4 | Is phone the identity? | Not enforced; `profiles.phone` non-unique. Auth identity depends on which provider is enabled (**NOT VERIFIED**) |
| 5 | Is email the identity? | Same — `profiles.email` non-unique |
| 6 | One phone → many users? | **Yes possible** at profile level (no unique). `auth.users` enforces per-identity uniqueness only |
| 7 | One email → many users? | **Yes possible** (same reason) |
| 8 | Guest → customer? | Schema supports (`bookings.user_id` nullable + `draft_token`); **no code** performs the transition |
| 9 | Customer records duplicated? | **Possible** — phone-signup then email-signup = 2 `auth.users` = 2 profiles |
| 10 | Guest/customer distinction? | Only implicit (`bookings.user_id null` = guest draft). No `is_guest` flag |
| 11 | Roles storage? | **DB table** `user_roles` (not auth metadata). Clean. Role helpers `SECURITY DEFINER` |
| 12 | Can users change phone/email safely? | No app flow; changing needs `auth.users` update + profile sync (unbuilt) |
| 13 | Book with existing phone? | Should resolve to existing `auth.users`/profile after OTP — **depends on OTP-by-phone being the identity** (see recommendation) |
| 14 | Same person, different email/phone combos? | Creates **separate** accounts today — no linking |
| 15 | Duplicate accounts possible? | **Yes** — this is the main identity risk |

### Recommended identity architecture (LOCKED: email canonical)
- **Canonical identifier = email.** Configure Supabase Auth **email OTP / magic
  link** as the primary sign-in; a **verified email** is the account. No SMS
  provider needed. Phone is collected as optional contact data on
  `profiles.phone` / `bookings.contact_phone`, not as identity.
- **`auth.users` = identity; `profiles` = app profile (1:1).** Keep the existing
  `handle_new_user()` trigger (note: `profiles=0` live → it is **untested against
  a real signup**; verify it fires on the first email OTP signup).
- **Uniqueness:** `auth.users.email` is unique — rely on it. Optionally a partial
  unique index on `profiles.email` for defence in depth.
- **Dedupe rule:** OTP verify → look up `auth.users` by email → if exists, link
  the pending booking to that profile; else the signup creates it. Deterministic
  "existing vs new customer"; **prevents duplicates** on the canonical email.
- **Roles stay in `user_roles`** (already correct). Do not treat JWT metadata as
  the source of truth for roles.
- Changing email = an authenticated, re-verified flow later.

## Part 20 — target architecture

### Identity
```
auth.users (Supabase Auth, phone-OTP primary)
  └─1:1─ profiles (app profile; auto-created by handle_new_user)
            └─*─ user_roles (customer|staff|admin)
```
Vendor/host = **Alpha Adventures itself** (single operator). Staff/admin are
`user_roles`, not a separate vendor entity. **If** the product later becomes
multi-vendor, introduce a `vendors` table + `vendor_id` on treks/departures/
bookings/payments + tenant predicates in RLS — a **significant** change; decide
now (assume single-operator per the repo).

### Booking flow (guest → confirmed)
```
guest picks trek+departure+pax
  → [server action, service role] create booking(status=draft, user_id=null,
       draft_token, contact_*, priced from DB not client)   ← server owns price
  → collect customer details onto draft
  → OTP (Supabase Auth EMAIL): signInWithOtp({email}) → verifyOtp
  → verified: auth.users (new or existing, keyed by email) → profile via trigger
       → link booking.user_id = profile.id; clear draft_token
  → [server] reserve_departure_seats() inside txn; set status=pending_payment,
       expires_at=now()+N min
  → create payment(merchant_order_id, idempotency_key) → PhonePe
  → PhonePe webhook → verify signature + re-query status (server)
       → success: payment.status=success, booking.status=confirmed,
         booking.amount_paid updated, notification queued
       → fail/expire: release_departure_seats(); status=cancelled/expired
  → customer later logs in (phone OTP) → sees bookings via RLS
```

### Database (target = existing schema + these additions)
Existing tables are kept. **Additions/changes needed (design only):**

| Change | Table | Why |
|---|---|---|
| Index (unique/partial) on `draft_token` | `bookings` | guest lookup + dedupe |
| Partial index on `(expires_at)` where pending | `bookings` | expiry job |
| Server-computed pricing (RPC or revoke client write) | `bookings` | stop tampering (P1) |
| Partial unique on verified `phone` (decision) | `profiles` | dedupe identity |
| Enum/check on `status` fields; apply `lead_status` to `leads.status` | `profiles`,`leads` | consistency |
| `timezone` + `start_at timestamptz` (if time matters) | `trek_departures` | correct instants |
| Expiry + reconciliation jobs | (edge/cron) | release seats, poll pending payments |

No new core entities are required for a single-operator trek booking system —
the schema already has services, availability, bookings, travellers, addons,
payments, refunds, webhooks, points, notifications, audit.

### Booking lifecycle (recommended — refines the existing enum)
```
draft              ← guest/collected, no seat hold, expireable
pending_payment    ← seats reserved, payment initiated, expires_at set
payment_processing ← provider ack, awaiting webhook (optional)
deposit_paid       ← deposit captured, balance due (0005)
confirmed          ← full/required payment verified server-side
completed          ← trek date passed
cancelled          ← by customer/staff; seats released
expired            ← hold lapsed; seats released
```
The existing `booking_status` enum already covers this — **keep it**. Drive
transitions **only server-side**; log to `audit_log` (trigger already does for
status).

### Payment lifecycle (separate from booking — already modelled)
```
pending → processing → success | failed | cancelled | expired
success → refunded | partially_refunded (via refunds table)
```
`payment_status` enum + `refunds.refund_status` already model this. Payment state
is **authoritative** and set only after signature verification + provider
re-query. Booking state derives from payment state, never the reverse.

## Part 21 — final database blueprint (justification)

| Entity | Exists? | Why it exists / must not duplicate |
|---|---|---|
| User (`auth.users`) | ✅ | Supabase identity. Do not mirror password/identity into app tables |
| Customer profile (`profiles`) | ✅ | app-level person; 1:1 with user. Don't duplicate contact into many tables — snapshot only where legally needed (booking contact) |
| Vendor | ⚠️ single-operator | Alpha itself; no table unless multi-vendor. Don't scatter operator config — use `site_settings` |
| Service (`treks`) + children | ✅ | catalog; itinerary/addons/media as child tables (correct normalisation) |
| Availability (`trek_departures`) | ✅ | dated capacity; seat counter lives here, **not** on bookings |
| Booking (`bookings`) | ✅ | the transaction; holds **snapshots** (trek_title, departure_date, terms) so history is stable if catalog changes — good |
| Booking customer/travellers (`booking_travellers`) | ✅ | per-traveller data; lead traveller flagged. Don't force travellers to be accounts |
| Booking addons (`booking_addons`) | ✅ | line items with unit/line totals snapshotted |
| Payment (`payments`) + `refunds` + `payment_webhook_events` | ✅ | financial records; server-only; idempotent. Never derive confirmation from client |
| Points (`points_ledger`) | ✅ | append-only ledger (correct for loyalty) |
| Booking event/audit (`audit_log`) | ✅ | status-change trail; extend coverage as needed |
| Notification (`notifications`) | ✅ | outbox; processed by a worker (unbuilt) |
| SEO/FAQ/reviews/content | ✅ | CMS layer (0005) |

**What should NOT be duplicated:** identity (only `auth.users`/`profiles`);
pricing (compute from catalog, snapshot onto booking at creation); seat counts
(only on `trek_departures`); role truth (only `user_roles`).

## Confirmations
1. Single-operator — **RESOLVED: single-operator (locked).**
2. Canonical identity — **RESOLVED: email (locked).**
3. Supabase Auth **email OTP / magic link** enabled — **verify in the Auth
   dashboard** (SMS provider NOT needed).
4. PhonePe API contract + credentials — **still required** before payment build.
5. Live schema == migrations — **RESOLVED: verified** (one drift: `rls_auto_enable`
   event trigger to capture in a migration).
