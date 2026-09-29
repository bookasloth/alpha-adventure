# Password-based Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email-OTP auth with email+password across sign-in, signup, forgot/reset, and the guest booking checkout.

**Architecture:** Supabase native `signInWithPassword` / `admin.createUser`. Login/signup/reset redirect (commits session cookie). Booking stays on-page and keeps the existing HMAC `payToken` bearer. Email ownership is verified out-of-band via an HMAC-signed link delivered by our Brevo mailer — non-blocking, banner only.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), zod, Brevo/SMTP mailer, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-29-password-auth-design.md`

## Global Constraints

- Server Actions return `{ ok: false, error }` on failure; success either `redirect()`s (login/signup/reset) or returns `{ ok: true, ... }` (booking).
- A value-returning Server Action cannot commit the session cookie — only `redirect()` does. Booking authorises the pay step off the HMAC `payToken`, never a session.
- Every auth network call: wrap in `withTimeout(p, 10000)` and gate with `limitByIp`.
- Password policy (verbatim): min 8 chars; ≥1 uppercase `[A-Z]`; ≥1 digit `\d`; ≥1 special `[^A-Za-z0-9]`; must NOT contain (case-insensitive) any name token of length ≥3 or the email local-part.
- Never distinguish "no such user" from "wrong password": message is `"Email or password is incorrect."`
- Password reset request always returns `{ ok: true }` (no account enumeration).
- `admin` client (`createAdminClient`) is server-only, always behind validation.
- New user metadata key is `first_name` (the existing `handle_new_user` trigger reads `raw_user_meta_data->>'first_name'` and also inserts the `customer` role).

## Review Focus

- **Password containing the name/email** (e.g. name "Alpha", password "Alpha@123") — must be rejected by `passwordDisallowsIdentity`; covered in Task 2.
- **Booking register when the email already exists** — `admin.createUser` fails with "already registered"; `authenticateBooking` register mode must fall back to a clear "account exists, sign in instead" error, not a 500; covered in Task 8.
- **Reset link reused/expired** — `/reset-password` with a stale token must show an error and a "request a new link" path, not hang; covered in Task 6.
- **Seats must not be consumed on failed auth** — `authenticateBooking` calls `linkAndFinalize` only after auth succeeds; covered in Task 8.
- **Unverified email** — sign-in and booking must still work; only a banner shows; covered in Task 7/9.

---

## File Structure

- `supabase/migrations/0012_password_auth.sql` — add `profiles.email_verified`; (wipe is a separate one-time SQL run, Task 1).
- `src/domain/booking/schema.ts` — add `passwordSchema`, `nameSchema`, `passwordDisallowsIdentity`; remove `otpSchema` (Task 10).
- `src/lib/verifyEmail.ts` — HMAC verify-email token mint/check + `sendVerifyEmail`.
- `src/lib/email.ts` — add `sendVerifyEmail` template; remove `sendOtpEmail` (Task 10).
- `src/lib/siteUrl.ts` — canonical site base URL helper (for links in emails).
- `src/utils/supabase/client.ts` — browser client (for `/reset-password`).
- `src/app/login/actions.ts` — `signIn`, `register`, `requestPasswordReset`, `signOut`.
- `src/app/login/LoginForm.tsx` — password + mode toggle.
- `src/app/reset-password/page.tsx` + `ResetForm.tsx` — set new password.
- `src/app/verify-email/page.tsx` — consume verify token.
- `src/app/forgot-password/page.tsx` — reset-link copy + action.
- `src/app/signup/page.tsx` — render `LoginForm` in register mode.
- `src/app/book/actions.ts` — `authenticateBooking`; remove OTP actions.
- `src/app/book/[slug]/BookingFlow.tsx` — password identity step.
- `src/domain/booking/cycle.integration.test.ts` — password path.
- `docs/AUTHENTICATION.md` — describe password auth.

---

## Task 1: DB — add `email_verified`, wipe test users

**Files:**
- Create: `supabase/migrations/0012_password_auth.sql`

**Interfaces:**
- Produces: `public.profiles.email_verified boolean not null default false`.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0012_password_auth.sql
-- Switch to password auth: track our own (non-blocking) email verification.
alter table public.profiles
  add column if not exists email_verified boolean not null default false;
```

- [ ] **Step 2: Apply the migration**

Run via Supabase MCP `apply_migration` (name `0012_password_auth`) or `supabase db push`.
Expected: column exists — verify:
```sql
select column_name from information_schema.columns
where table_schema='public' and table_name='profiles' and column_name='email_verified';
```
Expected: one row.

- [ ] **Step 3: Wipe the 6 test users (one-time, NOT a migration)**

