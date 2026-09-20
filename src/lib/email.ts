import "server-only";
import { sendMail } from "./mailer";

// Transactional email via Hostinger SMTP (server-only, non-blocking). An email
// failure never blocks the booking. NOTE: the OTP code email is sent by Supabase
// Auth (configure the same SMTP under Auth → Custom SMTP), not here.

const adminTo = process.env.ADMIN_NOTIFY_EMAIL;
const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

// The login code. Supabase mints the OTP (via admin.generateLink) but we send
// it ourselves through Hostinger SMTP — Supabase's own email delivery is not
// used. Throws on send failure so the caller can surface it (unlike the
// booking notices, delivering this code is the whole point of the step).
export async function sendOtpEmail(to: string, code: string) {
  await sendMail(
    to,
    `${code} is your Alpha Adventures code`,
    `<h2>Your login code</h2>
     <p>Enter this code to confirm your booking:</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
     <p>It expires in 1 hour. If you didn't request this, ignore this email.</p>`,
    { throwOnError: true },
  );
}

export type BookingEmail = {
  to: string;
  reference: string;
  trekTitle: string;
  departureDate: string | null;
  seats: number;
  total: number;
};

// Sent when a booking reaches pending_payment — a "we've held your spot" notice.
export async function sendBookingPendingEmail(b: BookingEmail) {
  await sendMail(
    b.to,
    `Complete your booking ${b.reference} — Alpha Adventures`,
    `<h2>Almost there!</h2>
     <p>We've held your spot for <strong>${b.trekTitle}</strong>${b.departureDate ? ` on ${b.departureDate}` : ""}.</p>
     <p>Booking reference: <strong>${b.reference}</strong><br/>
     Travellers: ${b.seats}<br/>Amount: <strong>${rupees(b.total)}</strong></p>
     <p>Complete payment to confirm your booking.</p>`,
  );
  if (adminTo) {
    await sendMail(adminTo, `New pending booking ${b.reference}`,
      `<p>${b.trekTitle} — ${b.seats} traveller(s) — ${rupees(b.total)} — ${b.to}</p>`);
  }
}

// Sent after verified (here: mock) payment — the real confirmation.
export async function sendBookingConfirmedEmail(b: BookingEmail) {
  await sendMail(
    b.to,
    `Booking confirmed ${b.reference} — Alpha Adventures`,
    `<h2>You're confirmed! 🎉</h2>
     <p><strong>${b.trekTitle}</strong>${b.departureDate ? ` on ${b.departureDate}` : ""}</p>
     <p>Reference: <strong>${b.reference}</strong><br/>
     Travellers: ${b.seats}<br/>Paid: <strong>${rupees(b.total)}</strong></p>
     <p>See you on the trail!</p>`,
  );
  if (adminTo) {
    await sendMail(adminTo, `Booking CONFIRMED ${b.reference}`,
      `<p>${b.trekTitle} — ${b.seats} traveller(s) — ${rupees(b.total)} — ${b.to}</p>`);
  }
}
