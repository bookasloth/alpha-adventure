# Authentication & Authorization

## Email + password (Supabase Auth)
Sign-in and registration use Supabase native email+password
(`signInWithPassword`, `admin.createUser`). Server Actions live in
`src/app/login/actions.ts` (`signIn`, `register`, `requestPasswordReset`,
`signOut`); the client form is `src/app/login/LoginForm.tsx` (mode `signin` |
`register`, reused by `/login` and `/signup`).

- **Register** creates a pre-confirmed user (`email_confirm: true`) with
  `user_metadata.first_name`. The `on_auth_user_created` trigger
  (`handle_new_user`) inserts the `profiles` row + `customer` role.
- **Redirect after auth is server-side** (`redirect()` in the action) — a
  client redirect after a Server Action auth does not reliably navigate.
- **Password policy** (`src/domain/booking/schema.ts`): min 8, ≥1 uppercase,
  ≥1 digit, ≥1 special; must not contain the user's name or email local-part
  (`passwordDisallowsIdentity`).

## Email verification (non-blocking)
Supabase native "Confirm email" is **OFF**. On register we send our own
HMAC-signed verification link (`src/lib/verifyEmail.ts`) via the Brevo mailer.
`/verify-email?token=…` sets `profiles.email_verified = true`. It gates nothing
— only a dashboard banner shows while unverified. This keeps guest checkout
uninterrupted.

## Password reset
`requestPasswordReset` → `admin.generateLink({ type: "recovery" })` → link
delivered by our mailer → `/reset-password` (browser client picks up the
recovery session) → `supabase.auth.updateUser({ password })`. Requests always
return ok (no account enumeration).

## Booking identity (guest-first)
`src/app/book/actions.ts` `authenticateBooking(bookingId, {name?, email,
password, mode}, token?)`: sign in or register at the checkout identity step,
then `linkAndFinalize` reserves seats. Seats are never consumed until a real
user id is held. Because cookies set in a value-returning Server Action don't
reach the browser, the pay step authorises off an HMAC `payToken` bearer, not a
session.

## Authorization
`user_roles` (`customer`/`staff`/`admin`) + `is_admin()`/`is_staff()` SQL
helpers. `/admin` gated by `requireAdmin()` (`src/app/admin/data.ts`);
`/user-dashboard` and `/account` require a session. Middleware
(`src/middleware.ts`) refreshes the session only on `/account`,
`/user-dashboard`, `/admin` (scoped to avoid concurrent-refresh logouts).

## Config
Supabase Auth → "Confirm email" must be **OFF** (see DEPLOYMENT.md).