Run once via Supabase MCP `execute_sql`:
```sql
update public.bookings set user_id = null where user_id is not null;  -- keep booking rows
delete from auth.users;  -- cascades to profiles + user_roles
```
Expected: `select count(*) from auth.users;` → 0; `select count(*) from public.bookings;` → 8 (unchanged).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0012_password_auth.sql
git commit -m "feat(db): add profiles.email_verified for password auth"
```

---

## Task 2: Validation — password/name schema + identity check

**Files:**
- Modify: `src/domain/booking/schema.ts`
- Test: `src/domain/booking/password.test.ts`

**Interfaces:**
- Produces:
  - `passwordSchema: z.ZodString`
  - `nameSchema: z.ZodString`
  - `passwordDisallowsIdentity(pw: string, id: { name?: string; email?: string }): boolean` — `true` when the password is clean (contains no name token ≥3 chars and not the email local-part).

- [ ] **Step 1: Write the failing test**

```typescript
// src/domain/booking/password.test.ts
import { describe, it, expect } from "vitest";
import { passwordSchema, passwordDisallowsIdentity } from "./schema";

describe("passwordSchema", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Trek@2026").success).toBe(true);
  });
  it("rejects too short", () => {
    expect(passwordSchema.safeParse("Aa@1").success).toBe(false);
  });
  it("rejects missing uppercase", () => {
    expect(passwordSchema.safeParse("trek@2026").success).toBe(false);
  });
  it("rejects missing digit", () => {
    expect(passwordSchema.safeParse("Trekking@x").success).toBe(false);
  });
  it("rejects missing special", () => {
    expect(passwordSchema.safeParse("Trekking2026").success).toBe(false);
  });
});

