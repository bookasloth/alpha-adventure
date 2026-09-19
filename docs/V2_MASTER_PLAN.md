# V2 Master Plan — Alpha Adventures

> Primary implementation document for V2. Consolidates the audit and proposal.
> Tags: **[CURRENT]** confirmed from code · **[PROPOSED]** V2 target ·
> **[NEEDS VERIFICATION]** unconfirmed. Deep detail lives in the linked docs;
> this file is the single entry point.
>
> Companions: [V1_REPORT.md](V1_REPORT.md) ·
> [DYNAMIC_CONTENT_AUDIT.md](DYNAMIC_CONTENT_AUDIT.md) ·
> [V2_PROPOSAL.md](V2_PROPOSAL.md) · [V2_ROADMAP.md](V2_ROADMAP.md) ·
> [V2_DECISIONS.md](V2_DECISIONS.md).

## 1. Executive summary
Alpha Adventures is a **static Next.js 14 brochure site with no backend**
[CURRENT]. The front-end is largely complete and faithful, but every "dynamic",
"admin", "booking", "payment", "account" and "confirmation" capability the client
scope called for is **absent**. Two issues are urgent regardless of the larger
build: the **contact form discards every enquiry**, and the site **hot-links all
assets from an external domain** (single point of failure). V2 turns this into a
**dynamic, database-driven platform** on **Next.js + TypeScript + Supabase +
Resend + PhonePe**, where content and operations are managed without code edits.

## 2. Current V1 state
See [V1_REPORT.md](V1_REPORT.md). Key facts [CURRENT]:
- Next.js 14 App Router, React 18, Tailwind 3, **plain JS**; 3 runtime deps.
- Content hardcoded in `src/data/*.js` + `orig-*.html`; **no DB, no fetch, no
  env, no API routes**.
- **No auth** (`/user-dashboard` is a static mock), **no payments** (PhonePe not
  integrated), **no email** (Resend not integrated; contact form `alert()`s and
  discards input).
- SEO = title/description only; **no sitemap/robots/OG/JSON-LD/canonical**.
- All assets proxied/hot-linked from `alpha.thegreyhawks.com`.

## 3. Target V2 state
A fully dynamic platform: public site + account area + admin/CMS, Supabase as the
authoritative data layer with RLS, server-verified PhonePe payments, Resend
transactional email, dynamic SEO, managed media, and automated tests on critical
journeys. **No business content in source code.** See
[V2_PROPOSAL.md](V2_PROPOSAL.md).

