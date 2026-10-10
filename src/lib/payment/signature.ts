import { createHmac, timingSafeEqual } from "crypto";

// Pure HMAC checks for Razorpay (secret passed in, so they're unit-testable).

function safeEqual(expected: string, given: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Checkout success handler: HMAC_SHA256(order_id + "|" + payment_id, key_secret).
export function checkoutSignatureValid(secret: string | undefined, orderId: string, paymentId: string, signature: string): boolean {
  if (!secret || !orderId || !paymentId || !signature) return false;
  return safeEqual(createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"), signature);
}

// Webhook: HMAC_SHA256(exact raw body bytes, webhook_secret). Never re-serialise.
export function webhookSignatureValid(secret: string | undefined, rawBody: string, signature: string | null): boolean {
  if (!secret || !signature) return false;
  return safeEqual(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}
