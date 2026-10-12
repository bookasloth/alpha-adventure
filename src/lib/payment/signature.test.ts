import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { checkoutSignatureValid, webhookSignatureValid } from "./signature";

const SECRET = "test_secret_123";
const sign = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("hex");

describe("Razorpay checkout signature", () => {
  const good = sign(SECRET, "order_A|pay_B");
  it("accepts a genuine signature", () => {
    expect(checkoutSignatureValid(SECRET, "order_A", "pay_B", good)).toBe(true);
  });
  it("rejects a swapped payment or order id (replaying one payment onto another order)", () => {
    expect(checkoutSignatureValid(SECRET, "order_A", "pay_OTHER", good)).toBe(false);
    expect(checkoutSignatureValid(SECRET, "order_OTHER", "pay_B", good)).toBe(false);
  });
  it("rejects a signature made with another secret, truncated, or empty", () => {
    expect(checkoutSignatureValid(SECRET, "order_A", "pay_B", sign("attacker", "order_A|pay_B"))).toBe(false);
    expect(checkoutSignatureValid(SECRET, "order_A", "pay_B", good.slice(0, 20))).toBe(false);
    expect(checkoutSignatureValid(SECRET, "order_A", "pay_B", "")).toBe(false);
  });
  it("fails closed when the secret isn't configured", () => {
    expect(checkoutSignatureValid(undefined, "order_A", "pay_B", good)).toBe(false);
  });
});

describe("Razorpay webhook signature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_B", amount: 539700 } } } });
  it("accepts the exact raw body", () => {
    expect(webhookSignatureValid(SECRET, body, sign(SECRET, body))).toBe(true);
  });
  it("rejects a tampered amount in the body", () => {
    expect(webhookSignatureValid(SECRET, body.replace("539700", "100"), sign(SECRET, body))).toBe(false);
  });
  it("rejects a missing header or missing secret", () => {
    expect(webhookSignatureValid(SECRET, body, null)).toBe(false);
    expect(webhookSignatureValid(undefined, body, sign(SECRET, body))).toBe(false);
  });
});
