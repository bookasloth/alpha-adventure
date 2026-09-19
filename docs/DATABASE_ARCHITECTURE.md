# DATABASE_ARCHITECTURE.md — Alpha Adventures

**Status:** Proposal for internal review. **No migrations exist yet.** Nothing in
this document has been applied to a database. It is Phase 2 (Domain Model) +
Phase 3 (Architecture) of the foundation task. Migrations (Phase 5) must not be
written until this is reviewed and the Open Questions (§25) are resolved.

**Stack:** Supabase (PostgreSQL 15+), Supabase Auth, Supabase Storage, RLS.
**Author of truth today:** static JS/HTML in `src/data/*`. This schema is the
migration target for that content plus the transactional product the UI already
implies.

---

## 1. Domain model

The product is a **trekking & travel booking platform**. Today the repo is a
static marketing shell (no backend — see root `CLAUDE.md`), but the UI already
describes the full product. Two artifacts reveal the real domain:

1. **`src/data/orig-dashboard.html`** — a logged-in customer dashboard showing
   profile, bookings (with adults/children, add-ons, GST, grand total, booking
   reference `AA-2026-XXXXXX`), payment history (txn id, method, status), a
   fitness/medical section (emergency contact, blood group, certificate upload),
   and a **Travel Points** wallet.
2. **`src/data/trek-detail-spiti-data.js`** — the legacy PHP CMS payload: a trek
   with `trek_sections` (hero/overview/about/itinerary/brochure/features/
   cancellation blocks), `pricing_settings`, SEO fields, itinerary days→slots,
   inclusions/exclusions, and a **Travel Points** cancellation policy.

The domain, end to end:

```
Identity → Catalog (Treks/Destinations/Categories) → Schedules (Departures)
  → Availability/Capacity → Bookings → Travellers → Pricing snapshot
  → Payments (PhonePe) → Refunds → Loyalty (Travel Points)
  → Notifications (Resend) → Leads/CRM → Content/CMS → Media → Audit
```

## 2. Entity inventory

Grounded in actual code (`src/data/*`, `orig-*.html`, routes in `src/app/**`).

| Domain | Entities | Source evidence |
|---|---|---|
| Identity | `profiles`, `user_roles` | dashboard profile form; logout/login; admin implied |
| Catalog | `treks`, `destinations`, `categories`, `tags`, `trek_tags` | `treks.js` (slug/group/tags/state/price), `tours.js`, `trekGroups`, `filterOptions` |
| Trek detail | `trek_itinerary_days`, `trek_itinerary_slots`, `trek_sections`, `trek_addons` | `treks.js` itinerary/inclusions/exclusions; spiti `trek_sections`; dashboard add-ons |
| Media | `media`, `trek_media` | `img()` CDN refs, gallery.js, brochure PDF, hero slides |
| Schedules | `trek_departures` | `travel-calendar` (month/date/duration/budget filters); dashboard trek dates |
| Bookings | `bookings`, `booking_travellers`, `booking_addons` | dashboard My Bookings + Booking Details modal |
| Payments | `payments`, `refunds`, `payment_webhook_events` | dashboard Payment History (TXN/method/status/refund); PhonePe target |
| Loyalty | `points_ledger` | dashboard Travel Points; spiti cancellation policy |
| Leads | `leads`, `lead_notes` | `orig-contact.html` contact form |
| Content | `testimonials`, `posts`, `pages`, `partners`, `site_settings` | testimonials.js, stories.js, partners, footer/site.js, static legacy pages |
| Notifications | `notifications` | booking/payment lifecycle; Resend |
| Audit | `audit_log` | admin/finance actions |
| Shop (deferred) | `products`, `orders`, … | `shop-init.js` (localStorage cart) — **not built now**, §22 |

## 3. Relationships (major)

