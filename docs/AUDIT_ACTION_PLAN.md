# Audit Action Plan

> Read-only audit output. Evidence = migrations `0001–0005` + repo code. **Live
> database NOT VERIFIED** (Supabase MCP has no access to `rkzfezshvzszeykgrsdx`;
> introspection SQL handed to operator). Companion docs:
> [CODEBASE_AUDIT](CODEBASE_AUDIT.md) · [SUPABASE_AUDIT](SUPABASE_AUDIT.md) ·
> [SECURITY_AUDIT](SECURITY_AUDIT.md) · [BOOKING_READINESS](BOOKING_READINESS.md)
> · [DATABASE_GAPS](DATABASE_GAPS.md) · [TARGET_ARCHITECTURE](TARGET_ARCHITECTURE.md).

## Executive Summary

**Current state: NOT READY** (for booking-engine build).

The **database schema is strong and ~80% ready** — a complete, well-normalised,
integer-money, RLS-protected trekking-booking model with idempotency primitives
and a seat-reservation function. The **application is ~0% ready**: no auth, no
booking, no OTP, no payment code exists; only a `leads` insert touches Supabase,
and the public site still reads static `src/data/*.js`. The blockers are not
corruption but **missing server-side glue** (guest→OTP→account flow, server-owned
pricing, seat/expiry wiring), **untyped DB access**, and **unverified live schema/
auth settings**. Not a rewrite — a build-on.

## P0 Blockers

| Issue | Evidence | Risk | Required Action |
|---|---|---|---|
| Live DB & Auth settings unverified | MCP `permission denied` on `rkzfezshvzszeykgrsdx`; OTP provider not inspectable via SQL | Building on assumptions; RLS/OTP may be off in prod | Run the introspection SQL; confirm every table has RLS on and phone/email OTP + SMS provider are enabled in the Auth dashboard |

*(No P0 data-corruption or exposed-secret findings — secrets are clean, RLS
design is sound. The only true blocker is verification.)*

## P1 Before Booking Engine

| Issue | Evidence | Risk | Required Action |
|---|---|---|---|
| Booking money is client-writable | `bookings_insert`/`bookings_update_draft` don't restrict amount columns (`0003`) | Price tampering → underpayment | Server-computed pricing via RPC/service role; do not trust client amounts; consider revoking direct customer INSERT/UPDATE on `bookings` |
| Guest booking flow absent | anon blocked by RLS (correct); `draft_token`/`user_id null` present but no code; no index | Core "book before account" can't work | Build server-side (service-role) booking-intent keyed by `draft_token`; link `user_id` after OTP; add `draft_token` index |
| OTP + account link not built | no OTP/auth code anywhere | No verification/identity | Wire Supabase phone-OTP; on verify, resolve/create profile and link the draft booking |
| Duplicate-customer risk | `profiles.phone/email` non-unique; no phone↔email linking (`0002`) | Multiple accounts per person | Choose phone as canonical identity; dedupe on verified phone at OTP; (partial) unique on verified phone |
| Seat reservation & expiry unwired | `reserve_departure_seats()`/`expires_at` exist but nothing calls them (`0002`) | Oversell; abandoned drafts hold seats | Reserve seats in the payment txn; scheduled job to expire drafts + release seats |
| No generated DB types | no `Database` types in repo | Untyped queries → runtime bugs | `supabase gen types` → `src/types/database.ts`; use in all DB code |
| No app auth/session | no middleware/login (`CODEBASE_AUDIT`) | Nothing in front of RLS; no customer dashboard | Implement Supabase Auth session + protected routes before booking |

## P2 Before Production

