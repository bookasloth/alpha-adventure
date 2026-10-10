import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { BOOKING_EMAIL_COLS, bookingEmailOf, sendHoldExpiredEmail } from "@/lib/email";

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
  const notified = await notifyExpiredHolds(admin);
  return NextResponse.json({ ok: true, expiredPendingPayment: data ?? 0, holdEndedEmails: notified });
}

// "Your hold has ended" for bookings that reached the pay step (user_id set)
// and then expired, whether by this sweep or the opportunistic per-departure
// sweep (0018). Once-only via expiry_notice_sent_at (0024); the 3-day window
// keeps a long cron outage from emailing stale holds.
async function notifyExpiredHolds(admin: ReturnType<typeof createAdminClient>) {
  const since = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data, error } = await admin
    .from("bookings")
    .select(`${BOOKING_EMAIL_COLS},treks(slug)`)
    .eq("status", "expired")
    .not("user_id", "is", null)
    .not("contact_email", "is", null)
    .is("expiry_notice_sent_at", null)
    .gte("updated_at", since);
  if (error) {
    console.error("[cron] expired-hold lookup failed:", error.message);
    return { sent: 0, failed: 0 };
  }
  let sent = 0, failed = 0;
  for (const r of data ?? []) {
    const trek = Array.isArray(r.treks) ? r.treks[0] : r.treks;
    const mail = bookingEmailOf(r, { trekSlug: (trek as { slug?: string } | null)?.slug ?? null });
    if (!mail) continue;
    try {
      await sendHoldExpiredEmail(mail);
      await admin.from("bookings").update({ expiry_notice_sent_at: new Date().toISOString() }).eq("id", r.id);
      sent++;
    } catch (e) {
      failed++;
      console.error("[cron] hold-ended email failed for", r.reference, (e as Error).message);
    }
  }
  return { sent, failed };
}

export const GET = run;
export const POST = run;
