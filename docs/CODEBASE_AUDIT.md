# Codebase Audit — Alpha Adventures (pre-booking)

> Read-only. Covers Parts 1–2, 14–15 of the audit brief. Companion:
> [SUPABASE_AUDIT.md](SUPABASE_AUDIT.md), [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## 1. Discovery — what actually exists

**Stack [CURRENT]:** Next.js 14 App Router, React 18, Tailwind 3. TypeScript
introduced (strict tsconfig, `typescript@5`) but **incremental** — 7 `.ts`/`.tsx`
vs 96 `.js`/`.jsx`. Deps: `@supabase/supabase-js`, `@supabase/ssr`, `zod`.
Test: vitest + playwright. Lint: eslint + next config. CI: `.github/workflows/ci.yml`.

**Supabase wiring [CURRENT]:**
- `src/utils/supabase/server.ts` — SSR server client (cookie-bound).
- `src/utils/supabase/client.ts` — browser client.
- **Only consumer:** `src/app/api/leads/route.ts` (insert `leads`).
- **No** middleware auth, **no** session handling, **no** generated DB types.

**Search results (booking/otp/payment/vendor/auth/etc.):** every hit outside the
two supabase clients + the leads route is in **static content** (`src/data/orig-*.html`,
`src/data/*.js`) — marketing copy containing the words "booking"/"payment", not
executable logic. **NOT VERIFIED that any booking/OTP/payment/auth code exists —
because it does not.**

**Migrations:** `supabase/migrations/0001…0005` (leads, core schema, RLS, seed,
decisions). Applied to the live DB **manually** (not via CLI in CI) — 0001
confirmed applied (a live lead insert returned 200 earlier); 0002–0005 live state
**NOT VERIFIED**.

## 2. Architecture

**Frontend [CURRENT]:** two rendering patterns (A: React from `src/data/*.js`;
B: verbatim legacy HTML injected via `dangerouslySetInnerHTML` + jQuery init).
Server Components by default; a few client components. Content is **build-time
static**, not DB-driven.

**Backend [CURRENT]:** essentially none. One Route Handler (`/api/leads`). No
server actions, no other API routes, no edge functions in-repo.

**Data access [CURRENT]:** static imports for content; a single server-client
insert for leads. **No repository/service layer.** When the DB is wired, the
current pattern (client created inline in the route) is acceptable but there is
**no centralised data-access module** yet — a risk if queries spread into
components.

**Auth architecture [CURRENT]:** **none in the app.** DB has `profiles` +
`user_roles` + `handle_new_user` trigger + role helpers, but **no login/signup/
session/middleware** consumes them. `/user-dashboard` is a static HTML mock.

**Authorization [CURRENT]:** enforced **only at the DB** (RLS + `is_staff/
is_admin`). No app-layer checks because there is no app auth yet. This is fine as
a backstop but there is **nothing in front of it**.

**Validation [CURRENT]:** `zod` present; used in `src/utils/lead.ts`
(`leadSchema`). Error envelope in `src/utils/http.ts` (`jsonOk/jsonFail`). Good
seam — but only the leads path uses it.

**Error handling [CURRENT]:** `not-found.jsx`; dynamic routes `notFound()`; leads
route returns the standard envelope + logs server-side. No global error
boundary, no observability tooling.

**External integrations [CURRENT]:** Supabase (leads only). **No** payment
provider, **no** email (Resend), **no** OTP/SMS provider wired. Assets
self-hosted in `public/`.

**Deployment [CURRENT]:** Vercel-style. Env: `.env.local` (gitignored) with
`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only.

### Where business logic lives — verdict
- **Booking/pricing/payment/OTP logic: does not exist** (client or server).
- Lead validation: **GOOD** — centralised, pure, server-side, tested
  (`src/utils/lead.ts` + `lead.test.ts`).
- Content: static files (acceptable now; migrates to DB in the CMS phase).
- **Risk to avoid going forward:** creating the browser client
  (`client.ts`) invites direct Supabase calls from UI components. Booking/payment
  writes **must** be server-only (service role). Establish a data-access
  convention before building (see [TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md)).

## 3. TypeScript ↔ Database consistency (Part 14)
- **No generated `Database` types exist.** `mcp/supabase gen types` has not been
  run; there is no `src/types/database.ts`. **Every future Supabase query would
  be untyped (`any`)** → high runtime-bug risk once booking/payment code lands.
  **P1.**
- **Two sources of truth for content** during transition: `src/data/*.js`
  (static, used by the site) vs `treks`/`categories`/… tables (seeded, unused).
  They can and will diverge until the frontend is migrated to the DB. **P2.**
- TS migration is incremental (allowJs). New DB code should be `.ts` against
  generated types.

## 4. Environment & secret security (Part 15)
- **Committed env:** none. `.env.local` is gitignored (`.env*.local`); verified
  not staged in earlier commits. `.env.example` lists only the two public vars.
- **In the browser bundle:** `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — both **safe to expose** (publishable/
  anon key, RLS-enforced).
- **Service-role key:** **not present anywhere** in the repo (`grep` for
  `SERVICE_ROLE`/`service_role` = none). **GOOD** — but note booking/payment will
  **require** a service-role key, which **must** live server-side only (never
  `NEXT_PUBLIC_`, never in client components). Add to deployment secrets + a
  server-only accessor when that phase starts.
- **Not yet present (will need secret management):** PhonePe merchant key/salt,
  PhonePe webhook secret, OTP/SMS provider creds, Resend key. None exist yet →
  nothing leaked, but the secret-handling convention must be set before use.
- **Env parity local/staging/prod:** **NOT VERIFIED** — no staging config in
  repo; only `.env.local`.

## 5. Verdict
- **Application maturity for booking: ~0%.** No auth, no booking, no payment, no
  OTP code. The DB schema is far ahead of the app.
- **Good foundations:** typed toolchain, tests/CI, zod+envelope seam, clean
  supabase client split, no leaked secrets.
- **Must set before building:** generated DB types (P1); a server-only
  data-access + service-role convention (P1); app auth/session (P1).

See prioritised list in [AUDIT_ACTION_PLAN.md](AUDIT_ACTION_PLAN.md).
