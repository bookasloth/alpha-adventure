# CLAUDE.md — Alpha Adventures

Operating manual for AI agents and developers. Keep it accurate; when a topic
gets deep, follow the link into `docs/`. Some deep `docs/` files predate the
backend build and may lag — this file is the source of truth on conflict.

## 1. Project identity
Trekking & travel platform for **Alpha Adventures** (Nagpur, Maharashtra), a
Next.js rebuild of the live PHP site at `https://alpha.thegreyhawks.com`. It is
now a **full application, not a static site**: Supabase backend (Postgres +
Auth + RLS + Storage), email-OTP accounts, a guest-first booking engine
(payment currently mocked; PhonePe pending), transactional email, and an
admin dashboard. Enquiries also go out via WhatsApp/phone links and the
migrated contact form.

## 2. Tech stack
Next.js 14 (App Router) · React 18 · Tailwind CSS 3 · **TypeScript, migrating
incrementally** — `.ts/.tsx` and legacy `.js/.jsx` coexist (`allowJs`), migrate
files as you touch them. Supabase (`@supabase/ssr`, `@supabase/supabase-js`) ·
zod · recharts · nodemailer + Brevo HTTP API · Playwright + Vitest. Legacy
jQuery/Bootstrap/GSAP template runtime still powers Pattern B pages. Full list:
[docs/TECH_STACK.md](docs/TECH_STACK.md).

## 3. Architecture summary
Two rendering patterns coexist — know which you are editing:
- **Pattern A — React/data-driven:** homepage, trek/tour listings & detail
  pages. Rendered from JS data in `src/data/*.js` and/or Supabase queries.
- **Pattern B — verbatim HTML injection:** legacy pages served by reading
  `src/data/orig-*.html` with `fs.readFileSync` and injecting via
  `dangerouslySetInnerHTML`, then re-running the page's jQuery init from a
  `*-init.js` string via a `*Scripts.jsx` client component.

Assets are **self-hosted** under `public/assets` (`IMG_BASE = "/assets/img"` in
`src/lib/assets.js`) — the old hard dependency on the live domain for CSS/JS/
images is resolved. `next.config.mjs` still lists `alpha.thegreyhawks.com` as a
`next/image` remote pattern and holds legacy `.php`→route redirects. Details:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 4. Important directories
- `src/app/**` — App Router routes (`page.jsx`/`page.tsx` per route), incl.
  `login`, `signup`, `book`, `account`, `user-dashboard`, `admin`, `api`.
- `src/app/admin/**` — admin dashboard: `data.ts` (server fetch + `requireAdmin`
  gate), `AdminShell.tsx` (client UI), `Charts.tsx`, `GalleryPage.tsx`.
- `src/app/api/leads/route.ts` — contact/enquiry lead capture (only API route).
- `src/domain/booking/**` — booking pricing/state/service + tests.
- `src/lib/` — `assets.js` (image base), `mailer.ts` (Brevo API + SMTP
  fallback), `email.ts`, `otp.ts` (self-mint OTP), `after.ts` (`background()`
  non-blocking sends via Vercel `waitUntil`), `galleryDetailHtml.js`.
- `src/utils/supabase/` — `server.ts` (SSR client), `admin.ts` (service-role,
  server-only), `middleware.ts`.
- `src/data/*.js` — static content (treks, tours, gallery, site config); some
  content is also served from Supabase. `orig-*.html` + `*-init.js` — Pattern B.
- `supabase/migrations/**` — schema, RLS, seeds (`0001`–`0011`).
Full map: [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md).

## 5. Important commands
```bash
npm run dev              # local dev (localhost:3000; .claude/launch.json auto-ports)
npm run build            # production build
npm run start            # serve production build
npm run lint             # next lint
npm run typecheck        # tsc --noEmit
npm run test             # vitest unit tests
npm run test:integration # vitest integration config
npm run test:e2e         # playwright
```

## 6. Development workflow
Static content: edit `src/data/*.js` (Pattern A) or the matching `orig-*.html`
(Pattern B). Dynamic content/bookings/auth flow through Supabase (migrations +
Server Actions). See [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)
and [docs/FEATURES.md](docs/FEATURES.md).

## 7–11. Conventions (coding / naming / component / API / DB)
- New code in TypeScript where practical; `.js/.jsx` legacy stays until touched.
  `@/` alias → `src/`. Components: PascalCase. Data files: kebab-case. Routes:
  kebab-case dirs.
- Server components by default; add `"use client"` only for interactivity.
- **API/mutations:** one Route Handler (`app/api/leads`); everything else is
  **Server Actions** (`src/app/login/actions.ts`, `src/app/book/actions.ts`).
