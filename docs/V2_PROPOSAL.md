# V2 Build Proposal — Alpha Adventures

> Everything here is **[PROPOSED]**. It describes the target production system,
> not what exists. For current state see [V1_REPORT.md](V1_REPORT.md). For
> sequencing see [V2_ROADMAP.md](V2_ROADMAP.md). For fixed conventions see
> [V2_DECISIONS.md](V2_DECISIONS.md).

## 1. Target system in one paragraph

A **fully dynamic, database-driven trekking & travel platform**: a Next.js 14
(App Router) + **TypeScript** frontend, **Supabase** (PostgreSQL + Auth +
Storage) as the authoritative data layer, an **admin/CMS** for all business
content and operations, **Resend** for transactional email, and **PhonePe** for
server-verified payments. Content, pricing, batches, leads, bookings, users and
SEO are managed without editing source code. Critical journeys are covered by
automated tests.

## 2. Migration posture (existing tech → V2)

| Existing [CURRENT] | Decision | Rationale |
|---|---|---|
| Next.js 14 App Router | **Remain** | Correct framework for the target stack |
| Plain JS / JSX | **Migrate → TypeScript** | Type safety across DB, payments, forms is required for a transactional app |
| Tailwind 3 | **Remain** | Fine; keep tokens in `tailwind.config.js` |
| `src/data/*.js` content | **Migrate → Supabase**, keep the helper-function seam | Components already read via `getTrekBySlug`-style helpers; swap their bodies to queries |
| Pattern B `orig-*.html` + jQuery init | **Migrate progressively → React/CMS** | Brittle, coupled; keep only where a full rebuild is not yet justified. New pages are Pattern A only |
| External asset domain (CSS/JS/img) | **Remove → self-host in `public/`** | Removes single point of failure; flip `IMG_BASE` |
| `next.config.mjs` proxy rewrites | **Remove after self-hosting** | Only needed while assets are remote |
| `middleware.js` `.php` rewrite | **Remain** (extend for auth) | Preserves legacy inbound links; add auth gating |
| No DB / auth / email / payment | **Build** | The whole V2 effort |
| Vercel-style deploy | **Remain, re-evaluate** | Good for Next.js; must add env-var + Supabase config (see [V2_DECISIONS.md](V2_DECISIONS.md)) |

**Do not introduce** additional major infra (no separate ORM server, no
second DB, no bespoke auth) — Supabase covers DB, auth, storage, and edge
functions.

## 3. Next.js architecture [PROPOSED]

- **Server Components by default** for all pages; fetch from Supabase server-side
  with the service/anon client as appropriate.
- **Client Components** only for interactivity: search/filter widgets, booking
  form, admin editors, auth forms. Keep the current discipline.
- **Server Actions** for mutations from forms (lead submit, booking create,
  admin CRUD) — no ad-hoc client writes to privileged tables.
- **Route Handlers (`app/api/**`)** reserved for machine callers that cannot use
  Server Actions: **PhonePe callback/webhook**, Resend webhook (optional),
  health checks. This is the one sanctioned exception to "no API routes in repo".
- **Middleware** extended to gate `/admin/**` and `/account/**` via Supabase
  session; keep the legacy `.php` rewrite.
- **Rendering strategy:**
  - Public content (treks, tours, blog, pages) → **static + ISR**
    (`revalidate`), re-validated on admin publish (tag-based revalidation).
  - Per-user pages (`/account/**`, dashboard) → **dynamic** (no cache).
  - Admin → dynamic, auth-gated.
- **Caching:** `revalidateTag`/`revalidatePath` triggered by admin mutations so
  edits appear without a redeploy; user/transaction data never cached.

## 4. Supabase architecture [PROPOSED]

PostgreSQL is the **authoritative** store. **RLS on every table.** Anonymous/
public read only for published content; all writes via Server Actions using an
authenticated context or the service role in trusted server code only.

### Core content tables

