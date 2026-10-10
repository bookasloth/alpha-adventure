import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifyWebhookSignature, type RzpPayment } from "@/lib/payment/razorpay";
import { settleRazorpayPayment } from "@/domain/booking/razorpayPayment";

export const dynamic = "force-dynamic";

// Razorpay webhook (Dashboard -> Webhooks -> https://<site>/api/razorpay/webhook,
// events: payment.captured, payment.failed, order.paid). Confirms bookings even
// when the customer closes the tab before the checkout handler runs.
//  - Signature checked over the RAW body with RAZORPAY_WEBHOOK_SECRET.
//  - Settling is idempotent (row-locked in the DB), so Razorpay's retries and
//    the checkout handler racing us are both harmless.
//  - 2xx = handled (or deliberately ignored); 5xx = "retry me later".
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: RzpPayment } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id) return NextResponse.json({ ok: true, ignored: event.event ?? "unknown" });

  const admin = createAdminClient();
  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const r = await settleRazorpayPayment(admin, payment, "webhook");
      return NextResponse.json({ ok: true, outcome: r.outcome });
    }
    if (event.event === "payment.failed") {
      // Only a still-pending attempt is marked; the customer can retry in the
      // same Checkout, and a later success on this order still settles.
      await admin.from("payments")
        .update({
          provider_txn_id: null,
          failure_code: payment.error_code ?? "failed",
          failure_message: (payment.error_description ?? "").slice(0, 300),
        })
        .eq("merchant_order_id", payment.order_id)
        .eq("status", "pending");
      return NextResponse.json({ ok: true, outcome: "failure_recorded" });
    }
    return NextResponse.json({ ok: true, ignored: event.event });
  } catch (e) {
    console.error("[razorpay webhook]", event.event, payment.id, (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
