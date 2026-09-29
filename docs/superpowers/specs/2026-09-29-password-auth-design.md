# Password-based Auth — Design Spec

Date: 2026-09-29
Status: Draft for review

## 1. Goal & intent

Replace the self-minted email-OTP auth with **email + password** across the
app, used in **both** the sign-in flow and the guest booking checkout. Keep the
booking flow guest-first and low-latency (no leaving the page mid-checkout).
Existing accounts are test data and will be wiped.

Success:
- A returning customer signs in with email + password.
- A new customer, mid-booking, registers with email + password at the identity
  step and immediately reserves + pays — no interruption.
- Email ownership is still verified via our own (Brevo) mailer, without blocking
  booking or sign-in.

## 2. Decisions (locked)

| Topic | Decision |
|---|---|
| Booking identity | Sign in **or** register (email+password) at the checkout identity step |
| Existing users | **Wipe** all `auth.users` (6 test accounts, 4 linked bookings) and start fresh |
| Email verification | Send our own Brevo confirm link, **non-blocking** (does not gate sign-in or booking) |
| Supabase "Confirm email" | **OFF** — so `signInWithPassword` works instantly after register |
| Name | Captured at register, stored on profile |
| Password policy | min 8 chars; ≥1 uppercase; ≥1 digit; ≥1 special (non-alphanumeric); must NOT contain the user's name token(s) or email local-part (case-insensitive) |

### 2.1 The confirm-email reconciliation (design rationale)
Blocking sign-in until email confirmation would force a guest to leave
checkout, open email, click, and return — exactly the OTP friction being
removed. Therefore: Supabase native confirmation stays OFF, users are created
usable immediately, and we send a **non-blocking** Brevo verification link. An
"unverified" state shows a dashboard banner but gates nothing. (A future
hard-gate on unverified sign-in can be layered on later; out of scope now.)

## 3. Current state (what we're replacing)

OTP is wired in four places, all via `src/lib/otp.ts` (`mintOtp` =
`admin.generateLink` + create-if-absent) and `sendOtpEmail`:

- `src/app/login/actions.ts` — `sendLoginOtp`, `verifyLoginOtp`.
- `src/app/signup/page.tsx` — reuses `LoginForm` in OTP mode.
- `src/app/forgot-password/page.tsx` — reuses `LoginForm`; "reset" = send a code.
- `src/app/book/actions.ts` — `sendBookingOtp`, `verifyBookingOtp`,
  `resendBookingOtp`; OTP verify **doubles as account creation**, links the
  draft, and mints an HMAC `payToken` bearer (cookies don't commit in a
  value-returning Server Action, so the pay step authorises off the bearer).

Key constraints to preserve:
- **Cookie-commit constraint:** a value-returning Server Action can't set the
  session cookie in the browser; only a `redirect()` commits it. Login can
  redirect. Booking stays on the page → keep the `payToken` bearer pattern.
- Booking is guest-first: draft is created and priced before any identity.

## 4. Target design

### 4.1 Data reset (migration)
`supabase/migrations/00NN_wipe_users_for_password_auth.sql`:
- Null `bookings.user_id` for the 4 linked test bookings to preserve booking
  rows (they become orphaned history, harmless). Alternative — deleting the 8
  test bookings outright — is flagged for the reviewer in §9.
- Delete all rows from `auth.users` (cascades to `profiles`, `user_roles` via
  existing FKs). Verified test-only data.

### 4.2 Validation — `src/domain/booking/schema.ts` (or a new `auth` schema)
- `passwordSchema`: `z.string().min(8).regex(upper).regex(digit).regex(special)`.
- `nameSchema`: `z.string().trim().min(2).max(80)`.
- Cross-field check (in the action, not the field schema): reject if
  `password.toLowerCase()` contains any name token (length ≥ 3) or the email
  local-part. One shared helper `passwordDisallowsIdentity(pw, {name, email})`.
- Remove `otpSchema` once no longer referenced.

### 4.3 Auth actions — `src/app/login/actions.ts`
Replace OTP actions with:
- `signIn(email, password, next?)`: `supabase.auth.signInWithPassword` →
  on success `redirect(safeNext(next))`; on failure `{ok:false,error}`.
- `register(name, email, password, next?)`: create the user **pre-confirmed**
  via `admin.createUser({email, password, email_confirm:true, user_metadata:{name}})`,
  upsert `profiles.full_name`, then `signInWithPassword` → `redirect`. Fire
  `sendVerifyEmail(email)` non-blocking via `background()`.