| Table | Purpose | Key fields | Relationships | Ownership | RLS |
|---|---|---|---|---|---|
| `treks` | Trek catalog | `id, slug, title, location, state, group, duration, price_from, badge, description, status(draft/published), seo_id` | → `categories`, `tags`, `trek_batches`, `media` | admin | public read where `status=published`; write admin |
| `trek_batches` | Dated departures | `id, trek_id, start_date, end_date, price, seats_total, seats_left, status` | → `treks` | admin | public read published; write admin; seat decrement server-only |
| `trek_itinerary` | Day-by-day + inclusions | `id, trek_id, day_no, title, body, kind(itinerary/inclusion/exclusion)` | → `treks` | admin | public read; write admin |
| `tours` | Tour packages | `id, slug, title, type, duration, price, description, status, seo_id` | → `media` | admin | public read published; write admin |
| `categories` | Trek/tour grouping | `id, slug, name, kind(group/region)` | ←→ `treks` | admin | public read; write admin |
| `tags` | Filter tags | `id, slug, name` | ←→ `treks` (join `trek_tags`) | admin | public read; write admin |
| `pages` | CMS pages (legal, guides, corporate) | `id, slug, title, blocks(jsonb), status, seo_id` | → `seo_meta` | admin | public read published; write admin |
| `blog_posts` | Articles | `id, slug, title, excerpt, body, cover_media_id, author_id, published_at, status, seo_id` | → `profiles`, `blog_categories` | admin/author | public read published; write author/admin |
| `blog_categories` | Blog taxonomy | `id, slug, name` | ←→ `blog_posts` | admin | public read; write admin |
| `testimonials` | Reviews | `id, author_name, body, rating, avatar_media_id, status` | — | admin | public read approved; write admin |
| `faqs` | FAQs | `id, question, answer, category, sort` | — | admin | public read; write admin |
| `media` | Uploaded assets (metadata) | `id, bucket, path, alt, width, height, mime, created_by` | referenced by many | admin | public read; write admin |
| `galleries` | Gallery groupings | `id, slug, title, media_ids(jsonb or join)` | → `media` | admin | public read; write admin |
| `navigation` | Nav + footer trees | `id, group(header/footer), parent_id, label, href, sort` | self-ref | admin | public read; write admin |
| `site_settings` | Singleton-ish key/value | `key, value(jsonb)` (branding, contact, social, hero) | — | admin | public read; write admin |
| `seo_meta` | Per-entity SEO | `id, title, description, canonical, og_image_media_id, schema_type, json_ld(jsonb)` | referenced by content | admin | public read; write admin |

### Transactional / user tables

| Table | Purpose | Key fields | Relationships | Ownership | RLS |
|---|---|---|---|---|---|
| `profiles` | User profile (mirrors `auth.users`) | `id(=auth uid), full_name, phone, role(user/admin/editor)` | → `auth.users` | user/admin | user reads/edits own; admin all |
| `leads` | Contact/enquiry submissions | `id, name, email, phone, subject, message, source, trek_id?, status(new/contacted/closed), created_at` | → `treks?` | admin | insert public (rate-limited); read/update admin only |
| `bookings` | Booking records | `id, user_id?, trek_id, batch_id, pax, amount, status(pending/confirmed/cancelled), lead_id?, created_at` | → `treks`, `trek_batches`, `profiles` | user/admin | user reads own; write server-side; admin all |
| `orders` | Payment order envelope | `id, booking_id, amount, currency, status(created/paid/failed/refunded), phonepe_merchant_txn_id (unique)` | → `bookings` | server | no public write; user reads own via booking; admin all |
| `payments` | Individual payment attempts | `id, order_id, phonepe_txn_id, state, amount, raw_response(jsonb), verified_at` | → `orders` | server | server-only writes; admin read |
| `email_log` | Sent-email audit | `id, to, template, entity_id, status, provider_id, error, created_at` | — | server | admin read; server write |
| `audit_log` | Admin action trail | `id, actor_id, action, entity, entity_id, diff(jsonb), created_at` | → `profiles` | server | admin read; server write |

### Indexes / constraints [PROPOSED]
- Unique: `treks.slug`, `tours.slug`, `pages.slug`, `blog_posts.slug`,
  `orders.phonepe_merchant_txn_id` (idempotency), `payments.phonepe_txn_id`.
- FKs with `on delete` rules (restrict for referenced catalog, cascade for
  child rows like `trek_itinerary`).
- Indexes on `status`, `start_date` (batches), `leads.created_at`,
  `bookings.user_id`.
- Check constraints: `seats_left >= 0`, `price >= 0`, enum-like `status` via
  Postgres enums or check constraints.

### Storage buckets [PROPOSED]
- `public-media` (public read) — trek/tour/gallery/blog images, alt text in
  `media`.
- `private-docs` (authenticated) — any user-uploaded or receipt PDFs, if needed.
- Uploads restricted by size/mime via bucket policy + server validation.

### Database functions / triggers [PROPOSED]
- Trigger: on `auth.users` insert → create `profiles` row.
- Function (RPC, `security definer`): `create_booking_hold(trek_id, batch_id,
  pax)` — atomically checks and decrements `seats_left` to prevent oversell.
- Trigger: on content update → touch `updated_at`; optionally enqueue
  revalidation.

### Edge Functions [PROPOSED — only where needed]
- PhonePe **status-poll / reconciliation** cron (Supabase scheduled function)
  for orders stuck in `pending`.
- Keep the primary PhonePe callback in a **Next.js Route Handler** (co-located
  with app secrets) unless deployment constraints force an edge function.

## 5. Admin / CMS system [PROPOSED]

A dedicated `/admin/**` area, auth-gated (role `admin`/`editor`), server-rendered
with Server Actions for all mutations. Every module: list → create → edit →
delete, with validation and (where noted) draft/published state.

