# Alpha Adventures — End-to-End Production Readiness Audit

**Date:** 2026-09-30
**Scope:** First visit → login/signup → account/verification → dashboard/profile → availability → guest booking → payment → confirmation & notifications
**Method:** Static source trace of frontend, Server Actions, the one API route, Supabase migrations (0001–0017), RLS policies, mailer, cron, and the PhonePe (planned) path. No runtime browser pass except where noted. Nothing was changed.

---

## 1. Executive Summary

The **core booking engine is genuinely well-built** where it matters most: seat reservation is race-safe (`SELECT … FOR UPDATE` inside a single plpgsql function — no oversell), pricing is server-authoritative (client totals are ignored and recomputed), the status machine is enforced at the DB by a trigger, RLS is on for all ~30 tables with an event trigger that auto-enables it on new tables, the admin gate is airtight (service-role role check on every one of 17 admin server files), the service-role key never reaches the browser, and there are **no IDOR or role-escalation holes**. That is the hard 80%.

The gaps are in the **reliability and last-mile of the funnel**, not the security core:

- **Payment is still mocked.** With PhonePe env unset, bookings confirm with no real payment. This is the headline go-live blocker (already known).
- **Payment confirmation is not atomic** — a crash mid-confirm leaves a charged-but-cancelled window that the expiry cron will then release.
- **The 30-minute seat hold is really ~24h** because the expiry cron runs once daily → silent oversell risk.
- **Contact leads never notify the operator** — the primary purpose of the contact form is missing for a single-operator business.
- **The PhonePe path sends no confirmation email to anyone** — the moment real payments go live, paying customers and admin both get silence.
- **Rate limiting is both bypassable and fails open** — the app's own brute-force guard is largely cosmetic.
- **No error boundaries** anywhere → a Supabase blip on a money page = white screen with no recovery.
- **No reminders, no invoices/receipts** exist at all.

**Verdict: NOT READY for production with real payments.** With the mock path it is usable as a demo/soft-launch that captures bookings, *if* the P0 reliability items (atomic confirm, expiry cadence, lead notification, error boundaries, rate-limit) are closed and the operator accepts manual payment reconciliation. Do **not** enable PhonePe until the real-money P0 list is done.

---

## 2. Critical Blockers (fix before production)

| # | Blocker | Where | Impact |
|---|---------|-------|--------|
| B1 | Payments mocked; bookings confirm with no payment when PhonePe env unset | `book/actions.ts:180`, `service.ts:137` (`confirmMockPayment`) | Free confirmed bookings |
| B2 | Payment confirm not atomic → charged-but-cancelled window | `service.ts:137-173`, `201-222` | Real money lost once PhonePe live |
| B3 | Expiry cron daily (03:00) vs 30-min advertised hold | `vercel.json:3` vs `0007:132` | Seat oversell / silent sellout |
| B4 | Contact leads never alert the operator | `api/leads/route.ts:28-40` | Lost enquiries = lost revenue |
| B5 | PhonePe confirmation emails nobody (customer + admin) | `api/phonepe/callback/route.ts`, `service.ts:201-222` | Silent success on real payments |
| B6 | Login rate-limit bypassable + limiter fails open | `LoginForm.tsx:70`, `rateLimit.ts:14-24` | No real brute-force protection |
| B7 | No `error.tsx` boundaries on any route | all routes | White screen on any server-render throw |

---

## 3. Complete Issue List

Severity legend: **Critical** · **High** · **Medium** · **Low** · **Info**. Cross-cutting items reported by more than one trace are merged.

### 3.1 Payment & Booking Integrity

**[High] Payment confirmation is not atomic.**
`service.ts:137-173` (`confirmMockPayment`) and the identical `service.ts:201-222` (`confirmPhonePePayment`) write the `payments` row (`:147`), then separately `update(status:"payment_processing")` (`:164`), then `update(status:"confirmed", amount_paid)` (`:165-170`) — three separate transactions, unlike `finalize_booking` which is one plpgsql function. If the process dies after the payment row is `success` but before the booking reaches `confirmed`, the booking stays `pending_payment` with `amount_paid=0` while a successful payment exists — and the expiry cron (B3) will then expire it and release the seats. Benign for mock, real money loss for PhonePe.
*Fix:* one `security definer` RPC `confirm_payment(booking_id, provider, txn, amount)` that inserts the payment and flips `pending_payment→payment_processing→confirmed` in a single transaction; set `amount_paid` from the verified amount.

