import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";

// Best-effort client IP from proxy headers. Prefer x-real-ip (Vercel sets it to
// the true client and sanitises inbound XFF), then the first x-forwarded-for hop.
// NOTE: off a trusted proxy, x-forwarded-for is client-spoofable — this is only
// sound behind Vercel/a proxy that overwrites these headers.
// Next 15: headers() is async.
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Fixed-window rate limit via the Postgres rate_limit_hit RPC. Returns true if
// allowed. On error (migration missing, DB blip) the behaviour is controlled by
// `failClosed`: default fail-OPEN (never lock out real users on a transient DB
// error — right for sign-in UX); fail-CLOSED for abuse-prone buckets (signup/
// reset/leads) where a brief outage is better than losing all throttling.
// A fail-open event is logged at error level so it is alertable, not silent.
export async function rateLimit(
  key: string,
  max: number,
  windowSec: number,
  opts?: { failClosed?: boolean },
): Promise<boolean> {
  const onError = (why: string): boolean => {
    if (opts?.failClosed) {
      console.error("[rateLimit] FAIL-CLOSED (blocking):", key, why);
      return false;
    }
    console.error("[rateLimit] FAIL-OPEN (allowing, throttling is OFF):", key, why);
    return true;
  };
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("rate_limit_hit", { _key: key, _max: max, _window: windowSec });
    if (error) return onError(error.message);
    return data !== false;
  } catch (e) {
    return onError((e as Error).message);
  }
}

// Convenience: limit by client IP under a named bucket.
export async function limitByIp(
  bucket: string,
  max: number,
  windowSec: number,
  opts?: { failClosed?: boolean },
): Promise<boolean> {
  return rateLimit(`${bucket}:${await clientIp()}`, max, windowSec, opts);
}