describe("passwordDisallowsIdentity", () => {
  it("rejects password containing the name", () => {
    expect(passwordDisallowsIdentity("Alpha@123", { name: "Alpha Singh" })).toBe(false);
  });
  it("rejects password containing the email local-part", () => {
    expect(passwordDisallowsIdentity("Rahul@2026", { email: "rahul@example.com" })).toBe(false);
  });
  it("ignores name tokens shorter than 3 chars", () => {
    expect(passwordDisallowsIdentity("Xy@201234", { name: "Xy Bo" })).toBe(true);
  });
  it("accepts a clean password", () => {
    expect(passwordDisallowsIdentity("Trek@2026", { name: "Alpha", email: "alpha@x.com" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- src/domain/booking/password.test.ts`
Expected: FAIL (`passwordSchema`/`passwordDisallowsIdentity` not exported).

- [ ] **Step 3: Implement**

Add to `src/domain/booking/schema.ts`:
```typescript
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/\d/, "Add a number.")
  .regex(/[^A-Za-z0-9]/, "Add a special character.");

export const nameSchema = z.string().trim().min(2, "Enter your name.").max(80);

// True when the password does NOT embed the user's identity (name token ≥3
// chars, or the email local-part). Case-insensitive substring check.
export function passwordDisallowsIdentity(pw: string, id: { name?: string; email?: string }): boolean {
  const lower = pw.toLowerCase();
  const tokens: string[] = [];
  if (id.name) tokens.push(...id.name.toLowerCase().split(/\s+/));
  if (id.email) tokens.push(id.email.toLowerCase().split("@")[0] ?? "");
  return !tokens.some((t) => t.length >= 3 && lower.includes(t));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test -- src/domain/booking/password.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/booking/schema.ts src/domain/booking/password.test.ts
git commit -m "feat(auth): password + name validation with identity check"
```

---

## Task 3: Site URL helper + verify-email lib

**Files:**
- Create: `src/lib/siteUrl.ts`
- Create: `src/lib/verifyEmail.ts`
- Modify: `src/lib/email.ts` (add `sendVerifyEmail` template)

**Interfaces:**
- Consumes: `sendMail` from `src/lib/mailer.ts`; `createAdminClient`.
- Produces:
  - `siteUrl(): string`
  - `signVerifyToken(userId: string): string`, `verifyVerifyToken(v?: string|null): string|null`
  - `sendVerifyEmail(userId: string, to: string): Promise<void>`

- [ ] **Step 1: Site URL helper**

```typescript
// src/lib/siteUrl.ts
import "server-only";
// Canonical public base URL for links in emails. Prefers an explicit env,
// falls back to the Vercel-provided host, then localhost for dev.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
```

- [ ] **Step 2: Verify-email token + sender**

```typescript
// src/lib/verifyEmail.ts
import "server-only";
import crypto from "crypto";
import { sendVerifyEmail as mailVerify } from "./email";
import { siteUrl } from "./siteUrl";

function secret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.CRON_SECRET ?? "dev-only-insecure";
}
export function signVerifyToken(userId: string): string {
  const mac = crypto.createHmac("sha256", secret()).update(`verify:${userId}`).digest("hex");
  return `${userId}.${mac}`;
}
export function verifyVerifyToken(value?: string | null): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = value.slice(0, dot);
  const good = crypto.createHmac("sha256", secret()).update(`verify:${userId}`).digest("hex");
  const a = Buffer.from(value.slice(dot + 1));
  const b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}
export async function sendVerifyEmail(userId: string, to: string): Promise<void> {
  const link = `${siteUrl()}/verify-email?token=${encodeURIComponent(signVerifyToken(userId))}`;
  await mailVerify(to, link);
}
```

- [ ] **Step 3: Email template** — add to `src/lib/email.ts`

```typescript
// Non-blocking "confirm your email" — verifies ownership out of band; does not
// gate sign-in or booking. Does NOT throw (a failure just means no banner clear).
export async function sendVerifyEmail(to: string, link: string) {
  await sendMail(
    to,
    "Confirm your email — Alpha Adventures",
    `<h2>Confirm your email</h2>
     <p>Tap below to confirm this is your email address.</p>
     <p><a href="${link}" style="display:inline-block;background:#fe5100;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Confirm email</a></p>
     <p>If you didn't create an account, ignore this email.</p>`,
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/siteUrl.ts src/lib/verifyEmail.ts src/lib/email.ts
git commit -m "feat(auth): HMAC verify-email link via Brevo mailer"
```

---

## Task 4: Login/signup/reset server actions

**Files:**
- Modify: `src/app/login/actions.ts` (replace OTP actions)

**Interfaces:**
- Consumes: `passwordSchema`, `nameSchema`, `emailSchema`, `passwordDisallowsIdentity`; `createClient`, `createAdminClient`; `sendVerifyEmail`; `background`; `limitByIp`.
- Produces:
  - `signIn(rawEmail, rawPassword, rawNext?): Promise<Result>` (redirects on success)
  - `register(rawName, rawEmail, rawPassword, rawNext?): Promise<Result>` (redirects on success)
  - `requestPasswordReset(rawEmail): Promise<Result>` (always ok)
  - `signOut()` (unchanged)

- [ ] **Step 1: Rewrite the file**

```typescript
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendVerifyEmail } from "@/lib/verifyEmail";
import { siteUrl } from "@/lib/siteUrl";
import { background } from "@/lib/after";
import { limitByIp } from "@/lib/rateLimit";
import { emailSchema, passwordSchema, nameSchema, passwordDisallowsIdentity } from "@/domain/booking/schema";

type Result = { ok: true } | { ok: false; error: string };

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}
function safeNext(raw: unknown): string {
  return typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/user-dashboard";
}
const BAD_CREDS = "Email or password is incorrect.";

export async function signIn(rawEmail: unknown, rawPassword: unknown, rawNext?: unknown): Promise<Result> {
  if (!(await limitByIp("signin", 10, 60))) return { ok: false, error: "Too many attempts. Please wait a minute." };
  const e = emailSchema.safeParse(rawEmail);
  if (!e.success || typeof rawPassword !== "string" || !rawPassword) return { ok: false, error: BAD_CREDS };
  const supabase = createClient(cookies());
  let res;
  try {
    res = await withTimeout(supabase.auth.signInWithPassword({ email: e.data, password: rawPassword }), 10000);
  } catch {
    return { ok: false, error: "That took too long — please try again." };
  }
  if (res.error || !res.data.user) return { ok: false, error: BAD_CREDS };
  redirect(safeNext(rawNext));
}

export async function register(rawName: unknown, rawEmail: unknown, rawPassword: unknown, rawNext?: unknown): Promise<Result> {
  if (!(await limitByIp("signup", 5, 60))) return { ok: false, error: "Too many attempts. Please wait a minute." };
  const name = nameSchema.safeParse(rawName);
  const e = emailSchema.safeParse(rawEmail);
  const pw = passwordSchema.safeParse(rawPassword);
  if (!name.success) return { ok: false, error: name.error.issues[0]!.message };
  if (!e.success) return { ok: false, error: e.error.issues[0]!.message };
  if (!pw.success) return { ok: false, error: pw.error.issues[0]!.message };
  if (!passwordDisallowsIdentity(pw.data, { name: name.data, email: e.data }))
    return { ok: false, error: "Password must not contain your name or email." };

  const admin = createAdminClient();
  let created;
  try {
    created = await withTimeout(
      admin.auth.admin.createUser({
        email: e.data, password: pw.data, email_confirm: true,
        user_metadata: { first_name: name.data },
      }),
      10000,
    );
  } catch {
    return { ok: false, error: "That took too long — please try again." };
  }
  if (created.error || !created.data.user) {
    const msg = (created.error?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists"))
      return { ok: false, error: "An account with this email already exists. Please sign in." };
    return { ok: false, error: "Could not create your account. Please try again." };
  }
  background(sendVerifyEmail(created.data.user.id, e.data));

  const supabase = createClient(cookies());
  const res = await supabase.auth.signInWithPassword({ email: e.data, password: pw.data });
  if (res.error) return { ok: false, error: "Account created — please sign in." };
  redirect(safeNext(rawNext));
}

export async function requestPasswordReset(rawEmail: unknown): Promise<Result> {
  if (!(await limitByIp("reset", 5, 60))) return { ok: false, error: "Too many requests. Please wait a minute." };
  const e = emailSchema.safeParse(rawEmail);
  if (!e.success) return { ok: true }; // don't leak; nothing to send
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.generateLink({
      type: "recovery", email: e.data,
      options: { redirectTo: `${siteUrl()}/reset-password` },
    });
    const link = data?.properties?.action_link;
    if (link) {
      const { sendResetEmail } = await import("@/lib/email");
      background(sendResetEmail(e.data, link));
    }
  } catch { /* fail-open: still return ok */ }
  return { ok: true };
}

export async function signOut() {
  const supabase = createClient(cookies());
  await supabase.auth.signOut();
  redirect("/");
}
```

- [ ] **Step 2: Add `sendResetEmail` to `src/lib/email.ts`**

```typescript
export async function sendResetEmail(to: string, link: string) {
  await sendMail(
    to,
    "Reset your password — Alpha Adventures",
    `<h2>Reset your password</h2>
     <p>Tap below to choose a new password. The link expires in 1 hour.</p>
     <p><a href="${link}" style="display:inline-block;background:#fe5100;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p>
     <p>If you didn't request this, ignore this email.</p>`,
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no remaining references to removed `sendLoginOtp`/`verifyLoginOtp` — LoginForm is updated in Task 5; if typecheck flags LoginForm, do Task 5 before re-running).

- [ ] **Step 4: Commit**

```bash
git add src/app/login/actions.ts src/lib/email.ts
git commit -m "feat(auth): password sign-in/register/reset server actions"
```

---

## Task 5: LoginForm — password UI + mode toggle

**Files:**
- Modify: `src/app/login/LoginForm.tsx`
- Modify: `src/app/signup/page.tsx` (pass `mode="register"`)

**Interfaces:**
- Consumes: `signIn`, `register`, `requestPasswordReset` from `./actions`.
- Produces: `LoginForm` accepting a `mode?: "signin" | "register"` prop (default `"signin"`).

- [ ] **Step 1: Rewrite LoginForm**

Replace the whole component body. Keep `ProgressBar` (unchanged). New form:

```typescript
"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, register, requestPasswordReset } from "./actions";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-[10px] border border-line bg-slate-50 px-4 py-3.5 text-[15px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

// (keep the existing ProgressBar function here unchanged)

export default function LoginForm({
  mode = "signin",
  heading,
  sub,
  defaultNext = "/user-dashboard",
}: {
  mode?: "signin" | "register";
  heading?: string;
  sub?: string;
  defaultNext?: string;
}) {
  const params = useSearchParams();
  const next = params.get("next") || defaultNext;
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const NET_ERR = "Something went wrong. Please try again.";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = isRegister
        ? await register(name, email, password, next)
        : await signIn(email, password, next);
      if (r && !r.ok) { setError(r.error); }
      else return; // success redirects server-side
    } catch (err) {
      if (err && typeof err === "object" && "digest" in err &&
          typeof (err as { digest?: string }).digest === "string" &&
          (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw err;
      setError(NET_ERR);
    }
    setBusy(false);
  }

  async function onForgot() {
    setError(null); setNotice(null);
    if (!/.+@.+\..+/.test(email)) { setError("Enter your email above first."); return; }
    setBusy(true);
    try { await requestPasswordReset(email); setNotice("If that email has an account, a reset link is on its way."); }
    catch { setError(NET_ERR); }
    setBusy(false);
  }

  return (
    <div>
      <p className="mb-6 text-lg font-bold">
        <Link href="/" className="text-primary hover:underline">Homepage</Link>
        <span className="mx-2 text-gray-300">\\</span>
        <span className="text-ink">{heading ?? (isRegister ? "Create your account" : "Welcome back!")}</span>
      </p>
      <ProgressBar active={busy} />
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {notice && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <form onSubmit={onSubmit} className="space-y-5">
        {sub && <p className="text-sm text-gray-500">{sub}</p>}
        {isRegister && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Email Address</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Password</label>
          <div className="relative">
            <input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "8+ chars, 1 capital, 1 number, 1 symbol" : "Your password"} className={inputCls} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{show ? "Hide" : "Show"}</button>
          </div>
          {isRegister && <p className="mt-1.5 text-xs text-gray-500">At least 8 characters, one capital, one number, one special character. Don't use your name or email.</p>}
        </div>
        {!isRegister && (
          <div className="flex justify-end text-sm">
            <button type="button" onClick={onForgot} className="font-medium text-gray-500 hover:text-primary">Forgot password?</button>
          </div>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? (isRegister ? "Creating…" : "Signing in…") : (isRegister ? "Create account" : "Log In")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {isRegister ? (<>Already a member? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></>)
                    : (<>New here? <Link href="/signup" className="font-semibold text-primary hover:underline">Create an account</Link></>)}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Update signup page** — `src/app/signup/page.tsx`

Change the `<LoginForm .../>` usage to:
```tsx
<LoginForm mode="register" sub="Create your account with an email and password." />
```
Remove the now-invalid `cta`/OTP `sub` props.

- [ ] **Step 3: Verify in preview**

Start dev server (`preview_start`), open `/login` and `/signup`. Confirm: fields render, show/hide works, a wrong sign-in shows "Email or password is incorrect.", register with a weak password shows the policy error. (No account created yet needs valid data.)

- [ ] **Step 4: Commit**

```bash
git add src/app/login/LoginForm.tsx src/app/signup/page.tsx
git commit -m "feat(auth): password login/register form with mode toggle"
```

---

## Task 6: Reset-password flow

**Files:**
- Create: `src/utils/supabase/client.ts` (browser client)
- Create: `src/app/reset-password/page.tsx`
- Create: `src/app/reset-password/ResetForm.tsx`
- Modify: `src/app/forgot-password/page.tsx`

**Interfaces:**
- Consumes: `createBrowserClient` from `@supabase/ssr`; `passwordSchema`.
- Produces: `createBrowserClient()` wrapper in `src/utils/supabase/client.ts`.

- [ ] **Step 1: Browser client**

```typescript
// src/utils/supabase/client.ts
"use client";
import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```
(Env names match `docs/ENVIRONMENT_VARIABLES.md` / existing server client — confirm the publishable-key var name there and match it.)

- [ ] **Step 2: Reset form (client)**

```tsx
// src/app/reset-password/ResetForm.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { passwordSchema } from "@/domain/booking/schema";

const inputCls = "w-full rounded-[10px] border border-line bg-slate-50 px-4 py-3.5 text-[15px] text-ink outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

export default function ResetForm() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The recovery link lands with a session in the URL; @supabase/ssr picks it up.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pw = passwordSchema.safeParse(password);
    if (!pw.success) { setError(pw.error.issues[0]!.message); return; }
    setBusy(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setError("This reset link is invalid or expired. Request a new one."); return; }
    router.replace("/user-dashboard");
  }

  if (!ready) return <p className="text-sm text-gray-500">Open this page from your reset email. <a className="text-primary hover:underline" href="/forgot-password">Request a new link</a>.</p>;
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">New password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ chars, 1 capital, 1 number, 1 symbol" className={inputCls} />
      </div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Set new password"}</Button>
    </form>
  );
}
```

- [ ] **Step 3: Reset page (server)**

```tsx
// src/app/reset-password/page.tsx
import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import ResetForm from "./ResetForm";
export const metadata = { title: "Reset password" };
export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <p className="mb-6 text-lg font-bold text-ink">Choose a new password</p>
      <Suspense fallback={null}><ResetForm /></Suspense>
    </AuthLayout>
  );
}
```
(Check `AuthLayout` props — `topRight` is optional per `signup/page.tsx`; if required, pass a "Back to sign in" link like the current forgot-password page.)

- [ ] **Step 4: Forgot-password page → request a reset link**

Replace `src/app/forgot-password/page.tsx` body to render `LoginForm` is wrong here (that's sign-in). Instead use a tiny inline client form calling `requestPasswordReset`. Simplest: reuse `LoginForm`'s forgot path is already present — but to keep it focused, render a dedicated request form:

```tsx
import AuthLayout from "@/components/auth/AuthLayout";
import Link from "next/link";
import ForgotForm from "./ForgotForm";
export const metadata = { title: "Trouble signing in" };
export default function ForgotPasswordPage() {
  return (
    <AuthLayout topRight={<Link href="/login" className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">Back to sign in</Link>}>
      <p className="mb-6 text-lg font-bold text-ink">Reset your password</p>
      <ForgotForm />
    </AuthLayout>
  );
}
```

Create `src/app/forgot-password/ForgotForm.tsx`:
```tsx
"use client";
import { useState } from "react";
import { requestPasswordReset } from "../login/actions";
import { Button } from "@/components/ui/button";
const inputCls = "w-full rounded-[10px] border border-line bg-slate-50 px-4 py-3.5 text-[15px] text-ink outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";
export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    await requestPasswordReset(email); setBusy(false);
    setNotice("If that email has an account, a reset link is on its way.");
  }
  return notice ? <p className="text-sm text-green-700">{notice}</p> : (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-sm text-gray-500">Enter your email and we'll send a reset link.</p>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Sending…" : "Send reset link"}</Button>
    </form>
  );
}
```

- [ ] **Step 5: Typecheck + preview**

Run: `npm run typecheck` → PASS. In preview, `/forgot-password` sends (shows notice); `/reset-password` without a session shows the "open from email" message.

- [ ] **Step 6: Commit**

```bash
git add src/utils/supabase/client.ts src/app/reset-password src/app/forgot-password
git commit -m "feat(auth): password reset request + set-new-password flow"
```

---

## Task 7: Verify-email route + dashboard banner

**Files:**
- Create: `src/app/verify-email/page.tsx`
- Modify: `src/app/user-dashboard/page.jsx` (pass `emailVerified` to Dashboard) and `src/app/user-dashboard/Dashboard.tsx` (banner)

**Interfaces:**
- Consumes: `verifyVerifyToken` from `@/lib/verifyEmail`; `createAdminClient`.

- [ ] **Step 1: Verify-email page**

```tsx
// src/app/verify-email/page.tsx
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { verifyVerifyToken } from "@/lib/verifyEmail";
import { createAdminClient } from "@/utils/supabase/admin";
export const metadata = { title: "Email verified" };
export const dynamic = "force-dynamic";
export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const userId = verifyVerifyToken(searchParams.token);
  let ok = false;
  if (userId) {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ email_verified: true }).eq("id", userId);
    ok = !error;
  }
  return (
    <AuthLayout>
      <p className="mb-4 text-lg font-bold text-ink">{ok ? "Email confirmed ✓" : "Link invalid or expired"}</p>
      <p className="text-sm text-gray-500">{ok ? "Thanks — your email is verified." : "This confirmation link didn't work. You can still use your account."}</p>
      <div className="mt-6"><Link href="/user-dashboard" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-ink">Go to dashboard</Link></div>
    </AuthLayout>
  );
}
```

- [ ] **Step 2: Dashboard banner**

In `src/app/user-dashboard/page.jsx`, the `profile` already comes from `profiles.select("*")`; pass `emailVerified={profile?.email_verified ?? false}` into `<Dashboard .../>`. In `Dashboard.tsx`, accept the prop and render at top when false:
```tsx
{!emailVerified && (
  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    Please confirm your email — check your inbox for the verification link.
  </div>
)}
```

- [ ] **Step 3: Typecheck + preview**

Run: `npm run typecheck` → PASS. (Full click-through verified in Task 9's end-to-end.)

- [ ] **Step 4: Commit**

```bash
git add src/app/verify-email src/app/user-dashboard
git commit -m "feat(auth): verify-email route + dashboard unverified banner"
```

---

## Task 8: Booking auth action

**Files:**
- Modify: `src/app/book/actions.ts` (replace `sendBookingOtp`/`verifyBookingOtp`/`resendBookingOtp` with `authenticateBooking`)

**Interfaces:**
- Consumes: `signInWithPassword`, `admin.createUser`; `linkAndFinalize`; `signPay`; `passwordSchema`, `nameSchema`, `emailSchema`, `passwordDisallowsIdentity`; `sendVerifyEmail`.
- Produces: `authenticateBooking(bookingId: string, raw: { name?: unknown; email: unknown; password: unknown; mode: "signin"|"register" }, token?: string): Promise<Result<{ reference: string; payToken: string }>>`

- [ ] **Step 1: Replace the three OTP actions with one**

Delete `sendBookingOtp`, `verifyBookingOtp`, `resendBookingOtp`. Remove `mintOtp`/`sendOtpEmail`/`otpSchema` imports. Add:

```typescript
import { emailSchema, passwordSchema, nameSchema, passwordDisallowsIdentity } from "@/domain/booking/schema";
import { sendVerifyEmail } from "@/lib/verifyEmail";
// (keep createClient, createAdminClient, linkAndFinalize, signPay, background, limitByIp, sendBookingPendingEmail)