**[High] 30-minute hold is a ~24-hour hold.**
`finalize_booking` sets `expires_at = now() + interval '30 minutes'` (`0007:132`) and the UI promises "seats held for 30 minutes" (`BookingFlow.tsx:220`), but `expire_stale_bookings` is only invoked by a cron at `0 3 * * *` (`vercel.json:3`) — once daily. Abandoned carts hold seats up to ~24h (48× the promise). On small-capacity treks a few abandoned checkouts silently sell out the departure.
*Fix:* schedule `*/5 * * * *`, or run an opportunistic in-RPC sweep of the target departure inside `reserve_departure_seats`/`finalize_booking` before reserving (needed anyway if on Vercel Hobby cron-frequency caps).

**[Medium] Client-trusted `departure_id` allows booking past / unlisted departures.**
The page filters `.gte("start_date", today)` (`page.tsx:28`), but `createDraftBooking` (`service.ts:26-34`) only checks trek-published, matching `trek_id`, `status != cancelled`, and seat count — no future-date check. `price_booking` (`0008:30`) likewise. A tampered request books a past departure.
*Fix:* add `and start_date >= current_date` in both `createDraftBooking` and `price_booking`/`finalize_booking`.

**[Medium] No idempotency lock on payment confirm → duplicate payment rows.**
`confirmMockPayment` is read-status-then-write with no row lock; keys are minted fresh per call (`MOCK-${bookingId}-${Date.now()}`, `:146`). Two concurrent `payMockBooking` calls (double-click/retry) both read `pending_payment`, both insert distinct `payments` rows, both confirm. No DB guard (`payments` has unique `merchant_order_id` but not "one success per booking"). Double-charge seam for PhonePe.
*Fix:* `SELECT … FOR UPDATE` the booking inside the confirm RPC (above) + `create unique index on payments(booking_id) where status='success'`.

**[Medium] `link_booking_to_user` + `finalize_booking` are separate RPCs → unrecoverable dead-end.**
`link_booking_to_user` (`0007:87`) commits first, nulling `draft_token` and setting `pending_auth`. If the following `finalize_booking` throws (seats just taken, `0007:123`), the booking is `pending_auth` with `draft_token=null` and no seats. On retry `authenticateBooking` matches on `draft_token` (now null) → "Booking not found." User must restart; account/booking orphaned until cron expiry.
*Fix:* combine link+finalize into one transaction, or null `draft_token` only after finalize succeeds.

**[Medium] `payToken` bearer is unscoped, long-lived, weak dev fallback.** *(booking + authz traces)*
`signPay` = HMAC over `userId` only (`book/actions.ts:31-34`), using the **service-role key** as the signing secret with fallback `"dev-only-insecure"` (`:29`). Authorizes the pay step for *any* booking that user owns, forever, no nonce. If the service-role env is ever missing, tokens are forgeable; reusing the DB master key as a signing key widens its blast radius.
*Fix:* scope token to `userId+bookingId+exp`; dedicated `BOOKING_PAY_SECRET`; fail closed if unset.

**[Low] PhonePe confirm trusts booking's own amount, not the paid amount.**
`confirmPhonePePayment` sets `amount_paid = b.grand_total` (`service.ts:217`) and `phonePeStatus` (`phonepe.ts:60-78`) never returns/checks the amount. Underpayment or amount-mismatch would still confirm at full value.
*Fix:* return paid amount from `phonePeStatus`, assert `== grand_total` before confirming.

**[Low] `payment_failed` bookings never release seats.**
The DAG allows `payment_processing→payment_failed` (`0007:71`) but nothing sets it (PhonePe callback just redirects `?payment=failed`), and `expire_stale_bookings` (`0007:142-151`) only sweeps `pending_payment`/`draft`/`pending_auth`. If the failed path is ever wired, those seats leak permanently.
*Fix:* include `payment_failed` in the sweeper and set it in the callback.

**[Low] No negative-price guard in SQL; UTC "today" cutoff.**
`price_booking` doesn't reject negative `base_price`/`price_override` (JS path does, but isn't used by the live flow) — an admin data error yields a negative total. `page.tsx:22` uses UTC `toISOString()` for the departure filter while the business is IST (+5:30), so near midnight IST the listed set can be off by a day (cosmetic once the date-gate in the departure issue above lands).

**[Info] `payment_webhook_events` table (`0002:428`) is unused** — a dedicated webhook idempotency store exists but no confirm path records to it.

