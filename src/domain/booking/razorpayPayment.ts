import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createOrder, fetchPayment, capturePayment, refundPayment, razorpayKeyId, isRazorpayConfigured, type RzpPayment,
} from "@/lib/payment/razorpay";
import { sendBookingConfirmedEmail, sendPaymentRefundedEmail, sendRefundFailedAlert } from "@/lib/email";
import { background } from "@/lib/after";

// Razorpay booking payments. Money rules:
//  - the amount always comes from bookings.grand_total, never the browser
//  - a booking is confirmed only after Razorpay itself says the payment is
//    captured for exactly that amount (settle_gateway_payment, 0026)
//  - captured money that can't be used (hold expired, booking cancelled, paid
//    twice, wrong amount) is refunded automatically, never kept silently

type Admin = SupabaseClient;

export type CheckoutOrder = {
  keyId: string;
  orderId: string;
  amount: number;
  reference: string;
  trekTitle: string;
  email: string;
  name: string;
  secondsLeft: number; // until the seat hold expires; Checkout closes itself then
};

// Create a Razorpay order for a held booking + the matching pending payment row.
export async function startRazorpayCheckout(admin: Admin, bookingId: string): Promise<CheckoutOrder> {
  if (!isRazorpayConfigured()) throw new Error("Online payment is temporarily unavailable. Please try again shortly.");
  const { data: b } = await admin
    .from("bookings")
    .select("id,reference,status,grand_total,expires_at,trek_title,contact_email,contact_name")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b) throw new Error("Booking not found.");
  if (b.status === "confirmed") throw new Error("This booking is already paid.");
  if (b.status !== "pending_payment") throw new Error("This booking can no longer be paid. Please start a new booking.");
  const secondsLeft = b.expires_at ? Math.floor((new Date(b.expires_at).getTime() - Date.now()) / 1000) : 1800;
  if (secondsLeft < 60) throw new Error("Your seat hold has run out. Please start the booking again.");
  if (!b.grand_total || b.grand_total < 100) throw new Error("Invalid booking amount.");

  const order = await createOrder(b.grand_total, b.reference, { booking_id: b.id, reference: b.reference });
  const { error } = await admin.from("payments").insert({
    booking_id: b.id,
    provider: "razorpay",
    merchant_order_id: order.id,
    amount: b.grand_total,
    currency: "INR",
    status: "pending",
    idempotency_key: order.id,
    kind: "full",
  });
  if (error) throw new Error(`Payment record failed: ${error.message}`);
  return {
    keyId: razorpayKeyId(),
    orderId: order.id,
    amount: b.grand_total,
    reference: b.reference,
    trekTitle: b.trek_title ?? "Trek booking",
    email: b.contact_email ?? "",
    name: b.contact_name ?? "",
    secondsLeft,
  };
}

export type SettleResult =
  | { outcome: "confirmed" | "already_settled"; bookingId: string; reference: string | null }
  | { outcome: "refunded"; bookingId: string; reference: string | null; reason: string }
  | { outcome: "not_captured" | "not_found"; bookingId?: string; reference?: null };

// Settle a payment Razorpay reported (checkout handler or webhook). Safe to call
// twice at once: the DB function locks the payment row and only the first
// caller gets "confirmed" / "refund_required".
export async function settleRazorpayPayment(admin: Admin, paymentIn: RzpPayment, source: "checkout" | "webhook"): Promise<SettleResult> {
  let payment = paymentIn;
  if (!payment.order_id) return { outcome: "not_found" };
  // Manual-capture accounts: capture the exact amount we charged.
  if (payment.status === "authorized") {
    const { data: row } = await admin.from("payments").select("amount").eq("merchant_order_id", payment.order_id).maybeSingle();
    if (!row) return { outcome: "not_found" };
    payment = await capturePayment(payment.id, Number(row.amount));
  }
  if (payment.status !== "captured") return { outcome: "not_captured" };

  const { data, error } = await admin.rpc("settle_gateway_payment", {
    _order_id: payment.order_id,
    _txn_id: payment.id,
    _amount: payment.amount,
    _method: payment.method ?? "razorpay",
    _raw: { source, id: payment.id, order_id: payment.order_id, amount: payment.amount, method: payment.method, status: payment.status },
  });
  if (error) throw new Error(`Settle failed: ${error.message}`);
  const res = data as { outcome: string; booking_id?: string; payment_id?: string; booking_status?: string };
  if (res.outcome === "not_found") return { outcome: "not_found" };

  const { data: b } = await admin
    .from("bookings")
    .select("id,reference,trek_title,departure_date,adults,children,price_adult,price_child,addons_total,grand_total,contact_email")
    .eq("id", res.booking_id!)
    .single();
  const reference = b?.reference ?? null;

  if (res.outcome === "confirmed") {
    if (b?.contact_email) {
      background(sendBookingConfirmedEmail({
        to: b.contact_email, reference: b.reference, trekTitle: b.trek_title ?? "your trek",
        departureDate: b.departure_date, seats: (b.adults ?? 0) + (b.children ?? 0), total: b.grand_total,
        adults: b.adults, children: b.children, priceAdult: b.price_adult, priceChild: b.price_child, addonsTotal: b.addons_total,
      }));
    }
    return { outcome: "confirmed", bookingId: res.booking_id!, reference };
  }
  if (res.outcome === "already_settled") return { outcome: "already_settled", bookingId: res.booking_id!, reference };

  // refund_required | amount_mismatch: we hold money we can't use. Refund what was paid.
  const reason = res.outcome === "amount_mismatch" ? "amount_mismatch" : `booking_${res.booking_status ?? "unpayable"}`;
  await refundCaptured(admin, res.payment_id!, payment, reason);
  if (b?.contact_email) {
    background(sendPaymentRefundedEmail({
      to: b.contact_email, reference: b.reference, trekTitle: b.trek_title ?? "your trek",
      departureDate: b.departure_date, seats: (b.adults ?? 0) + (b.children ?? 0), total: payment.amount,
    }));
  }
  return { outcome: "refunded", bookingId: res.booking_id!, reference, reason };
}

async function refundCaptured(admin: Admin, paymentRowId: string, payment: RzpPayment, reason: string) {
  try {
    const refund = await refundPayment(payment.id, payment.amount, { reason });
    await admin.from("refunds").insert({
      payment_id: paymentRowId, amount: payment.amount, status: "processing", provider_refund_id: refund.id, reason,
    });
    await admin.from("payments").update({ status: "refunded" }).eq("id", paymentRowId);
  } catch (e) {
    // Money is still with us and a retry won't refund again (the payment is
    // already settled), so record it and alert the operator to refund by hand.
    console.error(`[razorpay] REFUND FAILED for ${payment.id} (${reason}):`, (e as Error).message);
    await admin.from("refunds").insert({ payment_id: paymentRowId, amount: payment.amount, status: "failed", reason: `${reason}; auto-refund failed` });
    background(sendRefundFailedAlert(payment.id, payment.amount, reason));
  }
}

// Checkout success handler: re-check everything with Razorpay before settling.
export async function verifyAndSettleCheckout(
  admin: Admin,
  bookingId: string,
  orderId: string,
  paymentId: string,
): Promise<SettleResult> {
  // The order must belong to this booking (blocks reusing another booking's payment).
  const { data: row } = await admin.from("payments").select("booking_id").eq("merchant_order_id", orderId).maybeSingle();
  if (!row || row.booking_id !== bookingId) return { outcome: "not_found" };
  const payment = await fetchPayment(paymentId);
  if (payment.order_id !== orderId) return { outcome: "not_found" };
  return settleRazorpayPayment(admin, payment, "checkout");
}
