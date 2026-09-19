# Supabase Database Audit — Alpha Adventures

> **Read-only audit.** Source of truth for this document = the migration files
> `supabase/migrations/0001…0005`. The **live database was NOT VERIFIED**: the
> Supabase MCP token in this workspace cannot access project
> `rkzfezshvzszeykgrsdx` (`You do not have permission`). Introspection SQL was
> handed to the operator to run in the Alpha SQL Editor; until that output is
> reconciled, every "live" claim below is **NOT VERIFIED — declared in
> migrations only**. Migrations are idempotent, so the live DB *should* match,
> but manual drift cannot be ruled out.
>
> Project ref (app runtime): `rkzfezshvzszeykgrsdx`. Money = `bigint` paise
> (INR). IDs = `uuid` (`gen_random_uuid`). Timestamps = `timestamptz`.

## LIVE VERIFICATION (reconciled 2026-09-19)
Live introspection (SQL Editor) received and reconciled — **the previous "NOT
VERIFIED" caveats are now resolved except where noted:**
- **33 tables present; RLS ENABLED on every table** (`rls_forced=false`, which is
  normal — the table owner/service role still bypasses RLS by design).
- All enums, FKs, unique/check constraints, indexes, triggers and functions
  **match the migrations**. Booking/payment idempotency + seat-reservation
  functions confirmed live.
- **CORRECTION:** `leads.status` **is** the `lead_status` enum live (default
  `'new'`) — an earlier note said it was still `text`; that was wrong.
  `leads.source` default is `'contact_form'`.
- **DRIFT (P2):** the live DB has an event-trigger function **`rls_auto_enable`**
  (SECURITY DEFINER) that is **not in migrations `0001–0005`**. It auto-enables
  RLS on newly created tables (explains uniform RLS). Undocumented manual change
  → capture it in a migration and adopt CLI governance (see
  [DATABASE_GAPS.md §16](DATABASE_GAPS.md)).
- **Data state (clean slate):** `treks=4, trek_departures=5, categories=7,
  tags=14, site_settings=3, leads=2`; **`profiles=0, user_roles=0`,
  bookings/payments/notifications/audit = 0**. No user has ever signed up →
  `handle_new_user()` is **untested against a real `auth.users` insert**.
- **Still NOT VERIFIED (not inspectable via SQL):** Supabase **Auth settings** —
  whether phone/email **OTP** and an SMS provider are enabled. Check the Auth
  dashboard before the OTP phase.

## 0. How the app uses this database today [CURRENT]
- **Only one code path touches Supabase:** `src/app/api/leads/route.ts` inserts
  into `leads` via the server client (`src/utils/supabase/server.ts`).
- **The public site does NOT read from the DB.** Treks/tours/content still come
  from static `src/data/*.js`. The rich schema below is **provisioned but almost
  entirely unconsumed** by application code (see [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md)).
- No generated TypeScript types exist for this schema (see
  [CODEBASE_AUDIT.md §TS/DB consistency](CODEBASE_AUDIT.md)).

## 1. Enums [declared in 0002/0005]
`app_role` (customer, staff, admin) · `gender` · `content_status`
(draft/published/archived) · `trek_difficulty` · `departure_status`
(scheduled/open/full/closed/cancelled/completed) · `booking_status`
(draft, pending_payment, payment_processing, confirmed, cancelled, expired,
completed, **deposit_paid** [0005]) · `payment_status`
(pending/processing/success/failed/cancelled/expired/refunded/partially_refunded)
· `refund_status` · `lead_status` (new/contacted/qualified/converted/closed) ·
`points_txn_type` · `notification_channel` · `notification_status`.

**Finding (corrected by live check):** `leads.status` **is** the `lead_status`
enum live (default `'new'`) — applied correctly. No action.

## 2. Table inventory (declared)
Identity: `profiles`, `user_roles`. Media: `media`. Catalog: `destinations`,
`categories`, `tags`, `treks`, `trek_tags`, `trek_itinerary_days`,
`trek_itinerary_slots`, `trek_addons`, `trek_sections`, `trek_media`. Schedule:
`trek_departures`. Bookings: `bookings`, `booking_travellers`, `booking_addons`.
Loyalty: `points_ledger`. Payments: `payments`, `refunds`,
`payment_webhook_events`. CRM: `leads`, `lead_notes`. Content/CMS:
`testimonials`, `posts`, `pages`, `partners`, `site_settings`, `seo_meta`,
`faqs`, `reviews`. Ops: `notifications`, `audit_log`.
**~35 tables.** RLS enabled on all listed (0003 loop + 0005). **Live confirmation
NOT VERIFIED.**

## 3. Key tables in detail (declared)

### `profiles` (identity)
- PK `id uuid` → `auth.users(id) on delete cascade`. Fields: first/last name,
  email, phone, avatar_media_id (→media), DOB, gender, address, blood_group,
  medical_conditions, emergency contact, `medical_clearance_status text default
  'pending'`, `status text default 'active'`, `deleted_at` (soft delete),
  timestamps + `set_updated_at` trigger.
- **No unique on email/phone** → duplicate identity possible at profile level
  (auth.users enforces uniqueness per identity, not across email↔phone). See
  [TARGET_ARCHITECTURE.md §Identity](TARGET_ARCHITECTURE.md).