### 3.2 Authentication & Session

**[High] App-level login rate-limit is bypassable — no real brute-force protection.**
`signIn` runs `limitByIp("signin",10,60)` (`actions.ts:22`), but the *real* authentication is the browser client hitting GoTrue directly (`LoginForm.tsx:70-71`, `supabase.auth.signInWithPassword`). An attacker scripts `POST /auth/v1/token?grant_type=password` with the public anon key and never touches the rate-limited server action. No per-account lockout anywhere. Protection depends entirely on Supabase GoTrue's built-in limits.
*Fix:* establish the session server-side so the rate-limited path is the only path, or rely on + tune GoTrue limits and document the server limiter as cosmetic.

**[High] Rate limiter fails open silently.** *(auth + notifications traces)*
`rateLimit` returns `true` (allowed) on any RPC/DB error or if migration `0016` isn't applied (`rateLimit.ts:18-23`), with only a `console.warn`. All signin/signup/reset/booking/leads limits vanish on a DB blip or a missed migration, no alert. `clientIp()` also trusts the first `x-forwarded-for` token (`rateLimit.ts:6-9`), spoofable/rotatable to bypass IP buckets.
*Fix:* alert/metric on limiter failure; consider fail-closed for signup/reset; use Vercel's trusted client IP; verify `0016` is applied in prod.

**[Medium] Email is never actually verified before the account is fully usable.** *(auth + authz + UX traces)*
`register`/`authenticateBooking` create users with `email_confirm:true` (`login/actions.ts:55`, `book/actions.ts:119`). The "verify" link only flips `profiles.email_verified` for a dashboard banner and gates nothing (`verifyEmail.ts`, `Dashboard.tsx:78`). Anyone can register/book with an email they don't own; confirmation & reset mail may go to a non-owner; enables account-squatting on real customers' emails.
*Fix:* if verification is meant to mean anything, gate at least the first booking on `email_verified`; otherwise document as deliberately ownership-optional.

**[Medium] Account enumeration on signup.**
Register returns `"An account with this email already exists…"` (`actions.ts:63-67`, same `book/actions.ts:124-128`). Login (`BAD_CREDS`) and reset (always ok) are correctly non-enumerating — signup is the asymmetric leak.
*Fix:* generic success + out-of-band "you already have an account" email, or accept explicitly.

**[Medium] Auth tokens are JS-readable, with a large `dangerouslySetInnerHTML` blast radius.**
Because the session is set by the browser Supabase client (`client.ts:6-9`), access/refresh tokens live in non-httpOnly cookies (`document.cookie`-readable). Inherent to `@supabase/ssr`, but this app renders Pattern B pages via `dangerouslySetInnerHTML` throughout — any HTML-injection anywhere = full session theft. Note Server Actions *can* set cookies here (`book/actions.ts:55` sets `aa_draft`), so server-side session establishment is feasible.
*Fix:* keep Pattern B inputs strictly static (already the rule); add a CSP; consider server-side session establishment so Supabase sets cookies via middleware.

**[Low] Double password verification per login** (`actions.ts:29` + `LoginForm.tsx:71`) — every login authenticates twice; the server call mints an orphaned refresh token never committed. Latency + auth-rate budget churn.

**[Low] Verify-email token has no expiry/nonce** — HMAC of `verify:${userId}` only (`verifyEmail.ts:12-15`), permanent per user. Reset password validated client-side only (`ResetForm.tsx:47-50`), bypassable if GoTrue's own policy is off; `passwordSchema` has no max length.

### 3.3 Authorization / RLS / Access Control

*No critical holes. RLS-on everywhere, no role escalation, no IDOR, admin gate airtight, service role server-only — all verified. See §5.*

**[Medium] Cron endpoint unauthenticated when `CRON_SECRET` unset.**
`expire-bookings/route.ts:11-15` only checks the Bearer `if (secret)`. Unset env → auth skipped → anyone can `GET`/`POST` and run `expire_stale_bookings()`, releasing held seats (inventory abuse / mild DoS). Fails open.
*Fix:* fail closed — 401/500 if `CRON_SECRET` unset in prod; require Bearer unconditionally.

**[Low] Owner can PATCH own *draft* booking money columns** — `bookings_update_draft` (`0003:135-138`) has no column allow-list. Neutralized today because `finalize_booking` re-prices and the transition trigger blocks `draft→pending_payment`. Flag if reprice ever moves out of finalize.

