import "server-only";
import { checkoutSignatureValid, webhookSignatureValid } from "./signature";

// Razorpay Standard Checkout, server side. Plain REST + HMAC (no SDK).
// Flow: createOrder (server, amount from DB) -> Checkout.js modal (browser) ->
// verifyPaymentSignature + fetchPayment (server re-checks with Razorpay) ->
// settle in one DB transaction. The webhook (payment.captured / order.paid)
// settles the same way if the browser never comes back.
// Test vs live is decided purely by which keys are set (rzp_test_ / rzp_live_).

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const API = "https://api.razorpay.com/v1";

export const razorpayKeyId = () => KEY_ID ?? "";
export const isRazorpayConfigured = () => Boolean(KEY_ID && KEY_SECRET);

export type RzpOrder = { id: string; amount: number; currency: string; status: string; receipt?: string };
export type RzpPayment = {
  id: string;
  order_id: string | null;
  amount: number; // paise
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string | null;
  captured: boolean;
  error_code?: string | null;
  error_description?: string | null;
};
export type RzpRefund = { id: string; amount: number; status: string };

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  if (!isRazorpayConfigured()) throw new Error("Razorpay is not configured.");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const desc = (json as { error?: { description?: string } })?.error?.description ?? res.statusText;
    throw new Error(`Razorpay ${res.status}: ${desc}`);
  }
  return json as T;
}

// Amount is always the server-side booking total (paise). receipt <= 40 chars.
export function createOrder(amount: number, receipt: string, notes: Record<string, string>) {
  return call<RzpOrder>("POST", "/orders", { amount, currency: "INR", receipt: receipt.slice(0, 40), notes });
}
export function fetchPayment(paymentId: string) {
  return call<RzpPayment>("GET", `/payments/${encodeURIComponent(paymentId)}`);
}
// Only needed if the account is set to manual capture; auto-capture is the default.
export function capturePayment(paymentId: string, amount: number) {
  return call<RzpPayment>("POST", `/payments/${encodeURIComponent(paymentId)}/capture`, { amount, currency: "INR" });
}
export function refundPayment(paymentId: string, amount: number, notes: Record<string, string>) {
  return call<RzpRefund>("POST", `/payments/${encodeURIComponent(paymentId)}/refund`, { amount, speed: "normal", notes });
}

// Checkout success handler signature (see signature.ts).
export const verifyPaymentSignature = (orderId: string, paymentId: string, signature: string) =>
  checkoutSignatureValid(KEY_SECRET, orderId, paymentId, signature);
// Webhook signature over the exact raw body.
export const verifyWebhookSignature = (rawBody: string, signature: string | null) =>
  webhookSignatureValid(WEBHOOK_SECRET, rawBody, signature);
