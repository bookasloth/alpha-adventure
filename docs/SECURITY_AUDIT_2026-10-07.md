# 🔐 Security Audit — Alpha Adventures

**Date:** 2026-10-07 · **Scope:** full application (Next.js 14 App Router + Supabase) · **Method:** read-only code review, live RLS/storage inspection (read-only SQL), dependency audit, production header check. No code modified. No destructive tests. Production not attacked.

> **Overall posture: MEDIUM RISK (≈78/100).** Foundations are strong — RLS on every table, server-authoritative pricing, no service-role leakage to the client, no SQL/command injection, DB-backed rate limiting. The gaps are a stored-XSS path via admin content, a payment action that must be gated before PhonePe goes live, admin PII over-fetch to the browser, and an out-of-date dependency set. No active unauthenticated data exposure or RCE was found.

---

## 1. Architecture map

| Layer | Implementation |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind + legacy jQuery/Bootstrap/GSAP template (Pattern B static HTML injection) |
| Backend | Next.js Server Actions (primary mutation path) + 4 Route Handlers under `src/app/api/**` |
| Database | Supabase Postgres, **RLS on all tables**; amounts stored as paise (bigint) |
| Auth | Supabase email+password (GoTrue). Server action rate-limits + validates; **browser client performs the one real credential check**; self-minted email-verify via HMAC |
| Authorization | `user_roles` (customer/staff/admin) + `is_admin()`/`is_staff()` SQL helpers; `requireAdmin()` gate (`src/app/admin/data.ts:18`) |
| Sessions | Supabase SSR cookies (`@supabase/ssr`), refreshed in `src/middleware.ts` on `/account`, `/user-dashboard`, `/admin` |
| Payments | **Mock** (`confirm_mock_payment` RPC) live today; PhonePe (`src/lib/payment/phonepe.ts`) built but disabled (`isPhonePeEnabled()` false) |
| File upload | Admin-only image upload → Supabase Storage `media` bucket (service-role, behind `requireAdmin`) |
| Email | Brevo HTTP API + SMTP fallback, non-blocking (`background()`) |
| Cron | `/api/cron/expire-bookings`, `/api/cron/booking-reminders` — `CRON_SECRET` bearer, fail-closed in prod |
| Hosting | Vercel; domain `alphaadventures.in` (+ www), HSTS enabled |
| Secrets | Server-only env (`SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY`, `PHONEPE_*`, `CRON_SECRET`); only URL + publishable key are `NEXT_PUBLIC_` |

---

## 2. Executive summary

**Verdict: MEDIUM RISK. Conditionally safe for the current mock-payment soft launch. NOT ready for real money until the PhonePe-launch items (P0 8–14 from the prior audit) + H1 below are closed.**

Strengths confirmed this pass:
- **RLS on 100% of public tables** (0 without it); ownership/role predicates are consistent and correct.
- **No service-role key or client reaches the browser** — `admin.ts` is `server-only`; verified against all 37 client components.
- **Server-authoritative pricing** — no action trusts a client price/total/role/user_id; booking id is re-fetched and ownership-checked before every mutation.
- **No SQL/NoSQL/command/template injection**; no `eval`/`child_process`; no `javascript:`-injectable sinks reached by user input.
- **Rate limiting is Postgres-backed** (`rate_limit_hit` RPC) — shared across serverless instances, not in-memory (no multi-instance bypass).
- Security headers present in prod: CSP, HSTS (2y), X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy.

Weaknesses to fix (detail in §4):
- **M1 Stored XSS** via admin-entered gallery album fields rendered unescaped.
- **H1** `payMockBooking` not gated on `isPhonePeEnabled()` — becomes a free-confirmation hole the moment PhonePe is enabled.
- **H2** Outdated `next` with a CRITICAL advisory + several high dependency vulns.
- **M2** Admin console serializes the entire bookings/leads/payments/profiles dataset (all PII) into the client payload.
- **M3** Service-role key doubles as the HMAC signing secret (key reuse) with a weak `"dev-only-insecure"` fallback.
- **M4** Auth rate limiting is bypassable by calling GoTrue directly — needs Supabase-side limits.

---

## 3. Vulnerability table