```
auth.users 1─1 profiles 1─* user_roles
destinations 1─* treks *─1 categories ;  treks *─* tags (trek_tags)
treks 1─* trek_itinerary_days 1─* trek_itinerary_slots
treks 1─* trek_sections ;  treks 1─* trek_addons ;  treks 1─* trek_media *─1 media
treks 1─* trek_departures
profiles 1─* bookings *─1 trek_departures  (bookings *─1 treks kept for snapshot/reporting)
bookings 1─* booking_travellers
bookings 1─* booking_addons
bookings 1─* payments 1─* refunds
bookings 1─* points_ledger  (also profiles 1─* points_ledger)
profiles 1─* leads (assigned_to) ; leads 1─* lead_notes
media referenced by treks/posts/testimonials/partners (nullable FKs)
audit_log — polymorphic (entity_type, entity_id), no FK
```

## 4. Proposed tables, columns, types

Conventions: PK `id uuid default gen_random_uuid()` unless noted; every table
has `created_at timestamptz not null default now()`; mutable tables add
`updated_at timestamptz not null default now()` (trigger-maintained, §33).
Money is `bigint` in **integer paise** (₹1,299 → `129900`) with `currency char(3)
default 'INR'` (§17). Slugs are `citext unique`.

### 4.1 Identity

**`profiles`** (1:1 with `auth.users`, PK = auth id — do NOT duplicate auth):
`id uuid pk references auth.users(id) on delete cascade`, `first_name text`,
`last_name text`, `email citext` (mirror for admin search; auth owns the real
one), `phone text`, `avatar_media_id uuid null → media`, `date_of_birth date null`,
`gender gender null`, `address text null`, `blood_group text null`,
`medical_conditions text null`, `emergency_contact_name text null`,
`emergency_contact_phone text null`, `medical_clearance_status text default 'pending'`,
`status text default 'active'`, `deleted_at timestamptz null`, timestamps.
*(DOB/gender/medical/emergency are collected by the real dashboard form, so they
are justified — not speculative.)*

**`user_roles`**: `user_id uuid → profiles`, `role app_role`, `granted_by uuid null`,
`created_at`. `unique(user_id, role)`. Role check via `SELECT ... WHERE user_id=auth.uid()`.

### 4.2 Catalog

**`destinations`**: `slug`, `name`, `state text`, `country text default 'India'`,
`description text null`, `hero_media_id uuid null`, `status content_status default 'published'`,
`deleted_at`, timestamps.

**`categories`** (the trek "group": sahyadri/himalayan/central/backpacking/near-nagpur,
plus tour types): `slug`, `name`, `kind text` (`'trek_group'|'tour_type'`), `blurb text null`,
`position int default 0`, `status content_status`, timestamps.

**`tags`**: `slug`, `name`, `kind text` (`'difficulty'|'terrain'|'season'|'audience'`).
Seeded from `filterOptions`/`tags` in `treks.js` (beginner/moderate/difficult/fort/
night/monsoon/beach/heritage/high-altitude…).

**`treks`**: `slug`, `title`, `destination_id uuid → destinations`,
`category_id uuid → categories`, `location text`, `state text`, `summary text`,
`about text null` (rich HTML from CMS), `difficulty trek_difficulty null`,
`duration_label text` ("02 Days/01 Night"), `days smallint null`, `nights smallint null`,
`highest_altitude text null`, `suitable_age text null`, `basecamp text null`,
`accommodation text null`, `fitness_criteria text null`, `base_price bigint null`
(paise, "starting from"), `badge text null`, `rating numeric(2,1) null`,
`review_count int default 0`, `hero_media_id uuid null → media`,
`kind text default 'trek'` (`'trek'|'tour'|'backpacking'`), `status content_status default 'draft'`,
`published_at timestamptz null`, `deleted_at timestamptz null`, timestamps.
SEO handled by §22 columns on this table.

**`trek_tags`**: `trek_id → treks on delete cascade`, `tag_id → tags`, `pk(trek_id, tag_id)`.

**`trek_itinerary_days`**: `trek_id → treks on delete cascade`, `day_number smallint`,
`title text`, `description text null`, `position int`. `unique(trek_id, day_number)`.

