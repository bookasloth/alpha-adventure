# V2 Phased Roadmap — Alpha Adventures

> All **[PROPOSED]**. Sequence is derived from the actual repo: it is a complete
> static front-end with **no backend**, and it **loses leads today** while
> **depending on an external domain to render**. So the roadmap front-loads
> (a) stopping data loss and (b) removing the availability risk, then builds the
> dynamic platform bottom-up (foundation → data → dynamic site → auth → leads →
> payments → email → SEO → hardening → launch).
>
> Priority: **P0** before production · **P1** important · **P2** useful ·
> **P3** later. Complexity: S/M/L.

---

## Phase 0 — Stop the bleeding (P0, S) — *do first, independent of V2*
**Objective:** stop losing leads and remove the single point of failure before
any big build.
- **Tasks:** make the contact form persist (interim: a single Server Action +
  one `leads` table, or a form service) so enquiries stop vanishing; self-host
  the legacy CSS/JS/image bundle into `public/` and flip `IMG_BASE` →
  `/assets/img`, remove proxy rewrites; fix nav/footer links that fall to the
  catch-all placeholder.
- **Files:** `orig-contact.html`/new action, `next.config.mjs`,
  `src/lib/assets.js`, `src/data/site.js`, `public/`.
- **DB:** minimal `leads` (or defer to Phase 5 if standing up Supabase now).
- **Tests:** form submit persists; site renders with assets local.
- **Acceptance:** no enquiry is discarded; site renders with the external domain
  blocked.
- **Risks:** asset paths mismatch; verify every referenced asset exists locally.

## Phase 1 — Foundation (P0, M)
**Objective:** production-ready skeleton for the target stack.
- **Deps:** none.
- **Tasks:** add **TypeScript** (incremental `allowJs`, migrate as you touch);
  create Supabase project + local dev/branch; add env-var config + `.env.example`;
  Supabase clients (server/anon); Vitest + Playwright + lint/type-check in CI;
  base error envelope + zod.
- **Systems:** `jsconfig`→`tsconfig`, `src/lib/supabase/*`, CI workflow.
- **DB:** empty schema + migrations tooling.
- **Tests:** CI green on a trivial unit + one E2E smoke.
- **Acceptance:** type-check, lint, build, one test all pass in CI; Supabase
  reachable server-side.
- **Risks:** JS→TS friction; keep incremental.

## Phase 2 — Database + CMS core (P0, L)
**Objective:** content tables + admin to manage them; migrate `src/data/*` in.
- **Deps:** Phase 1.
- **Tasks:** schema for `treks, trek_batches, trek_itinerary, tours, categories,
  tags, pages, testimonials, faqs, media, galleries, navigation, site_settings,
  seo_meta` with RLS; seed from current `src/data/*.js`/`orig-*.html`; admin
  auth-gate + CRUD for treks/tours/batches/pages/settings/nav/media; Storage
  buckets.
- **Systems:** `/admin/**`, Server Actions, `supabase/migrations`.
- **DB:** all core content tables + RLS + indexes.
- **Tests:** RLS (public read published only), admin CRUD integration, seed
  parity (DB matches old static data).
- **Acceptance:** every current static content type is editable in admin and
  stored in Supabase.
- **Risks:** RLS mistakes → build tests first; content migration fidelity.

## Phase 3 — Dynamic public website (P0, M)
**Objective:** public pages read from Supabase, not source files.
- **Deps:** Phase 2.
- **Tasks:** swap `getTrekBySlug`/`getTourBySlug`/listing helpers to Supabase
  queries (same shape → minimal component change); ISR + tag revalidation on
  admin publish; render nav/footer/settings from DB; dynamic `[slug]` params
  from DB; progressively rebuild high-value Pattern B pages as Pattern A.
- **Systems:** `src/data/*` → query modules, `src/app/**`.
- **Tests:** listing/detail render from DB; publish → revalidate visible;
  unknown slug → 404.
- **Acceptance:** removing `src/data/*.js` content does not change the rendered
  site (data now comes from DB).
- **Risks:** revalidation correctness; cache staleness.

## Phase 4 — Authentication & authorization (P1, M)
**Objective:** real accounts + role-based admin.
- **Deps:** Phase 1 (2 for `profiles`).
- **Tasks:** Supabase Auth (email/password + magic link); `profiles` + role;
  middleware gating `/admin`/`/account`; replace `/user-dashboard` mock with a
  real account area; welcome email hook (stub until Phase 7).
- **DB:** `profiles` + auth trigger + RLS.
- **Tests:** signup, login, protected-route redirect, role enforcement (E2E +
  RLS).
