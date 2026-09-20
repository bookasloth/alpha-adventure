// Mints a Supabase OTP via admin.generateLink and emails the CODE ourselves
// through Hostinger SMTP — mirrors the app's mintAndSendOtp. Supabase's own
// email delivery is bypassed. Usage: node scripts/otp-send.mjs [email]
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const email = process.argv[2] || process.env.ADMIN_NOTIFY_EMAIL;
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error || !data?.properties?.email_otp) { console.error("mint failed:", error?.message); process.exit(1); }
const code = data.properties.email_otp;

const port = Number(process.env.SMTP_PORT || 465);
const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
const info = await t.sendMail({
  from: process.env.EMAIL_FROM || process.env.SMTP_USER,
  to: email,
  subject: `${code} is your Alpha Adventures code`,
  html: `<h2>Your login code</h2><p>Enter this code to confirm your booking:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p><p>It expires in 1 hour.</p>`,
});
console.log("Sent code to", email, "| messageId", info.messageId);
console.log("Server said:", info.response);
