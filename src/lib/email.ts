import "server-only";
import { sendMail } from "./mailer";
import { siteUrl } from "./siteUrl";
import * as T from "./emailTemplates";
import type { BookingEmail, DepartureChange, LeadEmail, Rendered } from "./emailTemplates";

export type { BookingEmail, DepartureChange, LeadEmail } from "./emailTemplates";

// Transactional email senders (server-only, non-blocking callers wrap these in
// background()). Templates/design live in emailTemplates.ts and are previewed
// at /admin/emails. An email failure never blocks a booking.

const adminTo = process.env.ADMIN_NOTIFY_EMAIL;

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

// Columns every booking email needs; select these, then map with bookingEmailOf().
export const BOOKING_EMAIL_COLS = "id,reference,trek_title,departure_date,adults,children,grand_total,contact_email";
type BookingRow = {
  reference: string; trek_title: string | null; departure_date: string | null;
  adults: number | null; children: number | null; grand_total: number | null; contact_email: string | null;
};
export function bookingEmailOf(row: BookingRow, extra: Partial<BookingEmail> = {}): BookingEmail | null {
  if (!row.contact_email) return null;
  return {
    to: row.contact_email,
    reference: row.reference,
    trekTitle: row.trek_title ?? "your trek",
    departureDate: row.departure_date,
    seats: (row.adults ?? 0) + (row.children ?? 0),
    total: row.grand_total ?? 0,
    ...extra,
  };
}

const send = (to: string, r: Rendered, opts?: { throwOnError?: boolean; replyTo?: string }) =>
  sendMail(to, r.subject, r.html, { text: r.text, ...opts });

// Operator alert; replies go straight to the customer.
async function alertOperator(r: Rendered, customerEmail?: string) {
  if (!adminTo) {
    console.warn("[email] ADMIN_NOTIFY_EMAIL unset — operator alert skipped:", r.subject);
    return;
  }
  await send(adminTo, r, { replyTo: customerEmail });
}

/* account */
export async function sendVerifyEmail(to: string, link: string) {
  await send(to, T.verifyEmail(siteUrl(), link));
}
export async function sendResetEmail(to: string, link: string) {
  await send(to, T.resetPassword(siteUrl(), link));
}

/* bookings */
export async function sendBookingPendingEmail(b: BookingEmail) {
  const base = siteUrl();
  await send(b.to, T.bookingPending(base, b));
  await alertOperator(T.adminBookingAlert(base, "pending", b), b.to);
}
export async function sendBookingConfirmedEmail(b: BookingEmail) {
  const base = siteUrl();
  await send(b.to, T.bookingConfirmed(base, b));
  await alertOperator(T.adminBookingAlert(base, "confirmed", b), b.to);
}
// Throws on failure so the cron only stamps on real success (retried next run).
export async function sendBookingReminderEmail(b: BookingEmail) {
  await send(b.to, T.bookingReminder(siteUrl(), b), { throwOnError: true });
}
export async function sendBookingCancelledEmail(b: BookingEmail, by: "customer" | "operator") {
  const base = siteUrl();
  await send(b.to, T.bookingCancelled(base, b, by));
  if (by === "customer") await alertOperator(T.adminBookingAlert(base, "cancelled", b, by), b.to);
}
export async function sendHoldExpiredEmail(b: BookingEmail) {
  await send(b.to, T.holdExpired(siteUrl(), b), { throwOnError: true });
}
export async function sendDepartureChangedEmail(b: BookingEmail, change: DepartureChange) {
  await send(b.to, T.departureChanged(siteUrl(), b, change));
}
export async function sendPaymentRefundedEmail(b: BookingEmail) {
  await send(b.to, T.paymentRefunded(siteUrl(), b));
}
export async function sendRefundFailedAlert(paymentId: string, amount: number, reason: string) {
  await alertOperator(T.adminRefundFailed(siteUrl(), paymentId, amount, reason));
}
export async function sendReviewRequestEmail(b: BookingEmail) {
  await send(b.to, T.reviewRequest(siteUrl(), b), { throwOnError: true });
}

/* enquiries */
export type LeadNotify = LeadEmail;
// Operator alert for a new contact-form enquiry + an acknowledgement to the
// sender. All fields are user-supplied; templates escape everything.
export async function sendLeadNotification(lead: LeadEmail) {
  const base = siteUrl();
  await Promise.all([
    alertOperator(T.adminEnquiryAlert(base, lead), lead.email),
    send(lead.email, T.enquiryReceived(base, lead)),
  ]);
}
export async function sendLeadReplyEmail(to: string, name: string, subject: string, body: string) {
  await send(to, T.leadReply(siteUrl(), name, subject, body));
}