| ID | Severity | Vulnerability | Location | Impact | Exploitability | Fix |
|---|---|---|---|---|---|---|
| H1 | HIGH* | `payMockBooking` confirms a booking with no real payment and is not gated on `isPhonePeEnabled()` | `src/app/(site)/book/actions.ts:197` | Free confirmed bookings once PhonePe is live | Easy (auth user calls own action) — *latent until PhonePe enabled* | Gate body on `!isPhonePeEnabled()` or remove mock in prod |
| H2 | HIGH | Outdated deps: `next@14.2.35` (CRITICAL image-optimizer DoS advisory) + high-sev build/runtime deps | `package.json`, lockfile | DoS / known CVEs | Public CVEs | `npm audit fix`; bump Next to latest 14.2.x |
| M1 | MEDIUM | Stored XSS — admin album `title`/`hero`/`hero_alt` interpolated unescaped into HTML | `src/lib/galleryDetailHtml.js:52,60,62`; `src/app/(site)/gallery/[slug]/page.jsx:30-33` | Script runs for all public visitors of a gallery page | Requires admin/staff write (defense-in-depth gap) | HTML-escape those fields before injection |
| M2 | MEDIUM | Admin console ships all bookings/leads/payments/profiles PII to the client RSC payload | `src/app/admin/data.ts:43-69` → `AdminShell` (client) | Full-customer-PII blast radius if `/admin` is ever XSS'd | Needs admin session | Server-render/paginate; don't pass full dataset as props |
| M3 | MEDIUM | Service-role key reused as HMAC secret; weak `"dev-only-insecure"` fallback | `src/lib/verifyEmail.ts:10`; `src/app/(site)/book/actions.ts:29` | Forgeable pay/verify tokens if env unset; key-purpose reuse | Only if env missing (set in prod) | Dedicated `TOKEN_SIGNING_SECRET`; no insecure fallback in prod |
| M4 | MEDIUM | Auth rate limit bypassable via direct GoTrue calls (client signs in directly) | `src/app/login/actions.ts:21` (server limiter) vs. client `signInWithPassword` | Credential brute-force not throttled by app limiter | Direct API calls | Enable/tune Supabase Auth rate limits (dashboard) |
| L1 | LOW | PhonePe `confirm` stamps `amount_paid = grand_total` without asserting the gateway's reported amount | `src/domain/booking/service.ts:206`; `src/lib/payment/phonepe.ts:60` | Underpayment accepted if gateway ever mis-reports | PhonePe path (disabled) | Assert status amount == stored amount |
| L2 | LOW | PhonePe callback does not verify the X-VERIFY signature of the inbound POST | `src/app/api/phonepe/callback/route.ts` | Forged callbacks — mitigated by server status re-query | PhonePe path (disabled) | Verify callback signature + add replay/idempotency guard |
| L3 | LOW | `Permissions-Policy` header not set | `next.config.mjs` `headers()` | Features (camera/geo) not restricted | n/a | Add `Permissions-Policy: camera=(), microphone=(), geolocation=()` |
| L4 | LOW | CSP allows `'unsafe-inline'` + `'unsafe-eval'` for scripts (legacy template) | `next.config.mjs:27` | Raises XSS blast radius, esp. `/admin` (see M2) | n/a | Nonce-based CSP when Pattern B is retired |
| L5 | LOW | `getBookingTravellers` relies solely on RLS, no app-level owner filter | `src/app/(site)/user-dashboard/actions.ts:50` | IDOR if `trav_owner` RLS is ever dropped | Defense-in-depth (RLS `trav_owner` confirmed present) | Add explicit `user_id` join/filter |
| L6 | LOW | `profiles_update_own` has no column allow-list | RLS `profiles_update_own` | User edits own non-privileged columns only | None today (`email_verified` trigger-guarded; role lives in `user_roles`) | Optional column guard trigger for parity |
| L7 | LOW | `clientIp()` trusts first `x-forwarded-for` hop | `src/lib/rateLimit.ts:9-16` | Rate-limit key spoofable **off** a trusted proxy | Sound behind Vercel (sets `x-real-ip`) | Keep; document the proxy dependency |
| L8 | LOW | User enumeration on signup/reset ("account already exists") | `src/app/login/actions.ts` | Confirms which emails are registered | Easy | Accepted tradeoff (documented); reconsider if abused |
| I1 | INFO | `dangerouslySetInnerHTML` across Pattern B pages | `src/app/(site)/**`, `SiteHeader/Footer` | Safe only while inputs stay static/author-controlled | — | Never feed user/fetched input; M1 is the one that already does |
| I2 | INFO | `media` storage bucket is public-read | `storage.buckets` | Expected for a public image site; writes are service-role only (`storage.objects` RLS on, 0 policies) | — | Keep; don't store private files here |
| I3 | INFO | Sensitive PII in `profiles` (medical, emergency contact, DOB) readable by all staff | `profiles_select_own` (`… OR is_staff()`) | Broad staff visibility of health data | — | Tightly control staff role; consider need-to-know |
| I4 | INFO | Dev-only dep criticals (`vitest`, `tinypool`, `vite`) | devDependencies | Not shipped to prod | — | Patch during routine upgrades |

\*H1 is HIGH **at PhonePe launch**; today the mock confirmation is the intended payment path, so it is not an active hole.

---

## 4. Critical / High findings (detail)

