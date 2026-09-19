import "server-only";
import { Resend } from "resend";

// Transactional email via Resend (server-only, non-blocking). If RESEND_API_KEY
// is unset the calls no-op so local/dev flows don't break. Per docs/V2_DECISIONS
// an email failure never blocks the booking. NOTE: booking *confirmation* email
// belongs to the payment phase (never send confirmation before verified payment).

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Alpha Adventures <onboarding@resend.dev>";
const adminTo = process.env.ADMIN_NOTIFY_EMAIL;

const client = apiKey ? new Resend(apiKey) : null;

async function send(to: string, subject: string, html: string) {
  if (!client) return; // no key configured — skip silently
  try {
    await client.emails.send({ from, to, subject, html });
  } catch (e) {
    console.error("[email] send failed:", (e as Error).message);
  }
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

export type BookingEmail = {
  to: string;
  reference: string;
  trekTitle: string;
  departureDate: string | null;
  seats: number;
  total: number;
};

// Sent when a booking reaches pending_payment (awaiting payment). This is a
// "we've reserved your spot, complete payment" notice — NOT a confirmation.
export async function sendBookingPendingEmail(b: BookingEmail) {
  await send(
    b.to,
    `Complete your booking ${b.reference} — Alpha Adventures`,
    `<h2>Almost there!</h2>
     <p>We've reserved your spot for <strong>${b.trekTitle}</strong>${
       b.departureDate ? ` on ${b.departureDate}` : ""
     }.</p>
     <p>Booking reference: <strong>${b.reference}</strong><br/>
     Travellers: ${b.seats}<br/>
     Amount: <strong>${rupees(b.total)}</strong></p>
     <p>Complete payment to confirm your booking.</p>`,
  );
  if (adminTo) {
    await send(
      adminTo,
      `New pending booking ${b.reference}`,
      `<p>${b.trekTitle} — ${b.seats} traveller(s) — ${rupees(b.total)} — ${b.to}</p>`,
    );
  }
}

// Sent after verified (here: mock) payment — the real confirmation.
export async function sendBookingConfirmedEmail(b: BookingEmail) {
  await send(
    b.to,
    `Booking confirmed ${b.reference} — Alpha Adventures`,
    `<h2>You're confirmed! 🎉</h2>
     <p><strong>${b.trekTitle}</strong>${b.departureDate ? ` on ${b.departureDate}` : ""}</p>
     <p>Reference: <strong>${b.reference}</strong><br/>
     Travellers: ${b.seats}<br/>
     Paid: <strong>${rupees(b.total)}</strong></p>
     <p>See you on the trail!</p>`,
  );
  if (adminTo) {
    await send(
      adminTo,
      `Booking CONFIRMED ${b.reference}`,
      `<p>${b.trekTitle} — ${b.seats} traveller(s) — ${rupees(b.total)} — ${b.to}</p>`,
    );
  }
}
