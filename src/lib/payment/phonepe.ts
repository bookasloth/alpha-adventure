import "server-only";
import { createHash, timingSafeEqual } from "crypto";

// PhonePe PG V2 Standard Checkout. OAuth (client credentials) -> hosted
// checkout -> server-side order status (source of truth). Enabled only when
// the client creds are set; otherwise the booking flow falls back to mock.
// Flow: getAuthToken (cached) -> phonePeInitiate (/checkout/v2/pay) -> redirect
// the browser to the hosted page -> on return, phonePeStatus confirms. A
// dashboard-configured webhook POSTs the same result as a backstop; its
// Authorization header is checked with verifyCallbackAuth.
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || "1";
const ENV = (process.env.PHONEPE_ENV || "sandbox").trim().toLowerCase();
const WEBHOOK_USER = process.env.PHONEPE_WEBHOOK_USERNAME;
const WEBHOOK_PASS = process.env.PHONEPE_WEBHOOK_PASSWORD;

// Sandbox serves token + PG from one host; production splits them (token on
// identity-manager, PG on pg). See PhonePe PG V2 docs.
const IS_PROD = ENV === "production" || ENV === "prod";
const PG_BASE = IS_PROD
  ? "https://api.phonepe.com/apis/pg"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox";
const TOKEN_URL = IS_PROD
  ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

export const REDIRECT_BASE = (process.env.PHONEPE_REDIRECT_BASE || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function isPhonePeEnabled(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

// ── OAuth. The access token is reused across requests on a warm instance until
// ~60s before it expires; serverless cold starts simply mint a fresh one.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAuthToken(): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.token;
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_version: CLIENT_VERSION,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({} as Record<string, unknown>));
    const token = typeof json?.access_token === "string" ? json.access_token : null;
    const expiresAt = Number(json?.expires_at);
    if (!res.ok || !token) {
      console.error("[phonepe] token failed:", res.status, JSON.stringify(json).slice(0, 300));
      return null;
    }
    cachedToken = { token, expiresAt: Number.isFinite(expiresAt) ? expiresAt : now + 3000 };
    return token;
  } catch (e) {
    console.error("[phonepe] token error:", (e as Error).message);
    return null;
  }
}

const authHeader = (token: string) => ({ Authorization: `O-Bearer ${token}` });

// Start a PG_CHECKOUT payment. Returns the hosted checkout URL to redirect to.
// `userId` is carried as metaInfo for reconciliation; `callbackUrl` is unused in
// PG V2 (the webhook URL is configured in the dashboard, not per-request).
export async function phonePeInitiate(opts: {
  merchantTransactionId: string;
  amountPaise: number;
  userId: string;
  redirectUrl: string;
  callbackUrl?: string;
}): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: "Payment could not be started." };
  const payload = {
    merchantOrderId: opts.merchantTransactionId,
    amount: opts.amountPaise,
    metaInfo: { udf1: opts.userId.slice(0, 256) },
    paymentFlow: {
      type: "PG_CHECKOUT",
      merchantUrls: { redirectUrl: opts.redirectUrl },
    },
  };
  try {
    const res = await fetch(`${PG_BASE}/checkout/v2/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({} as Record<string, unknown>));
    const url = typeof json?.redirectUrl === "string" ? json.redirectUrl : null;
    if (!res.ok || !url) {
      console.error("[phonepe] initiate failed:", res.status, JSON.stringify(json).slice(0, 300));
      return { ok: false, error: (json?.message as string) || "Payment could not be started." };
    }
    return { ok: true, redirectUrl: url };
  } catch (e) {
    console.error("[phonepe] initiate error:", (e as Error).message);
    return { ok: false, error: "Payment gateway unreachable." };
  }
}

// Server-side status check (source of truth — never trust the redirect alone).
// Returns the gateway-reported order `amount` (paise) so the caller can assert
// it matches the booking total before confirming (audit L1).
export async function phonePeStatus(merchantTransactionId: string): Promise<{ paid: boolean; providerTxnId: string | null; code: string; amount: number | null }> {
  const token = await getAuthToken();
  if (!token) return { paid: false, providerTxnId: null, code: "NO_TOKEN", amount: null };
  try {
    const res = await fetch(`${PG_BASE}/checkout/v2/order/${encodeURIComponent(merchantTransactionId)}/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({} as Record<string, unknown>));
    const state = typeof json?.state === "string" ? json.state : "UNKNOWN";
    const amt = Number(json?.amount);
    const txn = Array.isArray(json?.paymentDetails) ? json.paymentDetails[0]?.transactionId : null;
    return {
      paid: res.ok && state === "COMPLETED",
      providerTxnId: typeof txn === "string" ? txn : null,
      code: state,
      amount: Number.isFinite(amt) ? amt : null,
    };
  } catch (e) {
    console.error("[phonepe] status error:", (e as Error).message);
    return { paid: false, providerTxnId: null, code: "ERROR", amount: null };
  }
}

// Verify the Authorization header PhonePe sends on the server-to-server webhook
// (audit L2). PhonePe sets it to SHA256(username:password) using the username +
// password configured for the callback in the dashboard. We still re-query
// status (source of truth); this rejects forged/replayed POSTs cheaply.
// NOTE: the docs don't state whether the header is the bare hex hash or carries
// a scheme prefix — we strip a leading scheme token and compare the hex. Verify
// against a real callback once deployed.
export function verifyCallbackAuth(authorizationHeader: string | null): boolean {
  if (!authorizationHeader || !WEBHOOK_USER || !WEBHOOK_PASS) return false;
  const expected = createHash("sha256").update(`${WEBHOOK_USER}:${WEBHOOK_PASS}`).digest("hex").toLowerCase();
  const received = authorizationHeader.trim().split(/\s+/).pop()!.toLowerCase();
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
