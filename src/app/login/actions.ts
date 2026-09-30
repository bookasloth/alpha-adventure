"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendVerifyEmail } from "@/lib/verifyEmail";
import { siteUrl } from "@/lib/siteUrl";
import { background } from "@/lib/after";
import { limitByIp } from "@/lib/rateLimit";
import { withTimeout } from "@/lib/withTimeout";
import { emailSchema, passwordSchema, nameSchema, passwordDisallowsIdentity } from "@/domain/booking/schema";

type Result = { ok: true } | { ok: false; error: string };

const BAD_CREDS = "Email or password is incorrect.";

// Validates credentials + rate-limits, but does NOT establish the session here:
// cookies set inside a Server Action don't reach the browser in this app (see
// book/actions.ts). The client sets the session via the browser Supabase client
// after this returns ok. Server sign-in here is only the rate-limited credential
// check (brute-force guard the client can't enforce).
export async function signIn(rawEmail: unknown, rawPassword: unknown): Promise<Result> {
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
  return { ok: true };
}

// Creates the pre-confirmed account (admin) + fires the verify email. Returns
// ok; the client then signs in with the browser client to set the session.
export async function register(rawName: unknown, rawEmail: unknown, rawPassword: unknown): Promise<Result> {
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
  return { ok: true };
}

// Always returns ok — never leak whether an account exists.
export async function requestPasswordReset(rawEmail: unknown): Promise<Result> {
  if (!(await limitByIp("reset", 5, 60))) return { ok: false, error: "Too many requests. Please wait a minute." };
  const e = emailSchema.safeParse(rawEmail);
  if (!e.success) return { ok: true };
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

