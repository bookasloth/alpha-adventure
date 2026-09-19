# Database Gaps — Alpha Adventures

> Read-only. Covers Parts 11 (integrity), 12 (performance), 16 (migrations/
> governance). Declared schema; **live NOT VERIFIED**.

## 11. Data integrity

| Gap | Evidence | Risk | Recommended constraint (design only) |
|---|---|---|---|
| Client-writable booking money | `bookings_insert`/`update_draft` don't restrict amount cols | underpayment/tampering | server-computed pricing (RPC/service role); consider revoking direct customer write |
| Duplicate customer identity | `profiles.email`/`phone` **not unique/nullable**; no phone↔email linking | one person → multiple accounts | canonicalise identity on `auth.users`; dedupe on verified phone/email; see [TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md) |
| Free-text statuses | `profiles.status`, `profiles.medical_clearance_status` text (live). `leads.status` **is** `lead_status` enum — fine | inconsistent values | apply enums/checks to `profiles` statuses |
| `start_time` free text | `trek_departures.start_time text` | not sortable/instant-able | `time`/`start_at timestamptz` + timezone |
| No `draft_token` index | `bookings.draft_token` unindexed | slow guest lookup, no dedupe | unique/partial index on `draft_token` |
| Seat reservation not wired | `reserve_departure_seats()` unused | oversell / abandoned drafts hold seats | call RPC in payment txn; expiry job |
| No expiry job | `bookings.expires_at` unused | stale pending bookings, held seats | scheduled cleanup (edge/cron) |
| Reschedule missing | no fields | can't reschedule | add on demand later |
| `contact_*` free text on bookings | `bookings.contact_email/phone` | typos, dedupe | validate server-side (zod) |
| Cascade review | `payments.booking_id` **no ON DELETE** (defaults NO ACTION) vs `booking_addons ON DELETE CASCADE` | deleting a booking with payments errors (good) but inconsistent policy | keep payments RESTRICT (financial records must not cascade-delete); document intent |
| Orphans | `bookings.user_id ON DELETE SET NULL` → deleting a profile orphans bookings | booking loses owner | acceptable if profiles are soft-deleted; prefer soft-delete over hard-delete |
| Money type | `bigint` paise everywhere ✅ | — | **good, keep** |
| Audit fields | `created_at/updated_at` + triggers on most tables ✅; some child tables lack them | minor | add where useful |

**NOT VERIFIED:** duplicate rows / orphans in the **live** data (need row-count +
data inspection from the introspection SQL).

## 12. Performance (indexes vs likely query patterns)

**Present & appropriate:**
- `treks(status,published_at)`, `treks(category_id)`, `treks(destination_id)` —
  listing/detail.
- `trek_departures(trek_id,start_date)`, `(status,start_date)` — availability
  queries.
- `bookings(user_id,created_at desc)` — customer dashboard; `(departure_id)`,
  `(status)`.
- `payments(booking_id)`, `(status)`; `reviews(trek_id) where status=published`
  (partial); `leads(status,created_at)`, `(assigned_to)`; audit/notif indexes.
- Unique indexes back all natural keys (slug, reference, merchant_order_id,
  idempotency_key, webhook event_id).

**Gaps / add when the matching feature is built (not before):**
- `bookings(draft_token)` — guest lookup (add with guest flow).
- `bookings(departure_id, status)` — "seats used per departure" aggregation for
  availability display at scale.
- `bookings(expires_at) where status in ('draft','pending_payment')` — partial
  index for the expiry job.
- `profiles(phone)`, `profiles(email)` — customer lookup/dedupe (also uniqueness
  decision).
- `payments(merchant_order_id)` already unique-indexed; `payments(created_at)`
  for reconciliation windows.

**N+1 / query risks:** none in code today (no DB reads beyond leads). When
dashboards/listings move to the DB, fetch treks with joined
category/media/departures in single queries; avoid per-row lookups. **Do not
add indexes speculatively** — the above are tied to concrete future queries.

## 16. Migrations & governance

- **Files:** `0001_leads`, `0002_core_schema`, `0003_rls`, `0004_seed`,
  `0005_decisions`. Ordered, prefixed, descriptive. **Idempotent** (guarded
  `create type`, `create table if not exists`, `add column if not exists`,
  `drop policy if exists`, `add value if not exists`). **Additive.**
- **Reproducibility:** a fresh project run through 0001→0005 **should** produce
  the full schema — **good**. Exceptions to confirm:
  - No `supabase/config.toml` / CLI project link in repo → migrations are applied
    **manually in the SQL Editor**, not via `supabase db push` in CI. **Drift
    risk:** live changes made outside these files won't be captured. **P2.**
  - `0004_seed` mixes reference data (categories/tags/settings) with **sample
    treks/departures** — fine for dev, but seed vs. real content boundary should
    be explicit before production (don't ship demo departures).
  - **Live == files: VERIFIED (2026-09-19)** — the live schema matches 0001–0005,
    **with one drift:** a live event-trigger function **`rls_auto_enable`** exists
    that is **not in any migration file**. A fresh `0001→0005` run would **not**
    reproduce it → auto-RLS-on-new-tables would silently not happen on a rebuild.
    **Action:** add `rls_auto_enable` (and its event trigger) to a migration.
- **Recommendation (governance, design only):** adopt the Supabase CLI
  (`supabase migration`/`db push`) so the DB is rebuilt only from versioned
  migrations; forbid manual SQL-Editor DDL on production; run `supabase db diff`
  to detect drift; separate `seed.sql` (dev) from migrations.

## Summary
- **Integrity blockers:** client-writable booking money (P1), duplicate-identity
  prevention (P1). **Soon:** enum statuses, timezone, `draft_token`/expiry
  wiring (P2).
- **Performance:** baseline indexing is good; add feature-specific indexes with
  each feature.
- **Governance:** idempotent & reproducible, but move to CLI-driven migrations +
  drift detection before production (P2). Live-vs-declared **NOT VERIFIED**.