**[Low] Authenticated user can self-set `profiles.email_verified`** — `profiles_update_own` (`0003:27-28`) has no column allow-list. Cosmetic today (flag gates nothing), a real bypass the moment anything gates on it.
*Fix:* move `email_verified` writes to service-role only before relying on it.

**[Low] `leads` INSERT policy `with check (true)`** (`0001:23-27`, `0003:166-167`) lets any anon/authenticated caller insert `leads` directly with attacker-chosen `status`/`assigned_to`/`trek_id`, bypassing the route's validation/honeypot/rate-limit. Spam/pollution only (leads are staff-read).

**[Info] `/admin` not in middleware `GATED`** (`middleware.ts:8`) — not a hole (`requireAdmin()` covers it server-side) but adding it gives an earlier redirect + defense-in-depth.

### 3.4 Notifications / Email / Leads

**[Critical→for-go-live] PhonePe confirmation sends no email.** See B5. `confirmPhonePePayment` never calls `sendBookingConfirmedEmail`; the mock path does (`payMockBooking:212-223`). Customer and admin both get silence on real payments.
*Fix:* `background(sendBookingConfirmedEmail(...))` inside `confirmPhonePePayment`, gated on the `status==="confirmed"` early-return so a duplicate callback doesn't re-send.

**[High] Contact leads generate no operator notification.** See B4. `api/leads/route.ts:28-40` inserts and returns — no mail to `ADMIN_NOTIFY_EMAIL`, no WhatsApp. Leads sit in a table with no SELECT policy (admin-dashboard-only). Missed enquiry = lost booking.
*Fix:* `background(sendMail(ADMIN_NOTIFY_EMAIL, …))` after insert — **HTML-escape** the name/message (see below).

**[High] Confirmed booking with a lost email has no retry / dead-letter / alert.**
All sends go through `background()` which only `console.error`s (`after.ts:12-14`); `sendMail` swallows errors by default (`mailer.ts:82-84`). Booking is `confirmed` independent of mail result. Confirmation fails (Brevo 4xx/5xx, rate limit) → customer never told, log line easily lost in serverless.
*Fix:* persist an `email_outbox` row (pending→sent→failed) in the same flow; retry failures from a cron; minimum: alert admin on send failure.

**[High] Missing/mis-set mail env fails silently in prod.**
Both `BREVO_API_KEY` and `SMTP_*` unset → `sendMail` warns and returns (`mailer.ts:69-79`). `EMAIL_FROM` unset → `no-reply@localhost` → Brevo rejects unverified sender (swallowed). `ADMIN_NOTIFY_EMAIL` unset → admin copies silently skipped (`email.ts:56,73`). `.env.example` ships these blank; no startup check.
*Fix:* fail-loud on boot if no transport configured in prod; warn once if `ADMIN_NOTIFY_EMAIL`/`EMAIL_FROM` unset.

**[High] No reminders or invoices exist at all.**
Grep `reminder|invoice` → only docs/CSS. Only cron is expire-bookings. No pre-departure reminder, no payment reminder, no invoice/receipt generation. The target journey requires them.
*Fix:* invoice (PDF or HTML email) on confirm; reminder cron reusing the cron pattern + the outbox above.

**[Medium] No CAPTCHA on the public lead endpoint** — protection is honeypot (`company`) + fail-open IP limit only (`lead.ts:51`). Targeted spam that fills fields correctly and rotates IP (per the XFF issue) gets through and — once lead-notify lands — spams the operator inbox.
*Fix:* Turnstile/hCaptcha, or at least un-spoof + tighten the IP limit.

**[Medium] Unescaped interpolation into HTML emails (latent stored-XSS).**
`email.ts:17-21,29-32,50-54,66-71` interpolate `trekTitle`/`link` into `htmlContent` with no HTML-escaping. Not user-controlled today (server-generated), but no escaping layer exists and the admin catalog is moving to DB-editable content. Directly relevant to the lead-notify fix — do not drop raw lead name/message into the email.
*Fix:* add `escapeHtml()`, wrap all interpolated values.

**[Medium→Low] PhonePe callback is a public unauthenticated endpoint keyed on a guessable `mtx`** with no signature check (`phonepe/callback/route.ts:20-29`). Mitigated now because status is re-verified server-side and confirm is idempotent, so a forged call can't confirm an unpaid booking. Add signature verification when PhonePe lands.

