# V2 Decisions — Standing Conventions

> Decisions that become **permanent project conventions** so future work needs
> fewer architectural choices. All **[PROPOSED]** until adopted. When a decision
> is settled, treat it as binding; deviations require a new decision here.

---

## Decision: Language is TypeScript
### Recommended Standard
All new and touched code is TypeScript. Migrate `src/data/*.js` and components
incrementally (`allowJs` during transition).
### Why
A transactional app (payments, auth, DB) needs type safety across Supabase rows,
form schemas, and money handling.
### Applies To
Everything except vendored legacy `orig-*.html`/`*-init.js` runtime strings.
### Exceptions
Legacy Pattern B init strings stay as-is until the page is rebuilt.

---

## Decision: Supabase is the single authoritative data layer
### Recommended Standard
PostgreSQL via Supabase holds all business data. No second datastore, no ORM
server. Content lives in the DB, not source files.
### Why
Meets the "no content in code" goal and covers DB + Auth + Storage + functions
without extra infra.
### Applies To
Treks, tours, batches, leads, bookings, payments, users, CMS content, settings.
### Exceptions
Build-time constants (enum labels, feature flags) may stay in code.

---

## Decision: Where database access happens
### Recommended Standard
DB access only in **server code** — Server Components (reads) and Server Actions
/ Route Handlers (writes), through `src/lib/supabase/`. No direct privileged
writes from client components.
### Why
Centralizes auth context, keeps the service key server-side, enables validation
and RLS enforcement.
### Applies To
All queries and mutations.
### Exceptions
Client may use the **anon** client for public reads or realtime where RLS makes
it safe.

---

## Decision: Server Components by default, Client only for interactivity
### Recommended Standard
Default to Server Components. Add `"use client"` only for state/interaction
(search, forms, editors).
### Why
Smaller bundles, better SEO, matches current codebase discipline.
### Applies To
All components.
### Exceptions
Interactive widgets and admin editors.

---

## Decision: Mutations via Server Actions; API routes only for machines
### Recommended Standard
Form/admin mutations use Server Actions. `app/api/**` is reserved for external
callers that cannot use actions (PhonePe callback, webhooks, health).
### Why
Keeps the app surface small and typed; avoids ad-hoc endpoints (the repo has
none today — keep it that way except where required).
### Applies To
All writes.
### Exceptions
PhonePe callback, provider webhooks, health checks.

---

## Decision: Authentication & authorization
### Recommended Standard
Supabase Auth for identity. Roles in `profiles.role`. Authorization checked in
**both** middleware (route gate) and each privileged action (defense in depth),
plus **RLS** at the DB. UI hiding is never the security boundary.
### Why
Three independent layers; RLS is the backstop even if app code is wrong.
### Applies To
`/admin/**`, `/account/**`, all privileged mutations.
### Exceptions
None for privileged resources.

---

## Decision: Validation with zod at every trust boundary
### Recommended Standard
One zod schema per input shape; validate on the server in every Server Action
and Route Handler. Client-side validation is UX only.
### Why
Single validation library, reusable schemas, safe boundaries.
### Applies To
Forms, actions, webhooks.
### Exceptions
None.

---

## Decision: Standard API/action response + error envelope
### Recommended Standard
Actions/handlers return `{ ok: true, data } | { ok: false, error: { code,
message } }`. User-facing messages are generic; details go to logs. No stack
traces or SQL to clients.
### Why
Predictable handling, no leakage.
### Applies To
All actions and route handlers.
### Exceptions
None.

---

## Decision: Payments are server-verified, never frontend-trusted
### Recommended Standard
Payment state is set only after **signature verification + server-side status
re-check** with PhonePe. Callback handlers are **idempotent** (unique
`merchantTxnId`). Frontend/redirect params never determine paid status.
### Why
Prevents spoofed/duplicate payment confirmation and oversell.
### Applies To
All payment flows.
### Exceptions
None.

---

## Decision: All email is transactional, server-side, logged, non-blocking
### Recommended Standard
Send via Resend from server code only; log every send in `email_log`; email
failures never block the primary transaction; sends are idempotent.
### Why
Reliability + auditability; a failed email must not fail a booking.
### Applies To
All email.
### Exceptions
None.

---

## Decision: Forms persist before they notify
### Recommended Standard
Every form writes to the DB (`leads`/`bookings`) first; email is secondary.
### Why
V1's contact form discards enquiries — never repeat that.
### Applies To
All public forms.
### Exceptions
None.

---

## Decision: Media in Supabase Storage, metadata in Postgres
### Recommended Standard
Binaries in Storage buckets; a `media` row per asset (path, alt, dims, mime).
Serve via `next/image`. Alt text required at upload.
### Why
Postgres is not a blob store; enables optimization + accessibility.
### Applies To
All images/uploads.
### Exceptions
Tiny inline SVG icons may stay in code.

---

## Decision: SEO is data-driven and admin-managed
### Recommended Standard
`seo_meta` per entity feeds `generateMetadata`; dynamic `sitemap.ts`/`robots.ts`;
JSON-LD per type; canonical everywhere.
### Why
Discoverability without redeploys; fixes V1's title-only SEO.
### Applies To
All public routes.
### Exceptions
Admin/account/api routes (no-index).

---

## Decision: Caching = static + ISR for public, dynamic for private
### Recommended Standard
Public content cached with ISR + tag revalidation on admin publish. User/
transaction pages are dynamic/uncached.
### Why
Fast public pages that still update on edit; always-fresh private data.
### Applies To
All rendering.
### Exceptions
None.

---

## Decision: Testing is mandatory per feature
### Recommended Standard
Unit (Vitest) for logic/validation/money; integration for DB/RLS/actions/
payments/email; E2E (Playwright) for critical journeys. CI gates type-check +
lint + unit on every PR.
### Why
Transactional correctness and regression safety.
### Applies To
Every V2 feature.
### Exceptions
Trivial one-liners.

---

## Decision: Secrets & env vars
### Recommended Standard
All secrets in env (Supabase service key, PhonePe keys, Resend key). Only
anon/publishable keys may be `NEXT_PUBLIC_`. Maintain `.env.example`. Never in
client bundles or the repo.
### Why
V1 reads no env at all; V2 must handle secrets correctly from day one.
### Applies To
All configuration.
### Exceptions
None.

---

## Decision: Naming & structure conventions (kept from V1)
### Recommended Standard
PascalCase component files, kebab-case data/routes, `@/` → `src/`. New data
access in `src/lib/`; admin under `src/app/admin/**`; actions co-located or in
`src/actions/**`.
### Why
Consistency with the existing codebase.
### Applies To
All files.
### Exceptions
None.

---

## Decision: Self-host assets; no runtime dependency on external domains
### Recommended Standard
All CSS/JS/images/fonts served from `public/` or Supabase Storage. No hot-linking
to `alpha.thegreyhawks.com`. Legacy libs pinned in `package.json` and bundled.
### Why
V1's single point of failure; removes availability + supply-chain risk.
### Applies To
All assets and third-party libs.
### Exceptions
CDN-hosted fonts via a documented, pinned source.
