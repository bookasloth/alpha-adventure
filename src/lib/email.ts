import "server-only";
import { sendMail } from "./mailer";
import { escapeHtml } from "./html";

// Transactional email via Hostinger SMTP (server-only, non-blocking). An email
// failure never blocks the booking. NOTE: the OTP code email is sent by Supabase
// Auth (configure the same SMTP under Auth → Custom SMTP), not here.

const adminTo = process.env.ADMIN_NOTIFY_EMAIL;
const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

// Loud, one-time config check (runs on cold start via module import). Warns
// rather than throws so a mail misconfig never takes down the whole site — but at
// error level, so it surfaces in prod logs instead of failing silently at send
// time. Only in production to avoid noise in local dev where mail is often off.
if (process.env.NODE_ENV === "production") {
  const hasTransport =
    Boolean(process.env.BREVO_API_KEY) ||
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!hasTransport)
    console.error("[email] MISCONFIG: no mail transport (set BREVO_API_KEY or SMTP_HOST/USER/PASS) — transactional email is DISABLED.");
  if (!process.env.EMAIL_FROM)
    console.error("[email] MISCONFIG: EMAIL_FROM unset — sender falls back to no-reply@localhost, which providers will reject.");
  if (!adminTo)
    console.error("[email] MISCONFIG: ADMIN_NOTIFY_EMAIL unset — operator gets no booking/enquiry notifications.");
}

// Non-blocking "confirm your email" — verifies ownership out of band; does not
// gate sign-in or booking. Does NOT throw (a failure just means no banner clear).
export async function sendVerifyEmail(to: string, link: string) {
  await sendMail(
    to,
    "Confirm your email — Alpha Adventures",
    `<h2>Confirm your email</h2>
     <p>Tap below to confirm this is your email address.</p>
     <p><a href="${link}" style="display:inline-block;background:#fe5100;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Confirm email</a></p>
     <p>If you didn't create an account, ignore this email.</p>`,
  );
}

// Password reset link (via admin.generateLink recovery), delivered by our mailer.
export async function sendResetEmail(to: string, link: string) {
  await sendMail(
    to,
    "Reset your password — Alpha Adventures",
    `<h2>Reset your password</h2>
     <p>Tap below to choose a new password. The link expires in 1 hour.</p>
     <p><a href="${link}" style="display:inline-block;background:#fe5100;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p>
     <p>If you didn't request this, ignore this email.</p>`,
  );
}

export type BookingEmail = {
  to: string;
  reference: string;
  trekTitle: string;
  departureDate: string | null;
  seats: number;
  total: number;
  // Optional line items — when present the confirmation renders a full receipt.
  adults?: number;
  children?: number;
  priceAdult?: number;
  priceChild?: number;
  addonsTotal?: number;
};

// Sent when a booking reaches pending_payment — a "we've held your spot" notice.
export async function sendBookingPendingEmail(b: BookingEmail) {
  const title = escapeHtml(b.trekTitle);
  await sendMail(
    b.to,
    `Complete your booking ${b.reference} — Alpha Adventures`,
    `<h2>Almost there!</h2>
     <p>We've held your spot for <strong>${title}</strong>${b.departureDate ? ` on ${escapeHtml(b.departureDate)}` : ""}.</p>
     <p>Booking reference: <strong>${b.reference}</strong><br/>
     Travellers: ${b.seats}<br/>Amount: <strong>${rupees(b.total)}</strong></p>
     <p>Complete payment to confirm your booking.</p>`,
  );
  if (adminTo) {
    await sendMail(adminTo, `New pending booking ${b.reference}`,
      `<p>${title} — ${b.seats} traveller(s) — ${rupees(b.total)} — ${escapeHtml(b.to)}</p>`);
  }
}

// A receipt line: "Adults (2 × ₹1,299)  ₹2,598". Only rendered when we have the
// per-head prices (confirm/finalize rows carry them).
function receiptRow(label: string, qty: number, unit: number): string {
  if (!qty) return "";
  return `<tr>
    <td style="padding:4px 0;color:#555">${label} (${qty} × ${rupees(unit)})</td>
    <td style="padding:4px 0;text-align:right;font-weight:600">${rupees(qty * unit)}</td>
  </tr>`;
}