**`trek_itinerary_slots`**: `day_id → trek_itinerary_days on delete cascade`,
`time text` (display "08:00 AM"), `activity text`, `position int`.

**`trek_addons`** (catalog of purchasable extras — "Trek Gear Rental", "Personal
Porter", "Sleeping Bag Upgrade"): `trek_id uuid null → treks` (null = global),
`name text`, `price bigint` (paise), `active bool default true`, `position int`, timestamps.

**`trek_sections`** (verbatim of the legacy CMS block model — the one **justified
JSONB** use for flexible page-builder content): `trek_id → treks on delete cascade`,
`section_key text`, `component_type text`, `content jsonb`, `position int`,
`is_visible bool default true`. `unique(trek_id, section_key)`. Inclusions,
exclusions and per-trek cancellation policy live here as they do in spiti data —
they are display lists, rarely queried by row, so a child table for each is not
warranted.

### 4.3 Media

**`media`**: `bucket text`, `storage_path text`, `filename text`, `mime_type text`,
`alt_text text null`, `caption text null`, `width int null`, `height int null`,
`size_bytes bigint null`, `visibility text default 'public'`, `uploaded_by uuid null → profiles`,
`created_at`. `unique(bucket, storage_path)`.

**`trek_media`**: `trek_id → treks on delete cascade`, `media_id → media`,
`role text` (`'gallery'|'brochure'|'banner'`), `position int`. `pk(trek_id, media_id, role)`.

### 4.4 Schedules & availability

**`trek_departures`**: `trek_id → treks on delete cascade`, `start_date date`,
`end_date date null`, `start_time text null`, `capacity int not null check (capacity >= 0)`,
`booked_seats int not null default 0 check (booked_seats >= 0)`,
`price_override bigint null` (paise; overrides trek base_price when set),
`booking_cutoff timestamptz null`, `meeting_point text null`, `notes text null`,
`status departure_status default 'scheduled'`, timestamps.
**Invariant:** `check (booked_seats <= capacity)`. Availability is derived
(`capacity - booked_seats`) and mutated only through the atomic
`reserve_departure_seats()` function (§34) — never recomputed by `count(bookings)`.

### 4.5 Bookings & travellers

**`bookings`**: `id`, `reference citext unique` (generated `AA-YYYY-XXXXXX`, §5),
`user_id uuid null → profiles` (null while a guest draft awaits OTP, §17-auth),
`trek_id uuid → treks`, `departure_id uuid → trek_departures`,
`status booking_status default 'draft'`, `adults smallint not null default 1 check(adults>=0)`,
`children smallint not null default 0 check(children>=0)`,
`seats int generated always as (adults + children) stored`,
`contact_name text`, `contact_email citext`, `contact_phone text`,
— **pricing snapshot (all bigint paise):** `currency char(3) default 'INR'`,
`price_adult bigint`, `price_child bigint`, `addons_total bigint default 0`,
`discount_amount bigint default 0`, `points_redeemed bigint default 0`,
`subtotal bigint`, `tax_amount bigint default 0` (GST), `grand_total bigint`,
— **content snapshot:** `trek_title text`, `departure_date date`, `terms_snapshot text null`,
`notes text null`, `expires_at timestamptz null` (draft hold TTL),
`cancelled_at timestamptz null`, `cancellation_reason text null`, timestamps.
`check (grand_total = subtotal + tax_amount - discount_amount - points_redeemed)`.

**`booking_travellers`**: `booking_id → bookings on delete cascade`,
`full_name text`, `phone text null`, `email citext null`, `date_of_birth date null`,
`gender gender null`, `is_lead bool default false`, `emergency_contact_name text null`,
`emergency_contact_phone text null`, `blood_group text null`,
`medical_conditions text null`, `position int`. *(Multiple travellers per booking —
not a JSON blob — because the dashboard shows per-participant adult/child data and
medical clearance is per person.)*

**`booking_addons`**: `booking_id → bookings on delete cascade`,
`addon_id uuid null → trek_addons` (nullable so history survives catalog deletes),
`name text` (snapshot), `unit_price bigint` (paise, snapshot), `quantity int check(quantity>0)`,
`line_total bigint`.

### 4.6 Loyalty

**`points_ledger`** (append-only; balance = `sum(points)`): `user_id → profiles`,
`booking_id uuid null → bookings`, `points bigint` (signed; earn +, redeem/expire −),
`type points_txn_type`, `expires_at timestamptz null`, `note text null`, `created_at`.
Never store a mutable "balance" column — derive it. (Cancellation credits 90% to
Travel Points valid 2 months per spiti policy.)

### 4.7 Payments

**`payments`**: `booking_id → bookings`, `provider text default 'phonepe'`,
`merchant_order_id text unique` (our reference sent to PhonePe),
`provider_txn_id text null`, `amount bigint` (paise), `currency char(3) default 'INR'`,
`status payment_status default 'pending'`, `method text null`,
`idempotency_key text unique`, `verified_at timestamptz null`,
`failure_code text null`, `failure_message text null`,
`raw_response jsonb null` (**never card/PII/secrets** — provider status only), timestamps.
**Multiple attempts per booking = multiple rows** (do not assume 1:1).

**`refunds`**: `payment_id → payments`, `amount bigint`, `status refund_status default 'pending'`,
`provider_refund_id text null`, `reason text null`, `created_by uuid null → profiles`, timestamps.

**`payment_webhook_events`** (idempotent callback dedupe): `provider text`,
`event_id text`, `payload jsonb`, `signature_verified bool`, `processed_at timestamptz null`,
`created_at`. `unique(provider, event_id)`.

### 4.8 Leads / CRM

**`leads`**: `name text`, `email citext null`, `phone text null`, `subject text null`,
`message text null`, `source text default 'contact_form'`, `trek_id uuid null → treks`,
`status lead_status default 'new'`, `assigned_to uuid null → profiles`, timestamps.
**`lead_notes`**: `lead_id → leads on delete cascade`, `author_id uuid → profiles`, `note text`, `created_at`.

### 4.9 Content / CMS / marketing

**`testimonials`**: `author_name text`, `role text null`, `rating smallint check(rating between 1 and 5)`,
`body text`, `avatar_media_id uuid null → media`, `booking_id uuid null → bookings`
(null now; set → verified review later), `status content_status default 'published'`,
`position int`, timestamps.

**`posts`** (blog / trek stories): `slug`, `title`, `excerpt text null`, `body text`,
`cover_media_id uuid null`, `author_id uuid null → profiles`, `trek_id uuid null → treks`,
`status content_status default 'draft'`, `published_at timestamptz null`,
SEO columns (§22), `deleted_at`, timestamps.

**`pages`** (optional — make static legacy pages editable later): `slug`, `title`,
`sections jsonb` (block model like `trek_sections`), `status content_status`,
`published_at`, SEO columns, timestamps. *Extensibility only; current pages stay
in code until there is a need — see §37.*

**`partners`**: `name text`, `logo_media_id uuid null → media`, `url text null`,
`position int`, `active bool default true`, timestamps.

**`site_settings`** (the ONE key→jsonb table — for genuine singleton config only,
NOT a generic EAV for business data): `key text pk`, `value jsonb`, `updated_at`.
Documented keys: `contact`, `social`, `stats`, `payment_methods`, `hours`.

## 5. Primary keys & ID strategy

**Decision: UUID everywhere for application entities**, PostgreSQL-generated via
`gen_random_uuid()` (UUIDv4, `pgcrypto`). One consistent strategy — no serials
for app rows. Rationale: no sequential enumeration exposed publicly; safe to
generate client-side for draft/idempotent flows; plays well with distributed
inserts. `profiles.id` is the exception by design — it **is** `auth.users.id`.

**Public identifiers never expose internal ids.** Bookings carry a
human-facing `reference` (`AA-YYYY-XXXXXX`, random base32, unique) used in the UI,
emails and support — the UUID stays internal. Payments use `merchant_order_id`.

*UUIDv7 note:* if index locality on high-write tables (`payments`, `audit_log`,
`notifications`) becomes a measured problem, switch those tables' defaults to a
`uuidv7()` SQL function. Not adopted now — `gen_random_uuid()` is fine at this
scale and avoids a custom function dependency. (ponytail: upgrade path named, not pre-built.)

## 6. Foreign keys & cascade rules

- **Cascade delete** for owned children: `trek_tags`, `trek_itinerary_days/slots`,
  `trek_sections`, `trek_media`, `booking_travellers`, `booking_addons`, `lead_notes`.
- **Restrict / no cascade** for transactional links: `bookings.departure_id`,
  `payments.booking_id`, `refunds.payment_id` — financial history must never
  disappear because a parent was removed. Treks/departures use soft delete + status
  instead of hard delete once bookings exist.
- **Set null** on optional media/assignment links (`*_media_id`, `leads.assigned_to`)
  so deleting a media row or staff member doesn't destroy the referencing entity.
- `profiles.id → auth.users on delete cascade` (deleting the auth user removes the profile).

## 7. Constraints (integrity in the DB, not just the app)

- `NOT NULL` on every identity/money/status/FK column that is logically required.
- `UNIQUE`: all `slug`s, `bookings.reference`, `payments.merchant_order_id`,
  `payments.idempotency_key`, `payment_webhook_events(provider,event_id)`,
  `user_roles(user_id,role)`, `trek_tags` PK.
- `CHECK`: `booked_seats <= capacity`; non-negative seats/quantities/amounts;
  `rating between 1 and 5`; booking total identity (§4.5); enum-backed statuses.
- Booking↔departure consistency enforced in `reserve_departure_seats()` (§34).

## 8. Indexes (§29 has the full list with rationale)

Driven by real query patterns from the routes/filters, not blanket indexing.

## 9. RLS strategy — see §30 (mandatory, per-table).

## 10. Authentication strategy — see §16 / §17.

## 11. Audit strategy — see §25(audit)/§33.

---

## 12. Status / state models

**`booking_status`**: `draft → pending_payment → payment_processing → confirmed`,
with `cancelled`, `expired` (draft TTL / abandoned), `completed` (post-trek).
Server-controlled only (§16). Legal transitions:

```
draft            → pending_payment | expired | cancelled
pending_payment  → payment_processing | expired | cancelled
payment_processing → confirmed | pending_payment(retry) | cancelled
confirmed        → cancelled | completed
completed/expired/cancelled → (terminal)
```

**`payment_status`**: `pending → processing → success | failed | cancelled | expired`;
`success → refunded | partially_refunded`. Only the verification/webhook server
path (service role) may write these. Client never sets payment status.

## 13. Soft-delete strategy

`deleted_at timestamptz` **only where lifecycle preservation matters**:
`profiles`, `treks`, `destinations`, `categories`, `posts`, `pages`. RLS/queries
filter `deleted_at is null` for public reads.
**No soft delete** on transactional/audit tables (`bookings`, `payments`,
`refunds`, `points_ledger`, `audit_log`, `payment_webhook_events`) — those use
`status` + are retained; cancellation is a status, not a delete. Junction tables
hard-delete via cascade.

## 14. Timestamp strategy

All `timestamptz` (UTC), never `timestamp`. `created_at`/`updated_at` on all
mutable tables; `updated_at` maintained by a shared `set_updated_at()` trigger.
Lifecycle timestamps as explicit columns: `published_at`, `confirmed_at` (derive
from status change or add if needed), `cancelled_at`, `verified_at`, `expires_at`,
`processed_at`, `deleted_at`.

## 15. Money / currency strategy

**Integer minor units (paise), `bigint`.** No floats, no `numeric` for money.
`₹1,299 = 129900`. Every money column pairs with `currency char(3) default 'INR'`.
Bookings store a **full financial snapshot** (per-adult/child price, add-ons, GST,
discount, points redeemed, grand total) so later price changes never rewrite
history (§4.5 CHECK enforces the arithmetic). GST currently 5% (dashboard) — stored
as computed `tax_amount`, not a live rate, so historical invoices stay correct.

## 16. Payment strategy — see §4.7 + §34/§35. Provider: **PhonePe**. Status is
server-authoritative; verification via signed webhook + server-side status query;
`raw_response` holds provider status only (no card data — PhonePe is PCI-scope).

## 17. Media strategy

Supabase Storage, not bytes-in-Postgres. Buckets: **`public`** (trek/gallery/blog
imagery, partner logos) and **`private`** (fitness/medical certificates, brochures
if gated). `media` rows hold metadata + `bucket`+`storage_path`. Private-bucket
objects are reachable only via signed URLs minted server-side for the owner/admin.
Orphan avoidance: delete the storage object in the same server action that deletes
the `media` row; nullable FKs prevent dangling references.

### Guest booking → OTP → auth (draft survival)

Booking drafts are created with `user_id = null` and a server-issued
`draft_token` (opaque, returned to the client; stored as a hashed column or in a
short-lived `booking_drafts` staging row). After phone-OTP via Supabase Auth, the
server attaches `user_id` to the draft by token — the draft lives in the DB, **not
browser state**, so refresh/network loss can't lose it. `expires_at` reaps
abandoned drafts (and releases held seats, §34).

## 18. Notification strategy

Single **outbox** table `notifications` (channel, type, payload, status,
sent_at, error). Business events (booking confirmed, payment success/failed,
refund issued) enqueue a row via a lightweight trigger or the same service
transaction; a worker/Edge Function sends via **Resend** (email) and later
SMS/WhatsApp. No notification logic embedded in every business function; no heavy
event bus — the outbox row IS the event. Idempotency via `unique(type, entity_id,
channel)` where a duplicate would be wrong.

## 19. Administration strategy

Admin/staff are `profiles` with an `admin`/`staff` row in `user_roles`. No
separate admin user store. Admin capabilities are expressed as RLS policies keyed
on role (§30) plus service-role server actions for privileged writes (payment
status, refunds). Future granular roles (operator/content_manager/support) slot
into the same `app_role` enum + `user_roles` without a rewrite (§37).

## 20. Future extensibility — see §37.

## 21. Migration strategy — see §39.

## 22. SEO strategy

SEO columns embedded on the entities that own a URL (`treks`, `posts`, `pages`,
`destinations`), matching the legacy CMS (`seo_title`, `meta_description`,
`canonical_url`, `og_title`, `og_description`, `og_image_media_id`, `robots_noindex bool`,
`schema_type text`). No separate metadata table — 1:1 with the page, avoids joins
and duplication. `generateMetadata` reads these columns.

### Shop domain (explicitly deferred)

`shop-init.js` is a localStorage-only cart over static gear products — **no
server state today**. When commerce is built: `products`, `product_variants`,
`product_media`, `carts`, `orders`, `order_items`, reusing `media`, the money
strategy, and PhonePe. **Not modeled in migrations now** (YAGNI). The UUID/money/
payment foundations make it additive later.

## 23. Enums (Postgres `create type`)

`app_role` (customer, staff, admin), `gender` (male, female, other,
prefer_not_to_say), `content_status` (draft, published, archived),
`trek_difficulty` (beginner, moderate, difficult), `departure_status` (scheduled,
open, full, closed, cancelled, completed), `booking_status` (draft,
pending_payment, payment_processing, confirmed, cancelled, expired, completed),
`payment_status` (pending, processing, success, failed, cancelled, expired,
refunded, partially_refunded), `refund_status` (pending, processing, completed,
failed), `lead_status` (new, contacted, qualified, converted, closed),
`points_txn_type` (earn, redeem, expire, refund_credit, adjustment),
`notification_channel` (email, sms, whatsapp, in_app), `notification_status`
(pending, sent, failed). Enums for closed sets; plain `text` for open-ended
fields (`provider`, `method`, `source`, `section_key`).

---

## 24. Concurrency, transactions, idempotency

**Atomic seat reservation** — `reserve_departure_seats(departure_id, seats)`
`SECURITY DEFINER`:
```
begin;
  select capacity, booked_seats from trek_departures
    where id = :departure_id for update;        -- row lock
  if booked_seats + :seats > capacity then raise; end if;
  update trek_departures set booked_seats = booked_seats + :seats
    where id = :departure_id;
  insert booking (...);                          -- same tx
commit;
```
The `for update` lock + `check (booked_seats <= capacity)` makes "two users grab
the last slot" safe — one waits, then fails the check. Never
`capacity - count(bookings)`.

**Payment confirmation** is one transaction: verify → update `payments` → confirm
`booking` → (release nothing / keep seats) → enqueue notification. Partial failure
rolls back.

**Idempotency:** `payments.idempotency_key` and `merchant_order_id` unique;
`payment_webhook_events(provider,event_id)` unique so a replayed PhonePe callback
is a no-op; booking creation guarded by the draft token so double-submit /
refresh / retry can't mint duplicate bookings or double-charge.

## 25. RLS by role, audit, security (summary — full policies §30/§32)

- **Customer:** read/update own `profiles`; read own `bookings`/`booking_travellers`/
  `booking_addons`/`payments`/`points_ledger`; **cannot** write payment/booking
  status (service role only); cannot see others' rows.
- **Public (anon):** read only `status='published' and deleted_at is null` rows of
  `treks`, `destinations`, `categories`, `tags`, `trek_*` detail, `testimonials`,
  `posts`, `partners`, `site_settings`, and `open` `trek_departures`. Insert into
  `leads` (rate-limited at the edge). Nothing else.
- **Staff/Admin:** role-gated access to leads/bookings/content/departures; refunds
  and payment-status writes remain service-role server actions even for admins.
- **Audit:** `audit_log` written by triggers on `bookings`/`payments`/`refunds`/
  `user_roles`/`treks` status & price changes; readable by admin only; never logs
  secrets or card data.
- **Service role key:** server-only, never shipped to the browser (§31).
- No `USING (true)` on any table holding user, financial, or lead data.

---

## Appendix A — §29 Index list (query-driven)

| Index | Why |
|---|---|
| `treks(slug) unique`, `treks(status, published_at)`, `treks(category_id)`, `treks(destination_id)` | detail lookup by slug; public listing; group/region filters (`treks.js`) |
| `trek_tags(tag_id)` | tag filter |
| `trek_departures(trek_id, start_date)`, `trek_departures(status, start_date)` | calendar by date/month, open departures |
| `bookings(reference) unique`, `bookings(user_id, created_at desc)`, `bookings(departure_id)`, `bookings(status)` | support lookup; dashboard "My Bookings"; capacity/reporting |
| `booking_travellers(booking_id)`, `booking_addons(booking_id)` | booking detail modal |
| `payments(booking_id)`, `payments(merchant_order_id) unique`, `payments(idempotency_key) unique`, `payments(status)` | payment history; callback matching; idempotency; finance filters |
| `refunds(payment_id)` | refund lookup |
| `payment_webhook_events(provider,event_id) unique` | webhook dedupe |
| `points_ledger(user_id)` | wallet balance |
| `leads(status, created_at desc)`, `leads(assigned_to)` | CRM queue |
| `posts(slug) unique`, `posts(status, published_at)` | blog |
| `profiles(email)`, `user_roles(user_id)` | admin search; role checks in RLS |
| `media(bucket, storage_path) unique` | storage mapping |

## Appendix B — §33 Triggers (only where justified)

1. `set_updated_at()` — BEFORE UPDATE on all mutable tables.
2. `booking_reference_default()` — generate `AA-YYYY-XXXXXX` on insert if null.
3. `audit_status_change()` — AFTER UPDATE on bookings/payments/refunds/treks/
   user_roles writing `audit_log`.
4. (Function, not trigger) `reserve_departure_seats()` — atomic capacity (§24).
5. (Function) `redeem_points()` / points balance check — SECURITY DEFINER, validates
   balance before insert of a negative ledger row.

No triggers for anything expressible cheaply in the service layer. Every trigger
above is documented; business logic that would be opaque inside a trigger stays in
Edge Functions / server actions.

---

## §25 Risks

1. **PhonePe integration specifics** (signature scheme, status-query API, refund
   API) not yet wired — payment/webhook tables model the shape but real field
   names may need small additions.
2. **GST/tax** modeled as a stored snapshot; if multi-rate or invoice-series
   compliance (GSTIN numbering) is required, an `invoices` table may be needed.
3. **Guest-draft reaping** needs a scheduled job (pg_cron / Edge Function) to
   expire drafts and release seats — infra, not just schema.
4. **Static content migration**: moving `treks.js`/`orig-*.html` into tables is a
   one-time ETL; the site must be re-pointed from imports to queries (large FE change).
5. **Travel Points expiry** (2-month validity) needs a scheduled `expire` job.

## §25 Open questions (need human/product input — genuinely unresolvable from code)

1. **Deposit vs full payment?** Does a booking confirm on full payment only, or is
   a partial deposit allowed? (Affects `payments`/`bookings` amount semantics.)
2. **Who are the non-customer roles at launch?** Just `admin`, or `staff` too? (I
   modeled both; confirm before seeding.)
3. **Is the shop launching?** Confirms whether to keep it fully deferred (current
   plan) or model it now.
4. **Do the many static pages** (about/safety/terms/…) need to be admin-editable
   soon, or stay in code? (Determines whether `pages` ships in v1 or stays a stub.)
5. **Verified reviews vs marketing testimonials** — one table (`testimonials` with
   optional `booking_id`) as proposed, or split later?
6. **PhonePe account & GSTIN** details — needed before payment/invoice fields finalize.

---

*Next step after review: resolve Open Questions, then Phase 5 — write
`supabase/migrations/*` in the order Identity → Catalog → Media → Schedules →
Bookings → Payments → Loyalty → Leads → Content → Notifications → Audit, then RLS,
types, seed, tests, and the §43 companion docs.*

---

## Addendum — Decisions applied 2026-09-19 (migration `0005_decisions.sql`)

Open Questions above are now resolved. This section is authoritative where it
conflicts with earlier text; earlier deviations from the original plan are
intentional and listed here.

**Reconciled deviations (schema was kept, plan text corrected):**
- **Roles** use a `user_roles` join table + `app_role` enum, resolved via
  security-definer `has_role()`/`is_staff()`/`is_admin()` — NOT `profiles.role`.
  (Supabase-recommended; avoids RLS recursion, allows multi-role.)
- **Notifications** use one multi-channel `notifications` outbox
  (`email`/`sms`/`whatsapp`/`in_app`), NOT a single-purpose `email_log`.
- **No `navigation` table** — navigation lives in `site_settings` JSON.

**Decisions locked with the client:**
1. **Payments = both full and deposit.** Added to `bookings`: `deposit_amount`
   (null ⇒ full required), `amount_paid`, `balance_due` (generated =
   `greatest(grand_total - amount_paid, 0)`), `balance_due_date`. Added
   `payments.kind` ∈ {`full`,`deposit`,`balance`} and booking state
   `deposit_paid`. Deposit *flow* (balance initiation, reminders, partial-refund
   rules) is Phase 6.
2. **Shop deferred** — no `orders`/products/cart schema. Bookings/payments/refunds
   cover trek transactions.
3. **CMS = core + content** — added `seo_meta` (per-entity SEO/JSON-LD) and
   `faqs`. Galleries + visual nav editor deferred.
4. **Reviews = verified** — added `reviews`: one per `booking_id` (unique),
   `rating` 1–5, `draft→published` moderation, created via Server Action.
   `testimonials` stays for admin-curated marketing quotes.

All four new/changed tables have RLS enabled with read/staff policies and
`set_updated_at()` triggers matching the `0003`/`0002` conventions.

**Still outstanding (not blocking schema):** PhonePe merchant + GSTIN details,
needed before the payment/invoice fields finalize in Phase 6.
