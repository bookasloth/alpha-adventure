import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

// Cleanup cron: expire stale bookings (abandoned drafts/pending_auth past their
// expiry, and pending_payment holds past 30 min — releasing their seats). Calls
// the DB's expire_stale_bookings(). Scheduled via vercel.json; Vercel sends
// `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is configured.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
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