| Issue | Evidence | Risk | Required Action |
|---|---|---|---|
| Payment integration server-verified | schema ready; zero code | Fake "paid" from frontend | Build PhonePe order→webhook→verify(signature+status re-query)→confirm; idempotent handler |
| Timezone / `start_time text` | `trek_departures.start_time text`; no tz (`0002`) | Off-by-one-day, bad cutoffs/reminders | Canonical `Asia/Kolkata`; `start_at timestamptz` where time matters |
| Free-text statuses | `profiles.status`, `leads.status` text; `lead_status` enum unused | Inconsistent data | Apply enums/checks |
| Migration governance | manual SQL-Editor DDL; no CLI/`config.toml` | Schema drift | Adopt Supabase CLI migrations + `db diff`; forbid manual prod DDL |
| Lead insert rate limiting | `leads_insert_public` `true`; no throttle | Spam | Rate-limit `/api/leads` |
| Two content sources of truth | static `src/data/*.js` vs seeded tables | Divergence | Migrate site reads to DB (CMS phase) |
| Reconciliation/notification workers | `notifications` outbox + `expires_at` unprocessed | Stuck states, no emails | Edge/cron workers |

## P3 Improvements

| Issue | Recommendation |
|---|---|
| Reschedule flow | Add fields/flow when needed |
| Feature-specific indexes | Add with each feature (draft_token, expiry partial, profiles phone/email) |
| Seed vs demo data | Separate `seed.sql`; don't ship demo departures |
| Multi-vendor | Only if product pivots to marketplace — big change; decide early |
| `<img>`→`next/image` | Address with media/perf phase |

## What Is Already Good

- **Schema modelling** — normalised catalog + dated-capacity availability +
  bookings with **snapshots** (trek_title/terms) so history survives catalog
  edits. *Why: correct separation of transaction vs catalog.*
- **Integer money (bigint paise), `timestamptz`, uuid PKs, generated columns**
  (`seats`, `balance_due`). *Why: avoids float money + derived-field drift.*
- **RLS design** — owner-scoped reads/writes, **financial state service-role
  only**, no role self-escalation, `SECURITY DEFINER` role helpers avoid
  recursion. *Why: least-privilege, money can't be forged client-side.*
- **Idempotency primitives** — unique `merchant_order_id`, `idempotency_key`,
  `payment_webhook_events(provider,event_id)`. *Why: safe duplicate/late webhooks.*
- **Concurrency primitive** — `reserve_departure_seats()` with `FOR UPDATE` +
  capacity check. *Why: correct oversell guard (once wired).*
- **Idempotent, ordered migrations** — reproducible on a fresh project.
- **Clean app foundations** — zod + error envelope + tests + CI; supabase server/
  browser client split; **no secrets committed**; service-role key absent from
  the repo.
- **Audit + notification outbox tables** — observability/eventing designed in.

## Proposed Implementation Order

- **Phase 1 — Foundation:** verify live DB (introspection SQL) & Auth settings;
  `supabase gen types`; adopt CLI migrations + drift check; server-only
  data-access + service-role convention.
- **Phase 2 — Identity/Auth:** phone-OTP sign-in, session, middleware, profile
  linking, duplicate-prevention, real customer dashboard (replace mock).
- **Phase 3 — Booking database wiring:** server-computed pricing (RPC), draft/
  intent creation, `draft_token` index; lock down booking money columns.
- **Phase 4 — Availability:** departure queries, seat reservation in txn, expiry
  job, timezone handling.
- **Phase 5 — OTP + account linking:** guest→verify→create/identify→link draft.
- **Phase 6 — Payment:** PhonePe order/webhook/verify/idempotency/reconciliation;
  deposit vs full.
- **Phase 7 — Booking confirmation:** status transitions, Resend emails,
  notification worker.
- **Phase 8 — Testing:** RLS tests, duplicate-customer, concurrency/oversell,
  webhook idempotency, payment verification, E2E guest→confirmed.

## Verdict

**BOOKING ENGINE NOT READY — FIX THE FOLLOWING FIRST:**
1. Verify live schema + enable/confirm Auth OTP & RLS (P0).
2. Server-owned pricing; lock booking money columns (P1).
3. Guest booking + OTP + account-link server flow; `draft_token` index (P1).
4. Prevent duplicate customers (canonical phone identity) (P1).
5. Wire seat reservation + expiry; generated DB types; app auth/session (P1).