### H1 — `payMockBooking` is an ungated payment-bypass once PhonePe is enabled
1. **What's wrong:** `payMockBooking` (`src/app/(site)/book/actions.ts:197`) is an exported Server Action that calls `confirm_mock_payment` → records a payment row and flips the booking to `confirmed`, with **no real payment**. It verifies ownership (`b.user_id !== userId`, `:208`) but — unlike `startPayment` (`:180`) — never checks `isPhonePeEnabled()`.
2. **Where:** `src/app/(site)/book/actions.ts:197-215`.
3. **Why exploitable:** Server Actions are live callable endpoints. Once PhonePe is enabled for real money, an authenticated user can still invoke `payMockBooking(ownBookingId, payToken)` directly and confirm their own booking for free.
4. **Attack scenario:** `create draft → authenticate → call payMockBooking` → confirmed trek, ₹0 paid.
5. **Business impact:** Revenue loss, seat theft from paying customers.
6. **Fix:** Gate the action body on `if (isPhonePeEnabled()) return { ok:false, error:"…" }` (mirror `startPayment`), or compile the mock path out of prod builds.
7. **Priority:** Must close **before** enabling PhonePe (bundle with P0 items 8–14).

### H2 — Out-of-date dependencies incl. a CRITICAL Next.js advisory
1. **What's wrong:** `npm audit` reports 19 vulns (3 critical, 11 high). Prod-relevant: `next@14.2.35` carries a **CRITICAL** "Image Optimizer DoS via remotePatterns" advisory; `source-map-js`/`postcss` highs sit in the build chain.
2. **Where:** `package.json` / lockfile.
3. **Why exploitable:** Public CVEs; the Next advisory is remotely triggerable against the image optimizer.
4. **Impact:** Denial of service; known-CVE exposure.
5. **Fix:** `npm audit fix` (non-breaking) and bump `next` to the latest 14.2.x patch; re-run audit. Do **not** `--force` to Tailwind 4 (breaking). `vitest`/`tinypool`/`vite` criticals are dev-only.
6. **Priority:** High — schedule this week.

### M1 — Stored XSS in gallery detail via admin-entered album fields
1. **What's wrong:** `galleryDetailHtml(page)` interpolates `page.hero`, `page.heroAlt`, `page.title` (and season/image fields) into an HTML string **without escaping** (`src/lib/galleryDetailHtml.js:52,60,62`). The page object is built from **DB** album data (`src/app/(site)/gallery/[slug]/page.jsx:26-30`, `getGalleryAlbum`), which is admin/staff-editable (gallery admin forms). The result is rendered via `dangerouslySetInnerHTML` (`:33`).
2. **Why exploitable:** An admin/staff user saving an album `title`/`hero_alt` of `"><img src=x onerror=…>` stores script that executes in **every public visitor's** browser on that gallery page.
3. **Attack scenario:** Compromised/malicious staff account → persistent XSS against all site visitors → session/credential theft, defacement.
4. **Impact:** Mass stored XSS; worsened by the `'unsafe-inline'` CSP (L4).
5. **Fix:** HTML-escape `title`/`hero`/`hero_alt` (and any DB-sourced field) in `galleryDetailHtml` — reuse the existing `escapeHtml` (`src/lib/html.ts`) as the home cards already do (`src/app/(site)/page.jsx:62`).
6. **Priority:** Medium (close with M2/L4 as the "admin content → HTML" cluster).

### M2 — Admin console over-fetches PII to the client
`getAdminData()` (`src/app/admin/data.ts:43-69`) returns the full bookings/leads/payments/profiles dataset as props to the **client** `AdminShell`. It is correctly gated by `requireAdmin()`, so it is authorized — but every customer's name/email/phone/payment lands in the browser RSC payload. Combined with L4 (`unsafe-inline` CSP) and M1, any XSS on `/admin` exfiltrates the entire customer database. **Fix:** server-render sensitive tables, paginate, and pass only the columns each view needs.

### M3 — Service-role key reused as HMAC secret, weak fallback
`verifyEmail.ts:10` and `book/actions.ts:29` sign email-verify and pay tokens with `SUPABASE_SERVICE_ROLE_KEY` (falling back to the literal `"dev-only-insecure"`). Reusing the DB master key as a token-signing secret is poor key separation; the insecure fallback makes tokens forgeable in any env where the key is unset. In prod the key is set, so not currently exploitable. **Fix:** introduce a dedicated `TOKEN_SIGNING_SECRET`; refuse to start (or hard-fail the signer) if it's unset in prod.

### M4 — Auth rate-limit bypass via direct GoTrue
The server `signIn` action rate-limits (`limitByIp("signin",10,60)`), but the **actual** credential check runs in the browser against GoTrue directly, which our limiter never sees. An attacker scripting `supabase.auth.signInWithPassword` bypasses the app throttle. **Fix:** enable/tune Supabase **Auth → Rate Limits** (dashboard). This is the operator task already flagged for launch.

