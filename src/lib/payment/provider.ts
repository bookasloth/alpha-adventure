import "server-only";
import { isPhonePeEnabled } from "./phonepe";

// Which gateway takes payments. One env var swaps it; no code change:
//   PAYMENT_PROVIDER=razorpay | phonepe | mock
// Unset keeps the previous behaviour (PhonePe if configured, else mock).
export type PaymentProvider = "mock" | "razorpay" | "phonepe";

export function paymentProvider(): PaymentProvider {
  const p = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (p === "razorpay" || p === "phonepe" || p === "mock") return p;
  return isPhonePeEnabled() ? "phonepe" : "mock";
}
