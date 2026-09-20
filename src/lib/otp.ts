import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOtpEmail } from "./email";

// Mint an email OTP without Supabase's own (unreliable) email delivery:
// ensure the user exists (idempotent, pre-confirmed so magiclink works), have
// Supabase generate the code, then send it ourselves via SMTP. verifyOtp
// (type "email") validates this same code. Shared by booking + login.
export async function mintAndSendOtp(admin: SupabaseClient, email: string) {
  await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const code = data?.properties?.email_otp;
  if (error || !code) throw new Error("mint failed");
  await sendOtpEmail(email, code);
}
