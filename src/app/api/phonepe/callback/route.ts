import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { phonePeStatus, REDIRECT_BASE } from "@/lib/payment/phonepe";
import { confirmPhonePePayment } from "@/domain/booking/service";

// PhonePe returns the user here (REDIRECT) and may also POST server-to-server.
// Either way we verify status server-side (source of truth) and confirm the
// booking idempotently, then send the user to their dashboard.
async function handle(mtx: string | null) {
  if (!mtx) return NextResponse.redirect(`${REDIRECT_BASE}/user-dashboard?payment=error`);
  const status = await phonePeStatus(mtx);
  if (!status.paid) return NextResponse.redirect(`${REDIRECT_BASE}/user-dashboard?payment=failed`);

  const admin = createAdminClient();
  const booking = await confirmPhonePePayment(admin, mtx, status.providerTxnId);
  const ref = booking?.reference ? `&booked=${booking.reference}` : "";
  return NextResponse.redirect(`${REDIRECT_BASE}/user-dashboard?payment=success${ref}`);
}

export async function GET(request: Request) {
  return handle(new URL(request.url).searchParams.get("mtx"));
}

export async function POST(request: Request) {
  const mtx = new URL(request.url).searchParams.get("mtx")
    ?? (await request.json().catch(() => ({}) as Record<string, unknown>))?.merchantTransactionId as string | undefined
    ?? null;
  return handle(mtx);
}
