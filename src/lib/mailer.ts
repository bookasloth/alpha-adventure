import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// SMTP transport (Hostinger). Server-only, non-blocking. Reads creds from env;
// if unset, sends are skipped so local flows don't break. The SAME creds go into
// Supabase Auth → Custom SMTP for the OTP email.
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

export const EMAIL_FROM = process.env.EMAIL_FROM || user || "no-reply@localhost";

let cached: Transporter | null = null;
function transport(): Transporter | null {
  if (cached) return cached;
  if (!host || !user || !pass) return null;
  cached = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return cached;
}

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  opts?: { throwOnError?: boolean },
) {
  const t = transport();
  if (!t) {
    const msg = "SMTP not configured";
    if (opts?.throwOnError) throw new Error(msg);
    console.warn("[mailer]", msg, "— skipping email to", to);
    return;
  }
  try {
    await t.sendMail({ from: EMAIL_FROM, to, subject, html });
  } catch (e) {
    if (opts?.throwOnError) throw e;
    console.error("[mailer] send failed:", (e as Error).message);
  }
}