- `status` / `medical_clearance_status` are **free text**, not enums. (P2)
- Auto-created by `handle_new_user()` trigger on `auth.users` insert (also grants
  `customer` role). SECURITY DEFINER, `search_path=public` — correct.

### `user_roles`
- PK `(user_id, role)` → profiles. `granted_by`. `has_role/is_staff/is_admin()`
  SECURITY DEFINER helpers read it (avoids RLS recursion — **good**).

### `treks` (catalog / "service")
- PK uuid, `slug unique`, title, destination/category FKs, difficulty,
  days/nights, `base_price bigint`, currency, rating, SEO columns, `status
  content_status`, `published_at`, `deleted_at`, timestamps. Indexes on
  (status,published_at), category, destination. **Well-modelled.**

### `trek_departures` (availability / "slots")
- PK uuid, `trek_id` FK, `start_date date not null`, `end_date date`,
  `start_time text` (**not a time/timestamptz**), `capacity int check >=0`,
  `booked_seats int default 0 check >=0`, `price_override`, `booking_cutoff
  timestamptz`, `status departure_status`, `check (booked_seats <= capacity)`.
  Indexes on (trek_id,start_date), (status,start_date).
- **Findings:** `start_time` is free text; no per-departure **timezone**; seat
  model is a **counter** (`booked_seats`), not per-seat rows. See
  [BOOKING_READINESS.md](BOOKING_READINESS.md).

### `bookings`
- PK uuid, `reference text unique` (auto `AA-YYYY-XXXXXX` via trigger),
  `user_id uuid → profiles ON DELETE SET NULL` (**nullable** — guest-capable),
  `draft_token text` (**guest handle, currently unused by any code**), `trek_id`
  NOT NULL, `departure_id` NOT NULL, `status booking_status default 'draft'`,
  adults/children (+ generated `seats`), contact_name/email/phone, money columns
  (`price_adult, price_child, addons_total, discount_amount, points_redeemed,
  subtotal, tax_amount, grand_total` all bigint), `deposit_amount, amount_paid,
  balance_due (generated), balance_due_date` [0005], snapshots
  (trek_title/departure_date/terms_snapshot), `expires_at, confirmed_at,
  cancelled_at`. Indexes on (user_id,created_at), departure_id, status.
- **Findings:** money columns are **writable by the booking owner** under RLS
  (see [SECURITY_AUDIT.md](SECURITY_AUDIT.md)) → price-tampering risk unless the
  server recomputes. `expires_at` exists but **no expiry job**. `draft_token`
  present but **no code or index** uses it.

### `payments`, `refunds`, `payment_webhook_events`
- `payments`: `booking_id` NOT NULL, `provider text default 'phonepe'`,
  `merchant_order_id text UNIQUE`, `provider_txn_id`, `amount bigint`, `status
  payment_status`, `idempotency_key text UNIQUE`, `verified_at`, failure fields,
  `raw_response jsonb`, `kind` (full/deposit/balance) [0005]. Indexes on booking,
  status.
- `payment_webhook_events`: `UNIQUE(provider, event_id)`, `signature_verified
  boolean`, `processed_at`. **No RLS policy → service-role only** (correct).
- **Strong idempotency primitives** (unique merchant_order_id + idempotency_key +
  webhook event_id). **Zero application code** implements any of it. See
  [BOOKING_READINESS.md §Payment](BOOKING_READINESS.md).

### Concurrency functions [declared]
- `reserve_departure_seats(_departure_id, _seats)` — `SELECT … FOR UPDATE` row
  lock + capacity check + counter increment + flips status to `full`. **Correct
  primitive** to prevent oversell **IF called inside the booking transaction**.
  **Not wired** — no trigger/code calls it.
- `release_departure_seats(...)` — decrements on cancel/expire. Not wired.
- `set_booking_reference()`, `set_updated_at()`, `audit_change()`,
  `audit_user_roles()`, `handle_new_user()` — all present.

### Audit / notifications
- `audit_log` fed by triggers on bookings/payments/refunds/user_roles (status
  changes). `notifications` outbox (channel/type/status). Good outbox pattern;
  no processor code.

## 4. What the schema does well
- Integer money (paise), uuid PKs, `timestamptz` everywhere, soft-delete
  (`deleted_at`) on content, generated `seats`/`balance_due`, unique constraints
  on natural keys (slug, reference, merchant_order_id), sensible indexes,
  SECURITY DEFINER role helpers, idempotent migrations, audit + outbox tables.
  See [AUDIT_ACTION_PLAN.md §Good](AUDIT_ACTION_PLAN.md).

## 5. What is NOT VERIFIED (needs the SQL paste)
- Whether the live DB actually contains all ~35 tables / enums / policies /
  triggers, or has drifted from the migrations.
- Row counts (is anything populated? seed 0004 may or may not have run).
- Whether `auth` settings (phone/email provider, OTP) are enabled — **not
  inspectable from SQL**; confirm in the Supabase Auth dashboard.
- Whether RLS is truly enabled on every table on the live DB.

Continue: [SECURITY_AUDIT.md](SECURITY_AUDIT.md) ·
[BOOKING_READINESS.md](BOOKING_READINESS.md) ·
[DATABASE_GAPS.md](DATABASE_GAPS.md).
