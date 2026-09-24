import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// Email transport. Prefers Brevo's HTTP API (works from serverless, no SMTP IP
// allowlist to manage); falls back to SMTP if BREVO_API_KEY is unset. Server-
// only. If neither is configured, sends are skipped so local flows don't break.
const brevoKey = process.env.BREVO_API_KEY;
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

const RAW_FROM = process.env.EMAIL_FROM || user || "no-reply@localhost";
export const EMAIL_FROM = RAW_FROM;

// Parse `Name <email>` or a bare address into Brevo's {name?, email} sender.
function parseFrom(raw: string): { name?: string; email: string } {
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2] };
  return { email: raw.trim() };
}

async function sendViaBrevo(to: string, subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoKey!,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: parseFrom(RAW_FROM),
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${body.slice(0, 300)}`);
  }
}

let cached: Transporter | null = null;
function transport(): Transporter | null {
  if (cached) return cached;
  if (!host || !user || !pass) return null;
  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
  return cached;
}

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  opts?: { throwOnError?: boolean },
) {
  try {
    if (brevoKey) {
      await sendViaBrevo(to, subject, html);
      return;
    }
    const t = transport();
    if (!t) {
      const msg = "No email transport configured (set BREVO_API_KEY or SMTP_*)";
      if (opts?.throwOnError) throw new Error(msg);
      console.warn("[mailer]", msg, "— skipping email to", to);
      return;
    }
    await t.sendMail({ from: EMAIL_FROM, to, subject, html });
  } catch (e) {
    if (opts?.throwOnError) throw e;
    console.error("[mailer] send failed:", (e as Error).message);
  }
}