- `requestPasswordReset(email)`: `admin.generateLink({type:"recovery"})` →
  Brevo email (non-blocking) → always `{ok:true}` (don't leak account existence).
- `signOut` unchanged.
- Keep `limitByIp` on every action; keep the 10s `withTimeout` guard pattern.

### 4.4 Reset flow (new)
- `/reset-password` route + client form: reads the recovery token from the
  URL (Supabase recovery link lands with a code), calls
  `supabase.auth.updateUser({password})` after establishing the recovery
  session, then redirects to `/user-dashboard`.
- `forgot-password/page.tsx`: switch copy from "send a code" to "send a reset
  link"; form calls `requestPasswordReset`.

### 4.5 Email verification (new) — `src/lib/verifyEmail.ts`
- `sendVerifyEmail(email)`: `admin.generateLink({type:"magiclink"|"signup"})`
  to get a confirm URL, deliver via existing Brevo mailer (`src/lib/email.ts`).
- `/verify-email` route: consumes the link, marks `profiles.email_verified=true`
  (new column) or relies on `auth.users.email_confirmed_at`. Decision: set a
  `profiles.email_verified` boolean we control, since Supabase confirmation is
  off.
- Dashboard shows a dismissable "verify your email" banner while false.

### 4.6 Client — `src/app/login/LoginForm.tsx`
- Replace the email→OTP two-step with a single form: **mode** = `signin` |
  `register`. Fields: email, password (+ name when register). Toggle link
  ("New here? Create account" / "Have an account? Sign in").
- Keep the `ProgressBar` busy cue. On success the action redirects; on failure
  show the error. Add show/hide password + inline policy hint on register.
- `/signup` renders it in `register` mode; `/login` in `signin` mode.

### 4.7 Booking — `src/app/book/actions.ts` + `BookingFlow.tsx`
- Replace `sendBookingOtp` / `verifyBookingOtp` / `resendBookingOtp` with:
  `authenticateBooking(bookingId, {name?, email, password, mode}, token?)`:
  1. rate-limit; validate; resolve draft token (cookie ↔ fallback).
  2. verify the draft belongs to this token; status draft|pending_auth.
  3. `mode==="signin"` → `signInWithPassword`; `mode==="register"` →
     `admin.createUser(pre-confirmed, metadata name)` + profile upsert +
     `signInWithPassword`; on register fire `sendVerifyEmail` non-blocking.
  4. `linkAndFinalize(admin, bookingId, draftToken, userId)`; delete draft
     cookie; mint `payToken = signPay(userId)`; send pending email (non-block).
  5. return `{ok:true, reference, payToken}`.
- `BookingFlow.tsx` identity step: email + password (+ name on register) with a
  sign-in/register toggle, replacing the OTP entry. Pay step unchanged (uses
  `payToken`).

### 4.8 Config
- Supabase Auth: set "Confirm email" OFF. No MCP tool — done via management API
  (with confirmation) or by the user in the dashboard. Documented in
  `docs/ENVIRONMENT_VARIABLES.md` / `DEPLOYMENT.md`.

### 4.9 Cleanup
- Delete `src/lib/otp.ts`; remove `sendOtpEmail` from `src/lib/email.ts` if
  unused elsewhere; drop `otpSchema`.
- Update `docs/AUTHENTICATION.md` to describe password auth.

## 5. Data flow

**Sign in:** LoginForm(signin) → `signIn` → `signInWithPassword` → `redirect`
→ session cookie committed → `/user-dashboard`.

**Register (standalone):** LoginForm(register) → `register` → createUser
pre-confirmed + profile + signInWithPassword → redirect; Brevo verify email
fired async.

**Booking (guest → register):** createDraft (guest) → identity step
(register) → `authenticateBooking` → createUser + signIn + linkAndFinalize +
payToken → pay step uses payToken → confirmed.

**Booking (guest → existing user):** same, `mode=signin`.

**Reset:** forgot-password → `requestPasswordReset` → Brevo recovery link →
`/reset-password` → `updateUser({password})` → dashboard.

## 6. Error handling
- Server Actions keep the `{ok:false,error}` shape; redirects on success.
- Generic messages: "Email or password is incorrect." (don't distinguish).
- Reset request always returns ok (no account enumeration).
- Rate-limit + `withTimeout(…,10000)` on every auth network call (no infinite
  spinner — carries over the earlier fix).
- Booking auth failure must not consume seats; finalize only after auth ok.

## 7. Testing
- Unit: `passwordSchema` + `passwordDisallowsIdentity` (valid/invalid cases,
  name/email-substring rejection) — the one required check for the policy logic.
- Integration: update `src/domain/booking/cycle.integration.test.ts` to drive
  password register/sign-in instead of OTP through the full booking cycle.
- Manual/preview: sign in, register, booking register+signin, reset.

## 8. Out of scope
- Hard-blocking unverified users from signing in (banner only for now).
- Social/OAuth login. PhonePe (already separate). Admin auth (uses same
  Supabase session; unaffected).

## 9. Open item for reviewer
- Q: null `bookings.user_id` vs delete the 8 test bookings on wipe?
  Recommendation: **null** (keep rows). Confirm.