// Sent after verified (here: mock) payment — the real confirmation + receipt.
export async function sendBookingConfirmedEmail(b: BookingEmail) {
  const title = escapeHtml(b.trekTitle);
  const hasItems = b.priceAdult != null && b.adults != null;
  const receipt = hasItems
    ? `<table style="width:100%;max-width:420px;border-collapse:collapse;margin:12px 0;font-size:14px">
         ${receiptRow("Adults", b.adults ?? 0, b.priceAdult ?? 0)}
         ${receiptRow("Children", b.children ?? 0, b.priceChild ?? 0)}
         ${b.addonsTotal ? `<tr><td style="padding:4px 0;color:#555">Add-ons</td><td style="padding:4px 0;text-align:right;font-weight:600">${rupees(b.addonsTotal)}</td></tr>` : ""}
         <tr><td style="padding:8px 0;border-top:1px solid #e5e5e5;font-weight:700">Total paid</td>
             <td style="padding:8px 0;border-top:1px solid #e5e5e5;text-align:right;font-weight:700">${rupees(b.total)}</td></tr>
       </table>`
    : `<p>Paid: <strong>${rupees(b.total)}</strong></p>`;
  await sendMail(
    b.to,
    `Booking confirmed ${b.reference} — Alpha Adventures`,
    `<h2>You're confirmed! 🎉</h2>
     <p><strong>${title}</strong>${b.departureDate ? ` on ${escapeHtml(b.departureDate)}` : ""}</p>
     <p>Reference: <strong>${b.reference}</strong><br/>Travellers: ${b.seats}</p>
     <h3 style="margin:16px 0 4px">Receipt</h3>
     ${receipt}
     <p>Keep this email as your receipt. See you on the trail!</p>`,
  );
  if (adminTo) {
    await sendMail(adminTo, `Booking CONFIRMED ${b.reference}`,
      `<p>${title} — ${b.seats} traveller(s) — ${rupees(b.total)} — ${escapeHtml(b.to)}</p>`);
  }
}

// Pre-departure reminder — sent once by the booking-reminders cron. Throws on
// send failure so the cron only stamps reminder_sent_at on real success (a
// failed send is retried on the next run rather than silently marked done).
export async function sendBookingReminderEmail(b: BookingEmail) {
  const title = escapeHtml(b.trekTitle);
  await sendMail(
    b.to,
    `Reminder: ${b.trekTitle} is coming up — Alpha Adventures`,
    `<h2>Your trek is almost here! 🎒</h2>
     <p><strong>${title}</strong>${b.departureDate ? ` on <strong>${escapeHtml(b.departureDate)}</strong>` : ""}</p>
     <p>Reference: <strong>${b.reference}</strong><br/>Travellers: ${b.seats}</p>
     <p>Please carry a valid ID, reach the base point on time, and pack for the weather.
     Questions? Just reply to this email or WhatsApp us.</p>`,
    { throwOnError: true },
  );
}

// Contact/enquiry alert to the operator. Single-operator business: an unseen
// lead is a lost booking. All fields are user-supplied — escape everything.
export type LeadNotify = {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
};
export async function sendLeadNotification(lead: LeadNotify) {
  if (!adminTo) {
    console.warn("[email] ADMIN_NOTIFY_EMAIL unset — new enquiry not notified:", lead.email);
    return;
  }
  const name = escapeHtml(lead.name);
  await sendMail(
    adminTo,
    `New enquiry from ${name}`,
    `<h2>New enquiry</h2>
     <p><strong>Name:</strong> ${name}<br/>
     <strong>Email:</strong> ${escapeHtml(lead.email)}<br/>
     <strong>Phone:</strong> ${lead.phone ? escapeHtml(lead.phone) : "—"}<br/>
     <strong>Subject:</strong> ${lead.subject ? escapeHtml(lead.subject) : "—"}</p>
     <p><strong>Message:</strong><br/>${escapeHtml(lead.message).replace(/\n/g, "<br/>")}</p>`,
  );
}
