import "server-only";
import { sendMail } from "./mailer";

// Transactional email via Hostinger SMTP (server-only, non-blocking). An email
// failure never blocks the booking. NOTE: the OTP code email is sent by Supabase
// Auth (configure the same SMTP under Auth → Custom SMTP), not here.

const adminTo = process.env.ADMIN_NOTIFY_EMAIL;
const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

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
