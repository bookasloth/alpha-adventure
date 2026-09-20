// Live OTP send test. Usage: node scripts/otp-test.mjs [email]
// Uses the anon/publishable key (same as the app) to trigger a Supabase email OTP.
// If it returns no error, Supabase accepted it and queued the code via the
// configured (Hostinger) SMTP — check that inbox for the 6-digit code.
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.argv[2] || process.env.ADMIN_NOTIFY_EMAIL;

const supabase = createClient(url, key, { auth: { persistSession: false } });

console.log("Sending OTP to", email, "…");
const t = Date.now();
const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
if (error) {
  console.error("FAILED:", error.message, "(status", error.status + ")");
  process.exit(1);
}
console.log(`OK in ${Date.now() - t}ms — Supabase accepted the OTP request.`);
console.log("Check", email, "for the 6-digit code.");