- **Acceptance:** only admins reach `/admin`; users see only their own data.
- **Risks:** session handling in App Router; test middleware carefully.

## Phase 5 — Forms & lead management (P0→P1, M)
**Objective:** all forms persist + notify; leads managed in admin.
- **Deps:** Phase 2 (leads table), Phase 7 for email (can stub).
- **Tasks:** `leads` model; Server Actions for contact/trek/corporate/student
  forms with zod + honeypot + rate limit; admin leads list/status/export.
- **DB:** `leads` + RLS (public insert, admin read).
- **Tests:** submit persists, validation rejects, admin sees lead, spam blocked.
- **Acceptance:** no form is a dead end; every submission is stored.
- **Risks:** spam; rate-limit tuning.

## Phase 6 — Payments (PhonePe) (P0 if booking required, L)
**Objective:** server-verified booking + payment.
- **Deps:** Phases 2, 3, 4, 5.
- **Tasks:** `bookings/orders/payments` + seat-hold RPC; booking Server Action;
  PhonePe initiate + **Route Handler callback** with signature verify + status
  re-check; idempotent handling; reconciliation cron; admin read + refund.
  **[NEEDS VERIFICATION]** against PhonePe PG docs/credentials.
- **DB:** transactional tables + constraints (unique merchantTxnId, seats ≥ 0).
- **Tests:** sandbox success/failure/duplicate-callback/oversell; state never
  trusted from frontend.
- **Acceptance:** payment state is DB-authoritative and signature-verified; no
  oversell; duplicates are no-ops.
- **Risks:** highest-risk phase; do TDD, use sandbox, verify server-side always.

## Phase 7 — Email automation (Resend) (P1, M)
**Objective:** transactional emails wired to events.
- **Deps:** Phases 5, 6.
- **Tasks:** Resend integration server-side; templates (lead notify/confirm,
  booking confirm, payment failed, welcome, admin alert); `email_log`; non-
  blocking sends + retry.
- **Tests:** each trigger sends once (idempotent), failures logged & non-
  blocking.
- **Acceptance:** required transactional emails fire and are logged.
- **Risks:** domain/DNS verification for Resend; double-send on webhooks.

## Phase 8 — SEO (P1, M)
**Objective:** dynamic, admin-managed SEO + discoverability.
- **Deps:** Phases 2, 3.
- **Tasks:** `seo_meta` consumed by `generateMetadata`; `app/sitemap.ts`,
  `app/robots.ts`; JSON-LD (Organization/Trip/Article/Breadcrumb); OG images;
  canonical everywhere; fix internal linking.
- **Tests:** metadata present per route, sitemap lists published entities,
  robots blocks admin/api.
- **Acceptance:** every public page has title/desc/canonical/OG + schema; sitemap
  & robots served.
- **Risks:** low.

## Phase 9 — Testing hardening (P1, M) — *continuous, gated here*
**Objective:** critical journeys covered; regression net.
- **Deps:** all prior.
- **Tasks:** fill E2E for visitor→enquiry, signup/login, booking→payment→
  confirm, admin publish→visible; coverage on money/seat/validation logic.
- **Acceptance:** all critical journeys have passing automated tests in CI.

## Phase 10 — Performance & security hardening (P0/P1, M)
**Objective:** production-safe and fast.
- **Deps:** all prior.
- **Tasks:** `next/image` for all media, caching/ISR review, bundle audit; RLS
  review, rate limiting, secret audit, upload restrictions, audit log, security
  review of PhonePe/webhooks; add Sentry/observability if adopted.
- **Tests:** security review, RLS review, Lighthouse pass.
- **Acceptance:** no exposed secrets, RLS verified, payments verified, error/
  loading/empty states everywhere.

## Phase 11 — Production launch (P0, S)
**Objective:** go live.
- **Deps:** all prior.
- **Tasks:** prod env vars, Supabase prod, PhonePe prod creds, Resend verified
  domain, DNS, final content, smoke tests, rollback plan, docs updated.
- **Acceptance:** Definition of Done in [V2_MASTER_PLAN.md](V2_MASTER_PLAN.md#definition-of-done)
  met; final diff reviewed; no blocking issues.

---

## Dependency graph (summary)
```
Phase 0 (independent, do now)
Phase 1 → 2 → 3 → 8
             2 → 4 → 6
             2 → 5 → 6 → 7
   all → 9 → 10 → 11
```

## Priority rollup
- **P0:** Phase 0, 1, 2, 3, 6 (if booking), 10, 11.
- **P1:** Phase 4, 5, 7, 8, 9.
- **P2:** shop, blog richness, wishlist (proposal add-ons).
- **P3:** loyalty/referral, multi-language, analytics dashboards, team page.