## 4. Architecture
Next.js App Router: Server Components by default; Client Components only for
interactivity; **Server Actions** for mutations; **Route Handlers** only for
PhonePe/webhooks/health; middleware gates `/admin` and `/account`; public content
**static + ISR** with tag revalidation on publish; private/transactional pages
dynamic. Detail: [V2_PROPOSAL.md §3](V2_PROPOSAL.md#3-nextjs-architecture-proposed).

## 5. Database strategy
Supabase/PostgreSQL, RLS on every table, public read only for `status=published`,
writes server-side. Content tables (treks, batches, itinerary, tours, categories,
tags, pages, blog, testimonials, faqs, media, galleries, navigation,
site_settings, seo_meta) + transactional tables (profiles, leads, bookings,
orders, payments, email_log, audit_log). Full schema, keys, indexes, buckets,
triggers, RPC (seat-hold): [V2_PROPOSAL.md §4](V2_PROPOSAL.md#4-supabase-architecture-proposed).

## 6. Dynamic content strategy
Migrate `src/data/*` and `orig-*.html` into the DB; keep the existing helper-
function seam so components change minimally. Per-block static/dynamic/admin/
user/auto/external classification: [DYNAMIC_CONTENT_AUDIT.md](DYNAMIC_CONTENT_AUDIT.md).

## 7. Admin / CMS strategy
Auth-gated `/admin/**`, Server Actions, per-module CRUD + validation + draft/
published where relevant, for treks/batches/tours/categories/pages/blog/
testimonials/faqs/media/nav/settings/SEO/leads/bookings/orders/users.
[V2_PROPOSAL.md §5](V2_PROPOSAL.md#5-admin--cms-system-proposed).

## 8. Authentication
Supabase Auth; `profiles.role`; three-layer authorization (middleware + action +
RLS). Replace the mock dashboard with a real account area.
[V2_PROPOSAL.md §14](V2_PROPOSAL.md#14-security-architecture-proposed) ·
[V2_DECISIONS.md](V2_DECISIONS.md).

## 9. Forms / leads
Every form persists to `leads`/`bookings` first, then notifies. zod + honeypot +
rate limit; admin manages leads. [V2_PROPOSAL.md §9](V2_PROPOSAL.md#9-forms--lead-management-proposed).

## 10. Resend
Server-side transactional email, logged in `email_log`, non-blocking, idempotent:
enquiry notify/confirm, booking confirm, payment failed, welcome, admin alert.
[V2_PROPOSAL.md §6](V2_PROPOSAL.md#6-resend-email-architecture-proposed).

## 11. PhonePe
Server-verified lifecycle: create booking+order → initiate → callback (verify
signature + re-check status) → update DB → confirm email. Idempotent, no
oversell, reconciliation cron, admin refund. **API specifics [NEEDS
VERIFICATION]** against PhonePe PG docs. [V2_PROPOSAL.md §7](V2_PROPOSAL.md#7-phonepe-payment-architecture-proposed).

## 12. SEO
`seo_meta` per entity → `generateMetadata`; dynamic `sitemap.ts`/`robots.ts`;
JSON-LD; canonical/OG; fix internal linking.
[V2_PROPOSAL.md §10](V2_PROPOSAL.md#10-seo-architecture-proposed).

## 13. Media
Supabase Storage + `media` metadata rows; `next/image`; alt required.
[V2_PROPOSAL.md §11](V2_PROPOSAL.md#11-media-architecture-proposed).

## 14. Security
RLS everywhere; server-only privileged writes; PhonePe signature verification;
zod validation; rate limiting; secrets in env; upload restrictions; audit log;
`dangerouslySetInnerHTML` author-controlled only.
[V2_PROPOSAL.md §14](V2_PROPOSAL.md#14-security-architecture-proposed).

## 15. Testing
Unit (Vitest) / integration (Supabase+RLS, actions, payments, email) / E2E
(Playwright) for critical journeys; CI gates. Every feature ships with tests.
[V2_PROPOSAL.md §13](V2_PROPOSAL.md#13-testing-strategy-proposed).

## 16. Performance
Self-host assets; `next/image`; ISR + tag revalidation; bundle audit; pin legacy
libs. Baseline **NOT MEASURED** — measure in Phase 10.

## 17. Deployment
Keep Vercel-style hosting for Next.js; add env-var config, Supabase prod project,
PhonePe prod creds, Resend verified domain. Remove external-asset rewrites once
self-hosted. Re-evaluate only if a constraint appears; no new major infra.

## 18. Roadmap
Phase 0 stop-the-bleeding → 1 foundation → 2 DB+CMS → 3 dynamic site → 4 auth →
5 forms/leads → 6 payments → 7 email → 8 SEO → 9 testing → 10 perf/security →
11 launch. Full tasks/acceptance/risks: [V2_ROADMAP.md](V2_ROADMAP.md).

## 19. Dependencies
```
0 (now, independent)
1 → 2 → 3 → 8
       2 → 4 → 6
       2 → 5 → 6 → 7
   all → 9 → 10 → 11
```

## 20. Risks
- **Data loss (live):** contact form discards enquiries — P0.
- **Availability (live):** external-asset dependency — P0.
- **Payments:** highest-complexity; server verification + idempotency mandatory;
  PhonePe API **[NEEDS VERIFICATION]**.
- **RLS mistakes:** test-first; RLS is the security backstop.
- **JS→TS + Pattern B migration:** do incrementally to avoid regressions.
- **Content migration fidelity:** seed-parity tests.

## 21. Decisions
Standing conventions in [V2_DECISIONS.md](V2_DECISIONS.md): TypeScript; Supabase
authoritative; DB access server-only; Server Components default; mutations via
Server Actions; Supabase Auth + 3-layer authz; zod validation; standard error
envelope; server-verified payments; server-side logged email; forms persist
first; media in Storage; data-driven SEO; ISR caching; mandatory tests; env
secrets; self-hosted assets.

## Definition of Done
V2 is complete only when:
- Content is appropriately database-driven; admin manages intended dynamic
  content; **Supabase is authoritative**.
- Auth/authorization implemented where required (RLS + middleware + action).
- Resend handles required transactional email; **PhonePe** payments run through a
  **server-verified** flow; payment state is persisted and verified.
- Forms persist important submissions (no dead ends).
- SEO is dynamic where appropriate; media managed; security controls in place.
- Error, loading, and empty states exist.
- Critical journeys have automated tests; feature + regression tests pass.
- Type-check, lint, and production build pass.
- Documentation updated; final git diff reviewed; no known blocking issues.
