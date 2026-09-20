// Verify a received email OTP. Usage: node scripts/otp-verify.mjs <code> [email]
// Proves the full OTP round-trip: the code from the inbox establishes a session.
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const code = process.argv[2];
const email = process.argv[3] || process.env.ADMIN_NOTIFY_EMAIL;

if (!code) { console.error("Usage: node scripts/otp-verify.mjs <6-digit-code> [email]"); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
if (error) { console.error("VERIFY FAILED:", error.message); process.exit(1); }
console.log("VERIFIED — session created for user:", data.user?.id, "(", data.user?.email, ")");
