import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

// Cleanup cron: expire stale bookings (abandoned drafts/pending_auth past their
// expiry, and pending_payment holds past 30 min — releasing their seats). Calls
// the DB's expire_stale_bookings(). Scheduled via vercel.json; Vercel sends
// `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is configured.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail CLOSED: in production a missing CRON_SECRET is a misconfig, not an
  // open door. Vercel sends `Authorization: Bearer $CRON_SECRET` only when it's
  // set, so an unset secret makes the cron fail loudly until it's configured —
  // instead of leaving an unauthenticated state-mutating endpoint exposed.
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[cron] CRON_SECRET unset — refusing to run (set it in the host).");
      return NextResponse.json({ ok: false, error: "cron not configured" }, { status: 500 });
    }
    // dev/local: allow so the sweep is testable without a secret.
  } else {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("expire_stale_bookings");
  if (error) {
    console.error("[cron] expire_stale_bookings failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, expiredPendingPayment: data ?? 0 });
}

export const GET = run;
export const POST = run;
