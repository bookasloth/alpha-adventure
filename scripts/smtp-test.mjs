// Standalone Hostinger SMTP check. Usage: node scripts/smtp-test.mjs [recipient]
// Loads creds from .env.local, verifies the transport, sends one test email.
import { readFileSync } from "fs";
import nodemailer from "nodemailer";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM || user;
const to = process.argv[2] || process.env.ADMIN_NOTIFY_EMAIL || user;

if (!host || !user || !pass) {
  console.error("Missing SMTP_HOST / SMTP_USER / SMTP_PASS in .env.local");
  process.exit(1);
}

const t = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });

console.log(`Verifying ${host}:${port} as ${user} …`);
await t.verify();
console.log("SMTP connection OK. Sending test email to", to, "…");
const info = await t.sendMail({
  from,
  to,
  subject: "Alpha Adventures — SMTP test ✅",
  html: "<h2>It works!</h2><p>Hostinger SMTP is wired correctly.</p>",
});
console.log("Sent:", info.messageId);
console.log("Server said:", info.response);