- **DB:** Supabase Postgres. Read with the SSR client (RLS-scoped) for
  user-facing paths; use the **service-role client only server-side, behind an
  auth/role gate** (e.g. admin). Amounts are stored as **paise** (`bigint`).
- Image URLs come from `img()` in `src/lib/assets.js` — never hardcode a host.

## 12–14. Auth / authorization / validation
- **Auth:** Supabase email-OTP. The code is self-minted via
  `admin.generateLink` and delivered by our own mailer (Brevo/SMTP), not
  Supabase's email — see `src/lib/otp.ts`. Login redirects **server-side** after
  `verifyOtp` (`src/app/login/actions.ts`); a client redirect does not reliably
  navigate after a Server Action auth.
- **Authorization:** `user_roles` (`customer`/`staff`/`admin`) + `is_admin()`/
  `is_staff()` SQL helpers. `/admin` is gated by `requireAdmin()` in
  `src/app/admin/data.ts`; `/user-dashboard` and `/account` require a session.
- `/user-dashboard` is a **real authenticated area** (not a mock).
- **Validation:** zod (`src/domain/booking/schema.ts`, `src/utils/lead.ts`).
- Details: [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md),
  [docs/AUTHORIZATION.md](docs/AUTHORIZATION.md).

## 15. Error handling
`not-found.jsx` for 404s; dynamic routes call `notFound()`. Server Actions
return `{ ok: false, error }` result objects. Background sends
(`src/lib/after.ts`) log failures rather than throwing into the request.

## 16. Testing
Vitest (unit + `vitest.integration.config.ts`) and Playwright e2e. Booking
domain has unit + integration tests under `src/domain/booking/`. See
[docs/TESTING.md](docs/TESTING.md).

## 17. Security — READ BEFORE EDITING PATTERN B
`dangerouslySetInnerHTML` renders `orig-*.html` and `galleryDetailHtml()`
output. Safe **only because the HTML is static and author-controlled** — never
feed user input, query params, or fetched content into these paths. Also:
`src/utils/supabase/admin.ts` (service role) is **server-only** and bypasses
RLS — never import it into a client component or use it without a role gate.
See [docs/SECURITY.md](docs/SECURITY.md).

## 18. Performance
Legacy CSS/JS bundle is large. Transactional email sends are **non-blocking**
(`background()` + Vercel `waitUntil`) so OTP/booking responses don't wait on
the mail provider. See [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

## 19. UI / design rules
Tailwind tokens in `tailwind.config.js` (`primary #fe5100`, `accent #FFB52A`,
`dark/ink #110F0F`). Reuse legacy `style.css` classes (`btn-primary`, `card`,
`section-title`, `container-px`) and the shadcn-style `src/components/ui/*`
primitives. See [docs/UI_SYSTEM.md](docs/UI_SYSTEM.md).

## 20. SEO
Per-route `metadata` / `generateMetadata`; helpers in `src/lib/seo.ts`. Root
template title `%s | Alpha Adventures`. Env-safe sitemap. `/admin` is `noindex`.

## 21. Deployment
Vercel-style hosting. Set all env vars (§22) in the host — including
`BREVO_API_KEY` and `EMAIL_FROM` — since `.env.local` is gitignored. The Brevo
account's authorised-IP restriction must be **off** (serverless IPs rotate).
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 22. Environment variables
Read server-side (see `.env.example`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY`, `EMAIL_FROM`,
`ADMIN_NOTIFY_EMAIL`, and the `SMTP_*` fallback. See
[docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md).

## 23. Important business rules
Bookings are real records: seats, pricing (adult/child), and status live in the
DB (`src/domain/booking`). Payment is currently **mocked** (`confirmMockPayment`);
PhonePe is the planned server-verified flow. Amounts are **paise** integers in
the DB, formatted to ₹ in the UI. Trek `group`/`tags`/`state` drive filtering.
Full rules: [docs/BUSINESS_LOGIC.md](docs/BUSINESS_LOGIC.md).

## 24. Dangerous areas — do not change casually
- `src/lib/assets.js` + `next.config.mjs` — break every asset if wrong.
- `orig-*.html` + matching `*-init.js` — coupled by CSS classes/IDs.
- `src/components/TemplateScripts.jsx` load order — jQuery must load first.
- `src/utils/supabase/admin.ts` — service role; server-only, gate every use.
- `supabase/migrations/**` + RLS — an RLS mistake exposes customer data.

## 25. Known technical debt
[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md). Highlights: payment is mocked
(PhonePe pending); admin catalog (treks/tours/gallery) and create-modals are
not yet persisted to the DB; duplicate `IMG_BASE` in
`BackpackingTripsClient.jsx`; incremental TS migration ongoing; stray dev
`*.log` files.

## 26. Docs index
[docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) — the full map.