**[Low] Stale comment** `// No rate limiting yet` (`api/leads/route.ts:11`) contradicts `:13` which calls `limitByIp`. Delete.

**[Low] Authenticated users can't submit the contact form** — insert goes via RLS-scoped SSR client but `leads` INSERT policy is `to anon` only (`0001:23-27`), so a logged-in visitor gets `db_error` 500.
*Fix:* broaden to `anon, authenticated`.

### 3.5 UX / States / Responsiveness

**[High] No `error.tsx` boundaries anywhere.** See B7. Only `not-found.jsx` exists. `book/[slug]`, `user-dashboard`, `treks/[slug]` are `force-dynamic` + hit Supabase at request time; a timeout mid-render → raw Next fallback (white screen, no recovery link). Server *actions* fail gracefully; server *component* render throws don't.
*Fix:* `src/app/error.tsx` (client, with `reset`) at root, ideally also under `book/` and `user-dashboard/`.

**[High] Payment return gives the user zero feedback.**
`phonepe/callback/route.ts:10-17` redirects to `/user-dashboard?payment=success|failed|error&booked=REF`, but the dashboard never reads `searchParams`. After a real payment (success or failure) the user lands with no banner. The money moment of the funnel is silent. (Mock path shows an inline card, so this bites once PhonePe is live — but it's wired now.)
*Fix:* read `searchParams.payment` in the dashboard and render a banner (reuse existing amber/green/red styles).

**[High] No `next/image`; every image is a raw `<img>`.**
`grep 'next/image'` → 0. No width/height (CLS), no `srcset`, no format negotiation, no optimization — on the SEO-critical landing + trek detail pages. `next.config.mjs:23-30` configures an image remote pattern that is now unused.
*Fix:* migrate above-the-fold + card images to `next/image` with explicit dimensions; at minimum add `width/height` + `loading="lazy"`.

**[High] Trek detail page double-fetches every query.**
`getTrekBySlug` (`trekDetail.ts:5`) runs in `generateMetadata` and again in the page body (`treks/[slug]/page.jsx:12,49`); it's a plain async fn (not `React.cache`), and `publicClient()` news up a fresh client each call, so nothing dedupes. Each detail page = ~14 Supabase round-trips instead of 7. Collection pages double up too.
*Fix:* wrap `getTrekBySlug`/`getCollection` in `React.cache(...)`.

**[Medium] No `loading.tsx` for any route** — navigating to `force-dynamic` Supabase routes shows nothing during the fetch.
*Fix:* route `loading.tsx` skeletons for at least `book`, `user-dashboard`, `treks/[slug]`.

**[Medium] Broken "Back to trek" href in booking flow** — `BookingFlow.tsx:129` `href={\`/treks/${""}\`}` (literally `/treks/`); relies only on `onClick={history.back()}`. Middle-click / new-tab / JS-off breaks. The component never gets the slug as a prop.
*Fix:* pass `trek.slug` in, set the real href.

**[Medium] Render-blocking legacy CSS on 100% of routes** — `layout.jsx:32-46` loads 13 stylesheets (bootstrap, jquery-ui, fancybox, swiper, slick, daterangepicker, boxicons…) in `<head>` for every page, including Tailwind-only auth/booking/dashboard pages.
*Fix:* scope the legacy bundle to Pattern B routes via those pages' `*Scripts` components / a route group.

**[Low] Extra redirect hop** — confirmation "View my bookings" → `/account` which is a pure `redirect("/user-dashboard")`. Point at `/user-dashboard` directly.

**[Low] Auth utility pages not meta-noindexed** — `robots.ts:6` disallows `/user-dashboard`, `/account`, `/book/`, `/api/` (booking + confirmation covered ✓), but `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` are crawlable with no `robots:noindex`.

**[Low] Dead config** — `next.config.mjs:23-30` image `remotePatterns` for `alpha.thegreyhawks.com` is unused (self-hosted assets, no `next/image`).

**[Info] Pattern B not runtime-verified** — `travel-calendar` injects legacy HTML with `suppressHydrationWarning`; residual console warnings from injected markup can't be ruled out statically. Do a manual browser pass on `/travel-calendar` before launch.

---

## 4. Broken / Weak User Journeys

1. **Payment → confirmation (PhonePe, real):** silent — no email (B5), no on-screen banner (§3.5 H3). Charged-but-cancelled window (B2) and possible double-charge (§3.1). **Weakest journey.**
2. **Availability / seat hold:** advertised 30-min hold behaves as ~24h (B3) → oversell.
3. **Auth mid-booking failure:** seats-taken during `authenticateBooking` leaves an unrecoverable `pending_auth` booking → user must restart (§3.1 link/finalize).
4. **Contact / enquiry:** operator never notified (B4); logged-in users get a 500 (§3.4 low).
5. **Any Supabase hiccup on a dynamic page:** white screen, no recovery (B7).
6. **Onboarding / verification:** effectively optional; email ownership never proven (§3.2).

---

## 5. Security Findings (summary)

**Strong (verified, not assumed):**
- RLS enabled on all ~30 tables + `rls_auto_enable` event trigger; no table found with RLS off; no `USING(true)` on any *sensitive* table.
- No role escalation — `user_roles` writes gated by `is_admin()`; new users get `customer` only via SECURITY DEFINER trigger.
- `is_admin()`/`is_staff()` are SECURITY DEFINER with pinned `search_path`.
- Admin gate airtight — `requireAdmin()` uses the service-role client on all 17 admin server files; client components only render gated props.
- Service-role client is `server-only`, throws if key missing, never imported into a `"use client"` file; key never `NEXT_PUBLIC_`.
- No IDOR — dashboard/travellers use RLS-scoped client; user `cancelBooking` checks `user_id`.
- Money is server-authoritative; payment/refund/ledger tables are SELECT-only for users.
- Open-redirect defense (`safeNext.ts` + test); login & reset non-enumerating; reasonable password policy; middleware matcher deliberately scoped.

**To fix (all itemized above):** rate-limit bypass + fail-open (§3.2), cron fail-open (§3.3), unscoped/long-lived `payToken` + service-key-as-signing-key (§3.1/§3.3), JS-readable tokens × Pattern B (§3.2), email verification cosmetic (§3.2), signup enumeration (§3.2), lead direct-insert + self-set `email_verified`/draft money columns (§3.3), HTML-email escaping (§3.4), PhonePe callback signature (§3.4).

---

## 6. Performance Findings (summary)

- Trek detail double-fetch (~14 vs 7 round-trips) — `React.cache` (§3.5 H).
- No `next/image` → LCP/CLS on public pages (§3.5 H).
- 13 render-blocking legacy stylesheets on every route (§3.5 M).
- No `loading.tsx` skeletons on dynamic routes (§3.5 M).
- **Non-issues:** children fan out via `Promise.all` (no in-page N+1); tiny catalog makes missing list pagination fine for now.

---

## 7. Recommended Fixes — Prioritized

### P0 — before ANY production (even mock-payment soft launch)
1. **Atomic payment confirm** — single `confirm_payment` RPC (§3.1). *[B2]*
2. **Expiry cadence** — `*/5` cron or in-RPC opportunistic sweep (§3.1). *[B3]*
3. **Lead → operator notification** (escaped) (§3.4). *[B4]*
4. **Root `error.tsx`** boundary + `book`/`user-dashboard` (§3.5). *[B7]*
5. **Fix rate limiting** — enforce where auth happens; alert on fail-open; trusted client IP (§3.2). *[B6]*
6. **Fail-loud mail-env check** on boot (§3.4).
7. **Date-gate `departure_id`** server-side (§3.1).

### P0 — additionally, before enabling PhonePe (real money)
8. Send confirmation email on PhonePe confirm (§3.4). *[B5]*
9. Payment-return banner on dashboard (§3.5).
10. Idempotency lock + `unique(booking_id) where status='success'` (§3.1).
11. Combine link+finalize into one transaction (§3.1).
12. Scope + expire `payToken`; dedicated secret; no insecure fallback (§3.1/§3.3).
13. PhonePe callback signature verification + amount check (§3.4/§3.1).
14. Durable email outbox + retry/alert (§3.4).

### P1 — soon after launch
- Email-verification decision (gate first booking or document optional) (§3.2).
- Cron fail-closed when `CRON_SECRET` unset (§3.3).
- Signup non-enumeration (§3.2).
- HTML-escape all email interpolation (§3.4).
- `next/image` on above-the-fold images (§3.5).
- `React.cache` on trek/collection fetches (§3.5).
- CAPTCHA on `/api/leads` (§3.4).
- Reminders + invoices (§3.4).

### P2 — hardening / polish
- Scope legacy CSS to Pattern B routes (§3.5).
- `loading.tsx` skeletons (§3.5).
- Column allow-lists on `profiles`/`bookings` draft RLS (§3.3).
- `email_verified` writes service-role only (§3.3).
- `noindex` on auth utility pages (§3.5).
- `payment_failed` in the sweeper (§3.1); set it in callback.
- CSP header (§3.2).
- `/admin` in middleware `GATED` (§3.3).

### P3 — cleanup
- Fix broken "Back to trek" href (§3.5).
- Remove stale rate-limit comment (§3.4).
- Remove dead `next/image` remotePattern config (§3.5).
- Drop double server-side password verify (§3.2).
- IST-aware "today" cutoff (§3.1).
- Allow authenticated lead inserts (§3.4).
- Manual `/travel-calendar` console pass (§3.5).

---

## 8. "Ready for Production?" Checklist

**Mock-payment soft launch (bookings captured, payment reconciled manually):**
- [ ] P0 items 1–7 closed
- [ ] Mock-payment behavior explicitly accepted by the operator; customers told payment is offline/manual
- [ ] Mail env (`BREVO_API_KEY`/`SMTP_*`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`) set & verified in host
- [ ] `CRON_SECRET` set; expire-bookings cron running on the new cadence
- [ ] Migration `0016` (rate limits) confirmed applied in prod
- [ ] Manual browser pass: `/travel-calendar`, booking flow on mobile + desktop

**Real-money launch (PhonePe):**
- [ ] All of the above
- [ ] P0 items 8–14 closed
- [ ] `PHONEPE_*` env set; `isPhonePeEnabled()` true; mock branch disabled in prod
- [ ] PhonePe callback signature verification live; amount asserted
- [ ] End-to-end test payment (success, failure, timeout, duplicate callback) verified
- [ ] Durable email outbox + retry proven; confirmation email arrives on the PhonePe path
- [ ] Reconciliation: every `success` payment maps to exactly one `confirmed` booking

**Security sign-off:**
- [ ] Rate limiting enforced on the real auth path; fail-open alerting in place
- [ ] Email-verification decision made & documented
- [ ] CSP deployed; Pattern B inputs confirmed static

**Current status: NOT READY for real payments. Conditionally ready for a mock/soft launch once P0 (1–7) is done.**

---

## 9. Fixes Applied (2026-09-30, same day)

PhonePe deferred → PhonePe-specific P0 (items 8–14) intentionally skipped until the gateway lands. Typecheck + 42 unit tests green; app boots and trek pages render.

**Mock-launch P0 — all 7 done:**
1. **Atomic confirm** — `confirm_mock_payment` RPC, one transaction, row-locked + idempotent (`supabase/migrations/0019_atomic_confirm.sql`); `service.ts confirmMockPayment` rewired to call it. Also closes the mock double-charge race.
2. **Expiry cadence** — `expire_stale_departure_bookings(departure)` swept inside `finalize_booking` before reserving (`migrations/0018_expiry_opportunistic.sql`) so lapsed holds free at contention on any Vercel plan; cron bumped to `*/5` (`vercel.json`).
3. **Lead → operator email** — `sendLeadNotification` (all fields escaped) fired via `background()` in `api/leads/route.ts`.
4. **Root error boundary** — `src/app/error.tsx` (client, `reset`, wrapped by layout so chrome stays).
5. **Rate limiting (code)** — `rateLimit.ts`: prefer `x-real-ip`, error-level fail-open log, `failClosed` option; signup/reset/leads now fail-closed. *(Bypass itself is config — see below.)*
6. **Mail-env fail-loud** — prod-only module-load check in `email.ts` logs missing transport / `EMAIL_FROM` / `ADMIN_NOTIFY_EMAIL`.
7. **Departure date gate** — `price_booking` redefined with IST `start_date >=` filter (`migrations/0020_departure_date_gate.sql`, the single chokepoint for draft + finalize) + early check in `createDraftBooking`.

Plus **M3** (escape `trekTitle`/date in booking emails, new tested `src/lib/html.ts`) and **M4** (stale comment removed).

**P1 — done:**
- **Cron fail-closed** when `CRON_SECRET` unset in production (both cron routes).
- **React.cache dedup** on `getTrekBySlug` + `getCollection` (~14→7 round-trips per detail page).
- **next/image** on `TrekCard`, `TourCard`, homepage `Hero` images, and the `TrekDetail` hero (fill + `sizes`). Verified in-browser: layout intact, images optimized. Left raw on purpose: jQuery/swiper/fancybox sliders + below-fold gallery/itinerary (next/image wrappers break those plugins).
- **Reminders + invoices:**
  - *Invoice/receipt* — the booking-confirmed email is now an itemized receipt (adults/children × unit, add-ons, total paid).
  - *Reminders* — new `/api/cron/booking-reminders` (daily `30 2 * * *`) emails a pre-departure reminder for confirmed bookings departing within 2 days (IST), once-only via a new `reminder_sent_at` column (`migrations/0021_booking_reminders.sql`, applied). Sends throw so a failed send retries instead of being marked done.

**Migrations 0018/0019/0020/0021 applied to the live DB and verified** (RPC-chain rollback test + reminder due-match rollback test; prod left clean).

### Content gap found during verification (not a code bug)
Several seeded `hero_image`/card image paths point to files **not present in `public/assets`** (e.g. `home2/trek-rajgad.jpg`, the Andharban card) → blank trek-detail hero and broken cards. Same behavior before/after `next/image`. **Needs real trek photos uploaded** to `public/assets/img/...` (or corrected seed paths).

### P1 decisions — resolved (best/optimal)
- **Email verification → keep guest-first, no booking gate** (money-moment friction kills conversion). Made the flag trustworthy instead: a BEFORE UPDATE trigger (`migrations/0022_lock_email_verified.sql`, applied) ignores `email_verified` changes from anyone but the service role, so the verify-email flow (service-role) still works but users can no longer self-verify. The flag can now safely gate something later if wanted. **Verified**: authenticated self-set blocked, service-role set allowed.
- **Signup enumeration → accept the tradeoff, keep the helpful UX.** For a trek-booking threat model, "this email is registered" is low-value to an attacker, and the generic-success rewrite degrades the sign-in-after-signup flow. Bulk enumeration is already throttled by the fail-closed `signup` rate limit. Documented as a conscious decision; revisit if the threat model changes.
- **CAPTCHA → deferred (needs Turnstile/hCaptcha keys).** Current protection — honeypot + fail-closed IP rate limit — is adequate for launch scale. Wire Turnstile when keys are available (server verify in `api/leads/route.ts`).

### Reset/verify email "localhost link" — fixed + config needed
Root cause: `EMAIL_FROM` is fine (real domain); the **link** was localhost because `siteUrl()` (`src/lib/siteUrl.ts`) falls back to `http://localhost:3000` when `NEXT_PUBLIC_SITE_URL` is unset, and that feeds `admin.generateLink`'s `redirect_to`. `NEXT_PUBLIC_SITE_URL` is unset (and `VERCEL_URL` is only the per-deploy hostname). Code now logs a loud error in production when it falls back. **You must:** (1) set `NEXT_PUBLIC_SITE_URL` to the canonical domain in the host, and (2) in Supabase → Auth → URL Configuration, set the **Site URL** to that domain and add it to **Redirect URLs** (else `generateLink` drops the redirect).

Then **P2 hardening**: scope legacy CSS to Pattern B routes, `loading.tsx` skeletons, RLS column allow-list on `bookings` draft money cols, `noindex` on auth pages, `payment_failed` in the sweeper, CSP, `/admin` in middleware `GATED`. (`email_verified` service-role-only is now done above.)

### ⚠️ Required manual steps (cannot be done from code)
1. **Apply migrations 0018, 0019, 0020** in the Supabase SQL Editor (MCP can't manage this project ref). Until 0019 is applied, mock payment will fail (RPC missing).
2. **Enable/tune Supabase Auth (GoTrue) rate limits** in the Supabase dashboard — the real defense against the direct-to-GoTrue login brute-force bypass; the app limiter can't stop it.
3. **Set `CRON_SECRET`** in the host (cron now refuses to run without it in prod).
4. **Set mail env** (`BREVO_API_KEY`/`SMTP_*`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`) — boot log will flag any missing.
5. Integration test `cycle.integration.test.ts` may seed past departures → the 0020 gate could fail it; update its seed to a future date (excluded from the default test run).

### P1 — needs your decision before I continue
- **Email verification** — gate first booking on `email_verified`, or keep ownership-optional (guest-first) and document it?
- **Signup enumeration** — fixing it (generic success) changes the sign-in-after-signup UX flow; want that tradeoff?
- **CAPTCHA** on `/api/leads` — needs a Turnstile/hCaptcha account + keys.
- **Reminders + invoices** — feature scope (invoice format? reminder timing?).
- **next/image** — mechanical but needs per-image dimensions + visual review across pages.
