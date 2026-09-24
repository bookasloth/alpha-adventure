"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { mintOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { background } from "@/lib/after";
import { emailSchema, otpSchema } from "@/domain/booking/schema";

type Result = { ok: true } | { ok: false; error: string };

// Mint the code (fast Supabase Auth call), then fire the SMTP email WITHOUT
// awaiting it — the slow part is delivery, and the UI can advance to the code
// step immediately. If the send fails, the user's "Resend code" button retries.
export async function sendLoginOtp(rawEmail: unknown): Promise<Result> {
  const e = emailSchema.safeParse(rawEmail);
  if (!e.success) return { ok: false, error: e.error.issues[0]?.message ?? "Invalid email." };
  let code: string;
  try {
    code = await mintOtp(createAdminClient(), e.data);
  } catch {
    return { ok: false, error: "Could not send the code. Please try again." };
  }
  // Non-blocking: don't make the user wait on SMTP. background() uses Vercel's
  // waitUntil so the serverless function isn't frozen before the send finishes.
  background(sendOtpEmail(e.data, code));
  return { ok: true };
}

// Keep only same-origin relative paths — block open-redirect via ?next=//evil.com
// or an absolute URL.
function safeNext(raw: unknown): string {
  return typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")
    ? raw
    : "/user-dashboard";
}

export async function verifyLoginOtp(
  rawEmail: unknown,
  rawCode: unknown,
  rawNext?: unknown,
): Promise<Result> {
  const e = emailSchema.safeParse(rawEmail);
  const c = otpSchema.safeParse(rawCode);
  if (!e.success || !c.success) return { ok: false, error: "Enter the 8-digit code." };
  const supabase = createClient(cookies());
  const { error } = await supabase.auth.verifyOtp({ email: e.data, token: c.data, type: "email" });
  if (error) return { ok: false, error: "That code is incorrect or expired." };
  // Redirect server-side, AFTER the session cookie is set. A client-side
  // router.replace here does not reliably navigate — the router cache still
  // holds the pre-auth tree. redirect() throws NEXT_REDIRECT, so nothing runs
  // after it. Never reaches the return.
  redirect(safeNext(rawNext));
}

export async function signOut() {
  const supabase = createClient(cookies());
  await supabase.auth.signOut();
  redirect("/");
}
