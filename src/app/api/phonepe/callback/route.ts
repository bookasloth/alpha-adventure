import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";
import { phonePeStatus, verifyCallbackAuth, REDIRECT_BASE } from "@/lib/payment/phonepe";
import { confirmPhonePePayment } from "@/domain/booking/service";
import { sendBookingConfirmedEmail, sendDepositReceivedEmail } from "@/lib/email";
import { background } from "@/lib/after";
import type { PaymentNotice } from "@/domain/booking/paymentNotice";

// Where to send a customer whose PhonePe payment did NOT settle, so they land
// somewhere that can show a message and retry (never a silent dashboard):
// balance -> /pay-balance/<ref>; full/deposit -> back to the trek's booking page.
async function retryUrl(admin: SupabaseClient, mtx: string, notice: PaymentNotice) {
  const { data } = await admin.from("payments").select("kind,bookings(reference,treks(slug))").eq("merchant_order_id", mtx).maybeSingle();
  const bk = data?.bookings as unknown as { reference: string; treks: { slug: string } | null } | null;
  const q = `payment=${notice}`;
  if (data?.kind === "balance" && bk?.reference) return `${REDIRECT_BASE}/pay-balance/${encodeURIComponent(bk.reference)}?${q}`;
  if (bk?.treks?.slug) return `${REDIRECT_BASE}/book/${bk.treks.slug}?${q}`;
  return `${REDIRECT_BASE}/user-dashboard?${q}`;
}

// Same emails the Razorpay path sends (razorpayPayment.settleRazorpayPayment):
// confirmed on 'confirmed', deposit-received on 'deposit_paid'. Non-blocking.
async function notifySettled(admin: SupabaseClient, bookingId: string, outcome: "confirmed" | "deposit_paid") {
  const { data: b } = await admin
    .from("bookings")
    .select("reference,trek_title,departure_date,adults,children,price_adult,price_child,addons_total,boarding_total,grand_total,balance_due,balance_due_date,contact_email")
    .eq("id", bookingId)
    .single();
  if (!b?.contact_email) return;
  const base = {
    to: b.contact_email, reference: b.reference, trekTitle: b.trek_title ?? "your trek",
    departureDate: b.departure_date, seats: (b.adults ?? 0) + (b.children ?? 0), total: b.grand_total,
  };
  if (outcome === "deposit_paid")
    await sendDepositReceivedEmail({ ...base, balanceDue: b.balance_due, balanceDueDate: b.balance_due_date, boardingTotal: b.boarding_total });
  else
    await sendBookingConfirmedEmail({ ...base, adults: b.adults, children: b.children, priceAdult: b.price_adult, priceChild: b.price_child, addonsTotal: b.addons_total });
}

// PhonePe returns the user here (REDIRECT) and may also POST server-to-server.
// Either way we verify status server-side (source of truth) and confirm the
// booking idempotently, then send the user to their dashboard. The amount the
// gateway reports is asserted against the stored payment before confirming.
async function handle(mtx: string | null) {
  if (!mtx) return NextResponse.redirect(`${REDIRECT_BASE}/user-dashboard?payment=error`);
  const admin = createAdminClient();
  const status = await phonePeStatus(mtx);
  if (!status.paid) {
    // Terminal failure/cancel -> "failed" (retry). Anything not yet final (PENDING,
    // or a status-check hiccup) -> "pending": tell them NOT to pay again.
    const final = status.code !== "PENDING" && status.code !== "ERROR" && status.code !== "NO_TOKEN" && status.code !== "UNKNOWN";
    return NextResponse.redirect(await retryUrl(admin, mtx, final ? "failed" : "pending"));
  }

  const booking = await confirmPhonePePayment(admin, mtx, status.providerTxnId, status.amount); // L1: amount asserted
  // Paid at PhonePe but not applied (amount mismatch / booking no longer payable):
  // never pretend success, and never invite a second charge.
  if (!booking) return NextResponse.redirect(await retryUrl(admin, mtx, "error"));
  // Only the first settle emails; the redirect + server callback can both arrive.
  if (booking.outcome === "confirmed" || booking.outcome === "deposit_paid") background(notifySettled(admin, booking.id, booking.outcome));
  const ref = booking.reference ? `&booked=${booking.reference}` : "";
  return NextResponse.redirect(`${REDIRECT_BASE}/user-dashboard?payment=success${ref}`);
}

export async function GET(request: Request) {
  return handle(new URL(request.url).searchParams.get("mtx"));
}

export async function POST(request: Request) {
  // Audit L2: PhonePe's server-to-server webhook carries an Authorization header
  // set to SHA256(username:password); verify it before trusting the POST. We
  // still re-query status (source of truth); this rejects forged/replayed POSTs
  // cheaply. When an Authorization header is present it must validate.
  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  // Require a valid webhook Authorization on every POST. verifyCallbackAuth
  // returns false when the header is missing/forged OR when the webhook creds
  // aren't configured — so until the dashboard webhook is set up, every POST is
  // rejected (bookings confirm via the browser-redirect GET path, not this).
  // ponytail: header format (bare hex vs scheme prefix) still unconfirmed —
  // verifyCallbackAuth accepts either; nail it down against a real callback.
  const auth = request.headers.get("authorization");
  if (!verifyCallbackAuth(auth)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const payload = (body?.payload ?? {}) as Record<string, unknown>;
  const mtx = new URL(request.url).searchParams.get("mtx")
    ?? (payload?.merchantOrderId as string | undefined)
    ?? (body?.merchantTransactionId as string | undefined)
    ?? null;
  return handle(mtx);
}
