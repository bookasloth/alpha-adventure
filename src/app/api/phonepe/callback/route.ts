import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { phonePeStatus, verifyCallbackAuth, REDIRECT_BASE } from "@/lib/payment/phonepe";
import { confirmPhonePePayment } from "@/domain/booking/service";

// PhonePe returns the user here (REDIRECT) and may also POST server-to-server.
// Either way we verify status server-side (source of truth) and confirm the
// booking idempotently, then send the user to their dashboard. The amount the
// gateway reports is asserted against the stored payment before confirming.
async function handle(mtx: string | null) {
  if (!mtx) return NextResponse.redirect(`${REDIRECT_BASE}/user-dashboard?payment=error`);
  const status = await phonePeStatus(mtx);
  if (!status.paid) return NextResponse.redirect(`${REDIRECT_BASE}/user-dashboard?payment=failed`);

  const admin = createAdminClient();
  const booking = await confirmPhonePePayment(admin, mtx, status.providerTxnId, status.amount); // L1: amount asserted
  if (!booking) return NextResponse.redirect(`${REDIRECT_BASE}/user-dashboard?payment=error`);
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
  const auth = request.headers.get("authorization");
  if (auth && !verifyCallbackAuth(auth)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const payload = (body?.payload ?? {}) as Record<string, unknown>;
  const mtx = new URL(request.url).searchParams.get("mtx")
    ?? (payload?.merchantOrderId as string | undefined)
    ?? (body?.merchantTransactionId as string | undefined)
    ?? null;
  return handle(mtx);
}