---

## 5. Per-domain scores

| Domain | Score | Notes |
|---|---:|---|
| Authentication | 80 | Password auth, server+client split, DB-backed limiter; enumeration tradeoff (L8); GoTrue-direct limiter gap (M4) |
| Authorization | 90 | RLS everywhere, `requireAdmin`, ownership checks, no role/price trust; minor defense-in-depth (L5/L6) |
| API security | 85 | Gated, zod-validated, rate-limited; `/api/leads` public by design; callback hardening deferred (L2) |
| Database | 92 | RLS on all tables, correct predicates, money/`email_verified` trigger-guarded, storage writes locked |
| Payments | 60 | Mock is intentional; PhonePe-launch items real (H1, L1, L2) — close before real money |
| Infrastructure | 82 | CSP+HSTS+XFO+nosniff+Referrer present; Permissions-Policy missing (L3); `unsafe-inline` (L4) |
| Frontend | 78 | Home cards escaped; gallery stored-XSS (M1); admin PII to client (M2) |
| Dependencies | 55 | Next CRITICAL advisory + highs (H2) |
| Data protection | 78 | RLS-scoped; sensitive PII (I3); admin over-fetch (M2) |
| **Overall** | **≈78/100** | **MEDIUM RISK** |

---

## 6. Top 10 fixes (ranked by risk × exploitability × business impact)

1. **H1** — Gate `payMockBooking` on `!isPhonePeEnabled()` (payment bypass at launch).
2. **M1** — Escape admin-entered gallery fields in `galleryDetailHtml` (stored XSS).
3. **H2** — `npm audit fix` + bump Next to latest 14.2.x (CRITICAL advisory).
4. **M4** — Enable/tune Supabase Auth rate limits (brute-force throttle). *(operator task)*
5. **M2** — Stop shipping full PII dataset to `AdminShell`; server-render/paginate.
6. **M3** — Dedicated `TOKEN_SIGNING_SECRET`; remove `"dev-only-insecure"` fallback in prod.
7. **L2** — PhonePe callback signature verification + replay/idempotency (bundle with PhonePe P0).
8. **L1** — Assert PhonePe status amount == stored amount before confirm.
9. **L3** — Add `Permissions-Policy` header.
10. **L5** — Add explicit owner filter to `getBookingTravellers` (defense-in-depth).

---

## 7. Attack-path analysis (critical chains)

- **Malicious/compromised staff → stored XSS → public mass compromise:** staff edits a gallery album `title`/`hero_alt` with a script payload (M1) → served to every visitor via `dangerouslySetInnerHTML` → `unsafe-inline` CSP (L4) permits execution → if the victim is an admin on `/admin`, the full customer PII payload (M2) is exfiltrated. *Mitigation: M1 escaping breaks the chain at step 1.*
- **PhonePe launch → free bookings:** enable PhonePe for real money while `payMockBooking` stays reachable (H1) → any user confirms own booking for ₹0. *Mitigation: H1 gate.*
- **Credential brute-force:** script `signInWithPassword` directly against GoTrue (M4), bypassing the app limiter → password guessing at full speed. *Mitigation: Supabase Auth rate limits.*

---

## 8. What was checked and found clean

- **Injection** (SQL/NoSQL/command/template/LDAP/XPath): none — all DB access via Supabase client/RPC; no `eval`/`new Function`/`child_process`; the only `.exec` is a regex.
- **CSRF:** mutations are Next Server Actions (built-in Origin check + action IDs) or token-bearer guest flow; cookies are SameSite=lax (Supabase SSR defaults). `/api/leads` is a stateless public insert.
- **SSRF:** no server-side fetch of user-supplied URLs; outbound fetches target fixed hosts (PhonePe, Brevo). Image URLs are rendered client-side only.
- **Open redirect:** login `next` sanitized by `safeNext` (tested); other redirects are server-computed internal paths.
- **Secrets:** no hardcoded secrets; no secret under `NEXT_PUBLIC_`; service-role client is `server-only` and absent from all 37 client components.
- **CORS:** no custom CORS → same-origin only; no wildcard.
- **Error handling:** actions return generic `{ ok:false, error }`; provider/rate errors logged server-side only; no stack traces or secrets to the client.
- **Rate limiting:** Postgres-backed (`rate_limit_hit`), shared across instances; fail-closed on abuse buckets (signup/reset/leads).

---

*Prepared as a read-only audit. No code was modified. PhonePe-specific items (H1 trigger condition, L1, L2) align with the deferred P0 8–14 from `docs/PRODUCTION_AUDIT_2026-09-30.md` and should be closed together when the gateway lands.*
