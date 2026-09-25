import "server-only";
import { createHash } from "crypto";

// PhonePe PG (legacy X-VERIFY) integration. Enabled only when env is set;
// otherwise the booking flow falls back to the mock path. Sandbox test creds
// (public): PHONEPE_MERCHANT_ID=PGTESTPAYUAT, a known salt, index 1, host
// https://api-preprod.phonepe.com/apis/pg-sandbox
const MID = process.env.PHONEPE_MERCHANT_ID;
const SALT = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
const HOST = (process.env.PHONEPE_HOST || "https://api-preprod.phonepe.com/apis/pg-sandbox").replace(/\/$/, "");
export const REDIRECT_BASE = (process.env.PHONEPE_REDIRECT_BASE || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function isPhonePeEnabled(): boolean {
  return Boolean(MID && SALT);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const xVerify = (payloadOrEmpty: string, path: string) => `${sha256(payloadOrEmpty + path + SALT)}###${SALT_INDEX}`;

// Start a PAY_PAGE payment. Returns the hosted checkout URL to redirect to.
export async function phonePeInitiate(opts: {
  merchantTransactionId: string;
  amountPaise: number;
  userId: string;
  redirectUrl: string;
  callbackUrl: string;
}): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  const payload = {
    merchantId: MID,
    merchantTransactionId: opts.merchantTransactionId,
    merchantUserId: opts.userId.slice(0, 36),
    amount: opts.amountPaise,
    redirectUrl: opts.redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl: opts.callbackUrl,
    paymentInstrument: { type: "PAY_PAGE" },
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  try {
    const res = await fetch(`${HOST}/pg/v1/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-VERIFY": xVerify(base64, "/pg/v1/pay") },
      body: JSON.stringify({ request: base64 }),
    });
    const json = await res.json().catch(() => ({}));
    const url = json?.data?.instrumentResponse?.redirectInfo?.url;
    if (!res.ok || !url) {
      console.error("[phonepe] initiate failed:", res.status, JSON.stringify(json).slice(0, 300));
      return { ok: false, error: json?.message || "Payment could not be started." };
    }
    return { ok: true, redirectUrl: url };
  } catch (e) {
    console.error("[phonepe] initiate error:", (e as Error).message);
    return { ok: false, error: "Payment gateway unreachable." };
  }
}

// Server-side status check (source of truth — never trust the redirect alone).
export async function phonePeStatus(merchantTransactionId: string): Promise<{ paid: boolean; providerTxnId: string | null; code: string }> {
  const path = `/pg/v1/status/${MID}/${merchantTransactionId}`;
  try {
    const res = await fetch(`${HOST}${path}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-VERIFY": xVerify("", path), "X-MERCHANT-ID": MID! },
    });
    const json = await res.json().catch(() => ({}));
    const code = json?.code || "UNKNOWN";
    return {
      paid: json?.success === true && code === "PAYMENT_SUCCESS",
      providerTxnId: json?.data?.transactionId ?? null,
      code,
    };
  } catch (e) {
    console.error("[phonepe] status error:", (e as Error).message);
    return { paid: false, providerTxnId: null, code: "ERROR" };
  }
}