export async function authenticateBooking(
  bookingId: string,
  raw: { name?: unknown; email: unknown; password: unknown; mode: "signin" | "register" },
  token?: string,
): Promise<Result<{ reference: string; payToken: string }>> {
  if (!(await limitByIp("book-auth", 10, 60))) return { ok: false, error: "Too many attempts. Please wait a minute." };
  const email = emailSchema.safeParse(raw.email);
  if (!email.success) return { ok: false, error: "Invalid email." };
  if (typeof raw.password !== "string" || !raw.password) return { ok: false, error: "Enter your password." };

  const draftToken = draftTokenFrom(token);
  if (!draftToken) return { ok: false, error: "Your booking session expired. Please start again." };

  const admin = createAdminClient();
  const { data: b } = await admin.from("bookings").select("id,draft_token,status").eq("id", bookingId).maybeSingle();
  if (!b || b.draft_token !== draftToken) return { ok: false, error: "Booking not found." };
  if (b.status !== "draft" && b.status !== "pending_auth") return { ok: false, error: "This booking can no longer be verified." };
  await admin.from("bookings").update({ contact_email: email.data, status: "pending_auth" }).eq("id", bookingId);

  // Establish the user (sign in existing, or register new). Never consume seats
  // until we hold a real user id.
  const supabase = createClient(cookies());
  let userId: string;
  if (raw.mode === "register") {
    const name = nameSchema.safeParse(raw.name);
    const pw = passwordSchema.safeParse(raw.password);
    if (!name.success) return { ok: false, error: name.error.issues[0]!.message };
    if (!pw.success) return { ok: false, error: pw.error.issues[0]!.message };
    if (!passwordDisallowsIdentity(pw.data, { name: name.data, email: email.data }))
      return { ok: false, error: "Password must not contain your name or email." };
    const created = await admin.auth.admin.createUser({
      email: email.data, password: pw.data, email_confirm: true, user_metadata: { first_name: name.data },
    });
    if (created.error || !created.data.user) {
      const msg = (created.error?.message ?? "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists"))
        return { ok: false, error: "An account with this email already exists — switch to Sign in." };
      return { ok: false, error: "Could not create your account. Please try again." };
    }
    userId = created.data.user.id;
    background(sendVerifyEmail(userId, email.data));
    await supabase.auth.signInWithPassword({ email: email.data, password: pw.data }); // best-effort session
  } else {
    const res = await supabase.auth.signInWithPassword({ email: email.data, password: raw.password });
    if (res.error || !res.data.user) return { ok: false, error: "Email or password is incorrect." };
    userId = res.data.user.id;
  }

  try {
    const finalized = await linkAndFinalize(admin, bookingId, draftToken, userId);
    cookies().delete(DRAFT_COOKIE);
    const payToken = signPay(userId);
    background(sendBookingPendingEmail({
      to: email.data, reference: finalized.reference, trekTitle: finalized.trek_title ?? "your trek",
      departureDate: finalized.departure_date, seats: finalized.adults + finalized.children, total: finalized.grand_total,
    }));
    return { ok: true, reference: finalized.reference, payToken };
  } catch (e) {
    const msg = (e as Error).message.toLowerCase().includes("seat")
      ? "Those seats were just taken. Please pick another departure."
      : "Could not complete your booking. Please try again.";
    return { ok: false, error: msg };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (BookingFlow still references old actions — update in Task 9; if typecheck flags BookingFlow, proceed to Task 9 then re-run).

- [ ] **Step 3: Commit**

```bash
git add src/app/book/actions.ts
git commit -m "feat(booking): password sign-in/register at checkout (replaces OTP)"
```

---

## Task 9: BookingFlow — password identity step

**Files:**
- Modify: `src/app/book/[slug]/BookingFlow.tsx`

**Interfaces:**
- Consumes: `authenticateBooking` from `../actions` (replaces the three OTP imports).

- [ ] **Step 1: Update imports + state**

- Line 5 import: `import { createDraft, authenticateBooking, startPayment } from "../actions";`
- Change the `Pay` type (line 12): `type Pay = "auth" | "pay";`
- Add state near line 37: `const [authMode, setAuthMode] = useState<"signin"|"register">("register");`, `const [name, setName] = useState("");`, `const [password, setPassword] = useState("");`
- Change initial `pay` state (line 36): `useState<Pay>("auth")`.

- [ ] **Step 2: Replace the send/verify handlers (lines 76–93)**

```typescript
async function authenticate() {
  setError(null);
  if (!/.+@.+\..+/.test(email)) return setError("Enter a valid email.");
  if (!password) return setError("Enter your password.");
  if (authMode === "register" && name.trim().length < 2) return setError("Enter your name.");
  setBusy(true);
  const d = await ensureDraft();
  if (!d) return setBusy(false);
  const r = await authenticateBooking(d.id, { name, email, password, mode: authMode }, d.token);
  setBusy(false);
  if (!r.ok) return setError(r.error);
  setReference(r.reference); setPayToken(r.payToken); setPay("pay");
}
```

- [ ] **Step 3: Replace the step-4 identity panels (lines 198–213)**

Remove both the `pay === "email"` and `pay === "otp"` panels; replace with:
```tsx
{step === 4 && pay === "auth" && (
  <Panel eyebrow="Step 5 of 5" title={authMode === "register" ? "Create your account" : "Sign in to book"} desc={authMode === "register" ? "Set a password — you'll use it to manage your bookings." : "Welcome back — sign in to confirm your booking."}>
    {authMode === "register" && (<>
      <label className="bk-fld">Full name</label>
      <input className="bk-inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
    </>)}
    <label className="bk-fld">Email address</label>
    <input className="bk-inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
    <label className="bk-fld">Password</label>
    <input className="bk-inp" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
      placeholder={authMode === "register" ? "8+ chars, 1 capital, 1 number, 1 symbol" : "Your password"} />
    {authMode === "register" && <div className="bk-tiny" style={{ marginTop: 6 }}>At least 8 characters, one capital, one number, one special character.</div>}
    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
      <button type="button" className="bk-linkbtn" onClick={() => { setError(null); setAuthMode(authMode === "register" ? "signin" : "register"); }}>
        {authMode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </div>
    <Foot back={{ onClick: () => go(3) }} next={{ label: busy ? "Please wait…" : (authMode === "register" ? "Create & continue" : "Sign in & continue"), onClick: authenticate, disabled: busy }} />
  </Panel>
)}
```

- [ ] **Step 4: Remove the `OtpForm` component + `CODE_LEN`** (lines 282–302) — no longer referenced.

- [ ] **Step 5: Typecheck + full preview click-through**

Run: `npm run typecheck` → PASS.
In preview, do a full booking: pick departure → travellers → extras → **register** with name/email/strong password → reserve → pay (mock) → confirmed. Then repeat with a second booking using **sign in** (same account). Confirm no 500s (`read_console_messages`, `preview_logs`).

- [ ] **Step 6: Commit**

```bash
git add "src/app/book/[slug]/BookingFlow.tsx"
git commit -m "feat(booking): password identity step UI (replaces OTP entry)"
```

---

## Task 10: Cleanup, integration test, docs

**Files:**
- Delete: `src/lib/otp.ts`
- Modify: `src/lib/email.ts` (remove `sendOtpEmail`), `src/domain/booking/schema.ts` (remove `otpSchema`)
- Modify: `src/domain/booking/cycle.integration.test.ts`
- Modify: `docs/AUTHENTICATION.md`

- [ ] **Step 1: Delete OTP code**

```bash
git rm src/lib/otp.ts
```
Remove `sendOtpEmail` from `src/lib/email.ts` and `otpSchema` from `src/domain/booking/schema.ts`. Grep to confirm no references remain:
Run: `git grep -n "mintOtp\|sendOtpEmail\|otpSchema\|verifyOtp"` → only expected hits (none in `src/`, integration test updated next).

- [ ] **Step 2: Update the booking integration test**

In `src/domain/booking/cycle.integration.test.ts`, replace the OTP verify step with the password path: create the user via `admin.auth.admin.createUser({ email, password, email_confirm:true })`, then drive `linkAndFinalize` / `confirmMockPayment` exactly as before (the test already calls the service layer, not the OTP action). Update any OTP-specific setup to password.

- [ ] **Step 3: Run tests**

Run: `npm run test` → PASS. `npm run test:integration` (if env configured) → PASS.

- [ ] **Step 4: Update docs**

In `docs/AUTHENTICATION.md`, replace the OTP description with: email+password via Supabase; register creates a pre-confirmed user (`email_confirm:true`) with `first_name` metadata; non-blocking Brevo verify-email link sets `profiles.email_verified`; reset via `admin.generateLink({type:"recovery"})` → `/reset-password`. Note "Confirm email" is OFF in Supabase Auth.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(auth): remove OTP code, update integration test + docs"
```

---

## Task 11: Supabase config — "Confirm email" OFF

**Files:** none (platform config).

- [ ] **Step 1: Turn OFF "Confirm email"** in Supabase Auth → Providers → Email (or via the management API `PATCH /v1/projects/{ref}/config/auth` with `{ "mailer_autoconfirm": true }` — i.e. autoconfirm on / confirmation off). This lets `signInWithPassword` succeed immediately after register even though we create users with `email_confirm:true` (belt-and-suspenders).
- [ ] **Step 2: Verify** — register a fresh account end-to-end in preview and confirm immediate session (no "email not confirmed" error).
- [ ] **Step 3: Document** the setting in `docs/DEPLOYMENT.md` env/config section. Commit that doc change.

---

## Post-implementation

- Whole-branch review (subagent-driven or one fresh reviewer).
- Deploy cache-less to production and verify `/login`, `/signup`, booking, reset end-to-end.
- Merge `fix/bundle-pattern-b-html` → main so the ENOENT fix + this work land together.
