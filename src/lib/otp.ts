import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOtpEmail } from "./email";

// Mint an email OTP without Supabase's own (unreliable) email delivery: have
// Supabase generate the code (generateLink for an existing user), and only
// create the user if they don't exist yet — so the common returning-user login
// costs ONE Auth round-trip, not two. verifyOtp (type "email") validates this
// same code. Shared by booking + login.
export async function mintOtp(admin: SupabaseClient, email: string): Promise<string> {
  let code = await tryGenerate(admin, email);
  if (!code) {
    // User likely doesn't exist yet — create (pre-confirmed so magiclink works) and retry.
    await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
    code = await tryGenerate(admin, email);
  }
  if (!code) throw new Error("mint failed");
  return code;
}

async function tryGenerate(admin: SupabaseClient, email: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) return null;
  return data?.properties?.email_otp ?? null;
}

// Mint + send, awaiting delivery. Used where the caller wants the send to
// complete (or fail) before returning — e.g. booking flows.
export async function mintAndSendOtp(admin: SupabaseClient, email: string) {
  const code = await mintOtp(admin, email);
  await sendOtpEmail(email, code);
}