| Module | CRUD | Permissions | Validation | Model | Publishing |
|---|---|---|---|---|---|
| Treks | full | admin/editor | zod schema | `treks`+`trek_itinerary` | draft/published |
| Batches & pricing | full | admin | date/seats/price | `trek_batches` | published only |
| Tours | full | admin/editor | zod | `tours` | draft/published |
| Categories/Tags | full | admin | zod | `categories`,`tags` | n/a |
| Pages (CMS) | full | admin/editor | block schema | `pages` | draft/published |
| Blog | full | author/admin | zod | `blog_posts` | draft/scheduled/published |
| Testimonials | full | admin | zod | `testimonials` | approve/publish |
| FAQs | full | admin/editor | zod | `faqs` | n/a |
| Media/Gallery | upload/replace/delete | admin/editor | mime/size/alt required | `media`,`galleries` | n/a |
| Navigation/Footer | reorder/edit | admin | zod | `navigation` | published |
| Contact details/Settings | edit | admin | zod | `site_settings` | published |
| SEO metadata | edit per entity/route | admin/editor | zod | `seo_meta` | published |
| Leads | view/update status/export | admin | — | `leads` | n/a |
| Bookings | view/update status | admin | — | `bookings` | n/a |
| Orders/Payments | view (read-only) + refund action | admin | — | `orders`,`payments` | n/a |
| Users | view/set role | admin | — | `profiles` | n/a |

## 6. Resend email architecture [PROPOSED]

All transactional email through Resend, sent server-side (Server Action or Route
Handler), never from the client. Each send is recorded in `email_log`.

| Workflow | Trigger | Recipient | Template | Data | Failure handling | Retry | Logging |
|---|---|---|---|---|---|---|---|
| Enquiry received (admin notify) | `leads` insert | admin inbox | `lead-notify` | lead fields | log error, still persist lead | queue retry (cron) | `email_log` |
| Enquiry confirmation | `leads` insert | visitor | `lead-confirm` | name, subject | non-blocking | best-effort | `email_log` |
| Booking confirmation | payment verified | user | `booking-confirm` | booking, batch, amount | alert admin on fail | retry 3× | `email_log` |
| Payment failure | payment failed | user | `payment-failed` | order id, reason | — | 1 retry | `email_log` |
| Account welcome | signup | user | `welcome` | name | non-blocking | — | `email_log` |
| Password reset / magic link | Supabase Auth | user | Supabase-managed or Resend | — | Supabase handles | Supabase | — |
| Admin alert (new booking/payment) | payment verified | admin | `admin-booking` | booking summary | — | retry | `email_log` |

