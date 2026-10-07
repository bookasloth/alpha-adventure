import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { phonePeStatus, verifyCallbackChecksum, REDIRECT_BASE } from "@/lib/payment/phonepe";
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
  // Audit L2: if PhonePe sent a signed server-to-server callback, verify the
  // X-VERIFY checksum over the base64 `response` body before trusting it. We
  // still re-query status (source of truth); this rejects forged/replayed POSTs
  // cheaply. The browser REDIRECT path carries no signature, so only enforce
  // when both the header and a response body are present.
  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const base64 = typeof body?.response === "string" ? body.response : "";
  const xVerify = request.headers.get("x-verify");
  if (xVerify && base64 && !verifyCallbackChecksum(base64, xVerify)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const mtx = new URL(request.url).searchParams.get("mtx")
    ?? (body?.merchantTransactionId as string | undefined)
    ?? null;
  return handle(mtx);
}
