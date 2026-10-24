// What the customer sees when they come back from PhonePe's hosted page without a
// confirmed payment (closed/cancelled/failed/still pending). Mirrors the Razorpay
// ondismiss / payment.failed copy so both gateways read the same. Shared by the
// booking flow (full/deposit) and /pay-balance (balance). Client-safe: no imports.
export type PaymentNotice = "failed" | "pending" | "error";

export function parseNotice(v: unknown): PaymentNotice | null {
  return v === "failed" || v === "pending" || v === "error" ? v : null;
}

export function noticeText(n: PaymentNotice, retry: "booking" | "balance"): string {
  if (n === "failed")
    return retry === "balance"
      ? "Payment window closed or the payment didn't go through, so you haven't been charged. Tap Pay balance to try again."
      : "Payment window closed or the payment didn't go through, so you haven't been charged. Pick your options below and pay again. Your earlier seat hold releases by itself within 30 minutes.";
  if (n === "pending")
    return "PhonePe hasn't confirmed your payment yet. Please don't pay again. If money was debited we'll confirm your booking by email shortly, otherwise your bank returns it in 5-7 working days.";
  return "We received your payment but couldn't apply it to this booking automatically. Please don't pay again. Our team will confirm it or refund you in full. Questions? Call +91 8180001597.";
}
