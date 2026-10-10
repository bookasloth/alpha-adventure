import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { BOOKING_EMAIL_COLS, bookingEmailOf, sendBookingReminderEmail, sendReviewRequestEmail, type BookingEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Daily lifecycle-email cron (vercel.json). Each email is sent once per booking
// and stamped only after a successful send, so a failure retries next run:
//   - pre-departure reminder  (reminder_sent_at, 0021) — departing within REMIND_DAYS
//   - "how was the trek?"     (review_request_sent_at, 0024) — trek ended in the last REVIEW_WINDOW days
// Auth mirrors expire-bookings: fail-closed in prod.
const REMIND_DAYS = 2;
const REVIEW_WINDOW = 7;

type Dep = { start_time: string | null; meeting_point: string | null; end_date: string | null } | null;
type Row = {
  id: string; reference: string; trek_title: string | null; departure_date: string | null;
  adults: number | null; children: number | null; grand_total: number | null; contact_email: string | null;
  trek_departures: Dep | Dep[];
};
const depOf = (r: Row): Dep => (Array.isArray(r.trek_departures) ? r.trek_departures[0] ?? null : r.trek_departures);
const SELECT = `${BOOKING_EMAIL_COLS},trek_departures(start_time,meeting_point,end_date)`;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[cron] CRON_SECRET unset — refusing to run.");
      return NextResponse.json({ ok: false, error: "cron not configured" }, { status: 500 });
    }
  } else {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  // IST calendar days. departure_date / end_date are plain dates.
  const istNow = Date.now() + 5.5 * 3600 * 1000;
  const day = (offset: number) => new Date(istNow + offset * 86400000).toISOString().slice(0, 10);
  const today = day(0);

  // Send each, stamp on success. Returns {sent, failed}.
  async function sendAndStamp(rows: Row[], column: string, build: (r: Row) => BookingEmail | null, sendFn: (b: BookingEmail) => Promise<void>) {
    let sent = 0, failed = 0;
    for (const r of rows) {
      const mail = build(r);
      if (!mail) continue;
      try {
        await sendFn(mail);
        await admin.from("bookings").update({ [column]: new Date().toISOString() }).eq("id", r.id);
        sent++;
      } catch (e) {
        failed++;
        console.error(`[cron] ${column} send failed for`, r.reference, (e as Error).message);
      }
    }
    return { sent, failed };
  }

  const [reminders, reviews] = await Promise.all([
    admin.from("bookings").select(SELECT)
      .eq("status", "confirmed").is("reminder_sent_at", null).not("contact_email", "is", null)
      .gte("departure_date", today).lte("departure_date", day(REMIND_DAYS)),
    // Start-date window is wide enough for multi-day treks; the end-date filter below is exact.
    admin.from("bookings").select(SELECT)
      .in("status", ["confirmed", "completed"]).is("review_request_sent_at", null).not("contact_email", "is", null)
      .gte("departure_date", day(-30)).lt("departure_date", today),
  ]);
  if (reminders.error || reviews.error) {
    const msg = (reminders.error ?? reviews.error)!.message;
    console.error("[cron] booking-reminders query failed:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const reminder = await sendAndStamp(
    (reminders.data ?? []) as Row[], "reminder_sent_at",
    (r) => bookingEmailOf(r, { startTime: depOf(r)?.start_time, meetingPoint: depOf(r)?.meeting_point }),
    sendBookingReminderEmail,
  );
  const ended = ((reviews.data ?? []) as Row[]).filter((r) => {
    const end = depOf(r)?.end_date ?? r.departure_date;
    return !!end && end < today && end >= day(-REVIEW_WINDOW);
  });
  const review = await sendAndStamp(ended, "review_request_sent_at", (r) => bookingEmailOf(r), sendReviewRequestEmail);

  return NextResponse.json({ ok: true, reminder, review });
}

export const GET = run;
export const POST = run;