Principles: idempotent (don't double-send on duplicate webhook), templates in
one place, failures never block the primary transaction, all sends logged.

## 7. PhonePe payment architecture [PROPOSED]

> PhonePe API specifics are **[NEEDS VERIFICATION]** — confirm against the
> current PhonePe PG docs and merchant credentials before implementation. Design
> below is provider-agnostic in shape.

### Lifecycle
```
User selects trek + batch + pax
      ↓ (Server Action)
Create booking (status=pending) + order (status=created, unique merchantTxnId)
      ↓ server → PhonePe: initiate payment (signed request, X-VERIFY)
      ↓ redirect user to PhonePe
User pays at PhonePe
      ↓
PhonePe → Route Handler callback/webhook (server-to-server)
      ↓ verify signature (X-VERIFY / checksum) — do NOT trust redirect params
      ↓ server → PhonePe: status check (authoritative)
Update order + payment (paid/failed), decrement seats on success
      ↓ send confirmation email (Resend)
Redirect user to result page (reads DB state, not query params)
```

### Rules
- **Order states:** `created → paid | failed | refunded`.
- **Payment states:** per-attempt `initiated → success | failed | pending`.
- **Idempotency:** `orders.phonepe_merchant_txn_id` unique; callback handler is
  idempotent — duplicate callbacks are a no-op after first terminal state.
- **Verification:** always verify the callback signature **and** re-query PhonePe
  status server-side before marking paid. **Never trust frontend/redirect state.**
- **Pending:** reconciliation cron polls PhonePe for orders stuck `created`.
- **Failures:** record reason, keep booking recoverable, notify user.
- **Refunds:** admin-initiated server action → PhonePe refund API → update
  `orders.status=refunded`, log.
- **Seats:** decrement inside the same transaction that marks the order paid,
  via the `create_booking_hold`/confirm RPC to prevent oversell.

## 8. Database-driven content model [PROPOSED]

Not one generic table. Distinct models per domain (see §4). Relationships:
- `treks` 1—* `trek_batches`, 1—* `trek_itinerary`, *—* `categories`/`tags`.
- `bookings` *—1 `treks`, *—1 `trek_batches`, 1—1 `orders`, 1—* `payments`.
- `pages`/`blog_posts`/`treks`/`tours` 1—1 `seo_meta`.
- `navigation` self-referencing tree for header/footer.
- `media` referenced by content via id (no binaries in Postgres).

## 9. Forms & lead management [PROPOSED]

Every form persists to the DB **first**, then optionally emails. No form is a
dead end (V1's contact form is — see [V1_REPORT.md](V1_REPORT.md#v17-current-email)).

| Form | Fields | Validation | Storage | Email | Spam | Admin |
|---|---|---|---|---|---|---|
| Contact/enquiry | name, email, phone, subject, message | zod (server) | `leads` | notify + confirm | honeypot + rate limit | list, status, export |
| Trek enquiry (CTA) | + trek_id | zod | `leads(source=trek)` | notify | honeypot | linked to trek |
| Booking | trek, batch, pax, contact | zod + seat check | `bookings` | confirm on pay | auth or rate limit | manage |
| Corporate/student | org, contact, size, dates | zod | `leads(source=corp)` | notify | honeypot | list |
| Newsletter (optional) | email | zod | `leads` or Resend audience | — | rate limit | — |

Leads are a first-class model, not email-only, so nothing is lost and follow-up
is possible.

## 10. SEO architecture [PROPOSED]

- Per-entity `seo_meta` (title, description, canonical, OG image, JSON-LD),
  editable in admin, consumed by `generateMetadata`.
- `app/sitemap.ts` — dynamic, generated from published treks/tours/pages/blog.
- `app/robots.ts` — allow public, disallow `/admin`, `/account`, `/api`.
- Structured data: `TravelAgency`/`Organization` (site), `Product`/`Trip` (treks/
  tours), `Article` (blog), `BreadcrumbList`.
- OG images per entity from `media`.
- Fix internal linking (V1 has nav/footer links to non-existent routes).
- Canonical on every page.

## 11. Media architecture [PROPOSED]

- Upload → Supabase Storage `public-media`; metadata row in `media` (alt, dims,
  mime). **No binaries in Postgres.**
- Serve via `next/image` with Supabase domain allow-listed → optimization,
  responsive `srcset`.
- Naming: `{{entity}}/{{uuid}}.{{ext}}`; alt text required at upload.
- Deletion/replacement via admin; orphan cleanup job optional.
- Access: public bucket for site imagery; private bucket for any sensitive docs.

## 12. Error / observability architecture [PROPOSED]

| Layer | Log | Show user | Show admin | Alert |
|---|---|---|---|---|
| App/render errors | server logs + Sentry (optional) | friendly error page | — | on spike |
| Server Action / API errors | logs | generic message | — | — |
| DB errors | logs | generic | — | on repeated |
| Payment errors | `payments.raw_response`, logs | "payment failed, retry" | order/payment detail | **yes** |
| Email errors | `email_log` | nothing (non-blocking) | email log view | on repeated |
| Auth errors | Supabase logs | inline form error | — | — |

Never expose stack traces, SQL, or secrets to users. Standard error envelope for
API/actions (see [V2_DECISIONS.md](V2_DECISIONS.md)).

## 13. Testing strategy [PROPOSED]

- **Unit** (Vitest): validation schemas, pricing/seat math, PhonePe signature
  build/verify, utility functions.
- **Integration:** Supabase queries + RLS (against a test project/branch), Server
  Actions, PhonePe callback handler (mocked provider), Resend send (mocked).
- **E2E** (Playwright): visitor→enquiry, signup, login, browse→booking→payment
  (PhonePe sandbox)→confirmation, admin content create→publish→visible on site.
- **Gate:** type-check + lint + unit on every PR; integration + E2E before
  production. Every V2 feature ships with tests.

## 14. Security architecture [PROPOSED]

- **RLS on all tables**; public read only for `status=published`; writes via
  authenticated Server Actions or trusted server code.
- **Admin authorization** via `profiles.role`, checked in middleware + every
  admin action (defense in depth), not UI-only.
- **API/webhook protection:** PhonePe signature verification; secret in env;
  server-side status re-check.
- **Input validation:** zod at every trust boundary (forms, actions, route
  handlers).
- **Rate limiting** on public writes (leads, booking initiate).
- **Secrets** in env only (Supabase service key, PhonePe keys, Resend key);
  never in client bundles; `NEXT_PUBLIC_` only for anon/publishable keys.
- **Upload restrictions:** mime/size allow-list, no executables.
- **Audit log** for admin mutations and payment state changes.
- Keep `dangerouslySetInnerHTML` author-controlled only; never for user/DB free
  text without sanitization.

See [V2_ROADMAP.md](V2_ROADMAP.md) for phasing and [V2_DECISIONS.md](V2_DECISIONS.md)
for the conventions that make these repeatable.
