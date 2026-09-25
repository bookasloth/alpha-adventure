import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";

// Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
export function clientIp(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

// Fixed-window rate limit via the Postgres rate_limit_hit RPC. Returns true if
// allowed. FAIL-OPEN: on any error (e.g. migration not applied yet, DB blip) it
// allows the request and logs — a limiter must never lock out real users.
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("rate_limit_hit", { _key: key, _max: max, _window: windowSec });
    if (error) { console.warn("[rateLimit] rpc error, allowing:", error.message); return true; }
    return data !== false;
  } catch (e) {
    console.warn("[rateLimit] failed, allowing:", (e as Error).message);
    return true;
  }
}

// Convenience: limit by client IP under a named bucket.
export async function limitByIp(bucket: string, max: number, windowSec: number): Promise<boolean> {
  return rateLimit(`${bucket}:${clientIp()}`, max, windowSec);
}
